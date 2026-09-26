export interface SuggestionModelSelection {
  selectedModel?: string | null;
  selectedModelDisplayName?: string | null;
}

export type SuggestionTarget = "science";

const SCIENCE_MODEL_NAME_PATTERN = /rosalind/i;
const SCIENCE_MODEL_SLUGS = new Set([
  "gpt-rosalind-preview",
  "gpt-rosalind-5-5",
  "heisenberg",
]);

function normalizeSuggestionModelName(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** 原 `fNe` / 压缩导出 `XY`。 */
export function isScienceSuggestionModel({
  selectedModel,
  selectedModelDisplayName,
}: SuggestionModelSelection): boolean {
  return [selectedModel, selectedModelDisplayName].some((value) =>
    SCIENCE_MODEL_NAME_PATTERN.test(value ?? "")
      ? true
      : SCIENCE_MODEL_SLUGS.has(normalizeSuggestionModelName(value)),
  );
}

/** 原 `dNe` / 压缩导出 `JY`。 */
export function getSuggestionTarget(
  selection: SuggestionModelSelection,
): SuggestionTarget | null {
  return isScienceSuggestionModel(selection) ? "science" : null;
}

/** 原 `KL` / 压缩导出 `YY`。 */
export function initializeSuggestionTargeting(): void {}
