/** Stable storage key for a thread's cross-surface reference capability. */
export function threadReferenceCapabilityKey(threadId: string): string {
  return `thread-reference-capability:${threadId}`;
}
