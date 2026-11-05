import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Hash, Trophy, RotateCw, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getDailyNumberPuzzle,
  getRandomPracticeNumberPuzzle,
  type NumberPuzzleChallenge,
} from '../../services/contentEngine/numberPuzzleService';
import { getISTDateString, getISTDayNumber } from '../../services/contentEngine/istTime';
import { arcadeStore } from '../../services/contentEngine/arcadeStore';
import { soundEngine } from '../../utils/audio';
import { toastManager } from '../ActivityToasts';

interface NumberPuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NumberPuzzleModal: React.FC<NumberPuzzleModalProps> = ({ isOpen, onClose }) => {
  const [isDaily, setIsDaily] = useState(true);
  const [puzzle, setPuzzle] = useState<NumberPuzzleChallenge>(() => getDailyNumberPuzzle());
  const [expression, setExpression] = useState('');
  const [usedNumberIndices, setUsedNumberIndices] = useState<number[]>([]);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won'>('playing');
  const [showHint, setShowHint] = useState(false);

  const dateKey = getISTDateString();
  const dayNumber = getISTDayNumber();

  const startRound = useCallback((daily: boolean) => {
    setIsDaily(daily);
    setExpression('');
    setUsedNumberIndices([]);
    setGameStatus('playing');
    setShowHint(false);

    if (daily) {
      setPuzzle(getDailyNumberPuzzle(dateKey));
    } else {
      setPuzzle(getRandomPracticeNumberPuzzle());
    }
  }, [dateKey]);

  useEffect(() => {
    if (isOpen) {
      startRound(true);
    }
  }, [isOpen, startRound]);

  const addNumber = (num: number, idx: number) => {
    if (gameStatus !== 'playing' || usedNumberIndices.includes(idx)) return;
    soundEngine.tick();
    setUsedNumberIndices((prev) => [...prev, idx]);
    setExpression((prev) => (prev ? `${prev} ${num}` : `${num}`));
  };

  const addOperator = (op: string) => {
    if (gameStatus !== 'playing') return;
    soundEngine.tick();
    setExpression((prev) => `${prev} ${op}`);
  };

  const handleClear = () => {
    soundEngine.tick();
    setExpression('');
    setUsedNumberIndices([]);
  };

  const handleEvaluate = () => {
    if (usedNumberIndices.length !== 4) {
      toastManager.showToast('You must use all 4 numbers!');
      soundEngine.tick();
      return;
    }

    try {
      // Safe math evaluator for basic arithmetic (+, -, *, /, parentheses)
      const cleanExpr = expression.replace(/[^0-9+\-*/(). ]/g, '');
      // eslint-disable-next-line no-eval
      const result = Function(`'use strict'; return (${cleanExpr})`)();

      if (Math.abs(result - puzzle.target) < 0.001) {
        setGameStatus('won');
        soundEngine.chime();
        confetti({ particleCount: 50, spread: 75, origin: { y: 0.6 } });
        toastManager.showToast(`Genius! ${expression} = ${puzzle.target} 🎯`);
        arcadeStore.recordGameResult('number', true, isDaily, 10, `${expression} = ${puzzle.target}`);
      } else {
        soundEngine.tick();
        toastManager.showToast(`Equals ${result}, not ${puzzle.target}. Try again!`);
      }
    } catch {
      soundEngine.tick();
      toastManager.showToast('Invalid math expression syntax');
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
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <span>Number Target</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {isDaily ? `Daily #${dayNumber}` : 'Practice'}
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-stone-400">
                  Combine all 4 numbers using arithmetic to reach {puzzle.target}
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

          {/* Target Display */}
          <div className="p-4 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 text-center my-2 shadow-inner">
            <div className="text-[11px] font-mono uppercase tracking-widest text-[#DFBE8A] font-bold">
              Target Value
            </div>
            <div className="text-4xl sm:text-5xl font-mono font-black text-white mt-1">
              {puzzle.target}
            </div>
          </div>

          {/* 4 Given Numbers */}
          <div className="grid grid-cols-4 gap-2.5 my-3">
            {puzzle.numbers.map((num: number, idx: number) => {
              const isUsed = usedNumberIndices.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => addNumber(num, idx)}
                  disabled={isUsed || gameStatus !== 'playing'}
                  className={`h-16 rounded-2xl font-mono text-xl sm:text-2xl font-bold border transition-all cursor-pointer flex items-center justify-center shadow-md active:scale-95 ${
                    isUsed
                      ? 'bg-black/30 text-stone-600 border-white/5 opacity-40'
                      : 'bg-[#DFBE8A]/15 hover:bg-[#DFBE8A]/25 text-[#DFBE8A] border-[#DFBE8A]/40'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Current Expression Screen */}
          <div className="p-4 rounded-2xl bg-black/60 border border-white/15 min-h-[56px] flex items-center justify-center text-center font-mono text-lg sm:text-xl font-bold text-amber-200 overflow-x-auto my-2">
            {expression || <span className="text-stone-600 text-sm">Select numbers & operators...</span>}
          </div>

          {/* Operators keypad */}
          <div className="grid grid-cols-6 gap-1.5 my-2">
            {['+', '-', '*', '/', '(', ')'].map((op) => (
              <button
                key={op}
                onClick={() => addOperator(op)}
                disabled={gameStatus !== 'playing'}
                className="h-11 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white font-mono text-base font-bold active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              >
                {op}
              </button>
            ))}
          </div>

          {/* Hint */}
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 my-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-center text-xs font-mono text-amber-300"
            >
              Formula Solution Hint: {puzzle.bestFormulaHint}
            </motion.div>
          )}

          {/* Action Row */}
          {gameStatus === 'playing' ? (
            <div className="flex items-center justify-between gap-2 mt-auto pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowHint(true)}
                  className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-stone-400 hover:text-white text-xs font-mono cursor-pointer flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Hint</span>
                </button>
              </div>

              <button
                onClick={handleEvaluate}
                className="px-6 py-2 rounded-2xl text-xs font-mono font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Check Answer (=)
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center space-y-2 mt-auto"
            >
              <div className="text-sm font-serif font-bold text-white flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Genius! Math target reached 🎯</span>
              </div>

              {!isDaily ? (
                <button
                  onClick={() => startRound(false)}
                  className="px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  Next Target Puzzle
                </button>
              ) : (
                <div className="text-[10px] font-mono text-stone-400">
                  Daily math target completed for today 🏆
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
