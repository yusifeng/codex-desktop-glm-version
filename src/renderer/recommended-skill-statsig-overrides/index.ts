import "@rchunk/app-shared";
import "@rchunk/app-initial";

function parseSkillMarkdownOverrides(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const source = isRecord(value.skill_markdown_by_id) ? value.skill_markdown_by_id : {};
  const result: Record<string, string> = {};
  for (const [skillId, markdown] of Object.entries(source)) if (typeof markdown === "string" && markdown.trim()) result[skillId] = markdown;
  return result;
}
const recommendedSkillMarkdown = (overrides: Record<string, string>, skillId: string): string | undefined => overrides[skillId];
const readRecommendedSkillOverrides = (value: unknown = {}): Record<string, string> => parseSkillMarkdownOverrides(value);
const initialize = (): void => {};
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value != null && !Array.isArray(value);
export { initialize as n, readRecommendedSkillOverrides as r, recommendedSkillMarkdown as t };
