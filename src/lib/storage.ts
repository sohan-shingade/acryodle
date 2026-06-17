import type { Settings, Stats, DailyState } from "../types";

const PREFIX = "tickerdle:";

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage may be unavailable (private mode, sandbox) — fail silently */
  }
}

export const DEFAULT_SETTINGS: Settings = { dark: true, colorblind: false, hard: false };
export const DEFAULT_STATS: Stats = { played: 0, wins: 0, cur: 0, max: 0, lastDay: null, dist: {} };

export const loadSettings = () => load<Settings>("settings", DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => save("settings", s);

export const loadStats = () => load<Stats>("stats", DEFAULT_STATS);
export const saveStats = (s: Stats) => save("stats", s);

export const loadDaily = (day: number) => load<DailyState | null>(`day:${day}`, null);
export const saveDaily = (day: number, state: DailyState) => save(`day:${day}`, state);
