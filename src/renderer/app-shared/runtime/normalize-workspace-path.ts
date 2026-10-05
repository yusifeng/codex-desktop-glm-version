/** Normalize a workspace path for stable comparisons and display. */
export function normalizeWorkspacePath(value: string, normalizeSeparators: (value: string) => string = (input) => input): string {
  const normalized = normalizeSeparators(value.trim()).replace(/\/+$/u, "");
  return normalized === "" ? "/" : normalized;
}
