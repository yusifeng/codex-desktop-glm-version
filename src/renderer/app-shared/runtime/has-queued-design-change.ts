export function hasQueuedDesignChange<T extends { designChange?: { status?: unknown } }>(items: readonly T[], isValidDesignChange: (change: NonNullable<T["designChange"]>) => boolean): boolean {
  return items.some((item) => item.designChange?.status === "queued" && isValidDesignChange(item.designChange));
}
