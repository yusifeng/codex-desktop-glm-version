export interface RemoteControlHost { source?: string | null }

/** Keep only remote-control hosts while preserving input order. */
export function filterRemoteControlHosts<T extends RemoteControlHost>(hosts: readonly T[] | null | undefined): T[] {
  return (hosts ?? []).filter((host) => host.source === "remote-control");
}
