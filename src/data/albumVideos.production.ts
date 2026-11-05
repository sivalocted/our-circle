/**
 * Production video catalog intentionally starts empty. Local development data
 * contains private Google Photos links. User-added HTTPS sources remain local
 * to this browser until a private media service is configured.
 */
export interface AlbumVideoItem {
  id: string;
  albumIndex: number;
  baseUrl: string;
  videoUrl: string;
  posterUrl: string;
  thumbUrl: string;
  title: string;
  timestamp: number;
  dateFormatted: string;
  timeFormatted: string;
  year: number;
  yearMonth: string;
  width: number;
  height: number;
  aspectRatio: number;
  resolutionLabel: string;
  isVertical: boolean;
  hasAudio: boolean;
  audioCodec: string;
  people: string[];
  isNew?: boolean;
}

export type AlbumVideo = AlbumVideoItem;
export const DEVELOPMENT_ALBUM_VIDEOS: AlbumVideoItem[] = [];
const STORAGE_KEY = 'our_circle_custom_album_videos';

export function getCustomAlbumVideos(): AlbumVideoItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter(isAlbumVideo) : [];
  } catch {
    return [];
  }
}

function isAlbumVideo(value: unknown): value is AlbumVideoItem {
  if (typeof value !== 'object' || value === null) return false;
  const video = value as Partial<AlbumVideoItem>;
  try {
    return typeof video.id === 'string' && typeof video.title === 'string' &&
      typeof video.videoUrl === 'string' && new URL(video.videoUrl).protocol === 'https:';
  } catch {
    return false;
  }
}

export function saveCustomAlbumVideos(videos: AlbumVideoItem[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(videos.filter(isAlbumVideo))); } catch { /* optional local storage */ }
}

export function getAllSortedAlbumVideos(): AlbumVideoItem[] {
  return getCustomAlbumVideos().sort((a, b) => a.timestamp - b.timestamp);
}

export function addAlbumVideo(input: Partial<AlbumVideoItem>): AlbumVideoItem {
  let parsedUrl: URL;
  try { parsedUrl = new URL(input.videoUrl ?? ''); } catch { throw new Error('Enter a valid HTTPS video URL.'); }
  if (parsedUrl.protocol !== 'https:') throw new Error('Video URLs must use HTTPS.');
  const now = new Date();
  const index = getAllSortedAlbumVideos().length + 1;
  const width = input.width ?? 1280;
  const height = input.height ?? 720;
  const video: AlbumVideoItem = {
    id: input.id ?? `local-video-${crypto.randomUUID()}`,
    albumIndex: input.albumIndex ?? index,
    baseUrl: input.baseUrl ?? parsedUrl.href,
    videoUrl: parsedUrl.href,
    posterUrl: input.posterUrl ?? '',
    thumbUrl: input.thumbUrl ?? '',
    title: input.title?.trim() || 'Untitled video',
    timestamp: input.timestamp ?? now.getTime(),
    dateFormatted: input.dateFormatted?.trim() || 'Undated',
    timeFormatted: input.timeFormatted?.trim() || '',
    year: input.year ?? 0,
    yearMonth: input.yearMonth ?? 'Undated',
    width,
    height,
    aspectRatio: width / height,
    resolutionLabel: input.resolutionLabel ?? 'Video',
    isVertical: height > width,
    hasAudio: false,
    audioCodec: '',
    people: [],
    isNew: true,
  };
  saveCustomAlbumVideos([...getCustomAlbumVideos().filter((entry) => entry.id !== video.id), video]);
  return video;
}

