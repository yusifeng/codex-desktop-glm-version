/** Strip the browser target prefix, returning null for non-browser ids. */
export function parseBrowserTargetId(value: string | null | undefined, prefix = "browser:"): string | null {
  if (value == null || !value.startsWith(prefix)) return null;
  return value.slice(prefix.length);
}
