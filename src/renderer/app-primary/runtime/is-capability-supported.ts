/** Treat omitted capability metadata as supported; only explicit false disables it. */
export function isCapabilitySupported(value: { supported?: boolean | null } | null | undefined): boolean {
  return value?.supported !== false;
}
