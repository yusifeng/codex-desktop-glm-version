/**
 * Projects pull-request merge metadata into the conflict banner state used by
 * the generated review surface. Unknown values intentionally produce no state.
 */
export function getMergeConflictState(input: {
  mergeStateStatus?: unknown;
  mergeable?: unknown;
} | null | undefined): "conflicts" | "unknown" | null {
  const mergeable = typeof input?.mergeable === "string" ? input.mergeable.toUpperCase() : undefined;
  const mergeStateStatus = typeof input?.mergeStateStatus === "string" ? input.mergeStateStatus.toUpperCase() : undefined;
  if (mergeable === "CONFLICTING" || mergeStateStatus === "DIRTY") return "conflicts";
  if (mergeable === "UNKNOWN") return "unknown";
  return null;
}
