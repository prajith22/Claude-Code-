// Skeleton shared by /shop/category/[category] and
// /shop/category/top-picks. Back link + centered serif heading +
// subtitle line + masonry-style product grid with varied
// placeholder heights so hydration doesn't snap from "uniform
// skeleton" → "masonry content".
//
// Heights cycle via a static repeating pattern (not random — keeps
// SSR / CSR identical and avoids hydration mismatch).
const PLACEHOLDER_HEIGHTS = [
  "h-[230px]",
  "h-[260px]",
  "h-[280px]",
  "h-[250px]",
  "h-[300px]",
  "h-[240px]",
  "h-[270px]",
  "h-[250px]",
  "h-[290px]",
  "h-[230px]",
  "h-[260px]",
  "h-[280px]",
];

export default function ShopCategoryLoading() {
  return (
    <div className="animate-pulse space-y-8 pb-4 pt-2">
      <header>
        <div className="h-4 w-28 rounded bg-stone-200" />
        <div className="mx-auto mt-4 h-9 w-48 rounded-lg bg-stone-200 md:h-11 md:w-60" />
        <div className="mx-auto mt-2 h-3 w-40 rounded bg-stone-200" />
      </header>
      <div className="columns-2 gap-2 md:columns-3">
        {PLACEHOLDER_HEIGHTS.map((h, i) => (
          <div
            key={i}
            className={`${h} mb-2 break-inside-avoid rounded-card bg-stone-200`}
          />
        ))}
      </div>
    </div>
  );
}
