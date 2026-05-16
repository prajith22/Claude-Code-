// Instant full-screen cream cover shown by Next.js during the
// /quick-sim route transition, before QuickSimFlow mounts its own
// fixed z-50 overlay. Solid, no animation — it exists only to make
// sure nothing on the previous page (notably the floating Quick
// Sim button + its DopaminePulse) is visible mid-transition.
// Matches the brand background so the swap reads as instant.
export default function QuickSimLoading() {
  return <div className="fixed inset-0 z-50 bg-[#F5F0E6]" />;
}
