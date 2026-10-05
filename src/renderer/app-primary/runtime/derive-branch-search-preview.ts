export function deriveBranchSearchPreview(input: { kind: string; searchPreview?: unknown; searchTitle?: string; branch?: string }, query: string, score: (value: string, normalizedQuery: string) => number): unknown {
  if (input.kind === "chatgpt") return null;
  if (input.searchPreview != null || input.kind !== "local") return input.searchPreview;
  const normalized = query.trim();
  if (normalized.length === 0) return null;
  return score(input.searchTitle ?? "", normalized) > 0 || score(input.branch ?? "", normalized) === 0 ? null : { kind: "branchMatch", branch: input.branch };
}
