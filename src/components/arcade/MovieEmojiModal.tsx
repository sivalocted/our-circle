import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Film, Trophy, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getDailyMovie,
  getRandomPracticeMovie,
  type MovieChallenge,
} from '../../services/contentEngine/movieEmojiService';
import { getISTDateString, getISTDayNumber } from '../../services/contentEngine/istTime';
import { arcadeStore } from '../../services/contentEngine/arcadeStore';
import { soundEngine } from '../../utils/audio';
import { toastManager } from '../ActivityToasts';

interface MovieEmojiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MovieEmojiModal: React.FC<MovieEmojiModalProps> = ({ isOpen, onClose }) => {
  const [isDaily, setIsDaily] = useState(true);
  const [movie, setMovie] = useState<MovieChallenge | null>(null);
  const [guessInput, setGuessInput] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showHint, setShowHint] = useState(false);

  const dateKey = getISTDateString();
  const dayNumber = getISTDayNumber();

  const startRound = useCallback((daily: boolean) => {
    setIsDaily(daily);
    setGuessInput('');
    setGuesses([]);
    setGameStatus('playing');
    setShowHint(false);

    if (daily) {
      setMovie(getDailyMovie(dateKey));
    } else {
      setMovie(getRandomPracticeMovie());
    }
  }, [dateKey]);

  useEffect(() => {
    if (isOpen) {
      startRound(true);
    }
  }, [isOpen, startRound]);

  const submitGuess = (guessText: string) => {
    if (!movie || gameStatus !== 'playing') return;

    soundEngine.tick();
    const updated = [...guesses, guessText];
    setGuesses(updated);
    setGuessInput('');

    if (guessText.trim().toLowerCase() === movie.title.toLowerCase()) {
      setGameStatus('won');
      soundEngine.chime();
      confetti({ particleCount: 50, spread: 75, origin: { y: 0.6 } });
      toastManager.showToast(`Cinema Master! Correct: ${movie.title} 🎬`);
      arcadeStore.recordGameResult('movie', true, isDaily, 10, `Solved in ${updated.length} guess(es)`);
      return;
    }

    if (updated.length >= 3) {
      setGameStatus('lost');
      soundEngine.tick();
      toastManager.showToast(`Movie was: ${movie.title}`);
      arcadeStore.recordGameResult('movie', false, isDaily, 0, `Missed (${movie.title})`);
    } else {
      setShowHint(true);
      toastManager.showToast('Incorrect guess. Hint revealed below!');
    }
  };

  if (!isOpen || !movie) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#141210] border border-[#DFBE8A]/35 p-5 sm:p-6 text-white shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Film className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <span>Movie Emoji Decode</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {isDaily ? `Daily #${dayNumber}` : 'Practice'}
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-stone-400">
                  Guess the iconic film from emoji clues
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startRound(!isDaily)}
                className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                title={isDaily ? 'Switch to Practice Mode' : 'Switch to Daily Puzzle'}
              >
                <RotateCw className="w-3 h-3 text-[#DFBE8A]" />
                <span className="hidden sm:inline">{isDaily ? 'Practice' : 'Daily'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Emoji Showcase */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 text-center my-3 shadow-inner">
            <div className="text-4xl sm:text-5xl tracking-widest mb-3 filter drop-shadow-md">
              {movie.emojis}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-stone-300">
              <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10">
                Year: {movie.year}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10">
                {movie.genres.join(' • ')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10">
                Dir: {movie.director}
              </span>
            </div>
          </div>

          {/* Clue Synopsis */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs sm:text-sm text-stone-300 font-sans leading-relaxed mb-4">
            <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block mb-1">
              Plot Synopsis:
            </span>
            {movie.clue}
          </div>

          {/* Letter Pattern Hint */}
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 mb-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-center text-xs font-mono tracking-widest text-amber-300 font-bold"
            >
              Hint: {movie.hintStars}
            </motion.div>
          )}

          {/* Guesses list */}
          {guesses.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {guesses.map((g, i) => (
                <span
                  key={i}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
                    g.toLowerCase() === movie.title.toLowerCase()
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-rose-600/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {g} {g.toLowerCase() === movie.title.toLowerCase() ? '✓' : '✗'}
                </span>
              ))}
            </div>
          )}

          {/* Input or Result */}
          {gameStatus === 'playing' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (guessInput.trim()) submitGuess(guessInput.trim());
              }}
              className="flex items-center gap-2 mt-auto"
            >
              <input
                type="text"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type movie title..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#DFBE8A] text-white text-xs font-mono outline-none"
              />
              <button
                type="submit"
                disabled={!guessInput.trim()}
                className="px-4 py-2.5 rounded-2xl text-xs font-mono font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black disabled:opacity-40 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                Guess
              </button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center space-y-2 mt-auto"
            >
              <div className="text-sm font-serif font-bold text-white flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>
                  {gameStatus === 'won' ? `Splendid! It was ${movie.title}` : `Movie was: ${movie.title}`}
                </span>
              </div>

              {!isDaily ? (
                <button
                  onClick={() => startRound(false)}
                  className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  Next Movie
                </button>
              ) : (
                <div className="text-[10px] font-mono text-stone-400">
                  Daily movie completed for today 🎬
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
