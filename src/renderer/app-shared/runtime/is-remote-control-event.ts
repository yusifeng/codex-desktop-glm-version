/** Identify events emitted by the remote-control transport. */
export function isRemoteControlEvent(event: { source?: string } | null | undefined): boolean {
  return event?.source === "remote-control";
}
