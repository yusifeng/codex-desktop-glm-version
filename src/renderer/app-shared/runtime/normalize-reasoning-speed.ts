/** Resolve supported reasoning speed from an explicit or provider hint. */
export function normalizeReasoningSpeed(value: string, providerHint?: string | null, ultraFast = "ultrafast"): "fast" | "ultrafast" | null {
  const hint = providerHint?.trim().toLowerCase();
  if (value === "priority" || value === "fast" || hint === "fast") return "fast";
  return value === ultraFast || hint === ultraFast ? "ultrafast" : null;
}
