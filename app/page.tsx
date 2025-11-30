'use client';

import { Column, DateMeta, PlayerRow } from '@/features/scoreboard/types';
import {
  MonthKey,
  buildColumns,
  buildDateMeta,
  getMonthTotal,
} from '@/features/scoreboard/utils';
import { useEffect, useMemo, useRef, useState } from 'react';

import { AddWinsSection } from '@/features/scoreboard/components/AddWinsSection';
import { Header } from '@/features/scoreboard/components/Header';
import { LoadingState } from '@/features/scoreboard/components/LoadingState';
import { NoDataState } from '@/features/scoreboard/components/NoDataState';
import { PlayerSummaryStrip } from '@/features/scoreboard/components/PlayerSummaryStrip';
import { ScoreboardTable } from '@/features/scoreboard/components/ScoreboardTable';
import { useScoreboard } from '@/features/scoreboard/hooks/useScoreboard';
import { useScrollPosition } from '@/features/scoreboard/hooks/useScrollPosition';

export default function Home() {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { scoreboard, loading, fetchScoreboard } = useScoreboard();
  const {
    saveScrollPosition,
    restoreScrollPosition,
    scrollToEnd,
    getIsInitialLoad,
  } = useScrollPosition(scrollRef);

  const [sortColumn, setSortColumn] = useState<MonthKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
    saveScrollPosition();
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

  // Scroll table to the end only on initial load
  useEffect(() => {
    if (columns.length > 0 && !loading && scoreboard && scrollRef.current) {
      // Use multiple attempts to ensure the table is fully rendered
      const attemptScroll = () => {
        if (scrollRef.current) {
          scrollToEnd();
        }
      };

      // Try immediately
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          attemptScroll();
        });
      });

      // Also try after delays as fallback
      const timeout1 = setTimeout(attemptScroll, 150);
      const timeout2 = setTimeout(attemptScroll, 300);

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
  }, [columns.length, loading, scoreboard, scrollToEnd, scrollRef]);

  // Restore scroll position after sorting or editing state changes
  useEffect(() => {
    if (!getIsInitialLoad()) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          restoreScrollPosition();
        });
      });
    }
  }, [
    sortColumn,
    sortDirection,
    players.length,
    restoreScrollPosition,
    getIsInitialLoad,
  ]);

  if (loading) {
    return <LoadingState />;
  }

  if (!scoreboard) {
    return <NoDataState />;
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
          <Header />

          <PlayerSummaryStrip
            players={players}
            columns={columns}
            dateMeta={dateMeta}
          />

          <AddWinsSection
            scoreboard={scoreboard}
            onWinsAdded={fetchScoreboard}
          />

          <ScoreboardTable
            players={players}
            columns={columns}
            dateMeta={dateMeta}
            scoreboard={scoreboard}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleMonthSort}
            onUpdate={fetchScoreboard}
            onScrollSave={saveScrollPosition}
            onScrollRestore={restoreScrollPosition}
            scrollRef={scrollRef}
          />
        </div>
      </main>
    </div>
  );
}
