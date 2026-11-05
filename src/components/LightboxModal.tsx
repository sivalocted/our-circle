import { useMemo } from 'react';
import Lightbox, { type Slide } from 'yet-another-react-lightbox';
import { Captions, Download, Fullscreen, Slideshow, Thumbnails, Video, Zoom } from 'yet-another-react-lightbox/plugins';
import 'yet-another-react-lightbox/styles.css';
import { Heart } from 'lucide-react';
import type { RealPhoto } from '../data/circleData';
import type { UnifiedMediaItem } from '../utils/experienceEngine';

type GalleryItem = RealPhoto | UnifiedMediaItem;

interface LightboxModalProps {
  items: GalleryItem[];
  index: number;
  isFavorite: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onToggleFavorite: (id: string) => void;
}

function toSlide(item: GalleryItem): Slide {
  const isUnified = 'type' in item;
  const isVideo = isUnified && item.type === 'video' && Boolean(item.videoUrl);
  const itemTitle = 'title' in item ? item.title : undefined;
  const title = itemTitle || item.dateFormatted || 'Family memory';
  const description = [item.dateFormatted, item.timeFormatted, item.year ? String(item.year) : ''].filter(Boolean).join(' · ');

  if (isVideo && 'videoUrl' in item && item.videoUrl) {
    return {
      type: 'video',
      sources: [{ src: item.videoUrl, type: 'video/mp4' }],
      poster: item.posterUrl || item.cardUrl,
      controls: true,
      muted: true,
      playsInline: true,
      preload: 'metadata',
      title,
      description,
    };
  }

  const src = 'rawUrl' in item ? item.fullUrl || item.cardUrl : item.fullUrl || item.url;
  const width = 'width' in item ? item.width : item.originalPhoto?.width;
  const height = 'height' in item ? item.height : item.originalPhoto?.height;
  return {
    src,
    alt: title,
    width,
    height,
    imageFit: 'contain',
    title,
    description,
    download: 'rawUrl' in item ? `${item.rawUrl}=d` : item.fullUrl,
  };
}

export function LightboxModal({ items, index, isFavorite, onClose, onIndexChange, onToggleFavorite }: LightboxModalProps) {
  const slides = useMemo(() => items.map(toSlide), [items]);
  const selectedItem = items[index];
  if (!selectedItem) return null;

  const favoriteButton = (
    <button
      type="button"
      onClick={() => onToggleFavorite(selectedItem.id)}
      aria-label={isFavorite ? 'Remove from saved memories' : 'Save this memory'}
      aria-pressed={isFavorite}
      className="yarl__button flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10"
    >
      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rose-400 text-rose-400' : ''}`} />
    </button>
  );

  return (
    <Lightbox
      open
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Captions, Download, Fullscreen, Slideshow, Thumbnails, Video, Zoom]}
      captions={{ showToggle: true, descriptionTextAlign: 'center' }}
      thumbnails={{ showToggle: true, position: 'bottom', width: 72, height: 54, border: 1, borderRadius: 6 }}
      video={{ autoPlay: false, controls: true, muted: true, playsInline: true, preload: 'metadata' }}
      carousel={{ finite: false, preload: 2, imageFit: 'contain', padding: '8%' }}
      labels={{ Lightbox: 'Family memories', Close: 'Close viewer', Previous: 'Previous memory', Next: 'Next memory' }}
      toolbar={{ buttons: ['slideshow', 'fullscreen', 'captions', 'thumbnails', 'zoom', 'download', favoriteButton, 'close'] }}
      on={{ view: ({ index: nextIndex }) => onIndexChange(nextIndex) }}
      styles={{ root: { '--yarl__color_backdrop': 'rgba(9, 8, 7, 0.98)' } }}
    />
  );
}
