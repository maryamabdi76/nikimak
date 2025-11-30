export function NoDataState() {
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
