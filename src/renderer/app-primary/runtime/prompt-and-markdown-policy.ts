/** Select the first non-empty trimmed prompt. */
export function getFirstPrompt(prompts: readonly string[] | null | undefined): string | null {
  return prompts?.map((prompt) => prompt.trim()).find((prompt) => prompt.length > 0) ?? null;
}

/** Strip one Markdown filename suffix, case-insensitively. */
export function stripMarkdownExtension(value: string): string {
  return value.replace(/\.md$/iu, "");
}
