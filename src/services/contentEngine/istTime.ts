/**
 * Asia/Kolkata (IST) Standard Time Utilities
 * Guarantees every member across the world gets the exact same daily puzzle
 * based on midnight India Standard Time (UTC+5:30), regardless of device zone.
 */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const istFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function getISTParts(now: Date = new Date()) {
  const parts = Object.fromEntries(
    istFormatter.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function getISTDate(now: Date = new Date()): Date {
  const { year, month, day, hour, minute, second } = getISTParts(now);
  // Use local fields as a calendar tuple for existing callers of getMonth/getDate.
  return new Date(year, month - 1, day, hour, minute, second, now.getMilliseconds());
}

export function getISTDateString(now: Date = new Date()): string {
  const { year, month: monthNumber, day: dayNumber } = getISTParts(now);
  const month = String(monthNumber).padStart(2, '0');
  const day = String(dayNumber).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getISTDayNumber(now: Date = new Date()): number {
  const { year, month, day } = getISTParts(now);
  const currentDay = Date.UTC(year, month - 1, day);
  const epoch = Date.UTC(2026, 0, 1);
  return Math.max(1, Math.floor((currentDay - epoch) / 86400000) + 1);
}

export function getTimeUntilNextISTMidnight(now: Date = new Date()): { hours: number; minutes: number; seconds: number; formatted: string } {
  const { year, month, day } = getISTParts(now);
  const nextMidnightUtc = Date.UTC(year, month - 1, day + 1) - IST_OFFSET_MS;
  const diffMs = Math.max(0, nextMidnightUtc - now.getTime());

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return { hours, minutes, seconds, formatted };
}

/**
 * Deterministic pseudo-random generator (Mulberry32)
 * Seeded with an integer or string (e.g. "2026-11-04")
 */
export function createSeededRNG(seedStr: string | number) {
  let s = typeof seedStr === 'number' ? seedStr : hashString(String(seedStr));
  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
