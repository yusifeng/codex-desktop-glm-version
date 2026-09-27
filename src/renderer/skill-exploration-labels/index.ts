import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

type VisualizationChange = "create" | "update";
interface ToolSummary { name?: string; path?: string; type?: string; isSkillDefinitionFile?: boolean; skillId?: string; pluginId?: string; [key: string]: unknown }
const VISUALIZATION_PATH = /(?:^|[\\/\s])visualizations(?:[\\/"'\s;]|$)/i;
function classifyVisualizationCommand(command: string): VisualizationChange | null { if (!VISUALIZATION_PATH.test(command) || !/(?:apply_patch|mkdir|tee|touch|cp|mv|install|>>?)/.test(command)) return null; if (/\*\*\* Delete File:/i.test(command)) return null; return /\*\*\* Update File:/i.test(command) ? "update" : "create"; }
function isSuccessfulStatus(status?: string): boolean { return status == null || status === "inProgress" || status === "completed"; }
function isVisualizationSkill(summary: ToolSummary | null | undefined): boolean { if (summary?.isSkillDefinitionFile !== true) return false; const skill = summary.skillId?.toLowerCase(); return skill === "visualize" || (summary.pluginId?.toLowerCase() === "visualize" && (skill === "live" || skill === "persisted")); }
function formatVisualizationSummary({ kind, isFinished, isLeadingSegment }: { intl?: unknown; kind: VisualizationChange; isFinished: boolean; isLeadingSegment: boolean }): string { const verb = kind === "create" ? (isFinished ? "Created" : "Creating") : (isFinished ? "Updated" : "Updating"); return `${isLeadingSegment ? verb : verb.toLowerCase()} visualization`; }
function detectVisualizationIntent(content: Array<{ type?: string; text?: string }> = []): "explicit" | "soft" | "none" { const text = content.filter(item => item.type === "text").map(item => item.text ?? "").join(" "); if (/plugin:\/\/visualize@(?:live|persisted)/i.test(text)) return "explicit"; return /\b(?:visuali[sz]|chart|plot|graph|diagram|map|simulation|interactive)\w*\b/i.test(text) ? "soft" : "none"; }
function isSkillDefinition({ summary }: { summary: ToolSummary }): boolean { return summary.isSkillDefinitionFile === true; }
function getSkillDefinition({ summary }: { summary: ToolSummary }): ToolSummary | null { return summary.isSkillDefinitionFile ? summary : null; }
function initializeSkillPathHelpers(): void {}
function initializeSkillExplorationLabels(): void {}
const messages = { activeCreating: "Creating visualization", activeUpdating: "Updating visualization" };
export { classifyVisualizationCommand as a, isVisualizationSkill as c, formatVisualizationSummary as i, isSuccessfulStatus as l, initializeSkillPathHelpers as n, detectVisualizationIntent as o, isSkillDefinition as r, initializeSkillExplorationLabels as s, getSkillDefinition as t, messages as u };
