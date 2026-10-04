/** The canonical history view exposes its newest island only after its boundary is exhausted. */
export interface CanonicalHistoryIsland<TEntry = unknown> {
  id?: string;
  entries: readonly TEntry[];
  olderBoundary?: CanonicalHistoryBoundary | null;
  newerBoundary?: CanonicalHistoryBoundary | null;
}

export interface CanonicalHistoryBoundary {
  status?: string;
  boundaryId?: string | null;
  progressKey?: string | null;
}

export interface CanonicalHistoryBoundaryRequest {
  islandId?: string | null;
  edge: "older" | "newer";
  boundaryId?: string | null;
  progressKey?: string | null;
}

export interface CanonicalHistory<TEntry = unknown> {
  islands: readonly CanonicalHistoryIsland<TEntry>[];
  entitiesByKey?: Record<string, unknown>;
}

/** Match a page request to one of an island's currently available boundaries. */
export function matchesCanonicalHistoryBoundary<TEntry>(
  island: CanonicalHistoryIsland<TEntry>,
  request: CanonicalHistoryBoundaryRequest,
): boolean {
  const boundary = request.edge === "older" ? island.olderBoundary : island.newerBoundary;
  return (
    boundary?.status === "available" &&
    boundary.boundaryId === request.boundaryId &&
    boundary.progressKey === request.progressKey
  );
}

/** Return the unique island matching a page request, or null for stale/ambiguous requests. */
export function findCanonicalHistoryIslandIndex<TEntry>(
  islands: readonly CanonicalHistoryIsland<TEntry>[],
  request: CanonicalHistoryBoundaryRequest,
): number | null {
  if (request.islandId != null) {
    const index = islands.findIndex((island) => island.id === request.islandId);
    return index >= 0 && matchesCanonicalHistoryBoundary(islands[index]!, request) ? index : null;
  }
  let match: number | null = null;
  for (const [index, island] of islands.entries()) {
    if (!matchesCanonicalHistoryBoundary(island, request)) continue;
    if (match != null) return null;
    match = index;
  }
  return match;
}

/** Return the newest complete canonical-history island, or null while it is still loading. */
export function getCanonicalHistoryEntries<TEntry = unknown>(
  history: unknown,
): CanonicalHistoryIsland<TEntry> | null {
  if (typeof history !== "object" || history == null || !Array.isArray((history as CanonicalHistory<TEntry>).islands)) return null;
  const newest = (history as CanonicalHistory<TEntry>).islands.at(-1);
  return newest?.newerBoundary?.status === "exhausted" ? newest : null;
}
