/**
 * Fisher-Yates shuffle. Returns a new array; does not mutate input.
 * SSR caveat: callers must initialize state to natural order and shuffle
 * inside a useEffect to avoid hydration mismatch on server-rendered pages.
 */
export function fisherYates<T>(input: T[]): T[] {
  const a = input.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
