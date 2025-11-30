import { Column, DateMeta, PlayerRow } from '../types';
import { currentMonthKey, getMonthTotal } from '../utils';

interface PlayerSummaryStripProps {
  players: PlayerRow[];
  columns: Column[];
  dateMeta: DateMeta[];
}

export function PlayerSummaryStrip({
  players,
  columns,
  dateMeta,
}: PlayerSummaryStripProps) {
  const stats = [...players]
    .map((player) => {
      const total = columns
        .filter((c) => c.kind === 'date')
        .reduce((sum, c) => sum + (player.wins[c.label] ?? 0), 0);

      const bestMonthTotal = columns
        .filter((c) => c.kind === 'month-total')
        .reduce(
          (max, c) =>
            Math.max(max, getMonthTotal(player, c.monthKey, dateMeta)),
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

  return (
    <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:grid-cols-5">
      {stats.map(
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
      )}
    </section>
  );
}
