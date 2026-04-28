// Tiny legal-line disclaimer used at the bottom of each simulator's
// main page (Shop, Food, Bet). Subtle on purpose: 11px Inter in a
// muted gray, centered, with comfortable side padding so it never
// touches the screen edges. No card chrome — just a single line.
export function SimDisclaimer({ text }: { text: string }) {
  return (
    <p
      className="mx-auto max-w-2xl px-4 pt-6 text-center font-sans text-[11px] leading-relaxed"
      style={{ color: "#9E9E9E" }}
    >
      {text}
    </p>
  );
}
