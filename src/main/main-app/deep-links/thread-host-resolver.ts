// @ts-nocheck

/** Resolves a conversation deep link to the first catalog host that is connected and owns the thread. */
export function resolveDeepLinkThreadHost(options: Record<string, any>) {
  const {
    threadId,
    originHostId,
    catalog,
    hasAppServerConnection,
  } = options;
  const catalogHostIds = new Set(
    catalog?.readStatus().hosts.map(({ hostId }: Record<string, any>) => hostId),
  );
  const candidates = new Set([
    originHostId,
    catalog?.readThreadHostId(threadId),
    ...catalogHostIds,
  ]);
  for (const hostId of candidates) {
    if (
      hostId != null &&
      catalogHostIds.has(hostId) &&
      hasAppServerConnection(hostId) &&
      catalog?.readEntries([{ hostId, threadId }]).length
    ) {
      return hostId;
    }
  }
  return originHostId ?? `local`;
}

if (typeof module !== "undefined") {
  module.exports = { resolveDeepLinkThreadHost };
}
