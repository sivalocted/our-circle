import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Layers, Compass } from 'lucide-react';
import type { CuratedExperienceState, UnifiedMediaItem } from '../../utils/experienceEngine';
import { UnifiedMediaCard } from '../UnifiedMediaCard';

interface SpatialExperienceProps {
  state: CuratedExperienceState;
  onOpenItem: (item: UnifiedMediaItem) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
}

export const SpatialExperience: React.FC<SpatialExperienceProps> = ({
  state,
  onOpenItem,
  favorites,
  onToggleFavorite,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (e.clientY - innerHeight / 2) / (innerHeight / 2);
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const { foreground, midground, background } = state.spatialPlanes;
  const [focusOffset, setFocusOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate foreground focal memories every 5s so photos don't stay static, pauses on hover
  useEffect(() => {
    if (isHovered || foreground.length <= 2) return;
    const interval = setInterval(() => {
      setFocusOffset((prev) => (prev + 1) % foreground.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, foreground.length]);

  const activeForeground =
    foreground.length > 2
      ? [
          foreground[focusOffset % foreground.length],
          foreground[(focusOffset + 1) % foreground.length],
        ]
      : foreground;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full min-h-screen py-10 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden flex flex-col items-center"
    >
      {/* Spatial Masthead */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-xl mx-auto space-y-2 mb-8 z-30"
      >
        <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#DFBE8A]/30 text-[#DFBE8A] text-xs font-mono tracking-widest uppercase inline-flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#DFBE8A]" />
          <span>Spatial Depth & Planes</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
          Volumetric Memory Field
        </h1>
        <p className="text-xs font-mono text-stone-400">
          Move your cursor to navigate through multi-layered holographic depth
        </p>
      </motion.div>

      {/* 3D Depth Viewport */}
      <div className="relative w-full min-h-[750px] flex items-center justify-center">
        {/* Layer 1: Background Plane (Deep Z, Slower Mouse Shift, Subtle Blur) */}
        <motion.div
          style={{
            x: mousePos.x * -15,
            y: mousePos.y * -15,
          }}
          transition={{ type: 'spring', damping: 25, stiffness: 100 }}
          className="absolute inset-0 grid grid-cols-2 sm:grid-cols-4 gap-8 opacity-40 blur-[1px] scale-95 pointer-events-auto"
        >
          {background.slice(0, 4).map((item) => (
            <div key={`bg-${item.id}`} className="transform scale-90">
              <UnifiedMediaCard
                item={item}
                aspectRatioClass="aspect-[4/3]"
                onOpenItem={onOpenItem}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={onToggleFavorite}
                showDetails={false}
              />
            </div>
          ))}
        </motion.div>

        {/* Layer 2: Midground Plane (Medium Z, Standard Parallax) */}
        <motion.div
          style={{
            x: mousePos.x * -35,
            y: mousePos.y * -35,
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 120 }}
          className="absolute inset-0 grid grid-cols-1 sm:grid-cols-3 gap-8 items-center px-6 z-10 pointer-events-auto"
        >
          {midground.slice(0, 3).map((item) => (
            <div key={`mid-${item.id}`} className="transform hover:scale-105 transition-transform duration-300">
              <UnifiedMediaCard
                item={item}
                aspectRatioClass={item.aspect === 'portrait' ? 'aspect-[3/4]' : 'aspect-[4/3]'}
                onOpenItem={onOpenItem}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </motion.div>

        {/* Layer 3: Foreground Plane (Near Z, High Responsiveness, Crisp Focus) */}
        <motion.div
          style={{
            x: mousePos.x * -65,
            y: mousePos.y * -65,
          }}
          transition={{ type: 'spring', damping: 15, stiffness: 150 }}
          className="relative z-20 grid grid-cols-1 sm:grid-cols-2 gap-12 max-w-3xl w-full pointer-events-auto"
        >
          {activeForeground.map((item) => (
            <div key={`fg-${item.id}`} className="transform scale-105 shadow-2xl">
              <UnifiedMediaCard
                item={item}
                aspectRatioClass="aspect-[16/10]"
                onOpenItem={onOpenItem}
                isFavorite={favorites.includes(item.id)}
                onToggleFavorite={onToggleFavorite}
              />
              <div className="mt-2 flex items-center justify-between text-xs font-mono text-[#DFBE8A]">
                <span>{item.year ? `FOREGROUND FOCUS // ${item.year}` : 'FOREGROUND FOCUS'}</span>
                <span>{item.dateFormatted}</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Spatial Compass HUD */}
      <div className="mt-8 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-3 text-xs font-mono text-stone-400">
        <Compass className="w-4 h-4 text-[#DFBE8A] animate-spin" style={{ animationDuration: '20s' }} />
        <span>SPATIAL DEPTH VECTOR: X={mousePos.x.toFixed(2)} Y={mousePos.y.toFixed(2)}</span>
      </div>
    </div>
  );
};
