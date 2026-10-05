/** Normalize supported execution locations, defaulting unknown values to local. */
export function normalizeExecutionLocation(value: string | null | undefined, fallback = "local"): string {
  return value === "worktree" || value === "local" ? value : fallback;
}
