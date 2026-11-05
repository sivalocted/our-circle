export type VideoSource =
  | { kind: 'direct'; src: string; isVertical: false }
  | { kind: 'embed'; provider: 'youtube' | 'vimeo'; src: string; isVertical: boolean }
  | { kind: 'unsupported' };

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);
const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

export function resolveVideoSource(rawUrl: string, autoplay = false): VideoSource {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { kind: 'unsupported' };
  }

  if (url.protocol !== 'https:') return { kind: 'unsupported' };

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const segments = url.pathname.split('/').filter(Boolean);
    let videoId: string | null = null;
    let isVertical = false;

    if (url.hostname === 'youtu.be') videoId = segments[0] ?? null;
    else if (segments[0] === 'watch') videoId = url.searchParams.get('v');
    else if (['embed', 'shorts', 'live'].includes(segments[0] ?? '')) {
      videoId = segments[1] ?? null;
      isVertical = segments[0] === 'shorts';
    }

    if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return { kind: 'unsupported' };

    const embed = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    embed.searchParams.set('autoplay', autoplay ? '1' : '0');
    embed.searchParams.set('mute', '1');
    embed.searchParams.set('playsinline', '1');
    embed.searchParams.set('controls', '1');
    embed.searchParams.set('rel', '0');
    return { kind: 'embed', provider: 'youtube', src: embed.toString(), isVertical };
  }

  if (VIMEO_HOSTS.has(url.hostname)) {
    const segments = url.pathname.split('/').filter(Boolean);
    const videoId = url.hostname === 'player.vimeo.com'
      ? (segments[0] === 'video' ? segments[1] : null)
      : segments[0];
    if (!videoId || !/^\d+$/.test(videoId)) return { kind: 'unsupported' };

    const embed = new URL(`https://player.vimeo.com/video/${videoId}`);
    const unlistedHash = url.searchParams.get('h') ?? (url.hostname !== 'player.vimeo.com' ? segments[1] : null);
    if (unlistedHash && /^[A-Za-z0-9]+$/.test(unlistedHash)) embed.searchParams.set('h', unlistedHash);
    embed.searchParams.set('autoplay', autoplay ? '1' : '0');
    embed.searchParams.set('muted', '1');
    embed.searchParams.set('playsinline', '1');
    embed.searchParams.set('dnt', '1');
    embed.searchParams.set('title', '0');
    embed.searchParams.set('byline', '0');
    embed.searchParams.set('portrait', '0');
    return { kind: 'embed', provider: 'vimeo', src: embed.toString(), isVertical: false };
  }

  return { kind: 'direct', src: url.toString(), isVertical: false };
}
