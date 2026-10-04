/** The canonical history view exposes its newest island only after its boundary is exhausted. */
export interface CanonicalHistoryIsland<TEntry = unknown> {
  entries: readonly TEntry[];
  newerBoundary?: { status?: string } | null;
}

export interface CanonicalHistory<TEntry = unknown> {
  islands: readonly CanonicalHistoryIsland<TEntry>[];
  entitiesByKey?: Record<string, unknown>;
}

/** Return the newest complete canonical-history island, or null while it is still loading. */
export function getCanonicalHistoryEntries<TEntry = unknown>(
  history: unknown,
): CanonicalHistoryIsland<TEntry> | null {
  if (typeof history !== "object" || history == null || !Array.isArray((history as CanonicalHistory<TEntry>).islands)) return null;
  const newest = (history as CanonicalHistory<TEntry>).islands.at(-1);
  return newest?.newerBoundary?.status === "exhausted" ? newest : null;
}
