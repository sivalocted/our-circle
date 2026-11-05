import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, Calendar, Sparkles } from 'lucide-react';
import { REAL_PHOTOS } from '../data/circleData';
import { soundEngine } from '../utils/audio';
import { useReducedMotionSetting } from './ReducedMotionContext';

interface MemoryStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryStoryModal: React.FC<MemoryStoryModalProps> = ({ isOpen, onClose }) => {
  const reducedMotion = useReducedMotionSetting();
  // Use up to 16 entries from the local catalog for this slideshow.
  const storyPhotos = REAL_PHOTOS.slice(0, 16);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen || reducedMotion || storyPhotos.length === 0) {
      if (!isOpen) {
        setCurrentIndex(0);
        setProgress(0);
      }
      return;
    }

    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next
          if (currentIndex < storyPhotos.length - 1) {
            soundEngine.flip();
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            onClose();
            return 0;
          }
        }
        return prev + 2; // 5 seconds per slide (50 intervals of 100ms)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, currentIndex, storyPhotos.length, onClose, reducedMotion]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
      if (e.key === 'ArrowRight') {
        if (currentIndex < storyPhotos.length - 1) {
          setCurrentIndex((i) => i + 1);
          setProgress(0);
        }
      }
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex((i) => i - 1);
          setProgress(0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, storyPhotos.length, onClose]);

  if (!isOpen) return null;

  const currentPhoto = storyPhotos[currentIndex];
  if (!currentPhoto) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#120F0E]/97 px-6 text-center text-white">
        <p className="font-serif text-2xl">No memories are available for a slideshow yet.</p>
        <button type="button" onClick={onClose} className="mt-5 rounded-full border border-white/25 px-4 py-2 text-sm">Close</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#120F0E]/97 backdrop-blur-2xl text-white select-none">
      {/* Top Editorial Progress Bars */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-8 z-30 flex gap-1.5">
        {storyPhotos.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] transition-all duration-100 ease-linear"
              style={{
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Top Header Actions */}
      <div className="absolute top-8 inset-x-4 sm:inset-x-8 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-editorial text-xs sm:text-sm font-bold tracking-wide flex items-center gap-2 bg-[#1A1614]/80 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-[#DFBE8A]" />
            <span>Living Chronicle • {currentIndex + 1} of {storyPhotos.length}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10"
            title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
          >
            {isPaused ? <Play className="w-4 h-4 text-[#DFBE8A]" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10"
            title="Close Story (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Touch / Click Zones */}
      <div
        className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-w-resize"
        onClick={() => {
          if (currentIndex > 0) {
            soundEngine.flip();
            setCurrentIndex((i) => i - 1);
            setProgress(0);
          }
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-1/3 z-20 cursor-e-resize"
        onClick={() => {
          if (currentIndex < storyPhotos.length - 1) {
            soundEngine.flip();
            setCurrentIndex((i) => i + 1);
            setProgress(0);
          } else {
            onClose();
          }
        }}
      />

      {/* Main Slide Canvas */}
      <div className="relative max-w-4xl w-full h-[85vh] flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative w-full h-full flex flex-col items-center justify-center"
          >
            <motion.img
              src={currentPhoto.fullUrl}
              alt={currentPhoto.dateFormatted}
              referrerPolicy="no-referrer"
              initial={{ scale: 1 }}
              animate={{ scale: reducedMotion ? 1 : 1.05 }}
              transition={{ duration: reducedMotion ? 0 : 5, ease: 'easeOut' }}
              className="max-h-[72vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/15"
            />

            {/* Bottom Archival Telemetry Plaque */}
            <div className="absolute bottom-4 px-6 py-2.5 rounded-full bg-[#1A1614]/85 backdrop-blur-md border border-[#C89D66]/40 flex items-center gap-3 shadow-2xl">
              <span className="flex items-center gap-1.5 text-xs font-editorial font-bold text-[#DFBE8A]">
                <Calendar className="w-3.5 h-3.5" />
                {currentPhoto.dateFormatted}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs font-mono text-[#D4C8BC]">
                {currentPhoto.timeFormatted}
              </span>
              <span className="text-white/30">•</span>
              <span className="text-xs font-mono text-[#8A7C72]">
                {currentPhoto.width} × {currentPhoto.height}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
