import { getISTDateString, createSeededRNG } from './istTime';
import type { ConnectionsBoard, ConnectionGroup } from './types';
export type { ConnectionsBoard, ConnectionGroup };

export const CURATED_CONNECTIONS_BOARDS: ConnectionsBoard[] = [
  {
    id: 'conn_1',
    groups: [
      {
        category: 'Items commonly served with tea',
        items: ['CHAI', 'BISCUIT', 'SAMOSA', 'GOSSIP'],
        difficulty: 'easy',
        color: '#F5C77E', // Warm Chai Amber
      },
      {
        category: 'Cinematic camera vocabulary',
        items: ['ZOOM', 'PAN', 'TILT', 'TRACK'],
        difficulty: 'medium',
        color: '#34D399', // Emerald
      },
      {
        category: 'Objects that possess physical or digital keys',
        items: ['PIANO', 'KEYBOARD', 'MAP', 'LOCK'],
        difficulty: 'hard',
        color: '#60A5FA', // Azure
      },
      {
        category: 'Words that follow "SPACE"',
        items: ['BAR', 'SUIT', 'CRAFT', 'TIME'],
        difficulty: 'tricky',
        color: '#C084FC', // Violet
      },
    ],
    allWords: [
      'CHAI', 'BISCUIT', 'SAMOSA', 'GOSSIP',
      'ZOOM', 'PAN', 'TILT', 'TRACK',
      'PIANO', 'KEYBOARD', 'MAP', 'LOCK',
      'BAR', 'SUIT', 'CRAFT', 'TIME',
    ],
  },
  {
    id: 'conn_2',
    groups: [
      {
        category: 'Our Circle Archive Modes',
        items: ['MOTION', 'CINEMA', 'SPATIAL', 'FILMSTRIP'],
        difficulty: 'easy',
        color: '#F5C77E',
      },
      {
        category: 'Celestial bodies',
        items: ['COMET', 'ASTEROID', 'METEOR', 'PLANET'],
        difficulty: 'medium',
        color: '#34D399',
      },
      {
        category: 'Types of coffee preparation',
        items: ['DRIP', 'ESPRESSO', 'FRENCH', 'COLD'],
        difficulty: 'hard',
        color: '#60A5FA',
      },
      {
        category: 'Things associated with the number 7',
        items: ['WONDERS', 'SEAS', 'CONTINENTS', 'SINS'],
        difficulty: 'tricky',
        color: '#C084FC',
      },
    ],
    allWords: [
      'MOTION', 'CINEMA', 'SPATIAL', 'FILMSTRIP',
      'COMET', 'ASTEROID', 'METEOR', 'PLANET',
      'DRIP', 'ESPRESSO', 'FRENCH', 'COLD',
      'WONDERS', 'SEAS', 'CONTINENTS', 'SINS',
    ],
  },
  {
    id: 'conn_3',
    groups: [
      {
        category: 'Gemstones & precious minerals',
        items: ['RUBY', 'EMERALD', 'SAPPHIRE', 'DIAMOND'],
        difficulty: 'easy',
        color: '#F5C77E',
      },
      {
        category: 'Card game terms',
        items: ['FLUSH', 'DECK', 'TRUMP', 'SHUFFLE'],
        difficulty: 'medium',
        color: '#34D399',
      },
      {
        category: 'Famous architectural landmarks in India',
        items: ['CHARMINAR', 'GATEWAY', 'HAVELI', 'QUTUB'],
        difficulty: 'hard',
        color: '#60A5FA',
      },
      {
        category: 'Words before "JACK"',
        items: ['LUMBER', 'BLACK', 'APPLE', 'CRACKER'],
        difficulty: 'tricky',
        color: '#C084FC',
      },
    ],
    allWords: [
      'RUBY', 'EMERALD', 'SAPPHIRE', 'DIAMOND',
      'FLUSH', 'DECK', 'TRUMP', 'SHUFFLE',
      'CHARMINAR', 'GATEWAY', 'HAVELI', 'QUTUB',
      'LUMBER', 'BLACK', 'APPLE', 'CRACKER',
    ],
  },
];

function shuffle<T>(array: T[], rng?: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor((rng ? rng() : Math.random()) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getDailyConnectionsBoard(dateKey: string = getISTDateString()): ConnectionsBoard {
  const rng = createSeededRNG(`connections-ist-${dateKey}`);
  const boardIndex = Math.floor(rng() * CURATED_CONNECTIONS_BOARDS.length);
  const board = CURATED_CONNECTIONS_BOARDS[boardIndex];
  return {
    ...board,
    allWords: shuffle(board.allWords, rng),
  };
}

export function getRandomPracticeConnectionsBoard(): ConnectionsBoard {
  const boardIndex = Math.floor(Math.random() * CURATED_CONNECTIONS_BOARDS.length);
  const board = CURATED_CONNECTIONS_BOARDS[boardIndex];
  return {
    ...board,
    allWords: shuffle(board.allWords),
  };
}
