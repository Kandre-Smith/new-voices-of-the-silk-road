import { useApp } from '../store';
import Screen from '../components/Screen';

export default function FontSize() {
  const { t, fontScale, adjustFont, resetFont } = useApp();

  return (
    <Screen title={t('font.title')} back>
      <div className="page-pad">
        <div className="font-preview card">
          <div className="tip-label">{t('font.previewLabel')}</div>
          <div className="font-preview-text">{t('font.previewText')}</div>
        </div>

        <div className="font-controls">
          <button className="btn btn-ghost" onClick={() => adjustFont(-0.1)} aria-label={t('font.smaller')}>
            −
          </button>
          <div className="font-scale">{Math.round(fontScale * 100)}%</div>
          <button className="btn btn-ghost" onClick={() => adjustFont(0.1)} aria-label={t('font.larger')}>
            ＋
          </button>
        </div>

        <button className="btn btn-ghost font-reset" onClick={resetFont}>
          {t('font.reset')}
        </button>
      </div>
    </Screen>
  );
}
