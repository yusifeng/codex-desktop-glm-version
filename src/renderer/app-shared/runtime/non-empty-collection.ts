/** Return whether a collection contains at least one item. */
export function hasItems(value: { length: number }): boolean {
  return value.length > 0;
}

/** Project the first item of a nullable collection, or null when absent. */
export function firstOrNull<T>(value: readonly T[] | null | undefined): T | null {
  return value?.[0] ?? null;
}
