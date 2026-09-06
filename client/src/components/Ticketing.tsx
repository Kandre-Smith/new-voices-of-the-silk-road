import { useState } from 'react';
import { useApp } from '../store';
import { TICKETS, MINI_PROGRAM_URL } from '../lib/tickets';

/**
 * 秦始皇帝陵博物院（兵马俑）门票信息 —— 静态展示组件。
 * 参照大雁塔门票模块的「卡片式」格式：票价公示 + 减免政策折叠面板，仅信息展示，
 * 不实现选票、数量加减、模拟订单、提交订单等表单逻辑；购票统一跳转官方渠道。
 */

/** 减免政策条目：去掉「全价票」（已在票价公示中展示） */
const POLICIES = TICKETS.filter((tk) => tk.id !== 'adult');

export default function Ticketing() {
  const { t } = useApp();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const handleBuy = () => {
    window.open(MINI_PROGRAM_URL, '_blank', 'noopener');
  };

  return (
    <div className="ticket">
      {/* 灰色温馨提示条 */}
      <div className="ticket-noticebar">{t('ticket.notice')}</div>

      {/* 外籍游客提示 */}
      <div className="ticket-foreign">{t('ticket.foreign')}</div>

      {/* 标题 */}
      <div className="pagoda-title">{t('ticket.title')}</div>

      {/* 票价公示 */}
      <div className="pagoda-card">
        <div className="pagoda-card-title">{t('ticket.fareTitle')}</div>
        <div className="pagoda-rows">
          <div className="pagoda-row pagoda-row--strong">{t('ticket.fareAdult')}</div>
          <div className="pagoda-row pagoda-row--strong">{t('ticket.fareHalf')}</div>
          <div className="pagoda-row">{t('ticket.fareFree')}</div>
        </div>
      </div>

      {/* 门票减免优惠政策（折叠面板，默认收起） */}
      <div className="pagoda-card">
        <div className="pagoda-card-title">{t('ticket.policyTitle')}</div>
        {POLICIES.map((tk, i) => (
          <div key={tk.id} className="pagoda-policy">
            <button
              type="button"
              className="pagoda-policy-head"
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <span className="pagoda-policy-idx">{i + 1}</span>
              <span className="pagoda-policy-label">{t(tk.nameKey)}</span>
              <span className="pagoda-policy-price">
                {tk.price === 0 ? t('ticket.free') : `¥${tk.price}`}
              </span>
              <span className={`pagoda-chevron${openIdx === i ? ' open' : ''}`}>▾</span>
            </button>
            {openIdx === i && <div className="pagoda-policy-body">{t(tk.descKey)}</div>}
          </div>
        ))}
      </div>

      {/* 前往官方购票（唯一操作入口） */}
      <button type="button" className="pagoda-buy" onClick={handleBuy}>
        {t('ticket.goMiniProgram')}
      </button>
    </div>
  );
}
