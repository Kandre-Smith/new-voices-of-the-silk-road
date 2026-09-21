import type { Lang } from './store';
import { getLocalTips, getLocalTracks, listLocalAttractions } from './staticData';

const STATIC_BUILD = import.meta.env.VITE_STATIC === 'true';

export interface Coords {
  lat: number;
  lng: number;
}

export interface Attraction {
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

export interface AudioTrack {
  id: string;
  attractionId: string;
  spotSlug: string | null;
  kind: 'main' | 'spot';
  language: Lang;
  title: string;
  image: string;
  intro: string;
  emoji: string;
  accent: string;
  transcript: string[];
  duration: number;
  audioUrl: string;
}

export interface Tips {
  attractionId: string;
  language: Lang;
  attractionName: string;
  openHours: string;
  ticketPrice: string;
  suggestedDuration: string;
  transport: string;
  tips: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchAttractions(lang: Lang): Promise<Attraction[]> {
  return STATIC_BUILD
    ? Promise.resolve(listLocalAttractions(lang))
    : getJson<Attraction[]>(`/api/attractions?lang=${encodeURIComponent(lang)}`);
}

export function fetchTracks(slug: string, lang: Lang): Promise<AudioTrack[]> {
  return STATIC_BUILD
    ? Promise.resolve(getLocalTracks(slug, lang))
    : getJson<AudioTrack[]>(
        `/api/attractions/${encodeURIComponent(slug)}/tracks?lang=${encodeURIComponent(lang)}`,
      );
}

export function fetchTips(slug: string, lang: Lang): Promise<Tips> {
  return STATIC_BUILD
    ? Promise.resolve(getLocalTips(slug, lang))
    : getJson<Tips>(
        `/api/attractions/${encodeURIComponent(slug)}/tips?lang=${encodeURIComponent(lang)}`,
      );
}

/** 音色性别：女声 / 男声 */
export type VoiceGender = 'female' | 'male';

/** 按需合成语音（返回音频 URL；失败返回 null，由播放器回退 Web Speech） */
export async function synthesizeTts(
  text: string,
  lang: Lang,
  gender: VoiceGender = 'female',
): Promise<string | null> {
  if (STATIC_BUILD) return null;
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, gender }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return typeof data.url === 'string' ? data.url : null;
  } catch {
    return null;
  }
}

export async function submitFeedback(input: {
  text: string;
  images: string[];
  lang: Lang;
}): Promise<{ id: string }> {
  if (STATIC_BUILD) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const entry = { ...input, id, createdAt: new Date().toISOString() };
    const current = JSON.parse(localStorage.getItem('srv-local-feedback') || '[]') as unknown[];
    localStorage.setItem('srv-local-feedback', JSON.stringify([entry, ...current].slice(0, 20)));
    return { id };
  }
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`submit failed: ${res.status}`);
  return res.json();
}

export interface FeedbackEntry {
  id: string;
  text: string;
  images: string[];
  lang: string;
  createdAt: string;
}

/** 后台查看反馈列表（需管理员密码，通过 header `x-admin-password` 传递） */
export async function fetchFeedback(password: string): Promise<FeedbackEntry[]> {
  if (STATIC_BUILD) {
    if (password !== 'admin123') throw new Error('unauthorized');
    return JSON.parse(localStorage.getItem('srv-local-feedback') || '[]') as FeedbackEntry[];
  }
  const res = await fetch('/api/feedback', {
    headers: { 'x-admin-password': password },
  });
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json();
}
