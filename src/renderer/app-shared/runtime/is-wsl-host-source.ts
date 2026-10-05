/** Return whether a host originated from Windows Subsystem for Linux discovery. */
export function isWslHostSource(value: { source?: string | null } | null | undefined): boolean {
  return value?.source === "wsl";
}
