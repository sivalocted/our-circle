import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Layers, Trophy, RotateCw, Shuffle } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getDailyConnectionsBoard,
  getRandomPracticeConnectionsBoard,
  type ConnectionGroup,
} from '../../services/contentEngine/connectionsService';
import { getISTDateString, getISTDayNumber } from '../../services/contentEngine/istTime';
import { arcadeStore } from '../../services/contentEngine/arcadeStore';
import { soundEngine } from '../../utils/audio';
import { toastManager } from '../ActivityToasts';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionsModal: React.FC<ConnectionsModalProps> = ({ isOpen, onClose }) => {
  const [isDaily, setIsDaily] = useState(true);
  const [board, setBoard] = useState(() => getDailyConnectionsBoard());
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<ConnectionGroup[]>([]);
  const [mistakesLeft, setMistakesLeft] = useState(4);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const dateKey = getISTDateString();
  const dayNumber = getISTDayNumber();

  const startRound = useCallback((daily: boolean) => {
    setIsDaily(daily);
    const newBoard = daily ? getDailyConnectionsBoard(dateKey) : getRandomPracticeConnectionsBoard();
    setBoard(newBoard);
    setRemainingWords(newBoard.allWords);
    setSelectedWords([]);
    setSolvedGroups([]);
    setMistakesLeft(4);
    setGameStatus('playing');
  }, [dateKey]);

  useEffect(() => {
    if (isOpen) {
      startRound(true);
    }
  }, [isOpen, startRound]);

  const toggleSelect = (word: string) => {
    if (gameStatus !== 'playing') return;
    soundEngine.tick();

    if (selectedWords.includes(word)) {
      setSelectedWords((prev) => prev.filter((w) => w !== word));
    } else {
      if (selectedWords.length < 4) {
        setSelectedWords((prev) => [...prev, word]);
      }
    }
  };

  const handleShuffle = () => {
    soundEngine.tick();
    setRemainingWords((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const handleSubmit = () => {
    if (selectedWords.length !== 4 || gameStatus !== 'playing') return;

    soundEngine.tick();

    // Check if selectedWords matches any unsolved group
    const matchedGroup = board.groups.find((group) => {
      return group.items.every((item) => selectedWords.includes(item));
    });

    if (matchedGroup) {
      // Correct!
      soundEngine.chime();
      const updatedSolved = [...solvedGroups, matchedGroup];
      setSolvedGroups(updatedSolved);
      setRemainingWords((prev) => prev.filter((w) => !matchedGroup.items.includes(w as any)));
      setSelectedWords([]);

      if (updatedSolved.length === 4) {
        setGameStatus('won');
        confetti({ particleCount: 50, spread: 75, origin: { y: 0.6 } });
        toastManager.showToast('Magnificent! Connections complete! 🧩');
        arcadeStore.recordGameResult('connections', true, isDaily, 10, 'All 4 groups solved');
      } else {
        toastManager.showToast(`Found: ${matchedGroup.category}! ✨`);
      }
    } else {
      // Check for "One away..." (3 matching)
      const oneAway = board.groups.some((group) => {
        const matchCount = group.items.filter((item) => selectedWords.includes(item)).length;
        return matchCount === 3;
      });

      const nextMistakes = mistakesLeft - 1;
      setMistakesLeft(nextMistakes);

      if (oneAway) {
        toastManager.showToast('One away... 🧐');
      } else {
        toastManager.showToast('Not quite. Try another grouping!');
      }

      if (nextMistakes <= 0) {
        setGameStatus('lost');
        soundEngine.tick();
        toastManager.showToast('Out of attempts. Revealing solutions...');
        setSolvedGroups(board.groups);
        setRemainingWords([]);
        arcadeStore.recordGameResult('connections', false, isDaily, 0, 'Mistakes exceeded');
      }
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
          className="relative w-full max-w-lg rounded-3xl bg-[#141210] border border-[#DFBE8A]/35 p-5 sm:p-6 text-white shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <span>Word Connections</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {isDaily ? `Daily #${dayNumber}` : 'Practice'}
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-stone-400">
                  Group four related words into four mystery categories
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

          {/* Solved Groups Banners */}
          <div className="space-y-2 mb-3">
            {solvedGroups.map((group, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ backgroundColor: `${group.color}25`, borderColor: `${group.color}50` }}
                className="p-3 rounded-2xl border text-center shadow-md"
              >
                <div className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">
                  {group.category}
                </div>
                <div className="text-[11px] font-mono font-semibold text-stone-300">
                  {group.items.join(', ')}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Unsolved Words 4x4 Grid */}
          {remainingWords.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {remainingWords.map((word) => {
                const isSelected = selectedWords.includes(word);
                return (
                  <button
                    key={word}
                    onClick={() => toggleSelect(word)}
                    className={`h-16 rounded-2xl font-mono text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center justify-center text-center p-1.5 active:scale-95 ${
                      isSelected
                        ? 'bg-[#DFBE8A] text-black border-[#DFBE8A] shadow-lg shadow-amber-900/40 font-extrabold scale-102'
                        : 'bg-white/5 hover:bg-white/15 text-white border-white/10'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
          )}

          {/* Mistakes remaining indicator */}
          {gameStatus === 'playing' && (
            <div className="flex items-center justify-center gap-2 mb-4 text-xs font-mono text-stone-400">
              <span>Mistakes remaining:</span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i < mistakesLeft ? 'bg-amber-400' : 'bg-stone-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {gameStatus === 'playing' ? (
            <div className="flex items-center justify-between gap-2 mt-auto">
              <button
                onClick={handleShuffle}
                className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 text-stone-300 hover:text-white text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedWords([])}
                  disabled={selectedWords.length === 0}
                  className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-xs font-mono disabled:opacity-30 cursor-pointer"
                >
                  Deselect
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={selectedWords.length !== 4}
                  className="px-5 py-2 rounded-2xl text-xs font-mono font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black disabled:opacity-30 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  Submit ({selectedWords.length}/4)
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center space-y-2 mt-auto"
            >
              <div className="text-sm font-serif font-bold text-white flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{gameStatus === 'won' ? 'Magnificent! All 4 Groups Found' : 'Good Effort! Better luck next time'}</span>
              </div>

              {!isDaily ? (
                <button
                  onClick={() => startRound(false)}
                  className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  Next Board
                </button>
              ) : (
                <div className="text-[10px] font-mono text-stone-400">
                  Daily connections puzzle complete for today 🧩
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
