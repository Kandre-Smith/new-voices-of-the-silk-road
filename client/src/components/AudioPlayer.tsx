import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { synthesizeTts, type AudioTrack, type VoiceGender } from '../api';
import { useApp } from '../store';
import { sentenceTimings, lineAtTime, tokenSpans, tokenIndexForFraction, formatTime } from '../lib/timing';
import CoverImage from './CoverImage';

/** 可选的播放速度（倍速） */
const RATES = [0.75, 1, 1.5, 2];

/** 暴露给父组件（字幕点击定位）的命令式句柄 */
export interface AudioPlayerHandle {
  seekToLine: (lineIndex: number) => void;
}

interface Props {
  track: AudioTrack;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  compact?: boolean;
  /** 字幕进度回调：当前句子下标 + 句内 token 下标（逐字高亮用） */
  onProgress?: (lineIndex: number, tokenIndex: number) => void;
}

interface Segment {
  url: string;
  text: string;
  duration: number; // 真实时长（元数据加载后更新）
}

type Mode = 'segments' | 'whole' | 'speech';

/**
 * 语音播放器：
 *   1) 逐句合成（每句一个音频，用真实句时长做逐字对齐）；
 *   2) 逐句失败则整段合成兜底（按句时长加权估算）；
 *   3) 兜底 Web Speech。
 * 合成期间 status=loading，不会误触 Web Speech，避免「男声变女声 / 无音频」。
 */
const AudioPlayer = forwardRef<AudioPlayerHandle, Props>(function AudioPlayer(
  { track, hasPrev, hasNext, onPrev, onNext, compact, onProgress },
  ref,
) {
  const { t } = useApp();
  const audioRef = useRef<HTMLAudioElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const pendingPlay = useRef(false);

  const [mode, setMode] = useState<Mode>('segments');
  const [status, setStatus] = useState<'loading' | 'audio' | 'speech'>('loading');
  const [segs, setSegs] = useState<Segment[]>([]);
  const [segIndex, setSegIndex] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [realWholeDuration, setRealWholeDuration] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [gender, setGender] = useState<VoiceGender>(() => {
    try {
      return localStorage.getItem('srv-voice') === 'male' ? 'male' : 'female';
    } catch {
      return 'female';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('srv-voice', gender);
    } catch {
      /* ignore */
    }
  }, [gender]);

  const [rate, setRate] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem('srv-rate'));
      return RATES.includes(v) ? v : 1;
    } catch {
      return 1;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('srv-rate', String(rate));
    } catch {
      /* ignore */
    }
  }, [rate]);

  const lines = track.transcript;

  function emit(line: number, token: number) {
    const li = Math.max(0, Math.min(lines.length - 1, line));
    onProgress?.(li, Math.max(0, token));
  }

  // 逐句真实时长（segments 模式）；整段模式用估算
  const totalSec = useMemo(() => {
    if (mode === 'segments' && segs.length > 0) {
      return segs.reduce((a, s) => a + s.duration, 0);
    }
    return realWholeDuration ?? track.duration;
  }, [mode, segs, realWholeDuration, track.duration]);

  const starts = useMemo(() => {
    if (mode === 'segments' && segs.length === lines.length) {
      const s: number[] = [0];
      for (let i = 1; i < segs.length; i++) s.push(s[i - 1] + segs[i - 1].duration);
      return s;
    }
    return sentenceTimings(lines, totalSec).starts;
  }, [mode, segs, lines, totalSec]);

  // 播放速度：应用到 <audio>（换 src 重载会复位 playbackRate，故依赖 currentSrc）
  useEffect(() => {
    const a = audioRef.current;
    if (a) a.playbackRate = rate;
  }, [rate, currentSrc]);

  // 切换音轨/性别时重置并解析音频来源
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setPlaying(false);
    setProgress(0);
    setSegs([]);
    setSegIndex(0);
    setCurrentSrc(null);
    setRealWholeDuration(null);
    emit(0, 0);
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();

    (async () => {
      // 1) 逐句合成（并行），全部成功则用逐句真实时长
      const results = await Promise.allSettled(lines.map((l) => synthesizeTts(l, track.language, gender)));
      if (cancelled) return;
      const urls = results.map((r) => (r.status === 'fulfilled' ? r.value : null));
      if (urls.every((u): u is string => !!u)) {
        const est = sentenceTimings(lines, track.duration);
        const next = lines.map((text, i) => ({
          url: urls[i] as string,
          text,
          duration: est.ends[i] - est.starts[i],
        }));
        setMode('segments');
        setSegs(next);
        setCurrentSrc(next[0].url);
        setStatus('audio');
        return;
      }

      // 2) 整段合成兜底
      const whole = await synthesizeTts(lines.join(' '), track.language, gender);
      if (cancelled) return;
      if (whole) {
        setMode('whole');
        setCurrentSrc(whole);
        setStatus('audio');
        return;
      }

      // 3) Web Speech 兜底
      setMode('speech');
      setStatus('speech');
    })();

    return () => {
      cancelled = true;
    };
  }, [track.id, gender]); // eslint-disable-line react-hooks/exhaustive-deps

  function stopSpeech() {
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }

  function speakFrom(start: number) {
    if (typeof speechSynthesis === 'undefined') return;
    stopSpeech();
    for (let i = start; i < lines.length; i++) {
      const u = new SpeechSynthesisUtterance(lines[i]);
      u.lang = track.language;
      u.volume = volume;
      u.rate = rate;
      u.onstart = () => {
        emit(i, 0);
        setPlaying(true);
        setProgress(sentenceTimings(lines, track.duration).starts[i] / track.duration);
      };
      u.onend = () => {
        if (i === lines.length - 1) {
          setPlaying(false);
          setProgress(1);
        }
      };
      speechSynthesis.speak(u);
    }
  }

  function playSeg(i: number, autoplay: boolean) {
    setSegIndex(i);
    pendingPlay.current = autoplay;
    setCurrentSrc(segs[i].url);
  }

  function toggle() {
    if (status === 'loading') return; // 合成中不响应，避免误触 Web Speech
    if (mode === 'speech') {
      const ss = typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
      if (ss && ss.speaking && !ss.paused) {
        ss.pause();
        setPlaying(false);
      } else if (ss && ss.paused) {
        ss.resume();
        setPlaying(true);
      } else {
        speakFrom(0);
      }
      return;
    }
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }

  /** 按进度比例 seek：定位到对应句子，从该句句首开始 */
  function seek(ratio: number) {
    const p = Math.min(1, Math.max(0, ratio));
    if (mode === 'speech') {
      const line = lineAtTime(p * track.duration, sentenceTimings(lines, track.duration));
      emit(line, 0);
      speakFrom(line);
      return;
    }
    if (mode === 'segments' && segs.length === lines.length) {
      const gt = p * totalSec;
      let target = segs.length - 1;
      for (let i = 0; i < segs.length; i++) {
        if (gt < starts[i] + segs[i].duration) {
          target = i;
          break;
        }
      }
      emit(target, 0);
      playSeg(target, true);
      return;
    }
    // 整段模式：按估算句边界 seek
    const a = audioRef.current;
    const t2 = sentenceTimings(lines, totalSec);
    const line = lineAtTime(p * totalSec, t2);
    emit(line, 0);
    if (a) a.currentTime = t2.starts[line];
  }

  /** 歌词点击定位：跳到第 index 句并立即播放（网易云歌词式） */
  function seekToLine(index: number) {
    if (status === 'loading') return; // 合成中无法定位
    const i = Math.max(0, Math.min(lines.length - 1, index));
    if (mode === 'speech') {
      emit(i, 0);
      speakFrom(i);
      return;
    }
    if (mode === 'segments' && segs.length === lines.length) {
      emit(i, 0);
      playSeg(i, true);
      setProgress(totalSec > 0 ? starts[i] / totalSec : 0);
      return;
    }
    // 整段模式：seek 到该句句首并播放
    const a = audioRef.current;
    const t2 = sentenceTimings(lines, totalSec);
    emit(i, 0);
    setProgress(totalSec > 0 ? t2.starts[i] / totalSec : 0);
    if (a) {
      a.currentTime = t2.starts[i];
      a.play().catch(() => {});
    }
  }

  // 用最新闭包暴露给父组件（避免 useImperativeHandle 捕获陈旧状态）
  const seekToLineRef = useRef(seekToLine);
  useEffect(() => {
    seekToLineRef.current = seekToLine;
  });
  useImperativeHandle(ref, () => ({ seekToLine: (i) => seekToLineRef.current(i) }), []);

  function onAudioTime() {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration) || a.duration === 0) return;
    if (draggingRef.current) return;
    const t = a.currentTime;
    if (mode === 'segments' && segs.length === lines.length) {
      const seg = segs[segIndex];
      const dur = seg.duration > 0 ? seg.duration : a.duration;
      const globalT = starts[segIndex] + t;
      setProgress(globalT / totalSec);
      const frac = dur > 0 ? Math.min(1, t / dur) : 0;
      emit(segIndex, tokenIndexForFraction(tokenSpans(seg.text), frac));
      return;
    }
    // 整段模式
    const p = t / a.duration;
    setProgress(p);
    const t2 = sentenceTimings(lines, a.duration);
    const line = lineAtTime(t, t2);
    const start = t2.starts[line];
    const end = t2.ends[line];
    const frac = end > start ? (t - start) / (end - start) : 0;
    emit(line, tokenIndexForFraction(tokenSpans(lines[line]), frac));
  }

  function updateDuration(a: HTMLAudioElement) {
    const d = a.duration;
    if (!isFinite(d) || d <= 0) return;
    if (mode === 'segments' && segs.length === lines.length) {
      setSegs((prev) => prev.map((s, idx) => (idx === segIndex ? { ...s, duration: d } : s)));
    } else {
      setRealWholeDuration(d);
    }
  }

  function onLoadedMetadata(e: React.SyntheticEvent<HTMLAudioElement>) {
    const a = e.currentTarget;
    a.playbackRate = rate;
    updateDuration(a);
    if (pendingPlay.current) {
      pendingPlay.current = false;
      a.play().catch(() => {});
    }
  }

  function ratioFromEvent(e: { clientX: number }): number {
    const el = barRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    if (r.width <= 0) return 0;
    return (e.clientX - r.left) / r.width;
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!barRef.current) return;
    draggingRef.current = true;
    barRef.current.setPointerCapture(e.pointerId);
    setProgress(ratioFromEvent(e));
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    setProgress(ratioFromEvent(e));
  }
  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    seek(ratioFromEvent(e));
  }

  const dots = useMemo(() => {
    const arr: { left: number; key: number }[] = [];
    for (let i = 1; i < lines.length; i++) {
      arr.push({ key: i, left: (starts[i] / totalSec) * 100 });
    }
    return arr;
  }, [lines.length, starts, totalSec]);

  return (
    <div className={`player${compact ? ' player--compact' : ''}`}>
      {!compact && (
        <div className="player-head">
          <CoverImage
            src={track.image}
            alt={track.title}
            emoji={track.emoji || '🎧'}
            accent={track.accent || '#b0813f'}
            className="player-head-img"
          />
          <div className="player-head-text">
            <div className="player-head-title">{track.title}</div>
            {track.intro && <div className="player-head-sub">{track.intro}</div>}
          </div>
        </div>
      )}

      <div
        className="progress"
        ref={barRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-label={t('common.progress')}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="progress-track" />
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        {dots.map((d) => (
          <span key={d.key} className="progress-dot" style={{ left: `${d.left}%` }} />
        ))}
        <div className="progress-knob" style={{ left: `${progress * 100}%` }} />
      </div>

      <div className="player-time">
        <span>{formatTime(progress * totalSec)}</span>
        <span>{formatTime(totalSec)}</span>
      </div>

      <div className="controls">
        <button className="icon-btn" onClick={onPrev} disabled={!hasPrev} aria-label={t('common.prev')}>
          ⏮
        </button>
        <button
          className="play-btn"
          onClick={toggle}
          disabled={status === 'loading'}
          aria-label={status === 'loading' ? t('common.loading') : playing ? t('common.pause') : t('common.play')}
        >
          {status === 'loading' ? '…' : playing ? '⏸' : '▶'}
        </button>
        <button className="icon-btn" onClick={onNext} disabled={!hasNext} aria-label={t('common.next')}>
          ⏭
        </button>
      </div>

      {!compact && (
        <div className="volume">
          <button
            className="voice-toggle"
            onClick={() => setGender((g) => (g === 'female' ? 'male' : 'female'))}
            aria-label={gender === 'female' ? t('common.voiceFemale') : t('common.voiceMale')}
          >
            <span aria-hidden>{gender === 'female' ? '👩' : '👨'}</span>
            {gender === 'female' ? t('common.voiceFemale') : t('common.voiceMale')}
          </button>
          <span aria-label={t('common.volume')}>🔊</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
          />
        </div>
      )}

      {!compact && (
        <div className="speed">
          <span className="speed-label">{t('common.speed')}</span>
          <div className="speed-options">
            {RATES.map((r) => (
              <button
                key={r}
                type="button"
                className={`speed-chip${r === rate ? ' on' : ''}`}
                onClick={() => setRate(r)}
                aria-pressed={r === rate}
              >
                {r}x
              </button>
            ))}
          </div>
        </div>
      )}

      {currentSrc && (
        <audio
          ref={audioRef}
          src={currentSrc}
          preload="auto"
          onTimeUpdate={onAudioTime}
          onLoadedMetadata={onLoadedMetadata}
          onDurationChange={(e) => updateDuration(e.currentTarget)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            if (mode === 'segments' && segIndex < segs.length - 1) {
              playSeg(segIndex + 1, true);
            } else {
              setPlaying(false);
              setProgress(1);
            }
          }}
        />
      )}
    </div>
  );
});

export default AudioPlayer;
