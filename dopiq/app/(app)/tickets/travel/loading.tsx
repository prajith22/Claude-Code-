// Skeleton for /tickets/travel. 2/3-col destination grid — each
// tile is emoji-block on top, city + country + tagline + price
// chip below — same shape as the live page.
export default function TravelLoading() {
  return (
    <div
      className="-mx-4 -mt-4 px-4 pt-6 pb-10"
      style={{ backgroundColor: "#F5F0E6" }}
    >
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="h-4 w-20 rounded bg-stone-200" />
        <div className="mt-2 h-10 w-32 rounded-lg bg-stone-200" />
        <div className="mt-2 h-4 w-3/4 rounded bg-stone-200" />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[4/3] rounded-2xl bg-stone-200" />
              <div className="h-3 w-1/2 rounded bg-stone-200" />
              <div className="h-3 w-1/3 rounded bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
