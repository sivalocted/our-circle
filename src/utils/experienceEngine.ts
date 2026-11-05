import { REAL_PHOTOS } from '../data/circleData';
import type { RealPhoto } from '../data/circleData';
import { AMBIENT_VIDEO_MEMORIES } from '../data/mediaConfig';
import { deletedMediaStore } from '../services/deletedMediaStore';

export type ExperienceType = 'cinematic' | 'editorial' | 'motion' | 'spatial' | 'filmstrip' | 'constellation';

export interface UnifiedMediaItem {
  id: string;
  type: 'photo' | 'video';
  url: string;
  cardUrl: string;
  thumbUrl: string;
  fullUrl: string;
  aspectRatio: number;
  aspect: 'landscape' | 'portrait' | 'square';
  dateFormatted: string;
  timeFormatted?: string;
  year: number;
  people: string[];
  title?: string;
  videoUrl?: string;
  posterUrl?: string;
  duration?: string;
  megapixels?: number;
  originalPhoto?: RealPhoto;
}

export interface EditorialSpread {
  id: string;
  template: 'hero-duo' | 'triptych' | 'asymmetric-quad' | 'cinematic-bleed' | 'face-mosaic';
  headline?: string;
  year?: number;
  items: UnifiedMediaItem[];
}

export interface ColorMood {
  name: string;
  bgGradient: string;
  cardBg: string;
  accent: string;
  accentGlow: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
}

export interface CuratedExperienceState {
  archetype: ExperienceType;
  seed: number;
  mood: ColorMood;
  heroItem: UnifiedMediaItem | null;
  floatingSatellites: UnifiedMediaItem[];
  editorialSpreads: EditorialSpread[];
  motionStrips: {
    id: string;
    speed: number; // e.g. 25s, 35s, 45s
    direction: 'left' | 'right';
    items: UnifiedMediaItem[];
  }[];
  spatialPlanes: {
    foreground: UnifiedMediaItem[];
    midground: UnifiedMediaItem[];
    background: UnifiedMediaItem[];
  };
  filmstripItems: UnifiedMediaItem[];
}

// Color palettes tailored for high-end digital heirloom aesthetics
export const COLOR_MOODS: ColorMood[] = [
  {
    name: 'Cyber Espresso & Gold',
    bgGradient: 'from-[#0D0B0A] via-[#151210] to-[#0A0908]',
    cardBg: 'rgba(26, 22, 20, 0.75)',
    accent: '#DFBE8A',
    accentGlow: 'rgba(223, 190, 138, 0.25)',
    borderSubtle: 'rgba(223, 190, 138, 0.15)',
    textPrimary: '#FAF7F2',
    textSecondary: '#A89F91',
  },
  {
    name: 'Velvet Midnight',
    bgGradient: 'from-[#080B10] via-[#0E131C] to-[#06080D]',
    cardBg: 'rgba(14, 19, 28, 0.75)',
    accent: '#64B5F6',
    accentGlow: 'rgba(100, 181, 246, 0.25)',
    borderSubtle: 'rgba(100, 181, 246, 0.15)',
    textPrimary: '#F0F4F8',
    textSecondary: '#94A3B8',
  },
  {
    name: 'Champagne Warmth',
    bgGradient: 'from-[#120F0D] via-[#1A1512] to-[#0F0D0B]',
    cardBg: 'rgba(32, 26, 23, 0.75)',
    accent: '#F5C77E',
    accentGlow: 'rgba(245, 199, 126, 0.25)',
    borderSubtle: 'rgba(245, 199, 126, 0.18)',
    textPrimary: '#FFFDF9',
    textSecondary: '#BDB1A4',
  },
  {
    name: 'Emerald Heritage',
    bgGradient: 'from-[#07110C] via-[#0D1C15] to-[#050C08]',
    cardBg: 'rgba(13, 28, 21, 0.75)',
    accent: '#6EE7B7',
    accentGlow: 'rgba(110, 231, 183, 0.22)',
    borderSubtle: 'rgba(110, 231, 183, 0.15)',
    textPrimary: '#F2FDF7',
    textSecondary: '#9CB7A8',
  },
];

// Simple deterministic Mulberry32 PRNG
function createPrng(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convert local catalog entries into unified items for the media experiences.
export function getAllUnifiedMedia(): UnifiedMediaItem[] {
  const photoItems: UnifiedMediaItem[] = REAL_PHOTOS.map((p) => ({
    id: p.id,
    type: 'photo',
    url: p.rawUrl,
    cardUrl: p.cardUrl,
    thumbUrl: p.thumbUrl,
    fullUrl: p.fullUrl,
    aspectRatio: p.aspectRatio,
    aspect: p.aspect,
    dateFormatted: p.dateFormatted,
    timeFormatted: p.timeFormatted,
    year: p.year,
    people: p.people,
    megapixels: p.megapixels,
    originalPhoto: p,
  }));

  const videoItems: UnifiedMediaItem[] = AMBIENT_VIDEO_MEMORIES.map((v) => ({
    id: v.id,
    type: 'video',
    url: v.videoUrl,
    cardUrl: v.posterUrl,
    thumbUrl: v.thumbUrl || v.posterUrl,
    fullUrl: v.videoUrl,
    aspectRatio: v.aspectRatio,
    aspect: v.aspectRatio > 1 ? 'landscape' : 'portrait',
    dateFormatted: v.dateFormatted,
    year: v.year,
    people: v.people,
    title: v.title,
    videoUrl: v.videoUrl,
    posterUrl: v.posterUrl,
  }));

  const combined = [...videoItems, ...photoItems];
  // Honor legacy local exclusions. A failed request is handled by the media
  // component and never removes the source from the catalog.
  const validItems = deletedMediaStore.filterValid(combined);

  return validItems;
}

// True Fisher-Yates shuffle using deterministic PRNG
function shuffleArray<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const EDITORIAL_HEADLINES = [
  'The Archival Chapters',
  'Laughter & Golden Hours',
  'Kinfolk in Orbit',
  'Unscripted Reverie',
  'The Roadtrips & Chai',
  'Midnight Chronicles',
  'Our Shared Constellation',
  'Echoes of Yesterday',
  'Faces Across Nine Years',
  'The Cousins’ Monograph',
];

/**
 * Intelligent Layout & Experience Generator — Peak Entropy & High Randomism
 * Generates radically varied compositions while preserving aesthetic harmony.
 */
export function generateSmartExperience(
  seed: number = Math.floor(Math.random() * 10000000),
  forcedArchetype?: ExperienceType
): CuratedExperienceState {
  const rng = createPrng(seed);
  const allMedia = getAllUnifiedMedia();

  // 1. Select Archetype (Defaults to 'motion' if none forced or random)
  const archetypes: ExperienceType[] = ['motion', 'cinematic', 'editorial', 'spatial', 'filmstrip'];
  const archetype = forcedArchetype || archetypes[Math.floor(rng() * archetypes.length)];

  // 2. Select Color Mood with true randomness
  const mood = COLOR_MOODS[Math.floor(rng() * COLOR_MOODS.length)];

  // An empty production archive is a supported state until private media is
  // configured; do not manufacture a placeholder photo to fill the layout.
  if (allMedia.length === 0) {
    return {
      archetype,
      seed,
      mood,
      heroItem: null,
      floatingSatellites: [],
      editorialSpreads: [],
      motionStrips: [],
      spatialPlanes: { foreground: [], midground: [], background: [] },
      filmstripItems: [],
    };
  }

  // 3. Peak Random Hero Selection:
  // Dynamically picks from landscape or portrait with high entropy
  const heroCandidates = allMedia.filter((m) => m.aspect === 'landscape' || m.type === 'video' || (m.megapixels && m.megapixels > 8));
  const heroItem = heroCandidates[Math.floor(rng() * heroCandidates.length)] || allMedia[Math.floor(rng() * allMedia.length)];

  // 4. Fully Shuffle the entire remaining catalog with Fisher-Yates
  const remaining = allMedia.filter((m) => m.id !== heroItem.id);
  const shuffled = shuffleArray(remaining, rng);

  // 5. Floating Satellites: Fresh diverse sample
  const floatingSatellites = shuffled.slice(0, 12);

  // 6. Peak Random Motion Strips:
  // Motion strips contain photos only; keep video playback in its dedicated stage.
  const photoOnlyMedia = allMedia.filter((m) => m.type === 'photo');
  const shuffledPhotos = shuffleArray(photoOnlyMedia, rng);

  // Smooth, luxurious, slowed-down motion speeds (70s to 120s per cycle)
  const stripSpeeds = [
    Math.floor(rng() * 25) + 75, // 75-100s
    Math.floor(rng() * 30) + 85, // 85-115s
    Math.floor(rng() * 25) + 70, // 70-95s
    Math.floor(rng() * 30) + 90, // 90-120s
  ];

  const motionStrips = [
    {
      id: 'strip-top',
      speed: stripSpeeds[0],
      direction: (rng() > 0.5 ? 'left' : 'right') as 'left' | 'right',
      items: shuffleArray(shuffledPhotos.slice(0, 24), rng),
    },
    {
      id: 'strip-mid',
      speed: stripSpeeds[1],
      direction: (rng() > 0.5 ? 'right' : 'left') as 'left' | 'right',
      items: shuffleArray(shuffledPhotos.slice(24, 48), rng),
    },
    {
      id: 'strip-bot',
      speed: stripSpeeds[2],
      direction: (rng() > 0.5 ? 'left' : 'right') as 'left' | 'right',
      items: shuffleArray(shuffledPhotos.slice(48, 72), rng),
    },
  ];

  // Randomly add a 4th kinetic conveyor strip 50% of the time for peak density!
  if (rng() > 0.4) {
    motionStrips.push({
      id: 'strip-extra',
      speed: stripSpeeds[3],
      direction: (rng() > 0.5 ? 'right' : 'left') as 'left' | 'right',
      items: shuffleArray(shuffledPhotos.slice(72, 96), rng),
    });
  }

  // 7. Peak Random Editorial Spreads:
  // Dynamic shuffled headlines and randomized template sequencing
  const shuffledHeadlines = shuffleArray(EDITORIAL_HEADLINES, rng);
  const availableTemplates: EditorialSpread['template'][] = [
    'hero-duo',
    'triptych',
    'asymmetric-quad',
    'cinematic-bleed',
    'face-mosaic',
  ];
  const spreadTemplates = shuffleArray(availableTemplates, rng);

  const editorialSpreads: EditorialSpread[] = spreadTemplates.map((template, idx) => {
    const chunkStart = idx * 10;
    const chunkItems = shuffled.slice(chunkStart, chunkStart + 8);
    return {
      id: `spread-${idx + 1}-${template}`,
      template,
      headline: shuffledHeadlines[idx] || `Chapter 0${idx + 1}`,
      year: chunkItems[0]?.year || heroItem.year,
      items: idx === 0 ? [heroItem, ...chunkItems.slice(0, 3)] : chunkItems,
    };
  }).filter((spread) => spread.items.length > 0);

  // 8. Spatial Depth Planes: Randomly layered subsets
  const spatialPlanes = {
    foreground: shuffleArray(shuffled.slice(0, 6), rng),
    midground: shuffleArray(shuffled.slice(6, 16), rng),
    background: shuffleArray(shuffled.slice(16, 28), rng),
  };

  // 9. Filmstrip 3D Perspective Reel: Random dynamic starting deck
  const filmstripItems = shuffleArray([heroItem, ...shuffled.slice(0, 24)], rng);

  return {
    archetype,
    seed,
    mood,
    heroItem,
    floatingSatellites,
    editorialSpreads,
    motionStrips,
    spatialPlanes,
    filmstripItems,
  };
}
