export type GameId =
  | 'wordle'
  | 'trivia'
  | 'country'
  | 'movie'
  | 'connections'
  | 'number';

export interface GameDefinition {
  id: GameId;
  title: string;
  subtitle: string;
  category: 'word' | 'quiz' | 'geography' | 'cinema' | 'logic';
  icon: string;
  color: string;
  description: string;
  estimatedTime: string;
  supportsDaily: boolean;
  supportsPractice: boolean;
  contentProviderName: string;
  contentProviderLicense: string;
}

// Trivia interfaces
export interface TriviaQuestion {
  id: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  options: string[];
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Country interfaces
export interface CountryChallenge {
  code: string;
  name: string;
  capital: string;
  region: string;
  subregion: string;
  flagUrl: string;
  flagEmoji: string;
  clues: [string, string, string]; // Progressive clues 1, 2, 3
}

// Movie interfaces
export interface MovieChallenge {
  id: string;
  title: string;
  year: number;
  emojis: string;
  genres: string[];
  director: string;
  clue: string;
  hintStars: string;
}

// Connections interfaces
export interface ConnectionGroup {
  category: string;
  items: [string, string, string, string];
  difficulty: 'easy' | 'medium' | 'hard' | 'tricky';
  color: string;
}

export interface ConnectionsBoard {
  id: string;
  groups: ConnectionGroup[];
  allWords: string[];
}

// Number puzzle interfaces
export interface NumberPuzzleChallenge {
  id: string;
  numbers: [number, number, number, number];
  target: number;
  bestFormulaHint: string;
}

// Player statistics per game
export interface GameStats {
  played: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate?: string;
  guessDistribution?: Record<number, number>; // e.g., 1..6 for Wordle
  highScore?: number;
}

export interface ArcadeLeaderboardEntry {
  id: string;
  cousinId: string;
  cousinName: string;
  avatarUrl: string;
  gameId: GameId;
  score: number;
  streak: number;
  date: string;
  detail?: string;
}
