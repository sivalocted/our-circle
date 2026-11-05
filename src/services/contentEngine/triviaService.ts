import { getISTDateString } from './istTime';
import type { TriviaQuestion } from './types';
export type { TriviaQuestion };

const CACHE_KEY = 'ourcircle_trivia_cache_v2';
const OPENTDB_COOLDOWN_MS = 5500;
let lastOpenTdbRequestTime = 0;
let inFlightRequest: Promise<TriviaQuestion[]> | null = null;

interface OpenTriviaQuestion {
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

function isOpenTriviaQuestion(value: unknown): value is OpenTriviaQuestion {
  if (typeof value !== 'object' || value === null) return false;
  const question = value as Partial<OpenTriviaQuestion>;
  return typeof question.category === 'string' &&
    ['easy', 'medium', 'hard'].includes(String(question.difficulty)) &&
    typeof question.question === 'string' &&
    typeof question.correct_answer === 'string' &&
    Array.isArray(question.incorrect_answers) &&
    question.incorrect_answers.length === 3 &&
    question.incorrect_answers.every((answer) => typeof answer === 'string');
}

function decodeHtmlEntities(value: string): string {
  if (typeof document === 'undefined') {
    return value.replace(/&quot;/g, '"').replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }
  const element = document.createElement('textarea');
  element.innerHTML = value;
  return element.value;
}

function shuffle<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function readSameDayCache(dateKey: string, amount: number): TriviaQuestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const cache: unknown = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    if (typeof cache !== 'object' || cache === null) return [];
    const stored = cache as { dateKey?: unknown; questions?: unknown };
    if (stored.dateKey !== dateKey || !Array.isArray(stored.questions)) return [];
    const valid = stored.questions.filter(isCachedQuestion);
    return valid.length >= amount ? shuffle(valid).slice(0, amount) : [];
  } catch {
    return [];
  }
}

function isCachedQuestion(value: unknown): value is TriviaQuestion {
  if (typeof value !== 'object' || value === null) return false;
  const question = value as Partial<TriviaQuestion>;
  return typeof question.id === 'string' && typeof question.category === 'string' &&
    typeof question.question === 'string' && typeof question.correctAnswer === 'string' &&
    Array.isArray(question.incorrectAnswers) && question.incorrectAnswers.every((answer) => typeof answer === 'string') &&
    Array.isArray(question.options) && question.options.length === 4 && question.options.every((answer) => typeof answer === 'string');
}

function saveSameDayCache(dateKey: string, questions: TriviaQuestion[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ dateKey, questions }));
  } catch {
    // The game can still use the current response if storage is unavailable.
  }
}

/** Returns only a previously fetched Open Trivia DB set for the current IST day. */
export function getDailyTrivia(dateKey: string = getISTDateString()): TriviaQuestion[] {
  return readSameDayCache(dateKey, 5);
}

/** Fetches Open Trivia DB content, validates its shape, and caches the licensed set on this device. */
export async function fetchLiveTriviaQuestions(
  amount = 10,
  category?: number,
  difficulty?: 'easy' | 'medium' | 'hard',
  dateKey = getISTDateString(),
): Promise<TriviaQuestion[]> {
  if (inFlightRequest) return inFlightRequest.then((questions) => questions.slice(0, amount));

  const now = Date.now();
  if (now - lastOpenTdbRequestTime < OPENTDB_COOLDOWN_MS) return readSameDayCache(dateKey, amount);

  let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
  if (category) url += `&category=${category}`;
  if (difficulty) url += `&difficulty=${difficulty}`;

  lastOpenTdbRequestTime = now;
  inFlightRequest = (async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) return readSameDayCache(dateKey, amount);
      const data: unknown = await response.json();
      if (typeof data !== 'object' || data === null) return readSameDayCache(dateKey, amount);
      const payload = data as { response_code?: unknown; results?: unknown };
      if (payload.response_code !== 0 || !Array.isArray(payload.results)) return readSameDayCache(dateKey, amount);

      const parsed = payload.results.filter(isOpenTriviaQuestion).map((question, index): TriviaQuestion => {
        const correctAnswer = decodeHtmlEntities(question.correct_answer);
        const incorrectAnswers = question.incorrect_answers.map(decodeHtmlEntities);
        return {
          id: `opentdb-${dateKey}-${index}`,
          category: decodeHtmlEntities(question.category),
          difficulty: question.difficulty,
          question: decodeHtmlEntities(question.question),
          correctAnswer,
          incorrectAnswers,
          options: shuffle([correctAnswer, ...incorrectAnswers]),
        };
      });

      if (parsed.length < amount) return readSameDayCache(dateKey, amount);
      saveSameDayCache(dateKey, parsed);
      return parsed;
    } catch {
      return readSameDayCache(dateKey, amount);
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest.then((questions) => questions.slice(0, amount));
}
