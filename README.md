# Nikimak League Scoreboard

A modern, neon‑styled **league scoreboard** built with **Next.js 16**, **React 19**, **Tailwind CSS 4**, and **MongoDB**.

It shows how many wins each player has on every day of the season, grouped by **Persian calendar months**, with a compact summary strip and a detailed, horizontally scrollable table.

---

## Features

- **Persian‑aware calendar view**

  - Dates stored as ISO (`YYYY-MM-DD`) in the DB
  - Grouped and labeled by **Persian calendar months** on the UI
  - Current month totals automatically ignore future days

- **Dynamic data from MongoDB**

  - `/api/scoreboard` reads the latest season from a `scoreboards` collection
  - Schema:
    - `leagueKey`, `seasonKey`, optional `title`
    - `dates: string[]`
    - `players: { playerKey?, name, winsByDate: Record<DateKey, number> }[]`

- **Beautiful UI**

  - Neon dark theme with glassmorphism
  - Compact player summary cards (rank, total wins, best month, current month)
  - Sticky first column and smooth horizontal scroll
  - Custom scrollbar styled to match the UI
  - On first load, the table auto‑scrolls to the **latest days**

- **Resilient UX**
  - Polished loading state with spinner + animated progress bar
  - Friendly “no data” state with retry button if `/api/scoreboard` fails or returns nothing

---

## Tech Stack

- **Framework**: Next.js `16.0.3` (App Router)
- **Language**: TypeScript
- **UI**: React `19.2.0`, Tailwind CSS `4`, `tw-animate-css`
- **Fonts**: Geist Sans & Geist Mono
- **Database**: MongoDB (`mongodb` driver)
- **API**: Route handler at `app/api/scoreboard/route.ts`

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/maryamabdi76/nikimak.git
cd nikimak
pnpm install   # or: npm install / yarn install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root with your MongoDB connection string:

```bash
MONGODB_URI="your-mongodb-connection-string"
```

The default API route expects a database named `scoreboard`:

- **Database**: `scoreboard`
- **Collection**: `scoreboards`

Each document should look like:

```jsonc
{
  "leagueKey": "quantum-league",
  "seasonKey": "2025-fall",
  "title": "Quantum League – Fall 2025 Scoreboard",
  "dates": ["2025-10-13", "2025-10-14", "..."],
  "players": [
    {
      "playerKey": "maryam",
      "name": "Maryam",
      "winsByDate": {
        "2025-10-13": 1,
        "2025-10-14": 4
      }
    }
  ]
}
```

You can use `constants/scoreboards.json` as a reference for the shape and example data.

### 3. Run the dev server

```bash
pnpm dev   # or npm run dev / yarn dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

The home page will:

1. Call `/api/scoreboard`
2. Show the animated loading state while fetching
3. Render the scoreboard UI once data is available

---

## Project Structure (key files)

- `app/layout.tsx` – Root layout, fonts, metadata
- `app/page.tsx` – Main scoreboard UI (summary strip + detailed table)
- `app/api/scoreboard/route.ts` – API route to fetch the active scoreboard from MongoDB
- `lib/mongodb.ts` – MongoDB client helper
- `app/globals.css` – Tailwind + theme tokens + custom scrollbar styling
- `constants/scoreboards.json` – Example scoreboard document for reference

---

## Data Model

```ts
export type DateKey = string;

type PlayerFromDb = {
  playerKey?: string;
  name: string;
  winsByDate: Record<DateKey, number>;
};

type Scoreboard = {
  leagueKey: string;
  seasonKey: string;
  title?: string;
  dates: DateKey[];
  players: PlayerFromDb[];
};
```

The UI transforms `winsByDate` into internal `PlayerRow` objects and computes:

- Per‑day cells
- Month totals per player (`getMonthTotal`)
- Total wins, best month, and current month totals for the summary cards

---

## Customization

- **Change league/season**  
  Update the query in `app/api/scoreboard/route.ts`:

  ```ts
  .findOne({
    leagueKey: 'quantum-league',
    seasonKey: '2025-fall',
  });
  ```

- **Add more players or dates**  
  Insert or update documents in the `scoreboards` collection; the UI will automatically adapt (dates are sorted and grouped dynamically).

- **Styling tweaks**  
  Most visual styles live in Tailwind classNames in `app/page.tsx` and a few global rules in `app/globals.css` (including the `.table-scroll` scrollbar styles).

---

## Scripts

```bash
pnpm dev      # Start dev server
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

---

## License

This project is currently unlicensed (all rights reserved).  
Feel free to fork it for personal use or experimentation.
