// Central calendar config so we don't repeat magic strings
const PERSIAN_CALENDAR_LOCALE = 'fa-IR-u-ca-persian';

// Later this can come from DB/API as an array of ISO-like date strings.
type DateKey = string;

const DATES: DateKey[] = [
  '2024-10-13',
  '2024-10-14',
  '2024-10-15',
  '2024-10-18',
  '2024-10-19',
  '2024-10-20',
  '2024-10-21',
  '2024-10-22',
  '2024-10-25',
  '2024-10-26',
  '2024-10-27',
  '2024-10-28',
  '2024-10-29',
  '2024-11-01',
  '2024-11-02',
  '2024-11-03',
  '2024-11-04',
  '2024-11-05',
  '2024-11-08',
  '2024-11-09',
  '2024-11-10',
  '2024-11-11',
  '2024-11-12',
  '2024-11-15',
  '2024-11-16',
];

// Per-player row, wins keyed by "YYYY-MM-DD".
// Later, when data comes from API, you can just feed the same shape.
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
 * - Parse to Date (UTC) for formatting.
 * - Derive Persian calendar month key.
 */
function buildDateMeta(dateStrings: DateKey[]): DateMeta[] {
  return dateStrings
    .slice()
    .sort() // "2024-10-13" < "2024-10-14" < ... lexicographically
    .map((label) => {
      const [yearStr, monthStr, dayStr] = label.split('-');
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1; // JS months are 0-based
      const day = Number(dayStr);

      // Use UTC so we get a pure date and avoid local timezone offset surprises
      const date = new Date(year, monthIndex, day);

      // Group by Persian (fa-IR, Persian calendar) month, e.g. "01".."12"
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

const dateMeta: DateMeta[] = buildDateMeta(DATES);
console.log('🚀 ~ dateMeta:', dateMeta);

// Current Persian month (based on "now"), used to know which month
// should stop counting at TODAY (skip future days).
const currentMonthKey: MonthKey = TODAY.toLocaleDateString(
  PERSIAN_CALENDAR_LOCALE,
  { month: '2-digit' }
);

// Build columns: one column per day + a "month-total" column
// at the end of each Persian month group.
const columns: Column[] = (() => {
  const cols: Column[] = [];

  dateMeta.forEach((meta, index) => {
    cols.push({ kind: 'date', label: meta.label, date: meta.date });

    const nextMeta = dateMeta[index + 1];
    const isEndOfMonth = !nextMeta || nextMeta.monthKey !== meta.monthKey;

    if (isEndOfMonth) {
      // Use the same Persian calendar for the label, so grouping + label match.
      const faMonthShort = meta.date.toLocaleDateString(
        PERSIAN_CALENDAR_LOCALE,
        { month: 'short' }
      );

      cols.push({
        kind: 'month-total',
        monthKey: meta.monthKey,
        label: `${faMonthShort} total`,
      });
    }
  });

  return cols;
})();

/**
 * Calculate the total wins for a player in a given Persian month.
 * - Uses monthKey derived from Persian calendar.
 * - For the current month, skips dates strictly after TODAY_KEY
 *   (so future dates in the same month don't contribute).
 * - Uses date string comparison (YYYY-MM-DD) to avoid timezone issues.
 */
function getMonthTotal(player: PlayerRow, monthKey: MonthKey): number {
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

const PLAYERS: PlayerRow[] = [
  {
    name: 'Maryam',
    wins: {
      '2024-10-13': 1,
      '2024-10-14': 4,
      '2024-10-15': 3,
      '2024-10-18': 0,
      '2024-10-19': 4,
      '2024-10-20': 5,
      '2024-10-21': 3,
      '2024-10-22': 1,
      '2024-10-25': 0,
      '2024-10-26': 3,
      '2024-10-27': 2,
      '2024-10-28': 1,
      '2024-10-29': 5,
      '2024-11-01': 1,
      '2024-11-02': 2,
      '2024-11-03': 4,
      '2024-11-04': 2,
      '2024-11-05': 1,
      '2024-11-08': 0,
      '2024-11-09': 0,
      '2024-11-10': 3,
      '2024-11-11': 2,
      '2024-11-12': 0,
      '2024-11-15': 2,
      '2024-11-16': 1,
    },
  },
  {
    name: 'Fatemeh',
    wins: {
      '2024-10-13': 0,
      '2024-10-14': 3,
      '2024-10-15': 3,
      '2024-10-18': 3,
      '2024-10-19': 3,
      '2024-10-20': 2,
      '2024-10-21': 5,
      '2024-10-22': 5,
      '2024-10-25': 1,
      '2024-10-26': 0,
      '2024-10-27': 0,
      '2024-10-28': 3,
      '2024-10-29': 2,
      '2024-11-01': 2,
      '2024-11-02': 2,
      '2024-11-03': 4,
      '2024-11-04': 1,
      '2024-11-05': 1,
      '2024-11-08': 1,
      '2024-11-09': 1,
      '2024-11-10': 1,
      '2024-11-11': 2,
      '2024-11-12': 2,
      '2024-11-15': 1,
      '2024-11-16': 0,
    },
  },
  {
    name: 'Nikta',
    wins: {
      '2024-10-13': 6,
      '2024-10-14': 5,
      '2024-10-15': 6,
      '2024-10-18': 4,
      '2024-10-19': 2,
      '2024-10-20': 2,
      '2024-10-21': 0,
      '2024-10-22': 4,
      '2024-10-25': 1,
      '2024-10-26': 3,
      '2024-10-27': 6,
      '2024-10-28': 0,
      '2024-10-29': 3,
      '2024-11-01': 1,
      '2024-11-02': 3,
      '2024-11-03': 2,
      '2024-11-04': 0,
      '2024-11-05': 3,
      '2024-11-08': 1,
      '2024-11-09': 3,
      '2024-11-10': 1,
      '2024-11-11': 0,
      '2024-11-12': 3,
      '2024-11-15': 1,
      '2024-11-16': 1,
    },
  },
  {
    name: 'Najmeh',
    wins: {
      '2024-10-13': 5,
      '2024-10-14': 2,
      '2024-10-15': 7,
      '2024-10-18': 2,
      '2024-10-19': 3,
      '2024-10-20': 0,
      '2024-10-21': 2,
      '2024-10-22': 0,
      '2024-10-25': 2,
      '2024-10-26': 0,
      '2024-10-27': 1,
      '2024-10-28': 3,
      '2024-10-29': 4,
      '2024-11-01': 2,
      '2024-11-02': 4,
      '2024-11-03': 4,
      '2024-11-04': 4,
      '2024-11-05': 3,
      '2024-11-08': 2,
      '2024-11-09': 1,
      '2024-11-10': 2,
      '2024-11-11': 2,
      '2024-11-12': 0,
      '2024-11-15': 1,
      '2024-11-16': 2,
    },
  },
  {
    name: 'Matin',
    wins: {
      '2024-10-13': 1,
      '2024-10-14': 0,
      '2024-10-15': 0,
      '2024-10-18': 0,
      '2024-10-19': 0,
      '2024-10-20': 0,
      '2024-10-21': 0,
      '2024-10-22': 5,
      '2024-10-25': 1,
      '2024-10-26': 2,
      '2024-10-27': 0,
      '2024-10-28': 0,
      '2024-10-29': 2,
      '2024-11-01': 1,
      '2024-11-02': 0,
      '2024-11-03': 0,
      '2024-11-04': 0,
      '2024-11-05': 2,
      '2024-11-08': 2,
      '2024-11-09': 5,
      '2024-11-10': 0,
      '2024-11-11': 0,
      '2024-11-12': 1,
      '2024-11-15': 0,
      '2024-11-16': 1,
    },
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#020617] via-[#020617] to-[#020617] font-sans text-foreground">
      <main className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-[#020617] via-[#02081f] to-[#020617] p-8 shadow-[0_0_80px_rgba(59,130,246,0.4)]">
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
            <div className="flex flex-col items-end gap-3 text-right text-xs text-slate-400">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/70 px-3 py-2 shadow-[0_0_25px_rgba(56,189,248,0.45)]">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-slate-900 text-[0.6rem] font-mono text-sky-300">
                  {new Date().toLocaleDateString(PERSIAN_CALENDAR_LOCALE, {
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </span>
                <div className="flex flex-col">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-slate-200">
                    Gaming mode
                  </span>
                  <span className="font-mono text-[0.6rem] text-slate-500">
                    Daily + monthly (fa) wins
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[0.65rem] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-slate-700" />
                  <span>Day wins</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  <span>Month totals</span>
                </span>
              </div>
            </div>
          </header>

          {/* Compact player summary strip */}
          <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:grid-cols-5">
            {(() => {
              const stats = [...PLAYERS]
                .map((player) => {
                  const total = columns
                    .filter((c) => c.kind === 'date')
                    .reduce((sum, c) => sum + (player.wins[c.label] ?? 0), 0);

                  const bestMonthTotal = columns
                    .filter((c) => c.kind === 'month-total')
                    .reduce(
                      (max, c) =>
                        Math.max(max, getMonthTotal(player, c.monthKey)),
                      0
                    );

                  const currentMonthTotal = getMonthTotal(
                    player,
                    currentMonthKey
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
                <div className="relative h-9 w-9 rounded-xl border border-sky-500/60 bg-sky-500/10 shadow-[0_0_18px_rgba(56,189,248,0.9)]">
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

            <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/80 backdrop-blur">
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
                          className="px-3 py-3 text-center text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-sky-300"
                        >
                          {column.label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(odd)]:bg-slate-900/40 [&>tr:nth-child(even)]:bg-slate-950/40">
                  {PLAYERS.map((player) => (
                    <tr
                      key={player.name}
                      className="transition-colors hover:bg-sky-950/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.35)]"
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
                            {getMonthTotal(player, column.monthKey)}
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
