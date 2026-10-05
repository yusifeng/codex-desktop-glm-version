export interface ModelReasoningEntry { model?: string; supportedReasoningEfforts?: readonly { description?: string; reasoningEffort: string }[] }
export function selectModelReasoningEfforts(models: readonly ModelReasoningEntry[] | null | undefined, model: string, fallback: readonly string[], isSupported: (value: string) => boolean): { description: string; reasoningEffort: string }[] {
  const match = models?.find((entry) => entry.model === model);
  if (match == null) return fallback.map((reasoningEffort) => ({ description: "", reasoningEffort }));
  return (match.supportedReasoningEfforts ?? []).filter((entry) => isSupported(entry.reasoningEffort) && entry.reasoningEffort !== "persistent").map((entry) => ({ description: entry.description ?? "", reasoningEffort: entry.reasoningEffort }));
}
