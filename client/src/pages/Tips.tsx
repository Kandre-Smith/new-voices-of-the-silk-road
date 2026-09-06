import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTips, type Tips as TipsData } from '../api';
import { useApp } from '../store';
import Screen from '../components/Screen';
import TicketEntry from '../components/TicketEntry';

export default function Tips() {
  const { slug } = useParams();
  const { lang, t } = useApp();
  const [tips, setTips] = useState<TipsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    fetchTips(slug, lang)
      .then((d) => {
        if (!cancelled) {
          setTips(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, lang]);

  const rows: { key: string; value: string }[] = tips
    ? [
        { key: 'tips.openHours', value: tips.openHours },
        { key: 'tips.ticketPrice', value: tips.ticketPrice },
        { key: 'tips.suggestedDuration', value: tips.suggestedDuration },
        { key: 'tips.transport', value: tips.transport },
        { key: 'tips.visitingTips', value: tips.tips },
      ]
    : [];

  return (
    <Screen title={`${t('tips.title')}`} back>
      {loading && <div className="placeholder">{t('common.loading')}</div>}
      {!loading && tips && (
        <div className="page-pad">
          <div className="tips-name">{tips.attractionName}</div>
          {slug === 'terracotta-army' && <TicketEntry slug={slug} />}
          <div className="tip-list">
            {rows.map((r) => (
              <div key={r.key} className="tip-block">
                <div className="tip-label">{t(r.key)}</div>
                <div className="tip-value">{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Screen>
  );
}
