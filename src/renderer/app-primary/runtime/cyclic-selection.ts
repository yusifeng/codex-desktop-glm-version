/** Select an adjacent item with wraparound, preserving the release fallback for an unknown current item. */
export function selectCyclicItem<T>(items: readonly T[], current: T, offset: number): T | null {
  if (items.length === 0) return null;
  const index = items.findIndex((item) => item === current);
  return index === -1
    ? (items[offset === -1 ? items.length - 1 : 0] ?? null)
    : (items[(index + offset + items.length) % items.length] ?? null);
}
