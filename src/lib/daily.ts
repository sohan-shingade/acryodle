// Puzzle #1 is launch day; the counter ticks up one per day after that — the
// same idea as Wordle's puzzle number. EPOCH is the UTC midnight of the day
// before launch, so dayNumber() returns 1 on launch day and increments daily.
const EPOCH = Date.UTC(2026, 5, 16);

export function dayNumber(now: number = Date.now()): number {
  return Math.floor((now - EPOCH) / 86_400_000);
}

export function dailyIndex(bankLength: number, now: number = Date.now()): number {
  return dayNumber(now) % bankLength;
}

// Milliseconds until the next UTC midnight — the moment dayNumber() ticks over.
// (UTC midnights are exact multiples of one day from the Unix epoch.)
export function msToNextDay(now: number = Date.now()): number {
  return 86_400_000 - (now % 86_400_000);
}
