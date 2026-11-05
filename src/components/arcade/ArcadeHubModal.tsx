import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Gamepad2,
  Trophy,
  Dices,
  Sparkles,
  Flame,
  CheckCircle2,
  Play,
} from 'lucide-react';
import type { GameId } from '../../services/contentEngine/types';
import { arcadeStore } from '../../services/contentEngine/arcadeStore';
import {
  getISTDateString,
  getISTDayNumber,
  getTimeUntilNextISTMidnight,
} from '../../services/contentEngine/istTime';
import { soundEngine } from '../../utils/audio';
import { realtimeService } from '../../services/supabase';
import { DailyWordModal } from './DailyWordModal';
import { TriviaModal } from './TriviaModal';
import { GuessCountryModal } from './GuessCountryModal';
import { MovieEmojiModal } from './MovieEmojiModal';
import { ConnectionsModal } from './ConnectionsModal';
import { NumberPuzzleModal } from './NumberPuzzleModal';
import { SurpriseWheelModal } from './SurpriseWheelModal';

interface ArcadeHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ArcadeGameCard {
  id: GameId;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  time: string;
  category: string;
  sourceAttribution: string;
}

const ARCADE_GAMES: ArcadeGameCard[] = [
  {
    id: 'wordle',
    title: 'Daily Word',
    subtitle: '5-letter deductive word puzzle',
    icon: '📝',
    color: '#10B981',
    time: '3 min',
    category: 'Wordplay',
    sourceAttribution: 'Curated five-letter word bank',
  },
  {
    id: 'trivia',
    title: 'Trivia Arena',
    subtitle: '10 general-knowledge multiple-choice questions',
    icon: '🎯',
    color: '#F59E0B',
    time: '2 min',
    category: 'General Knowledge',
    sourceAttribution: 'Open Trivia DB · CC BY-SA 4.0',
  },
  {
    id: 'country',
    title: 'Guess the Country',
    subtitle: 'Progressive geography & flag clues',
    icon: '🌍',
    color: '#3B82F6',
    time: '2 min',
    category: 'World Atlas',
    sourceAttribution: 'Curated geography clues · FlagCDN images',
  },
  {
    id: 'movie',
    title: 'Movie Emoji Decode',
    subtitle: 'Identify cinema from emoji rebuses',
    icon: '🎬',
    color: '#EC4899',
    time: '2 min',
    category: 'Cinema',
    sourceAttribution: 'Curated movie emoji clues',
  },
  {
    id: 'connections',
    title: 'Word Connections',
    subtitle: 'Find 4 hidden thematic categories',
    icon: '🧩',
    color: '#8B5CF6',
    time: '4 min',
    category: 'Pattern Logic',
    sourceAttribution: 'Curated word-category boards',
  },
  {
    id: 'number',
    title: 'Number Target',
    subtitle: '24-Puzzle arithmetic math sprint',
    icon: '🔢',
    color: '#EAB308',
    time: '3 min',
    category: 'Mental Math',
    sourceAttribution: 'Algorithmic Generator',
  },
];

export const ArcadeHubModal: React.FC<ArcadeHubModalProps> = ({ isOpen, onClose }) => {
  const [activeGameModal, setActiveGameModal] = useState<GameId | null>(null);
  const [surpriseWheelOpen, setSurpriseWheelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'leaderboard'>('games');
  const [completedCount, setCompletedCount] = useState(() => arcadeStore.getTodayCompletedCount());
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [leaderboard, setLeaderboard] = useState(() => arcadeStore.getLeaderboard());
  const currentPlayerId = realtimeService.getActiveCousin().id;

  const dateKey = getISTDateString();
  const dayNumber = getISTDayNumber();

  // Subscribe to arcadeStore for reactive completion badges & leaderboard updates
  useEffect(() => {
    const unsub = arcadeStore.subscribe(() => {
      setCompletedCount(arcadeStore.getTodayCompletedCount());
      setLeaderboard(arcadeStore.getLeaderboard());
    });
    return () => unsub();
  }, []);

  // IST countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilReset(getTimeUntilNextISTMidnight().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const openGame = (gameId: GameId) => {
    soundEngine.tick();
    setActiveGameModal(gameId);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl rounded-3xl bg-[#120F0D] border border-[#DFBE8A]/35 text-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
          >
            {/* 1. Header */}
            <div className="px-4 sm:px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#181412]">
              <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#DFBE8A]/30 to-[#DFBE8A]/10 border border-[#DFBE8A]/40 flex items-center justify-center text-[#DFBE8A] shadow-md">
                  <Gamepad2 className="w-5 h-5 text-[#DFBE8A]" />
                </div>
                <div>
                  <h2 className="font-serif text-base sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                    <span>Our Circle Arcade</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Day #{dayNumber}
                    </span>
                  </h2>
                  <p className="max-w-[35ch] text-[10px] leading-relaxed sm:text-[11px] font-mono text-stone-400">
                    Daily games · scores saved on this device · Reset in{' '}
                    <span className="text-amber-300 font-bold">{timeUntilReset || 'IST midnight'}</span>
                  </p>
                </div>
              </div>

              {/* Navigation Tabs & Close */}
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
                <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
                  <button
                    onClick={() => setActiveTab('games')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'games'
                        ? 'bg-amber-400/20 text-amber-300 font-bold shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    Games
                  </button>
                  <button
                    onClick={() => setActiveTab('leaderboard')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      activeTab === 'leaderboard'
                        ? 'bg-amber-400/20 text-amber-300 font-bold shadow'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <Trophy className="w-3 h-3" />
                    <span>Scores</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-stone-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close Arcade"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Scrollable Arcade Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5">
              {activeTab === 'games' ? (
                <>
                  {/* SURPRISE ME WHEEL HERO CARD (User's #1 Favorite Idea) */}
                  <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-[#1C1815] to-amber-900/30 border border-[#DFBE8A]/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1.5 text-center sm:text-left z-10">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono uppercase tracking-wider font-bold inline-flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Solo play</span>
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                        Surprise Me! Game Wheel 🎲
                      </h3>
                      <p className="text-xs font-sans text-stone-300 max-w-md">
                        Spin to choose a game for your next solo round.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        soundEngine.tick();
                        setSurpriseWheelOpen(true);
                      }}
                      className="px-6 py-3 rounded-2xl font-mono text-xs sm:text-sm font-bold bg-gradient-to-r from-[#DFBE8A] to-[#C89D66] text-black shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 flex-shrink-0 z-10"
                    >
                      <Dices className="w-4 h-4 text-black" />
                      <span>SPIN SURPRISE WHEEL</span>
                    </button>

                    {/* Decorative Background Glow */}
                    <div className="absolute right-0 top-0 bottom-0 w-64 bg-amber-500/10 blur-3xl pointer-events-none" />
                  </div>

                  {/* Daily Progress Tracker */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
                    <div>
                      <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">
                        Today's Daily Challenges ({completedCount.completed}/{completedCount.total} Completed)
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ARCADE_GAMES.map((g) => {
                        const done = arcadeStore.isDailyCompleted(g.id, dateKey);
                        return (
                          <button
                            key={g.id}
                            onClick={() => openGame(g.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono border flex items-center gap-1 transition-all cursor-pointer ${
                              done
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                                : 'bg-white/5 border-white/10 text-stone-400 hover:text-white'
                            }`}
                          >
                            <span>{g.icon}</span>
                            <span>{g.title}</span>
                            {done && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Game Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {ARCADE_GAMES.map((game) => {
                      const isCompletedToday = arcadeStore.isDailyCompleted(game.id, dateKey);
                      const stats = arcadeStore.getStats(game.id);

                      return (
                        <div
                          key={game.id}
                          className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between group shadow-lg"
                        >
                          <div>
                            {/* Card Top: Icon & Tags */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-3xl p-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                                {game.icon}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-stone-300">
                                  {game.time}
                                </span>
                                {isCompletedToday ? (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    <span>Done</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                    Ready
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Title & Desc */}
                            <h4 className="font-serif text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                              {game.title}
                            </h4>
                            <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                              {game.subtitle}
                            </p>
                          </div>

                          {/* Footer: Streaks & Launch Buttons */}
                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400">
                              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span>{stats.currentStreak} Streak</span>
                            </div>

                            <button
                              onClick={() => openGame(game.id)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-white/10 hover:bg-[#DFBE8A] hover:text-black transition-all cursor-pointer flex items-center gap-1 shadow-md"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Play</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Leaderboard & Stats Tab */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-white">Scores on this device</h3>
                      <p className="text-xs font-mono text-stone-400">
                        Personal game results are stored in this browser and are not shared with other players.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/5">
                    {leaderboard.length > 0 ? (
                      <div className="divide-y divide-white/5">
                        {leaderboard.map((entry, idx) => (
                          <div
                            key={entry.id}
                            className="p-3.5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-amber-400 w-5 text-center">
                                #{idx + 1}
                              </span>

                              {entry.avatarUrl && <img src={entry.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-white/20 object-cover" />}

                              <div>
                                <div className="text-xs font-mono font-bold text-white">
                                  {entry.cousinId === currentPlayerId ? 'This device' : 'Legacy local score'}
                                </div>
                                <div className="text-[10px] font-mono text-stone-400">
                                  {entry.detail || entry.gameId} • {entry.date}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-right">
                              <div>
                                <div className="text-xs font-mono font-bold text-emerald-400">
                                  +{entry.score} pts
                                </div>
                                <div className="text-[9px] font-mono text-stone-400">
                                  {entry.streak} day streak 🔥
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs font-mono text-stone-500">
                        No scores saved on this device yet. Complete a game to record one here.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Individual Modals */}
      {activeGameModal === 'wordle' && (
        <DailyWordModal isOpen={true} onClose={() => setActiveGameModal(null)} />
      )}
      {activeGameModal === 'trivia' && (
        <TriviaModal isOpen={true} onClose={() => setActiveGameModal(null)} />
      )}
      {activeGameModal === 'country' && (
        <GuessCountryModal isOpen={true} onClose={() => setActiveGameModal(null)} />
      )}
      {activeGameModal === 'movie' && (
        <MovieEmojiModal isOpen={true} onClose={() => setActiveGameModal(null)} />
      )}
      {activeGameModal === 'connections' && (
        <ConnectionsModal isOpen={true} onClose={() => setActiveGameModal(null)} />
      )}
      {activeGameModal === 'number' && (
        <NumberPuzzleModal isOpen={true} onClose={() => setActiveGameModal(null)} />
      )}

      {/* Surprise Wheel Modal */}
      {surpriseWheelOpen && (
        <SurpriseWheelModal
          isOpen={true}
          onClose={() => setSurpriseWheelOpen(false)}
          onSelectGame={(gId) => setActiveGameModal(gId)}
        />
      )}
    </>
  );
};
