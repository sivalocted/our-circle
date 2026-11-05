/** Resizes legacy Google Photos URLs used only by the local development catalog. */

export function getOptimizedImageUrl(rawUrl: string, width = 600, height = 450, crop = true): string {
  if (!rawUrl) return '';

  // Handle Google Photos LH3 CDN parameter optimization
  if (rawUrl.includes('googleusercontent.com')) {
    const cleanBase = rawUrl.replace(/=[swhcdmp0-9-]+$/, '');
    const cropFlag = crop ? '-c' : '';
    return `${cleanBase}=w${width}-h${height}${cropFlag}`;
  }

  return rawUrl;
}

