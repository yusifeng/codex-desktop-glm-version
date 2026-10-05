/** Remove a trailing numeric count suffix from a display label when enabled. */
export function stripCountSuffix(value: string, enabled: boolean): string {
  return enabled ? value.replace(/(?:\s+\(\s*\d+(?:-\d+)?\s*\)|\s+\d+(?:-\d+)?)(\s*)$/u, "") : value;
}
