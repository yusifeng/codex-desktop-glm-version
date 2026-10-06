/** Returns the final non-empty segment of a normalized path. */
export function getPathBasename(value: string): string {
  const normalized = value.replace(/\/+$/, "");
  return normalized.split("/").at(-1) ?? normalized;
}
