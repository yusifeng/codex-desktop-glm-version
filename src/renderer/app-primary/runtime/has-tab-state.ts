/** Report whether a tab-state lookup resolves to a live state object. */
export function hasTabState<T>(lookup: (tabId: string, browserId: string) => T | null | undefined, tabId: string, browserId: string): boolean {
  return lookup(tabId, browserId) != null;
}
