/** Find an object's key using case-insensitive comparison. */
export function findCaseInsensitiveKey<T>(record: Record<string, T>, key: string): string | undefined {
  const normalized = key.toLowerCase();
  return Object.keys(record).find((candidate) => candidate.toLowerCase() === normalized);
}
