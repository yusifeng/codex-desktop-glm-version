export interface ManagedHost { source?: string | null }

/** Keep managed/discovered hosts matching the requested source. */
export function filterManagedHostsBySource<T extends ManagedHost>(hosts: readonly T[] | null | undefined, source: string): T[] {
  return (hosts ?? []).filter((host) => (host.source === "codex-managed" || host.source === "discovered") && host.source === source);
}
