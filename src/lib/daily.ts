// Day number = whole days since 2025-01-01 (UTC). Used for the daily puzzle
// index and the share string (#N), the same idea as Wordle's puzzle number.
const EPOCH = Date.UTC(2025, 0, 1);

export function dayNumber(now: number = Date.now()): number {
  return Math.floor((now - EPOCH) / 86_400_000);
}

export function dailyIndex(bankLength: number, now: number = Date.now()): number {
  return dayNumber(now) % bankLength;
}
