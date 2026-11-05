import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, Film, BookOpen, Layers, X, ChevronUp, Zap, ArrowLeft } from 'lucide-react';
import type { ExperienceType } from '../utils/experienceEngine';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Tooltip } from './Tooltip';
import { useReducedMotionSetting } from './ReducedMotionContext';

interface ExperienceControllerProps {
  currentArchetype: ExperienceType;
  onChangeArchetype: (archetype: ExperienceType) => void;
  onShuffle: () => void;
  onOpenStory: () => void;
}

export const ExperienceController: React.FC<ExperienceControllerProps> = ({
  currentArchetype,
  onChangeArchetype,
  onShuffle,
  onOpenStory,
}) => {
  const reducedMotion = useReducedMotionSetting();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion is the main page by default; the alternative list contains Cinema, Editorial, Spatial, Filmstrip
  const alternativeModes: { id: ExperienceType; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'cinematic', label: 'Cinema', icon: Film, description: 'Cinematic Stage' },
    { id: 'editorial', label: 'Editorial', icon: BookOpen, description: 'Art Monograph Spreads' },
    { id: 'spatial', label: 'Spatial', icon: Layers, description: '3D Depth Planes' },
    { id: 'filmstrip', label: 'Filmstrip', icon: Film, description: '70mm Celluloid Reel' },
  ];

  const isMainMotion = currentArchetype === 'motion';
  const currentMode = isMainMotion
    ? { id: 'motion' as ExperienceType, label: 'Motion', icon: Zap, description: 'Main Kinetic Stream' }
    : alternativeModes.find((m) => m.id === currentArchetype) || alternativeModes[0];
  const CurrentIcon = currentMode.icon;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleShuffleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.chime();
    if (!reducedMotion) confetti({
      particleCount: 28,
      spread: 60,
      origin: { y: 0.9, x: 0.8 },
      colors: ['#DFBE8A', '#C89D66', '#FFFFFF', '#F5E8D3'],
    });
    // Shuffle photos only within the current active view!
    onShuffle();
  };

  const handleSelectMode = (id: ExperienceType) => {
    soundEngine.tick();
    onChangeArchetype(id);
    setIsOpen(false);
  };

  return (
    <aside
      ref={containerRef}
      aria-label="Experience & Photo Shuffle Controls"
      className="fixed bottom-22 right-4 sm:bottom-6 sm:right-24 z-40 select-none"
    >
      {/* 1. Popout Tray: List containing Cinema, Editorial, Spatial, Filmstrip */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="absolute bottom-14 right-0 mb-2 p-1.5 rounded-2xl bg-[#141210]/95 backdrop-blur-2xl border border-amber-400/35 shadow-2xl shadow-black/90 flex flex-col gap-1 min-w-[210px]"
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10 mb-0.5">
              <span className="text-[10px] font-mono tracking-wider text-stone-400 uppercase font-semibold">
                Alternative Modes
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 rounded-md flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close mode menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Back to Motion (Main Page) button if on alternative mode */}
            {!isMainMotion && (
              <button
                onClick={() => handleSelectMode('motion')}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono font-bold bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 border border-amber-400/40 flex items-center gap-2 mb-1 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
                <span>Back to Motion (Main)</span>
              </button>
            )}

            <div className="flex flex-col gap-1 p-0.5">
              {alternativeModes.map((mode) => {
                const Icon = mode.icon;
                const active = currentArchetype === mode.id;

                return (
                  <button
                    key={mode.id}
                    onClick={() => handleSelectMode(mode.id)}
                    className={`relative w-full px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all duration-200 flex items-center justify-between gap-2.5 cursor-pointer text-left ${
                      active
                        ? 'bg-gradient-to-r from-amber-400/20 to-amber-500/10 border border-amber-400/40 text-amber-200 font-bold'
                        : 'text-stone-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-stone-400'}`} />
                      <span>{mode.label}</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-sans font-normal opacity-80">
                      {mode.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Glassmorphic Side Trigger Pill (No overlap with chat button) */}
      <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#141210]/95 backdrop-blur-2xl border border-white/15 hover:border-amber-400/50 shadow-2xl shadow-black/90 transition-all">
        {/* Shuffle Button: Re-shuffles photos without changing the mode */}
        <Tooltip content="Shuffle Photos In View 🎲" position="top">
          <motion.button
            onClick={handleShuffleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-[#1A1614] text-xs font-mono font-bold hover:brightness-110 transition-all shadow-md cursor-pointer group"
          >
            <Dices className="w-3.5 h-3.5 text-[#1A1614] group-hover:rotate-180 transition-transform duration-500" />
            <span className="tracking-wide">Shuffle</span>
          </motion.button>
        </Tooltip>

        <Tooltip content="Play a memory slideshow" position="top">
          <button type="button" onClick={onOpenStory} aria-label="Play a memory slideshow" className="flex h-9 w-9 items-center justify-center rounded-full text-stone-200 transition hover:bg-white/10 hover:text-white">
            <BookOpen className="h-4 w-4 text-[#DFBE8A]" />
          </button>
        </Tooltip>

        <div className="w-px h-5 bg-white/15 mx-0.5" />

        {/* Mode Selector Button (Shows Motion on main page, or current alternative mode) */}
        <Tooltip content={isOpen ? 'Close Modes' : `Current: ${currentMode.label}`} position="top">
          <motion.button
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
              isOpen
                ? 'bg-amber-400/20 border border-amber-400 text-amber-300'
                : 'bg-white/5 hover:bg-white/15 text-stone-200 border border-transparent'
            }`}
          >
            <CurrentIcon className="w-3.5 h-3.5 text-[#DFBE8A]" />
            <span className="hidden sm:inline">{currentMode.label}</span>
            <ChevronUp
              className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-300 ${
                isOpen ? 'rotate-180 text-amber-400' : ''
              }`}
            />
          </motion.button>
        </Tooltip>
      </div>
    </aside>
  );
};
