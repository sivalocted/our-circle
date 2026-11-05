import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Share2, RotateCw, Sparkles, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getDailyWordle,
  getRandomPracticeWord,
  isValidWordleGuess,
  evaluateWordleGuess,
  type LetterStatus,
} from '../../services/contentEngine/wordleService';
import {
  getISTDateString,
  getISTDayNumber,
  getTimeUntilNextISTMidnight,
} from '../../services/contentEngine/istTime';
import { arcadeStore } from '../../services/contentEngine/arcadeStore';
import { soundEngine } from '../../utils/audio';
import { toastManager } from '../ActivityToasts';

interface DailyWordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export const DailyWordModal: React.FC<DailyWordModalProps> = ({ isOpen, onClose }) => {
  const [isDaily, setIsDaily] = useState(true);
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [letterStatuses, setLetterStatuses] = useState<Record<string, LetterStatus>>({});
  const [stats, setStats] = useState(() => arcadeStore.getStats('wordle'));
  const [timeUntilMidnight, setTimeUntilMidnight] = useState('');

  const dateKey = getISTDateString();
  const dayNumber = getISTDayNumber();

  // Reset or initialize round
  const startRound = useCallback((daily: boolean) => {
    setIsDaily(daily);
    setCurrentGuess('');

    if (daily) {
      const dailyObj = getDailyWordle(dateKey);
      setTargetWord(dailyObj.word);

      // Check if already completed today
      const alreadyDone = arcadeStore.isDailyCompleted('wordle', dateKey);
      if (alreadyDone) {
        setGuesses([dailyObj.word]);
        setGameStatus('won');
        return;
      }
    } else {
      setTargetWord(getRandomPracticeWord());
    }

    setGuesses([]);
    setGameStatus('playing');
    setLetterStatuses({});
  }, [dateKey]);

  useEffect(() => {
    if (isOpen) {
      startRound(true);
      setStats(arcadeStore.getStats('wordle'));
    }
  }, [isOpen, startRound]);

  // IST countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilMidnight(getTimeUntilNextISTMidnight().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleKeyPress = useCallback((char: string) => {
    if (gameStatus !== 'playing') return;

    if (char === 'ENTER') {
      if (currentGuess.length !== 5) {
        toastManager.showToast('Word must be 5 letters');
        soundEngine.tick();
        return;
      }

      if (!isValidWordleGuess(currentGuess)) {
        toastManager.showToast('Not in word list');
        soundEngine.tick();
        return;
      }

      soundEngine.tick();
      const updatedGuesses = [...guesses, currentGuess];
      setGuesses(updatedGuesses);
      setCurrentGuess('');

      // Evaluate new letter statuses for on-screen keyboard
      const evalRow = evaluateWordleGuess(currentGuess, targetWord);
      setLetterStatuses((prev) => {
        const next = { ...prev };
        currentGuess.split('').forEach((letter, i) => {
          const status = evalRow[i];
          const current = next[letter];
          if (status === 'correct') {
            next[letter] = 'correct';
          } else if (status === 'present' && current !== 'correct') {
            next[letter] = 'present';
          } else if (!current) {
            next[letter] = 'absent';
          }
        });
        return next;
      });

      // Win condition
      if (currentGuess === targetWord) {
        setGameStatus('won');
        soundEngine.chime();
        confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
        toastManager.showToast(`Splendid! Solved in ${updatedGuesses.length}/6 🏆`);
        arcadeStore.recordGameResult('wordle', true, isDaily, 10, `${updatedGuesses.length}/6 guesses`, updatedGuesses.length);
        setStats(arcadeStore.getStats('wordle'));
        return;
      }

      // Loss condition
      if (updatedGuesses.length >= 6) {
        setGameStatus('lost');
        soundEngine.tick();
        toastManager.showToast(`Word was: ${targetWord}`);
        arcadeStore.recordGameResult('wordle', false, isDaily, 0, 'Missed target');
        setStats(arcadeStore.getStats('wordle'));
      }
    } else if (char === 'BACK' || char === 'BACKSPACE') {
      soundEngine.tick();
      setCurrentGuess((prev) => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(char)) {
      if (currentGuess.length < 5) {
        soundEngine.tick();
        setCurrentGuess((prev) => prev + char);
      }
    }
  }, [currentGuess, gameStatus, guesses, isDaily, targetWord]);

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACK');
      } else {
        const char = e.key.toUpperCase();
        if (/^[A-Z]$/.test(char)) {
          handleKeyPress(char);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyPress]);

  const handleShareResult = () => {
    soundEngine.chime();
    const rows = guesses.map((g) => {
      const evalRow = evaluateWordleGuess(g, targetWord);
      return evalRow
        .map((s) => (s === 'correct' ? '🟩' : s === 'present' ? '🟨' : '⬛'))
        .join('');
    });

    const shareText = `Our Circle Daily Word #${dayNumber} ${guesses.length}/6\n\n${rows.join('\n')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      toastManager.showToast('Results copied to clipboard! 📋');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#141210] border border-[#DFBE8A]/35 p-4 sm:p-6 text-white shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <span>Daily Word</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {isDaily ? `#${dayNumber}` : 'Practice'}
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-stone-400">
                  {isDaily ? 'Daily puzzle · Resets at midnight IST' : 'Unlimited training mode'}
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
                <span className="hidden sm:inline">{isDaily ? 'Practice Mode' : 'Daily Challenge'}</span>
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

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-2 mb-4 p-2 rounded-2xl bg-white/5 border border-white/5 text-center">
            <div>
              <div className="text-sm font-mono font-bold text-white">{stats.played}</div>
              <div className="text-[9px] font-mono text-stone-400">Played</div>
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0}%
              </div>
              <div className="text-[9px] font-mono text-stone-400">Win Rate</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-sm font-mono font-bold text-amber-300 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{stats.currentStreak}</span>
              </div>
              <div className="text-[9px] font-mono text-stone-400">Streak</div>
            </div>
            <div>
              <div className="text-sm font-mono font-bold text-white">{stats.maxStreak}</div>
              <div className="text-[9px] font-mono text-stone-400">Max Streak</div>
            </div>
          </div>

          {/* 6x5 Wordle Board */}
          <div className="grid grid-rows-6 gap-1.5 max-w-[280px] sm:max-w-[310px] mx-auto w-full mb-4">
            {Array.from({ length: 6 }).map((_, rowIdx) => {
              const isPastRow = rowIdx < guesses.length;
              const isCurrentRow = rowIdx === guesses.length;
              const guess = isPastRow ? guesses[rowIdx] : isCurrentRow ? currentGuess : '';
              const evalStatuses = isPastRow ? evaluateWordleGuess(guess, targetWord) : [];

              return (
                <div key={rowIdx} className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 5 }).map((_, colIdx) => {
                    const letter = guess[colIdx] || '';
                    const status = evalStatuses[colIdx];

                    let bgClass = 'bg-black/40 border-white/15 text-white';
                    if (status === 'correct') {
                      bgClass = 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/30';
                    } else if (status === 'present') {
                      bgClass = 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/30';
                    } else if (status === 'absent') {
                      bgClass = 'bg-stone-800 border-stone-700 text-stone-400';
                    } else if (letter) {
                      bgClass = 'bg-white/10 border-white/40 text-white scale-105';
                    }

                    return (
                      <motion.div
                        key={colIdx}
                        layout
                        initial={letter ? { scale: 0.85 } : false}
                        animate={{ scale: 1 }}
                        className={`aspect-square rounded-xl border flex items-center justify-center font-mono font-bold text-base sm:text-lg transition-colors ${bgClass}`}
                      >
                        {letter}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Outcome Action / Next Puzzle Banner */}
          {gameStatus !== 'playing' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 mb-3 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center space-y-2"
            >
              <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-300">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{gameStatus === 'won' ? 'Brilliant Victory!' : `The Word Was: ${targetWord}`}</span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleShareResult}
                  className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Results</span>
                </button>

                {!isDaily ? (
                  <button
                    onClick={() => startRound(false)}
                    className="px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    Next Practice Word
                  </button>
                ) : (
                  <div className="text-[10px] font-mono text-stone-400">
                    Next daily word in: <span className="text-amber-300 font-bold">{timeUntilMidnight}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* On-Screen Keyboard */}
          <div className="space-y-1.5 w-full mt-auto">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
                {row.map((k) => {
                  const status = letterStatuses[k];
                  let keyBg = 'bg-white/10 text-white hover:bg-white/20';
                  if (status === 'correct') keyBg = 'bg-emerald-600 text-white font-bold';
                  else if (status === 'present') keyBg = 'bg-amber-600 text-white font-bold';
                  else if (status === 'absent') keyBg = 'bg-stone-800 text-stone-500';

                  const isWide = k === 'ENTER' || k === 'BACK';

                  return (
                    <button
                      key={k}
                      onClick={() => handleKeyPress(k)}
                      className={`h-10 sm:h-11 rounded-lg sm:rounded-xl font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center ${keyBg} ${
                        isWide ? 'px-2.5 sm:px-3 text-[10px]' : 'flex-1 max-w-[34px] sm:max-w-[38px]'
                      }`}
                    >
                      {k === 'BACK' ? '⌫' : k}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
