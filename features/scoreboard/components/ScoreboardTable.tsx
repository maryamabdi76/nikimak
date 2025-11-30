'use client';

import {
  Column,
  DateMeta,
  MonthKey,
  PERSIAN_CALENDAR_LOCALE,
  PlayerRow,
} from '../types';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { Input } from '@/components/ui/input';
import { Scoreboard } from '../types';
import { getMonthTotal } from '../utils';
import { useTableEditing } from '../hooks/useTableEditing';

interface ScoreboardTableProps {
  players: PlayerRow[];
  columns: Column[];
  dateMeta: DateMeta[];
  scoreboard: Scoreboard | null;
  sortColumn: MonthKey | null;
  sortDirection: 'asc' | 'desc';
  onSort: (monthKey: MonthKey) => void;
  onUpdate: () => void;
  onScrollSave: () => void;
  onScrollRestore: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function ScoreboardTable({
  players,
  columns,
  dateMeta,
  scoreboard,
  sortColumn,
  sortDirection,
  onSort,
  onUpdate,
  onScrollSave,
  onScrollRestore,
  scrollRef,
}: ScoreboardTableProps) {
  const {
    editingCell,
    editingValue,
    setEditingValue,
    isUpdatingCell,
    handleCellClick,
    handleCancelEdit,
    handleUpdateCell,
  } = useTableEditing(scoreboard);

  // Scroll to end on initial mount
  useEffect(() => {
    if (scrollRef.current && columns.length > 0) {
      const scrollToEnd = () => {
        if (scrollRef.current) {
          const maxScroll =
            scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
          if (maxScroll > 0) {
            scrollRef.current.scrollLeft = maxScroll;
          }
        }
      };

      // Try multiple times to ensure table is rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToEnd();
          setTimeout(scrollToEnd, 100);
          setTimeout(scrollToEnd, 250);
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length]);

  // Save scroll position before actions
  const handleCellClickWithScroll = (playerName: string, date: string) => {
    onScrollSave();
    handleCellClick(playerName, date);
  };

  const handleCellSubmit = (playerName: string, date: string) => {
    onScrollSave();
    handleUpdateCell(playerName, date, editingValue, () => {
      onUpdate();
      setTimeout(() => {
        onScrollRestore();
      }, 50);
    });
  };

  return (
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
              Hover rows to highlight a player, totals are shown in teal at the
              end of each fa month.
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
                    {column.date.toLocaleDateString(PERSIAN_CALENDAR_LOCALE, {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </th>
                ) : (
                  <th
                    key={column.label}
                    onClick={() => onSort(column.monthKey)}
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
                    <td key={column.label} className="px-3 py-3 text-center">
                      {editingCell?.playerName === player.name &&
                      editingCell?.date === column.label ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="relative group">
                            <div className="absolute -inset-0.5 rounded-lg bg-sky-500/30 blur-sm opacity-50 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative flex items-center gap-1 rounded-lg border-2 border-sky-500/70 bg-sky-500/15 px-2 py-1 shadow-[0_0_15px_rgba(56,189,248,0.4)] backdrop-blur-sm">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                value={editingValue}
                                onChange={(e) =>
                                  setEditingValue(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCellSubmit(player.name, column.label);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  } else if (e.key === 'ArrowUp') {
                                    e.preventDefault();
                                    const newValue = Math.max(
                                      0,
                                      parseInt(editingValue || '0', 10) + 1
                                    );
                                    setEditingValue(newValue.toString());
                                  } else if (e.key === 'ArrowDown') {
                                    e.preventDefault();
                                    const newValue = Math.max(
                                      0,
                                      parseInt(editingValue || '0', 10) - 1
                                    );
                                    setEditingValue(newValue.toString());
                                  }
                                }}
                                disabled={isUpdatingCell}
                                autoFocus
                                className="w-16 text-center font-semibold text-sky-100 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="flex flex-col">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newValue = Math.max(
                                      0,
                                      parseInt(editingValue || '0', 10) + 1
                                    );
                                    setEditingValue(newValue.toString());
                                  }}
                                  disabled={isUpdatingCell}
                                  className="h-3 w-3 flex items-center justify-center text-sky-300 hover:text-sky-200 hover:bg-sky-500/30 rounded transition-colors disabled:opacity-50"
                                  title="Increase"
                                >
                                  <Icon
                                    icon="fluent:chevron-up-12-filled"
                                    className="h-2.5 w-2.5"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newValue = Math.max(
                                      0,
                                      parseInt(editingValue || '0', 10) - 1
                                    );
                                    setEditingValue(newValue.toString());
                                  }}
                                  disabled={isUpdatingCell}
                                  className="h-3 w-3 flex items-center justify-center text-sky-300 hover:text-sky-200 hover:bg-sky-500/30 rounded transition-colors disabled:opacity-50"
                                  title="Decrease"
                                >
                                  <Icon
                                    icon="fluent:chevron-down-12-filled"
                                    className="h-2.5 w-2.5"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() =>
                                handleCellSubmit(player.name, column.label)
                              }
                              disabled={isUpdatingCell}
                              className="h-8 w-8 rounded-lg text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/30 border border-emerald-500/40 hover:border-emerald-400/60 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                              title="Save (Enter)"
                            >
                              {isUpdatingCell ? (
                                <Icon
                                  icon="svg-spinners:3-dots-fade"
                                  className="h-4 w-4"
                                />
                              ) : (
                                <Icon
                                  icon="fluent:checkmark-24-filled"
                                  className="h-4 w-4"
                                />
                              )}
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={isUpdatingCell}
                              className="h-8 w-8 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/30 border border-rose-500/40 hover:border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.3)] transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
                              title="Cancel (Esc)"
                            >
                              <Icon
                                icon="fluent:dismiss-24-filled"
                                className="h-4 w-4"
                              />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            handleCellClickWithScroll(player.name, column.label)
                          }
                          className="group relative flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-slate-200 transition-all hover:bg-sky-500/20 hover:text-sky-200 hover:shadow-[0_0_12px_rgba(56,189,248,0.3)]  focus:outline-none focus:ring-2 focus:ring-sky-500/40 active:scale-[0.97]"
                          title="Click to edit"
                        >
                          <span className="transition-transform group-hover:scale-105">
                            {player.wins[column.label] ?? 0}
                          </span>
                          <Icon
                            icon="fluent:edit-24-regular"
                            className="h-3.5 w-3.5 opacity-0 text-sky-400 transition-all group-hover:opacity-70 group-hover:scale-110"
                          />
                        </button>
                      )}
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
          Click any cell to edit. Press Enter to save, Escape to cancel.
        </p>
      </div>
    </section>
  );
}
