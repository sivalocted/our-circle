import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Trophy, RotateCw, Flag } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getDailyCountry,
  getRandomPracticeCountry,
  getAllCountryNames,
  type CountryChallenge,
} from '../../services/contentEngine/countryService';
import { getISTDateString, getISTDayNumber } from '../../services/contentEngine/istTime';
import { arcadeStore } from '../../services/contentEngine/arcadeStore';
import { soundEngine } from '../../utils/audio';
import { toastManager } from '../ActivityToasts';

interface GuessCountryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuessCountryModal: React.FC<GuessCountryModalProps> = ({ isOpen, onClose }) => {
  const [isDaily, setIsDaily] = useState(true);
  const [challenge, setChallenge] = useState<CountryChallenge | null>(null);
  const [unlockedClues, setUnlockedClues] = useState(1);
  const [guessInput, setGuessInput] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);

  const dateKey = getISTDateString();
  const dayNumber = getISTDayNumber();
  const allNames = getAllCountryNames();

  const startRound = useCallback((daily: boolean) => {
    setIsDaily(daily);
    setUnlockedClues(1);
    setGuessInput('');
    setGuesses([]);
    setGameStatus('playing');
    setFilteredCountries([]);

    if (daily) {
      setChallenge(getDailyCountry(dateKey));
    } else {
      setChallenge(getRandomPracticeCountry());
    }
  }, [dateKey]);

  useEffect(() => {
    if (isOpen) {
      startRound(true);
    }
  }, [isOpen, startRound]);

  // Autocomplete filtering
  useEffect(() => {
    if (!guessInput.trim() || gameStatus !== 'playing') {
      setFilteredCountries([]);
      return;
    }
    const q = guessInput.toLowerCase();
    const matches = allNames.filter((name) => name.toLowerCase().includes(q)).slice(0, 5);
    setFilteredCountries(matches);
  }, [guessInput, allNames, gameStatus]);

  const submitGuess = (name: string) => {
    if (!challenge || gameStatus !== 'playing') return;

    soundEngine.tick();
    const updated = [...guesses, name];
    setGuesses(updated);
    setGuessInput('');
    setFilteredCountries([]);

    if (name.toLowerCase() === challenge.name.toLowerCase()) {
      // Won!
      setGameStatus('won');
      setUnlockedClues(3);
      soundEngine.chime();
      confetti({ particleCount: 50, spread: 75, origin: { y: 0.6 } });
      const pts = unlockedClues === 1 ? 10 : unlockedClues === 2 ? 6 : 3;
      toastManager.showToast(`Correct! Solved on Clue ${unlockedClues} (+${pts} pts) 🌍`);
      arcadeStore.recordGameResult('country', true, isDaily, pts, `Solved on Clue ${unlockedClues}`);
      return;
    }

    // Unlock next clue if available
    if (unlockedClues < 3) {
      setUnlockedClues((c) => c + 1);
      toastManager.showToast(`Not ${name}. Clue ${unlockedClues + 1} unlocked!`);
    } else {
      // Max clues reached and 3 incorrect guesses
      if (updated.length >= 3) {
        setGameStatus('lost');
        soundEngine.tick();
        toastManager.showToast(`Country was: ${challenge.name}`);
        arcadeStore.recordGameResult('country', false, isDaily, 0, `Missed (${challenge.name})`);
      }
    }
  };

  if (!isOpen || !challenge) return null;

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
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <span>Guess the Country</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {isDaily ? `Daily #${dayNumber}` : 'Practice'}
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-stone-400">
                  Global Atlas • Progressive Clue Unlocks
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

          {/* Progressive Clues Accordion */}
          <div className="space-y-3 mb-4">
            {/* Clue 1 */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <span>Clue 1: Geography & Landscape</span>
                <span className="text-emerald-400 text-[9px]">(10 Pts)</span>
              </div>
              <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans">
                {challenge.clues[0]}
              </p>
            </div>

            {/* Clue 2 */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                unlockedClues >= 2
                  ? 'bg-white/5 border-white/10'
                  : 'bg-black/40 border-white/5 opacity-50'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between">
                <span>Clue 2: Culture & Capital</span>
                <span className="text-amber-300 text-[9px]">(6 Pts)</span>
              </div>
              {unlockedClues >= 2 ? (
                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-sans mt-1">
                  {challenge.clues[1]}
                </p>
              ) : (
                <div className="text-[11px] font-mono text-stone-500 italic mt-1">
                  🔒 Submit 1 guess to unlock Clue 2
                </div>
              )}
            </div>

            {/* Clue 3: Flag Reveal */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                unlockedClues >= 3
                  ? 'bg-white/5 border-white/10'
                  : 'bg-black/40 border-white/5 opacity-50'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Flag className="w-3 h-3 text-amber-400" />
                  <span>Clue 3: Flag & Details</span>
                </span>
                <span className="text-stone-300 text-[9px]">(3 Pts)</span>
              </div>
              {unlockedClues >= 3 ? (
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-4xl shadow-md p-1 rounded-lg bg-black/40 border border-white/10">
                    {challenge.flagEmoji}
                  </span>
                  <div className="text-xs font-sans text-stone-300">
                    {challenge.clues[2]}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] font-mono text-stone-500 italic mt-1">
                  🔒 Submit 2 guesses to unlock Flag reveal
                </div>
              )}
            </div>
          </div>

          {/* Guesses list */}
          {guesses.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {guesses.map((g, i) => (
                <span
                  key={i}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
                    g.toLowerCase() === challenge.name.toLowerCase()
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-rose-600/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {g} {g.toLowerCase() === challenge.name.toLowerCase() ? '✓' : '✗'}
                </span>
              ))}
            </div>
          )}

          {/* Input & Autocomplete */}
          {gameStatus === 'playing' ? (
            <div className="relative mt-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (guessInput.trim()) submitGuess(guessInput.trim());
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Type country name..."
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-[#DFBE8A] text-white text-xs font-mono outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!guessInput.trim()}
                  className="px-4 py-2.5 rounded-2xl text-xs font-mono font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black disabled:opacity-40 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Submit
                </button>
              </form>

              {/* Autocomplete Dropdown */}
              {filteredCountries.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 right-0 p-1.5 rounded-2xl bg-[#1C1815] border border-white/15 shadow-2xl flex flex-col gap-1 z-20">
                  {filteredCountries.map((c) => (
                    <button
                      key={c}
                      onClick={() => submitGuess(c)}
                      className="w-full px-3 py-1.5 rounded-xl text-left text-xs font-mono text-stone-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Finished Victory / Loss Banner */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center space-y-2 mt-auto"
            >
              <div className="flex items-center justify-center gap-2 text-sm font-serif font-bold text-white">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>
                  {gameStatus === 'won' ? `Victory! It was ${challenge.name} ${challenge.flagEmoji}` : `Answer: ${challenge.name} ${challenge.flagEmoji}`}
                </span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                {!isDaily ? (
                  <button
                    onClick={() => startRound(false)}
                    className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    Next Country
                  </button>
                ) : (
                  <div className="text-[10px] font-mono text-stone-400">
                    Daily challenge completed for today 🏆
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
