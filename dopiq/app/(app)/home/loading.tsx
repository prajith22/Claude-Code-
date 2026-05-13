// Skeleton for /home. Mirrors the live layout: greeting heading,
// savings hero, Quick Sim row, 2x2 simulator grid, spin-wheel
// circle, and plan-usage card. Static markup only — no JS, no
// imports — so it paints in <16ms during a Link click.
export default function HomeLoading() {
  return (
    <div className="animate-pulse space-y-8 pb-4 pt-4 md:space-y-10">
      {/* Greeting */}
      <div className="h-12 w-2/3 rounded-lg bg-stone-200 md:h-16" />
      {/* Savings + streak hero */}
      <div className="h-32 rounded-card bg-stone-200" />
      {/* Quick Sim row */}
      <div className="h-20 rounded-card bg-stone-200" />
      {/* Simulator grid — 2x2 on web, falls back to 2-wide on mobile too */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="aspect-[5/6] rounded-card bg-stone-200" />
        <div className="aspect-[5/6] rounded-card bg-stone-200" />
        <div className="aspect-[5/6] rounded-card bg-stone-200" />
        <div className="aspect-[5/6] rounded-card bg-stone-200" />
      </div>
      {/* Daily spin wheel area */}
      <div className="flex justify-center">
        <div className="h-60 w-60 rounded-full bg-stone-200 md:h-72 md:w-72" />
      </div>
      {/* Plan usage */}
      <div className="h-24 rounded-card bg-stone-200" />
    </div>
  );
}
