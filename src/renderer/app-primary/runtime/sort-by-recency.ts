/** Return a recency-descending copy without mutating the source collection. */
export function sortByRecency<T extends { recencyAtMs?: number | null }>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => (right.recencyAtMs ?? 0) - (left.recencyAtMs ?? 0));
}
