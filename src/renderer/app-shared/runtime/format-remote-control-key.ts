/** Build the stable key used to identify a remote-control resource. */
export function formatRemoteControlKey(value: string): string {
  return `remote-control:${encodeURIComponent(value)}`;
}
