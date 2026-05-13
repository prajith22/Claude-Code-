// Skeleton for /tickets/concerts. Back link + header + a 2/3-col
// artist grid (each tile is image-on-top, name+tagline+price below).
export default function ConcertsLoading() {
  return (
    <div
      className="-mx-4 -mt-4 px-4 pt-6 pb-10"
      style={{ backgroundColor: "#F5F0E6" }}
    >
      <div className="mx-auto max-w-3xl animate-pulse">
        <div className="h-4 w-20 rounded bg-stone-200" />
        <div className="mt-2 h-10 w-40 rounded-lg bg-stone-200" />
        <div className="mt-2 h-4 w-3/4 rounded bg-stone-200" />
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[4/3] rounded-2xl bg-stone-200" />
              <div className="h-3 w-2/3 rounded bg-stone-200" />
              <div className="h-3 w-1/2 rounded bg-stone-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
