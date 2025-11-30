import { DateKey, Scoreboard } from '../types';

import { useState } from 'react';

export function useTableEditing(scoreboard: Scoreboard | null) {
  const [editingCell, setEditingCell] = useState<{
    playerName: string;
    date: DateKey;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [isUpdatingCell, setIsUpdatingCell] = useState(false);

  const handleCellClick = (playerName: string, date: DateKey) => {
    if (!scoreboard) return;
    const player = scoreboard.players.find((p) => p.name === playerName);
    const currentValue = player?.winsByDate[date] ?? 0;
    setEditingCell({ playerName, date });
    setEditingValue(currentValue.toString());
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleUpdateCell = async (
    playerName: string,
    date: DateKey,
    newValue: string,
    onUpdate: () => void
  ) => {
    const wins = parseInt(newValue, 10);
    if (isNaN(wins) || wins < 0) {
      alert('Please enter a valid non-negative number');
      return;
    }

    setIsUpdatingCell(true);
    try {
      const res = await fetch('/api/scoreboard/update-cell', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          date,
          wins,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to update cell'}`);
        return;
      }

      setEditingCell(null);
      setEditingValue('');
      onUpdate();
    } catch (e) {
      console.error('Error updating cell', e);
      alert('Failed to update cell. Please try again.');
    } finally {
      setIsUpdatingCell(false);
    }
  };

  return {
    editingCell,
    editingValue,
    setEditingValue,
    isUpdatingCell,
    handleCellClick,
    handleCancelEdit,
    handleUpdateCell,
  };
}
