export interface RateLimitBucket {
  windowDurationMins?: number | null;
  [key: string]: unknown;
}

export interface RateLimitEntry {
  snapshot: {
    primary?: RateLimitBucket | null;
    secondary?: RateLimitBucket | null;
  };
  limitName?: string | null;
}

interface BuildRateLimitBucketsOptions {
  entry: RateLimitEntry;
  keyPrefix: string;
}

const FIVE_HOURS_MINS = 300;
const WEEK_MINS = 10_080;
const MONTH_MINS = 43_200;

function approximatelyEqual(left: number, right: number): boolean {
  return Math.abs(left - right) <= 1;
}

function bucketKey(bucket: RateLimitBucket, role: string, index: number): string {
  const duration = bucket.windowDurationMins ?? 0;
  if (approximatelyEqual(duration, FIVE_HOURS_MINS)) return "five-hour";
  if (approximatelyEqual(duration, WEEK_MINS)) return "weekly";
  if (approximatelyEqual(duration, MONTH_MINS)) return "monthly";
  return `${role}-${index}-${duration}`;
}

/** Build the stable primary/secondary bucket rows used by the usage page. */
export function buildRateLimitBuckets({
  entry,
  keyPrefix,
}: BuildRateLimitBucketsOptions): Array<{
  key: string;
  bucket: RateLimitBucket;
  limitName?: string | null;
}> {
  const buckets = [
    { bucket: entry.snapshot.primary, role: "primary" },
    { bucket: entry.snapshot.secondary, role: "secondary" },
  ]
    .filter(
      (candidate): candidate is { bucket: RateLimitBucket; role: string } =>
        candidate.bucket != null,
    )
    .sort(
      (left, right) =>
        (left.bucket.windowDurationMins ?? 0) -
        (right.bucket.windowDurationMins ?? 0),
    );

  const seen = new Map<string, number>();
  return buckets.map(({ bucket, role }, index) => {
    const base = bucketKey(bucket, role, index);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return {
      key: `${keyPrefix}-${count === 0 ? base : `${base}-${role}`}`,
      bucket,
      limitName: entry.limitName,
    };
  });
}
