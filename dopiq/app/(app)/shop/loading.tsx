// Skeleton for /shop. Header row + product grid (2-col on mobile,
// 3-col on md+). Six tile placeholders — roughly what shows above
// the fold on a typical phone.
export default function ShopLoading() {
  return (
    <div className="animate-pulse space-y-6 pb-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="h-8 w-24 rounded-lg bg-stone-200" />
          <div className="mt-2 h-4 w-44 rounded bg-stone-200" />
        </div>
        <div className="h-10 w-10 rounded-full bg-stone-200" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square rounded-card bg-stone-200" />
            <div className="h-4 w-3/4 rounded bg-stone-200" />
            <div className="h-3 w-1/2 rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
