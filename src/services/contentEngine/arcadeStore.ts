import { getISTDateString } from './istTime';
import type { GameId, GameStats, ArcadeLeaderboardEntry } from './types';
import { realtimeService } from '../supabase';

const STATS_KEY = 'ourcircle_arcade_stats';
const DAILY_COMPLETED_KEY = 'ourcircle_arcade_daily_completed';
const LEADERBOARD_KEY = 'ourcircle_arcade_leaderboard';

export interface DailyCompletionState {
  dateKey: string;
  completedGames: Record<GameId, boolean>;
}

class ArcadeStore {
  private stats: Record<GameId, GameStats>;
  private dailyCompletions: Record<string, DailyCompletionState> = {};
  private leaderboard: ArcadeLeaderboardEntry[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.stats = this.loadStats();
    this.dailyCompletions = this.loadDailyCompletions();
    this.leaderboard = this.loadLeaderboard();
  }

  private loadStats(): Record<GameId, GameStats> {
    const defaultStats = (): GameStats => ({
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    });

    const initial: Record<GameId, GameStats> = {
      wordle: defaultStats(),
      trivia: defaultStats(),
      country: defaultStats(),
      movie: defaultStats(),
      connections: defaultStats(),
      number: defaultStats(),
    };

    if (typeof window === 'undefined') return initial;

    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) {
        return { ...initial, ...JSON.parse(raw) };
      }
    } catch {
      // Ignore
    }
    return initial;
  }

  private loadDailyCompletions(): Record<string, DailyCompletionState> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(DAILY_COMPLETED_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private loadLeaderboard(): ArcadeLeaderboardEntry[] {
    const defaultLeaderboard: ArcadeLeaderboardEntry[] = [];

    if (typeof window === 'undefined') return defaultLeaderboard;
    try {
      const raw = localStorage.getItem(LEADERBOARD_KEY);
      if (raw) {
        const parsed: ArcadeLeaderboardEntry[] = JSON.parse(raw);
        return parsed;
      }
      return defaultLeaderboard;
    } catch {
      return defaultLeaderboard;
    }
  }

  private save() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(this.stats));
      localStorage.setItem(DAILY_COMPLETED_KEY, JSON.stringify(this.dailyCompletions));
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboard.slice(0, 50)));
    } catch {
      // Ignore
    }
    this.notify();
  }

  public getStats(gameId: GameId): GameStats {
    return this.stats[gameId];
  }

  public getAllStats(): Record<GameId, GameStats> {
    return { ...this.stats };
  }

  public isDailyCompleted(gameId: GameId, dateKey: string = getISTDateString()): boolean {
    const today = this.dailyCompletions[dateKey];
    return Boolean(today?.completedGames?.[gameId]);
  }

  public getTodayCompletedCount(dateKey: string = getISTDateString()): { completed: number; total: number } {
    const games: GameId[] = ['wordle', 'trivia', 'country', 'movie', 'connections', 'number'];
    const today = this.dailyCompletions[dateKey];
    const completed = games.filter((g) => today?.completedGames?.[g]).length;
    return { completed, total: games.length };
  }

  public recordGameResult(
    gameId: GameId,
    won: boolean,
    isDaily: boolean,
    score: number,
    detail?: string,
    guessCount?: number
  ) {
    const current = this.stats[gameId] || {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    };

    const played = current.played + 1;
    const wins = won ? current.wins + 1 : current.wins;
    const currentStreak = won ? current.currentStreak + 1 : 0;
    const maxStreak = Math.max(current.maxStreak, currentStreak);

    const guessDistribution = { ...(current.guessDistribution || {}) };
    if (won && guessCount && guessCount >= 1 && guessCount <= 6) {
      guessDistribution[guessCount] = (guessDistribution[guessCount] || 0) + 1;
    }

    const todayDate = getISTDateString();
    this.stats[gameId] = {
      played,
      wins,
      currentStreak,
      maxStreak,
      lastPlayedDate: todayDate,
      guessDistribution,
      highScore: Math.max(current.highScore || 0, score),
    };

    if (isDaily) {
      if (!this.dailyCompletions[todayDate]) {
        this.dailyCompletions[todayDate] = {
          dateKey: todayDate,
          completedGames: {} as Record<GameId, boolean>,
        };
      }
      this.dailyCompletions[todayDate].completedGames[gameId] = true;
    }

    // Add entry to leaderboards
    const activeCousin = realtimeService.getActiveCousin();
    const entry: ArcadeLeaderboardEntry = {
      id: `lb_${Date.now()}`,
      cousinId: activeCousin.id,
      cousinName: activeCousin.name,
      avatarUrl: activeCousin.avatarUrl,
      gameId,
      score,
      streak: currentStreak,
      date: todayDate,
      detail: detail || (won ? 'Victory!' : 'Played'),
    };

    this.leaderboard = [entry, ...this.leaderboard.filter((l) => !(l.cousinId === entry.cousinId && l.gameId === gameId && l.date === todayDate))].slice(0, 50);

    this.save();
  }

  public getLeaderboard(gameId?: GameId): ArcadeLeaderboardEntry[] {
    if (gameId) {
      return this.leaderboard.filter((e) => e.gameId === gameId);
    }
    return [...this.leaderboard];
  }

  public subscribe(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

export const arcadeStore = new ArcadeStore();
