export interface ProjectOrderMove {
  beforeProjectId: string | null;
  projectId: string;
}

/**
 * Produces the minimum stable move sequence needed to transform the current
 * project order into the requested order. The longest increasing subsequence
 * remains in place; every other project moves from right to left.
 */
export function computeProjectOrderMoves(
  currentOrder: string[],
  requestedOrder: string[],
): ProjectOrderMove[] {
  const currentPosition = new Map(currentOrder.map((projectId, index) => [projectId, index]));
  const candidates: Array<{ ids: string[]; position: number }> = [];
  let stableIds: string[] = [];

  for (const projectId of requestedOrder) {
    const position = currentPosition.get(projectId);
    if (position == null) continue;
    let predecessor: string[] = [];
    for (const candidate of candidates) {
      if (candidate.position < position && candidate.ids.length > predecessor.length)
        predecessor = candidate.ids;
    }
    const ids = [...predecessor, projectId];
    candidates.push({ position, ids });
    if (ids.length > stableIds.length) stableIds = ids;
  }

  const stable = new Set(stableIds);
  return [...requestedOrder.entries()]
    .reverse()
    .flatMap(([index, projectId]) =>
      stable.has(projectId)
        ? []
        : [{ projectId, beforeProjectId: requestedOrder[index + 1] ?? null }],
    );
}

/** Serializes async writes per key while allowing unrelated keys to proceed. */
export async function enqueueKeyed<K>(
  pending: Map<K, Promise<unknown>>,
  key: K,
  operation: () => Promise<unknown>,
): Promise<void> {
  const request = (pending.get(key) ?? Promise.resolve())
    .catch(() => undefined)
    .then(operation);
  pending.set(key, request);
  try {
    await request;
  } finally {
    if (pending.get(key) === request) pending.delete(key);
  }
}
