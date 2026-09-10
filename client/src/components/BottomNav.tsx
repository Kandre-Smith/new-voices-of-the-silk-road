import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../store';

const TABS = [
  { to: '/', key: 'nav.attractions', ico: '🏛️' },
  { to: '/guide', key: 'nav.guide', ico: '🗺️' },
  { to: '/settings', key: 'nav.settings', ico: '⚙️' },
];

export default function BottomNav() {
  const { t } = useApp();
  const { pathname } = useLocation();

  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => {
        const active = tab.to === '/' ? pathname === '/' : pathname.startsWith(tab.to);
        return (
          <Link key={tab.to} to={tab.to} className={active ? 'active' : ''}>
            <span className="ico">{tab.ico}</span>
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
