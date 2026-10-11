export interface GithubUserAttachmentUrlCache {
  getOrSet(assetId: string, src: string, expiresAtMs: number): string;
}

export function createGithubUserAttachmentUrlCache(
  now: () => number = () => Date.now(),
  minRemainingMs = 60_000,
): GithubUserAttachmentUrlCache {
  const entries = new Map<string, { expiresAtMs: number; src: string }>();
  return {
    getOrSet(assetId, src, expiresAtMs) {
      const cached = entries.get(assetId);
      if (cached != null && cached.expiresAtMs - minRemainingMs > now()) return cached.src;
      entries.set(assetId, { expiresAtMs, src });
      return src;
    },
  };
}
