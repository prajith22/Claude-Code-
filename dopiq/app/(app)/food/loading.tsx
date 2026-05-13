// Skeleton for /food. Restaurant list is a vertical stack of
// horizontal-layout cards (logo on the left, name + cuisine on
// the right) — six placeholder rows match what fits above the
// fold on a typical phone.
export default function FoodLoading() {
  return (
    <div className="animate-pulse space-y-4 pb-4 pt-4">
      <div className="h-8 w-28 rounded-lg bg-stone-200" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-card bg-stone-200/40 p-4"
        >
          <div className="h-16 w-16 shrink-0 rounded-card bg-stone-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-stone-200" />
            <div className="h-3 w-1/3 rounded bg-stone-200" />
            <div className="h-3 w-1/2 rounded bg-stone-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
