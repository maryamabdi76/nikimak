export function LoadingState() {
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
              Loading latest league stats from the server. Please wait a moment.
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
