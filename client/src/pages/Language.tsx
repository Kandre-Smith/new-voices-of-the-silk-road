import { useApp, type Lang } from '../store';
import Screen from '../components/Screen';

const OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: 'ms-MY', label: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'en-US', label: 'English', flag: '🇬🇧' },
];

export default function Language() {
  const { lang, setLang, t } = useApp();

  return (
    <Screen title={t('language.title')} back>
      <div className="page-pad">
        <div className="section-sub standalone">{t('language.subtitle')}</div>
        <div className="lang-list card">
          {OPTIONS.map((o) => (
            <button
              key={o.code}
              className={`lang-option${lang === o.code ? ' active' : ''}`}
              onClick={() => setLang(o.code)}
            >
              <span className="lang-flag">{o.flag}</span>
              <span className="lang-label">{o.label}</span>
              <span className="lang-radio">{lang === o.code ? '●' : '○'}</span>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}
