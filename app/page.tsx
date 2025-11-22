'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// Central calendar config so we don't repeat magic strings
const PERSIAN_CALENDAR_LOCALE = 'fa-IR';

export type DateKey = string;

// What we expect from API
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

type PlayerRow = {
  name: string;
  wins: Record<DateKey, number>;
};

// Persian calendar month grouping key (e.g. "01", "02", ..., "12")
type MonthKey = string;

type DateMeta = {
  label: DateKey; // "YYYY-MM-DD"
  date: Date; // JS Date, used only for formatting / calendar
  monthKey: MonthKey; // Persian month ("01".."12")
};

type Column =
  | { kind: 'date'; label: DateKey; date: Date }
  | { kind: 'month-total'; monthKey: MonthKey; label: string };

const TODAY = new Date();
// This is safe for lexicographical comparison because it's ISO-like.
const TODAY_KEY = TODAY.toISOString().slice(0, 10);

/**
 * Build metadata for each date:
 * - Sort by date string so dynamic data is always in order.
 * - Parse to Date (local) for formatting.
 * - Derive Persian calendar month key.
 */
function buildDateMeta(dateStrings: DateKey[]): DateMeta[] {
  return dateStrings
    .slice()
    .sort()
    .map((label) => {
      const [yearStr, monthStr, dayStr] = label.split('-');
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      const day = Number(dayStr);

      // Create date in local timezone (no UTC conversion needed for Persian calendar)
      const date = new Date(year, monthIndex, day);

      // Get Persian calendar month key (01-12)
      const faMonthKey = date.toLocaleDateString(PERSIAN_CALENDAR_LOCALE, {
        month: '2-digit',
      });

      return {
        label,
        date,
        monthKey: faMonthKey,
      };
    });
}

/**
 * Build columns: one column per day + a "month-total" column
 * at the end of each Persian month group.
 * Format: "آبان total" (month name in Persian + " total")
 *
 * Example: 26 آبان, 27 آبان, 28 آبان, [آبان total], 01 آذر, 02 آذر, [آذر total]
 */
function buildColumns(dateMeta: DateMeta[]): Column[] {
  const cols: Column[] = [];

  if (dateMeta.length === 0) return cols;

  dateMeta.forEach((meta, index) => {
    // Add the date column
    cols.push({ kind: 'date', label: meta.label, date: meta.date });

    // Check if this is the last date of the current month
    const nextMeta = dateMeta[index + 1];
    const isEndOfMonth = !nextMeta || nextMeta.monthKey !== meta.monthKey;

    if (isEndOfMonth) {
      // Get Persian month name for the label
      const faMonthShort = meta.date.toLocaleDateString(
        PERSIAN_CALENDAR_LOCALE,
        { month: 'short' }
      );

      // Add month total column right after the last day of this month
      cols.push({
        kind: 'month-total',
        monthKey: meta.monthKey,
        label: `${faMonthShort} total`,
      });
    }
  });

  return cols;
}

// Current Persian month (based on "now"), used to know which month
// should stop counting at TODAY (skip future days).
const currentMonthKey: MonthKey = TODAY.toLocaleDateString(
  PERSIAN_CALENDAR_LOCALE,
  { month: '2-digit' }
);

/**
 * Calculate the total wins for a player in a given Persian month.
 * - Uses monthKey derived from Persian calendar.
 * - For the current month, skips dates strictly after TODAY_KEY
 *   (so future dates in the same month don't contribute).
 * - Uses date string comparison (YYYY-MM-DD) to avoid timezone issues.
 */
function getMonthTotal(
  player: PlayerRow,
  monthKey: MonthKey,
  dateMeta: DateMeta[]
): number {
  return dateMeta.reduce((sum, meta) => {
    if (meta.monthKey !== monthKey) return sum;

    const isCurrentMonth = meta.monthKey === currentMonthKey;

    // If this date is in the future (within current month), ignore it.
    if (isCurrentMonth && meta.label > TODAY_KEY) {
      return sum;
    }

    return sum + (player.wins[meta.label] ?? 0);
  }, 0);
}

export default function Home() {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<MonthKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch from our API
  useEffect(() => {
    const fetchScoreboard = async () => {
      try {
        const res = await fetch('/api/scoreboard');
        if (!res.ok) {
          console.error('Failed to load scoreboard', await res.text());
          return;
        }
        const data: Scoreboard = await res.json();
        setScoreboard(data);
      } catch (e) {
        console.error('Error fetching scoreboard', e);
      } finally {
        setLoading(false);
      }
    };

    fetchScoreboard();
  }, []);

  // Compute dateMeta and columns based on DB dates
  const dateMeta: DateMeta[] = useMemo(
    () => (scoreboard ? buildDateMeta(scoreboard.dates) : []),
    [scoreboard]
  );

  const columns: Column[] = useMemo(
    () => (dateMeta.length ? buildColumns(dateMeta) : []),
    [dateMeta]
  );

  // Map DB players → UI players (winsByDate → wins)
  const playersBase: PlayerRow[] = useMemo(
    () =>
      scoreboard
        ? scoreboard.players.map((p) => ({
            name: p.name,
            wins: p.winsByDate,
          }))
        : [],
    [scoreboard]
  );

  // Handle sorting by month column
  const handleMonthSort = (monthKey: MonthKey) => {
    if (sortColumn === monthKey) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortColumn(monthKey);
      setSortDirection('desc');
    }
  };

  // Sort players based on selected month
  const players: PlayerRow[] = useMemo(() => {
    if (!sortColumn || !dateMeta.length) {
      return playersBase;
    }

    return [...playersBase].sort((a, b) => {
      const aTotal = getMonthTotal(a, sortColumn, dateMeta);
      const bTotal = getMonthTotal(b, sortColumn, dateMeta);

      if (sortDirection === 'desc') {
        return bTotal - aTotal;
      } else {
        return aTotal - bTotal;
      }
    });
  }, [playersBase, sortColumn, sortDirection, dateMeta]);

  // Scroll table to the end when columns are ready
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth;
    });
  }, [columns.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-slate-100">
        <div className="relative flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-sky-500/20 bg-slate-950/80 px-8 py-6 shadow-[0_0_40px_rgba(56,189,248,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2)_0,transparent_55%),radial-gradient(circle_at_bottom,rgba(244,63,94,0.2)_0,transparent_55%)]" />
          <div className="relative flex flex-col items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border border-sky-400/30" />
              <div className="absolute inset-1.5 rounded-full border border-sky-500/60 border-t-transparent animate-spin" />
            </div>
            <div className="space-y-1 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-200">
                Fetching scoreboard
              </p>
              <p className="text-[0.7rem] text-slate-400">
                Loading latest league stats from the server. Please wait a
                moment.
              </p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
              <div className="h-full w-full animate-pulse bg-[linear-gradient(90deg,#22d3ee,#6366f1,#ec4899)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!scoreboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-slate-100">
        <div className="relative w-full max-w-md rounded-3xl border border-rose-500/30 bg-slate-950/90 px-8 py-6 text-center shadow-[0_0_45px_rgba(248,113,113,0.35)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.25)_0,transparent_55%)]" />
          <div className="relative space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.25em] text-rose-100">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(248,113,113,1)]" />
              No data
            </p>
            <h2 className="text-sm font-semibold text-slate-50">
              No scoreboard data found
            </h2>
            <p className="text-[0.7rem] text-slate-400">
              We couldn&apos;t load any seasons for this league yet. Make sure
              your `/api/scoreboard` endpoint returns a valid scoreboard object.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-rose-500/90 px-4 py-1.5 text-[0.7rem] font-medium text-slate-50 shadow-[0_0_18px_rgba(248,113,113,0.6)] transition hover:bg-rose-400"
            >
              Retry loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#020617] via-[#020617] to-[#020617] font-sans text-foreground">
      <main className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#020617] via-[#02081f] to-[#020617] p-8 shadow-[0_0_40px_rgba(59,130,246,0.4)]">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-sky-500/30 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18)_0,transparent_55%),radial-gradient(circle_at_bottom,rgba(244,63,94,0.18)_0,transparent_55%)]" />
        </div>

        <div className="relative flex flex-col gap-6">
          <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3">
              <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/5 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-fuchsia-200">
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(244,114,182,0.9)]" />
                Quantum League
              </p>
              <h1 className="bg-linear-to-r from-sky-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                Player Win Matrix
              </h1>
              <p className="max-w-xl text-sm text-slate-300">
                A realtime-style overview of wins per day and total performance,
                grouped by Persian calendar months so your local season view
                always feels natural.
              </p>
            </div>
          </header>

          {/* Compact player summary strip */}
          <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:grid-cols-5">
            {(() => {
              const stats = [...players]
                .map((player) => {
                  const total = columns
                    .filter((c) => c.kind === 'date')
                    .reduce((sum, c) => sum + (player.wins[c.label] ?? 0), 0);

                  const bestMonthTotal = columns
                    .filter((c) => c.kind === 'month-total')
                    .reduce(
                      (max, c) =>
                        Math.max(
                          max,
                          getMonthTotal(player, c.monthKey, dateMeta)
                        ),
                      0
                    );

                  const currentMonthTotal = getMonthTotal(
                    player,
                    currentMonthKey,
                    dateMeta
                  );

                  return {
                    player,
                    total,
                    bestMonthTotal,
                    currentMonthTotal,
                  };
                })
                .sort((a, b) => b.total - a.total);

              const maxTotal =
                stats.reduce((max, { total }) => Math.max(max, total), 0) || 1;

              return stats.map(
                ({ player, total, bestMonthTotal, currentMonthTotal }, idx) => {
                  const fillPercent = Math.max(
                    6,
                    Math.min(100, (total / maxTotal) * 100)
                  );

                  return (
                    <div
                      key={player.name}
                      className="group flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-linear-to-br from-slate-950/90 via-slate-950/70 to-slate-900/80 px-4 py-3 text-[0.7rem] shadow-[0_0_32px_rgba(15,23,42,0.9)] transition hover:border-sky-500/80 hover:shadow-[0_0_16px_rgba(56,189,248,0.55)]"
                    >
                      {/* Top row: avatar, name, rank, total pill */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="truncate text-[0.8rem] font-semibold text-slate-50">
                              {player.name}
                            </span>
                            <span className="text-[0.6rem] text-slate-500">
                              Rank #{idx + 1}
                            </span>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/90 px-2 py-1 text-[0.6rem] font-mono uppercase tracking-[0.18em] text-sky-200">
                          <span className="text-slate-400">Total</span>
                          <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-sky-300">
                            {total}
                          </span>
                        </div>
                      </div>

                      {/* Stats text */}
                      <div className="space-y-1 text-slate-400">
                        <div className="flex justify-between">
                          <span className="font-mono text-[0.6rem] text-slate-400">
                            Best monthly
                          </span>
                          <span className="font-mono text-[0.6rem] text-emerald-300">
                            wins: {bestMonthTotal}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-mono text-[0.6rem] text-slate-500">
                            Current month
                          </span>
                          <span className="font-mono text-[0.6rem] text-sky-300">
                            wins: {currentMonthTotal}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/80">
                        <div
                          className="h-full bg-[linear-gradient(90deg,#22d3ee,#6366f1,#ec4899)]"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                }
              );
            })()}
          </section>

          <section className="relative mt-1 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/5 mask-[linear-gradient(to_bottom,black,transparent)]" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-9 w-9 rounded-xl border border-sky-500/60 bg-sky-500/10 shadow-[0_0_10px_rgba(56,189,248,0.9)]">
                  <div className="absolute inset-[3px] rounded-lg border border-sky-300/40 bg-slate-950/80" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                    Detailed scoreboard
                  </p>
                  <p className="text-[0.7rem] text-slate-500">
                    Hover rows to highlight a player, totals are shown in teal
                    at the end of each fa month.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[0.7rem] text-slate-400">
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-slate-700" />
                  <span>Day wins</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  <span>Month total</span>
                </div>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="table-scroll overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/80 backdrop-blur"
            >
              <table className="w-full min-w-[1200px] border-collapse text-[0.7rem] text-slate-200">
                <thead className="bg-[radial-gradient(circle_at_top,#0f172a,transparent_55%),linear-gradient(to_right,#020617,rgba(56,189,248,0.18),#020617)]">
                  <tr className="[&>th]:border-b [&>th]:border-slate-800/80">
                    <th className="sticky left-0 z-10 bg-slate-950/95 px-4 py-3 text-left text-xs font-semibold text-slate-100 backdrop-blur">
                      Player
                    </th>
                    {columns.map((column) =>
                      column.kind === 'date' ? (
                        <th
                          key={column.label}
                          className="px-3 py-3 text-center font-medium text-slate-300"
                        >
                          {column.date.toLocaleDateString(
                            PERSIAN_CALENDAR_LOCALE,
                            {
                              day: '2-digit',
                              month: 'short',
                            }
                          )}
                        </th>
                      ) : (
                        <th
                          key={column.label}
                          onClick={() => handleMonthSort(column.monthKey)}
                          className="cursor-pointer select-none px-3 py-3 text-center text-[0.65rem] font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 hover:text-emerald-200"
                          title="Click to sort by this month"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>{column.label}</span>
                            {sortColumn === column.monthKey && (
                              <span className="text-[0.7rem]">
                                {sortDirection === 'desc' ? '↓' : '↑'}
                              </span>
                            )}
                          </div>
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(odd)]:bg-slate-900/40 [&>tr:nth-child(even)]:bg-slate-950/40">
                  {players.map((player) => (
                    <tr
                      key={player.name}
                      className="transition-colors hover:bg-sky-950/60 hover:shadow-[0_0_16px_rgba(56,189,248,0.35)]"
                    >
                      <td className="sticky left-0 z-10 bg-slate-950/95 px-4 py-3 text-sm font-medium text-sky-100 backdrop-blur">
                        {player.name}
                      </td>
                      {columns.map((column) =>
                        column.kind === 'date' ? (
                          <td
                            key={column.label}
                            className="px-3 py-3 text-center"
                          >
                            {player.wins[column.label] ?? 0}
                          </td>
                        ) : (
                          <td
                            key={column.label}
                            className="px-3 py-3 text-center font-semibold text-emerald-300"
                          >
                            {getMonthTotal(player, column.monthKey, dateMeta)}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex items-center justify-between text-[0.68rem] text-slate-500">
              <p className="font-mono uppercase tracking-[0.2em] text-slate-500">
                Multi-day win overview
              </p>
              <p className="text-slate-500">
                Each cell shows the count of wins for that player on that exact
                date.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
