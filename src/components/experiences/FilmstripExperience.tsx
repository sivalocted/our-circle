import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CuratedExperienceState, UnifiedMediaItem } from '../../utils/experienceEngine';
import { UnifiedMediaCard } from '../UnifiedMediaCard';
import { soundEngine } from '../../utils/audio';

interface FilmstripExperienceProps {
  state: CuratedExperienceState;
  onOpenItem: (item: UnifiedMediaItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const FilmstripExperience: React.FC<FilmstripExperienceProps> = ({
  state,
  onOpenItem,
  favorites,
  onToggleFavorite,
}) => {
  const items = state.filmstripItems;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance slide every 5 seconds so photos don't stay static, pauses on hover
  useEffect(() => {
    if (isHovered || items.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, items.length]);

  const prevSlide = () => {
    soundEngine.tick();
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const nextSlide = () => {
    soundEngine.tick();
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const currentItem = items[activeIndex] || items[0];

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full min-h-screen py-10 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center space-y-10"
    >
      {/* Filmstrip Masthead */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-xl mx-auto space-y-2 z-10"
      >
        <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#DFBE8A]/30 text-[#DFBE8A] text-xs font-mono tracking-widest uppercase inline-flex items-center gap-2">
          <Film className="w-3.5 h-3.5 text-[#DFBE8A]" />
          <span>70mm Archival Filmstrip</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
          Celluloid Projection Room
        </h1>
        <p className="text-xs font-mono text-stone-400">
          Continuous analog filmstrip with tactile sprocket reels and focal projection
        </p>
      </motion.div>

      {/* 70mm Celluloid Frame Carousel */}
      <div className="relative w-full max-w-6xl flex items-center justify-center py-8">
        {/* Film Perforations Sprocket Border Top */}
        <div className="absolute top-0 left-0 right-0 h-6 flex justify-between overflow-hidden opacity-30 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={`sprocket-top-${i}`} className="w-3.5 h-4 bg-white/40 rounded-xs mx-1" />
          ))}
        </div>

        {/* Carousel Deck */}
        <div className="relative w-full flex items-center justify-center overflow-hidden py-10">
          <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
            {/* Previous Card Peek */}
            {items[(activeIndex - 1 + items.length) % items.length] && (
              <motion.div
                onClick={prevSlide}
                className="hidden sm:block w-64 aspect-[4/3] rounded-2xl overflow-hidden opacity-40 scale-85 blur-[0.5px] cursor-pointer hover:opacity-70 transition-all flex-shrink-0"
              >
                <UnifiedMediaCard
                  item={items[(activeIndex - 1 + items.length) % items.length]}
                  aspectRatioClass="aspect-[4/3]"
                  onOpenItem={onOpenItem}
                  showDetails={false}
                />
              </motion.div>
            )}

            {/* Active Focal Card */}
            <motion.div
              layoutId="filmstrip-focus"
              className="w-full sm:w-[620px] aspect-[16/10] sm:aspect-[16/9] flex-shrink-0 rounded-3xl overflow-hidden shadow-2xl shadow-black border-2 border-[#DFBE8A]/60 z-20"
            >
              <UnifiedMediaCard
                item={currentItem}
                aspectRatioClass="w-full h-full"
                onOpenItem={onOpenItem}
                isFavorite={favorites.includes(currentItem.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </motion.div>

            {/* Next Card Peek */}
            {items[(activeIndex + 1) % items.length] && (
              <motion.div
                onClick={nextSlide}
                className="hidden sm:block w-64 aspect-[4/3] rounded-2xl overflow-hidden opacity-40 scale-85 blur-[0.5px] cursor-pointer hover:opacity-70 transition-all flex-shrink-0"
              >
                <UnifiedMediaCard
                  item={items[(activeIndex + 1) % items.length]}
                  aspectRatioClass="aspect-[4/3]"
                  onOpenItem={onOpenItem}
                  showDetails={false}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Film Perforations Sprocket Border Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-between overflow-hidden opacity-30 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={`sprocket-bot-${i}`} className="w-3.5 h-4 bg-white/40 rounded-xs mx-1" />
          ))}
        </div>
      </div>

      {/* Projection Navigation Controls */}
      <div className="flex items-center gap-4 z-10">
        <button
          onClick={prevSlide}
          className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-[#DFBE8A] transition-all active:scale-95 shadow-lg"
          title="Previous Frame"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="px-5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-[#DFBE8A]/30 text-xs font-mono text-[#DFBE8A] flex items-center gap-2">
          <span>FRAME {activeIndex + 1} OF {items.length}</span>
          <span className="text-white/40">•</span>
          <span className="text-stone-300">{currentItem.dateFormatted}</span>
        </div>

        <button
          onClick={nextSlide}
          className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white hover:text-[#DFBE8A] transition-all active:scale-95 shadow-lg"
          title="Next Frame"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
