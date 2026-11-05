import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X } from 'lucide-react';
import type { PingType } from './ChaiSplashOverlay';
import { soundEngine } from '../utils/audio';
import { realtimeService } from '../services/supabase';
import { Tooltip } from './Tooltip';

export const QuickPingsBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isElectricFlashing, setIsElectricFlashing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pings: { type: PingType; label: string; emoji: string }[] = [
    { type: 'chai', label: 'Offer Chai ☕', emoji: '☕' },
    { type: 'pizza', label: '2 AM Maggi 🍜', emoji: '🍜' },
    { type: 'laugh', label: 'Inside Joke 😂', emoji: '✨' },
    { type: 'love', label: 'Group Hug ❤️', emoji: '❤️' },
  ];

  // Listen for buzzes from any cousin in the circle to trigger electric flash
  useEffect(() => {
    const unsub = realtimeService.onBuzz(() => {
      triggerElectricFlashAnimation();
    });
    return () => unsub();
  }, []);

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

  const triggerElectricFlashAnimation = () => {
    setIsElectricFlashing(true);
    soundEngine.electricBuzz();
    setTimeout(() => {
      setIsElectricFlashing(false);
    }, 700);
  };

  const handlePing = (ping: typeof pings[0], e: React.MouseEvent) => {
    e.stopPropagation();
    triggerElectricFlashAnimation();
    realtimeService.triggerBuzz(ping.type);
    realtimeService.triggerReaction(ping.emoji);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    soundEngine.tick();
    if (!isOpen) {
      triggerElectricFlashAnimation();
    }
    setIsOpen(!isOpen);
  };

  return (
    <aside
      ref={containerRef}
      aria-label="Kinfolk Electric Buzz"
      className="fixed bottom-6 left-4 sm:left-8 z-40 select-none"
    >
      {/* 1. Popout Tray: Hidden reactions revealed on click */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="absolute bottom-14 left-0 mb-2 p-1.5 rounded-2xl bg-[#141210]/95 backdrop-blur-2xl border border-amber-400/35 shadow-2xl shadow-black/90 flex items-center gap-1"
          >
            <div className="flex items-center gap-1 px-1">
              {pings.map((p) => (
                <Tooltip key={p.type} content={p.label} position="top">
                  <button
                    onClick={(e) => handlePing(p, e)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg hover:bg-white/15 hover:scale-120 active:scale-95 transition-all cursor-pointer"
                    aria-label={p.label}
                  >
                    <span>{p.emoji}</span>
                  </button>
                </Tooltip>
              ))}
            </div>

            <div className="w-px h-5 bg-white/15 mx-0.5" />

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close buzz tray"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Electric Flash Buzz Button (Glassmorphic & Electric Glow) */}
      <Tooltip content={isOpen ? 'Close Buzz' : 'Electric Buzz ⚡'} position="top">
        <motion.button
          onClick={toggleOpen}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          animate={
            isElectricFlashing
              ? {
                  scale: [1, 1.25, 0.95, 1.15, 1],
                  boxShadow: [
                    '0 0 0px rgba(251, 191, 36, 0)',
                    '0 0 30px rgba(251, 191, 36, 0.9)',
                    '0 0 10px rgba(251, 191, 36, 0.4)',
                    '0 0 25px rgba(251, 191, 36, 0.8)',
                    '0 0 12px rgba(251, 191, 36, 0.3)',
                  ],
                }
              : {}
          }
          className={`relative group flex items-center gap-2 p-2.5 sm:px-3 sm:py-2.5 rounded-full backdrop-blur-2xl transition-all duration-300 shadow-xl cursor-pointer ${
            isOpen || isElectricFlashing
              ? 'bg-amber-400/20 border-2 border-amber-400 text-amber-300 shadow-amber-500/30'
              : 'bg-[#141210]/90 border border-white/15 hover:border-amber-400/60 text-[#F8F5EE] shadow-black/80 hover:shadow-amber-500/20'
          }`}
          aria-label="Electric Buzz Trigger"
        >
          {/* Ambient Electric Spark Ring */}
          <span
            className={`absolute -inset-0.5 rounded-full -z-10 blur-sm transition-opacity duration-300 ${
              isElectricFlashing
                ? 'bg-amber-400 opacity-80 animate-pulse'
                : 'bg-amber-400/20 opacity-0 group-hover:opacity-100'
            }`}
          />

          {/* Electric Lightning Bolt Icon */}
          <Zap
            className={`w-4 h-4 transition-transform duration-300 ${
              isElectricFlashing
                ? 'text-amber-300 fill-amber-300 rotate-12 scale-125'
                : 'text-amber-400 group-hover:scale-110'
            }`}
          />

          {/* Discreet text label on desktop */}
          <span className="hidden sm:inline text-xs font-mono font-bold tracking-wider text-amber-300/90 group-hover:text-amber-200">
            BUZZ
          </span>
        </motion.button>
      </Tooltip>
    </aside>
  );
};
