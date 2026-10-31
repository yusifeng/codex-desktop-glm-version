// ThreadStore 的 hydration/投影 helper 群。
//
// 对应 main-C-Mhak1n.ts 32,988-33,603（投影剩余）+ 33,858-34,506（hydration 簇）
// + 30,452-30,500 区间的 Fg + 139-180 的 he（重试查找缓存）：
//   - 会话元信息快照（G_/t_e/K_/e_e）：any/meta 变更检测的依据
//   - 附件提取（o_e/s_e/c_e/l_e/X_）：prompt 分节标记里的文件引用
//   - 图片 src 归一（u_e/Z_/Q_）
//   - 读响应 → turn 投影（$_/ev/tv/nv/d_e/rv/iv）
//   - 子代理接收线程传播（f_e/av/p_e/m_e）与祖先链（ov/sv/cv/lv/uv/dv）
//   - 待处理交互种类（fv/pv/mv/hv/gv/h_e）
//   - hydration 并发编排（b_e）与分页列表（x_e）
//   - 会话列表状态（kv）、新建会话骨架（Ov）、最近会话 upsert（S_e/Mv）
//   - transcript 快照与增量（C_e/Nv/w_e/Pv/Fv）
//   - Fg 最后活跃 turn；he 失败重试缓存
import {
  wf as objectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  $u as threadIdOf,
  vl as isAbsolutePathLike,
  wl as normalizeUncPath,
  Tl as normalizeSlashes,
  Ol as stripDrivePrefix,
  kd as permissionsForRoots,
  Od as defaultPermissions,
  Nd as permissionParamsOf,
  jd as runtimeWorkspaceRootsOf,
  fd as parseAutomationUserMessage,
  lr as isElicitationForTurn,
  ed as requestIdOf,
  Ji as isDeleteFileChange,
  pa as DEFAULT_THREAD_SOURCE_KINDS,
  _s as LONG_LIVED_HOST_ID,
} from "@chunk/shared";
import { hasCanonicalVoiceHistory as hasCanonicalVoice } from "./automation-detector";
import { produce, produceWithPatches, original } from "../vendor/immer";
import { deepEqual, findLast } from "../util/lodash-interop";
import {
  conversationTurns,
  mergedConversationTurns,
  historyTurnCount,
  lastTurn,
  hasCompleteHistory,
  forEachTurn,
} from "../turns/canonical-history";
import {
  cleanThreadTitle,
  threadTimestamps,
  mergedRecencyAt,
  environmentSelection,
  subAgentMetadata,
  subAgentNickname,
} from "./projection";
import {
  isTerminalTransientItem,
  isUserMessageItem,
  isAgentMessageItem,
  isActivityItem,
  isCreateThreadCall,
  isReasoningItem,
  isAutomationItem,
} from "./timeline-index";
import { AUTOMATION_DETECTOR } from "./automation-detector";
import { parseCodexDelegation } from "../misc/delegation";
import { takeLastRequestSection, FILES_MENTIONED_SECTION, FILES_PASTED_SECTION } from "../prompts/section-markers";
import { plainTextFromMarkdown } from "../markdown/plain-text";

// ---------------------------------------------------------------------------
// 会话元信息快照（原 `G_`/`t_e`/`K_`/`e_e`）
// ---------------------------------------------------------------------------

/** any/meta 快照（原 `G_`）。 */
export function conversationMetaSnapshot(conversation: Record<string, any>): Record<string, unknown> {
  const last = lastTurn(conversation as never) as { turnId?: string; status?: string; items?: unknown[] } | null;
  const source = subAgentMetadata(conversation.source);
  const parentThreadId = conversation.parentThreadId ?? source?.parentThreadId ?? null;
  return {
    id: conversation.id,
    environmentConfigId: conversation.environmentConfigId,
    requestsRef: conversation.requests.map(({ method }: { method: string }) => ({ method })),
    turnsLength: historyTurnCount(conversation as never),
    lastTurnId: last?.turnId ?? null,
    lastTurnStatus: last?.status ?? null,
    lastTurnIsSleeping: last?.status === "inProgress" && (last.items as { type?: string }[] | undefined)?.at(-1)?.type === "sleep",
    createdAtMs: conversation.createdAt,
    updatedAtMs: conversation.updatedAt,
    recencyAtMs: conversation.recencyAt ?? conversation.updatedAt,
    title: conversation.title,
    originator: conversation.originator,
    source: conversation.source,
    agentNickname: subAgentNickname(conversation as never),
    mode: conversation.mode,
    threadStartKind: conversation.threadStartKind,
    threadSource: conversation.threadSource,
    hasUnreadTurn: conversation.hasUnreadTurn,
    resumeState: conversation.resumeState,
    threadGoal: conversation.threadGoal,
    threadRuntimeStatus: conversation.threadRuntimeStatus,
    workspaceKind: conversation.workspaceKind,
    cwd: conversation.cwd,
    gitInfoBranch: conversation.gitInfo?.branch ?? null,
    isSubagentSource: parentThreadId != null,
    subagentParentThreadId: parentThreadId,
    subagentSpinnerProjectionSignature: spinnerSignature(conversation),
  };
}

/** 子代理 spinner 的投影签名（原 `t_e`）：接收线程 running 位图。 */
function spinnerSignature(conversation: Record<string, any>): string {
  const parts: string[] = [];
  for (const turn of conversationTurns(conversation as never) as any[]) {
    for (const item of turn.items ?? []) {
      if (item?.type === "collabAgentToolCall" && "receiverThreadIds" in item && "agentsStates" in item) {
        for (const receiverId of item.receiverThreadIds as string[]) {
          const state = (item.agentsStates as Record<string, { status?: string }> | undefined)?.[receiverId];
          if (state == null) continue;
          parts.push(`${receiverId}:${state.status === "running" ? "1" : "0"}`);
        }
      }
    }
  }
  parts.sort();
  return parts.join("|");
}

/** meta 快照相等（原 `K_`）。 */
export function metaSnapshotsEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  return (
    a.id === b.id &&
    a.environmentConfigId === b.environmentConfigId &&
    deepEqual(a.requestsRef, b.requestsRef) &&
    a.turnsLength === b.turnsLength &&
    a.lastTurnId === b.lastTurnId &&
    a.lastTurnStatus === b.lastTurnStatus &&
    a.lastTurnIsSleeping === b.lastTurnIsSleeping &&
    a.createdAtMs === b.createdAtMs &&
    a.updatedAtMs === b.updatedAtMs &&
    a.recencyAtMs === b.recencyAtMs &&
    a.title === b.title &&
    a.originator === b.originator &&
    a.source === b.source &&
    a.agentNickname === b.agentNickname &&
    a.mode === b.mode &&
    a.threadStartKind === b.threadStartKind &&
    a.threadSource === b.threadSource &&
    a.hasUnreadTurn === b.hasUnreadTurn &&
    a.resumeState === b.resumeState &&
    deepEqual(a.threadGoal, b.threadGoal) &&
    deepEqual(a.threadRuntimeStatus, b.threadRuntimeStatus) &&
    a.workspaceKind === b.workspaceKind &&
    a.cwd === b.cwd &&
    a.gitInfoBranch === b.gitInfoBranch &&
    a.isSubagentSource === b.isSubagentSource &&
    a.subagentParentThreadId === b.subagentParentThreadId &&
    a.subagentSpinnerProjectionSignature === b.subagentSpinnerProjectionSignature
  );
}
/** 最近会话的排序键（原 `e_e`）。 */
export function recentOrderKey(conversations: Array<{ id: string; recencyAt?: number | null; updatedAt: number }>): string {
  return conversations.map((c) => `${c.id}:${c.recencyAt ?? c.updatedAt}`).join("|");
}

// ---------------------------------------------------------------------------
// 附件提取（原 `o_e`/`s_e`/`c_e`/`l_e`/`X_`）
// ---------------------------------------------------------------------------

const libraryFileSchema = objectSchema({
  currentVersion: (numberSchema() as unknown as { int(): { nonnegative(): { optional(): unknown } } }).int().nonnegative().optional(),
  fileId: stringSchema().min(1),
  libraryFileId: stringSchema().min(1),
});
const sharedThreadSchema = objectSchema({ shareId: stringSchema().min(1) });

/** "## label: path" 形式的文件引用头（原 `c_e`）。 */
function parseFileHeading(line: string, expectJsonLabel: boolean): { label: string; path: string; fsPath: string; isPastedText?: boolean } | null {
  const heading = line.match(/^##\s+(.+)$/)?.[1];
  if (heading == null) return null;
  let colon = heading.lastIndexOf(": ");
  for (; colon > 0; ) {
    let label = heading.slice(0, colon).trim();
    const path = heading
      .slice(colon + 2)
      .trim()
      .replace(/\s+\((?:lines\s+\d+-\d+|line\s+\d+)\)\s*$/, ``);
    if (label.length > 0 && isAbsolutePathLike(normalizeSlashes(stripDrivePrefix(path)))) {
      if (expectJsonLabel) {
        try {
          const parsed = JSON.parse(label);
          if (typeof parsed != "string") return null;
          label = parsed;
        } catch {
          return null;
        }
      }
      return { label, path, fsPath: path };
    }
    colon = heading.lastIndexOf(": ", colon - 1);
  }
  return null;
}

/** prompt 分节里的文件引用列表（原 `l_e`）。 */
export function extractAttachmentSections(text: string): Array<{ label: string; path: string; fsPath: string; isPastedText?: boolean; libraryFile?: unknown; sharedThread?: unknown }> {
  const lastRequest = takeLastRequestSection(text);
  if (lastRequest == null) return [];
  const attachments: Array<{ label: string; path: string; fsPath: string; isPastedText?: boolean; libraryFile?: unknown; sharedThread?: unknown }> = [];
  for (const [marker, pasted] of [[FILES_MENTIONED_SECTION, false], [FILES_PASTED_SECTION, true]] as const) {
    const index = lastRequest.indexOf(marker);
    if (index === -1) continue;
    const body = lastRequest.slice(index + marker.length);
    for (const line of body.split("\n")) {
      const trimmed = line.trimStart();
      if (!trimmed) continue;
      const heading = parseFileHeading(trimmed, pasted);
      if (heading != null) {
        if (pasted) heading.isPastedText = true;
        attachments.push(heading);
        continue;
      }
      const last = attachments.at(-1);
      if (!pasted || last == null) break;
      if (trimmed.startsWith("Library file metadata: ")) {
        try {
          const parsed = (libraryFileSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: unknown } }).safeParse(JSON.parse(trimmed.slice(23)));
          if (parsed.success) last.libraryFile = parsed.data;
        } catch {}
        continue;
      }
      if (trimmed.startsWith("Shared thread metadata: ")) {
        try {
          const parsed = (sharedThreadSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: unknown } }).safeParse(JSON.parse(trimmed.slice(24)));
          if (parsed.success) last.sharedThread = parsed.data;
        } catch {}
        continue;
      }
      break;
    }
  }
  return attachments;
}

/** 从 turn 输入 items 提取附件（原 `X_`）。 */
export function attachmentsFromInput(items: Array<{ type: string; text?: string }> | undefined): Array<{ label: string; path: string; fsPath: string }> {
  return extractAttachmentSections(
    (items ?? []).flatMap((item) => (item.type === "text" ? [item.text ?? ""] : [])).join("\n"),
  );
}

// ---------------------------------------------------------------------------
// 图片 src 归一（原 `u_e`/`Z_`/`Q_`）
// ---------------------------------------------------------------------------

const IMAGE_SRC_PATTERN = /^(?:data:image\/|https?:\/\/|file:\/\/|app:\/\/|\/@fs)/i;

function normalizeImageSrc(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0
    ? null
    : isAbsolutePathLike(trimmed)
      ? normalizeUncPath(normalizeSlashes(trimmed))
      : IMAGE_SRC_PATTERN.test(trimmed)
        ? trimmed
        : `data:image/png;base64,${trimmed}`;
}

/** imageGeneration item 的 src 归一（原 `Z_`）。 */
export function normalizeImageGenerationItem(item: Record<string, unknown>): Record<string, unknown> {
  const savedPath = typeof item.savedPath == "string" ? normalizeImageSrc(item.savedPath) : null;
  return { ...item, src: savedPath ?? normalizeImageSrc(item.result as string) };
}

// ---------------------------------------------------------------------------
// 读响应 → turn 投影（原 `$_`/`ev`/`tv`/`nv`/`d_e`/`rv`/`iv`）
// ---------------------------------------------------------------------------

/** thread/read 响应 → turn 参数源（原 `$_`）。 */
export function turnParamsFromReadResponse(
  response: Record<string, any>,
  { resolvedPermissions, fallbackCwd = null }: { resolvedPermissions: Record<string, unknown>; fallbackCwd?: string | null },
) {
  const sessionCwd = response.sessionMeta?.cwd;
  const threadCwd = response.thread.cwd;
  const responseCwd = "cwd" in response && typeof response.cwd == "string" ? response.cwd : null;
  const cwd = threadCwd || sessionCwd || responseCwd || fallbackCwd || "/";
  return {
    threadId: response.thread.id,
    turns: response.thread.turns,
    model: response.model,
    reasoningEffort: response.reasoningEffort,
    cwd,
    permissions: resolvedPermissions,
  };
}

/** thread/read 响应 → turn 列表投影（原 `ev`）。 */
export function projectReadResponseTurns(
  response: Record<string, any>,
  { workspaceRoots = [], fallbackCwd = null, model = "", reasoningEffort = null } = {},
) {
  const cwd = response.thread.cwd || fallbackCwd || "/";
  const permissions = permissionsForRoots(workspaceRoots);
  return projectTurns({
    threadId: response.thread.id,
    turns: response.thread.turns,
    model,
    reasoningEffort,
    cwd,
    permissions,
  });
}

/** turn 列表 → 投影（原 `tv`）。 */
export function projectTurns({
  threadId,
  turns,
  model,
  reasoningEffort,
  cwd,
  permissions,
  itemsPaginationByTurnId,
}: {
  threadId: string;
  turns: any[];
  model: string;
  reasoningEffort: unknown;
  cwd: string;
  permissions: Record<string, any>;
  itemsPaginationByTurnId?: Record<string, any>;
}): any[] {
  return turns.map((turn) => {
    const pagination = itemsPaginationByTurnId?.[turn.id];
    const firstItem = turn.items.find((item: any) => item.type !== "contextCompaction");
    const input =
      pagination?.oldestUserInput ??
      (pagination?.hasLoadedOldest !== false && firstItem?.type === "userMessage" ? firstItem.content : []);
    return {
      params: {
        threadId,
        input,
        clientUserMessageId:
          pagination?.oldestUserInput == null && pagination?.hasLoadedOldest !== false && firstItem?.type === "userMessage"
            ? firstItem.clientId
            : pagination?.openingUserMessageClientId,
        toolOutput:
          pagination?.hasLoadedOldest !== false && firstItem?.type === "functionCallOutput"
            ? { name: firstItem.name, namespace: firstItem.namespace, output: firstItem.output }
            : undefined,
        approvalPolicy: permissions.approvalPolicy,
        approvalsReviewer: permissions.approvalsReviewer,
        ...permissionParamsOf(permissions),
        ...(permissions.activePermissionProfile == null ? {} : { runtimeWorkspaceRoots: runtimeWorkspaceRootsOf(permissions) }),
        model,
        cwd: cwd || null,
        effort: reasoningEffort,
        summary: "none",
        personality: null,
        outputSchema: null,
        collaborationMode: null,
        attachments: attachmentsFromInput(input),
      },
      permissionParamsSource: "inferred",
      turnId: turn.id,
      turnStartedAtMs: scaleTimestamp(turn.startedAt),
      durationMs: turn.durationMs,
      finalAssistantStartedAtMs: scaleTimestamp(turn.completedAt),
      status: turn.status,
      error: turn.error,
      diff: null,
      items: projectItems(turn.items),
      itemsPagination: pagination,
    };
  });
}

export function projectItems(items: any[]): any[] {
  return items.map(projectItem);
}

function projectItem(item: any): any {
  return item.type === "imageGeneration"
    ? normalizeImageGenerationItem(item)
    : item.type === "collabAgentToolCall"
      ? { ...item, receiverThreads: (item.receiverThreadIds as string[]).map((id) => ({ threadId: id, thread: null })) }
      : item;
}

function scaleTimestamp(value: number | null | undefined): number | null {
  return value == null || !Number.isFinite(value) ? null : value * 1e3;
}

/** turn 的字段兜底（原 `iv`）。 */
export function ensureTurnFields(turn: Record<string, any>, status?: string): Record<string, any> {
  if (status) turn.status = status;
  turn.items ||= [];
  turn.hookRuns ??= [];
  return turn;
}

// ---------------------------------------------------------------------------
// 子代理接收线程传播（原 `f_e`/`av`/`p_e`/`m_e`）与祖先链（原 `ov`~`dv`）
// ---------------------------------------------------------------------------

function receiverThreadsOf(call: { receiverThreadIds: string[] }, threadsById: Map<string, unknown>) {
  return call.receiverThreadIds.map((id) => ({ threadId: id, thread: threadsById.get(id) ?? null }));
}

/** 注册线程元数据并传播 receiverThreads（原 `av`）。 */
export function registerThreadMetadata({
  thread,
  threadsById,
  conversations,
  updateConversationState,
}: {
  thread: Record<string, any>;
  threadsById: Map<string, Record<string, any>>;
  conversations: Map<string, Record<string, any>>;
  updateConversationState: (id: string, recipe: (draft: Record<string, any>) => void) => void;
}) {
  threadsById.set(thread.id, { ...thread, turns: [] });
  const conversationId = threadIdOf(thread.id);
  const existing = conversations.get(conversationId);
  if (existing != null && existing.agentNickname !== thread.agentNickname) {
    updateConversationState(conversationId, (draft) => {
      draft.agentNickname = thread.agentNickname;
    });
  }
  propagateReceiverThreads({ threadId: thread.id, conversations, threadsById, updateConversationState });
}

/** 含 receiverThreads 的调用项（原 `m_e`）。 */
function isReceiverThreadCall(item: any): item is any {
  return item.type === "collabAgentToolCall" && "receiverThreads" in item;
}

/** 把线程快照传播到所有引用它的 collabAgentToolCall（原 `p_e`）。 */
function propagateReceiverThreads({
  threadId,
  conversations,
  threadsById,
  updateConversationState,
}: {
  threadId: string;
  conversations: Map<string, Record<string, any>>;
  threadsById: Map<string, Record<string, any>>;
  updateConversationState: (id: string, recipe: (draft: Record<string, any>) => void) => void;
}) {
  for (const [conversationId, conversation] of conversations.entries()) {
    if (
      (conversationTurns(conversation as never) as any[]).some(
        (turn) => turn.items.some((item: any) => isReceiverThreadCall(item) && (item.receiverThreadIds as string[]).includes(threadId)),
      )
    ) {
      updateConversationState(conversationId, (draft) => {
        forEachTurn(draft as never, (turn: any) => {
          for (const item of turn.items) {
            if (item.type !== "collabAgentToolCall" || !("receiverThreads" in item) || !(item.receiverThreadIds as string[]).includes(threadId))
              continue;
            const updated = receiverThreadsOf({ receiverThreadIds: item.receiverThreadIds }, threadsById);
            if (!deepEqual(item.receiverThreads, updated)) item.receiverThreads = produce(updated, () => {});
          }
        });
      });
    }
  }
}

/** 祖先链上活跃的会话集合（原 `ov`）。 */
export function activeAncestryIds(
  summaries: Array<Record<string, any>>,
  conversations: Array<Record<string, any>>,
): Set<string> {
  const bySummary = new Map(summaries.map((s) => [s.conversationId, s]));
  const byConversation = new Map(conversations.map((c) => [c.id, c]));
  const active = new Set<string>();
  for (const id of new Set([...bySummary.keys(), ...byConversation.keys()])) {
    const conversation = byConversation.get(id);
    const summary = bySummary.get(id);
    if (effectiveRuntimeStatus(summary, conversation)?.type !== "active") continue;
    let ancestor = parentThreadIdOf(conversation ?? summary);
    for (; ancestor != null && !active.has(ancestor); ) {
      active.add(ancestor);
      ancestor = parentThreadIdOf(byConversation.get(ancestor) ?? bySummary.get(ancestor));
    }
  }
  return active;
}

/** 有父线程（原 `sv`）。 */
export function isSubagentThread(thread: Record<string, any> | null | undefined): boolean {
  return parentThreadIdOf(thread) != null;
}

/** 生效的运行时状态（原 `cv`）。 */
export function effectiveRuntimeStatus(
  summary: Record<string, any> | null | undefined,
  conversation: Record<string, any> | null | undefined,
): { type?: string } | undefined {
  const conversationStatus = conversation?.threadRuntimeStatus;
  return conversation?.resumeState === "needs_resume" || conversationStatus?.type === "notLoaded"
    ? (summary?.threadRuntimeStatus ?? conversationStatus ?? undefined)
    : (conversationStatus ?? summary?.threadRuntimeStatus);
}

/** 是否为某线程的后代（原 `lv`）。 */
export function isDescendantOf(
  thread: Record<string, any>,
  ancestorId: string,
  known: Map<string, Record<string, any>>,
): boolean {
  const visited = new Set<string>();
  let current = parentThreadIdOf(thread);
  for (; current != null && !visited.has(current); ) {
    if (current === ancestorId) return true;
    visited.add(current);
    current = parentThreadIdOf(known.get(current));
  }
  return false;
}

/** 父线程 id（canonical 优先，含 source 里的 thread_spawn，原 `uv`）。 */
export function parentThreadIdOf(thread: Record<string, any> | null | undefined): string | null {
  return thread == null
    ? null
    : thread.parentThreadId == null
      ? (subAgentMetadata(thread.source)?.parentThreadId ?? null)
      : threadIdOf(thread.parentThreadId);
}

/** 可进入最近列表的线程（原 `dv`）。 */
export function isSurfaceableThread(thread: Record<string, any>): boolean {
  return thread.ephemeral !== true && thread.threadSource !== "ambient_suggestions";
}

// ---------------------------------------------------------------------------
// 待处理交互种类（原 `fv`/`pv`/`mv`/`hv`/`gv`/`h_e`）
// ---------------------------------------------------------------------------

interface PendingInteractionState {
  approvalRequests: Array<{ method: string; params: Record<string, any> }>;
  hasElicitation: boolean;
  onboardingUserInputRequestId: string | null;
  environmentUserInputRequestId: string | null;
  hasOptionPicker: boolean;
  hasPermissionRequest: boolean;
  hasSetupCodexStep: boolean;
  userInputRequestId: string | null;
}

function pendingStateFor(map: Map<string, PendingInteractionState>, turnId: string): PendingInteractionState {
  let state = map.get(turnId);
  if (!state) {
    state = {
      approvalRequests: [],
      hasElicitation: false,
      onboardingUserInputRequestId: null,
      environmentUserInputRequestId: null,
      hasOptionPicker: false,
      hasPermissionRequest: false,
      hasSetupCodexStep: false,
      userInputRequestId: null,
    };
    map.set(turnId, state);
  }
  return state;
}

/** 未完成的 planImplementation（原 `gv`）。 */
function hasIncompletePlanImplementation(turn: { items: any[] }): boolean {
  for (let i = turn.items.length - 1; i >= 0; --i) {
    const item = turn.items[i];
    if (item?.type === "planImplementation" && "isCompleted" in item) return !item.isCompleted;
  }
  return false;
}

/** onboarding 工具分类（原 `h_e`；工具 schema 由 requests/item-synthesis 提供，此处按方法名保守判定）。 */
function onboardingToolKind(request: { params: { tool: string; arguments: unknown } }): "userInput" | "optionPicker" | "setupCodexStep" | null {
  switch (request.params.tool) {
    case "request_user_input":
      return request.params.arguments == null ? null : "userInput";
    case "request_option_picker":
      return request.params.arguments == null ? null : "optionPicker";
    case "setup_codex":
      return "setupCodexStep";
    default:
      return null;
  }
}

/** 环境输入请求的 pending 判定（原 `fv`）。 */
function environmentInputPending(params: Record<string, any>): { status: string; notifyUserInput?: boolean } | null {
  return params.tool === "request_environment_input"
    ? { status: "pending", notifyUserInput: true }
    : null;
}

/** 会话当前等待的交互种类（原 `mv`/`pv`）。 */
export function pendingInteraction(
  conversation: Record<string, any> | null,
  parseUrlOrHostId: ((url: string) => unknown) | string,
  includeEnvironmentInput = false,
): { kind: string; userInputRequestId: string | null } | null {
  if (conversation == null) return null;
  const parseUrl =
    typeof parseUrlOrHostId === "function"
      ? parseUrlOrHostId
      : (url: string) => url;
  const byTurn = new Map<string, PendingInteractionState>();
  let hasTurnlessElicitation = false;
  for (let i = conversation.requests.length - 1; i >= 0; --i) {
    const request = conversation.requests[i];
    switch (request.method) {
      case "mcpServer/elicitation/request":
        if (("completed" in request && request.completed === true) || isElicitationForTurn(request.params, true, parseUrl) == null) continue;
        if (request.params.turnId == null || request.params.turnId.length === 0) hasTurnlessElicitation = true;
        else pendingStateFor(byTurn, request.params.turnId).hasElicitation = true;
        continue;
      case "item/commandExecution/requestApproval":
      case "item/fileChange/requestApproval":
        pendingStateFor(byTurn, request.params.turnId).approvalRequests.push(request);
        continue;
      case "item/permissions/requestApproval":
        pendingStateFor(byTurn, request.params.turnId).hasPermissionRequest = true;
        continue;
      case "item/tool/requestUserInput": {
        pendingStateFor(byTurn, request.params.turnId).userInputRequestId ??= requestIdOf(request.id);
        continue;
      }
      case "item/tool/requestOptionPicker":
        pendingStateFor(byTurn, request.params.turnId).hasOptionPicker = true;
        continue;
      case "item/tool/call": {
        if (!includeEnvironmentInput && environmentInputPending(request.params)?.status === "pending") {
          pendingStateFor(byTurn, request.params.turnId).environmentUserInputRequestId ??= requestIdOf(request.id);
          continue;
        }
        const kind = onboardingToolKind(request);
        if (kind == null) continue;
        const state = pendingStateFor(byTurn, request.params.turnId);
        switch (kind) {
          case "userInput":
            state.onboardingUserInputRequestId ??= requestIdOf(request.id);
            break;
          case "optionPicker":
            state.hasOptionPicker = true;
            break;
          case "setupCodexStep":
            state.hasSetupCodexStep = true;
        }
        continue;
      }
      case "account/chatgptAuthTokens/refresh":
      case "applyPatchApproval":
      case "attestation/generate":
      case "currentTime/read":
      case "execCommandApproval":
      case "item/plan/requestImplementation":
        continue;
    }
  }
  const turns = mergedConversationTurns(conversation as never, includeEnvironmentInput ? undefined : (AUTOMATION_DETECTOR as never)) as any[];
  for (let i = turns.length - 1; i >= 0; --i) {
    const turn = turns[i];
    if (turn.turnId == null) {
      if (hasIncompletePlanImplementation(turn)) return { kind: "implementPlan", userInputRequestId: null };
      continue;
    }
    const state = byTurn.get(turn.turnId);
    const userInputId = state?.userInputRequestId ?? state?.environmentUserInputRequestId ?? state?.onboardingUserInputRequestId;
    if (userInputId != null) return { kind: "userInput", userInputRequestId: userInputId };
    if (state?.hasOptionPicker) return { kind: "optionPicker", userInputRequestId: null };
    if (state?.hasSetupCodexStep) return { kind: "setupCodexStep", userInputRequestId: null };
    for (let j = turn.items.length - 1; j >= 0; --j) {
      const item = turn.items[j];
      if (item?.type === "userInputResponse" && "completed" in item && !item.completed && "requestId" in item)
        return { kind: "userInput", userInputRequestId: item.requestId };
    }
    for (const approval of state?.approvalRequests ?? []) {
      if (
        approval.method === "item/commandExecution/requestApproval" ||
        turn.items
          .find((item: any) => item?.type === "fileChange" && item.id === approval.params.itemId)
          ?.changes.some((change: any) => !isDeleteFileChange(change) || change.kind.type !== "delete")
      )
        return { kind: "approval", userInputRequestId: null };
    }
    if (state?.hasPermissionRequest) return { kind: "permissionRequest", userInputRequestId: null };
    if (state?.hasElicitation) return { kind: "mcpServerElicitation", userInputRequestId: null };
    if (hasIncompletePlanImplementation(turn)) return { kind: "implementPlan", userInputRequestId: null };
  }
  return hasTurnlessElicitation ? { kind: "mcpServerElicitation", userInputRequestId: null } : null;
}

/** 交互种类名（原 `pv`）。 */
export function pendingInteractionKind(conversation: Record<string, any> | null, hostId: string): string | null {
  return pendingInteraction(conversation, hostId, true)?.kind ?? null;
}

// ---------------------------------------------------------------------------
// hydration 并发编排（原 `b_e`）与分页列表（原 `x_e`）
// ---------------------------------------------------------------------------

/** 并发 ≤2 的批量 hydration（原 `b_e`）。 */
export async function hydrateThreadsConcurrent({
  logger,
  threadIds,
  recentConversationIds,
  conversations,
  isConversationSuppressed,
  shouldApplyHydratedThread = () => true,
  addToRecentConversations,
  includeArchived = false,
  includeTurns = false,
  maxTurns,
  throwOnReadError = false,
  notifyAnyCallbacks,
  shouldAddThreadToRecentConversations = () => true,
  readThread,
  upsertHydratedConversationState,
  notifyAnyConversationCallbacks,
  notifyConversationCallbacks,
}: {
  logger: { warning(message: string, tags: unknown): void };
  threadIds: string[];
  recentConversationIds: string[];
  conversations: Map<string, unknown>;
  isConversationSuppressed: (id: string) => boolean;
  shouldApplyHydratedThread?: () => boolean;
  addToRecentConversations?: boolean;
  includeArchived?: boolean;
  includeTurns?: boolean;
  maxTurns?: number;
  throwOnReadError?: boolean;
  notifyAnyCallbacks?: boolean;
  shouldAddThreadToRecentConversations?: (thread: Record<string, any>) => boolean;
  readThread: (threadId: string, opts: { includeTurns: boolean; maxTurns?: number }) => Promise<Record<string, any>>;
  upsertHydratedConversationState: (conversationId: string, result: Record<string, any>) => void;
  notifyAnyConversationCallbacks: () => void;
  notifyConversationCallbacks: (conversationId: string, opts?: { includeAnyCallbacks?: boolean }) => void;
}): Promise<void> {
  if (threadIds.length === 0) return;
  const inRecent = new Set(recentConversationIds);
  const pending = threadIds.filter((threadId) => {
    const conversationId = threadIdOf(threadId);
    if (!includeArchived && isConversationSuppressed(conversationId)) return false;
    return !conversations.has(conversationId) || includeTurns ? true : addToRecentConversations && !inRecent.has(conversationId);
  });
  const hydrated = new Set<string>();
  const added = new Set<string>();
  const errors: unknown[] = [];
  if (pending.length > 0) {
    const results = Array(pending.length);
    let next = 0;
    await Promise.all(
      Array.from({ length: Math.min(2, pending.length) }, async () => {
        for (;;) {
          const index = next;
          next += 1;
          const threadId = pending[index];
          if (threadId == null || !shouldApplyHydratedThread()) return;
          try {
            results[index] = await readThread(threadId, { includeTurns, ...(maxTurns == null ? {} : { maxTurns }) });
          } catch (error) {
            if (throwOnReadError) errors.push(error);
            else
              logger.warning("Failed to read pinned thread", {
                safe: {},
                sensitive: { threadId, error },
              });
            results[index] = null;
          }
        }
      }),
    );
    for (const result of results) {
      if (result == null || !shouldApplyHydratedThread()) continue;
      const thread = result.response.thread;
      const conversationId = threadIdOf(thread.id);
      if (!includeArchived && isConversationSuppressed(conversationId)) continue;
      if (addToRecentConversations && !inRecent.has(conversationId) && shouldAddThreadToRecentConversations(thread)) {
        inRecent.add(conversationId);
        recentConversationIds.push(conversationId);
      }
      const isNew = !conversations.has(conversationId);
      upsertHydratedConversationState(conversationId, result);
      hydrated.add(conversationId);
      if (isNew) added.add(conversationId);
    }
  }
  for (const conversationId of added) notifyConversationCallbacks(conversationId, { includeAnyCallbacks: false });
  if (notifyAnyCallbacks && hydrated.size > 0) notifyAnyConversationCallbacks();
  if (errors.length > 0) throw errors[0];
}

/** thread/list 全量分页（原 `x_e`）。 */
export async function listAllThreadsPaginated(
  client: { sendRequest(method: string, params: unknown, options?: unknown): Promise<{ data: any[]; nextCursor: string | null }> },
  { modelProviders, archived = false, sourceKinds = DEFAULT_THREAD_SOURCE_KINDS }: { modelProviders: unknown; archived?: boolean; sourceKinds?: unknown },
): Promise<any[]> {
  const all: any[] = [];
  const fetchPage = async (cursor: string | null) => {
    const params = {
      limit: 100,
      cursor,
      sortKey: (client as unknown as { recentConversationsSortKey?: string }).recentConversationsSortKey,
      modelProviders,
      sourceKinds,
      archived,
      useStateDbOnly: (client as unknown as { useStateDbOnly?: boolean }).useStateDbOnly,
    };
    const page = await client.sendRequest("thread/list", params, { priority: "background", source: "thread_list" });
    all.push(...page.data);
    if (page.nextCursor) await fetchPage(page.nextCursor);
  };
  await fetchPage(null);
  return all;
}

// ---------------------------------------------------------------------------
// 会话列表状态 / 新建骨架 / 最近会话 upsert（原 `kv`/`Ov`/`S_e`/`Mv`）
// ---------------------------------------------------------------------------

/** 会话的列表投影（原 `kv`）。 */
export function conversationListState(
  conversation: Record<string, any> | null,
  hostId: string,
  titleState: unknown,
  status: { pendingRequest?: unknown; latestTurnError?: unknown } | null,
): Record<string, unknown> | null {
  if (conversation == null) return null;
  const history = conversation.turnHistory?.kind === "canonical" ? conversation.turnHistory.history : null;
  return {
    titleState,
    summary: {
      conversationId: conversation.id,
      forkedFromId: conversation.forkedFromId,
      hostId: conversation.hostId ?? hostId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      recencyAt: conversation.recencyAt,
      title: conversation.title,
      cwd: conversation.cwd ?? null,
      environments: conversation.environments,
      environmentSelectionEvidence: conversation.environmentSelectionEvidence,
      gitInfo: conversation.gitInfo,
      hasUnreadTurn: conversation.hasUnreadTurn,
      historyMode: conversation.historyMode,
      mode: conversation.mode,
      threadStartKind: conversation.threadStartKind,
      modelProvider: conversation.modelProvider ?? "",
      parentThreadId: conversation.parentThreadId ?? null,
      source: conversation.source ?? null,
      originator: conversation.originator,
      agentNickname: conversation.agentNickname,
      threadSource: conversation.threadSource ?? null,
      threadRuntimeStatus: conversation.threadRuntimeStatus ?? undefined,
      workspaceKind: conversation.workspaceKind ?? "project",
    },
    requests: conversation.requests,
    pendingRequest: status?.pendingRequest ?? null,
    latestTurnError: status?.latestTurnError ?? null,
    isResponseInProgress: lastActiveTurn(conversation as never)?.status === "inProgress",
    unreadMessageCount: conversation.unreadMessageCount ?? 0,
    incompleteHistoryGeneration:
      history != null && (!history.isComplete || history.islands.length !== 1) ? history.generation : null,
    turnsPagination: conversation.turnsPagination,
    resumeState: conversation.resumeState,
    currentPermissions: conversation.currentPermissions,
    workspaceBrowserRoot: conversation.workspaceBrowserRoot,
  };
}

/** thread 模式标注（原 `Av`）。 */
export function withThreadMode(thread: Record<string, any>, threadStartKind: string | null, threadMode: unknown, threadRecognition: unknown): Record<string, any> {
  return { ...thread, mode: threadMode, threadStartKind: threadStartKind ?? "default" };
}

/** projectless 在远端 host 恒不可见（原 `jv`）。 */
export function isProjectlessVisibleOnHost(_conversation: Record<string, any>, _hostId: string): boolean {
  return false;
}

/** 新会话骨架（原 `Ov`）。 */
export function newConversationFromThread({
  thread,
  hostId,
  conversationId,
  turns,
  threadTitle,
  resumeState,
  latestCollaborationMode,
  workspaceKind = "project",
  workspaceBrowserRoot,
  projectlessOutputDirectory,
  hasUnreadTurn,
}: {
  thread: Record<string, any>;
  hostId: string;
  conversationId: string;
  turns: any[];
  threadTitle: string | null;
  resumeState: string;
  latestCollaborationMode: unknown;
  workspaceKind?: string;
  workspaceBrowserRoot?: string | null;
  projectlessOutputDirectory?: string | null;
  hasUnreadTurn?: boolean;
}): Record<string, any> {
  const { createdAt, updatedAt, recencyAt } = threadTimestamps(thread as { createdAt: number; updatedAt: number; recencyAt?: number | null });
  return {
    id: conversationId,
    sessionId: thread.sessionId,
    ephemeral: thread.ephemeral,
    forkedFromId: thread.forkedFromId == null ? null : threadIdOf(thread.forkedFromId),
    hostId,
    turns,
    requests: [],
    createdAt,
    updatedAt,
    recencyAt: recencyAt ?? updatedAt,
    title: threadTitle,
    originator: thread.originator,
    source: thread.source,
    agentNickname: thread.agentNickname,
    threadSource: thread.threadSource,
    historyMode: thread.historyMode,
    canonicalVoiceHistory: hasCanonicalVoice(thread),
    parentThreadId: thread.parentThreadId == null ? null : threadIdOf(thread.parentThreadId),
    mode: thread.mode,
    threadStartKind: thread.threadStartKind,
    modelProvider: thread.modelProvider,
    daybreakEnabled: thread.daybreakEnabled,
    latestModel: thread.model ?? "",
    latestReasoningEffort: thread.reasoningEffort ?? null,
    previousTurnModel: null,
    latestCollaborationMode,
    hasUnreadTurn: hasUnreadTurn ?? false,
    threadRuntimeStatus: thread.status,
    rolloutPath: thread.path ?? "",
    gitInfo: thread.gitInfo,
    resumeState,
    latestTokenUsageInfo: null,
    workspaceKind,
    workspaceBrowserRoot,
    projectlessOutputDirectory,
    cwd: thread.cwd,
    ...environmentSelection(thread as { environments?: unknown[]; updatedAt: number }, undefined, "stored"),
  };
}

export { hasCanonicalVoice };

/** 模型设置回写守卫（原 `Mv`）。 */
export function applyModelSettings(conversation: Record<string, any>, thread: Record<string, any>, modelSettingsAtReadStart: { model: string; reasoningEffort: unknown } | null | undefined): void {
  if (
    conversation.latestThreadSettings == null &&
    (modelSettingsAtReadStart === undefined ||
      (modelSettingsAtReadStart != null &&
        conversation.latestModel === modelSettingsAtReadStart.model &&
        conversation.latestReasoningEffort === modelSettingsAtReadStart.reasoningEffort))
  ) {
    conversation.latestModel = thread.model ?? conversation.latestModel;
    if (thread.reasoningEffort !== undefined) conversation.latestReasoningEffort = thread.reasoningEffort;
  }
}

/** 最近会话 upsert（原 `S_e`）。 */
export function upsertRecentConversationState({
  cachedRecencyAt,
  conversationId,
  conversations,
  getProjectlessOutputDirectory,
  getWorkspaceBrowserRoot,
  getWorkspaceKind,
  hostId,
  setConversation,
  thread,
  threadsById,
  hasUnreadTurn,
  modelSettingsAtReadStart,
  updateConversationState,
}: {
  cachedRecencyAt?: number | null;
  conversationId: string;
  conversations: Map<string, Record<string, any>>;
  getProjectlessOutputDirectory: (id: string) => string | null | undefined;
  getWorkspaceBrowserRoot: () => string | null | undefined;
  getWorkspaceKind: (id: string) => string;
  hostId: string;
  setConversation: (conversation: Record<string, any>) => void;
  thread: Record<string, any>;
  threadsById: Map<string, Record<string, any>>;
  hasUnreadTurn?: boolean;
  modelSettingsAtReadStart?: { model: string; reasoningEffort: unknown } | null;
  updateConversationState: (id: string, recipe: (draft: Record<string, any>) => void) => void;
}): void {
  registerThreadMetadata({ thread, threadsById, conversations, updateConversationState });
  const rawName = thread.name?.trim() ?? "";
  const title = cleanThreadTitle(rawName) || rawName;
  const forkedFromId = thread.forkedFromId == null ? null : threadIdOf(thread.forkedFromId);
  const updatedAtMs = thread.updatedAt * 1e3;
  const updatedAt = Number.isFinite(updatedAtMs) ? updatedAtMs : null;
  const recencyAtMs = thread.recencyAt == null ? null : thread.recencyAt * 1e3;
  const recencyAt = recencyAtMs != null && Number.isFinite(recencyAtMs) ? recencyAtMs : null;
  const status = thread.status ?? null;
  const workspaceKind = getWorkspaceKind(conversationId);
  const workspaceBrowserRoot = getWorkspaceBrowserRoot();
  const projectlessOutputDirectory = getProjectlessOutputDirectory(conversationId);
  if (conversations.has(conversationId)) {
    updateConversationState(conversationId, (draft) => {
      Object.assign(draft, environmentSelection(thread as { environments?: unknown[]; updatedAt: number }, draft, "stored"));
      if (
        draft.resumeState === "needs_resume" &&
        draft.turnHistory?.kind === "canonical" &&
        updatedAt != null &&
        (updatedAt > draft.updatedAt || (updatedAt === draft.updatedAt && !deepEqual(status, draft.threadRuntimeStatus)))
      )
        draft.turnHistory.history.isComplete = false;
      if (!draft.title && title) draft.title = title;
      draft.originator = thread.originator ?? draft.originator;
      draft.source = thread.source;
      draft.agentNickname = thread.agentNickname;
      draft.historyMode = thread.historyMode;
      draft.canonicalVoiceHistory = hasCanonicalVoice(thread);
      draft.mode = thread.mode;
      draft.threadStartKind = thread.threadStartKind;
      draft.threadSource = thread.threadSource ?? draft.threadSource ?? null;
      draft.parentThreadId = thread.parentThreadId == null ? null : threadIdOf(thread.parentThreadId);
      draft.sessionId = thread.sessionId;
      draft.forkedFromId = forkedFromId ?? draft.forkedFromId;
      draft.modelProvider = thread.modelProvider;
      applyModelSettings(draft, thread, modelSettingsAtReadStart);
      if (thread.daybreakEnabled !== undefined) draft.daybreakEnabled = thread.daybreakEnabled;
      draft.hostId = hostId;
      draft.cwd = thread.cwd;
      draft.workspaceKind = workspaceKind;
      draft.workspaceBrowserRoot = workspaceKind === "projectless" ? (workspaceBrowserRoot ?? draft.workspaceBrowserRoot) : null;
      draft.projectlessOutputDirectory = workspaceKind === "projectless" ? (projectlessOutputDirectory ?? draft.projectlessOutputDirectory) : null;
      draft.gitInfo = thread.gitInfo ?? draft.gitInfo;
      const currentRecency = draft.recencyAt ?? draft.updatedAt;
      if (updatedAt != null) draft.updatedAt = updatedAt;
      draft.recencyAt = mergedRecencyAt({ currentRecencyAt: currentRecency, threadRecencyAt: recencyAt, updatedAt: updatedAt ?? draft.updatedAt });
      if (draft.resumeState === "needs_resume") draft.threadRuntimeStatus = status;
    });
    return;
  }
  const createdAtMs = thread.createdAt * 1e3;
  const createdAt = Number.isFinite(createdAtMs) ? createdAtMs : Date.now();
  const permissions = workspaceKind === "projectless" && workspaceBrowserRoot != null ? permissionsForRoots([workspaceBrowserRoot]) : defaultPermissions();
  setConversation({
    id: conversationId,
    sessionId: thread.sessionId,
    forkedFromId,
    hostId,
    turns: [
      {
        params: {
          threadId: conversationId,
          input: [{ type: "text", text: thread.preview, text_elements: [] }],
          cwd: null,
          approvalPolicy: "on-request",
          sandboxPolicy: (permissions as { sandboxPolicy: unknown }).sandboxPolicy,
          model: "",
          effort: null,
          summary: "none",
          personality: null,
          outputSchema: null,
          collaborationMode: null,
        },
        turnId: null,
        turnStartedAtMs: null,
        durationMs: null,
        finalAssistantStartedAtMs: null,
        status: "completed",
        error: null,
        diff: null,
        items: [],
      },
    ],
    requests: [],
    createdAt,
    updatedAt: updatedAt ?? createdAt,
    recencyAt: mergedRecencyAt({ currentRecencyAt: cachedRecencyAt, threadRecencyAt: recencyAt, updatedAt: updatedAt ?? createdAt }),
    title: title || null,
    originator: thread.originator,
    source: thread.source,
    agentNickname: thread.agentNickname,
    threadSource: thread.threadSource,
    historyMode: thread.historyMode,
    canonicalVoiceHistory: hasCanonicalVoice(thread),
    parentThreadId: thread.parentThreadId == null ? null : threadIdOf(thread.parentThreadId),
    mode: thread.mode,
    threadStartKind: thread.threadStartKind,
    modelProvider: thread.modelProvider,
    daybreakEnabled: thread.daybreakEnabled,
    latestModel: thread.model ?? "",
    latestReasoningEffort: thread.reasoningEffort ?? null,
    previousTurnModel: null,
    latestCollaborationMode: {
      mode: "default",
      settings: { reasoning_effort: null, model: "", developer_instructions: null },
    },
    hasUnreadTurn: hasUnreadTurn ?? false,
    threadGoal: null,
    threadRuntimeStatus: status,
    rolloutPath: thread.path ?? "",
    gitInfo: thread.gitInfo,
    resumeState: "needs_resume",
    latestTokenUsageInfo: null,
    workspaceKind,
    workspaceBrowserRoot,
    projectlessOutputDirectory,
    cwd: thread.cwd,
    ...environmentSelection(thread as { environments?: unknown[]; updatedAt: number }, undefined, "stored"),
  });
}

// ---------------------------------------------------------------------------
// transcript 快照与增量（原 `C_e`/`Nv`/`w_e`/`Pv`/`Fv`）
// ---------------------------------------------------------------------------

function itemSlotKey(entityKey: string, itemId: string): string {
  return JSON.stringify([entityKey, itemId]);
}

/** transcript 的 item 槽位表（原 `Fv`）。 */
export function itemSlots(items: Array<Record<string, any> | null>): { length: number; entries: Array<{ index: number; itemId: string }> } {
  const entries: Array<{ index: number; itemId: string }> = [];
  items.forEach((item, index) => {
    if (item != null) entries.push({ index, itemId: item.id });
  });
  return { length: items.length, entries };
}

/** transcript 全量快照（原 `Nv`）。 */
export function transcriptSnapshot(conversation: Record<string, any>, access: {
  turnEntityKeys(conversation: Record<string, any>): string[];
  turn(conversation: Record<string, any>, entityKey: string): Record<string, any> | null;
  hasSubagentActivity(conversation: Record<string, any>, entityKey: string): boolean;
  timeline(conversation: Record<string, any>): unknown;
}): Record<string, any> {
  const entityKeys = access.turnEntityKeys(conversation);
  const turnsByKey: Record<string, unknown> = {};
  const itemsByKey: Record<string, any> = {};
  for (const entityKey of entityKeys) {
    const turn = access.turn(conversation, entityKey);
    if (turn == null) continue;
    const { items, ...details } = turn;
    turnsByKey[entityKey] = { details, hasSubagentActivity: access.hasSubagentActivity(conversation, entityKey), itemSlots: itemSlots(items as any[]) };
    for (const item of items as any[]) if (item != null) itemsByKey[itemSlotKey(entityKey, item.id)] = item;
  }
  return {
    ...historyStateOf(conversation),
    itemTimeline: conversation.itemTimeline ?? null,
    realtimeItems: conversation.realtimeItems ?? {},
    timeline: access.timeline(conversation),
    turnEntityKeys: entityKeys,
    turnsByKey,
    itemsByKey,
  };
}

/** 历史完成状态（原 `Pv`）。 */
export function historyStateOf(conversation: Record<string, any>): { historyComplete: boolean; compactHistoryComplete: boolean | null } {
  return {
    historyComplete: hasCompleteHistory(conversation as never),
    compactHistoryComplete:
      conversation.turnsPagination?.source === "compact" ? conversation.turnsPagination.hasLoadedOldest : null,
  };
}

/** transcript 增量（原 `w_e`）：无变化返回 null，否则返回 changes 列表。 */
export function transcriptChanges(
  key: { hostId: string; threadId: string },
  previous: Record<string, any> | null,
  next: Record<string, any>,
  access: {
    turnEntityKeys(conversation: Record<string, any>): string[];
    turn(conversation: Record<string, any>, entityKey: string): Record<string, any> | null;
    hasSubagentActivity(conversation: Record<string, any>, entityKey: string): boolean;
    timeline(conversation: Record<string, any>): unknown;
  },
  patches: Array<{ op: string; path: unknown[] }> | undefined,
  changedItems: Array<{ entityKey: string; itemId: string }> | undefined,
  acceptedTranscriptText: { turnEntityKeys: Iterable<string> } | undefined,
): { type: string; value?: unknown; changes?: unknown[] } | null {
  if (
    previous != null &&
    previous.turns === next.turns &&
    previous.turnHistory === next.turnHistory &&
    previous.turnsPagination === next.turnsPagination &&
    previous.resumeState === next.resumeState &&
    previous.itemTimeline === next.itemTimeline &&
    previous.realtimeItems === next.realtimeItems
  )
    return null;
  if (previous == null || (patches == null && changedItems == null && acceptedTranscriptText == null))
    return { type: "reset", value: transcriptSnapshot(next, access) };
  const changes: Array<Record<string, unknown>> = [];
  // —— itemTimeline 增量 ——
  if (previous.itemTimeline !== next.itemTimeline) {
    const before = previous.itemTimeline;
    const after = next.itemTimeline;
    const timelinePatches = patches?.filter(({ path }) => path[0] === "itemTimeline");
    if (
      before != null &&
      after != null &&
      timelinePatches?.length &&
      timelinePatches.every(({ op, path }) => op !== "remove" && path[1] === "entries" && typeof path[2] == "number")
    ) {
      const indices = new Set<number>();
      for (const { path } of timelinePatches) if (typeof path[2] == "number") indices.add(path[2] as number);
      for (const index of indices) changes.push({ type: "item-timeline-entry", index, entry: after.entries[index] });
    } else if (
      before != null &&
      after != null &&
      after.entries.length > before.entries.length &&
      before.entries.every((entry: unknown, i: number) => entry === after.entries[i + after.entries.length - before.entries.length])
    ) {
      changes.push({
        type: "item-timeline-prepend",
        entries: after.entries.slice(0, after.entries.length - before.entries.length),
        activeRealtimeSessionAtPageStart: after.activeRealtimeSessionAtPageStart,
      });
    } else {
      changes.push({ type: "item-timeline", value: after ?? null });
    }
  }
  // —— realtimeItems 增量 ——
  const realtimeIds = new Set<string>();
  for (const { path } of patches ?? []) {
    if (path[0] === "realtimeItems") {
      if (typeof path[1] == "string") realtimeIds.add(path[1]);
      else {
        for (const id of Object.keys(previous.realtimeItems ?? {})) realtimeIds.add(id);
        for (const id of Object.keys(next.realtimeItems ?? {})) realtimeIds.add(id);
      }
    }
  }
  for (const id of realtimeIds) {
    const before = previous.realtimeItems?.[id];
    const after = next.realtimeItems?.[id];
    if (before !== after) {
      if (
        before?.item.type === "transcriptSegment" &&
        after?.item.type === "transcriptSegment" &&
        before.completed === after.completed &&
        after.item.text.startsWith(before.item.text)
      ) {
        changes.push({ type: "realtime-text", itemId: id, delta: after.item.text.slice(before.item.text.length) });
      } else {
        changes.push({ type: "realtime-item", itemId: id, value: after ?? null });
      }
    }
  }
  // —— turn/item 槽位增量 ——
  const turnItemChanges = new Map<string, Set<number> | "all">();
  let structureChanged = false;
  const allChanges = [...changes, ...((acceptedTranscriptText as { changes?: unknown[] } | undefined)?.changes ?? [])];
  for (const entityKey of ((acceptedTranscriptText as { turnEntityKeys?: string[] } | undefined)?.turnEntityKeys ?? []))
    turnItemChanges.set(entityKey, new Set());
  for (const { entityKey, itemId } of changedItems ?? []) {
    if (acceptedTranscriptText != null) continue;
    const index = access.turn(next, entityKey)?.items.findIndex((item: any) => item?.id === itemId) ?? -1;
    const existing = turnItemChanges.get(entityKey);
    if (existing === "all") continue;
    const indices = existing ?? new Set<number>();
    if (index >= 0) indices.add(index);
    turnItemChanges.set(entityKey, indices);
  }
  for (const patch of patches ?? []) {
    const { path } = patch;
    let entityKey: string | null = null;
    let itemsIndex: number | null = null;
    if (path[0] === "turns") {
      if (next.turnHistory?.kind === "canonical") continue;
      const turnIndex = path[1];
      if (typeof turnIndex != "number" || path.length < 3 || path[2] === "turnId") {
        structureChanged = true;
        continue;
      }
      const turn = next.turns[turnIndex] ?? previous.turns[turnIndex];
      if (turn == null) {
        structureChanged = true;
        continue;
      }
      entityKey = turn.turnId == null ? `legacy:${turnIndex}` : `turn:${turn.turnId}`;
      itemsIndex = 2;
    } else if (path[0] === "turnHistory") {
      if (path[1] !== "history" || path[2] !== "entitiesByKey" || typeof path[3] != "string" || path.length < 5) {
        structureChanged = true;
        continue;
      }
      entityKey = path[3] as string;
      itemsIndex = 4;
    } else continue;
    if (!turnItemChanges.has(entityKey)) turnItemChanges.set(entityKey, new Set());
    if (path[itemsIndex as number] !== "items" || acceptedTranscriptText != null) continue;
    const itemIndex = path[(itemsIndex as number) + 1];
    if (typeof itemIndex != "number" || patch.op === "remove") turnItemChanges.set(entityKey, "all");
    else {
      const existing = turnItemChanges.get(entityKey);
      if (existing !== "all") (existing as Set<number>)?.add(itemIndex);
    }
  }
  for (const entityKey of turnItemChanges.keys()) {
    if (access.turn(previous, entityKey) == null || access.turn(next, entityKey) == null) structureChanged = true;
  }
  if (structureChanged) {
    const previousKeys = access.turnEntityKeys(previous);
    const nextKeys = access.turnEntityKeys(next);
    const nextKeySet = new Set(nextKeys);
    for (const entityKey of previousKeys)
      if (!nextKeySet.has(entityKey))
        allChanges.push({ type: "remove-turn", key: { ...key, entityKey } });
    for (const entityKey of nextKeys)
      if (access.turn(previous, entityKey) !== access.turn(next, entityKey)) turnItemChanges.set(entityKey, "all");
    allChanges.push({ type: "structure", timeline: access.timeline(next), turnEntityKeys: nextKeys });
  }
  if (
    structureChanged ||
    patches?.some(({ path }) => path[0] === "turnsPagination" || path[0] === "resumeState" || path.includes("itemsPagination"))
  ) {
    allChanges.push({ type: "history", ...historyStateOf(next) });
  }
  for (const [entityKey, indices] of turnItemChanges) {
    const turn = access.turn(next, entityKey);
    if (turn == null) continue;
    const previousTurn = access.turn(previous, entityKey);
    const { items, ...details } = turn;
    const { items: previousItems, ...previousDetails } = previousTurn ?? { items: [] };
    const hasSubagentActivity = access.hasSubagentActivity(next, entityKey);
    if (!deepEqual(details, previousDetails) || hasSubagentActivity !== access.hasSubagentActivity(previous, entityKey)) {
      allChanges.push({ type: "turn", key: { ...key, entityKey }, details, hasSubagentActivity });
    }
    if (
      previousTurn == null ||
      items.length !== previousItems.length ||
      (indices === "all"
        ? !deepEqual(itemSlots(items as any[]), itemSlots(previousItems as any[]))
        : [...(indices as Set<number>)].some((i) => (items[i] as any)?.id !== (previousItems[i] as any)?.id))
    ) {
      if (previousTurn != null && indices !== "all" && items.length > previousItems.length && [...(indices as Set<number>)].every((i) => i >= previousItems.length)) {
        allChanges.push({
          type: "item-slots-append",
          key: { ...key, entityKey },
          previousLength: previousItems.length,
          length: items.length,
          entries: itemSlots(items.slice(previousItems.length) as any[]).entries.map(({ index, itemId }) => ({
            index: index + previousItems.length,
            itemId,
          })),
        });
      } else {
        const slots = itemSlots(items as any[]);
        allChanges.push({ type: "item-slots", key: { ...key, entityKey }, slots });
        const present = new Set(slots.entries.map(({ itemId }) => itemId));
        for (const item of previousItems as any[])
          if (item != null && !present.has(item.id)) allChanges.push({ type: "item", key: { ...key, entityKey, itemId: item.id }, value: null });
      }
    }
    if (indices === "all") {
      items.forEach((item: any, index: number) => {
        if (item != null && item !== (previousItems as any[])[index])
          allChanges.push({ type: "item", key: { ...key, entityKey, itemId: item.id }, value: item });
      });
    } else {
      for (const index of indices as Set<number>) {
        const item = items[index] as any;
        if (item != null && item !== (previousItems as any[])[index])
          allChanges.push({ type: "item", key: { ...key, entityKey, itemId: item.id }, value: item });
      }
    }
  }
  const filtered = allChanges.filter(
    (change) =>
      ((change as { type?: string }).type !== "text" && (change as { type?: string }).type !== "text-parts") ||
      turnItemChanges.get(((change as { key?: { entityKey?: string } }).key ?? { entityKey: "" }).entityKey ?? "") !== "all",
  );
  return filtered.length === 0 ? null : { type: "changes", changes: filtered };
}

// ---------------------------------------------------------------------------
// Fg（最后活跃 turn）与 he（失败重试缓存）
// ---------------------------------------------------------------------------

/** 最后一个带 turnId 或非终态的 turn（原 `Fg`）。 */
export function lastActiveTurn(conversation: Record<string, any> | null): Record<string, any> | null {
  if (conversation == null) return null;
  const turns = conversationTurns(conversation as never) as any[];
  for (let i = turns.length - 1; i >= 0; --i) {
    const turn = turns[i];
    if (turn.turnId != null || (turn.status !== "completed" && turn.status !== "failed")) return turn;
  }
  return null;
}

const RETRY_BACKOFF_MS = 60_000;

/** 失败后短时缓存的查找（原 `he`）：null 结果/可重试错误在退避期内直接复用。 */
export class RetryLookupCache<T> {
  lookups = new Map<string, { retryAtMs: number; promise: Promise<T | null> }>();
  nextPruneAtMs = 0;

  constructor(private isRetryable: (error: unknown) => boolean) {}

  read(key: string, load: () => Promise<T | null>): Promise<T | null> {
    const now = Date.now();
    if (now >= this.nextPruneAtMs) {
      this.nextPruneAtMs = now + RETRY_BACKOFF_MS;
      for (const [cachedKey, entry] of this.lookups) if (entry.retryAtMs <= now) this.lookups.delete(cachedKey);
    }
    const cached = this.lookups.get(key);
    if (cached != null && cached.retryAtMs > now) return cached.promise;
    const entry = {
      retryAtMs: Number.POSITIVE_INFINITY,
      promise: Promise.resolve()
        .then(load)
        .then(
          (result) => {
            if (result == null) entry.retryAtMs = Date.now() + RETRY_BACKOFF_MS;
            else if (this.lookups.get(key) === entry) this.lookups.delete(key);
            return result;
          },
          (error) => {
            throw (
              this.isRetryable(error)
                ? (entry.retryAtMs = Date.now() + RETRY_BACKOFF_MS)
                : this.lookups.get(key) === entry && this.lookups.delete(key),
              error
            );
          },
        ),
    };
    this.lookups.set(key, entry as never);
    return entry.promise;
  }

  delete(key: string) {
    this.lookups.delete(key);
  }

  clear() {
    this.lookups.clear();
  }
}
