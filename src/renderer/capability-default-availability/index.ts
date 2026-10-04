/** Return whether a capability is available unless it explicitly opts out. */
export function isCapabilityAvailable(value: { supported?: boolean | null } | null | undefined): boolean {
  return value?.supported !== false;
}
