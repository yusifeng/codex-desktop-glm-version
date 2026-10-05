export interface RateLimitEntry { snapshot: { primary?: RateLimitBucket | null; secondary?: RateLimitBucket | null }; limitName: string }
export interface RateLimitBucket { windowDurationMins?: number | null; [key: string]: unknown }

/** Build stable primary/secondary rate-limit bucket keys for the usage view. */
export function buildRateLimitBuckets(entry: RateLimitEntry, keyPrefix: string, isPresent: (bucket: RateLimitBucket | null | undefined) => boolean, bucketKey: (bucket: RateLimitBucket, role: string, index: number) => string): Array<{ key: string; bucket: RateLimitBucket; limitName: string }> {
  const buckets = [
    { bucket: entry.snapshot.primary, role: "primary" },
    { bucket: entry.snapshot.secondary, role: "secondary" },
  ].filter(({ bucket }) => isPresent(bucket)).sort((a, b) => (a.bucket?.windowDurationMins ?? 0) - (b.bucket?.windowDurationMins ?? 0));
  const seen = new Map<string, number>();
  return buckets.map(({ bucket, role }, index) => {
    const base = bucketKey(bucket as RateLimitBucket, role, index);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return { key: `${keyPrefix}-${count === 0 ? base : `${base}-${role}`}`, bucket: bucket as RateLimitBucket, limitName: entry.limitName };
  });
}
