import React from 'react';
import type { CuratedExperienceState, UnifiedMediaItem } from '../../utils/experienceEngine';
import { UnifiedMediaCard } from '../UnifiedMediaCard';

interface MotionExperienceProps {
  state: CuratedExperienceState;
  onOpenItem: (item: UnifiedMediaItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const MotionExperience: React.FC<MotionExperienceProps> = ({
  state,
  onOpenItem,
  favorites,
  onToggleFavorite,
}) => {
  return (
    <div className="w-full min-h-screen py-8 overflow-hidden flex flex-col justify-center space-y-8 select-none">
      {/* Infinite motion strips with row-specific hover pause. */}
      <div className="space-y-6 sm:space-y-8 w-full py-2">
        {state.motionStrips.map((strip) => {
          // Strictly exclude any videos from motion strips (photos only)
          const photoItemsOnly = strip.items.filter((item) => item.type !== 'video');
          const basePhotos =
            photoItemsOnly.length > 0
              ? photoItemsOnly
              : state.heroItem
              ? [state.heroItem]
              : [];

          // Ensure at least 12 items per half-track so wide monitors never show empty gaps
          let singleTrack: UnifiedMediaItem[] = [...basePhotos];
          while (singleTrack.length < 12 && basePhotos.length > 0) {
            singleTrack = [...singleTrack, ...basePhotos];
          }

          // Two identical halves for a 100% mathematically seamless infinite loop
          const loopedItems = [...singleTrack, ...singleTrack];
          const isLeft = strip.direction === 'left';
          const animationClass = isLeft ? 'animate-kinetic-left' : 'animate-kinetic-right';

          return (
            <div
              key={strip.id}
              className="kinetic-row relative w-full overflow-hidden group cursor-grab active:cursor-grabbing"
              title="Hover to pause this row • Slide right/left to inspect passed memories"
            >
              {/* Subtle Edge Fog / Vignette Fade */}
              <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 bg-gradient-to-r from-[#05070E] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-28 bg-gradient-to-l from-[#05070E] to-transparent z-10 pointer-events-none" />

              {/* Continuous Marquee Track using pure CSS keyframes with instant hover freeze */}
              <div
                style={
                  {
                    '--kinetic-duration': `${strip.speed || 55}s`,
                    willChange: 'transform',
                  } as React.CSSProperties
                }
                className={`flex items-center gap-5 sm:gap-6 w-max px-4 ${animationClass}`}
              >
                {loopedItems.map((item, itemIdx) => {
                  const widthClass =
                    item.aspect === 'landscape'
                      ? 'w-[272px] sm:w-[340px]'
                      : 'w-[204px] sm:w-[238px]';

                  return (
                    <div
                      key={`${item.id}-${itemIdx}`}
                      className={`flex-shrink-0 ${widthClass}`}
                    >
                      <UnifiedMediaCard
                        item={item}
                        aspectRatioClass={
                          item.aspect === 'portrait'
                            ? 'aspect-[3/4]'
                            : 'aspect-[4/3]'
                        }
                        enable3DTilt={true}
                        onOpenItem={onOpenItem}
                        isFavorite={favorites.includes(item.id)}
                        onToggleFavorite={onToggleFavorite}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
