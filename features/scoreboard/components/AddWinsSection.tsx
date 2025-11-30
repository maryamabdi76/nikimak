'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Scoreboard } from '../types';

interface AddWinsSectionProps {
  scoreboard: Scoreboard | null;
  onWinsAdded: () => void;
}

export function AddWinsSection({
  scoreboard,
  onWinsAdded,
}: AddWinsSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [playerWins, setPlayerWins] = useState<Record<string, string>>({});
  const [isAddingWins, setIsAddingWins] = useState(false);
  const [isAddWinsOpen, setIsAddWinsOpen] = useState(false);

  // Initialize player wins when scoreboard loads or date changes
  useEffect(() => {
    if (scoreboard && selectedDate) {
      const initialWins: Record<string, string> = {};
      scoreboard.players.forEach((player) => {
        initialWins[player.name] = '0';
      });
      setPlayerWins(initialWins);
    }
  }, [scoreboard, selectedDate]);

  // Handle adding wins for each player
  const handleAddWins = async () => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    if (!scoreboard || scoreboard.players.length === 0) {
      alert('No players found');
      return;
    }

    // Validate and prepare player wins data
    const playerWinsArray: Array<{ playerName: string; wins: number }> = [];
    let hasAnyWins = false;

    for (const player of scoreboard.players) {
      const winsStr = playerWins[player.name] || '0';
      const wins = parseInt(winsStr, 10);

      if (isNaN(wins) || wins < 0) {
        alert(
          `Invalid wins value for ${player.name}. Please enter a valid non-negative number.`
        );
        return;
      }

      if (wins > 0) {
        hasAnyWins = true;
      }

      playerWinsArray.push({
        playerName: player.name,
        wins,
      });
    }

    if (!hasAnyWins) {
      alert('Please enter at least one win for any player');
      return;
    }

    setIsAddingWins(true);
    try {
      const res = await fetch('/api/scoreboard/add-wins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          playerWins: playerWinsArray,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to add wins'}`);
        return;
      }

      // Reset and close the form
      setSelectedDate('');
      setPlayerWins({});
      setIsAddWinsOpen(false);

      alert('Successfully added wins for players!');
      onWinsAdded();
    } catch (e) {
      console.error('Error adding wins', e);
      alert('Failed to add wins. Please try again.');
    } finally {
      setIsAddingWins(false);
    }
  };

  // Handle individual player win input change
  const handlePlayerWinChange = (playerName: string, value: string) => {
    setPlayerWins((prev) => ({
      ...prev,
      [playerName]: value,
    }));
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-linear-to-br from-slate-950/90 via-slate-950/70 to-slate-900/80 shadow-[0_0_40px_rgba(15,23,42,0.9)] backdrop-blur-xl">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08)_0,transparent_50%)]" />

      <div className="relative">
        <button
          onClick={() => setIsAddWinsOpen(!isAddWinsOpen)}
          className="flex w-full items-center justify-between gap-3 p-6 text-left transition-colors hover:bg-slate-900/20"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <div className="absolute inset-[3px] rounded-lg border border-emerald-300/30 bg-slate-950/90" />
              <svg
                className="relative h-5 w-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-200">
                Add Wins for Each Player
              </p>
              <p className="mt-0.5 text-[0.65rem] text-slate-500">
                Select a date and enter wins individually
              </p>
            </div>
          </div>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform ${
              isAddWinsOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isAddWinsOpen && (
          <div className="border-t border-slate-800/50 p-6 pt-6">
            <div className="mb-6 flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[220px]">
                <label className="mb-2 block text-xs font-medium text-slate-300">
                  Select Date
                </label>
                <DatePicker
                  value={selectedDate}
                  onChange={(value) => setSelectedDate(value)}
                />
              </div>
              <Button
                onClick={handleAddWins}
                disabled={isAddingWins || !selectedDate}
                className="h-[42px] bg-linear-to-r from-emerald-500/90 to-emerald-600/90 px-6 text-sm font-medium text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:from-emerald-400 hover:to-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:hover:from-emerald-500/90 disabled:hover:to-emerald-600/90"
              >
                {isAddingWins ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Add Wins
                  </>
                )}
              </Button>
            </div>

            {selectedDate && scoreboard && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-700/50 to-transparent" />
                  <p className="text-xs font-medium text-slate-400">
                    Player Wins
                  </p>
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-slate-700/50 to-transparent" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {scoreboard.players.map((player) => {
                    const currentWins = playerWins[player.name] || '0';
                    const hasWins = parseInt(currentWins, 10) > 0;
                    return (
                      <div
                        key={player.name}
                        className={`group relative flex items-center gap-3 rounded-xl border p-3 transition-all ${
                          hasWins
                            ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                            : 'border-slate-700/50 bg-slate-900/40 hover:border-slate-600/50 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold ${
                              hasWins
                                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                                : 'border-slate-700/50 bg-slate-800/50 text-slate-400'
                            }`}
                          >
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <label className="flex-1 text-sm font-medium text-slate-200">
                            {player.name}
                          </label>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={currentWins}
                          onChange={(e) =>
                            handlePlayerWinChange(player.name, e.target.value)
                          }
                          className={`w-20 rounded-lg border px-3 py-1.5 text-center text-sm font-medium transition-all ${
                            hasWins
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200 placeholder:text-emerald-400/50 focus:border-emerald-400 focus:bg-emerald-500/20 focus:ring-2 focus:ring-emerald-500/30'
                              : 'border-slate-700/50 bg-slate-800/50 text-slate-200 placeholder:text-slate-500 focus:border-slate-600 focus:bg-slate-800/70 focus:ring-2 focus:ring-slate-600/30'
                          } outline-none`}
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!selectedDate && (
              <div className="rounded-lg border border-slate-800/50 bg-slate-900/30 p-4 text-center">
                <p className="text-sm text-slate-400">
                  Select a date to start adding wins for players
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
