/** Normalize server image hints while preserving the default picture hint. */
export function normalizeSystemHints(input: { system_hints?: string[] | null }, defaults = ["picture_v2"]): string[] {
  if (input.system_hints == null) return [...defaults];
  return [...new Set([...input.system_hints.filter((hint) => hint !== "sketch"), ...defaults.filter((hint) => hint !== "picture_v2")])];
}
