import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Modal } from './Modal';
import { TICKETS, MINI_PROGRAM_URL } from '../lib/tickets';

/**
 * 出行小贴士里的「购票预约」入口卡片。
 * 外国游客提示 + 跳转官方小程序链接 + 「哪些人群可优惠购票」查看详情；
 * 点击卡片跳转到讲解页的完整购票模块。
 */
export default function TicketEntry({ slug }: { slug: string }) {
  const { t } = useApp();
  const navigate = useNavigate();
  const [showDiscount, setShowDiscount] = useState(false);
  // 除全价成人票外的优惠/免票人群
  const discounted = TICKETS.filter((tk) => tk.price < 120);

  return (
    <>
      <div className="ticket-entry card" onClick={() => navigate(`/tour/${slug}`)}>
        <div className="ticket-entry-head">
          <span className="ticket-entry-title">{t('ticket.entryTitle')}</span>
          <span className="ticket-entry-cta">
            {t('ticket.entryCta')} ›
          </span>
        </div>
        <div className="ticket-entry-desc">{t('ticket.entryDesc')}</div>
        <div className="ticket-entry-foreign">{t('ticket.foreign')}</div>
        <div className="ticket-entry-actions">
          <a
            className="ticket-mini-btn"
            href={MINI_PROGRAM_URL}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {t('ticket.goMiniProgram')}
          </a>
          <button
            type="button"
            className="ticket-detail-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowDiscount(true);
            }}
          >
            {t('ticket.discountTitle')} · {t('ticket.viewDetail')}
          </button>
        </div>
      </div>

      <Modal
        open={showDiscount}
        title={t('ticket.discountTitle')}
        confirmText={t('ticket.confirm')}
        onClose={() => setShowDiscount(false)}
        onConfirm={() => setShowDiscount(false)}
      >
        <div className="ticket-discount-list">
          {discounted.map((tk) => (
            <div key={tk.id} className="ticket-discount-item">
              <span>{t(tk.nameKey)}</span>
              <span className="ticket-discount-price">¥{tk.price}</span>
            </div>
          ))}
          <p className="ticket-notice-footer">{t('ticket.discountFooter')}</p>
        </div>
      </Modal>
    </>
  );
}
