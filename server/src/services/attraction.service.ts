import { seed, bySlug, normalizeLang } from '../data';
import { AttractionSummary, AudioTrack, Lang, TipContent } from '../types';

export function listAttractions(lang: Lang): AttractionSummary[] {
  return seed.attractions
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      order: a.order,
      coords: a.coords,
      emoji: a.emoji,
      accent: a.accent,
      image: a.image,
      name: a.name[lang],
      intro: a.intro[lang],
    }));
}

export function getAttraction(slug: string, lang: Lang): AttractionSummary | null {
  const a = bySlug(slug);
  if (!a) return null;
  return {
    id: a.id,
    slug: a.slug,
    order: a.order,
    coords: a.coords,
    emoji: a.emoji,
    accent: a.accent,
    image: a.image,
    name: a.name[lang],
    intro: a.intro[lang],
  };
}

export function getTracks(slug: string, lang: Lang): AudioTrack[] | null {
  const a = bySlug(slug);
  if (!a) return null;
  const tracks: AudioTrack[] = [
    {
      id: `${a.id}-main-${lang}`,
      attractionId: a.id,
      spotSlug: null,
      kind: 'main',
      language: lang,
      title: a.name[lang],
      image: a.image,
      intro: a.intro[lang],
      emoji: a.emoji,
      accent: a.accent,
      transcript: a.track.transcript[lang],
      duration: a.track.duration,
      audioUrl: `/audio/${a.slug}-${lang}.mp3`,
    },
  ];
  const spots = a.spots ?? [];
  const sorted = spots.slice().sort((x, y) => x.order - y.order);
  for (const s of sorted) {
    tracks.push({
      id: `${a.id}-${s.slug}-${lang}`,
      attractionId: a.id,
      spotSlug: s.slug,
      kind: 'spot',
      language: lang,
      title: s.name[lang],
      image: s.image,
      intro: s.transcript[lang][0] ?? '',
      emoji: s.emoji,
      accent: a.accent,
      transcript: s.transcript[lang],
      duration: s.duration,
      audioUrl: `/audio/${a.slug}-${s.slug}-${lang}.mp3`,
    });
  }
  return tracks;
}

export interface TipsResponse extends TipContent {
  attractionId: string;
  language: Lang;
  attractionName: string;
}

export function getTips(slug: string, lang: Lang): TipsResponse | null {
  const a = bySlug(slug);
  if (!a) return null;
  return {
    attractionId: a.id,
    language: lang,
    attractionName: a.name[lang],
    ...a.tips[lang],
  };
}

export { normalizeLang };
