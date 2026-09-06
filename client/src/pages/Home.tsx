import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAttractions, type Attraction } from '../api';
import { useApp } from '../store';
import Screen from '../components/Screen';
import CoverImage from '../components/CoverImage';

const AUTO_MS = 4000;
const SLIDE_MS = 400; // 与 CSS transition 时长一致，用于无缝回绕

export default function Home() {
  const { lang, t } = useApp();
  const navigate = useNavigate();
  const [list, setList] = useState<Attraction[]>([]);
  const [idx, setIdx] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAttractions(lang)
      .then((d) => {
        if (cancelled) return;
        setList(d);
        setIdx(0);
        setAnimate(true);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // 自动轮播：始终向前；hover / 触摸时暂停
  useEffect(() => {
    if (paused || list.length <= 1) return;
    const id = setInterval(() => setIdx((i) => i + 1), AUTO_MS);
    return () => clearInterval(id);
  }, [paused, list.length]);

  // 无缝单向回绕：走到末尾的「克隆片」后，瞬时跳回第一张（无动画），避免倒车
  useEffect(() => {
    if (list.length <= 1 || idx < list.length) return;
    const timer = setTimeout(() => {
      setAnimate(false);
      setIdx(0);
      requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    }, SLIDE_MS + 20);
    return () => clearTimeout(timer);
  }, [idx, list.length]);

  // 渲染列表：末尾追加一张首图克隆，实现「一直向前」的无限循环
  const slides = list.length > 1 ? [...list, list[0]] : list;

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  }
  function onTouchEnd(e: React.TouchEvent) {
    setPaused(false);
    if (touchStartX.current == null || list.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      const delta = dx < 0 ? 1 : -1; // 左滑下一张，右滑上一张
      setIdx((i) => {
        const n = i + delta;
        if (n > list.length) return 0;
        if (n < 0) return list.length - 1;
        return n;
      });
    }
    touchStartX.current = null;
  }

  return (
    <Screen
      title={t('appName')}
      nav
      right={
        <>
          <button className="icon-btn" onClick={() => navigate('/language')} aria-label={t('language.title')}>
            🌐
          </button>
          <button className="icon-btn" onClick={() => navigate('/settings')} aria-label={t('settings.title')}>
            ⚙️
          </button>
        </>
      }
    >
      {loading && <div className="placeholder">{t('common.loading')}</div>}

      {!loading && list.length > 0 && (
        <div
          className="carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="carousel-track"
            style={{
              transform: `translateX(-${idx * 100}%)`,
              transition: animate ? `transform ${SLIDE_MS}ms ease` : 'none',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {slides.map((a, i) => (
              <div
                key={`${a.slug}-${i}`}
                className="carousel-slide"
                onClick={() => navigate(`/tour/${a.slug}`)}
              >
                <CoverImage
                  src={a.image}
                  alt={a.name}
                  emoji={a.emoji}
                  accent={a.accent}
                  className="carousel-img"
                />
                <div className="carousel-overlay" />
                <div className="carousel-content">
                  <div className="hero-text">
                    <div className="hero-name">{a.name}</div>
                    <div className="hero-intro">{a.intro}</div>
                  </div>
                  <div className="hero-cta">▶ {t('common.listen')}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="carousel-dots">
            {list.map((a, i) => (
              <button
                key={a.slug}
                className={`carousel-dot${i === idx % list.length ? ' on' : ''}`}
                onClick={() => {
                  setAnimate(true);
                  setIdx(i);
                }}
                aria-label={`${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <>
          <h2 className="section-title">
            {t('home.title')}
            <span className="section-sub">{t('home.subtitle')}</span>
          </h2>
          <div className="attraction-list">
            {list.map((a) => (
              <div
                key={a.slug}
                className="attraction-card"
                onClick={() => navigate(`/tour/${a.slug}`)}
              >
                <CoverImage
                  src={a.image}
                  alt={a.name}
                  emoji={a.emoji}
                  accent={a.accent}
                  className="attraction-cover"
                />
                <div className="attraction-info">
                  <div className="attraction-name">{a.name}</div>
                  <div className="attraction-intro">{a.intro}</div>
                </div>
                <span className="attraction-arrow">›</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Screen>
  );
}
