const CLIENT_NEW_THREAD_PREFIX = "client-new-thread:";

/** Create a release-compatible client-side thread identifier. */
export function createClientNewThreadId(): string {
  return `${CLIENT_NEW_THREAD_PREFIX}${crypto.randomUUID()}`;
}

/** Recognize client-side thread identifiers created before server persistence. */
export function isClientNewThreadId(value: string): boolean {
  return value.startsWith(CLIENT_NEW_THREAD_PREFIX);
}

/** Create an opaque runtime UUID. */
export function createRuntimeUuid(): string {
  return crypto.randomUUID();
}

/** Return the package/source suffix following the final at-sign. */
export function getPackageSourceSuffix(value: string): string | null {
  const separator = value.lastIndexOf("@");
  return separator <= 0 || separator === value.length - 1 ? null : value.slice(separator + 1);
}
