// Skeleton for /bet. Header with title + cart pill, then a stack
// of game cards. Layout mirrors BetGamesList's per-game row shape.
export default function BetLoading() {
  return (
    <div className="pb-nav-action animate-pulse space-y-6 pt-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="h-8 w-20 rounded-lg bg-stone-200" />
          <div className="mt-2 h-4 w-48 rounded bg-stone-200" />
        </div>
        <div className="h-10 w-24 rounded-full bg-stone-200" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-card bg-stone-200/40 p-4">
          <div className="h-3 w-1/3 rounded bg-stone-200" />
          <div className="h-5 w-2/3 rounded bg-stone-200" />
          <div className="h-3 w-1/2 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}
