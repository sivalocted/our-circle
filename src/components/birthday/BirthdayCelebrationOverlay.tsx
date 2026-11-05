import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, X, Sparkles } from 'lucide-react';
import { birthdayService, type BirthdayCelebrant } from '../../services/birthdayService';
import { soundEngine } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router';

export const BirthdayCelebrationOverlay: React.FC = () => {
  const [celebrant, setCelebrant] = useState<BirthdayCelebrant | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = birthdayService.onCelebrationChange((active) => {
      setCelebrant(active);
    });
    return () => unsub();
  }, []);

  if (!celebrant) return null;

  const handleMoreConfetti = () => {
    soundEngine.chime();
    confetti({
      particleCount: 60,
      spread: 80,
      origin: { y: 0.25 },
      colors: ['#FFB703', '#DFBE8A', '#FF007F', '#FFFFFF'],
    });
  };

  const handleScrollToMemories = () => {
    soundEngine.tick();
    navigate('/memories');
  };

  const handleDismiss = () => {
    soundEngine.tick();
    birthdayService.dismissCelebration();
  };

  return (
    <AnimatePresence>
      <div className="fixed top-16 left-0 right-0 z-50 pointer-events-none flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="pointer-events-auto relative w-full max-w-xl rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-[#2A1810]/95 via-[#1E140F]/95 to-[#150F0D]/95 backdrop-blur-2xl border-2 border-amber-400/70 shadow-2xl shadow-amber-950/70 text-white select-none overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Celebrant Cameo Avatar */}
              <div className="relative">
                <img
                  src={celebrant.avatarUrl}
                  alt={celebrant.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-lg ring-4 ring-amber-400/20"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-xs shadow-md">
                  🎂
                </div>
              </div>

              {/* Congratulatory Text */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300 font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>BIRTHDAY SURPRISE TODAY!</span>
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Happy Birthday, {celebrant.name}!</span>
                  {celebrant.age && (
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-white/10 text-stone-300">
                      Turning {celebrant.age} 🎈
                    </span>
                  )}
                </h3>
                <p className="text-[11px] font-sans text-stone-300">
                  Wishing you lifelong laughter, unforgettable adventures, and endless joy!
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleMoreConfetti}
                className="w-8 h-8 rounded-full bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                title="Celebrate with Confetti 🥳"
                aria-label="Celebrate"
              >
                <PartyPopper className="w-4 h-4" />
              </button>

              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-stone-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick link button to scroll to their memories */}
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
            <button
              onClick={handleScrollToMemories}
              className="text-xs font-mono font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
            >
              <span>Open the memories archive</span>
              <span>↓</span>
            </button>

            <span className="text-[10px] font-mono text-stone-400">
              Asia/Kolkata IST Special
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
