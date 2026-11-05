import { describe, expect, it } from 'vitest';
import { getISTDate, getISTDateString, getISTDayNumber, getTimeUntilNextISTMidnight } from '../services/contentEngine/istTime';

describe('IST calendar utilities', () => {
  it('keeps the previous IST date immediately before midnight even when UTC is on the next date', () => {
    const now = new Date('2026-11-06T18:29:59.000Z');

    expect(getISTDateString(now)).toBe('2026-11-06');
    expect(getISTDate(now).getDate()).toBe(6);
  });

  it('advances the daily key at midnight in Asia/Kolkata', () => {
    const now = new Date('2026-11-06T18:30:00.000Z');

    expect(getISTDateString(now)).toBe('2026-11-07');
  });

  it('counts down to the next IST midnight using the absolute instant', () => {
    const now = new Date('2026-11-06T18:00:00.000Z');

    expect(getTimeUntilNextISTMidnight(now)).toMatchObject({
      hours: 0,
      minutes: 30,
      formatted: '00:30:00',
    });
  });

  it('numbers daily puzzles by IST calendar day', () => {
    expect(getISTDayNumber(new Date('2026-01-01T00:00:00.000Z'))).toBe(1);
    expect(getISTDayNumber(new Date('2026-01-01T18:30:00.000Z'))).toBe(2);
  });
});
