import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import Screen from '../components/Screen';

export default function Settings() {
  const { t } = useApp();
  const navigate = useNavigate();

  const items = [
    { to: '/settings/font', label: t('settings.font'), ico: '🔠' },
    { to: '/settings/feedback', label: t('settings.feedback'), ico: '💬' },
    { to: '/settings/about', label: t('settings.about'), ico: 'ℹ️' },
  ];

  return (
    <Screen title={t('settings.title')} back nav>
      <div className="page-pad">
        <div className="settings-list card">
          {items.map((it) => (
            <div key={it.to} className="row" onClick={() => navigate(it.to)}>
              <div className="row-ico" style={{ background: 'rgba(176,129,63,0.12)' }}>
                {it.ico}
              </div>
              <div style={{ flex: 1 }}>{it.label}</div>
              <span style={{ color: 'var(--ink-soft)' }}>›</span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
