// Generic page-content skeleton — used by Next.js's Suspense
// fallback whenever a more specific loading.tsx isn't matched
// inside (app)/. Layout chrome (TopNav / BottomNav) stays mounted;
// only this stand-in renders in the main content area while the
// destination page's server work resolves.
export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-4 pt-4">
      <div className="h-9 w-40 rounded-lg bg-stone-200" />
      <div className="h-32 rounded-card bg-stone-200" />
      <div className="h-32 rounded-card bg-stone-200" />
      <div className="h-32 rounded-card bg-stone-200" />
    </div>
  );
}
