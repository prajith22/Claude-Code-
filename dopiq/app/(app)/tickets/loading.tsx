// Skeleton for /tickets landing. Uses the same cream surface the
// loaded page paints (TICKETS_BRAND.cream = #F5F0E6) and three
// stacked category-card placeholders matching Concerts / Sports /
// Travel. The -mx-4 / -mt-4 trick reverses the layout's main
// padding so the cream extends edge-to-edge like the real page.
export default function TicketsLoading() {
  return (
    <div
      className="-mx-4 -mt-4 px-4 pt-6 pb-10"
      style={{ backgroundColor: "#F5F0E6" }}
    >
      <div className="mx-auto max-w-2xl animate-pulse">
        <div className="h-10 w-32 rounded-lg bg-stone-200" />
        <div className="mt-2 h-4 w-60 rounded bg-stone-200" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-stone-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
