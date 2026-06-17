# TICKERDLE

A daily **Wordle for Big Tech acronyms**. A hidden acronym (FAANG, MANGOS, GAMMA, …)
is a lineup of companies; you fill a company into each slot and every guess is graded
**Wordle-style on membership** (green = right company & slot, yellow = in the group but
wrong slot, gray = not in it) **plus market cap and sector** so each guess teaches you
something about the companies.

Built with Vite + React + TypeScript. No backend — state persists in `localStorage`.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build locally
```

## Deploy

It's a static site (`dist/`), so anything that serves static files works.

- **Vercel** — import the repo; framework auto-detects as Vite (`vercel.json` included). Zero config.
- **Netlify** — build command `npm run build`, publish directory `dist`.
- **GitHub Pages** — `npm run build`, push `dist/` (or use an action). `vite.config.ts`
  already sets `base: "./"` so relative asset paths work on a project subpath.

## How it plays

- Start typing anywhere → it opens the next empty slot and searches the company list.
- **Enter** picks the top result and auto-advances; **Backspace** edits the search, or
  (when the search is empty) deletes the last filled tile.
- 6 tries. Win/lose, share an emoji grid, and your streak/stats are saved locally.
- Settings: dark theme, colorblind (high-contrast) palette, and hard mode (revealed
  hints must be reused).

## Project structure

```
src/
  data/
    companies.ts   # the company universe (name, sector, cap, fact)
    puzzles.ts     # the acronym answer bank (+ dev-time validation)
  lib/
    grading.ts     # cap/sector grading + labels
    daily.ts       # daily puzzle index from the date
    storage.ts     # localStorage load/save (settings, stats, daily board)
  hooks/
    useGame.ts     # all game state, persistence, and keyboard handling
  theme.ts         # light/dark + colorblind palettes
  App.tsx          # presentation (board, picker, modals)
  main.tsx
```

## Adding content

- **A new acronym:** add an entry to `src/data/puzzles.ts`. Its `name` must equal the
  members' initials in order, and every member must exist in `companies.ts`. Run
  `npm run dev` and check the console — `validatePuzzles()` flags mistakes.
- **A new company:** append to `src/data/companies.ts`.

See `CLAUDE.md` for deeper guidance (including how to support Alphabet/Meta synonyms
needed for acronyms like MAMAA and MATANA).

## Data accuracy

Market caps are **approximate June 2026** snapshots; only the order of magnitude
matters for grading (the bands are wide). Private/just-listed valuations (Anthropic,
OpenAI, SpaceX, etc.) are estimates and marked `pvt`. Several AI-era acronyms (MANGO,
MANGOS) have **competing definitions in the wild** — the bank uses one current reading
and labels them "contested." Refresh figures before a public launch.

## License

MIT — see `LICENSE`.
