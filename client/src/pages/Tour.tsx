import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchAttractions, fetchTracks, type Attraction, type AudioTrack } from '../api';
import { useApp } from '../store';
import Screen from '../components/Screen';
import AudioPlayer, { type AudioPlayerHandle } from '../components/AudioPlayer';
import CoverImage from '../components/CoverImage';
import Ticketing from '../components/Ticketing';
import PagodaTicket from '../components/PagodaTicket';
import { tokenSpans } from '../lib/timing';

/** 渲染单句字幕：非当前句直接返回原文；当前句按 token 切分并高亮当前 token（逐字） */
function renderLine(line: string, active: boolean, activeToken: number): ReactNode {
  if (!active) return line;
  const spans = tokenSpans(line);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  spans.forEach((sp, k) => {
    if (sp.start > cursor) nodes.push(line.slice(cursor, sp.start));
    nodes.push(
      <span key={sp.start} className={`subtitle-token${k === activeToken ? ' on' : ''}`}>
        {sp.text}
      </span>,
    );
    cursor = sp.end;
  });
  if (cursor < line.length) nodes.push(line.slice(cursor));
  return nodes;
}

export default function Tour() {
  const { slug, spot } = useParams();
  const { lang, t } = useApp();
  const navigate = useNavigate();

  const [list, setList] = useState<Attraction[]>([]);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLine, setActiveLine] = useState(0);
  const [activeToken, setActiveToken] = useState(0);
  const activeRef = useRef<HTMLButtonElement>(null);
  const playerRef = useRef<AudioPlayerHandle>(null);

  // 加载景点列表
  useEffect(() => {
    let cancelled = false;
    fetchAttractions(lang)
      .then((d) => {
        if (!cancelled) setList(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // 构建全部景点的「主景点 + 子景点」扁平播放列表（有序）
  useEffect(() => {
    if (list.length === 0) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(list.map((a) => fetchTracks(a.slug, lang)))
      .then((groups) => {
        if (cancelled) return;
        setPlaylist(groups.flat());
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [list, lang]);

  const effectiveSlug = slug ?? list[0]?.slug;
  const attraction = list.find((a) => a.slug === effectiveSlug);

  // 当前景点的主 + 子景点音轨
  const attractionTracks = useMemo(
    () => playlist.filter((t) => t.attractionId === attraction?.id),
    [playlist, attraction],
  );

  // 当前音轨：按 spot 参数定位，缺省为主景点
  const currentTrack = useMemo(() => {
    const wanted = spot ?? null;
    return attractionTracks.find((t) => (t.spotSlug ?? null) === wanted) ?? attractionTracks[0] ?? null;
  }, [attractionTracks, spot]);

  const flatIndex = currentTrack ? playlist.indexOf(currentTrack) : -1;
  const hasPrev = flatIndex > 0;
  const hasNext = flatIndex >= 0 && flatIndex < playlist.length - 1;

  const goToTrack = (t: AudioTrack) => {
    navigate(`/tour/${t.attractionId}${t.spotSlug ? '/' + t.spotSlug : ''}`);
  };

  // 上/下一曲：优先遍历当前景点子景点，跨景点则进入相邻景点
  const go = (delta: number) => {
    const next = playlist[flatIndex + delta];
    if (next) goToTrack(next);
  };

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeLine]);

  return (
    <Screen
      title={attraction?.name ?? t('nav.audio')}
      nav
      right={
        effectiveSlug ? (
          <button className="icon-btn" onClick={() => navigate(`/tips/${effectiveSlug}`)} aria-label={t('tips.title')}>
            💡
          </button>
        ) : undefined
      }
    >
      {loading && <div className="placeholder">{t('common.loading')}</div>}

      {!loading && attraction && currentTrack && (
        <>
          {/* 讲解点位：图片 + 名称 + 一句配文，横向滚动（最上） */}
          <div className="spot-switcher">
            <div className="spot-switcher-label">{t('tour.spots')}</div>
            <div className="spot-cards">
              {attractionTracks.map((trk) => (
                <button
                  key={trk.id}
                  className={`spot-card${trk.id === currentTrack.id ? ' active' : ''}`}
                  onClick={() => goToTrack(trk)}
                >
                  <CoverImage
                    src={trk.image}
                    alt={trk.title}
                    emoji={trk.emoji}
                    accent={trk.accent}
                    className="spot-card-img"
                  />
                  <span className="spot-card-name">{trk.kind === 'main' ? t('tour.mainSpot') : trk.title}</span>
                  {trk.intro && <span className="spot-card-cap">{trk.intro}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 字幕：逐句 + 逐字高亮（中间） */}
          <div className="subtitle-box">
            <div className="subtitle-label">{currentTrack.title}</div>
            <div className="subtitle-scroll">
              {currentTrack.transcript.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  ref={i === activeLine ? activeRef : undefined}
                  className={`subtitle-line${i === activeLine ? ' active' : ''}`}
                  onClick={() => playerRef.current?.seekToLine(i)}
                >
                  <span className="subtitle-dot" />
                  <span className="subtitle-text">{renderLine(line, i === activeLine, activeToken)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 播放器（最下） */}
          <AudioPlayer
            ref={playerRef}
            track={currentTrack}
            hasPrev={hasPrev}
            hasNext={hasNext}
            onPrev={() => go(-1)}
            onNext={() => go(1)}
            onProgress={(line, token) => {
              setActiveLine(line);
              setActiveToken(token);
            }}
          />

          {/* 购票预约信息（仅兵马俑，静态展示） */}
          {attraction.slug === 'terracotta-army' && <Ticketing />}
          {/* 大雁塔门票信息（仅大雁塔，静态展示） */}
          {attraction.slug === 'big-wild-goose-pagoda' && <PagodaTicket />}
        </>
      )}

      {!loading && !attraction && <div className="placeholder">{t('common.loading')}</div>}
    </Screen>
  );
}
