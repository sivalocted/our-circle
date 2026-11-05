import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { deletedMediaStore } from '../services/deletedMediaStore';
import { getOptimizedImageUrl } from '../services/performanceOptimizer';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  mediaId?: string;
  fallbackSrc?: string;
  caption?: string;
  containerClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  mediaId,
  caption,
  containerClassName = '',
  ...props
}) => {
  const [imageState, setImageState] = useState<{ src: string; loaded: boolean; error: boolean }>(() => ({
    src: String(src ?? ''), loaded: false, error: false,
  }));

  // If already flagged as deleted or missing, don't show
  if ((mediaId && deletedMediaStore.isDeleted(mediaId)) || (src && deletedMediaStore.isDeleted(src))) {
    return null;
  }

  // Fast optimized URL using LH3 CDN width/height resizing & compression
  const optimizedSrc = src ? getOptimizedImageUrl(src, 600, 450, true) : '';
  const isCurrentSource = imageState.src === optimizedSrc;
  const error = isCurrentSource && imageState.error;
  const loaded = isCurrentSource && imageState.loaded;

  return (
    <div className={`relative w-full h-full overflow-hidden bg-stone-900 flex items-center justify-center ${containerClassName}`}>
      {/* Skeleton loading shimmer */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-stone-800/60 animate-pulse" />
      )}

      {!error ? (
        <img
          src={optimizedSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onLoad={() => setImageState({ src: optimizedSrc, loaded: true, error: false })}
          onError={() => {
            // Network failures may be temporary. Keep the catalog intact and
            // show a local fallback instead of persistently hiding real media.
            setImageState({ src: optimizedSrc, loaded: false, error: true });
          }}
          className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          {...props}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-stone-900 text-stone-500 text-center">
          <Camera className="w-7 h-7 text-stone-600 mb-1" />
          <span className="font-serif text-xs text-stone-500">
            {caption || 'Archived Moment'}
          </span>
        </div>
      )}
    </div>
  );
};
