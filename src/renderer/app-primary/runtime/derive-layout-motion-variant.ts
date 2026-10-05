export function deriveLayoutMotionVariant(input: { isCompact?: boolean; shouldReduceMotion?: boolean } | null | undefined): { animateRadius: boolean; lockedLayout?: "single-line"; radiusVariant?: "compact" } {
  const compact = input?.isCompact === true;
  return { animateRadius: input != null && input.shouldReduceMotion !== true, lockedLayout: compact ? "single-line" : undefined, radiusVariant: compact ? "compact" : undefined };
}
