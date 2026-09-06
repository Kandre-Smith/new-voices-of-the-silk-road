/** 支持的语言，与前端、音频文件命名保持一致 */
export type Lang = 'zh-CN' | 'ms-MY' | 'en-US';

export const LANGS: Lang[] = ['zh-CN', 'ms-MY', 'en-US'];

export interface Localized {
  'zh-CN': string;
  'ms-MY': string;
  'en-US': string;
}

export interface LocalizedArray {
  'zh-CN': string[];
  'ms-MY': string[];
  'en-US': string[];
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface TipContent {
  openHours: string;
  ticketPrice: string;
  suggestedDuration: string;
  transport: string;
  tips: string;
}

export interface LocalizedTips {
  'zh-CN': TipContent;
  'ms-MY': TipContent;
  'en-US': TipContent;
}

/** 子景点（主景点之下的讲解点位，拥有独立音轨） */
export interface SpotSeed {
  slug: string;
  order: number;
  emoji: string;
  /** 点位照片（缺省为空串，前端回退渐变+emoji） */
  image: string;
  name: Localized;
  transcript: LocalizedArray;
  duration: number;
}

export interface AttractionSeed {
  id: string;
  slug: string;
  order: number;
  coords: Coords;
  emoji: string;
  accent: string;
  /** 封面照片（缺省为空串，前端回退渐变+emoji） */
  image: string;
  name: Localized;
  intro: Localized;
  track: {
    title: Localized;
    transcript: LocalizedArray;
    duration: number;
  };
  spots: SpotSeed[];
  tips: LocalizedTips;
}

export interface SeedData {
  attractions: AttractionSeed[];
}

/** 前端看到的景点列表项 */
export interface AttractionSummary {
  id: string;
  slug: string;
  order: number;
  coords: Coords;
  emoji: string;
  accent: string;
  image: string;
  name: string;
  intro: string;
}

/** 讲解音频（每景点、每语言：主讲解音轨 + 若干子景点音轨） */
export interface AudioTrack {
  id: string;
  attractionId: string;
  /** 子景点 slug；主景点音轨为 null */
  spotSlug: string | null;
  /** main = 主景点讲解；spot = 子景点讲解 */
  kind: 'main' | 'spot';
  language: Lang;
  title: string;
  /** 音轨对应点位的照片（主景点为景点封面，子景点为点位图） */
  image: string;
  /** 简短配文：主景点为 intro，子景点为讲解首句 */
  intro: string;
  /** 封面兜底用：emoji 与主色 */
  emoji: string;
  accent: string;
  transcript: string[];
  duration: number;
  audioUrl: string;
}
