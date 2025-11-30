import { AddPlayerButton } from './AddPlayerButton';

interface HeaderProps {
  onPlayerAdded: () => void;
  existingPlayers: string[];
}

export function Header({ onPlayerAdded, existingPlayers }: HeaderProps) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/5 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-fuchsia-200">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(244,114,182,0.9)]" />
            Quantum League
          </p>
          <AddPlayerButton
            onPlayerAdded={onPlayerAdded}
            existingPlayers={existingPlayers}
          />
        </div>
        <h1 className="bg-linear-to-r from-sky-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
          Player Win Matrix
        </h1>
        <p className="max-w-xl text-sm text-slate-300">
          A realtime-style overview of wins per day and total performance,
          grouped by Persian calendar months so your local season view always
          feels natural.
        </p>
      </div>
    </header>
  );
}
