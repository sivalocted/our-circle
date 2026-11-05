import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dices, Sparkles, Play } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { GameId } from '../../services/contentEngine/types';
import { soundEngine } from '../../utils/audio';
import { toastManager } from '../ActivityToasts';

interface SurpriseWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (gameId: GameId) => void;
}

const ARCADE_GAMES: { id: GameId; label: string; icon: string; color: string; desc: string }[] = [
  { id: 'wordle', label: 'Daily Word', icon: '📝', color: '#10B981', desc: '5-letter deductive word puzzle' },
  { id: 'trivia', label: 'Trivia Arena', icon: '🎯', color: '#F59E0B', desc: 'Fast-paced verified knowledge quiz' },
  { id: 'country', label: 'Guess Country', icon: '🌍', color: '#3B82F6', desc: 'World geography & flag clues' },
  { id: 'movie', label: 'Movie Emoji', icon: '🎬', color: '#EC4899', desc: 'Decode cinema from emoji rebuses' },
  { id: 'connections', label: 'Connections', icon: '🧩', color: '#8B5CF6', desc: 'Find 4 hidden word categories' },
  { id: 'number', label: 'Number Target', icon: '🔢', color: '#EAB308', desc: '24-Puzzle arithmetic math sprint' },
];

export const SurpriseWheelModal: React.FC<SurpriseWheelModalProps> = ({
  isOpen,
  onClose,
  onSelectGame,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [pickedGame, setPickedGame] = useState<typeof ARCADE_GAMES[0] | null>(null);

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setPickedGame(null);
    soundEngine.chime();

    // Random target index
    const pickIdx = Math.floor(Math.random() * ARCADE_GAMES.length);
    const chosen = ARCADE_GAMES[pickIdx];

    // Calculate rotation angle (each segment is 360 / 6 = 60 degrees)
    const segmentAngle = 360 / ARCADE_GAMES.length;
    // Add 4-6 full spins + offset to land on chosen segment
    const fullSpins = 360 * 5;
    const targetAngle = fullSpins + (ARCADE_GAMES.length - 1 - pickIdx) * segmentAngle + segmentAngle / 2;

    setRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setPickedGame(chosen);
      soundEngine.chime();
      confetti({
        particleCount: 55,
        spread: 80,
        origin: { y: 0.6 },
        colors: [chosen.color, '#DFBE8A', '#FFFFFF'],
      });

      toastManager.showToast(`${chosen.label} selected for this round.`);
    }, 3200);
  };

  const handleLaunchGame = () => {
    if (!pickedGame) return;
    onClose();
    onSelectGame(pickedGame.id);
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
          className="relative w-full max-w-md rounded-3xl bg-[#141210] border border-[#DFBE8A]/40 p-5 sm:p-6 text-white shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between border-b border-white/10 pb-3 mb-4">
            <div className="flex items-center gap-2 text-left">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
                <Dices className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-white">Surprise Game Wheel</h3>
                <p className="text-[10px] font-mono text-stone-400">Spin to choose a solo challenge</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visual Wheel Container */}
          <div className="relative my-4 w-60 h-60 flex items-center justify-center">
            {/* Top Pointer Arrow */}
            <div className="absolute -top-3 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[18px] border-t-amber-400 filter drop-shadow-md" />

            {/* Rotating Wheel Disk */}
            <div
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 3.2s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
              }}
              className="w-56 h-56 rounded-full border-4 border-amber-400/50 shadow-2xl shadow-black relative overflow-hidden bg-stone-900"
            >
              {ARCADE_GAMES.map((game, i) => {
                const angle = (360 / ARCADE_GAMES.length) * i;
                return (
                  <div
                    key={game.id}
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: '50% 100%',
                      clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                      backgroundColor: `${game.color}25`,
                      borderTop: `2px solid ${game.color}80`,
                    }}
                    className="absolute top-0 left-0 w-full h-1/2 flex items-start justify-center pt-2 font-mono text-xs font-bold"
                  >
                    <span
                      style={{ transform: `rotate(${-angle}deg)` }}
                      className="text-lg filter drop-shadow"
                    >
                      {game.icon}
                    </span>
                  </div>
                );
              })}

              {/* Center Hub */}
              <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-gradient-to-br from-[#DFBE8A] to-[#C89D66] border-2 border-white/60 shadow-xl flex items-center justify-center text-black font-bold">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
            </div>
          </div>

          {/* Result or Spin Button */}
          {pickedGame ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 space-y-3 mt-2"
            >
              <div>
                <span className="text-3xl block mb-1">{pickedGame.icon}</span>
                <h4 className="font-serif text-lg font-bold text-white">{pickedGame.label}</h4>
                <p className="text-xs font-sans text-stone-300">{pickedGame.desc}</p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={spinWheel}
                  disabled={isSpinning}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  Spin Again
                </button>

                <button
                  onClick={handleLaunchGame}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Play {pickedGame.label}</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="w-full space-y-3 mt-2">
              <button
                onClick={spinWheel}
                disabled={isSpinning}
                className="w-full py-3.5 rounded-2xl font-mono text-sm font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black shadow-xl hover:brightness-110 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Dices className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'SPINNING ARCADE...' : 'SPIN SURPRISE WHEEL 🎲'}</span>
              </button>
              <p className="text-[11px] font-mono text-stone-500">
                Picks a random game for this device
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
