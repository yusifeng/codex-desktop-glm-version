import {
  SX as codexMicroConfigSchema,
  wL as initializeSharedConfig,
  yX as defaultCodexMicroConfig,
  type CodexMicroConfig,
} from "@rchunk/app-shared";
import {
  i as initializeCodexMicroCommands,
  n as getCodexMicroCommand,
} from "@rchunk/codex-micro-commands";

export type CodexMicroKeycapSize = "single" | "double";
export type CodexMicroKeycapAction =
  | { type: "command"; command: string }
  | { type: "composer-text"; label: string; text: string }
  | { type: "custom-shortcut" }
  | { type: "external-url"; label: string; url: string }
  | { type: "named"; label: string };

export interface CodexMicroKeycap {
  action: CodexMicroKeycapAction;
  icon: string;
  id: string;
  size: CodexMicroKeycapSize;
}

export type ConfiguredKeyAction =
  | { type: "command"; commandId: string }
  | { type: "composer-text"; label: string; text: string }
  | { type: "skill"; skillName: string; skillPath?: string };

export interface CodexMicroSlotConfig {
  action?: ConfiguredKeyAction;
  commandId?: string;
  keycapId: string;
  [key: string]: unknown;
}

export interface EditableCodexMicroConfig extends Omit<CodexMicroConfig, "slots"> {
  slots: Record<string, CodexMicroSlotConfig>;
}

export type ResolvedCodexMicroAction =
  | { type: "command"; command: string }
  | { type: "composer-text"; label: string; text: string }
  | { type: "external-url"; label: string; url: string }
  | { type: "push-to-talk" }
  | { type: "skill"; skillName: string; skillPath?: string };

let keycaps: CodexMicroKeycap[] = [];
let assignableSlotIds: string[] = [];

function searchableKeycapTerms(keycap: CodexMicroKeycap): string[] {
  switch (keycap.action.type) {
    case "command": return [keycap.action.command];
    case "composer-text": return [keycap.action.label, keycap.action.text];
    case "custom-shortcut": return ["blank", "custom", "empty", "shortcut"];
    case "external-url": return [keycap.action.label, keycap.action.url];
    case "named": return [keycap.action.label];
  }
}

function initializeKeycapCatalog(): void {
  keycaps = [
    keycap("FAST", "lightning-outline", "command", "composer.toggleFastMode"),
    keycap("APPR", "check-circle", "command", "approval.approve"),
    keycap("REJ", "x-circle", "command", "approval.decline"),
    keycap("SPLIT", "worktree", "command", "forkThread"),
    { id: "MIC", icon: "mic", size: "double", action: { type: "named", label: "Push to talk" } },
    { id: "MIC1", icon: "mic", size: "single", action: { type: "named", label: "Push to talk" } },
    keycap("CODEX", "codex", "command", "composer.submit"),
    keycap("BUG", "bug", "command", "feedback"),
    { id: "OAI", icon: "openai", size: "single", action: { type: "external-url", label: "Open OpenAI docs", url: "https://developers.openai.com" } },
    keycap("TERM", "terminal", "command", "toggleTerminal"),
    keycap("DWN", "download", "command", "copyConversationMarkdown"),
    keycap("DEL", "trash", "command", "archiveThread"),
    keycap("NEW", "compose", "command", "newTask"),
    keycap("NAV", "pointer-outline", "command", "openBrowserTab"),
    keycap("MAGIC", "star", "command", "toggleThreadPin"),
    keycap("DIFF", "diff", "command", "toggleReviewTab"),
    keycap("PLAY", "play-outline", "command", "environmentAction1"),
    keycap("GIT", "diff", "command", "git.commit"),
    keycap("BRCH", "pull-request-draft", "command", "git.createDraftPullRequest"),
    keycap("BRANCH", "branch", "command", "git.createBranch"),
    keycap("MRG", "pull-request-merged", "command", "git.mergePullRequest"),
    keycap("PR", "pull-request", "command", "git.createPullRequest"),
    keycap("PAINT", "paint", "command", "composer.addPhotos"),
    keycap("LAB", "flask", "command", "settings"),
    keycap("PARTY", "confetti", "command", "openSideChat"),
    keycap("TIME", "clock", "command", "manageTasks"),
    keycap("MIND+", "brain-medium", "command", "composer.increaseReasoningEffort"),
    keycap("MIND-", "brain-outline", "command", "composer.decreaseReasoningEffort"),
    emptyKeycap("EMPT1"), emptyKeycap("EMPT2"), emptyKeycap("EMPT3"), emptyKeycap("EMPT4"),
    keycap("SETUP", "settings", "command", "settings"),
    keycap("FOLD", "folder-plus", "command", "openFolder"),
    keycap("UPL", "cloud-upload", "command", "composer.addFiles"),
    keycap("APPS", "all-products", "command", "openSkills"),
    { id: "YOLO", icon: "empty", size: "single", action: { type: "composer-text", label: "Write :yolo: in the composer", text: ":yolo:" } },
    { id: "YEET", icon: "empty", size: "single", action: { type: "composer-text", label: "Write :yeet: in the composer", text: ":yeet:" } },
    { ...emptyKeycap("EMPT5"), size: "double" },
  ];
}

function keycap(id: string, icon: string, type: "command", command: string): CodexMicroKeycap {
  return { id, icon, size: "single", action: { type, command } };
}

function emptyKeycap(id: string): CodexMicroKeycap {
  return { id, icon: "empty", size: "single", action: { type: "custom-shortcut" } };
}

function parseCodexMicroConfig(value: unknown): CodexMicroConfig {
  return codexMicroConfigSchema.safeParse(value).data ?? defaultCodexMicroConfig;
}

function getKeycap(keycapId: string): CodexMicroKeycap {
  return keycaps.find((candidate) => candidate.id === keycapId) ?? keycaps[0];
}

function getCompatibleKeycaps(slotId: string): CodexMicroKeycap[] {
  const size: CodexMicroKeycapSize = slotId === "ACT10_ACT11" ? "double" : "single";
  return keycaps.filter((candidate) => candidate.size === size);
}

function assignKeycap(
  config: EditableCodexMicroConfig,
  slotId: string,
  assignment: CodexMicroSlotConfig,
): EditableCodexMicroConfig {
  const slots = { ...config.slots };
  const previous = slots[slotId];
  const duplicateSlot = assignableSlotIds.find((candidateId) =>
    !(config.separateMicrophoneKeys
      ? candidateId === "ACT10_ACT11"
      : candidateId === "ACT10" || candidateId === "ACT11")
    && candidateId !== slotId
    && slots[candidateId]?.keycapId === assignment.keycapId);
  slots[slotId] = assignment;
  if (duplicateSlot != null && previous != null) slots[duplicateSlot] = previous;
  return { ...config, slots };
}

function updateAnalogStick<T extends EditableCodexMicroConfig>(config: T, key: string, value: unknown): T {
  return { ...config, analogStick: { ...config.analogStick, [key]: value } };
}

function updateEncoder<T extends EditableCodexMicroConfig>(config: T, key: string, value: unknown): T {
  return { ...config, encoder: { ...config.encoder, [key]: value } };
}

function parseAgentSlotId(value: string): string | null {
  return ["ACT06", "ACT07", "ACT08", "ACT09", "ACT10", "ACT11", "ACT12"].includes(value)
    ? value
    : null;
}

function resolveSlotAction(slot: CodexMicroSlotConfig): ResolvedCodexMicroAction | null {
  const configuredAction = slot.action;
  if (configuredAction?.type === "composer-text" || configuredAction?.type === "skill") return configuredAction;
  const commandId = configuredAction?.type === "command" ? configuredAction.commandId : slot.commandId;
  const catalogKeycap = getKeycap(slot.keycapId);
  if (commandId != null) {
    const command = getCodexMicroCommand(commandId) as { id?: unknown } | null;
    if (typeof command?.id === "string") return { type: "command", command: command.id };
    if (catalogKeycap.action.type === "custom-shortcut") return null;
  }
  if (catalogKeycap.id === "MIC" || catalogKeycap.id === "MIC1") return { type: "push-to-talk" };
  switch (catalogKeycap.action.type) {
    case "command":
    case "composer-text":
    case "external-url": return catalogKeycap.action;
    case "custom-shortcut":
    case "named": return null;
  }
}

function initializeCodexMicroLayout(): void {
  initializeSharedConfig();
  initializeCodexMicroCommands();
  initializeKeycapCatalog();
  assignableSlotIds = ["ACT06", "ACT07", "ACT08", "ACT09", "ACT10", "ACT11", "ACT10_ACT11", "ACT12"];
}

export {
  resolveSlotAction as a,
  updateEncoder as c,
  searchableKeycapTerms as d,
  initializeKeycapCatalog as f,
  parseCodexMicroConfig as i,
  assignKeycap as l,
  getCompatibleKeycaps as n,
  initializeCodexMicroLayout as o,
  getKeycap as r,
  updateAnalogStick as s,
  parseAgentSlotId as t,
  keycaps as u,
};
