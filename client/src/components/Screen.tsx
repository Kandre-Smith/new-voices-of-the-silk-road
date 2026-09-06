import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useApp } from '../store';
import BottomNav from './BottomNav';

interface ScreenProps {
  title?: string;
  back?: boolean;
  right?: ReactNode;
  nav?: boolean;
  children: ReactNode;
}

export default function Screen({ title, back, right, nav, children }: ScreenProps) {
  const { t } = useApp();
  const navigate = useNavigate();

  return (
    <div className="app">
      <header className="topbar">
        {back && (
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label={t('common.back')}>
            ←
          </button>
        )}
        <div className="title">{title ?? ''}</div>
        {right}
      </header>
      <main className={`app-main${nav ? '' : ' no-nav'}`}>{children}</main>
      {nav && <BottomNav />}
    </div>
  );
}
