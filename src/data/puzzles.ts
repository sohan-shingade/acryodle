import type { Puzzle } from "../types";
import { BY_NAME, initialOf } from "./companies";

// The answer bank. Each puzzle's `name` MUST equal the initials of its
// `members` in order (with current company names — note Facebook is "Meta",
// so classic FAANG reads as MAANG here). Every member must exist in
// companies.ts. validatePuzzles() enforces both invariants in dev.
//
// To add a puzzle: append below, run `npm run dev`, and check the console.
export const PUZZLES: Puzzle[] = [
  { name: "MANGOS", members: ["Meta", "Anthropic", "Nvidia", "Google", "OpenAI", "SpaceX"], note: "AI-era 2026 · contested" },
  { name: "MANGA",  members: ["Meta", "Amazon", "Nvidia", "Google", "Apple"],               note: "FAANG-era variant" },
  { name: "GAMMA",  members: ["Google", "Amazon", "Meta", "Microsoft", "Apple"],            note: "post-Meta FAANG swap" },
  { name: "MAANG",  members: ["Meta", "Apple", "Amazon", "Netflix", "Google"],              note: "modern spelling of FAANG" },
  { name: "BATX",   members: ["Baidu", "Alibaba", "Tencent", "Xiaomi"],                     note: "China big tech" },
  { name: "BAT",    members: ["Baidu", "Alibaba", "Tencent"],                               note: "China's original trio" },

  // ── Word-acronyms (rotation pool) ─────────────────────────────
  { name: "MAGMA",  members: ["Meta", "Apple", "Google", "Microsoft", "Amazon"],            note: "the mega-cap five" },
  { name: "TITANS", members: ["Tesla", "IBM", "TSMC", "Apple", "Nvidia", "Samsung"],        note: "tech titans" },
  { name: "GIANTS", members: ["Google", "IBM", "Apple", "Nvidia", "Tesla", "Samsung"],      note: "the giants" },
  { name: "MANIAC", members: ["Meta", "Amazon", "Nvidia", "Intuit", "AMD", "Cisco"],        note: "word-acronym" },
  { name: "MATRIX", members: ["Meta", "Apple", "Tesla", "Reddit", "IBM", "Xiaomi"],         note: "word-acronym" },
  { name: "ROBOTS", members: ["Roblox", "Oracle", "Broadcom", "Okta", "Tesla", "Samsung"],  note: "word-acronym" },
  { name: "DRAGON", members: ["Disney", "Reddit", "Amazon", "Google", "Oracle", "Nvidia"],  note: "word-acronym" },
  { name: "BANANA", members: ["Baidu", "Apple", "Nvidia", "Amazon", "Nintendo", "AMD"],     note: "word-acronym" },
  { name: "NACHOS", members: ["Nvidia", "Amazon", "Cisco", "HP", "Oracle", "Samsung"],      note: "word-acronym" },
  { name: "AMIGOS", members: ["Apple", "Meta", "IBM", "Google", "Oracle", "Samsung"],       note: "word-acronym" },
  { name: "ABACUS", members: ["Apple", "Broadcom", "Amazon", "Cisco", "Uber", "Samsung"],   note: "word-acronym" },
  { name: "PANDA",  members: ["Palantir", "Apple", "Nvidia", "Dell", "Amazon"],             note: "word-acronym" },
  { name: "TACOS",  members: ["Tesla", "Apple", "Cisco", "Oracle", "Samsung"],              note: "word-acronym" },
  { name: "ATOMS",  members: ["Apple", "Tesla", "Oracle", "Microsoft", "Samsung"],          note: "word-acronym" },
  { name: "CLOUD",  members: ["Cloudflare", "Lyft", "Oracle", "Uber", "Dell"],              note: "word-acronym" },
  { name: "SPACE",  members: ["SpaceX", "Palantir", "Apple", "Cisco", "Eli Lilly"],         note: "word-acronym" },
  { name: "PIXAR",  members: ["Palantir", "IBM", "Xiaomi", "Apple", "Reddit"],              note: "word-acronym" },
  { name: "OASIS",  members: ["Oracle", "Apple", "Samsung", "IBM", "Spotify"],              note: "word-acronym" },
  { name: "COBRA",  members: ["Costco", "Oracle", "Broadcom", "Reddit", "Amazon"],          note: "word-acronym" },
  { name: "SAMBA",  members: ["Samsung", "Apple", "Meta", "Broadcom", "Amazon"],            note: "word-acronym" },
  { name: "MEDIA",  members: ["Meta", "Eli Lilly", "Disney", "IBM", "Apple"],               note: "word-acronym" },
  { name: "PIANO",  members: ["Palantir", "IBM", "Apple", "Nvidia", "Oracle"],              note: "word-acronym" },
  { name: "DISCO",  members: ["Disney", "IBM", "Snap", "Cisco", "Oracle"],                  note: "word-acronym" },
  { name: "ATARI",  members: ["Apple", "Tesla", "Amazon", "Reddit", "IBM"],                 note: "word-acronym" },

  // ── Real Wall-Street acronyms (Alphabet unlocks the 'A') ──────
  { name: "MAMAA",    members: ["Meta", "Apple", "Microsoft", "Amazon", "Alphabet"],                            note: "Cramer's 2021 FAANG rebrand" },
  { name: "MATANA",   members: ["Microsoft", "Apple", "Tesla", "Amazon", "Nvidia", "Alphabet"],                 note: "AI/EV era (Ray Wang, 2022)" },
  { name: "BATMMAAN", members: ["Broadcom", "Apple", "Tesla", "Microsoft", "Meta", "Amazon", "Alphabet", "Nvidia"], note: "yes — like Batman" },
  { name: "GAMAM",    members: ["Google", "Apple", "Meta", "Amazon", "Microsoft"],                              note: "GAFAM, current names" },
  { name: "MAAMG",    members: ["Meta", "Apple", "Amazon", "Microsoft", "Google"],                              note: "FAAMG, current names" },

  // ── Quirky word-acronyms ──────────────────────────────────────
  { name: "WOMBAT",  members: ["Walmart", "Oracle", "Meta", "Broadcom", "Apple", "Tesla"],          note: "marsupial portfolio" },
  { name: "ZOMBIE",  members: ["Zoom", "Oracle", "Meta", "Broadcom", "IBM", "Eli Lilly"],           note: "spooky" },
  { name: "CATNIP",  members: ["Costco", "Apple", "Tesla", "Nvidia", "IBM", "Palantir"],            note: "irresistible" },
  { name: "WALNUT",  members: ["Walmart", "Apple", "Lyft", "Nvidia", "Uber", "Tesla"],              note: "tough nut" },
  { name: "SAMOSA",  members: ["Samsung", "Apple", "Meta", "Oracle", "Spotify", "Amazon"],          note: "tasty" },
  { name: "MAGNET",  members: ["Meta", "Apple", "Google", "Nvidia", "Eli Lilly", "Tesla"],          note: "attractive caps" },
  { name: "COMBAT",  members: ["Costco", "Oracle", "Meta", "Broadcom", "Amazon", "Tesla"],          note: "ready to fight" },
  { name: "SAFARI",  members: ["Samsung", "Apple", "Fortinet", "Amazon", "Reddit", "IBM"],          note: "on the hunt" },
  { name: "COSMIC",  members: ["Costco", "Oracle", "Samsung", "Microsoft", "IBM", "Cisco"],         note: "out of this world" },
  { name: "DORITOS", members: ["Disney", "Oracle", "Reddit", "IBM", "Tesla", "Okta", "Samsung"],    note: "crunchy" },
];

// Curated opening week (launch days #1..#7): start with the most recognizable,
// approachable acronyms so new players ramp up gently. Day N uses OPENING_WEEK[N-1]
// when it exists in the bank; after the opener, the daily rotation takes over.
export const OPENING_WEEK: string[] = [
  "MANGOS", // #1 — launch day (Jun 17), the flagship AI-era lineup
  "MANGOS", // #2 — repeat the launch word one more day
  "GAMMA",  // #3 — post-Meta FAANG
  "MAGMA",  // #4 — the mega-cap five
  "BATX",   // #5 — China big tech
  "MANGOS", // #6 — Jun 22, back to the flagship AI-era lineup
  "MATANA", // #7 — the AI/EV era
];

export function validatePuzzles(): string[] {
  const errors: string[] = [];
  for (const p of PUZZLES) {
    const spelled = p.members.map((m) => initialOf(m)).join("");
    if (spelled !== p.name) errors.push(`${p.name}: members spell "${spelled}"`);
    for (const m of p.members) if (!BY_NAME[m]) errors.push(`${p.name}: unknown company "${m}"`);
  }
  return errors;
}
