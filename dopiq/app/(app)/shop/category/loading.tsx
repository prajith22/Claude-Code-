// Skeleton shared by /shop/category/[category] and
// /shop/category/top-picks. Back link + centered serif heading +
// subtitle line + 2/3-col product grid. Static markup only — paints
// in <16ms while the server route resolves.
export default function ShopCategoryLoading() {
  return (
    <div className="animate-pulse space-y-8 pb-4 pt-2">
      <header>
        <div className="h-4 w-28 rounded bg-stone-200" />
        <div className="mx-auto mt-4 h-9 w-48 rounded-lg bg-stone-200 md:h-11 md:w-60" />
        <div className="mx-auto mt-2 h-3 w-40 rounded bg-stone-200" />
      </header>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
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
