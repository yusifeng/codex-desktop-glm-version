/** Resolve a connector's stable ID from the generated connector mapping. */
export function lookupConnectorId<T>(connector: string, mapping: Record<string, T>): T | undefined {
  return mapping[connector];
}
