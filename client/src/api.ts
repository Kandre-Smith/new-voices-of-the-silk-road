import type { Lang } from './store';

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
  return getJson<Attraction[]>(`/api/attractions?lang=${encodeURIComponent(lang)}`);
}

export function fetchTracks(slug: string, lang: Lang): Promise<AudioTrack[]> {
  return getJson<AudioTrack[]>(
    `/api/attractions/${encodeURIComponent(slug)}/tracks?lang=${encodeURIComponent(lang)}`,
  );
}

export function fetchTips(slug: string, lang: Lang): Promise<Tips> {
  return getJson<Tips>(
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
  const res = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`submit failed: ${res.status}`);
  return res.json();
}
