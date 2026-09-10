import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAttractions, fetchTracks, type Attraction, type AudioTrack } from '../api';
import { useApp } from '../store';
import { findRoute, MODE_ICON } from '../lib/routes';
import Screen from '../components/Screen';
import MapCanvas from '../components/MapCanvas';
import AudioPlayer from '../components/AudioPlayer';

export default function Guide() {
  const { lang, t } = useApp();
  const navigate = useNavigate();
  const [list, setList] = useState<Attraction[]>([]);
  const [selected, setSelected] = useState<string | undefined>();
  const [routeFrom, setRouteFrom] = useState<string | null>(null);
  const [routeTo, setRouteTo] = useState<string | null>(null);
  const [track, setTrack] = useState<AudioTrack | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAttractions(lang)
      .then((d) => {
        if (cancelled) return;
        setList(d);
        if (d.length > 0) setSelected((s) => s ?? d[0].slug);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    fetchTracks(selected, lang)
      .then((tracks) => {
        if (!cancelled) setTrack(tracks[0] ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selected, lang]);

  // 点击标记：首次点设为起点，再次点设为终点；已有完整路线时重新开始
  function handleSelect(slug: string) {
    setSelected(slug);
    if (!routeFrom || routeFrom === slug) {
      setRouteFrom(slug);
      setRouteTo(null);
    } else if (!routeTo) {
      setRouteTo(slug);
    } else {
      setRouteFrom(slug);
      setRouteTo(null);
    }
  }

  const current = list.find((a) => a.slug === selected);
  const fromName = list.find((a) => a.slug === routeFrom)?.name;
  const toName = list.find((a) => a.slug === routeTo)?.name;
  const route = routeFrom && routeTo ? findRoute(routeFrom, routeTo) : null;

  return (
    <Screen
      title={t('guide.title')}
      nav
    >
      <div className="page-pad">
        <div className="guide-hint">{t('guide.hint')}</div>
        <MapCanvas
          attractions={list}
          selectedSlug={selected}
          routeFrom={routeFrom ?? undefined}
          routeTo={routeTo ?? undefined}
          onSelect={handleSelect}
        />

        {/* 路线规划结果 */}
        {route && fromName && toName && (
          <div className="route-panel card">
            <div className="route-head">
              <div className="route-title">
                {t('guide.routeTitle')} · {fromName} → {toName}
              </div>
              <button className="route-reset" onClick={() => { setRouteFrom(null); setRouteTo(null); }}>
                {t('guide.routeReset')}
              </button>
            </div>
            {route.options.map((opt) => (
              <div key={opt.id} className="route-option">
                <div className="route-option-head">
                  <span className="route-option-icon">{MODE_ICON[opt.mode]}</span>
                  <span className="route-option-title">{opt.title[lang]}</span>
                  <span className="route-option-meta">{opt.meta[lang]}</span>
                </div>
                <ol className="route-steps">
                  {opt.steps.map((s, i) => (
                    <li key={i} className="route-step">
                      <span className="route-step-icon">{MODE_ICON[s.mode]}</span>
                      <span>{s.text[lang]}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}

        {current && track && (
          <div className="guide-card card">
            <div className="guide-card-head">
              <span className="guide-card-emoji">{current.emoji}</span>
              <div>
                <div className="guide-card-name">{current.name}</div>
                <div className="guide-card-intro">{current.intro}</div>
              </div>
            </div>
            <AudioPlayer
              track={track}
              hasPrev={false}
              hasNext={false}
              onPrev={() => {}}
              onNext={() => {}}
              compact
            />
            <button className="guide-open" onClick={() => navigate(`/tour/${current.slug}`)}>
              ▶ {t('common.listen')}
            </button>
          </div>
        )}
      </div>
    </Screen>
  );
}
