/** Return whether a host originated from remote-control discovery. */
export function isRemoteControlHostSource(value: { source?: string | null } | null | undefined): boolean {
  return value?.source === "remote-control";
}
