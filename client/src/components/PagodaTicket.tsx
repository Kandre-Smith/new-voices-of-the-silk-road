import { useState } from 'react';
import { useApp } from '../store';
import { useToast } from './Modal';
import { PAGODA_WEB_URL, PAGODA_MINI_USERNAME, PAGODA_MINI_PATH, PAGODA_MINI_LINK } from '../lib/pagodaTicket';

/**
 * 大雁塔门票信息展示模块。
 * 仅信息展示：不实现选票、数量加减、模拟订单、提交订单等表单逻辑；
 * 所有购票操作跳转官方渠道，本网页不承接购票业务。
 */

const POLICIES = [
  { title: 'pagoda.policy.1.title', body: 'pagoda.policy.1.body' },
  { title: 'pagoda.policy.2.title', body: 'pagoda.policy.2.body' },
  { title: 'pagoda.policy.3.title', body: 'pagoda.policy.3.body' },
  { title: 'pagoda.policy.4.title', body: 'pagoda.policy.4.body' },
  { title: 'pagoda.policy.5.title', body: 'pagoda.policy.5.body' },
];

/** 是否微信内置浏览器环境 */
function isWeChat(): boolean {
  return typeof navigator !== 'undefined' && /MicroMessenger/i.test(navigator.userAgent);
}

/** 复制文本到剪贴板（优先异步 API，失败回退 execCommand，兼容 http 局域网环境） */
function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

export default function PagodaTicket() {
  const { t } = useApp();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [toast, showToast] = useToast();

  const handleBuy = async () => {
    // 普通浏览器且有官方网页地址 → 跳转网页购票
    if (!isWeChat() && PAGODA_WEB_URL) {
      window.open(PAGODA_WEB_URL, '_blank', 'noopener');
      return;
    }
    // 微信环境（未配置小程序原始ID）或无网页地址 → 复制小程序口令，到微信打开
    const ok = await copyText(PAGODA_MINI_LINK);
    showToast(ok ? t('pagoda.miniCopy') : PAGODA_MINI_LINK);
  };

  // 微信环境：用 wx-open-launch-weapp 开放标签唤起官方购票小程序。
  // 需先引入微信 JS-SDK（jweixin-1.6.0.js）并调用 wx.config（appId/签名由后端提供），
  // 此处按官方结构渲染标签；username 为小程序原始ID、path 为小程序页面路径。
  const wechatTagHtml = `
    <wx-open-launch-weapp username="${PAGODA_MINI_USERNAME}" path="${PAGODA_MINI_PATH}">
      <script type="text/wxtag-template">
        <style>
          .pagoda-buy{display:flex;align-items:center;justify-content:center;height:48px;border-radius:24px;background:#1989fa;color:#fff;font-size:16px;font-weight:600;}
        </style>
        <div class="pagoda-buy">${t('pagoda.buy')}</div>
      </script>
    </wx-open-launch-weapp>
  `;

  return (
    <div className="pagoda">
      {/* 顶部温馨提示 */}
      <div className="ticket-noticebar">{t('pagoda.notice')}</div>

      {/* 外籍游客提示 */}
      <div className="ticket-foreign">{t('pagoda.foreign')}</div>

      {/* 标题 */}
      <div className="pagoda-title">{t('pagoda.title')}</div>

      {/* 票价公示 */}
      <div className="pagoda-card">
        <div className="pagoda-card-title">{t('pagoda.fareTitle')}</div>
        <div className="pagoda-rows">
          <div className="pagoda-row">{t('pagoda.seasonLow')}</div>
          <div className="pagoda-row">{t('pagoda.seasonHigh')}</div>
          <div className="pagoda-row pagoda-row--strong">{t('pagoda.fareHigh')}</div>
          <div className="pagoda-row pagoda-row--strong">{t('pagoda.fareLow')}</div>
          <div className="pagoda-row">{t('pagoda.studentFare')}</div>
        </div>
      </div>

      {/* 运营时间 */}
      <div className="pagoda-card">
        <div className="pagoda-card-title">{t('pagoda.hoursTitle')}</div>
        <div className="pagoda-rows">
          <div className="pagoda-row">{t('pagoda.ticketTime')}</div>
          <div className="pagoda-row">{t('pagoda.clearTime')}</div>
        </div>
      </div>

      {/* 门票减免优惠政策（折叠面板，默认收起） */}
      <div className="pagoda-card">
        <div className="pagoda-card-title">{t('pagoda.policyTitle')}</div>
        {POLICIES.map((p, i) => (
          <div key={p.title} className="pagoda-policy">
            <button
              type="button"
              className="pagoda-policy-head"
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <span className="pagoda-policy-idx">{i + 1}</span>
              <span className="pagoda-policy-label">{t(p.title)}</span>
              <span className={`pagoda-chevron${openIdx === i ? ' open' : ''}`}>▾</span>
            </button>
            {openIdx === i && <div className="pagoda-policy-body">{t(p.body)}</div>}
          </div>
        ))}
      </div>

      {/* 古塔容量敬告 */}
      <div className="pagoda-card pagoda-capacity">
        <div className="pagoda-card-title">{t('pagoda.capacityTitle')}</div>
        <div className="pagoda-capacity-text">{t('pagoda.capacityNotice')}</div>
      </div>

      {/* 前往官方购票（唯一操作入口，按环境分流） */}
      {isWeChat() && PAGODA_MINI_USERNAME ? (
        <div dangerouslySetInnerHTML={{ __html: wechatTagHtml }} />
      ) : (
        <button type="button" className="pagoda-buy" onClick={handleBuy}>
          {t('pagoda.buy')}
        </button>
      )}

      {toast}
    </div>
  );
}
