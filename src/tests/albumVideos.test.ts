import { describe, expect, it } from 'vitest';
import { addAlbumVideo } from '../data/albumVideos';

describe('user-added video metadata', () => {
  it('does not invent a title or capture date when optional details are blank', () => {
    const video = addAlbumVideo({ videoUrl: 'https://vimeo.com/123456789' });

    expect(video.title).toBe('Untitled video');
    expect(video.dateFormatted).toBe('Undated');
    expect(video.timeFormatted).toBe('');
    expect(video.year).toBe(0);
    expect(video.posterUrl).toBe('');
    expect(video.thumbUrl).toBe('');
  });
});
