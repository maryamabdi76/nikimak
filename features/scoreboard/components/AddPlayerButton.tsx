'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddPlayerButtonProps {
  onPlayerAdded: () => void;
  existingPlayers: string[];
}

export function AddPlayerButton({
  onPlayerAdded,
  existingPlayers,
}: AddPlayerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPlayer = async () => {
    const trimmedName = playerName.trim();
    
    if (!trimmedName) {
      alert('Please enter a player name');
      return;
    }

    // Check if player already exists
    if (
      existingPlayers.some(
        (name) => name.toLowerCase() === trimmedName.toLowerCase()
      )
    ) {
      alert('A player with this name already exists');
      return;
    }

    setIsAdding(true);
    try {
      const res = await fetch('/api/scoreboard/add-player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: trimmedName,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.error || 'Failed to add player'}`);
        return;
      }

      // Reset and close
      setPlayerName('');
      setIsOpen(false);
      onPlayerAdded();
    } catch (e) {
      console.error('Error adding player', e);
      alert('Failed to add player. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition-all hover:border-sky-400/60 hover:bg-sky-500/20 hover:shadow-[0_0_8px_rgba(56,189,248,0.3)]"
        title="Add new player"
      >
        <Icon icon="fluent:person-add-24-filled" className="h-3.5 w-3.5" />
        <span>Add Player</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-2 py-1.5">
      <Input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleAddPlayer();
          } else if (e.key === 'Escape') {
            setIsOpen(false);
            setPlayerName('');
          }
        }}
        disabled={isAdding}
        autoFocus
        placeholder="Player name"
        className="h-7 w-32 border-sky-500/50 bg-sky-500/10 text-xs text-sky-100 placeholder:text-sky-400/50 focus:border-sky-400 focus:bg-sky-500/20 focus:ring-1 focus:ring-sky-500/40"
      />
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={handleAddPlayer}
        disabled={isAdding || !playerName.trim()}
        className="h-7 w-7 text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50"
        title="Add player"
      >
        {isAdding ? (
          <Icon
            icon="svg-spinners:3-dots-fade"
            className="h-3.5 w-3.5"
          />
        ) : (
          <Icon icon="fluent:checkmark-24-filled" className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => {
          setIsOpen(false);
          setPlayerName('');
        }}
        disabled={isAdding}
        className="h-7 w-7 text-rose-400 hover:text-rose-200 hover:bg-rose-500/30 disabled:opacity-50"
        title="Cancel"
      >
        <Icon icon="fluent:dismiss-24-filled" className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

