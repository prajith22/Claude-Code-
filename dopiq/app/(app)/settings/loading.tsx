// Skeleton for /settings. Back link + large heading + a stack of
// settings cards. Mirrors the live page's section-card layout —
// each card is title + 1-2 sub-rows.
export default function SettingsLoading() {
  return (
    <div className="animate-pulse space-y-8 pb-4 pt-4">
      <div>
        <div className="h-3 w-14 rounded bg-stone-200" />
        <div className="mt-3 h-10 w-40 rounded-lg bg-stone-200 md:h-12" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-card bg-stone-200/40 p-5">
          <div className="h-4 w-1/3 rounded bg-stone-200" />
          <div className="h-3 w-2/3 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  );
}
