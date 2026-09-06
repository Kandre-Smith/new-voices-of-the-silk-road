import seedJson from './seed.json';
import { SeedData, Lang, AttractionSeed } from '../types';

/** 单一数据源：三景点三语内容 */
export const seed = seedJson as unknown as SeedData;

export function bySlug(slug: string): AttractionSeed | undefined {
  return seed.attractions.find((a) => a.slug === slug);
}

/** 宽松解析语言参数：zh/ms/en 或 zh-CN/ms-MY/en-US */
export function normalizeLang(raw: unknown): Lang {
  const s = String(raw || '').toLowerCase();
  if (s.startsWith('zh')) return 'zh-CN';
  if (s.startsWith('ms')) return 'ms-MY';
  if (s.startsWith('en')) return 'en-US';
  return 'zh-CN';
}
