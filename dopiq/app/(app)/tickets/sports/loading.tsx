// Skeleton for /tickets/sports. The live page renders horizontal-
// layout game cards (logo on left, teams + date on right), 1-col
// on mobile, 2-col on md+.
export default function SportsLoading() {
  return (
    <div
      className="-mx-4 -mt-4 px-4 pt-6 pb-10"
      style={{ backgroundColor: "#F5F0E6" }}
    >
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="h-4 w-20 rounded bg-stone-200" />
        <div className="mt-2 h-10 w-32 rounded-lg bg-stone-200" />
        <div className="mt-2 h-4 w-3/4 rounded bg-stone-200" />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl bg-white p-4"
            >
              <div className="h-16 w-16 shrink-0 rounded-2xl bg-stone-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded bg-stone-200" />
                <div className="h-4 w-2/3 rounded bg-stone-200" />
                <div className="h-3 w-1/3 rounded bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
