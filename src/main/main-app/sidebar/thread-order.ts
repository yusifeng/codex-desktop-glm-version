/** Move one thread before another, or to the end when the anchor is absent/null. */
export function moveThreadBefore({
  threadIds,
  threadId,
  beforeThreadId,
}: {
  threadIds: string[];
  threadId: string;
  beforeThreadId: string | null;
}): string[] {
  const remaining = threadIds.filter((candidate) => candidate !== threadId);
  if (beforeThreadId == null) return [...remaining, threadId];
  const index = remaining.indexOf(beforeThreadId);
  return index === -1
    ? [...remaining, threadId]
    : [...remaining.slice(0, index), threadId, ...remaining.slice(index)];
}
