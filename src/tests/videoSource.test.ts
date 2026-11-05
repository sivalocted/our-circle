import { describe, expect, it } from 'vitest';
import { resolveVideoSource } from '../services/videoSource';

describe('video source resolution', () => {
  it('supports direct HTTPS video streams', () => {
    expect(resolveVideoSource('https://media.example.org/family.mp4')).toEqual({
      kind: 'direct',
      src: 'https://media.example.org/family.mp4',
      isVertical: false,
    });
  });

  it('maps YouTube share URLs to privacy-enhanced muted embeds', () => {
    const source = resolveVideoSource('https://youtu.be/abcdefghijk?t=30', true);

    expect(source.kind).toBe('embed');
    if (source.kind !== 'embed') return;
    expect(source.provider).toBe('youtube');
    expect(source.src).toContain('https://www.youtube-nocookie.com/embed/abcdefghijk');
    expect(new URL(source.src).searchParams.get('mute')).toBe('1');
    expect(new URL(source.src).searchParams.get('autoplay')).toBe('1');
  });

  it('resolves Vimeo share pages and disables autoplay for reduced motion', () => {
    const source = resolveVideoSource('https://vimeo.com/123456789', false);

    expect(source.kind).toBe('embed');
    if (source.kind !== 'embed') return;
    expect(source.provider).toBe('vimeo');
    expect(source.src).toContain('https://player.vimeo.com/video/123456789');
    expect(new URL(source.src).searchParams.get('autoplay')).toBe('0');
    expect(new URL(source.src).searchParams.get('dnt')).toBe('1');
  });

  it('preserves the privacy hash from an unlisted Vimeo URL', () => {
    const source = resolveVideoSource('https://vimeo.com/123456789/privatehash');

    expect(source.kind).toBe('embed');
    if (source.kind !== 'embed') return;
    expect(new URL(source.src).searchParams.get('h')).toBe('privatehash');
  });

  it('rejects insecure URLs, invalid provider IDs and lookalike hostnames', () => {
    expect(resolveVideoSource('http://media.example.org/video.mp4').kind).toBe('unsupported');
    expect(resolveVideoSource('https://youtube.com/watch?v=bad').kind).toBe('unsupported');
    expect(resolveVideoSource('https://youtube.com.example.org/watch?v=abcdefghijk').kind).toBe('direct');
  });
});
