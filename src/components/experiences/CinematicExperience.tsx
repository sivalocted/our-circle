import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Sparkles, Volume2, VolumeX, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CuratedExperienceState, UnifiedMediaItem } from '../../utils/experienceEngine';
import { UnifiedMediaCard } from '../UnifiedMediaCard';
import { SafeImage } from '../SafeImage';
import { soundEngine } from '../../utils/audio';

interface CinematicExperienceProps {
  state: CuratedExperienceState;
  onOpenItem: (item: UnifiedMediaItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const CinematicExperience: React.FC<CinematicExperienceProps> = ({
  state,
  onOpenItem,
  favorites,
  onToggleFavorite,
}) => {
  const [activeHero, setActiveHero] = useState<UnifiedMediaItem | null>(state.heroItem);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Satellites exclude active hero
  const satellites = state.floatingSatellites.filter((s) => s.id !== activeHero?.id).slice(0, 8);

  // When state/heroItem changes (e.g. on shuffle), sync activeHero
  useEffect(() => {
    setActiveHero(state.heroItem);
  }, [state.heroItem]);

  // Auto-cycle hero photo every ~5 seconds so photos don't stay static, pauses when hovered
  useEffect(() => {
    const heroItem = state.heroItem;
    const currentHero = activeHero;
    if (isHovered || !heroItem || !currentHero) return;
    const interval = setInterval(() => {
      const all = [heroItem, ...state.floatingSatellites];
      if (all.length <= 1) return;
      const currentIndex = all.findIndex((i) => i.id === currentHero.id);
      const nextIndex = (currentIndex + 1) % all.length;
      setActiveHero(all[nextIndex] ?? heroItem);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, activeHero, state.heroItem, state.floatingSatellites]);

  const handlePromoteToHero = (item: UnifiedMediaItem) => {
    soundEngine.chime();
    setActiveHero(item);
  };

  const cycleHero = (dir: 'next' | 'prev') => {
    soundEngine.tick();
    if (!state.heroItem || !activeHero) return;
    const heroItem = state.heroItem;
    const currentHero = activeHero;
    if (!heroItem || !currentHero) return;
    const all = [heroItem, ...state.floatingSatellites];
    const currentIndex = all.findIndex((i) => i.id === currentHero.id);
    const nextIndex =
      dir === 'next'
        ? (currentIndex + 1) % all.length
        : (currentIndex - 1 + all.length) % all.length;
    setActiveHero(all[nextIndex] ?? heroItem);
  };

  const activeHeroItem = activeHero;
  if (!state.heroItem || !activeHeroItem) return null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full min-h-screen py-6 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center"
    >
      {/* Editorial Badge / Stage Introduction */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-4 text-center"
      >
        <span className="px-3 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-[#DFBE8A]/30 text-[#DFBE8A] text-[11px] font-mono tracking-widest uppercase flex items-center gap-1.5">
          <Film className="w-3 h-3 text-[#DFBE8A]" />
          <span>CINEMATIC STAGE</span>
        </span>
      </motion.div>

      {/* Main Cinematic Viewport with Floating Satellites Surrounding It */}
      <div className="relative w-full max-w-4xl my-2">
        {/* Glow Halo behind Stage */}
        <div className="absolute inset-0 bg-[#DFBE8A]/10 blur-[80px] rounded-full pointer-events-none -z-10" />

        {/* Central Stage Container */}
        <motion.div
          layoutId={`stage-hero-${activeHeroItem.id}`}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full aspect-[16/9] max-h-[56vh] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#DFBE8A]/30 bg-black/60 backdrop-blur-2xl shadow-2xl shadow-black/80 group"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHeroItem.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full relative"
            >
              {activeHeroItem.type === 'video' ? (
                <video
                  src={activeHeroItem.videoUrl || activeHeroItem.url}
                  poster={activeHeroItem.cardUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <SafeImage
                  src={activeHeroItem.fullUrl || activeHeroItem.cardUrl}
                  alt={activeHeroItem.dateFormatted}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

              {/* Top Controls Bar */}
              <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-20">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-mono text-[#DFBE8A]">
                    {activeHeroItem.type === 'video' ? 'LIVE ARCHIVE FILM' : 'HIGH-RES CAPTURE'}
                  </span>
                  <span className="text-xs font-mono text-stone-300 hidden sm:inline">
                    {activeHeroItem.dateFormatted}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activeHeroItem.type === 'video' && (
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all"
                      title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#DFBE8A]" />}
                    </button>
                  )}
                  <button
                    onClick={() => onOpenItem(activeHeroItem)}
                    className="p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white hover:text-[#DFBE8A] transition-all"
                    title="Fullscreen Lightbox"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bottom HUD: Title, EXIF, and Navigation Arrows */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-20">
                <div>
                  <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white tracking-tight drop-shadow-md">
                    {activeHeroItem.title || activeHeroItem.dateFormatted}
                  </h2>
                  <p className="text-xs sm:text-sm font-mono text-[#DFBE8A] mt-1 drop-shadow">
                    {activeHeroItem.timeFormatted ? `${activeHeroItem.timeFormatted} • ` : ''}
                    {activeHeroItem.year ? `Family archive • Year ${activeHeroItem.year}` : 'Family archive'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cycleHero('prev')}
                    className="p-3 rounded-full bg-black/60 hover:bg-black/90 text-white hover:text-[#DFBE8A] border border-white/20 transition-transform active:scale-90"
                    title="Previous Highlight"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => cycleHero('next')}
                    className="p-3 rounded-full bg-black/60 hover:bg-black/90 text-white hover:text-[#DFBE8A] border border-white/20 transition-transform active:scale-90"
                    title="Next Highlight"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Floating Satellites Ribbon / Surrounding Constellation */}
      <div className="w-full mt-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#DFBE8A]" />
            <h3 className="text-sm font-mono uppercase tracking-wider text-[#DFBE8A]">
              Floating Orbital Satellites • Click Any To Project
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-400">
            {satellites.length} Companion Memories
          </span>
        </div>

        {/* Floating Satellites Grid with Natural Aspect Ratios & 3D Tilt */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
          {satellites.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => handlePromoteToHero(item)}
              className="relative cursor-pointer group"
            >
              <UnifiedMediaCard
                item={item}
                aspectRatioClass={item.aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'}
                onOpenItem={() => handlePromoteToHero(item)}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={onToggleFavorite}
              />
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-stone-400 px-1">
                <span className="truncate">{item.dateFormatted}</span>
                <span className="text-[#DFBE8A] group-hover:underline">Project ↗</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
