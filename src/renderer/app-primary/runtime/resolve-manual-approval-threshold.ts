/** Read a validated manual-approval threshold, falling back when absent/invalid. */
export function resolveManualApprovalThreshold<T>(input: unknown, parse: (value: unknown) => T | null | undefined, fallback: T): T {
  return parse(input) ?? fallback;
}
