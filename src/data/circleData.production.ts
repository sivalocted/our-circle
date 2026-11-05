/**
 * Empty production catalog. The development catalog contains private family
 * album URLs and must not be embedded in a publicly served client bundle.
 * Connect authenticated private storage before enabling production memories.
 */
export interface Person {
  id: string;
  name: string;
  avatarUrl: string;
  faceCount: number;
  photoIndices: number[];
}

export interface RealPhoto {
  id: string;
  index: number;
  rawUrl: string;
  cardUrl: string;
  thumbUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  aspect: 'landscape' | 'portrait' | 'square';
  megapixels: number;
  timestamp: number;
  dateFormatted: string;
  timeFormatted: string;
  year: number;
  month: string;
  yearMonth: string;
  isoDate: string;
  people: string[];
}

export const PEOPLE: Person[] = [];
export const REAL_PHOTOS: RealPhoto[] = [];
export type Memory = RealPhoto;
export type Cousin = Person;
export const COUSINS = PEOPLE;
export const MEMORIES = REAL_PHOTOS;
export const CHAPTERS: { id: string; title: string; year: number }[] = [];
