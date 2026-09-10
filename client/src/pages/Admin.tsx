import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import { fetchFeedback, type FeedbackEntry } from '../api';
import { useApp } from '../store';

const PW_KEY = 'srv-admin-pw';

/** 后台反馈查看页（开发者专用，跟随应用三语切换） */
export default function Admin() {
  const { t } = useApp();
  const navigate = useNavigate();
  const [pw, setPw] = useState(() => sessionStorage.getItem(PW_KEY) || '');
  const [list, setList] = useState<FeedbackEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function load(password: string) {
    setLoading(true);
    setFailed(false);
    try {
      const data = await fetchFeedback(password);
      setList(data);
      sessionStorage.setItem(PW_KEY, password);
    } catch {
      setFailed(true);
      setList(null);
      setPw('');
      sessionStorage.removeItem(PW_KEY);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pw) load(pw);
    // 仅在首次进入时自动加载一次
  }, []);

  function logout() {
    sessionStorage.removeItem(PW_KEY);
    setPw('');
    setList(null);
    setFailed(false);
  }

  return (
    <Screen
      title={t('admin.title')}
      back
      right={
        <button className="icon-btn" onClick={() => navigate('/language')} aria-label={t('language.title')}>
          🌐
        </button>
      }
    >
      <div className="page-pad">
        {!pw ? (
          <form
            className="card admin-login"
            onSubmit={(e) => {
              e.preventDefault();
              const v = new FormData(e.currentTarget).get('pw') as string;
              if (!v.trim()) return;
              setPw(v.trim());
              load(v.trim());
            }}
          >
            <div className="admin-login-title">{t('admin.password')}</div>
            <input
              name="pw"
              type="password"
              autoFocus
              className="admin-input"
              placeholder={t('admin.passwordPlaceholder')}
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? t('admin.verifying') : t('admin.enter')}
            </button>
            {failed && <div className="form-msg err">{t('admin.error')}</div>}
          </form>
        ) : (
          <>
            <div className="admin-bar">
              <button className="btn btn-ghost" onClick={() => load(pw)} disabled={loading}>
                {loading ? t('common.loading') : t('admin.refresh')}
              </button>
              <button className="btn btn-ghost" onClick={logout}>
                {t('admin.logout')}
              </button>
            </div>
            {failed && <div className="form-msg err">{t('admin.error')}</div>}
            {!loading && list && list.length === 0 && <div className="placeholder">{t('admin.empty')}</div>}
            {list?.map((f) => (
              <div key={f.id} className="card admin-feedback">
                <div className="admin-feedback-meta">
                  <span className="admin-lang">{f.lang}</span>
                  <span className="admin-time">{new Date(f.createdAt).toLocaleString()}</span>
                </div>
                <div className="admin-feedback-text">{f.text}</div>
                {f.images.length > 0 && (
                  <div className="admin-feedback-imgs">
                    {f.images.map((src) => (
                      <a key={src} href={src} target="_blank" rel="noreferrer">
                        <img src={src} alt={t('admin.imageAlt')} loading="lazy" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </Screen>
  );
}
