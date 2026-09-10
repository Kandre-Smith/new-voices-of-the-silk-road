import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import messages from './i18n/messages.json';

export type Lang = 'zh-CN' | 'ms-MY' | 'en-US';
export const LANGS: Lang[] = ['zh-CN', 'ms-MY', 'en-US'];

type Dict = Record<string, string>;
type Messages = Record<Lang, Dict>;

const MESSAGES = messages as unknown as Messages;

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  fontScale: number;
  adjustFont: (delta: number) => void;
  resetFont: () => void;
}

const AppContext = createContext<AppState | null>(null);

const FONT_MIN = 0.8;
const FONT_MAX = 1.5;

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => readStored<Lang>('srv-lang', 'ms-MY'));
  const [fontScale, setFontScale] = useState<number>(() => readStored<number>('srv-font', 1));

  useEffect(() => {
    localStorage.setItem('srv-lang', JSON.stringify(lang));
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('srv-font', JSON.stringify(fontScale));
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontScale]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);

  const t = useCallback((key: string) => MESSAGES[lang][key] ?? key, [lang]);

  const adjustFont = useCallback((delta: number) => {
    setFontScale((s) => Math.min(FONT_MAX, Math.max(FONT_MIN, +(s + delta).toFixed(2))));
  }, []);

  const resetFont = useCallback(() => setFontScale(1), []);

  const value = useMemo(
    () => ({ lang, setLang, t, fontScale, adjustFont, resetFont }),
    [lang, setLang, t, fontScale, adjustFont, resetFont],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
