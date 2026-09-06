/**
 * 秦始皇帝陵博物院（兵马俑）购票信息 —— 静态数据。
 * 本模块仅静态展示，不接入真实购票后端、不请求第三方票务接口。
 * MINI_PROGRAM_URL 为官方购票链接（用户提供），点击跳转到官方购票 H5。
 */

export interface TicketType {
  id: string;
  nameKey: string;
  descKey: string;
  /** 票价（人民币元），0 表示免票 */
  price: number;
}

export const TICKETS: TicketType[] = [
  { id: 'adult', nameKey: 'ticket.t.adult.name', descKey: 'ticket.t.adult.desc', price: 120 },
  { id: 'student', nameKey: 'ticket.t.student.name', descKey: 'ticket.t.student.desc', price: 60 },
  { id: 'veteran', nameKey: 'ticket.t.veteran.name', descKey: 'ticket.t.veteran.desc', price: 60 },
  { id: 'disabled', nameKey: 'ticket.t.disabled.name', descKey: 'ticket.t.disabled.desc', price: 0 },
  { id: 'disabledCompanion', nameKey: 'ticket.t.disabledCompanion.name', descKey: 'ticket.t.disabledCompanion.desc', price: 0 },
  { id: 'elderly', nameKey: 'ticket.t.elderly.name', descKey: 'ticket.t.elderly.desc', price: 0 },
  { id: 'military', nameKey: 'ticket.t.military.name', descKey: 'ticket.t.military.desc', price: 0 },
  { id: 'militaryFamily', nameKey: 'ticket.t.militaryFamily.name', descKey: 'ticket.t.militaryFamily.desc', price: 0 },
  { id: 'police', nameKey: 'ticket.t.police.name', descKey: 'ticket.t.police.desc', price: 0 },
];

/** 一笔订单最多购票张数 */
export const MAX_TICKETS = 10;

/** 官方购票链接（用户提供）：跳转到秦始皇帝陵博物院官方购票 H5。 */
export const MINI_PROGRAM_URL = 'https://bmy.albatrip.cn/quickticket/index.html#/index';
