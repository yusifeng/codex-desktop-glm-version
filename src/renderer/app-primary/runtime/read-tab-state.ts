export interface TabStateReader<T> {
  get(namespace: unknown, key: string): T | null | undefined;
}

/** Read a browser-tab state only when both identity components are present. */
export function readTabState<T>(reader: TabStateReader<T>, namespace: unknown, tabId: string | null | undefined, browserId: string | null | undefined): T | null | undefined {
  if (tabId == null || browserId == null) return null;
  return reader.get(namespace, `${tabId}\0${browserId}`);
}
