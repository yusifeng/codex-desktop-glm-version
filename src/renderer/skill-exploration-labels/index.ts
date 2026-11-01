import {
  G2 as defineMessages,
  HI as joinPath,
  K2 as initializeInternationalization,
  NB as persistedVisualizationSkill,
  PB as liveVisualizationSkill,
  RI as initializePathRuntime,
  aq as visualizePluginId,
  oq as visualizeSkillId,
  wL as initializeUtilities,
  type IntlShape,
  type MessageDescriptor,
} from "@rchunk/app-shared";
import {
  R5t as initializeSkillMetadata,
  Wpn as findMention,
  _9t as initializePathNormalization,
  b9t as normalizePath,
  g9t as getSkillDefinitionMetadata,
  qpn as normalizeMentionPath,
} from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

type VisualizationChange = "create" | "update";
interface ToolSummary { name?: string; path?: string; type?: string; isSkillDefinitionFile?: boolean; skillId?: string; pluginId?: string; [key: string]: unknown }
interface ContentPart { type?: string; text?: string; [key: string]: unknown }
interface ConversationItem { type?: string; content?: ContentPart[]; input?: ContentPart[]; status?: string }

let visualizationPath: RegExp;
let mutatingCommand: RegExp;
let addFile: RegExp;
let updateFile: RegExp;
let deleteFile: RegExp;
let explicitSkillIds: string[];
let pluginMention: RegExp;
let softIntent: RegExp;
let messages: Record<string, MessageDescriptor>;

function classifyVisualizationCommand(command: string): VisualizationChange | null {
  if (!visualizationPath.test(command) || !mutatingCommand.test(command)) return null;
  if (addFile.test(command)) return "create";
  if (updateFile.test(command)) return "update";
  if (deleteFile.test(command)) return null;
  return "create";
}

function isSuccessfulStatus(status?: string | null): boolean {
  if (status == null) return true;
  switch (status) {
    case "inProgress": case "completed": return true;
    case "failed": case "declined": case "interrupted": return false;
  }
}

function isVisualizationSkill(summary: ToolSummary | null | undefined): boolean {
  if (summary?.isSkillDefinitionFile !== true) return false;
  const skillId = summary.skillId.toLowerCase();
  return skillId === "visualize" || (summary.pluginId?.toLowerCase() === "visualize" && (skillId === "live" || skillId === "persisted"));
}

function detectVisualizationIntent(initial: ContentPart[] = [], items: ConversationItem[] = []): "explicit" | "soft" | "none" {
  const content = [initial];
  for (const item of items) {
    if (item.type === "userMessage" && item.content) content.push(item.content);
    if (item.type === "steeringUserMessage" && item.status === "accepted" && item.input) content.push(item.input);
  }
  let soft = false;
  for (const parts of content) for (const part of parts) {
    if (part.type !== "text" || part.text == null) continue;
    if (softIntent.test(part.text)) soft = true;
    let offset = 0;
    while (offset < part.text.length) {
      const mention = findMention(part.text, offset) as { end: number; path: string } | null;
      if (mention == null) break;
      const id = pluginMention.exec(normalizeMentionPath(mention.path))?.[1]?.trim().toLowerCase();
      if (id != null && explicitSkillIds.includes(id)) return "explicit";
      offset = mention.end;
    }
  }
  return soft ? "soft" : "none";
}

function formatVisualizationSummary({ intl, kind, isFinished, isLeadingSegment }: { intl: IntlShape; kind: VisualizationChange; isFinished: boolean; isLeadingSegment: boolean }): string {
  const key = kind === "create"
    ? isFinished ? isLeadingSegment ? "summaryCreatedLeading" : "summaryCreated" : isLeadingSegment ? "summaryCreatingLeading" : "summaryCreating"
    : isFinished ? isLeadingSegment ? "summaryUpdatedLeading" : "summaryUpdated" : isLeadingSegment ? "summaryUpdatingLeading" : "summaryUpdating";
  return String(intl.formatMessage(messages[key]));
}

function resolveSkillPath({ summary, cwd }: { summary: ToolSummary; cwd?: string | null }): string | null {
  let path: string | null;
  switch (summary.type) {
    case "read": path = resolvePath({ path: summary.path ?? summary.name, cwd }); break;
    case "list_files": case "search": path = summary.path ? resolvePath({ path: summary.path, cwd }) : null; break;
    default: path = null;
  }
  return path;
}
function resolvePath({ path, cwd }: { path?: string; cwd?: string | null }): string | null {
  if (!path) return null;
  const normalized = normalizePath(path);
  return normalized.length === 0 ? null : cwd == null ? normalized : normalizePath(joinPath(cwd, normalized));
}
function getSkillDefinition(input: { summary: ToolSummary; cwd?: string | null }): ToolSummary | null {
  const path = resolveSkillPath(input);
  return path ? getSkillDefinitionMetadata(path) as ToolSummary | null : null;
}
function isSkillDefinition(input: { summary: ToolSummary; cwd?: string | null }): boolean { return getSkillDefinition(input)?.isSkillDefinitionFile === true; }
function initializeSkillPathHelpers(): void { initializePathRuntime(); initializePathNormalization(); }

function initializeSkillExplorationLabels(): void {
  initializeUtilities(); initializeInternationalization(); initializeSkillMetadata();
  visualizationPath = /(?:^|[\\/])visualizations(?:[\\/"'\s;]|$)/i;
  mutatingCommand = /(?:^|\s)(?:apply_patch|mkdir|tee|touch|cp|mv|install)(?:\s|$)|(?:^|[^<])>>?/;
  addFile = /\*\*\* Add File:[^\r\n]*[\\/]visualizations(?:[\\/"'\s;]|$)/i;
  updateFile = /\*\*\* Update File:[^\r\n]*[\\/]visualizations(?:[\\/"'\s;]|$)/i;
  deleteFile = /\*\*\* Delete File:[^\r\n]*[\\/]visualizations(?:[\\/"'\s;]|$)/i;
  explicitSkillIds = [`${visualizePluginId}@${visualizeSkillId}`, `${visualizePluginId}@${persistedVisualizationSkill}`, `${visualizePluginId}@${liveVisualizationSkill}`].map(String);
  pluginMention = /^plugin:\/\/([^?]+)(?:\?|$)/i;
  softIntent = /\b(?:visuals?|visuali[sz](?:e|ed|es|er|ers|ing|ations?)|(?:flow)?charts?|plot(?:s|ted|ting)?|graphs?|diagrams?|maps?|simulat(?:e|ed|es|ing|ions?|ors?)|labs?|compar(?:e|ed|es|ing|isons?)|scenarios?|explor(?:e|ed|es|ing|ations?)|interactive|adjustable[-\s]+inputs?)\b|\bshow\s+(?:(?:me|us)\s+)?how\b/i;
  messages = defineMessages({
    activeCreating:{id:"codex.visualization.activity.active.creating",defaultMessage:"<action>Creating</action> <detail>visualization</detail>",description:"Active tool activity summary while Codex creates an inline visualization"},activeUpdating:{id:"codex.visualization.activity.active.updating",defaultMessage:"<action>Updating</action> <detail>visualization</detail>",description:"Active tool activity summary while Codex updates an inline visualization"},
    rowCreating:{id:"codex.visualization.activity.row.creating",defaultMessage:"<verb>Creating</verb> visualization",description:"Tool activity row while Codex creates an inline visualization"},rowCreated:{id:"codex.visualization.activity.row.created",defaultMessage:"<verb>Created</verb> visualization",description:"Tool activity row after Codex creates an inline visualization"},rowUpdating:{id:"codex.visualization.activity.row.updating",defaultMessage:"<verb>Updating</verb> visualization",description:"Tool activity row while Codex updates an inline visualization"},rowUpdated:{id:"codex.visualization.activity.row.updated",defaultMessage:"<verb>Updated</verb> visualization",description:"Tool activity row after Codex updates an inline visualization"},
    summaryCreatingLeading:{id:"codex.visualization.activity.summary.creating.leading",defaultMessage:"Creating visualization",description:"Leading collapsed tool activity summary while Codex creates an inline visualization"},summaryCreating:{id:"codex.visualization.activity.summary.creating",defaultMessage:"creating visualization",description:"Collapsed tool activity summary while Codex creates an inline visualization"},summaryCreatedLeading:{id:"codex.visualization.activity.summary.created.leading",defaultMessage:"Created visualization",description:"Leading collapsed tool activity summary after Codex creates an inline visualization"},summaryCreated:{id:"codex.visualization.activity.summary.created",defaultMessage:"created visualization",description:"Collapsed tool activity summary after Codex creates an inline visualization"},summaryUpdatingLeading:{id:"codex.visualization.activity.summary.updating.leading",defaultMessage:"Updating visualization",description:"Leading collapsed tool activity summary while Codex updates an inline visualization"},summaryUpdating:{id:"codex.visualization.activity.summary.updating",defaultMessage:"updating visualization",description:"Collapsed tool activity summary while Codex updates an inline visualization"},summaryUpdatedLeading:{id:"codex.visualization.activity.summary.updated.leading",defaultMessage:"Updated visualization",description:"Leading collapsed tool activity summary after Codex updates an inline visualization"},summaryUpdated:{id:"codex.visualization.activity.summary.updated",defaultMessage:"updated visualization",description:"Collapsed tool activity summary after Codex updates an inline visualization"},
  });
}

export { classifyVisualizationCommand as a, isVisualizationSkill as c, formatVisualizationSummary as i, isSuccessfulStatus as l, initializeSkillPathHelpers as n, detectVisualizationIntent as o, isSkillDefinition as r, initializeSkillExplorationLabels as s, getSkillDefinition as t, messages as u };
