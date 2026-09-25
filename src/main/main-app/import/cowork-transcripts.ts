// Claude Cowork 导入：会话 JSONL 解析 + 跨文件合并 + Codex rollout 编码 +
// 导入选择与迁移编排管线。
//
// 对应 main-C-Mhak1n.ts 85,073-86,195：
//   - oI/$Pe：预算化 transcript JSONL 解析（消息数/字节上限 + 原文 sha256）
//   - sI：多文件消息拓扑合并（内容键去重 + 时间戳/插入序排序 + 环余量兜底）
//   - eFe/cI：合并后内容指纹（sha256）
//   - tFe/nFe/rFe/iFe/aFe/oFe/sFe/cFe/lFe/uFe/uI：消息与内容块归一
//     （text/tool_use/tool_result/image/thinking → role/text/images，
//     tool 调用/结果降级为 markdown 标记文本）
//   - pI/fFe/mFe/hFe/gFe/_Fe/mI/vFe/hI/gI：Codex rollout JSONL 编码
//     （session_meta/task_started/user_message/agent_message/token_count/
//     task_complete）+ staged 生成文件清单注入最后一条 agent 消息
//   - dFe：projectless 基础指令（session_meta.base_instructions）
//   - bFe/xFe/SFe/CFe：会话候选构建 + 会话↔项目/空间匹配
//   - wFe/EFe：transcript 发现（storageDirs/.claude/transcripts|projects 递归
//     + audit.jsonl 兜底），预算耗尽/不可读 → skipped 原因
//   - _I/xI/SI/OFe/kFe/AFe/TI/jFe/MFe/NFe：导入选择（会话按 accountOrgDir+
//     sessionId 去重、预算/年龄/已导入过滤、显式 items 时按选择路径强校验）
//   - PFe/IFe/FFe/DI/BFe/VFe：发现→选择管线 + 全量检测串行队列
//   - LFe/HFe/UFe/WFe/GFe/KFe/qFe/JFe/RFe：迁移准备（项目配置导入 + rollout
//     并发 ≤5 准备）
//   - zFe/TPe：导入编排入口（迁移准备 + 插件导入 → importAccountSetup）

import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile, opendir } from "node:fs/promises";
import type { Dirent } from "node:fs";
import { join, basename, posix, win32 } from "node:path";
import {
  wf as objectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  gf as booleanSchema,
  Mf as jsonSchema,
  jf as unionSchema,
  xf as looseObjectSchema,
} from "@chunk/shared";
import {
  type CoworkImportHistory,
  readBoundedText,
  readImportHistory,
  hasImportedProject,
  hasImportedAccountSetupItem,
  isPlainObject,
  nonEmptyString,
  normalizeTimestamp,
  pathsEqual,
  isFile,
} from "./cowork-history";
import {
  type CoworkProject,
  type DiscoveryResult,
  type ConfigSurfacesResult,
  type DiscoveryOptions,
  type PlanItem,
  type ProjectlessSpace,
  type SessionManifest,
  type SkippedProject,
  type ImportFileResult,
  CoworkHistoryLimitError,
  CoworkHistoryReadError,
  SAFETY_LIMITS,
  HISTORY_LIMIT_WARNING,
  type DiscoveryBudget,
  type ConfigSurface,
  type PluginCandidate,
  discoverCoworkSpaces,
  collectConfigSurfaces,
  collectImportFileSources,
  importSessionFiles,
  createDiscoveryBudget,
  consumeBudget,
  readBoundedWithBudget,
  projectlessAsProject,
  scanProjectlessSpace,
  buildImportPlan,
  filterSkippedProjectsByWorkspaceRoots,
} from "./cowork-discovery";
import {
  type ImportCallbacks,
  type MigrationInput,
  type PreparedRollout,
  type ProjectImportPreparation,
  type PluginImport,
  importAccountSetup,
  prepareProjectImports,
} from "./cowork-mcp-plugins";

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 检测产出的迁移项（原 items，即 discovery 的 PlanItem）。 */
export type MigrationItem = PlanItem;

/** include 集合（原 `BP` 默认 {agents, config, sessions}）。 */
export interface ImportInclude {
  agents: boolean;
  config: boolean;
  sessions: boolean;
}

/** 选择限额（原 `NFe`：默认 30 天 + 50 会话）。 */
export interface ImportLimits {
  maxSessionAgeMs?: number;
  maxSessions?: number;
  nowMs?: number;
}

/** 会话候选（原 `bFe` 输出）：manifest + transcript 解析结果的合并视图。 */
export interface TranscriptCandidate {
  accountOrgDir: string;
  accountOrgDirs: string[];
  contentSha256: string;
  detectedFiles: SessionManifest["detectedFiles"];
  documentsDir: string;
  lastActivityAtMs: number | null;
  projectRoot: string;
  remoteMcpServerNames: string[];
  sessionStorageDirs: string[];
  sourceId: string;
  sourceJsonlPath: string;
  sourceJsonlPaths: string[];
  title: string | null;
  workspaceKind: "project" | "projectless";
}

/** 跳过会话的原因（原 skippedSessions 记录）。 */
export interface SkippedSession {
  manifestPath: string;
  reason: "too-old" | "already-imported" | "missing-transcript" | "history-limit" | "no-importable-turns";
  sessionId: string;
}

/** 项目选择结果（原 `_I` 的 projects 数组元素）。 */
export interface ProjectImportSelection {
  accountSetupSelected: boolean;
  configSurfaces: ConfigSurface[];
  /** projectless 空间的账号配置走合成项目（原 `RFe`）。 */
  isProjectlessSetup?: boolean;
  itemTypes: Set<string>;
  pluginCandidates: PluginCandidate[];
  pluginSetupSelected: boolean;
  project: CoworkProject;
  scheduledTasks: Array<{ id: string; name: string | null; sourcePath: string }>;
  shouldRecordProjectImport: boolean;
  skippedSessions: SkippedSession[];
  transcriptCandidates: TranscriptCandidate[];
  warnings: string[];
}

/** projectless 空间选择结果（原 `kFe` 输出元素）。 */
export interface ProjectlessSpaceSelection {
  accountSetupSelected: boolean;
  configSurfaces: ConfigSurface[];
  pluginCandidates: PluginCandidate[];
  pluginSetupSelected: boolean;
  projectlessSpace: ProjectlessSpace;
  skippedSessions: SkippedSession[];
  transcriptCandidates: TranscriptCandidate[];
}

/** 导入选择（原 `_I` 返回值）。 */
export interface ImportSelection {
  projectlessSpaces: ProjectlessSpaceSelection[];
  projects: ProjectImportSelection[];
}

/** projectless 线程目录回调（宿主提供，创建 cwd/outputDirectory/workspaceRoot）。 */
export type ProjectlessThreadPathCallback = (candidate: {
  projectRoot: string;
  sourceId: string;
  title: string | null;
  workspaceKind: string;
}) => Promise<{ cwd: string; outputDirectory: string; workspaceRoot: string }>;

/** 迁移准备结果（原 `LFe` 返回值，扩展 MigrationInput）。 */
export interface MigrationPreparation extends MigrationInput {
  importedAgentInstructionPaths: Array<{ cwd: string; target: string }>;
  importedMcpServerNames: string[];
  importedProjectRoots: string[];
}

/** 全量检测摘要（原 `IFe` 返回值）。 */
export interface CoworkDetectionSummary {
  cloudSessionCount: number;
  items: PlanItem[];
  unsupportedProjects: SkippedProject[];
  warnings: string[];
}

/** 导入编排结果（原 `zFe` 返回值）。 */
export interface CoworkImportResult {
  importedAgentInstructionPaths: Array<{ cwd: string; target: string }>;
  importedConfigSourcePaths: string[];
  importedMcpServerNames: string[];
  importedPluginNames: string[];
  importedProjectRoots: string[];
  importedRollouts: Array<{ importedThreadId: string; rollout: PreparedRollout }>;
}

// ---------------------------------------------------------------------------
// JSONL 解析（原 `oI`/`$Pe`/`tFe`/`nFe`/`rFe`/`iFe`/`aFe`/`oFe`/`sFe`/`cFe`/`lFe`/`uFe`/`uI`）
// ---------------------------------------------------------------------------

const TOOL_USE_TEXT_LIMIT = 2_000;
const TOOL_RESULT_TEXT_LIMIT = 4_000;
const EXTERNAL_TOOL_CALL = "external_agent_tool_call";
const EXTERNAL_TOOL_RESULT = "external_agent_tool_result";

const transcriptLineSchema = (looseObjectSchema({
  content: jsonSchema().optional(),
  isMeta: booleanSchema().optional(),
  isSidechain: booleanSchema().optional(),
  message: jsonSchema().optional(),
  role: stringSchema().optional(),
  timestamp: unionSchema([numberSchema(), stringSchema()]).nullable().optional(),
  type: stringSchema().optional(),
}) as unknown as { loose(): unknown }).loose();

/** 归一后的消息（role/text/images + 时间戳）。 */
export interface NormalizedMessage {
  images: string[];
  role: "user" | "assistant";
  text: string;
  timestampMs: number | null;
}

/** 单文件解析结果（原 `oI` 返回值）。 */
export interface ParsedTranscript {
  firstTimestampMs: number | null;
  messages: NormalizedMessage[];
  rawContentSha256: string;
}

interface ParseBudget {
  remainingBytes: number;
  remainingMessages: number;
  discovery?: DiscoveryBudget;
}

/** 单文件预算化解析（原 `oI`）：超限抛 CoworkHistoryLimitError，不可读抛 ReadError。 */
async function parseTranscriptFile(
  path: string,
  budget: ParseBudget = { remainingBytes: SAFETY_LIMITS.sessionBytes, remainingMessages: SAFETY_LIMITS.sessionMessages },
): Promise<ParsedTranscript> {
  if (budget.remainingBytes <= 1) throw new CoworkHistoryLimitError();
  const maxBytes = Math.min(SAFETY_LIMITS.transcriptFileBytes, budget.remainingBytes - 1);
  const read =
    budget.discovery == null
      ? await readBoundedText(path, maxBytes)
      : await readBoundedWithBudget(path, maxBytes, budget.discovery, "transcriptBytes");
  budget.remainingBytes -= read.bytesRead;
  if (read.status === "too-large") throw new CoworkHistoryLimitError();
  if (read.status === "unreadable") throw new CoworkHistoryReadError();
  const text = read.text;
  const messages: NormalizedMessage[] = [];
  let firstTimestampMs: number | null = null;
  let sawFirstTimestamp = false;
  for (let cursor = 0; cursor < text.length; ) {
    const newline = text.indexOf("\n", cursor);
    const line = text.slice(cursor, newline < 0 ? text.length : newline);
    cursor = newline < 0 ? text.length : newline + 1;
    if (line.trim() === "") continue;
    const record = parseTranscriptLine(line);
    if (record == null || record.isMeta === true || record.isSidechain === true) continue;
    const message = normalizeMessage(record);
    if (message == null) continue;
    const timestampMs = normalizeTimestamp(record.timestamp ?? null);
    if (!sawFirstTimestamp) {
      firstTimestampMs = timestampMs;
      sawFirstTimestamp = true;
    }
    if (budget.remainingMessages === 0) throw new CoworkHistoryLimitError();
    --budget.remainingMessages;
    messages.push({ ...message, timestampMs });
  }
  return {
    firstTimestampMs,
    messages,
    rawContentSha256: createHash("sha256").update(text).digest("hex"),
  };
}

/** 多文件合并结果（原 `sI` 返回值，无原文指纹）。 */
export interface MergedTranscript {
  firstTimestampMs: number | null;
  messages: NormalizedMessage[];
}

/** 多文件解析共享预算（原 `$Pe`）：首个文件的结果作为合并基底。 */
async function parseTranscriptFiles(paths: string[]): Promise<MergedTranscript> {
  const budget = { remainingBytes: SAFETY_LIMITS.sessionBytes, remainingMessages: SAFETY_LIMITS.sessionMessages };
  const first = await parseTranscriptFile(paths[0], budget);
  const rest: ParsedTranscript[] = [];
  for (const path of paths.slice(1)) rest.push(await parseTranscriptFile(path, budget));
  return mergeTranscripts(first, rest);
}

/** 单行解析（原 `tFe`）：JSON.parse + loose schema 校验。 */
function parseTranscriptLine(line: string): Record<string, unknown> | null {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return null;
  }
  const result = (transcriptLineSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: Record<string, unknown> } }).safeParse(value);
  return result.success && result.data != null ? result.data : null;
}

/** 消息归一（原 `nFe`）：空文本且无图 → null；纯 tool_result 归 assistant。 */
function normalizeMessage(record: Record<string, unknown>): { images: string[]; role: "user" | "assistant"; text: string } | null {
  const role = normalizeMessageRole(record);
  if (role == null) return null;
  const content = normalizeContentBlocks(isPlainObject(record.message) ? (record.message as { content?: unknown }).content : record.content);
  if (content.text === "" && content.images.length === 0) return null;
  return {
    images: role === "user" ? content.images : [],
    role: role === "assistant" || content.onlyToolResult ? "assistant" : "user",
    text: content.text,
  };
}

/** 角色归一（原 `rFe`）：role 或 type 字段。 */
function normalizeMessageRole(record: Record<string, unknown>): "user" | "assistant" | null {
  const role = (record.role ?? record.type) as string | undefined;
  return role === "user" ? "user" : role === "assistant" ? "assistant" : null;
}

/** 内容块序列归一（原 `iFe`）：文本以空行连接，仅 tool_result 时标记 onlyToolResult。 */
function normalizeContentBlocks(content: unknown): { images: string[]; onlyToolResult: boolean; text: string } {
  if (typeof content === "string") return { images: [], onlyToolResult: false, text: content.trim() };
  if (!Array.isArray(content)) return { images: [], onlyToolResult: false, text: "" };
  const images: string[] = [];
  const textParts: string[] = [];
  let onlyToolResult = content.length > 0;
  for (const block of content) {
    const normalized = normalizeContentBlock(block);
    images.push(...normalized.images);
    if (!normalized.onlyToolResult) onlyToolResult = false;
    if (normalized.text !== "") textParts.push(normalized.text);
  }
  return { images, onlyToolResult, text: textParts.join("\n\n").trim() };
}

/** 单内容块归一（原 `aFe`）。 */
function normalizeContentBlock(block: unknown): { images: string[]; onlyToolResult: boolean; text: string } {
  if (typeof block === "string") return { images: [], onlyToolResult: false, text: block };
  if (!isPlainObject(block)) return { images: [], onlyToolResult: true, text: "" };
  const type = nonEmptyString(block.type);
  if (type === "text") return { images: [], onlyToolResult: false, text: nonEmptyString(block.text) ?? "" };
  if (type === "tool_use") return { images: [], onlyToolResult: false, text: formatToolUseBlock(block) };
  if (type === "tool_result") return { images: [], onlyToolResult: true, text: formatToolResultBlock(block) };
  if (type === "image") return normalizeImageBlock(block);
  if (type === "thinking") return { images: [], onlyToolResult: true, text: "" };
  if (type == null) return { images: [], onlyToolResult: false, text: nonEmptyString(block.text) ?? "" };
  return { images: [], onlyToolResult: false, text: `[external unsupported block: ${type}]` };
}

/** image 块（原 `oFe`/`sFe`）：base64 源 → data URL，其余降级为占位文本。 */
function normalizeImageBlock(block: Record<string, unknown>): { images: string[]; onlyToolResult: boolean; text: string } {
  const source = isPlainObject(block.source) ? block.source : null;
  const type = source == null ? null : nonEmptyString(source.type);
  const mediaType = source == null ? null : nonEmptyString(source.media_type);
  const data = source == null ? null : nonEmptyString(source.data);
  return type !== "base64" || mediaType == null || !mediaType.toLowerCase().startsWith("image/") || data == null
    ? { images: [], onlyToolResult: false, text: "[external unsupported block: image]" }
    : { images: [`data:${normalizeImageMediaType(mediaType)};base64,${data}`], onlyToolResult: false, text: "" };
}

function normalizeImageMediaType(mediaType: string): string {
  const bare = mediaType.toLowerCase().split(";")[0]?.trim() ?? "";
  return bare.startsWith("image/") ? bare : "image/png";
}

/** tool_use 块（原 `cFe`）：description/command/file 提取，其余 JSON 截断。 */
function formatToolUseBlock(block: Record<string, unknown>): string {
  const lines = [`[${EXTERNAL_TOOL_CALL}: ${nonEmptyString(block.name) ?? "unknown"}]`];
  const input = block.input;
  if (isPlainObject(input)) {
    const description = nonEmptyString(input.description);
    if (description != null) lines.push(`description: ${description}`);
    const command = nonEmptyString(input.command);
    if (command != null) lines.push(`command: ${command}`);
    const file = nonEmptyString(input.file_path ?? input.file);
    if (file != null) lines.push(`file: ${file}`);
    if (lines.length === 1) lines.push(`input: ${truncateForTranscript(stringifyForTranscript(input), TOOL_USE_TEXT_LIMIT)}`);
  } else if (input != null) {
    lines.push(`input: ${truncateForTranscript(stringifyForTranscript(input), TOOL_USE_TEXT_LIMIT)}`);
  }
  lines.push(`[/${EXTERNAL_TOOL_CALL}]`);
  return lines.join("\n");
}

/** tool_result 块（原 `lFe`/`uFe`/`uI`）：嵌套文本块展平。 */
function formatToolResultBlock(block: Record<string, unknown>): string {
  const header = block.is_error === true ? `[${EXTERNAL_TOOL_RESULT}: error]` : `[${EXTERNAL_TOOL_RESULT}]`;
  const content = toolResultText(block.content);
  return content === ""
    ? `${header}\n[/${EXTERNAL_TOOL_RESULT}]`
    : `${header}\n${truncateForTranscript(content, TOOL_RESULT_TEXT_LIMIT)}\n[/${EXTERNAL_TOOL_RESULT}]`;
}

function toolResultText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return collectNestedText(content).join("\n");
  return "";
}

function collectNestedText(blocks: unknown[]): string[] {
  return blocks
    .flatMap((block) => {
      if (typeof block === "string") return [block];
      if (!isPlainObject(block)) return [];
      const text = nonEmptyString(block.text);
      return [...(text == null ? [] : [text]), ...(Array.isArray(block.content) ? collectNestedText(block.content) : [])];
    })
    .filter((text) => text !== "");
}

function stringifyForTranscript(value: unknown): string {
  const json = JSON.stringify(value);
  return typeof json === "string" ? json : String(value);
}

function truncateForTranscript(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

// ---------------------------------------------------------------------------
// 跨文件合并（原 `sI`/`eFe`/`cI`/`lI`）
// ---------------------------------------------------------------------------

interface MergeNode {
  incomingMessageCount: number;
  message: NormalizedMessage;
  nextMessages: Set<MergeNode>;
  order: number;
  sortTimestampMs: number;
}

/** 多 transcript 合并（原 `sI`）：内容键去重 + 拓扑排序（缺时间戳的消息依赖前驱）。 */
function mergeTranscripts(first: ParsedTranscript, rest: ParsedTranscript[]): MergedTranscript {
  if (rest.length === 0) return first;
  const nodes = new Map<string, MergeNode>();
  for (const transcript of [first, ...rest]) {
    const seenInFile = new Map<string, number>();
    let previous: MergeNode | null = null;
    let previousTimestampMs: number | null = null;
    const nextTimestampAfter: Array<number | null> = new Array(transcript.messages.length);
    let upcoming: number | null = null;
    for (let index = transcript.messages.length - 1; index >= 0; index--) {
      nextTimestampAfter[index] = upcoming;
      if (transcript.messages[index].timestampMs != null) upcoming = transcript.messages[index].timestampMs;
    }
    for (const [index, message] of transcript.messages.entries()) {
      const contentKey = messageContentKey(message);
      const occurrence = seenInFile.get(contentKey) ?? 0;
      seenInFile.set(contentKey, occurrence + 1);
      const nodeKey = `${contentKey}:${occurrence}`;
      const sortTimestampMs = message.timestampMs ?? previousTimestampMs ?? nextTimestampAfter[index] ?? Number.MAX_SAFE_INTEGER;
      let node = nodes.get(nodeKey);
      if (node == null) {
        node = { incomingMessageCount: 0, message, nextMessages: new Set(), order: nodes.size, sortTimestampMs };
        nodes.set(nodeKey, node);
      } else {
        node.sortTimestampMs = Math.min(node.sortTimestampMs, sortTimestampMs);
      }
      if (
        previous != null &&
        (previous.message.timestampMs == null || message.timestampMs == null) &&
        !previous.nextMessages.has(node)
      ) {
        previous.nextMessages.add(node);
        node.incomingMessageCount += 1;
      }
      previous = node;
      if (message.timestampMs != null) previousTimestampMs = message.timestampMs;
    }
  }
  const ready = [...nodes.values()].filter((node) => node.incomingMessageCount === 0);
  const ordered: MergeNode[] = [];
  while (ready.length > 0) {
    const node = ready.reduce((best, candidate) => (compareMergeNodes(candidate, best) < 0 ? candidate : best));
    ready.splice(ready.indexOf(node), 1);
    ordered.push(node);
    for (const next of node.nextMessages) {
      --next.incomingMessageCount;
      if (next.incomingMessageCount === 0) ready.push(next);
    }
  }
  const orderedSet = new Set(ordered);
  const messages = [
    ...ordered,
    ...[...nodes.values()].filter((node) => !orderedSet.has(node)).sort(compareMergeNodes),
  ].map((node) => node.message);
  return { firstTimestampMs: messages[0]?.timestampMs ?? null, messages };
}

/** 合并后内容指纹（原 `eFe`）。 */
function mergedContentSha256(transcript: { messages: NormalizedMessage[] }): string {
  const hash = createHash("sha256").update("[");
  for (const [index, message] of transcript.messages.entries()) {
    if (index > 0) hash.update(",");
    hash.update(messageContentKey(message));
  }
  return hash.update("]").digest("hex");
}

function messageContentKey(message: NormalizedMessage): string {
  return JSON.stringify([message.timestampMs, message.role, message.text, message.images]);
}

function compareMergeNodes(a: MergeNode, b: MergeNode): number {
  return a.sortTimestampMs - b.sortTimestampMs || a.order - b.order;
}

// ---------------------------------------------------------------------------
// rollout 编码（原 `pI`/`fFe`/`mFe`/`hFe`/`gFe`/`_Fe`/`mI`/`vFe`/`hI`/`gI`/`dFe`）
// ---------------------------------------------------------------------------

interface RolloutItem {
  payload: Record<string, unknown>;
  type: "event_msg" | "response_item";
}

interface RolloutTurn {
  lastAgentMessage: string | null;
  turnId: string;
}

interface RolloutState {
  currentTurn: RolloutTurn | null;
  firstTimestampMs: number | null;
  items: RolloutItem[];
  lastAssistantAgentMessagePayload: ({ message: string } & Record<string, unknown>) | null;
  lastAssistantResponseItem: ({ content: Array<{ text?: string } & Record<string, unknown>> } & Record<string, unknown>) | null;
  lastAssistantResponseItemCount: number;
  lastMessageTimestampMs: number | null;
  responseItems: Array<Record<string, unknown>>;
  userTurnCount: number;
}

/** rollout 编码（原 `fFe`）：解析合并 → 逐消息编码 → staged 清单注入 → 收尾。 */
async function encodeRolloutItems(
  paths: string[],
  options: { stagedGeneratedFiles?: ImportFileResult[] } = {},
): Promise<{ firstTimestampMs: number | null; items: RolloutItem[] }> {
  const transcript = await parseTranscriptFiles(paths);
  const state = createRolloutState();
  state.firstTimestampMs = transcript.firstTimestampMs;
  for (const message of transcript.messages) {
    state.lastMessageTimestampMs = message.timestampMs;
    appendRolloutMessage({ images: message.images, role: message.role, state, text: message.text, timestampMs: message.timestampMs });
  }
  appendStagedFileList(state, options.stagedGeneratedFiles ?? []);
  finalizeRollout(state);
  return { firstTimestampMs: state.firstTimestampMs, items: state.items };
}

function createRolloutState(): RolloutState {
  return {
    currentTurn: null,
    firstTimestampMs: null,
    items: [],
    lastAssistantAgentMessagePayload: null,
    lastAssistantResponseItem: null,
    lastAssistantResponseItemCount: 0,
    lastMessageTimestampMs: null,
    responseItems: [],
    userTurnCount: 0,
  };
}

/** 单条消息 → rollout items（原 `hFe`）：user 开新 turn，assistant 归当前 turn。 */
function appendRolloutMessage({
  images,
  role,
  state,
  text,
  timestampMs,
}: {
  images: string[];
  role: "user" | "assistant";
  state: RolloutState;
  text: string;
  timestampMs: number | null;
}): void {
  if (role === "user") {
    if (state.currentTurn != null) state.items.push(taskCompleteItem(state.currentTurn, null));
    state.userTurnCount += 1;
    const turnId = `external-import-turn-${state.userTurnCount}`;
    const startedAtSeconds = toRolloutSeconds(timestampMs);
    state.items.push({
      payload: {
        collaboration_mode_kind: "default",
        model_context_window: null,
        started_at: startedAtSeconds ?? undefined,
        turn_id: turnId,
        type: "task_started",
      },
      type: "event_msg",
    });
    const responseItem = messageResponseItem({ role, text });
    state.responseItems.push(responseItem);
    state.items.push({ payload: responseItem, type: "response_item" });
    state.items.push({
      payload: {
        ...(images.length === 0 ? {} : { images }),
        local_images: [],
        message: text,
        text_elements: [],
        type: "user_message",
      },
      type: "event_msg",
    });
    state.currentTurn = { lastAgentMessage: null, turnId };
    return;
  }
  if (state.currentTurn == null) return;
  const responseItem = messageResponseItem({ role, text });
  state.responseItems.push(responseItem);
  state.lastAssistantResponseItem = responseItem as RolloutState["lastAssistantResponseItem"];
  state.lastAssistantResponseItemCount = state.responseItems.length;
  state.items.push({ payload: responseItem, type: "response_item" });
  const agentMessage = { memory_citation: null, message: text, phase: null, type: "agent_message" };
  state.items.push({ payload: agentMessage, type: "event_msg" });
  state.lastAssistantAgentMessagePayload = agentMessage;
  state.currentTurn.lastAgentMessage = text;
}

/** staged 生成文件清单（原 `gFe`）：追加到最后一条 agent 消息。 */
function appendStagedFileList(state: RolloutState, stagedGeneratedFiles: ImportFileResult[]): void {
  const list = formatImportedFileListForRollout(stagedGeneratedFiles);
  if (list == null || state.currentTurn == null || state.lastAssistantAgentMessagePayload == null || state.lastAssistantResponseItem == null) return;
  const message = `${(state.lastAssistantAgentMessagePayload.message as string).trimEnd()}\n\n${list}`;
  state.lastAssistantAgentMessagePayload.message = message;
  const firstContent = state.lastAssistantResponseItem.content[0];
  if (firstContent != null) firstContent.text = message;
  state.currentTurn.lastAgentMessage = message;
}

/** 收尾（原 `_Fe`）：token_count + 最后一个 turn 的 task_complete。 */
function finalizeRollout(state: RolloutState): void {
  if (state.currentTurn == null) return;
  state.items.push(tokenCountItem(state.responseItems.slice(0, state.lastAssistantResponseItemCount)));
  state.items.push(taskCompleteItem(state.currentTurn, state.lastMessageTimestampMs));
}

/** response_item 消息（原 `mI`）：assistant → output_text，user → input_text。 */
function messageResponseItem({ role, text }: { role: string; text: string }): Record<string, unknown> {
  return {
    content: [role === "assistant" ? { text, type: "output_text" } : { text, type: "input_text" }],
    role,
    type: "message",
  };
}

/** token_count 事件（原 `vFe`/`yFe`）：估算 = JSON 长度 / 4。 */
function tokenCountItem(responseItems: Array<Record<string, unknown>>): RolloutItem {
  const usage = {
    cached_input_tokens: 0,
    input_tokens: 0,
    output_tokens: 0,
    reasoning_output_tokens: 0,
    total_tokens: responseItems.map(estimatedTokens).reduce((sum, count) => sum + count, 0),
  };
  return {
    payload: {
      info: { last_token_usage: usage, model_context_window: null, total_token_usage: usage },
      rate_limits: null,
      type: "token_count",
    },
    type: "event_msg",
  };
}

function estimatedTokens(item: Record<string, unknown>): number {
  return Math.ceil(JSON.stringify(item).length / 4);
}

/** task_complete 事件（原 `hI`）。 */
function taskCompleteItem(turn: RolloutTurn, timestampMs: number | null): RolloutItem {
  return {
    payload: {
      completed_at: toRolloutSeconds(timestampMs) ?? undefined,
      last_agent_message: turn.lastAgentMessage,
      turn_id: turn.turnId,
      type: "task_complete",
    },
    type: "event_msg",
  };
}

/** 毫秒 → rollout 秒（原 `gI`）。 */
function toRolloutSeconds(timestampMs: number | null): number | null {
  return timestampMs == null ? null : Math.floor(timestampMs / 1e3);
}

/** staged 清单格式化（原 `JPe`，等价 discovery.formatImportedFileList）。 */
function formatImportedFileListForRollout(results: ImportFileResult[]): string | null {
  const deduped: ImportFileResult[] = [];
  const seen = new Set<string>();
  for (const result of results) {
    const key = `${result.kind}\u001f${result.targetPath}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(result);
    }
  }
  const outputs = deduped.filter((result) => result.kind === "output");
  const artifacts = deduped.filter((result) => result.kind === "artifact");
  if (outputs.length === 0 && artifacts.length === 0) return null;
  const formatEntry = (result: ImportFileResult) => `- [${escapeRolloutLabel(result.label)}](<${result.targetPath}>)`;
  return [
    ...(outputs.length === 0 ? [] : ["Imported Cowork generated files:", ...outputs.map(formatEntry)]),
    ...(artifacts.length === 0 ? [] : [...(outputs.length === 0 ? [] : [""]), "Imported Cowork live artifacts:", ...artifacts.map(formatEntry)]),
  ].join("\n");
}

function escapeRolloutLabel(label: string): string {
  return label.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]");
}

/** rollout 写盘（原 `pI`）：claude-cowork-transcript-imports/<uuid>/rollout-<uuid>.jsonl。 */
export async function prepareRollout({
  candidate,
  codexHome,
  cwd,
  projectlessOutputDirectory,
  projectlessWorkspaceRoot,
  stagedGeneratedFiles,
}: {
  candidate: TranscriptCandidate;
  codexHome: string;
  cwd: string;
  projectlessOutputDirectory: string | null;
  projectlessWorkspaceRoot: string | null;
  stagedGeneratedFiles: ImportFileResult[];
}): Promise<PreparedRollout | null> {
  const sourceThreadId = randomUUID();
  const rolloutRoot = join(codexHome, "claude-cowork-transcript-imports", sourceThreadId);
  const encoded = await encodeRolloutItems(candidate.sourceJsonlPaths, { stagedGeneratedFiles });
  if (encoded.items.length === 0) return null;
  const timestamp = rolloutTimestamp({ firstTimestampMs: encoded.firstTimestampMs, lastActivityAtMs: candidate.lastActivityAtMs });
  const rolloutPath = join(rolloutRoot, `rollout-${sourceThreadId}.jsonl`);
  const lines: Array<Record<string, unknown>> = [
    {
      payload: {
        agent_nickname: null,
        agent_path: null,
        agent_role: null,
        base_instructions:
          candidate.workspaceKind === "projectless"
            ? projectlessBaseInstructions({ cwd, outputDirectory: projectlessOutputDirectory ?? cwd })
            : null,
        cli_version: "0.0.0",
        cwd,
        dynamic_tools: null,
        id: sourceThreadId,
        memory_mode: null,
        model_provider: null,
        originator: "Codex Desktop",
        source: "vscode",
        timestamp,
      },
      timestamp,
      type: "session_meta",
    },
    ...encoded.items.map((item) => ({ payload: item.payload, timestamp, type: item.type })),
  ];
  await mkdir(rolloutRoot, { recursive: true });
  await writeFile(rolloutPath, `${lines.map((line) => JSON.stringify(line)).join("\n")}\n`, "utf8");
  return {
    contentSha256: candidate.contentSha256,
    cwd,
    lastActivityAtMs: candidate.lastActivityAtMs,
    projectlessOutputDirectory,
    projectlessWorkspaceRoot,
    projectRoot: candidate.projectRoot,
    remoteMcpServerNames: candidate.remoteMcpServerNames,
    rolloutPath,
    rolloutRoot,
    sourceId: candidate.sourceId,
    sourceJsonlPath: candidate.sourceJsonlPath,
    sourceThreadId,
    title: candidate.title,
    workspaceKind: candidate.workspaceKind,
  };
}

/** rollout 时间戳（原 `pFe`）。 */
function rolloutTimestamp({ firstTimestampMs, lastActivityAtMs }: { firstTimestampMs: number | null; lastActivityAtMs: number | null }): string {
  return new Date(firstTimestampMs ?? lastActivityAtMs ?? 0).toISOString();
}

/** projectless 基础指令（原 `dFe`）：output 与 cwd 分离时区分 work/ 与交付目录。 */
function projectlessBaseInstructions({ cwd, outputDirectory }: { cwd: string; outputDirectory: string }): { text: string } {
  return {
    text: [
      "### Projectless Chat",
      "This projectless thread starts in a generated directory under the user's Documents/Codex folder.",
      "Prefer answering inline in chat unless using local files would make the result more useful.",
      ...(outputDirectory === cwd
        ? [
            `When using local files for this projectless thread, write scratch files, drafts, generated assets, and other outputs under ${outputDirectory}. Do not write directly in the home directory unless the user explicitly asks.`,
          ]
        : [
            "Use work/ for intermediate files, scratch analysis, scripts, drafts, and temporary assets.",
            `Use ${outputDirectory} only for user-facing deliverables that should appear as outputs.`,
            `When referring to saved deliverables in the final response, link only files from ${outputDirectory}. Do not write directly in the home directory unless the user explicitly asks.`,
          ]),
    ].join("\n"),
  };
}

// ---------------------------------------------------------------------------
// 会话候选与匹配（原 `bFe`/`xFe`/`SFe`/`CFe`）
// ---------------------------------------------------------------------------

type SessionManifestWithTranscript = SessionManifest & {
  contentSha256: string;
  rawTranscriptPath: string;
  rawTranscriptPaths: string[];
};

/** 会话 transcript 解析结果（原 `wFe` 返回值）。 */
type SessionTranscriptResolution =
  | { status: "resolved"; manifest: SessionManifestWithTranscript }
  | { status: "skipped"; manifest: SessionManifest; reason: SkippedSession["reason"] };

/** 会话候选构建（原 `bFe`）：project 取 sourceRoot，projectless 取导入根目录。 */
function buildTranscriptCandidate(manifest: SessionManifestWithTranscript, space: CoworkProject | ProjectlessSpace): TranscriptCandidate {
  const isProject = "sourceRoot" in space;
  return {
    accountOrgDir: space.accountOrgDir,
    accountOrgDirs: space.accountOrgDirs,
    contentSha256: manifest.contentSha256,
    detectedFiles: manifest.detectedFiles,
    documentsDir: space.documentsDir,
    lastActivityAtMs: manifest.lastActivityAtMs,
    projectRoot: isProject ? space.sourceRoot : space.projectlessImportRoot,
    remoteMcpServerNames: manifest.remoteMcpServerNames,
    sessionStorageDirs: manifest.storageDirs,
    sourceId: manifest.sessionId,
    sourceJsonlPath: manifest.rawTranscriptPath,
    sourceJsonlPaths: manifest.rawTranscriptPaths,
    title: isProject ? manifest.title : (manifest.title ?? space.name),
    workspaceKind: isProject ? "project" : "projectless",
  };
}

/** 会话↔项目匹配（原 `xFe`）：spaceId 相同或 cwd/所选目录在项目内。 */
function manifestMatchesProject(manifest: SessionManifest, project: CoworkProject): boolean {
  return manifest.spaceId === project.spaceId || (manifest.cwd != null && isPathInsideDir(project.sourceRoot, manifest.cwd))
    ? true
    : manifest.userSelectedFolders.some((folder) => isPathInsideDir(project.sourceRoot, folder));
}

/** 会话↔projectless 空间匹配（原 `SFe`/`CFe`）。 */
function manifestMatchesProjectlessSpace(manifest: SessionManifest, space: ProjectlessSpace): boolean {
  return (
    (space.spaceId == null ? manifest.spaceId == null : manifest.spaceId === space.spaceId) &&
    isProjectlessManifestCwd(manifest) &&
    manifest.userSelectedFolders.length === 0
  );
}

/** projectless 会话的 cwd 判定（原 `CFe`）：空/存储目录内/会话目录形态。 */
function isProjectlessManifestCwd(manifest: SessionManifest): boolean {
  if (manifest.cwd == null || manifest.cwd === "") return true;
  const normalized = posix.normalize(manifest.cwd);
  if (
    manifest.storageDirs.some((dir) => isPathInsideDir(dir, manifest.cwd ?? "")) ||
    normalized === "/sessions" ||
    normalized.startsWith("/sessions/")
  ) {
    return true;
  }
  const pathPlatform = win32.isAbsolute(manifest.cwd) ? win32 : posix;
  const segments = pathPlatform.normalize(manifest.cwd).split(pathPlatform.sep);
  const sessionsIndex = segments.findIndex((segment) => segment.toLowerCase() === "local-agent-mode-sessions");
  return sessionsIndex >= 0 && segments.lastIndexOf(manifest.sessionId) > sessionsIndex;
}

function isPathInsideDir(parent: string, child: string): boolean {
  const rel = posix.relative(parent, child);
  return rel !== "" && !rel.startsWith("..") && !posix.isAbsolute(rel);
}

// ---------------------------------------------------------------------------
// transcript 发现与解析（原 `wFe`/`EFe`）
// ---------------------------------------------------------------------------

/** 会话 transcript 解析（原 `wFe`）：发现 → 预算化解析 → 合并指纹。 */
async function resolveSessionTranscripts(
  manifest: SessionManifest,
  budget: DiscoveryBudget | undefined,
  selectedSessionPaths: string[] | undefined,
): Promise<SessionTranscriptResolution> {
  let paths: string[];
  const parsed: Array<{ rawTranscriptPath: string; transcript: ParsedTranscript }> = [];
  try {
    if (budget != null && !consumeBudget(budget, "sessionAttempts")) throw new CoworkHistoryLimitError();
    paths = await findTranscriptPaths(manifest.storageDirs, manifest.cliSessionIds, budget ?? createDiscoveryBudget());
    if (selectedSessionPaths != null && !paths.some((path) => selectedSessionPaths.some((selected) => pathsEqual(selected, path)))) paths = [];
    const parseBudget: ParseBudget = {
      remainingBytes: SAFETY_LIMITS.sessionBytes,
      remainingMessages: SAFETY_LIMITS.sessionMessages,
      discovery: budget,
    };
    for (const path of paths) {
      const transcript = await parseTranscriptFile(path, parseBudget);
      parsed.push({ rawTranscriptPath: path, transcript });
    }
  } catch (error) {
    if (error instanceof CoworkHistoryLimitError) {
      if (budget != null) budget.deferred = true;
      if (selectedSessionPaths != null) throw error;
      return { status: "skipped", manifest, reason: "history-limit" };
    }
    if (!(error instanceof CoworkHistoryReadError) || selectedSessionPaths != null) throw error;
    paths = [];
  }
  if (paths.length === 0) {
    if (selectedSessionPaths != null) throw new CoworkHistoryReadError();
    return { status: "skipped", manifest, reason: "missing-transcript" };
  }
  const [primary, ...rest] = parsed.filter(({ transcript }) => transcript.messages.some((message) => message.role === "user"));
  if (primary != null) {
    const contentSha256 = mergedContentSha256(mergeTranscripts(primary.transcript, rest.map(({ transcript }) => transcript)));
    return {
      status: "resolved",
      manifest: {
        ...manifest,
        contentSha256,
        rawTranscriptPath: primary.rawTranscriptPath,
        rawTranscriptPaths: [primary.rawTranscriptPath, ...rest.map(({ rawTranscriptPath }) => rawTranscriptPath)],
      },
    };
  }
  return { status: "skipped", manifest, reason: "no-importable-turns" };
}

/** transcript 文件发现（原 `EFe`）：storageDirs/.claude/transcripts|projects 递归，audit.jsonl 兜底。 */
async function findTranscriptPaths(storageDirs: string[], cliSessionIds: string[], budget: DiscoveryBudget): Promise<string[]> {
  const found: string[] = [];
  const wantedNames = new Set(cliSessionIds.map((id) => `${id}.jsonl`));
  const walk = async (directory: string): Promise<void> => {
    const handle = await opendir(directory).catch(() => null);
    if (handle == null) return;
    const entries: Dirent[] = [];
    for await (const entry of handle) {
      if (!consumeBudget(budget, "directoryEntries")) throw new CoworkHistoryLimitError();
      if (entry.isDirectory() || (entry.isFile() && wantedNames.has(entry.name))) entries.push(entry);
    }
    for (const entry of entries) {
      const entryPath = join(directory, entry.name);
      if (entry.isDirectory()) await walk(entryPath);
      else found.push(entryPath);
    }
  };
  if (wantedNames.size > 0) {
    for (const dir of storageDirs) {
      for (const sub of ["transcripts", "projects"]) await walk(join(dir, ".claude", sub));
    }
  }
  const matched = [...new Set(cliSessionIds.flatMap((id) => found.filter((path) => basename(path) === `${id}.jsonl`)))];
  if (matched.length > 0) return matched;
  const auditPaths: string[] = [];
  for (const dir of storageDirs) {
    if (!consumeBudget(budget, "directoryEntries")) throw new CoworkHistoryLimitError();
    const auditPath = join(dir, "audit.jsonl");
    if (await isFile(auditPath)) auditPaths.push(auditPath);
  }
  return auditPaths;
}

// ---------------------------------------------------------------------------
// 导入选择（原 `_I` 及其辅助）
// ---------------------------------------------------------------------------

function selectionLimits(limits: ImportLimits | undefined) {
  return {
    maxSessionAgeMs: limits?.maxSessionAgeMs ?? 2_592e6,
    maxSessions: Math.min(limits?.maxSessions ?? 50, 50),
    nowMs: limits?.nowMs ?? Date.now(),
  };
}

/** items 的项目 cwd 列表（原 `vI`/`TF`）。 */
function itemCwds(items: MigrationItem[]): string[] {
  return [
    ...new Set(
      items.flatMap((item) => [
        ...(item.cwd == null || item.cwd === "" ? [] : [item.cwd]),
        ...(item.details?.sessions ?? []).filter((session) => session.workspaceKind !== "projectless").map((session) => session.cwd),
      ]),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

/** 账号级配置项（原 `wI`）：无 cwd 的 CONFIG 项。 */
function isAccountConfigItem(item: MigrationItem): boolean {
  return (item.cwd == null || item.cwd === "") && item.itemType === "CONFIG";
}

function hasAccountConfigItem(items: MigrationItem[]): boolean {
  return items.some(isAccountConfigItem);
}

function hasPluginItems(items: MigrationItem[]): boolean {
  return items.some((item) => item.itemType === "PLUGINS");
}

function hasAnySessionItems(items: MigrationItem[]): boolean {
  return items.some((item) => item.itemType === "SESSIONS");
}

function hasProjectlessSessionItems(items: MigrationItem[]): boolean {
  return items.some(
    (item) => item.itemType === "SESSIONS" && (item.details?.sessions ?? []).some((session) => session.workspaceKind === "projectless"),
  );
}

/** 选中会话路径（原 `TI`）：items 为 null → undefined（不限制）。 */
function selectedSessionPathsFor(items: MigrationItem[] | undefined, kind: "project" | "projectless", root: string): string[] | undefined {
  if (items == null) return undefined;
  return items.flatMap((item) =>
    (item.details?.sessions ?? [])
      .filter(
        (session) =>
          (kind == null ||
            (kind === "project" ? session.workspaceKind !== "projectless" : session.workspaceKind === "projectless")) &&
          (root == null || pathsEqual(session.cwd, root)),
      )
      .map((session) => session.path),
  );
}

/** 全部选中会话路径（原 PFe 中的 `TI(n)` 无过滤调用）。 */
function allSelectedSessionPaths(items: MigrationItem[] | undefined): string[] | undefined {
  return selectedSessionPathsFor(items, null as unknown as "project" | "projectless", null as unknown as string);
}

/** 项目导入类型（原 `xI`）：items 显式指定或 include + 账本推导。 */
function projectItemTypes({
  importHistory,
  include,
  items,
  project,
}: {
  importHistory: CoworkImportHistory | undefined;
  include: ImportInclude | undefined;
  items: MigrationItem[] | undefined;
  project: CoworkProject;
}): Set<string> {
  if (items != null) {
    const types = new Set(
      items
        .filter((item) => item.cwd != null && item.cwd !== "" && pathsEqual(item.cwd, project.sourceRoot))
        .map((item) => item.itemType),
    );
    if (
      items.some(
        (item) =>
          item.itemType === "SESSIONS" &&
          (item.details?.sessions ?? []).some(
            (session) => session.workspaceKind !== "projectless" && pathsEqual(session.cwd, project.sourceRoot),
          ),
      )
    )
      types.add("SESSIONS");
    return types;
  }
  const types: string[] = [];
  const alreadyImported = importHistory != null && hasImportedProject(importHistory, { importedAtMs: 0, sourceRoot: project.sourceRoot, spaceId: project.spaceId });
  if (include?.agents && !alreadyImported) types.push("AGENTS_MD");
  if (include?.sessions) types.push("SESSIONS");
  return new Set(types);
}

/** 项目账号配置选择（原 `SI`）。 */
function projectAccountSetupSelected({
  importHistory,
  include,
  items,
  project,
}: {
  importHistory: CoworkImportHistory | undefined;
  include: ImportInclude | undefined;
  items: MigrationItem[] | undefined;
  project: CoworkProject;
}): boolean {
  return items == null
    ? !!include?.config && (importHistory == null || !hasImportedAccountSetupItem(importHistory, { accountOrgDir: project.accountOrgDir, importedAtMs: 0, itemType: "CONFIG" }))
    : items.some(
        (item) => isAccountConfigItem(item) && item.sourcePath != null && item.sourcePath !== "" && pathsEqual(item.sourcePath, project.accountOrgDir),
      );
}

/** 项目插件选择（原 `OFe`）。 */
function projectPluginSetupSelected({
  importHistory,
  include,
  items,
  project,
}: {
  importHistory: CoworkImportHistory | undefined;
  include: ImportInclude | undefined;
  items: MigrationItem[] | undefined;
  project: CoworkProject;
}): boolean {
  return items == null
    ? !!include?.config && (importHistory == null || !hasImportedAccountSetupItem(importHistory, { accountOrgDir: project.accountOrgDir, importedAtMs: 0, itemType: "PLUGINS" }))
    : items.some(
        (item) =>
          item.itemType === "PLUGINS" &&
          item.sourcePath != null &&
          item.sourcePath !== "" &&
          pathsEqual(item.sourcePath, project.accountOrgDir),
      );
}

/** 是否记录项目导入（原 `MFe`）：显式 items 含 AGENTS_MD。 */
function shouldRecordProject(items: MigrationItem[], project: CoworkProject): boolean {
  return projectItemTypes({ importHistory: undefined, include: undefined, items, project }).has("AGENTS_MD");
}

/** projectless 空间集合是否纳入（原 `AFe`）。 */
function includesProjectlessSetup({ include, items }: { include: ImportInclude | undefined; items: MigrationItem[] | undefined }): boolean {
  return items == null
    ? !!include?.config || !!include?.sessions
    : hasAccountConfigItem(items) || hasPluginItems(items) || hasProjectlessSessionItems(items);
}

/** projectless 空间选择（原 `kFe`）。 */
function selectProjectlessSpaces({
  detection,
  importHistory,
  include,
  items,
}: {
  detection: ConfigSurfacesResult;
  importHistory: CoworkImportHistory | undefined;
  include: ImportInclude | undefined;
  items: MigrationItem[] | undefined;
}): ProjectlessSpaceSelection[] {
  if (!includesProjectlessSetup({ include, items })) return [];
  return detection.projectlessSpaces.map((space) => {
    const asProject = projectlessAsProject(space);
    const accountSetupSelected =
      !detection.projects.some((project) => pathsEqual(project.accountOrgDir, space.accountOrgDir)) &&
      projectAccountSetupSelected({ importHistory, include, items, project: asProject });
    const pluginSetupSelected = projectPluginSetupSelected({ importHistory, include, items, project: asProject });
    return {
      accountSetupSelected,
      configSurfaces: accountSetupSelected ? (detection.configSurfacesByProjectRoot.get(space.projectlessImportRoot) ?? []) : [],
      pluginCandidates: pluginSetupSelected ? (detection.pluginCandidatesByProjectlessSpaceRoot.get(space.projectlessImportRoot) ?? []) : [],
      pluginSetupSelected,
      projectlessSpace: space,
      skippedSessions: [],
      transcriptCandidates: [],
    };
  });
}

/** 会话存储目录与选中路径重叠（原 `jFe`）。 */
function manifestStorageOverlapsSelected(manifest: SessionManifest, selectedSessionPaths: string[] | undefined): boolean {
  return selectedSessionPaths == null || selectedSessionPaths.some((selected) => manifest.storageDirs.some((dir) => isPathInsideDir(dir, selected)));
}

/** 已导入判定（原 `TFe`）：projectRoot + sessionId 命中账本。 */
function isAlreadyImported(importHistory: CoworkImportHistory, projectRoot: string, session: { sessionId: string }): boolean {
  return importHistory.records.some((record) => pathsEqual(record.projectRoot, projectRoot) && record.sourceId === session.sessionId);
}

type ImportRoute =
  | { kind: "project"; selectedSessionPaths: string[] | undefined; target: ProjectImportSelection }
  | { kind: "projectless"; selectedSessionPaths: string[] | undefined; target: ProjectlessSpaceSelection };

/** 导入选择（原 `_I`）：项目/空间选择 + 会话去重、限额、年龄与账本过滤。 */
export async function selectImportSessions({
  detection,
  importHistory,
  include,
  items,
  limits,
}: {
  detection: ConfigSurfacesResult;
  importHistory: CoworkImportHistory | undefined;
  include?: ImportInclude;
  items?: MigrationItem[];
  limits?: ImportLimits;
}): Promise<ImportSelection> {
  const effectiveInclude: ImportInclude = include ?? { agents: true, config: true, sessions: true };
  const { maxSessionAgeMs, maxSessions, nowMs } = selectionLimits(limits);
  const projects: ProjectImportSelection[] = detection.projects.flatMap((project) => {
    const itemTypes = projectItemTypes({ importHistory, include: effectiveInclude, items, project });
    const accountSetupSelected = projectAccountSetupSelected({ importHistory, include: effectiveInclude, items, project });
    return itemTypes.size === 0 && !accountSetupSelected
      ? []
      : [
          {
            accountSetupSelected,
            configSurfaces: accountSetupSelected ? (detection.configSurfacesByProjectRoot.get(project.sourceRoot) ?? []) : [],
            itemTypes,
            pluginCandidates: [],
            pluginSetupSelected: false,
            project,
            scheduledTasks: accountSetupSelected ? (detection.scheduledTasksByProjectRoot.get(project.sourceRoot) ?? []) : [],
            shouldRecordProjectImport: items != null && shouldRecordProject(items, project),
            skippedSessions: [],
            transcriptCandidates: [],
            warnings: [...detection.warnings],
          },
        ];
  });
  const projectlessSpaces = selectProjectlessSpaces({ detection, importHistory, include: effectiveInclude, items });
  const routesBySession = new Map<
    string,
    { routes: ImportRoute[]; session: SessionManifest }
  >();
  const routeList = [
    ...projects
      .filter((selection) => selection.itemTypes.has("SESSIONS"))
      .map((selection) => ({ kind: "project" as const, target: selection })),
    ...(items != null || effectiveInclude.sessions
      ? projectlessSpaces.map((selection) => ({ kind: "projectless" as const, target: selection }))
      : []),
  ];
  for (const route of routeList) {
    const space = route.kind === "project" ? route.target.project : route.target.projectlessSpace;
    const root = route.kind === "project" ? route.target.project.sourceRoot : route.target.projectlessSpace.projectlessImportRoot;
    const selectedSessionPaths = selectedSessionPathsFor(items, route.kind, root);
    const manifests =
      (route.kind === "project" ? detection.sessionManifestsByProjectRoot : detection.sessionManifestsByProjectlessSpaceRoot).get(root) ??
      [];
    for (const manifest of manifests) {
      if (
        !(route.kind === "project"
          ? manifestMatchesProject(manifest, route.target.project)
          : manifestMatchesProjectlessSpace(manifest, route.target.projectlessSpace)) ||
        !manifestStorageOverlapsSelected(manifest, selectedSessionPaths)
      )
        continue;
      const key = JSON.stringify([space.accountOrgDir, manifest.sessionId]);
      const entry = routesBySession.get(key);
      if (entry == null) routesBySession.set(key, { routes: [{ ...route, selectedSessionPaths }], session: manifest });
      else entry.routes.push({ ...route, selectedSessionPaths });
    }
  }
  const sessions = [...routesBySession.values()].sort(
    (a, b) => (b.session.lastActivityAtMs ?? 0) - (a.session.lastActivityAtMs ?? 0),
  );
  const budget = detection.historyDiscoveryBudget;
  let importedCount = 0;
  for (const { routes, session } of sessions) {
    if (items == null && importedCount >= maxSessions) {
      if (budget != null) budget.deferred = true;
      break;
    }
    if (
      budget != null &&
      (Date.now() >= budget.deadlineMs ||
        budget.remaining.sessionAttempts === 0 ||
        budget.remaining.directoryEntries === 0 ||
        budget.remaining.transcriptBytes <= 1)
    ) {
      budget.deferred = true;
      break;
    }
    if (session.lastActivityAtMs != null && session.lastActivityAtMs < nowMs - maxSessionAgeMs) {
      for (const { target } of routes)
        target.skippedSessions.push({ manifestPath: session.manifestPath, reason: "too-old", sessionId: session.sessionId });
      continue;
    }
    const resolution = await resolveSessionTranscripts(
      session,
      budget,
      items == null ? undefined : routes.flatMap((route) => route.selectedSessionPaths ?? []),
    );
    if (resolution.status === "skipped") {
      for (const { target } of routes)
        target.skippedSessions.push({ manifestPath: session.manifestPath, reason: resolution.reason, sessionId: session.sessionId });
      continue;
    }
    const resolved = resolution.manifest;
    for (const route of routes) {
      if (
        route.selectedSessionPaths != null &&
        !route.selectedSessionPaths.some((selected) => resolved.rawTranscriptPaths.some((transcript) => pathsEqual(selected, transcript)))
      )
        throw new CoworkHistoryReadError();
      const candidate = buildTranscriptCandidate(
        resolved,
        route.kind === "project" ? route.target.project : route.target.projectlessSpace,
      );
      if (importHistory != null && isAlreadyImported(importHistory, candidate.projectRoot, resolved)) {
        route.target.skippedSessions.push({ manifestPath: session.manifestPath, reason: "already-imported", sessionId: session.sessionId });
        continue;
      }
      route.target.transcriptCandidates.push(candidate);
      importedCount += 1;
      if (items == null) break;
    }
  }
  if (budget?.deferred && !detection.warnings.includes(HISTORY_LIMIT_WARNING)) {
    detection.warnings.push(HISTORY_LIMIT_WARNING);
    for (const selection of projects) selection.warnings.push(HISTORY_LIMIT_WARNING);
  }
  return {
    projectlessSpaces: projectlessSpaces.filter(
      (selection) => selection.transcriptCandidates.length > 0 || selection.accountSetupSelected || selection.pluginSetupSelected,
    ),
    projects,
  };
}

// ---------------------------------------------------------------------------
// 发现→选择管线（原 `PFe`/`DI`/`BFe`/`VFe`）
// ---------------------------------------------------------------------------

/** workspaceRoots 过滤（原 `DI`）：项目 sourceRoot 精确匹配，projectless 按 org 关联。 */
function filterSourceIndex({
  includeAllProjectlessSpaces,
  includeProjectlessSpaces,
  sourceIndex,
  workspaceRoots,
}: {
  includeAllProjectlessSpaces: boolean;
  includeProjectlessSpaces: boolean;
  sourceIndex: DiscoveryResult;
  workspaceRoots: string[] | null;
}): DiscoveryResult {
  if (workspaceRoots == null)
    return { ...sourceIndex, projectlessSpaces: includeProjectlessSpaces ? sourceIndex.projectlessSpaces : [] };
  const projects = sourceIndex.projects.filter((project) => workspaceRoots.some((root) => pathsEqual(root, project.sourceRoot)));
  return {
    ...sourceIndex,
    projectlessSpaces: includeProjectlessSpaces
      ? sourceIndex.projectlessSpaces.filter(
          (space) =>
            includeAllProjectlessSpaces ||
            workspaceRoots.length === 0 ||
            projects.some((project) => pathsEqual(project.accountOrgDir, space.accountOrgDir)),
        )
      : [],
    projects,
  };
}

/** projectless 是否纳入（原 `BFe`）。 */
function shouldIncludeProjectlessSpaces({ items, workspaceRoots }: { items: MigrationItem[] | undefined; workspaceRoots: string[] | null }): boolean {
  return items == null ? workspaceRoots == null : hasAccountConfigItem(items) || hasPluginItems(items) || hasProjectlessSessionItems(items);
}

/** 有效 workspaceRoots（原 `VFe`）：items 的项目 cwd 优先。 */
function effectiveWorkspaceRoots({ items, workspaceRoots }: { items: MigrationItem[] | undefined; workspaceRoots: string[] | null }): string[] | null {
  if (items != null) {
    const cwds = itemCwds(items);
    return cwds.length > 0 ? cwds : hasAccountConfigItem(items) ? workspaceRoots : [];
  }
  return workspaceRoots;
}

/** 发现→选择（原 `PFe`）：可限定单项目（project 非空时跳过发现）。 */
export async function selectCoworkImport({
  importHistory,
  include,
  items,
  limits,
  options,
  project = null,
  workspaceRoots = null,
}: {
  importHistory: CoworkImportHistory | undefined;
  include?: ImportInclude;
  items?: MigrationItem[];
  limits?: ImportLimits;
  options: DiscoveryOptions & ImportLimits;
  project?: CoworkProject | null;
  workspaceRoots?: string[] | null;
}): Promise<{ importSelection: ImportSelection; sourceIndex: DiscoveryResult }> {
  const sourceIndex = filterSourceIndex({
    sourceIndex:
      project == null
        ? await discoverCoworkSpaces(options)
        : { cloudSessionCount: 0, projectlessSpaces: [], projects: [project], skippedProjects: [], warnings: [] },
    workspaceRoots: effectiveWorkspaceRoots({ items, workspaceRoots }),
    includeAllProjectlessSpaces: items != null && hasProjectlessSessionItems(items),
    includeProjectlessSpaces: shouldIncludeProjectlessSpaces({ items, workspaceRoots }),
  });
  return {
    importSelection: await selectImportSessions({
      detection: await collectConfigSurfaces(sourceIndex, allSelectedSessionPaths(items)),
      importHistory,
      include,
      items,
      limits,
    }),
    sourceIndex,
  };
}

// ---------------------------------------------------------------------------
// 全量检测队列（原 `FFe`/`IFe`）
// ---------------------------------------------------------------------------

let detectionQueue: Promise<unknown> = Promise.resolve();

/** 串行化全量检测（原 `FFe`）：避免并发扫描文件系统。 */
export function queueCoworkDetection(request: {
  codexHome: string;
  includeHome?: boolean;
  options: DiscoveryOptions & ImportLimits;
  workspaceRoots?: string[] | null;
}): Promise<CoworkDetectionSummary> {
  const run = detectionQueue.then(() => runCoworkDetection(request));
  detectionQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** 全量检测（原 `IFe`）：发现 + 账本 + 选择 → 计划 items + 未支持项目。 */
async function runCoworkDetection({
  codexHome,
  includeHome = true,
  options,
  workspaceRoots = null,
}: {
  codexHome: string;
  includeHome?: boolean;
  options: DiscoveryOptions & ImportLimits;
  workspaceRoots?: string[] | null;
}): Promise<CoworkDetectionSummary> {
  const [discovery, importHistory] = await Promise.all([discoverCoworkSpaces(options), readImportHistory(codexHome)]);
  const { cloudSessionCount, projectlessSpaces, projects, skippedProjects, warnings } = discovery;
  const detection = await collectConfigSurfaces(
    filterSourceIndex({
      sourceIndex: { cloudSessionCount, projectlessSpaces, projects, skippedProjects, warnings },
      workspaceRoots,
      includeAllProjectlessSpaces: false,
      includeProjectlessSpaces: includeHome,
    }),
    includeHome ? undefined : [],
  );
  const selection = await selectImportSessions({
    detection,
    include: includeHome ? undefined : { agents: true, config: false, sessions: false },
    importHistory,
    items: undefined,
    limits: options,
  });
  return {
    cloudSessionCount: cloudSessionCount ?? 0,
    items: buildImportPlan({ projectlessSpaces: selection.projectlessSpaces, projects: selection.projects }),
    unsupportedProjects: filterSkippedProjectsByWorkspaceRoots(skippedProjects, workspaceRoots),
    warnings: detection.warnings,
  };
}

// ---------------------------------------------------------------------------
// 迁移准备（原 `LFe`/`HFe`/`UFe`/`WFe`/`GFe`/`KFe`/`qFe`/`JFe`/`RFe`）
// ---------------------------------------------------------------------------

/** 迁移准备（原 `LFe`）：项目配置导入 + rollout 并发 ≤5 准备。 */
export async function prepareMigration({
  codexHome,
  items,
  options,
  projectlessThreadPaths,
  reportSessionImportError,
}: {
  codexHome: string;
  items: MigrationItem[];
  options: DiscoveryOptions & ImportLimits;
  projectlessThreadPaths: ProjectlessThreadPathCallback | undefined;
  reportSessionImportError?: (report: { error: unknown; session: TranscriptCandidate }) => void;
}): Promise<MigrationPreparation> {
  if (itemCwds(items).length === 0 && !hasAccountConfigItem(items) && !hasPluginItems(items) && !hasAnySessionItems(items)) {
    return {
      accountSetupItemsToRecord: [],
      importedAgentInstructionPaths: [],
      importedMcpServerNames: [],
      importedProjectRoots: [],
      preparedRollouts: [],
      projectsToRecord: [],
    };
  }
  const { importSelection } = await selectCoworkImport({
    importHistory: await readImportHistory(codexHome),
    include: undefined,
    items,
    limits: options,
    options,
  });
  const preparations = await prepareProjectImports({
    codexHome,
    projects: [...importSelection.projects, ...projectlessSetupSelections(importSelection)],
  });
  const candidates = [
    ...preparations.projects.flatMap((preparation) => preparation.transcriptCandidates),
    ...importSelection.projectlessSpaces.flatMap((selection) => selection.transcriptCandidates),
  ];
  const preparedRollouts: PreparedRollout[] = [];
  for (let offset = 0; offset < candidates.length; offset += 5) {
    const batch = await Promise.all(
      candidates.slice(offset, offset + 5).map(async (candidate) => {
        try {
          return await prepareCandidateRollout({ candidate, codexHome, projectlessThreadPaths });
        } catch (error) {
          reportSessionImportError?.({ error, session: candidate });
          throw error;
        }
      }),
    );
    preparedRollouts.push(...batch.filter((rollout): rollout is PreparedRollout => rollout != null));
  }
  return {
    accountSetupItemsToRecord: preparations.projects.flatMap((preparation) =>
      hasConfigSurfacesToRecord(preparation)
        ? [{ accountOrgDir: preparation.projectImport.project.accountOrgDir, itemType: "CONFIG" as const }]
        : [],
    ),
    importedAgentInstructionPaths: preparations.projects.flatMap((preparation) =>
      preparation.agentsPath == null
        ? []
        : [{ cwd: preparation.projectImport.project.sourceRoot, target: preparation.agentsPath }],
    ),
    importedMcpServerNames: [...new Set(preparations.projects.flatMap((preparation) => preparation.importedMcpServerNames))].sort(
      (a, b) => a.localeCompare(b),
    ),
    importedProjectRoots: importedProjectRootsOf(preparations.projects),
    preparedRollouts,
    projectsToRecord: preparations.projects.flatMap((preparation) =>
      preparation.projectImport.shouldRecordProjectImport ? [preparation.projectImport.project] : [],
    ),
  };
}

/** projectless 账号配置 → 合成项目选择（原 `RFe`）。 */
function projectlessSetupSelections(selection: ImportSelection): ProjectImportSelection[] {
  return selection.projectlessSpaces
    .filter((space) => space.accountSetupSelected)
    .map((space) => ({
      accountSetupSelected: true,
      configSurfaces: space.configSurfaces,
      isProjectlessSetup: true,
      itemTypes: new Set<string>(),
      pluginCandidates: [],
      pluginSetupSelected: false,
      project: projectlessAsProject(space.projectlessSpace),
      scheduledTasks: [],
      shouldRecordProjectImport: false,
      skippedSessions: [],
      transcriptCandidates: [],
      warnings: [],
    }));
}

/** 账号配置需记账（原 `JFe`）。 */
function hasConfigSurfacesToRecord(preparation: ProjectImportPreparation): boolean {
  return preparation.projectImport.accountSetupSelected && preparation.projectImport.configSurfaces.length > 0;
}

/** 导入项目根列表（原 `KFe`/`qFe`）。 */
function importedProjectRootsOf(preparations: ProjectImportPreparation[]): string[] {
  return [
    ...new Set(
      preparations.flatMap((preparation) => (countsAsImportedProject(preparation) ? [preparation.projectImport.project.sourceRoot] : [])),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function countsAsImportedProject(preparation: ProjectImportPreparation): boolean {
  const selection = preparation.projectImport;
  return (
    !selection.isProjectlessSetup &&
    (selection.accountSetupSelected ||
      selection.pluginSetupSelected ||
      selection.itemTypes.has("AGENTS_MD") ||
      selection.itemTypes.has("SESSIONS"))
  );
}

/** 单候选 rollout 准备（原 `HFe`）。 */
async function prepareCandidateRollout({
  candidate,
  codexHome,
  projectlessThreadPaths,
}: {
  candidate: TranscriptCandidate;
  codexHome: string;
  projectlessThreadPaths: ProjectlessThreadPathCallback | undefined;
}): Promise<PreparedRollout | null> {
  const sources = await collectImportFileSources(candidate);
  if (candidate.workspaceKind !== "projectless") {
    const staging =
      sources.length === 0 ? null : await resolveProjectStagingDirectory({ candidate, codexHome, projectlessThreadPaths });
    const stagedGeneratedFiles = staging == null ? [] : await importSessionFiles({ candidate, outputDirectory: staging.outputDirectory, sources });
    return prepareRollout({
      candidate,
      codexHome,
      cwd: candidate.projectRoot,
      projectlessOutputDirectory: null,
      projectlessWorkspaceRoot: null,
      stagedGeneratedFiles,
    });
  }
  if (projectlessThreadPaths == null)
    throw new Error("Projectless Cowork transcript import requires projectless thread paths");
  let paths;
  try {
    paths = await projectlessThreadPaths(candidate);
  } catch (error) {
    if (isProjectlessDirectoryConflict(error)) return null;
    throw error;
  }
  const stagedGeneratedFiles = await importSessionFiles({ candidate, outputDirectory: paths.outputDirectory, sources });
  return prepareRollout({
    candidate,
    codexHome,
    cwd: paths.cwd,
    projectlessOutputDirectory: paths.outputDirectory,
    projectlessWorkspaceRoot: paths.workspaceRoot,
    stagedGeneratedFiles,
  });
}

/** 项目候选的 staging 目录（原 `UFe`）：宿主回调或 codexHome 下的默认目录。 */
async function resolveProjectStagingDirectory({
  candidate,
  codexHome,
  projectlessThreadPaths,
}: {
  candidate: TranscriptCandidate;
  codexHome: string;
  projectlessThreadPaths: ProjectlessThreadPathCallback | undefined;
}): Promise<{ cwd: string; outputDirectory: string; workspaceRoot: string }> {
  if (projectlessThreadPaths != null) return projectlessThreadPaths(candidate);
  const directory = join(codexHome, "claude-cowork-generated-files", stagingDirectoryName(candidate));
  return { cwd: directory, outputDirectory: directory, workspaceRoot: directory };
}

/** staging 目录名（原 `WFe`）：`<titleSlug>-<sourceIdSlug>`。 */
function stagingDirectoryName(candidate: TranscriptCandidate): string {
  const sourceId = candidate.sourceId === "" ? "cowork-session" : candidate.sourceId;
  const sourceSlug = slugifyStagingName(sourceId) || "cowork-session";
  const title = candidate.title?.trim() === "" ? null : candidate.title;
  return `${slugifyStagingName(title ?? sourceId) || sourceSlug}-${sourceSlug}`;
}

function slugifyStagingName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** projectless 目录冲突（原 `GFe`）：宿主回调抛出的唯一目录耗尽错误 → 跳过。 */
function isProjectlessDirectoryConflict(error: unknown): boolean {
  return error instanceof Error && error.message === "Unable to create a unique projectless thread directory";
}

// ---------------------------------------------------------------------------
// 编排入口（原 `zFe`/`TPe`/`EPe`）
// ---------------------------------------------------------------------------

/** 显式 items 的插件导入键（原 `EPe`）：accountOrgDir + 插件名。 */
function selectedPluginKeys(items: MigrationItem[]): Set<string> {
  return new Set(
    items
      .filter((item) => item.itemType === "PLUGINS")
      .flatMap((item) => {
        const sourcePath = item.sourcePath;
        return sourcePath == null || sourcePath === ""
          ? []
          : (item.details?.plugins ?? []).flatMap((plugin) => [`${sourcePath}${plugin.name}`]);
      }),
  );
}

/** 插件候选去重排序（原 `xF`）。 */
function dedupePluginBundles(bundles: PluginCandidate[]): PluginCandidate[] {
  return [
    ...new Map(
      bundles.map((bundle) => [
        [bundle.accountOrgDir, bundle.pluginName, bundle.pluginRoot].join(""),
        { ...bundle, skillPaths: [...new Set(bundle.skillPaths)].sort((a, b) => a.localeCompare(b)) },
      ]),
    ).values(),
  ].sort((a, b) =>
    `${a.accountOrgDir}\u001f${a.pluginName}`.localeCompare(`${b.accountOrgDir}\u001f${b.pluginName}`),
  );
}

/** 显式 items 的插件导入收集（原 `TPe`）。 */
async function collectPluginImports({ items, options }: { items: MigrationItem[]; options: DiscoveryOptions }): Promise<PluginImport[]> {
  const wanted = selectedPluginKeys(items);
  if (wanted.size === 0) return [];
  const discovery = await discoverCoworkSpaces(options);
  const bundles = (
    await Promise.all(discovery.projectlessSpaces.map(async (space) => (await scanProjectlessSpace(projectlessAsProject(space))).pluginBundles))
  ).flat();
  return dedupePluginBundles(bundles.filter((bundle) => wanted.has(`${bundle.accountOrgDir}${bundle.pluginName}`)));
}

/** 导入编排入口（原 `zFe`）：迁移准备 + 插件导入 → importAccountSetup。 */
export async function runCoworkImport({
  callbacks,
  codexHome,
  items,
  options,
}: {
  callbacks: ImportCallbacks;
  codexHome: string;
  items: MigrationItem[];
  options: DiscoveryOptions & ImportLimits;
}): Promise<CoworkImportResult> {
  const [migration, pluginImports] = await Promise.all([
    prepareMigration({
      codexHome,
      items,
      options,
      projectlessThreadPaths: callbacks.createProjectlessThreadPaths,
      reportSessionImportError: callbacks.reportSessionImportError,
    }),
    collectPluginImports({ items, options }),
  ]);
  const { importedRollouts } = await importAccountSetup({ callbacks, codexHome, migration, pluginImports });
  return {
    importedAgentInstructionPaths: migration.importedAgentInstructionPaths,
    importedConfigSourcePaths: migration.accountSetupItemsToRecord.flatMap((item) =>
      item.itemType === "CONFIG" ? [item.accountOrgDir] : [],
    ),
    importedMcpServerNames: migration.importedMcpServerNames,
    importedPluginNames: [...new Set(pluginImports.map((pluginImport) => pluginImport.pluginName))].sort((a, b) =>
      a.localeCompare(b),
    ),
    importedProjectRoots: migration.importedProjectRoots,
    importedRollouts,
  };
}
