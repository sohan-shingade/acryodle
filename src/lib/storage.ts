import type { Settings, Stats, DailyState } from "../types";

const PREFIX = "acrodle:";
const LEGACY_PREFIX = "acryodle:"; // pre-rename key namespace

// One-time migration: copy any keys from the old "acryodle:" namespace into the
// new "acrodle:" one so existing players keep their streaks/stats, then drop the
// old keys. Safe to run every load — it no-ops once migrated.
(function migrateLegacyKeys() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(LEGACY_PREFIX))
      .forEach((oldKey) => {
        const newKey = PREFIX + oldKey.slice(LEGACY_PREFIX.length);
        if (localStorage.getItem(newKey) === null) {
          const v = localStorage.getItem(oldKey);
          if (v !== null) localStorage.setItem(newKey, v);
        }
        localStorage.removeItem(oldKey);
      });
  } catch {
    /* storage unavailable — nothing to migrate */
  }
})();

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

// First-visit flag so the intro/how-to-play only auto-opens once.
export const loadSeenIntro = () => load<boolean>("seenIntro", false);
export const saveSeenIntro = () => save("seenIntro", true);
