import { useApp } from '../store';
import Screen from '../components/Screen';

/**
 * 关于我们：按《关于我们【中文版】.docx》重写。
 * 结构：品牌区 → 项目背景（是什么 / 为什么做）→ 团队 → 项目目的（使命 / 下一步）。
 */
export default function About() {
  const { t } = useApp();

  return (
    <Screen title={t('about.title')} back>
      <div className="page-pad about-page">
        {/* 品牌区 */}
        <div className="about-logo">
          <img className="about-logo-img" src="/logo.png" alt={t('appName')} />
          <div className="about-logo-name">{t('appName')}</div>
          <div className="about-logo-tag">{t('tagline')}</div>
        </div>

        {/* 项目背景 */}
        <section className="about-section card">
          <h2 className="about-section-title">{t('about.bg')}</h2>
          <h3 className="about-subtitle">{t('about.what.title')}</h3>
          <p>{t('about.what.p1')}</p>
          <p>{t('about.what.p2')}</p>
          <h3 className="about-subtitle">{t('about.why.title')}</h3>
          <p>{t('about.why.p1')}</p>
          <p>{t('about.why.p2')}</p>
          <p>{t('about.why.p3')}</p>
          <p>{t('about.why.p4')}</p>
        </section>

        {/* 团队 */}
        <section className="about-section card">
          <h2 className="about-section-title">{t('about.team')}</h2>
          <p>{t('about.team.p1')}</p>
          <p>{t('about.team.p2')}</p>
        </section>

        {/* 项目目的 */}
        <section className="about-section card">
          <h2 className="about-section-title">{t('about.purpose')}</h2>
          <div className="about-mission">
            <h3 className="about-subtitle">{t('about.purpose.title')}</h3>
            <p className="about-mission-line">{t('about.purpose.p1')}</p>
            <p>{t('about.purpose.p2')}</p>
          </div>
          <h3 className="about-subtitle">{t('about.next.title')}</h3>
          <p>{t('about.next.p1')}</p>
          <p className="about-footnote">{t('about.next.p2')}</p>
        </section>
      </div>
    </Screen>
  );
}
