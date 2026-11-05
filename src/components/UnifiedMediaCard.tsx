import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Heart, Film } from 'lucide-react';
import type { UnifiedMediaItem } from '../utils/experienceEngine';
import { SafeImage } from './SafeImage';
import { PEOPLE } from '../data/circleData';
import { soundEngine } from '../utils/audio';
import { deletedMediaStore } from '../services/deletedMediaStore';
import { useReducedMotionSetting } from './ReducedMotionContext';

interface UnifiedMediaCardProps {
  item: UnifiedMediaItem;
  className?: string;
  aspectRatioClass?: string;
  enable3DTilt?: boolean;
  priority?: boolean;
  onOpenItem: (item: UnifiedMediaItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
  showDetails?: boolean;
}

export const UnifiedMediaCard: React.FC<UnifiedMediaCardProps> = ({
  item,
  className = '',
  aspectRatioClass = 'aspect-[4/3]',
  enable3DTilt = true,
  onOpenItem,
  isFavorite = false,
  onToggleFavorite,
  showDetails = true,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const reducedMotion = useReducedMotionSetting();

  // If this item was deleted or failed, do not render it
  if (deletedMediaStore.isDeleted(item.id, item.url || item.cardUrl)) {
    return null;
  }

  // 3D Magnetic Tilt Physics
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3DTilt || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    soundEngine.tick();
  };

  // Find recognized people in this media
  const recognizedPeople = PEOPLE.filter((p) => item.people?.includes(p.id));

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        soundEngine.flip();
        onOpenItem(item);
      }}
      style={{
        transform: enable3DTilt
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
          : undefined,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`group relative rounded-2xl overflow-hidden cursor-pointer select-none border border-white/10 hover:border-[#DFBE8A]/50 bg-black/40 backdrop-blur-md shadow-lg hover:shadow-2xl hover:shadow-[#DFBE8A]/10 ${aspectRatioClass} ${className}`}
    >
      {/* Video or Image Presentation */}
      {item.type === 'video' && !videoError ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={item.videoUrl || item.url}
            poster={item.cardUrl}
            autoPlay={!reducedMotion}
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Video Badge */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center gap-1.5 text-[10px] font-mono text-[#DFBE8A] z-10">
            <Film className="w-3 h-3 text-[#DFBE8A]" />
            <span>VIDEO {item.duration && `• ${item.duration}`}</span>
          </div>
        </div>
      ) : item.type === 'video' ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-900 p-4 text-center text-stone-400">
          <Film className="h-6 w-6" />
          <span className="text-xs">This video source is unavailable right now.</span>
        </div>
      ) : (
        <SafeImage
          mediaId={item.id}
          src={item.cardUrl}
          alt={item.dateFormatted}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      )}

      {/* Subtle Specular Rim Lighting on Hover */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-1 ring-inset ring-[#DFBE8A]/30" />

      {/* Favorite Button */}
      {onToggleFavorite && (
        <button
          onClick={(e) => onToggleFavorite(item.id, e)}
          className={`absolute top-3 right-3 p-2 rounded-full z-20 transition-all ${
            isFavorite
              ? 'bg-rose-500 text-white shadow-lg scale-110'
              : 'bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:scale-110 backdrop-blur-md border border-white/10'
          }`}
          title={isFavorite ? 'Starred Memory' : 'Star Memory'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
        </button>
      )}

      {/* Futuristic Telemetry HUD on Hover */}
      {showDetails && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end text-white z-10 pointer-events-none">
          <div className="flex items-center justify-between text-xs font-serif font-bold tracking-wide">
            <span className="text-[#FAF7F2]">{item.title || item.dateFormatted}</span>
            {item.timeFormatted && (
              <span className="font-mono text-[10px] text-[#DFBE8A]">
                {item.timeFormatted}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-stone-300 mt-1.5 border-t border-white/10 pt-1.5">
            <span className="text-[#DFBE8A]">
              {item.type === 'video' ? 'ARCHIVAL FILM' : item.megapixels ? `${item.megapixels} MP` : 'ARCHIVAL PHOTO'}
            </span>

            {/* Recognized Cousins Icons */}
            {recognizedPeople.length > 0 && (
              <div className="flex items-center -space-x-1.5">
                {recognizedPeople.slice(0, 3).map((p) => (
                  <img
                    key={p.id}
                    src={p.avatarUrl}
                    alt={p.name}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full border border-black/80 object-cover"
                    title={p.name}
                  />
                ))}
                {recognizedPeople.length > 3 && (
                  <span className="text-[8px] bg-black/60 px-1 rounded-full text-stone-300 border border-white/10">
                    +{recognizedPeople.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
