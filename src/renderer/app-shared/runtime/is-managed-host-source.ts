/** Return whether a host came from Codex-managed or discovered sources. */
export function isManagedHostSource(value: { source?: string | null } | null | undefined): boolean {
  return value?.source === "codex-managed" || value?.source === "discovered";
}
