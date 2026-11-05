import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Sparkles, CheckCircle2, XCircle, RotateCw, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { fetchLiveTriviaQuestions, type TriviaQuestion } from '../../services/contentEngine/triviaService';
import { getISTDateString, getISTDayNumber } from '../../services/contentEngine/istTime';
import { arcadeStore } from '../../services/contentEngine/arcadeStore';
import { soundEngine } from '../../utils/audio';
import { toastManager } from '../ActivityToasts';

interface TriviaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TriviaModal: React.FC<TriviaModalProps> = ({ isOpen, onClose }) => {
  const [isDaily, setIsDaily] = useState(true);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const requestVersion = useRef(0);

  const dateKey = getISTDateString();
  const dayNumber = getISTDayNumber();

  const loadRound = useCallback(async (daily: boolean) => {
    const version = ++requestVersion.current;
    setIsDaily(daily);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerLocked(false);
    setScore(0);
    setIsFinished(false);
    setTimeLeft(15);
    setQuestions([]);
    setIsLoading(true);
    setLoadError(false);
    try {
      const questions = await fetchLiveTriviaQuestions(5, undefined, undefined, dateKey);
      if (version !== requestVersion.current) return;
      setQuestions(questions);
      setLoadError(questions.length === 0);
    } catch {
      if (version === requestVersion.current) setLoadError(true);
    } finally {
      if (version === requestVersion.current) setIsLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    if (isOpen) {
      loadRound(true);
    }
  }, [isOpen, loadRound]);

  // Question countdown timer
  useEffect(() => {
    if (!isOpen || isFinished || isAnswerLocked || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isFinished, isAnswerLocked, currentIndex, questions.length]);

  const handleTimeOut = () => {
    setIsAnswerLocked(true);
    soundEngine.tick();
    toastManager.showToast('Time expired! ⏳');
  };

  const handleSelectOption = (option: string) => {
    if (isAnswerLocked || isFinished) return;

    setSelectedAnswer(option);
    setIsAnswerLocked(true);

    const currentQ = questions[currentIndex];
    const isCorrect = option === currentQ.correctAnswer;

    if (isCorrect) {
      soundEngine.chime();
      setScore((s) => s + 1);
    } else {
      soundEngine.tick();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((idx) => idx + 1);
      setSelectedAnswer(null);
      setIsAnswerLocked(false);
      setTimeLeft(15);
    } else {
      // Finished round
      setIsFinished(true);
      const finalScore = score + (selectedAnswer === questions[currentIndex]?.correctAnswer ? 1 : 0);
      const passed = finalScore >= Math.ceil(questions.length / 2);

      if (passed) {
        soundEngine.chime();
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        toastManager.showToast(`Quiz completed! Score: ${finalScore}/${questions.length} 🏆`);
      }

      arcadeStore.recordGameResult(
        'trivia',
        passed,
        isDaily,
        finalScore * 2,
        `${finalScore}/${questions.length} correct`
      );
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

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
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <span>Trivia Arena</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {isDaily ? `Daily #${dayNumber}` : 'Quick Play'}
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-stone-400">
                  <a href="https://opentdb.com/api_config.php" target="_blank" rel="noreferrer" className="underline decoration-white/30 underline-offset-2 hover:text-white">Open Trivia DB · CC BY-SA 4.0</a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadRound(!isDaily)}
                className="px-2.5 py-1 rounded-xl text-xs font-mono font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                title={isDaily ? 'Switch to Quick Play' : 'Switch to Daily Quiz'}
              >
                <RotateCw className="w-3 h-3 text-[#DFBE8A]" />
                <span className="hidden sm:inline">{isDaily ? 'Quick Play' : 'Daily Quiz'}</span>
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

          {isLoading ? (
            <p role="status" className="py-12 text-center text-sm text-stone-300">Loading today’s trivia questions…</p>
          ) : loadError ? (
            <div role="status" className="space-y-4 py-8 text-center">
              <h4 className="font-serif text-xl text-white">Trivia is unavailable right now</h4>
              <p className="mx-auto max-w-sm text-sm leading-6 text-stone-400">The licensed question source did not return a round, and there is no cached set for today. Try again in a little while.</p>
              <button type="button" onClick={() => void loadRound(isDaily)} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white hover:bg-white/10">Try again</button>
            </div>
          ) : !isFinished ? (
            currentQ && (
              <div className="space-y-4">
                {/* Meta bar: Question number & Category & Timer */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 font-bold">
                      Q{currentIndex + 1} of {questions.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-stone-300 text-[10px]">
                      {currentQ.category}
                    </span>
                  </div>

                  <div className={`flex items-center gap-1 font-bold ${timeLeft <= 5 ? 'text-rose-400 animate-pulse' : 'text-stone-300'}`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft}s</span>
                  </div>
                </div>

                {/* Question Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 text-sm sm:text-base font-serif font-medium leading-relaxed text-white">
                  {currentQ.question}
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                  {currentQ.options.map((opt: string, idx: number) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrect = opt === currentQ.correctAnswer;

                    let optStyle = 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-200';
                    if (isAnswerLocked) {
                      if (isCorrect) {
                        optStyle = 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold shadow-lg shadow-emerald-900/30';
                      } else if (isSelected) {
                        optStyle = 'bg-rose-600/30 border-rose-500 text-rose-200 font-bold';
                      } else {
                        optStyle = 'bg-black/30 border-white/5 text-stone-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(opt)}
                        disabled={isAnswerLocked}
                        className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-sans font-medium transition-all flex items-center justify-between gap-3 cursor-pointer ${optStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-amber-300">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isAnswerLocked && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        )}
                        {isAnswerLocked && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Continue Button once answered */}
                {isAnswerLocked && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-2 flex justify-end"
                  >
                    <button
                      onClick={handleNext}
                      className="px-5 py-2 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {currentIndex + 1 < questions.length ? 'Next Question →' : 'View Results 🏆'}
                    </button>
                  </motion.div>
                )}
              </div>
            )
          ) : (
            /* Finished Results Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-xl">
                <Trophy className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-serif text-2xl font-bold text-white">Quiz Completed!</h4>
                <p className="text-xs font-mono text-stone-400 mt-1">
                  You scored <span className="text-amber-300 font-bold">{score} / {questions.length}</span> correct
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs mx-auto text-center space-y-1">
                <div className="text-xs font-mono text-stone-300">
                  Accuracy: <span className="text-emerald-400 font-bold">{Math.round((score / questions.length) * 100)}%</span>
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  Points saved on this device: +{score * 2}
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => loadRound(false)}
                  className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Play Another Round</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-full text-xs font-mono font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  Close Arcade
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
