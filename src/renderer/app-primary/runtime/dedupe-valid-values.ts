/** Preserve first-seen valid values while deduplicating case-insensitively. */
export function dedupeValidValues(values: string[], isValid: (value: string) => boolean): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (isValid(value) && !seen.has(key)) { seen.add(key); result.push(value); }
  }
  return result;
}
