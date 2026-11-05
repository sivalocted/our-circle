import { getISTDateString, createSeededRNG } from './istTime';
import type { NumberPuzzleChallenge } from './types';
export type { NumberPuzzleChallenge };

export const CURATED_NUMBER_PUZZLES: NumberPuzzleChallenge[] = [
  {
    id: 'num_1',
    numbers: [8, 3, 3, 8],
    target: 24,
    bestFormulaHint: '8 / (3 - (8 / 3)) = 24',
  },
  {
    id: 'num_2',
    numbers: [6, 4, 3, 2],
    target: 24,
    bestFormulaHint: '(6 - 2) * (4 + 3) - 4... or (6 * 4) * (3 - 2) = 24',
  },
  {
    id: 'num_3',
    numbers: [7, 7, 3, 1],
    target: 24,
    bestFormulaHint: '(7 + 1/7) * 3... or (7 - (1 / 7)) * 3... or (7 * 3) + (7 / 1) - 4 = 24',
  },
  {
    id: 'num_4',
    numbers: [5, 5, 5, 1],
    target: 24,
    bestFormulaHint: '5 * (5 - (1 / 5)) = 24',
  },
  {
    id: 'num_5',
    numbers: [9, 6, 4, 2],
    target: 24,
    bestFormulaHint: '(9 - 6) * 4 * 2 = 24',
  },
  {
    id: 'num_6',
    numbers: [8, 8, 4, 2],
    target: 24,
    bestFormulaHint: '(8 * 2) + 8 - 0... or 8 + 8 + 4 + 4 = 24',
  },
  {
    id: 'num_7',
    numbers: [12, 6, 2, 1],
    target: 24,
    bestFormulaHint: '(12 - 6) * (2 + 2)... or 12 * 2 * (6 - 5) = 24',
  },
  {
    id: 'num_8',
    numbers: [4, 4, 10, 10],
    target: 24,
    bestFormulaHint: '(10 * 10 - 4) / 4 = 24',
  },
];

export function getDailyNumberPuzzle(dateKey: string = getISTDateString()): NumberPuzzleChallenge {
  const rng = createSeededRNG(`number-ist-${dateKey}`);
  const index = Math.floor(rng() * CURATED_NUMBER_PUZZLES.length);
  return CURATED_NUMBER_PUZZLES[index];
}

export function getRandomPracticeNumberPuzzle(): NumberPuzzleChallenge {
  const index = Math.floor(Math.random() * CURATED_NUMBER_PUZZLES.length);
  return CURATED_NUMBER_PUZZLES[index];
}
