/** Select the supplied target only when a handoff source/return path pair matches. */
export function selectHandoffReturnTarget<T>(input: { sourceThreadId?: string | null; returnPath?: unknown }, target: T, matchesReturnPath: (path: unknown, sourceThreadId: string) => boolean): T | null {
  return input.sourceThreadId != null && matchesReturnPath(input.returnPath, input.sourceThreadId) ? target : null;
}
