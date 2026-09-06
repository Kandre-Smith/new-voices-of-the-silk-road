import { useState } from 'react';
import { useApp } from '../store';
import Screen from '../components/Screen';

export default function About() {
  const { t } = useApp();
  const [open, setOpen] = useState<string | null>(null);

  const items = [
    { key: 'bg', label: t('about.bg'), detail: t('about.detail.bg') },
    { key: 'team', label: t('about.team'), detail: t('about.detail.team') },
    { key: 'purpose', label: t('about.purpose'), detail: t('about.detail.purpose') },
  ];

  return (
    <Screen title={t('about.title')} back>
      <div className="page-pad">
        <div className="about-logo">
          <img className="about-logo-img" src="/logo.png" alt={t('appName')} />
          <div className="about-logo-name">{t('appName')}</div>
          <div className="about-logo-tag">{t('tagline')}</div>
        </div>

        <div className="settings-list card">
          {items.map((it) => (
            <div key={it.key} className="about-item" onClick={() => setOpen(open === it.key ? null : it.key)}>
              <div className="about-item-head">
                <span>{it.label}</span>
                <span style={{ color: 'var(--ink-soft)' }}>{open === it.key ? '▾' : '›'}</span>
              </div>
              {open === it.key && <div className="about-item-detail">{it.detail}</div>}
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
