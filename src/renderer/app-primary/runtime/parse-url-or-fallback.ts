/** Return a valid HTTPS URL from a feature value, or the release fallback. */
export function parseUrlOrFallback(value: { url?: unknown } | null | undefined, fallback: string): string {
  if (typeof value?.url !== "string" || !value.url.startsWith("https://")) return fallback;
  try {
    new URL(value.url);
    return value.url;
  } catch {
    return fallback;
  }
}
