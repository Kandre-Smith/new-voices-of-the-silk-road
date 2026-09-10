import { useEffect, useState } from 'react';
import Screen from '../components/Screen';
import { fetchFeedback, type FeedbackEntry } from '../api';

const PW_KEY = 'srv-admin-pw';

/** 后台反馈查看页（开发者专用，中文，不计入面向游客的 9 页面） */
export default function Admin() {
  const [pw, setPw] = useState(() => sessionStorage.getItem(PW_KEY) || '');
  const [list, setList] = useState<FeedbackEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load(password: string) {
    setLoading(true);
    setError('');
    try {
      const data = await fetchFeedback(password);
      setList(data);
      sessionStorage.setItem(PW_KEY, password);
    } catch {
      setError('密码错误或加载失败，请重试');
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
    setError('');
  }

  return (
    <Screen title="反馈管理" back>
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
            <div className="admin-login-title">后台访问密码</div>
            <input
              name="pw"
              type="password"
              autoFocus
              className="admin-input"
              placeholder="请输入后台密码"
            />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? '验证中…' : '进入后台'}
            </button>
            {error && <div className="form-msg err">{error}</div>}
          </form>
        ) : (
          <>
            <div className="admin-bar">
              <button className="btn btn-ghost" onClick={() => load(pw)} disabled={loading}>
                {loading ? '加载中…' : '刷新'}
              </button>
              <button className="btn btn-ghost" onClick={logout}>
                退出
              </button>
            </div>
            {error && <div className="form-msg err">{error}</div>}
            {!loading && list && list.length === 0 && <div className="placeholder">暂无反馈</div>}
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
                        <img src={src} alt="反馈图片" loading="lazy" />
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
