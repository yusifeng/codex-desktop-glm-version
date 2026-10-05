/** Split a whitespace-delimited string and discard empty tokens. */
export function splitWhitespaceTokens(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean);
}
