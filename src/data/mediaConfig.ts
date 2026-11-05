// Centralized media source management for Our Circle.

import { getAllSortedAlbumVideos, addAlbumVideo } from './albumVideos';
import type { AlbumVideo } from './albumVideos';

export type VideoMediaItem = AlbumVideo;

export const AMBIENT_VIDEO_MEMORIES = getAllSortedAlbumVideos();

/**
 * Returns the development catalog and browser-local additions, sorted by source
 * timestamp. Production builds substitute an empty development catalog.
 */
export function getAmbientVideoMemories(): AlbumVideo[] {
  return getAllSortedAlbumVideos();
}

/**
 * Checks if a given media URL is a video stream or Google Photos video endpoint.
 * In Google Photos, video streams use flags like =m18, =m22, =m37, =dv or .mp4/.webm.
 */
export function isVideoMedia(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.includes('=m18') ||
    lower.includes('=m22') ||
    lower.includes('=m37') ||
    lower.includes('=dv')
  );
}

/**
 * Converts a Google Photos photo or video URL into an optimal streaming endpoint.
 * For videos: appends =m22 (720p HD) or =dv (direct video stream).
 * For photos: appends thumbnail width/height bounding parameters.
 */
export function formatGooglePhotosMediaUrl(url: string, isVideo = false): string {
  if (!url) return '';
  if (isVideo) {
    if (url.includes('googleusercontent.com') && !url.includes('=')) {
      return `${url}=m22`;
    }
    return url;
  }
  return url;
}

/**
 * Register extra videos added to the family collection dynamically.
 */
export function registerCustomVideo(videoInput: {
  url: string;
  title?: string;
  dateFormatted?: string;
  people?: string[];
}): AlbumVideo {
  return addAlbumVideo(videoInput);
}
