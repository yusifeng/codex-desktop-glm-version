/** Gives empty searches a lower priority than searches containing text. */
export function getQueryPriority(query: string): number {
  return query.trim().length === 0 ? 3 : 100;
}
