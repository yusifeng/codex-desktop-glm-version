/** Return whether a host descriptor represents an SSH connection. */
export function isSshHostKind(value: { kind?: string | null } | null | undefined): boolean {
  return value?.kind === "ssh";
}
