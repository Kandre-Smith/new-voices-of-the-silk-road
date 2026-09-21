import seedJson from './data/seed.json';
import type { Attraction, AudioTrack, Tips } from './api';
import type { Lang } from './store';

type Localized<T> = Record<Lang, T>;

interface SpotSeed {
  slug: string;
  order: number;
  emoji: string;
  image: string;
  name: Localized<string>;
  transcript: Localized<string[]>;
  duration: number;
}

interface AttractionSeed {
  id: string;
  slug: string;
  order: number;
  coords: { lat: number; lng: number };
  emoji: string;
  accent: string;
  image: string;
  name: Localized<string>;
  intro: Localized<string>;
  track: { transcript: Localized<string[]>; duration: number };
  spots?: SpotSeed[];
  tips: Localized<{
    openHours: string;
    ticketPrice: string;
    suggestedDuration: string;
    transport: string;
    tips: string;
  }>;
}

const seed = seedJson as { attractions: AttractionSeed[] };
const base = import.meta.env.BASE_URL;

function asset(path: string): string {
  return `${base}${path.replace(/^\//, '')}`;
}

function find(slug: string): AttractionSeed | undefined {
  return seed.attractions.find((item) => item.slug === slug);
}

export function listLocalAttractions(lang: Lang): Attraction[] {
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
      image: asset(a.image),
      name: a.name[lang],
      intro: a.intro[lang],
    }));
}

export function getLocalTracks(slug: string, lang: Lang): AudioTrack[] {
  const a = find(slug);
  if (!a) return [];
  const tracks: AudioTrack[] = [{
    id: `${a.id}-main-${lang}`,
    attractionId: a.id,
    spotSlug: null,
    kind: 'main',
    language: lang,
    title: a.name[lang],
    image: asset(a.image),
    intro: a.intro[lang],
    emoji: a.emoji,
    accent: a.accent,
    transcript: a.track.transcript[lang],
    duration: a.track.duration,
    audioUrl: asset(`/audio/${a.slug}-${lang}.mp3`),
  }];

  for (const spot of (a.spots ?? []).slice().sort((x, y) => x.order - y.order)) {
    tracks.push({
      id: `${a.id}-${spot.slug}-${lang}`,
      attractionId: a.id,
      spotSlug: spot.slug,
      kind: 'spot',
      language: lang,
      title: spot.name[lang],
      image: asset(spot.image),
      intro: spot.transcript[lang][0] ?? '',
      emoji: spot.emoji,
      accent: a.accent,
      transcript: spot.transcript[lang],
      duration: spot.duration,
      audioUrl: asset(`/audio/${a.slug}-${spot.slug}-${lang}.mp3`),
    });
  }
  return tracks;
}

export function getLocalTips(slug: string, lang: Lang): Tips {
  const a = find(slug);
  if (!a) throw new Error('Attraction not found');
  return {
    attractionId: a.id,
    language: lang,
    attractionName: a.name[lang],
    ...a.tips[lang],
  };
}
