/** Parse a URL-shaped value and fall back when validation fails. */
export function parseUrlOrFallback<T>(value: { url: string }, parse: (url: string) => T | null, fallback: T): T {
  const parsed = parse(value.url);
  return parsed ?? fallback;
}
