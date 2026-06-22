# CLAUDE.md

Guidance for Claude Code (and humans) working in this repo.

## What this is

ACRODLE — a static, single-page daily game. A hidden acronym is a list of companies;
the player fills a company per slot and is graded Wordle-style (membership) plus on
market cap and sector. Stack: Vite + React 18 + TypeScript, no backend, state in
`localStorage`.

## Commands

```bash
npm run dev        # local dev server
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + production build (run before declaring done)
npm run preview    # serve the production build
```

Always run `npm run build` before finishing a change; the repo is configured with
`strict`, `noUnusedLocals`, and `noUnusedParameters`, so dead code fails the build.

## Architecture

- **`src/data/`** is the content layer and the thing you'll edit most.
  - `companies.ts` — the universe. Each `Company` is `{ name, sector, cap, pvt?, fact? }`.
    `name` is also the unique key used for equality checks.
  - `puzzles.ts` — the answer bank. Each `Puzzle` is `{ name, members[], note }`.
    **Invariant:** `name` === the members' initials in order, and every member exists in
    `companies.ts`. `validatePuzzles()` runs in dev and logs violations to the console.
- **`src/lib/`** is pure logic (no React): `grading.ts` (cap/sector → Grade), `daily.ts`
  (date → puzzle index), `storage.ts` (typed localStorage wrappers).
- **`src/hooks/useGame.ts`** owns ALL game state, persistence, streak math, and the
  physical-keyboard handler. This is the brain. Most behavior changes happen here.
- **`src/App.tsx`** is presentation only — board, picker, end screen, modals. It reads
  everything from the `Game` object returned by `useGame`.
- **`src/theme.ts`** returns palettes for light/dark and a colorblind variant. Colors are
  applied as inline styles (theme switches via re-render), which is intentional for this
  app's size.

## Conventions

- Keep `data/` and `lib/` free of JSX. UI stays in `App.tsx` / `theme.ts`.
- Grading equality is by company `name`. If you need synonyms (see below), add a
  canonical-key layer in `lib/grading.ts` rather than sprinkling special cases.
- The tile reveal animation runs **once on mount** per tile via the Web Animations API
  (`element.animate` in a `useEffect([])` inside `SubmittedTile`). Do NOT move it back to
  a CSS class toggled on submitted cells — that caused a replay bug on every re-render.
- No `localStorage` access outside `lib/storage.ts`.

## Common tasks

### Add an acronym
Append to `PUZZLES` in `src/data/puzzles.ts`. Verify the initials spell the name and all
members exist (dev console will tell you). Prefer acronyms whose members' **current**
names spell them — note Facebook is "Meta", so classic FAANG is entered as "MAANG".

### Support Alphabet/Meta synonyms (needed for MAMAA, MATANA, GAFAM…)
These need the same company under two letters (Google=G vs Alphabet=A). Plan:
1. Add an `Alphabet` entry to `companies.ts` (same stats as Google).
2. Add a `synonym` map (e.g. `{ Alphabet: "Google" }`) and a `canonical(name)` helper in
   `lib/grading.ts`.
3. Use `canonical()` in `useGame.ts` for `ANSWER_SET` membership, `fixedSlots`, and the
   `won`/position checks so either name grades as the same company.

### Make it a true once-per-day game
Currently "Next puzzle" gives free play and the daily resumes from `localStorage`. To
lock to one daily play, hide "Next puzzle" (or gate it behind a dev flag) and the daily
board/stat-guard already prevent recounting.

### Refresh market data
Edit `cap` values in `companies.ts`. Only relative magnitude matters; keep ordering sane.

## Gotchas

- Caps/valuations are approximate (June 2026) and `pvt` ones are estimates.
- Some AI-era acronyms are contested; the bank picks one reading and labels it.
- Stats now persist; when testing streak logic, clear `localStorage` keys prefixed
  `acrodle:` between runs.
