export type Sector =
  | "social" | "consumer" | "ecommerce" | "cloud" | "semis" | "ailab"
  | "media" | "space" | "fintech" | "finance" | "search" | "ev"
  | "energy" | "pharma" | "retail" | "networking" | "hardware"
  | "mobility" | "conglomerate";

export interface Company {
  /** Display name. Also the unique key used for membership/position checks. */
  name: string;
  sector: Sector;
  /** Approximate market cap in $B (order-of-magnitude is what grading uses). */
  cap: number;
  /** Private or freshly listed — valuation is an estimate. */
  pvt?: boolean;
  /** One-line fact shown in the "Locked in" panel. */
  fact?: string;
}

export interface Puzzle {
  /** The acronym, e.g. "MANGOS". Must equal the members' initials in order. */
  name: string;
  /** Company display names in acronym order. */
  members: string[];
  /** Short provenance shown on the end screen. */
  note: string;
}

export type Grade = "correct" | "close" | "wrong";

export interface Settings {
  dark: boolean;
  colorblind: boolean;
  hard: boolean;
}

export interface Stats {
  played: number;
  wins: number;
  cur: number;
  max: number;
  /** Day number of the last completed DAILY puzzle (for streak math). */
  lastDay: number | null;
  /** Guess-count -> number of wins solved in that many guesses. */
  dist: Record<number, number>;
}

export interface DailyState {
  rows: string[][];
  done: boolean;
  won: boolean;
}
