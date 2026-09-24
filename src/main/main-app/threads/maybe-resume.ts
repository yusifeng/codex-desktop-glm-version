// maybeResumeConversation —— resume 状态机巨函数（原版 Wye，43,549-44,464）
// + resume 辅助（Fx/Ix/Lx/Gye/Kye/Rx/zx/Uye/zye/Rye/Px/xx/Dye/Sx/Oye/kye/
// Cx/Ox/Ax/Nx/Ny，43,394-43,548 + 44,465-44,555 + 42,907-42,945）。
//
// 流程（每个 await 之后都复查 isCurrentResumeAttempt——取消正确性的核心）：
//   1. 前置检查：窗口活跃性（无流角色且不可获所有权 → inactive-window）；
//   2. 未装载会话的骨架构造：catalog 读取 / knownCatalogEntry / 摘要
//      （V_ 骨架 + setConversation）；
//   3. follower 且未 resumed → owner-recovering（等待 owner 恢复）；
//      已 resumed 且本进程有流角色 → 直接 ready；
//   4. 并行预取：thread 可写根（Kye）+ workspace 加载 + 元数据读取；
//   5. 权限派生：显式 permissions → latestThreadSettings → 末 turn params
//      （inferred 除外）→ currentPermissions → 默认（n.kd/n.Od），来源用
//      Rx 标注；projectless 工作区根合并（Gye/Ax/Nx/Ox）；
//   6. i.prepare → start 配置（ge）；bounded cloud history（durable +
//      useBoundedCloudHistory）时 j_ 预取历史；
//   7. follower 无独立历史 → 恢复为 resumed 直接返回；
//   8. 抢占 owner 流角色；组装 thread/resume 请求（权限/审查者/配置按
//      派生结果决定是否携带）；Uye 发送（writer-closing 重试 + 超时加倍）；
//   9. 历史装载：compact（Pe）/ paginated（Rye 游标 + w_）/ timeline（P_）
//      / durable（N_）/ turns 页回退 / legacy readThread 全量；
//  10. 合并应用（Cg/m_/p_/Hge/Ug）+ 状态落地（cwd/权限/标题/模型设置）；
//      thread goal 水合（确认弹窗或后台）；
//  11. 成功：广播快照 + 尾部历史 drain（Fx）；失败：writer-conflict →
//      zye 恢复，「session ... is archived.」→ suppress，其余回滚
//      resumeState = needs_resume 后重抛。

import {
  $u as normalizeThreadId,
  Od as defaultSandboxPolicy,
  Zo as errorMessage,
  _l as normalizePath,
  _s as DURABLE_HOST_ID,
  bl as isRootLikePath,
  kd as defaultPermissions,
  xl as isPosixAbsolutePath,
  Of as zString,
  wf as zObject,
} from "@chunk/shared";
import { deepEqual } from "../util/lodash-interop";
// nx（projectless Documents/Codex 路径识别）：定义于 workspace 配置簇
// （42,206-42,478，尚未重写）。
import { nx as isDocumentsCodexPath } from "../workspace/config";
import {
  applyCanonicalTurns,
  applyConversationTurns,
  conversationTurns,
  lastTurnWithTurnId,
  type AnyTurn,
} from "../turns/canonical-history";
import {
  applyTimelinePage,
  fetchTurnsWithItems,
  listDurableTurnsWithItems,
  listTimelineTurns,
  mergeResumeTurns,
  reconcileResumeTurns,
  THREAD_HISTORY_REQUEST_TIMEOUT_MS,
} from "../turns/history-requests";
import { mergeTurnLists } from "../turns/item-merge";
// zv/Bv/Vv（线程设置应用与设置摘要）：定义于 patch 分类簇
// （36,470-36,760，尚未重写）。
import {
  zv as applyThreadSettingsUpdate,
  Bv as threadSettingsFromResumeResponse,
  Vv as permissionSettingsSummary,
} from "./patch-classification";
import {
  cleanThreadTitle,
  conversationFromThreadSummary,
  environmentSelection,
  mergedRecencyAt,
  threadTimestamps,
} from "./projection";
import { hasCanonicalVoiceHistory } from "./automation-detector";

/** resume 请求参数（原版 params r）。 */
export interface MaybeResumeParams {
  conversationId: string;
  model?: string | null;
  serviceTier?: string | null;
  reasoningEffort?: string | null;
  workspaceRoots: string[];
  permissions?: any;
  collaborationMode?: any;
  showThreadGoalResumeConfirmation?: boolean;
  trace?: any;
  knownCatalogEntry?: any;
  threadAccess?: string;
  startupResume?: boolean;
}

/** manager 面（R4 conversation manager 的 resume 相关子集，宽松类型）。 */
export interface MaybeResumeManager {
  getConversation(conversationId: string): any;
  getHostId(): string;
  getWindowActivity(): any;
  getStreamRole(conversationId: string): { role: string } | null;
  getThreadSummaries(): any[];
  getThreadHasUnreadTurn(conversationId: string): boolean;
  getThreadWorkspaceState(conversationId: string): { applied: any } | null;
  setConversation(conversation: any): void;
  setConversationStreamRole(conversationId: string, role: any): void;
  updateConversationState(conversationId: string, updater: (draft: any) => void): void;
  ensureRecentConversationId(conversationId: string): void;
  logger: any;
  useTailHydration(): boolean;
  readThread(conversationId: string, options: any): Promise<any>;
  readShellEnvironmentPolicy(cwd: string | null, config: any): Promise<any>;
  sendRequest(method: string, params: any, options?: any): Promise<any>;
  supportsPaginatedThreadHistory(): boolean;
  supportsThreadTimeline(): boolean;
  getConversationTurnItemLimit(conversationId: string): number;
  listThreadTurns(conversationId: string, options: any): Promise<any>;
  beginResumeNotificationBuffer(conversationId: string): void;
  releaseResumeNotificationBuffer(conversationId: string): void;
  beginThreadGoalHydration(conversationId: string): any;
  isCurrentThreadGoalHydration(conversationId: string, hydration: any): boolean;
  endThreadGoalHydration(conversationId: string, hydration: any): boolean;
  broadcastConversationSnapshot(conversationId: string): void;
  acceptConversationHistory(conversationId: string, history: any): void;
  suppressArchivedConversation(conversationId: string): void;
  suppressResumeHistoryDrain(): boolean;
  getThreadWritableRoots(conversationId: string): Promise<string[]>;
  canonicalTurnHistory: boolean;
  [key: string]: unknown;
}

/** product 适配面（装配注入）。 */
export interface MaybeResumeProduct {
  readCatalogEntry(hostId: string, threadId: string): Promise<any> | undefined;
  useBoundedCloudHistory: boolean;
  beginHydration?(input: any): any;
  prepare(input: any): Promise<any>;
  getThreadStartKind(thread: any): string | null;
  workspace: {
    projectlessPathSentinel: string;
    getWritableRoot(sandboxPolicy: any): string | null;
    getCwd(input: any): string | null;
    getSandboxPolicy(input: any): any;
    arePathsEquivalent(a: string, b: string): boolean;
  };
  history: { mapResumeResponse(response: any, context: any): AnyTurn[] };
  [key: string]: unknown;
}

/** workspace 适配面。 */
export interface MaybeResumeWorkspace {
  load(force: boolean): Promise<boolean>;
  getThreadWorkspaceKind(conversationId: string, thread: any): string;
  getThreadWorkspaceBrowserRoot(thread: any): string | null;
  getThreadProjectlessOutputDirectory(conversationId: string, thread: any): string | null;
}

/** 历史策略面。 */
export interface MaybeResumeHistoryPolicy {
  mapThreadTurns(input: any): AnyTurn[];
  turnMergePolicy: any;
  createSearchIslandId: () => string;
}

// ---------------------------------------------------------------------------
// resume 辅助（原版 42,907-42,945 / 43,394-43,548 / 44,465-44,555）
// ---------------------------------------------------------------------------

/** Windows 盘符/UNC 路径判定（原版 Oye）。 */
function isWindowsOrUncPath(path: string): boolean {
  return /^[a-zA-Z]:\//.test(path) || path.startsWith(`//`);
}

/** 盘符根（`C:/`）判定（原版 kye）。 */
function isDriveRoot(path: string): boolean {
  return /^[a-zA-Z]:\/$/.test(path);
}

/** 路径规范化比较形态（原版 Sx）：反斜杠→斜杠、去尾分隔（保留盘符根）、
 *  Windows/UNC 路径小写化。 */
function normalizedPathForm(path: string): string {
  let normalized = path.replaceAll(`\\`, `/`);
  for (; normalized.length > 1 && normalized.endsWith(`/`) && !isDriveRoot(normalized); )
    normalized = normalized.slice(0, -1);
  return isWindowsOrUncPath(normalized) ? normalized.toLowerCase() : normalized;
}

/** requested 是否与 actual 同根或为其子路径（原版 Dye）。 */
function isSameOrUnder(requested: string, actual: string): boolean {
  let requestedForm = normalizedPathForm(requested);
  let actualForm = normalizedPathForm(actual);
  return requestedForm === actualForm || requestedForm.startsWith(`${actualForm}/`);
}

/**
 * resume 的 cwd 冲突裁决（原版 xx）：请求 cwd 与响应/线程 cwd 同根时保留
 * 请求值（用户意图优先），否则按 响应 → 线程 → 请求 → fallback 取首个。
 */
export function resolveResumeCwd({
  requestedCwd,
  responseCwd,
  threadCwd,
  fallbackCwd,
}: {
  requestedCwd: string | null;
  responseCwd: string | null;
  threadCwd: string | null;
  fallbackCwd?: string | null;
}): string | undefined {
  let effective = responseCwd || threadCwd;
  if (requestedCwd != null && effective != null && isSameOrUnder(requestedCwd, effective))
    return requestedCwd;
  return effective || requestedCwd || fallbackCwd || void 0;
}

/**
 * 权限合成（原版 Cx）：派生权限 + 恢复响应的 sandbox/profile 合并——
 * 派生侧无 profile 且当前是 :danger-full-access 时沿用；响应侧的
 * 非内置 profile 可作为派生侧缺省。
 */
export function mergePermissionSettings(derived: any, response: any): any {
  let responseProfile = response?.activePermissionProfile;
  return response != null && derived.activePermissionProfile == null && responseProfile?.id === `:danger-full-access`
    ? response
    : {
        activePermissionProfile:
          derived.activePermissionProfile ?? (responseProfile != null && !responseProfile.id.startsWith(`:`) ? responseProfile : null),
        runtimeWorkspaceRoots: derived.runtimeWorkspaceRoots,
        approvalPolicy: derived.approvalPolicy,
        approvalsReviewer: derived.approvalsReviewer,
        sandboxPolicy: derived.sandbox,
      };
}

/** 数组并集（保序，原版 Nx）。 */
export function mergeRootLists(existing: string[], incoming: string[]): string[] {
  let merged = [...existing];
  for (let root of incoming) if (!merged.includes(root)) merged.push(root);
  return merged;
}

/** workspaceWrite 的可写根并入额外根（原版 Ox）。 */
export function expandWritableRoots(sandboxPolicy: any, extraRoots: string[]): any {
  if (sandboxPolicy.type !== `workspaceWrite`) return sandboxPolicy;
  let writableRoots = mergeRootLists(sandboxPolicy.writableRoots, extraRoots);
  return writableRoots.length === sandboxPolicy.writableRoots.length
    ? sandboxPolicy
    : { ...sandboxPolicy, writableRoots };
}

/** cwd 形态（类 Unix / Windows 带盘符）判定（原版 jx）。 */
function isAbsoluteLikelyPath(path: string): boolean {
  return isRootLikePath(path) || isPosixAbsolutePath(path);
}

/** POSIX 绝对路径（非 UNC）判定（原版 Mx）。 */
function isPosixNonUnc(path: string): boolean {
  return path.startsWith(`/`) && !path.startsWith(`//`);
}

/** 与 cwd 同形态的根过滤（原版 Ax）：cwd 是 Windows 形态时只留 Windows 根，
 *  POSIX 形态只留 POSIX 根。 */
export function filterRootsMatchingCwd(cwd: string | null, roots: string[]): string[] {
  if (cwd == null) return [];
  let cwdIsWindowsForm = isAbsoluteLikelyPath(cwd);
  let cwdIsPosixForm = isPosixNonUnc(cwd);
  if (!cwdIsWindowsForm && !cwdIsPosixForm) return [];
  return roots.filter((root) => (cwdIsWindowsForm ? isAbsoluteLikelyPath(root) : isPosixNonUnc(root)));
}

/** thread goal 状态是否需要 resume 确认（原版 Ny）。 */
export function threadGoalNeedsConfirmation(status: string): boolean {
  switch (status) {
    case `active`:
    case `budgetLimited`:
    case `complete`:
      return false;
    case `paused`:
    case `blocked`:
    case `usageLimited`:
      return true;
  }
}

/** writer 冲突判定（原版 Px）。 */
export function isWriterConflictError(error: unknown): boolean {
  let message = errorMessage(error)?.toLowerCase() ?? ``;
  return (
    message.includes(`already has an active writer`) || message.includes(`already has an live local writer`.replace(`an live`, `a live`))
  );
}

/** 权限来源标注（原版 Rx）。 */
export function permissionSourceLabel(
  explicit: boolean,
  threadSettings: boolean,
  latestTurn: boolean,
  currentPermissions: boolean,
): string {
  return explicit
    ? `explicit_permissions`
    : threadSettings
      ? `thread_settings`
      : latestTurn
        ? `latest_turn`
        : currentPermissions
          ? `current_permissions`
          : `default`;
}

/** sandbox 策略摘要（脱敏，原版 zx）。 */
export function sandboxPolicySummary(policy: any): any {
  switch (policy.type) {
    case `dangerFullAccess`:
      return {
        type: policy.type,
        networkAccess: null,
        writableRootCount: 0,
        excludeTmpdirEnvVar: null,
        excludeSlashTmp: null,
      };
    case `readOnly`:
    case `externalSandbox`:
      return {
        type: policy.type,
        networkAccess: policy.networkAccess,
        writableRootCount: 0,
        excludeTmpdirEnvVar: null,
        excludeSlashTmp: null,
      };
    case `workspaceWrite`:
      return {
        type: policy.type,
        networkAccess: policy.networkAccess,
        writableRootCount: policy.writableRoots.length,
        excludeTmpdirEnvVar: policy.excludeTmpdirEnvVar,
        excludeSlashTmp: policy.excludeSlashTmp,
      };
  }
}

/** 预取线程可写根（失败告警返回空，原版 Kye）。 */
async function loadThreadWritableRoots(manager: MaybeResumeManager, conversationId: string): Promise<string[]> {
  try {
    return await manager.getThreadWritableRoots(conversationId);
  } catch (error) {
    manager.logger.warning(`Failed to load thread writable roots before resume`, {
      safe: { conversationId },
      sensitive: { error },
    });
    return [];
  }
}

/** 首根去重（原版 Ix）：首根等于哨兵值时只留其余根。 */
function primaryRootFirst(cwd: string | null | undefined, roots: string[], sentinel: string): string[] {
  let rest = roots.filter((root) => root !== sentinel);
  return cwd == null || cwd === `` || cwd === sentinel ? rest : [cwd, ...rest.filter((root) => root !== cwd)];
}

/** projectless 的 fallback cwd（原版 Lx）：工作区不是 projectless 或无 cwd
 *  时原样返回；cwd 与线程 cwd 相同（规范化后）时返回 null（避免重复根）。 */
function projectlessFallbackCwd(
  conversation: any,
  fallbackCwd: string | null,
  sentinel: string,
): string | null {
  if (fallbackCwd == null || fallbackCwd === sentinel) return null;
  if (conversation?.workspaceKind !== `projectless` || conversation.cwd == null) return fallbackCwd;
  return normalizePath(fallbackCwd).replace(/\/+$/, ``) === normalizePath(conversation.cwd).replace(/\/+$/, ``)
    ? null
    : fallbackCwd;
}

/** projectless 的运行时工作区根（原版 Gye）。 */
function projectlessRuntimeRoots({
  conversation,
  projectlessPathSentinel,
  projectlessWorkspaceWriteRoot,
  resumeCwd,
  resumeWorkspaceRoots,
}: {
  conversation: any;
  projectlessPathSentinel: string;
  projectlessWorkspaceWriteRoot: string | null;
  resumeCwd: string | null;
  resumeWorkspaceRoots: string[];
}): string[] {
  if (conversation?.workspaceKind !== `projectless`) return resumeWorkspaceRoots;
  if (conversation.workspaceBrowserRoot != null && conversation.workspaceBrowserRoot !== projectlessPathSentinel)
    return [conversation.workspaceBrowserRoot];
  if (projectlessWorkspaceWriteRoot == null)
    return resumeCwd != null && resumeCwd !== projectlessPathSentinel && resumeCwd !== conversation.cwd
      ? [resumeCwd]
      : [];
  return [projectlessWorkspaceWriteRoot];
}

/** paginated resume 游标（原版 Lye/Rye）。 */
const paginatedHistoryCursorSchema = zObject({
  itemsBackwardsCursor: zString().nullable(),
  turnsBackwardsCursor: zString().nullable(),
});

function parsePaginatedHistoryCursor(response: any): {
  itemsBackwardsCursor: string | null;
  turnsBackwardsCursor: string | null;
} {
  return paginatedHistoryCursorSchema.parse(response);
}

/**
 * 发送 thread/resume（原版 Uye）：「thread is closing」错误按 750ms×2^n
 * 重试（≤4 次）；无显式超时的 Timeout 错误把超时加倍重试（≤2 次）；
 * 重试期间 resume 尝试失效返回 null。
 */
async function sendResumeRequest({
  sendRequest,
  request,
  options,
  schedule,
  isCurrentResumeAttempt,
  setRetryCleanup,
}: {
  sendRequest: (method: string, params: any, options?: any) => Promise<any>;
  request: any;
  options: any;
  schedule: (callback: () => void, delayMs: number) => () => void;
  isCurrentResumeAttempt: () => boolean;
  setRetryCleanup: (cleanup: () => void) => void;
}): Promise<any> {
  let timeoutDoublingAttempts = 0;
  let closingRetryAttempts = 0;
  for (; isCurrentResumeAttempt(); )
    try {
      return await sendRequest(`thread/resume`, request, {
        ...options,
        timeoutMs: options.timeoutMs ?? 12e4 * 2 ** timeoutDoublingAttempts,
      });
    } catch (error) {
      let message = errorMessage(error);
      let isThreadClosing = message?.includes(
        `thread ${request.threadId} is closing; retry thread/resume after the thread is closed`,
      );
      let isDefaultTimeout = message === `Timeout` && options.timeoutMs == null;
      let retryDelayMs = 750;
      if (isThreadClosing && closingRetryAttempts < 4) {
        retryDelayMs *= 2 ** closingRetryAttempts;
        closingRetryAttempts += 1;
      } else if (isDefaultTimeout && timeoutDoublingAttempts < 2) timeoutDoublingAttempts += 1;
      else throw error;
      if (!isCurrentResumeAttempt()) return null;
      await new Promise<void>((resolve) => {
        let cancelTimer = schedule(resolve, retryDelayMs);
        setRetryCleanup(() => {
          cancelTimer();
          resolve();
        });
      });
    }
  return null;
}

/** writer 冲突后的历史抢救（原版 zye）：timeline 或 turns+items 重读并整体替换。 */
async function recoverWriterConflictedHistory(
  manager: MaybeResumeManager,
  {
    conversationId,
    isCurrentResumeAttempt,
    mapThreadTurns,
    requestOptions,
    thread,
    turnMergePolicy,
    workspaceRoots,
  }: {
    conversationId: string;
    isCurrentResumeAttempt: () => boolean;
    mapThreadTurns: (input: any) => AnyTurn[];
    requestOptions: any;
    thread: any;
    turnMergePolicy: any;
    workspaceRoots: string[];
  },
): Promise<void> {
  let page = manager.supportsThreadTimeline()
    ? await listTimelineTurns(manager as any, conversationId, null, requestOptions)
    : await fetchTurnsWithItems(
        manager as any,
        manager.getConversationTurnItemLimit(conversationId),
        turnMergePolicy,
        conversationId,
        null,
        null,
        5,
        requestOptions,
      );
  if (!isCurrentResumeAttempt()) return;
  let conversation = manager.getConversation(conversationId);
  let mappedTurns = mapThreadTurns({
    threadId: conversationId,
    turns: page.response.data.slice().reverse(),
    model: conversation?.latestModel ?? ``,
    reasoningEffort: conversation?.latestReasoningEffort ?? null,
    cwd: thread.cwd || conversation?.cwd || workspaceRoots[0] || `/`,
    permissions: defaultPermissions(workspaceRoots),
    itemsPaginationByTurnId: page.itemsPaginationByTurnId,
  });
  let nextCursor = page.response.nextCursor;
  let oldestLoadedTurnId = mappedTurns.find((turn) => turn.turnId != null)?.turnId ?? null;
  let pagination =
    nextCursor == null
      ? void 0
      : { source: page.source, cursor: nextCursor, oldestLoadedTurnId };
  let mergedTurns = mergeTurnLists(conversation == null ? [] : conversationTurns(conversation), mappedTurns, {
    policy: turnMergePolicy,
  });
  manager.updateConversationState(conversationId, (draft: any) => {
    draft.canonicalVoiceHistory = hasCanonicalVoiceHistory(thread);
    applyTimelinePage(draft, page.timeline, `replace`);
    applyConversationTurns(draft, mergedTurns, nextCursor == null, pagination, turnMergePolicy);
    draft.historyMode = thread.historyMode;
    draft.canonicalVoiceHistory = hasCanonicalVoiceHistory(thread);
    draft.turnsPagination = {
      source: page.source,
      olderCursor: nextCursor,
      oldestLoadedTurnId,
      isLoadingOlder: false,
      hasLoadedOldest: nextCursor == null,
    };
  });
}

/** resume 后的剩余历史 drain（原版 Fx）。 */
function drainRemainingHistoryAfterResume(manager: MaybeResumeManager, conversationId: string): void {
  (manager as any)
    .loadRemainingConversationTurns(conversationId)
    .catch((error: unknown) => {
      manager.logger.warning(`Failed to load remaining thread turns after resume`, {
        safe: { conversationId },
        sensitive: { error },
      });
    });
}

// ---------------------------------------------------------------------------
// 主函数（原版 Wye）
// ---------------------------------------------------------------------------

/**
 * maybeResumeConversation。见文件头流程说明；返回：
 *   - { status: 'ready' }：resume 完成（或本进程已有流角色且已 resumed）；
 *   - { status: 'not-ready', reason }：取消 / 窗口不活跃 / owner 恢复中 /
 *     prepare 失败透传；
 *   - 异常：resume 请求失败（writer-conflict 已尝试抢救、archived 已抑制、
 *     resumeState 已回滚）后原样抛出。
 */
export async function maybeResumeConversation({
  manager,
  workspace,
  params,
  product,
  historyPolicy,
  canAcquireOwnership,
  isCurrentResumeAttempt,
  setHydrationCleanup,
  schedule,
  isReconnectRecovery = false,
}: {
  manager: MaybeResumeManager;
  workspace: MaybeResumeWorkspace;
  params: MaybeResumeParams;
  product: MaybeResumeProduct;
  historyPolicy: MaybeResumeHistoryPolicy;
  canAcquireOwnership: () => boolean;
  isCurrentResumeAttempt: () => boolean;
  setHydrationCleanup: (cleanup: () => void) => void;
  schedule: (callback: () => void, delayMs: number) => () => void;
  isReconnectRecovery?: boolean;
}): Promise<any> {
  if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
  let {
    conversationId,
    model,
    serviceTier,
    reasoningEffort,
    workspaceRoots,
    permissions,
    collaborationMode,
    showThreadGoalResumeConfirmation,
    trace,
  } = params;
  let conversation = manager.getConversation(conversationId);
  let hostId = manager.getHostId();
  let windowActivity = manager.getWindowActivity();
  let visibilityState = windowActivity?.visibilityState;
  manager.logger.info(`maybe_resume_started`, {
    safe: {
      vmEvent: `thread_resume_requested`,
      vmProduct: `unknown`,
      threadId: conversationId,
      environmentIds: conversation?.environments?.map((environment: any) => environment.environmentId),
      connectedEnvironmentIds: conversation?.connectedEnvironmentIds,
      conversationId,
      previousResumeState: conversation?.resumeState ?? null,
      previousStreamRole: manager.getStreamRole(conversationId)?.role ?? null,
      documentVisibilityState: visibilityState,
    },
    sensitive: { hostId, routePath: windowActivity?.routePath },
  });
  let isDurableHost = hostId === DURABLE_HOST_ID;
  let hadNoStreamRole = manager.getStreamRole(conversationId) == null;
  // 窗口不活跃判定：无流角色 + 不可获所有权（每次重取窗口活动）。
  let isInactiveWindow = () =>
    ((windowActivity = manager.getWindowActivity()),
    manager.getStreamRole(conversationId) == null && !canAcquireOwnership());
  if (isInactiveWindow())
    return (
      manager.ensureRecentConversationId(conversationId),
      manager.logger.info(`maybe_resume_skipped_inactive_hotkey_window`, {
        safe: { conversationId, documentVisibilityState: visibilityState },
        sensitive: { hostId, routePath: windowActivity?.routePath },
      }),
      { status: `not-ready`, reason: `inactive-window` }
    );
  // catalog 侧骨架来源：本机未装载且非 durable host 时读 catalog。
  let catalogEntry: any;
  let catalogEntryPromise =
    conversation == null && !isDurableHost ? product.readCatalogEntry(hostId, conversationId) : void 0;
  if (catalogEntryPromise != null) {
    try {
      let entry = await catalogEntryPromise;
      catalogEntry = entry?.sourceKind === `chatgpt` ? void 0 : entry;
    } catch (error) {
      manager.logger.warning(`maybe_resume_catalog_read_failed`, {
        safe: { conversationId },
        sensitive: { error, hostId },
      });
    }
    if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
    if (
      ((conversation = manager.getConversation(conversationId)),
      (hadNoStreamRole = manager.getStreamRole(conversationId) == null),
      isInactiveWindow())
    )
      return { status: `not-ready`, reason: `inactive-window` };
  }
  let summary =
    conversation == null && catalogEntry == null
      ? manager.getThreadSummaries().find((entry) => entry.conversationId === conversationId)
      : void 0;
  if (
    (!isDurableHost &&
      conversation == null &&
      catalogEntry == null &&
      params.knownCatalogEntry?.sourceKind !== `chatgpt` &&
      params.knownCatalogEntry?.hostId === hostId &&
      params.knownCatalogEntry.threadId === conversationId &&
      (summary == null || summary.updatedAt < params.knownCatalogEntry.sourceUpdatedAt * 1e3) &&
      ((catalogEntry = params.knownCatalogEntry), (summary = void 0)),
    conversation == null)
  ) {
    // 骨架构造：catalog 条目/摘要 → conversation 骨架。
    let now = Date.now();
    conversation = conversationFromThreadSummary(
      summary ?? {
        conversationId,
        hostId,
        createdAt: catalogEntry == null ? now : catalogEntry.sourceCreatedAt * 1e3,
        updatedAt: catalogEntry == null ? now : catalogEntry.sourceUpdatedAt * 1e3,
        recencyAt: catalogEntry == null ? void 0 : catalogEntry.sourceRecencyAt * 1e3,
        title: catalogEntry?.displayTitle ?? null,
        cwd: catalogEntry?.cwd ?? ``,
        gitInfo: null,
        hasUnreadTurn: manager.getThreadHasUnreadTurn(conversationId),
        modelProvider: catalogEntry?.modelProvider ?? ``,
        parentThreadId: null,
        source: null,
        threadSource: catalogEntry?.threadSource ?? null,
        threadRuntimeStatus: void 0,
        workspaceKind:
          catalogEntry?.cwd === (product.workspace as any).projectlessPathSentinel ? `projectless` : `project`,
      },
    );
    manager.setConversation(conversation);
  }
  if (
    (params.threadAccess === `shared` &&
      conversation.threadAccess !== `shared` &&
      (manager.updateConversationState(conversationId, (draft: any) => {
        draft.threadAccess = `shared`;
      }),
      (conversation = { ...conversation, threadAccess: `shared` })),
    conversation.resumeState !== `resumed` && manager.getStreamRole(conversationId)?.role === `follower`)
  )
    return { status: `not-ready`, reason: `owner-recovering` };
  if (!hadNoStreamRole && conversation.resumeState !== `needs_resume`)
    return (manager.ensureRecentConversationId(conversationId), { status: `ready` });
  let initialConversation = conversation;
  lastTurnWithTurnId(conversation);
  let useTailHydration = manager.useTailHydration();
  let useBoundedCloudHistory = isDurableHost && useTailHydration && product.useBoundedCloudHistory === true;
  let hydrationTrace = (product.beginHydration as any)?.({
    conversationId,
    durable: isDurableHost,
    threadIsAeon: conversation.threadStartKind == null && conversation.threadSource == null && void 0,
    parentTrace: trace,
    startupResume: params.startupResume,
    tailHydration: useTailHydration,
  });
  let retryCleanup: (() => void) | null = null;
  setHydrationCleanup(() => {
    retryCleanup?.();
    hydrationTrace?.cancel();
  });
  let requestOptions = {
    source: `thread_hydration`,
    trace: hydrationTrace?.trace,
    priority: isReconnectRecovery ? `interactive` : `critical`,
  };
  let metadataRead = manager
    .readThread(conversationId, {
      includeTurns: false,
      requestOptions: { ...requestOptions, timeoutMs: THREAD_HISTORY_REQUEST_TIMEOUT_MS },
    })
    .catch((error: unknown) => {
      manager.logger.warning(`Failed to read thread metadata before resume`, {
        safe: { conversationId },
        sensitive: { error },
      });
      return null;
    });
  let timestamp = Date.now();
  let writableRoots: string[];
  let workspaceLoaded: boolean;
  try {
    [writableRoots, workspaceLoaded] = await Promise.all([
      loadThreadWritableRoots(manager, conversationId),
      workspace.load(true),
    ]);
  } catch (error) {
    throw (hydrationTrace?.recordWritableRoots(timestamp), hydrationTrace?.fail(error), error);
  }
  if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
  hydrationTrace?.recordWritableRoots(timestamp);
  conversation = manager.getConversation(conversationId);
  let latestTurnEntry = conversation == null ? void 0 : lastTurnWithTurnId(conversation);
  let latestTurnParams = latestTurnEntry?.permissionParamsSource === `inferred` ? void 0 : latestTurnEntry?.params;
  let appliedWorkspaceState = manager.getThreadWorkspaceState(conversationId)?.applied ?? null;
  let projectlessWorkspaceWriteRoot =
    appliedWorkspaceState == null && conversation?.workspaceKind === `projectless`
      ? (product.workspace as any).getWritableRoot(
          conversation.latestThreadSettings?.sandboxPolicy ?? latestTurnParams?.sandboxPolicy,
        )
      : null;
  let fallbackCwd = projectlessFallbackCwd(
    conversation,
    workspaceRoots[0] ?? null,
    (product.workspace as any).projectlessPathSentinel,
  );
  let resumeCwd =
    appliedWorkspaceState?.cwd ??
    (product.workspace as any).getCwd({
      cwd: conversation?.cwd,
      fallbackCwd: projectlessWorkspaceWriteRoot ?? fallbackCwd,
      workspaceBrowserRoot: conversation?.workspaceBrowserRoot,
      workspaceKind: conversation?.workspaceKind,
    });
  let resumeWorkspaceRoots =
    appliedWorkspaceState?.runtimeWorkspaceRoots ??
    primaryRootFirst(resumeCwd, workspaceRoots, (product.workspace as any).projectlessPathSentinel);
  manager.updateConversationState(conversationId, (draft: any) => {
    draft.resumeState = `resuming`;
  });
  if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
  if (useTailHydration) manager.beginResumeNotificationBuffer(conversationId);
  let metadataReadResult: any = null;
  let acquiredOwnershipBeforeRequest = false;
  try {
    let mergedTurnsSoFar = conversation == null ? [] : conversationTurns(conversation);
    let historyPagination: any;
    let metadata = await metadataRead;
    if ((hydrationTrace?.mark(`metadata_ready`), !isCurrentResumeAttempt()))
      return { status: `not-ready`, reason: `canceled` };
    metadataReadResult = metadata;
    let threadStartKindFromMetadata = metadata == null ? null : product.getThreadStartKind(metadata.thread);
    if (metadata != null) {
      if (workspaceLoaded) {
        let threadWorkspaceKind = workspace.getThreadWorkspaceKind(conversationId, metadata.thread);
        let threadWorkspaceBrowserRoot = workspace.getThreadWorkspaceBrowserRoot(metadata.thread);
        let threadProjectlessOutputDirectory = workspace.getThreadProjectlessOutputDirectory(
          conversationId,
          metadata.thread,
        );
        manager.updateConversationState(conversationId, (draft: any) => {
          draft.workspaceKind = threadWorkspaceKind;
          draft.workspaceBrowserRoot =
            threadWorkspaceKind === `projectless` ? (threadWorkspaceBrowserRoot ?? draft.workspaceBrowserRoot) : null;
          draft.projectlessOutputDirectory =
            threadWorkspaceKind === `projectless`
              ? (threadProjectlessOutputDirectory ?? draft.projectlessOutputDirectory)
              : null;
        });
        conversation = manager.getConversation(conversationId);
      }
      if (appliedWorkspaceState == null) {
        // catalog cwd 更新时（且非哨兵、不旧于线程）优先于线程 cwd。
        let resolvedCwd = resolveResumeCwd({
          requestedCwd: resumeCwd,
          responseCwd: null,
          threadCwd:
            catalogEntry?.cwd &&
            catalogEntry.cwd !== (product.workspace as any).projectlessPathSentinel &&
            catalogEntry.sourceUpdatedAt >= metadata.thread.updatedAt
              ? catalogEntry.cwd
              : metadata.thread.cwd,
          fallbackCwd: resumeWorkspaceRoots[0],
        });
        resumeCwd = (product.workspace as any).getCwd({
          cwd: resolvedCwd ?? resumeCwd,
          fallbackCwd:
            projectlessWorkspaceWriteRoot ??
            projectlessFallbackCwd(
              conversation,
              resumeWorkspaceRoots[0],
              (product.workspace as any).projectlessPathSentinel,
            ),
          workspaceBrowserRoot: conversation?.workspaceBrowserRoot,
          workspaceKind: conversation?.workspaceKind,
        });
        resumeWorkspaceRoots = primaryRootFirst(
          resumeCwd,
          workspaceRoots,
          (product.workspace as any).projectlessPathSentinel,
        );
      }
      let threadName = metadata.thread.name?.trim() ?? ``;
      let { updatedAt, recencyAt } = threadTimestamps(metadata.thread);
      manager.updateConversationState(conversationId, (draft: any) => {
        draft.sessionId = metadata.thread.sessionId;
        if (metadata.thread.daybreakEnabled !== void 0) draft.daybreakEnabled = metadata.thread.daybreakEnabled;
        draft.rolloutPath = metadata.thread.path ?? ``;
        draft.cwd = resumeCwd ?? draft.cwd;
        draft.originator = metadata.thread.originator ?? draft.originator;
        draft.source = metadata.thread.source;
        draft.agentNickname = metadata.thread.agentNickname;
        draft.canonicalVoiceHistory = hasCanonicalVoiceHistory(metadata.thread);
        draft.threadSource = metadata.thread.threadSource ?? draft.threadSource ?? null;
        if (threadStartKindFromMetadata != null) draft.threadStartKind = threadStartKindFromMetadata;
        draft.gitInfo = metadata.thread.gitInfo ?? draft.gitInfo;
        if (threadName && (!draft.title || draft.title === (catalogEntry?.displayTitle ?? summary?.title)))
          draft.title = threadName;
        let currentRecency = draft.recencyAt ?? draft.updatedAt;
        draft.updatedAt = Math.max(draft.updatedAt, updatedAt);
        draft.recencyAt = mergedRecencyAt({
          currentRecencyAt: currentRecency,
          threadRecencyAt: recencyAt,
          updatedAt,
        });
      });
    }
    conversation = manager.getConversation(conversationId);
    let turnEntryAfterMetadata = conversation == null ? void 0 : lastTurnWithTurnId(conversation);
    let turnParams = turnEntryAfterMetadata?.params;
    let nonInferredTurnParams =
      turnEntryAfterMetadata?.permissionParamsSource === `inferred` ? void 0 : turnParams;
    let latestThreadSettings = conversation?.latestThreadSettings;
    let historyMode = metadata?.thread.historyMode ?? conversation?.historyMode ?? `legacy`;
    let usePaginatedHistory =
      useTailHydration && !isDurableHost && historyMode === `paginated` && manager.supportsPaginatedThreadHistory();
    let runtimeWorkspaceRoots =
      appliedWorkspaceState?.runtimeWorkspaceRoots ??
      projectlessRuntimeRoots({
        conversation,
        projectlessPathSentinel: (product.workspace as any).projectlessPathSentinel,
        projectlessWorkspaceWriteRoot,
        resumeCwd,
        resumeWorkspaceRoots,
      });
    let permissionDefaults =
      conversation?.workspaceKind === `projectless` && runtimeWorkspaceRoots.length === 0
        ? defaultSandboxPolicy()
        : defaultPermissions(runtimeWorkspaceRoots);
    // ---- 权限派生（来源链：显式 → threadSettings → 末 turn → current → 默认）
    let approvalsReviewer =
      permissions?.approvalsReviewer ??
      latestThreadSettings?.approvalsReviewer ??
      nonInferredTurnParams?.approvalsReviewer ??
      conversation?.currentPermissions?.approvalsReviewer ??
      permissionDefaults.approvalsReviewer;
    let activePermissionProfile = conversation?.currentPermissions?.activePermissionProfile;
    if (latestThreadSettings?.activePermissionProfile === void 0) {
      if (nonInferredTurnParams?.permissions != null)
        activePermissionProfile = { id: nonInferredTurnParams.permissions, extends: null };
    } else activePermissionProfile = latestThreadSettings.activePermissionProfile;
    let derivedPermissions =
      permissions ?? {
        activePermissionProfile,
        approvalPolicy:
          latestThreadSettings?.approvalPolicy ??
          nonInferredTurnParams?.approvalPolicy ??
          conversation?.currentPermissions?.approvalPolicy ??
          permissionDefaults.approvalPolicy,
        approvalsReviewer,
        runtimeWorkspaceRoots: mergeRootLists(
          mergeRootLists(conversation?.currentPermissions?.runtimeWorkspaceRoots ?? [], runtimeWorkspaceRoots),
          writableRoots,
        ),
        sandboxPolicy:
          latestThreadSettings?.sandboxPolicy ??
          nonInferredTurnParams?.sandboxPolicy ??
          conversation?.currentPermissions?.sandboxPolicy ??
          permissionDefaults.sandboxPolicy,
      };
    if (
      permissions == null &&
      derivedPermissions.activePermissionProfile != null &&
      (conversation?.currentPermissions == null ||
        conversation.currentPermissions.activePermissionProfile?.id === derivedPermissions.activePermissionProfile.id)
    ) {
      // 沿用现有 workspaceWrite 策略时，可写根并入运行时根，但已覆盖的
      // 预取根不再重复。
      let existingSandbox = conversation?.currentPermissions?.sandboxPolicy ?? derivedPermissions.sandboxPolicy;
      if (existingSandbox.type === `workspaceWrite`)
        derivedPermissions.runtimeWorkspaceRoots = mergeRootLists(
          mergeRootLists(conversation?.currentPermissions?.runtimeWorkspaceRoots ?? [], runtimeWorkspaceRoots),
          writableRoots.filter(
            (root) => !existingSandbox.writableRoots.some((writable: string) => (product.workspace as any).arePathsEquivalent(writable, root)),
          ),
        );
    }
    let expandedSandbox = expandWritableRoots(derivedPermissions.sandboxPolicy, writableRoots);
    let resolvedPermissions = {
      ...derivedPermissions,
      sandboxPolicy: (product.workspace as any).getSandboxPolicy({
        sandboxPolicy: expandedSandbox,
        workspaceKind: conversation?.workspaceKind,
      }),
    };
    let hasPermissionEvidence =
      permissions != null ||
      latestThreadSettings?.approvalPolicy != null ||
      latestThreadSettings?.sandboxPolicy != null ||
      latestThreadSettings?.permissions != null ||
      latestThreadSettings?.activePermissionProfile !== void 0 ||
      nonInferredTurnParams != null ||
      conversation?.currentPermissions?.activePermissionProfile?.id === `:danger-full-access`;
    let effectiveServiceTier = serviceTier;
    if (nonInferredTurnParams?.serviceTier !== void 0) effectiveServiceTier = nonInferredTurnParams.serviceTier;
    if (latestThreadSettings?.serviceTier !== void 0) effectiveServiceTier = latestThreadSettings.serviceTier;
    // ---- bounded cloud history 预取
    let boundedCloudHistoryPrefetch =
      useBoundedCloudHistory && metadata != null && true;
    if (boundedCloudHistoryPrefetch)
      manager.updateConversationState(conversationId, (draft: any) => {
        draft.boundedCloudHistory = true;
      });
    let cloudHistoryPrefetch = boundedCloudHistoryPrefetch
      ? mergeResumeTurns(manager as any, {
          conversationId,
          cwd: resumeCwd,
          isCurrent: () =>
            isCurrentResumeAttempt() && manager.getStreamRole(conversationId)?.role !== `follower`,
          mapThreadTurns: historyPolicy.mapThreadTurns,
          options: { limit: 1, itemLimit: 30, itemsView: `summary`, requestOptions },
          permissions: resolvedPermissions,
          reasoningEffort,
          threadStartKind: conversation?.threadStartKind,
          turnMergePolicy: historyPolicy.turnMergePolicy,
        })
      : null;
    cloudHistoryPrefetch?.then(
      () => hydrationTrace?.mark(`history_ready`),
      () => void 0,
    );
    let startConfig = await product.prepare({
      initialConversation,
      conversation,
      thread: metadata?.thread,
      params,
      permissions: resolvedPermissions,
      serviceTier: effectiveServiceTier ?? null,
      workspaceRoots: resumeWorkspaceRoots,
      requestOptions,
    });
    if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
    if (`status` in startConfig || isInactiveWindow())
      return (
        useTailHydration && manager.releaseResumeNotificationBuffer(conversationId),
        manager.updateConversationState(conversationId, (draft: any) => {
          if (draft.resumeState === `resuming`) draft.resumeState = `needs_resume`;
        }),
        hydrationTrace?.cancel(),
        `status` in startConfig ? startConfig : { status: `not-ready`, reason: `inactive-window` }
      );
    let independentHistory = isDurableHost ? startConfig.independentHistory : null;
    let useBoundedCloudHistoryNow = useBoundedCloudHistory && independentHistory == null;
    manager.updateConversationState(conversationId, (draft: any) => {
      draft.boundedCloudHistory = useBoundedCloudHistoryNow;
    });
    let start = startConfig.start;
    let startRequestOptions = startConfig.requestOptions;
    let backgroundRequestOptions = isReconnectRecovery ? requestOptions : startConfig.backgroundRequestOptions;
    let shouldSendPermissions = !startConfig.preserveServerPermissions && hasPermissionEvidence;
    let shouldSendApprovalsReviewer =
      !startConfig.preserveServerPermissions &&
      (permissions?.approvalsReviewer != null ||
        latestThreadSettings?.approvalsReviewer != null ||
        nonInferredTurnParams?.approvalsReviewer != null ||
        (turnEntryAfterMetadata?.permissionParamsSource !== `inferred` &&
          conversation?.currentPermissions?.approvalsReviewer != null));
    // projectless（或本地 Documents/Codex）线程开启 request_permissions_tool。
    if (
      !startConfig.preserveServerPermissions &&
      appliedWorkspaceState == null &&
      (conversation?.workspaceKind === `projectless` ||
        (hostId === `local` && isDocumentsCodexPath(start.cwd)))
    )
      start.config = { ...start.config, "features.request_permissions_tool": true };
    let runtimeRootsForRequest = filterRootsMatchingCwd(resumeCwd ?? resumeWorkspaceRoots[0], start.runtimeWorkspaceRoots ?? []);
    let requestPermissions = { ...resolvedPermissions, runtimeWorkspaceRoots: runtimeRootsForRequest };
    let configEntries = Object.entries(start.config ?? {}).filter(
      ([key, value]) =>
        value != null &&
        (key !== `profiles` ||
          typeof value != `object` ||
          Array.isArray(value) ||
          Object.keys(value).length > 0),
    );
    let hasConfig = configEntries.length > 0;
    let configDiffersFromDefaults = configEntries.some(
      ([key, value]) =>
        !key.startsWith(`features.`) ||
        (!deepEqual(startConfig.defaultFeatureOverrides?.[key], value) &&
          !deepEqual(startConfig.defaultFeatureOverrides?.[key.slice(9)], value)),
    );
    let canReuseRunningThread =
      startConfig.canReuseRunningThread &&
      metadata?.thread.status.type === `idle` &&
      permissions == null &&
      serviceTier == null &&
      !(shouldSendPermissions && start.permissions != null) &&
      !configDiffersFromDefaults;
    // follower 无独立历史：不需要本进程 resume，直接恢复状态。
    if (manager.getStreamRole(conversationId)?.role === `follower` && independentHistory == null)
      return (
        manager.updateConversationState(conversationId, (draft: any) => {
          if (draft.resumeState === `resuming`) draft.resumeState = `resumed`;
        }),
        isCurrentResumeAttempt()
          ? (useTailHydration && manager.releaseResumeNotificationBuffer(conversationId),
            hydrationTrace?.finish(),
            { status: `ready` })
          : { status: `not-ready`, reason: `canceled` }
      );
    if (
      ((acquiredOwnershipBeforeRequest = manager.getStreamRole(conversationId) == null),
      acquiredOwnershipBeforeRequest && manager.setConversationStreamRole(conversationId, { role: `owner` }),
      !isCurrentResumeAttempt())
    )
      return { status: `not-ready`, reason: `canceled` };
    // ---- 组装 thread/resume 请求
    let resumeRequest: any = {
      threadId: conversationId,
      history: null,
      path: metadata == null ? conversation?.rolloutPath || null : metadata.thread.path,
      model: null,
      modelProvider: start.modelProvider,
      ...(effectiveServiceTier === void 0 ? {} : { serviceTier: start.serviceTier }),
      cwd: start.cwd,
      ...(canReuseRunningThread
        ? {}
        : {
            baseInstructions: start.baseInstructions ?? void 0,
            developerInstructions: start.developerInstructions ?? void 0,
          }),
      personality:
        latestThreadSettings?.personality === void 0
          ? (turnParams?.personality ?? start.personality)
          : latestThreadSettings.personality,
      excludeTurns:
        useTailHydration && (!isDurableHost || independentHistory != null) && !independentHistory?.useCompactHistory,
      ...(useTailHydration && !isDurableHost && !usePaginatedHistory
        ? { initialTurnsPage: { limit: 5, itemsView: `full`, sortDirection: `desc` } }
        : {}),
    };
    if (shouldSendPermissions) {
      resumeRequest.approvalPolicy = start.approvalPolicy;
      if (start.permissions == null) resumeRequest.sandbox = start.sandbox;
      else {
        resumeRequest.permissions = start.permissions;
        resumeRequest.runtimeWorkspaceRoots = runtimeRootsForRequest;
      }
    }
    if (shouldSendApprovalsReviewer) resumeRequest.approvalsReviewer = start.approvalsReviewer;
    if (hasConfig && !canReuseRunningThread) resumeRequest.config = start.config;
    let completeRequest = startConfig.completeRequest(resumeRequest);
    let requestConfig = completeRequest.config ?? null;
    let shellEnvironmentPolicy = requestConfig == null ? (conversation?.shellEnvironmentPolicy ?? null) : null;
    if (
      ((requestConfig != null || (conversation?.shellEnvironmentPolicy == null && !canReuseRunningThread)) &&
        (shellEnvironmentPolicy = await manager.readShellEnvironmentPolicy(completeRequest.cwd, requestConfig)),
      !isCurrentResumeAttempt() || !isCurrentResumeAttempt())
    )
      return { status: `not-ready`, reason: `canceled` };
    let evidenceBeforeResume = manager.getConversation(conversationId)?.environmentSelectionEvidence;
    // ---- 历史装载计划（compact 优先 → bounded cloud → timeline/paginated →
    // turns 页回退 → legacy 全量）
    let cloudHistoryLoad =
      useTailHydration && isDurableHost && (independentHistory != null || useBoundedCloudHistoryNow)
        ? (cloudHistoryPrefetch ??
          // 原版此处有一段 `(_e?.useCompactHistory, null)` 的死逗号表达式
          //（求值后恒为 null，属性读取无副作用），等价于直接落到 mergeResumeTurns。
          mergeResumeTurns(manager as any, {
            conversationId,
            cwd: resumeCwd,
            isCurrent: isCurrentResumeAttempt,
            mapThreadTurns: historyPolicy.mapThreadTurns,
            options: {
              ...(independentHistory?.useCompactHistory
                ? { source: `compact` }
                : { itemsView: `summary`, itemLimit: useBoundedCloudHistoryNow ? 30 : void 0 }),
              limit: independentHistory?.limit ?? 1,
              requestOptions: startRequestOptions,
            },
            permissions: resolvedPermissions,
            reasoningEffort,
            threadStartKind: independentHistory?.threadStartKind ?? conversation?.threadStartKind,
            turnMergePolicy: historyPolicy.turnMergePolicy,
          }))
        : null;
    if (cloudHistoryLoad !== cloudHistoryPrefetch)
      cloudHistoryLoad?.then(
        () => hydrationTrace?.mark(`history_ready`),
        () => void 0,
      );
    hydrationTrace?.mark(`runtime_resume_started`);
    let resumeResponsePromise = sendResumeRequest({
      sendRequest: manager.sendRequest.bind(manager),
      request: completeRequest,
      options: isReconnectRecovery ? { ...startRequestOptions, timeoutMs: THREAD_HISTORY_REQUEST_TIMEOUT_MS } : startRequestOptions,
      schedule,
      isCurrentResumeAttempt,
      setRetryCleanup: (cleanup: () => void) => {
        retryCleanup = cleanup;
      },
    });
    let hydrateThreadGoal = (): Promise<{ ok: boolean; goal?: any }> =>
      manager
        .sendRequest(
          `thread/goal/get`,
          { threadId: conversationId },
          showThreadGoalResumeConfirmation === true ? startRequestOptions : backgroundRequestOptions,
        )
        .then(({ goal }: any) => ({ ok: true, goal }))
        .catch((error: unknown) => {
          manager.logger.warning(`Failed to hydrate thread goal after resume`, {
            safe: { conversationId },
            sensitive: { error },
          });
          return { ok: false };
        });
    let resumeResponse = await resumeResponsePromise.catch(async (error: unknown) => {
      throw (
        manager.getConversation(conversationId),
        manager.logger.warning(`VM lifecycle`, {
          safe: {
            vmEvent: `thread_resume_failed`,
            vmProduct: `unknown`,
            threadId: conversationId,
            errorType: error instanceof Error ? error.name : `unknown`,
          },
          sensitive: { hostId },
        }),
        isCurrentResumeAttempt() && (await cloudHistoryLoad?.catch(() => void 0)),
        error
      );
    });
    if (resumeResponse == null || !isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
    hydrationTrace?.mark(`runtime_resume_finished`);
    let evidenceAfterResume = manager.getConversation(conversationId)?.environmentSelectionEvidence;
    if (
      evidenceAfterResume?.source !== `live` || evidenceAfterResume === evidenceBeforeResume
    )
      manager.updateConversationState(conversationId, (draft: any) => {
        Object.assign(draft, environmentSelection(resumeResponse.thread, draft, `live`));
      });
    manager.ensureRecentConversationId(conversationId);
    let paginatedCursors = usePaginatedHistory ? parsePaginatedHistoryCursor(resumeResponse) : null;
    let appliedPermissions = mergePermissionSettings(requestPermissions, resumeResponse);
    let goalConfirmation =
      showThreadGoalResumeConfirmation === true ? await hydrateThreadGoal() : { ok: false };
    if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
    let cloudHistoryResult = await cloudHistoryLoad;
    if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
    let historyIsComplete = true;
    let historyForAccept: any;
    if (
      (cloudHistoryResult != null &&
        cloudHistoryResult.source !== `compact` &&
        (historyForAccept = cloudHistoryResult.response.data.slice().reverse()),
      useTailHydration && cloudHistoryResult == null)
    ) {
      let historyPage: any;
      if (
        ((historyPage = isDurableHost
          ? await listDurableTurnsWithItems(
              manager.sendRequest.bind(manager),
              conversationId,
              null,
              5,
              startRequestOptions,
            ).then((response) => ({ response }))
          : usePaginatedHistory
            ? manager.supportsThreadTimeline()
              ? await listTimelineTurns(manager as any, conversationId, null, isReconnectRecovery ? backgroundRequestOptions : startRequestOptions)
              : paginatedCursors?.turnsBackwardsCursor == null
                ? {
                    response: { backwardsCursor: null, data: [], nextCursor: null },
                    itemsPaginationByTurnId: {},
                  }
                : await fetchTurnsWithItems(
                    manager as any,
                    manager.getConversationTurnItemLimit(conversationId),
                    historyPolicy.turnMergePolicy,
                    conversationId,
                    paginatedCursors.turnsBackwardsCursor,
                    paginatedCursors.itemsBackwardsCursor,
                    5,
                    isReconnectRecovery ? backgroundRequestOptions : startRequestOptions,
                  )
            : resumeResponse.initialTurnsPage == null
              ? startConfig.useTurnsPageFallback
                ? await manager.listThreadTurns(conversationId, {
                    limit: 5,
                    itemsView: `full`,
                    sortDirection: `desc`,
                    requestOptions: startRequestOptions,
                  })
                : null
              : { response: resumeResponse.initialTurnsPage }),
        !isCurrentResumeAttempt())
      )
        return { status: `not-ready`, reason: `canceled` };
      let legacyThreadRead =
        historyPage == null && !isDurableHost && !usePaginatedHistory
          ? await manager
              .readThread(conversationId, { includeTurns: true, requestOptions: startRequestOptions })
              .catch((error: unknown) => {
                throw (
                  manager.logger.warning(`Failed to read legacy thread history after resume`, {
                    safe: { conversationId },
                    sensitive: { error },
                  }),
                  error
                );
              })
          : null;
      if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
      historyIsComplete =
        historyPage == null ? isDurableHost || legacyThreadRead != null : historyPage.source !== `compact` && historyPage.response.nextCursor == null;
      let mappedHistoryTurns: AnyTurn[];
      mappedHistoryTurns =
        historyPage == null
          ? legacyThreadRead == null
            ? []
            : historyPolicy.mapThreadTurns({
                threadId: legacyThreadRead.thread.id,
                turns: legacyThreadRead.thread.turns,
                model: conversation?.latestModel ?? model ?? collaborationMode?.settings.model ?? ``,
                reasoningEffort: reasoningEffort ?? conversation?.latestReasoningEffort ?? null,
                cwd: legacyThreadRead.thread.cwd || resumeCwd || `/`,
                permissions: appliedPermissions,
              })
          : historyPolicy.mapThreadTurns({
              threadId: conversationId,
              turns: historyPage.response.data.slice().reverse(),
              model: conversation?.latestModel ?? model ?? collaborationMode?.settings.model ?? ``,
              reasoningEffort: reasoningEffort ?? conversation?.latestReasoningEffort ?? null,
              cwd: resumeCwd ?? `/`,
              permissions: appliedPermissions,
              itemsPaginationByTurnId: historyPage.itemsPaginationByTurnId,
            });
      if (isDurableHost && independentHistory == null)
        mappedHistoryTurns = mergeTurnLists(
          mappedHistoryTurns,
          (product.history as any).mapResumeResponse(resumeResponse, {
            fallbackCwd: resumeCwd,
            resolvedPermissions: appliedPermissions,
          }),
          { policy: historyPolicy.turnMergePolicy, preserveExistingTerminalState: true },
        );
      historyForAccept =
        historyPage == null ? (legacyThreadRead?.thread.turns ?? null) : historyPage.response.data.slice().reverse();
      if (historyPage?.source === `compact`) historyForAccept = null;
      let currentConversation = manager.getConversation(conversationId);
      mergedTurnsSoFar = mergeTurnLists(
        currentConversation == null ? mergedTurnsSoFar : conversationTurns(currentConversation),
        mappedHistoryTurns,
        { policy: historyPolicy.turnMergePolicy, isResumeSnapshot: usePaginatedHistory },
      );
      historyPagination =
        historyPage?.response.nextCursor == null
          ? void 0
          : {
              source: historyPage.source,
              cursor: historyPage.response.nextCursor,
              oldestLoadedTurnId:
                mappedHistoryTurns.find((turn) => turn.turnId != null)?.turnId ?? null,
            };
      manager.updateConversationState(conversationId, (draft: any) => {
        draft.canonicalVoiceHistory = hasCanonicalVoiceHistory(resumeResponse.thread);
        applyTimelinePage(draft, historyPage?.timeline, `replace`);
        applyConversationTurns(draft, mergedTurnsSoFar, historyIsComplete, historyPagination, historyPolicy.turnMergePolicy);
        draft.turnsPagination =
          historyPage == null
            ? {
                olderCursor: null,
                oldestLoadedTurnId: null,
                isLoadingOlder: false,
                hasLoadedOldest: historyIsComplete,
              }
            : {
                source: historyPage.source,
                olderCursor: historyPage.response.nextCursor,
                oldestLoadedTurnId:
                  mappedHistoryTurns.find((turn) => turn.turnId != null)?.turnId ?? null,
                isLoadingOlder: false,
                hasLoadedOldest: historyPage.response.nextCursor == null,
              };
      });
      if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
    }
    hydrationTrace?.mark(`history_ready`);
    let responseCwd = resumeResponse.cwd;
    let threadCwd = resumeResponse.thread.cwd;
    let resolvedFinalCwd = resolveResumeCwd({
      requestedCwd: resumeCwd,
      responseCwd: responseCwd ?? null,
      threadCwd,
      fallbackCwd: resumeWorkspaceRoots[0],
    });
    let threadGitInfo = resumeResponse.thread.gitInfo;
    let threadName = resumeResponse.thread.name?.trim() ?? ``;
    let startResult = await startConfig.getResult(resumeResponse);
    if (!isCurrentResumeAttempt()) return { status: `not-ready`, reason: `canceled` };
    let conversationAfterResume = manager.getConversation(conversationId);
    let turnsBeforeFinalMerge =
      conversationAfterResume == null ? mergedTurnsSoFar : conversationTurns(conversationAfterResume);
    let completedTurnIds = new Set(
      turnsBeforeFinalMerge.filter((turn) => turn.status !== `inProgress`).map((turn) => turn.turnId),
    );
    let resumeResponseTurns =
      useTailHydration && !useBoundedCloudHistoryNow && !independentHistory?.useCompactHistory
        ? []
        : (product.history as any)
            .mapResumeResponse(resumeResponse, {
              fallbackCwd: resolvedFinalCwd ?? null,
              resolvedPermissions: appliedPermissions,
            })
            .filter(
              (turn: AnyTurn) =>
                cloudHistoryResult == null || turn.status !== `inProgress` || !completedTurnIds.has(turn.turnId),
            );
    if (!useTailHydration) historyForAccept = resumeResponse.thread.turns;
    let finalTurns = mergeTurnLists(turnsBeforeFinalMerge, resumeResponseTurns, {
      policy: historyPolicy.turnMergePolicy,
      preserveExistingTerminalState: cloudHistoryResult != null,
      preferIncomingItems: cloudHistoryResult != null,
    });
    let finalTurnsWithParams =
      resumeResponseTurns.length > 0
        ? finalTurns
        : finalTurns.map((turn) => ({
            ...turn,
            params: {
              ...turn.params,
              approvalPolicy: resumeResponse.approvalPolicy,
              approvalsReviewer: resumeResponse.approvalsReviewer,
              sandboxPolicy: resumeResponse.sandbox,
              model: resumeResponse.model,
              cwd: resolvedFinalCwd ?? null,
              effort: resumeResponse.reasoningEffort,
            },
          }));
    manager.updateConversationState(conversationId, (draft: any) => {
      if (cloudHistoryResult != null && draft.turnHistory?.kind === `canonical`)
        reconcileResumeTurns(draft, finalTurnsWithParams, historyPolicy.createSearchIslandId);
      else if ((manager as any).canonicalTurnHistory)
        applyCanonicalTurns(draft, finalTurnsWithParams, historyIsComplete, historyPagination, historyPolicy.turnMergePolicy);
      else applyConversationTurns(draft, finalTurnsWithParams, historyIsComplete, historyPagination, historyPolicy.turnMergePolicy);
      draft.sessionId = resumeResponse.thread.sessionId;
      if (resumeResponse.thread.daybreakEnabled !== void 0)
        draft.daybreakEnabled = resumeResponse.thread.daybreakEnabled;
      draft.shellEnvironmentPolicy = shellEnvironmentPolicy;
      draft.historyMode = resumeResponse.thread.historyMode;
      draft.canonicalVoiceHistory = hasCanonicalVoiceHistory(resumeResponse.thread);
      draft.paginatedHistory =
        paginatedCursors == null ? void 0 : { itemsBackwardsCursor: paginatedCursors.itemsBackwardsCursor };
      let resultModel = startResult.model;
      draft.rolloutPath = resumeResponse.thread.path ?? ``;
      draft.resumeState = `resumed`;
      if (goalConfirmation.ok) {
        draft.threadGoal = goalConfirmation.goal;
        draft.threadGoalResumeConfirmation =
          showThreadGoalResumeConfirmation === true &&
          goalConfirmation.goal != null &&
          threadGoalNeedsConfirmation(goalConfirmation.goal.status)
            ? goalConfirmation.goal
            : null;
      }
      draft.threadRuntimeStatus = resumeResponse.thread.status;
      draft.cwd = resolvedFinalCwd;
      draft.currentPermissions = appliedPermissions;
      draft.originator = resumeResponse.thread.originator ?? draft.originator;
      draft.source = resumeResponse.thread.source;
      draft.agentNickname = resumeResponse.thread.agentNickname;
      draft.threadSource = resumeResponse.thread.threadSource ?? draft.threadSource ?? null;
      let { createdAt, updatedAt, recencyAt } = threadTimestamps(resumeResponse.thread);
      if (startResult.threadStartKind != null) {
        draft.threadStartKind = startResult.threadStartKind;
        draft.createdAt = createdAt;
      }
      draft.forkedFromId =
        resumeResponse.thread.forkedFromId == null ? null : normalizeThreadId(resumeResponse.thread.forkedFromId);
      draft.gitInfo = threadGitInfo ?? draft.gitInfo;
      if (threadName && (!draft.title || draft.title === (catalogEntry?.displayTitle ?? summary?.title)))
        draft.title = threadName;
      let currentRecency = draft.recencyAt ?? draft.updatedAt;
      draft.updatedAt = Math.max(draft.updatedAt, updatedAt);
      draft.recencyAt = mergedRecencyAt({
        currentRecencyAt: currentRecency,
        threadRecencyAt: recencyAt,
        updatedAt,
      });
      let hadPreviousTurnModel = draft.previousTurnModel != null;
      let effectiveReasoningEffort =
        startResult.reasoningEffort === void 0
          ? (reasoningEffort ?? resumeResponse.reasoningEffort ?? draft.latestReasoningEffort)
          : startResult.reasoningEffort;
      applyThreadSettingsUpdate(draft, {
        ...threadSettingsFromResumeResponse(
          resumeResponse,
          resultModel ?? draft.latestModel,
          effectiveReasoningEffort,
          resolvedFinalCwd,
          {
            mode: `default`,
            settings: {
              ...collaborationMode?.settings,
              model: startResult.collaborationModel ?? draft.latestModel,
              reasoning_effort: effectiveReasoningEffort,
              developer_instructions: startResult.developerInstructions,
            },
          },
        ),
        ...permissionSettingsSummary(appliedPermissions),
      });
      if (!hadPreviousTurnModel) draft.previousTurnModel = null;
    });
    if (
      !isCurrentResumeAttempt() ||
      (historyForAccept != null &&
        (usePaginatedHistory
          ? manager.acceptConversationHistory(conversationId, null)
          : manager.acceptConversationHistory(conversationId, {
              replacesExistingHistory: true,
              truncatedBefore: !historyIsComplete,
              turns: historyForAccept,
            })),
      !isCurrentResumeAttempt())
    )
      return { status: `not-ready`, reason: `canceled` };
    let latestTurn = finalTurnsWithParams.at(-1) ?? null;
    if (
      ((independentHistory == null || manager.getStreamRole(conversationId)?.role !== `follower`) &&
        manager.setConversationStreamRole(conversationId, { role: `owner` }),
      !isCurrentResumeAttempt())
    )
      return { status: `not-ready`, reason: `canceled` };
    let threadGoalBefore = manager.getConversation(conversationId)?.threadGoal;
    let backgroundGoalHydration =
      showThreadGoalResumeConfirmation === true
        ? null
        : (() => {
            let hydration = manager.beginThreadGoalHydration(conversationId);
            return {
              hydration,
              promise: hydrateThreadGoal().then((result) => {
                if (!manager.isCurrentThreadGoalHydration(conversationId, hydration)) return;
                let goalChanged =
                  manager.getConversation(conversationId)?.threadGoal !== threadGoalBefore;
                if (result.ok && !goalChanged)
                  manager.updateConversationState(conversationId, (draft: any) => {
                    draft.threadGoal = result.goal;
                    draft.threadGoalResumeConfirmation = null;
                  });
              }),
            };
          })();
    if (
      !isCurrentResumeAttempt() ||
      (useTailHydration && manager.releaseResumeNotificationBuffer(conversationId), !isCurrentResumeAttempt())
    )
      return { status: `not-ready`, reason: `canceled` };
    manager.broadcastConversationSnapshot(conversationId);
    let turnsPaginationAfter = manager.getConversation(conversationId)?.turnsPagination ?? null;
    let shouldDrainRemaining =
      useTailHydration &&
      !isDurableHost &&
      !usePaginatedHistory &&
      startConfig.drainRemainingHistory &&
      !isReconnectRecovery &&
      !manager.suppressResumeHistoryDrain() &&
      turnsPaginationAfter?.olderCursor != null;
    if (backgroundGoalHydration == null) {
      if (shouldDrainRemaining) drainRemainingHistoryAfterResume(manager, conversationId);
    } else
      backgroundGoalHydration.promise
        .then(() => {
          if (manager.endThreadGoalHydration(conversationId, backgroundGoalHydration.hydration) && shouldDrainRemaining)
            drainRemainingHistoryAfterResume(manager, conversationId);
        })
        .finally(() => {
          manager.endThreadGoalHydration(conversationId, backgroundGoalHydration.hydration);
        });
    let finalConversation = manager.getConversation(conversationId);
    manager.logger.info(`maybe_resume_success`, {
      safe: {
        vmEvent: `thread_resumed`,
        vmProduct: `unknown`,
        threadId: conversationId,
        environmentIds: finalConversation?.environments?.map((environment: any) => environment.environmentId),
        connectedEnvironmentIds: finalConversation?.connectedEnvironmentIds,
        conversationId,
        turnCount: finalTurnsWithParams.length,
        latestTurnId: latestTurn?.turnId ?? null,
        latestTurnStatus: latestTurn?.status ?? null,
        markedStreaming: true,
        assignedStreamRole: manager.getStreamRole(conversationId)?.role ?? null,
        documentVisibilityState: visibilityState,
      },
      sensitive: {
        routePath: windowActivity?.routePath,
        hasExplicitPermissions: permissions != null,
        hasLatestThreadSettings: latestThreadSettings != null,
        hasLatestTurnParams: turnParams != null,
        hasCurrentPermissions: conversation?.currentPermissions != null,
        approvalPolicySource: permissionSourceLabel(
          permissions != null,
          latestThreadSettings?.approvalPolicy != null,
          nonInferredTurnParams?.approvalPolicy != null,
          conversation?.currentPermissions?.approvalPolicy != null,
        ),
        approvalsReviewerSource: permissionSourceLabel(
          permissions?.approvalsReviewer != null,
          latestThreadSettings?.approvalsReviewer != null,
          nonInferredTurnParams?.approvalsReviewer != null,
          conversation?.currentPermissions?.approvalsReviewer != null,
        ),
        activePermissionProfileSource: permissionSourceLabel(
          permissions != null,
          latestThreadSettings?.activePermissionProfile !== void 0,
          nonInferredTurnParams?.permissions != null,
          conversation?.currentPermissions?.activePermissionProfile !== void 0,
        ),
        sandboxPolicySource: permissionSourceLabel(
          permissions != null,
          latestThreadSettings?.sandboxPolicy != null,
          nonInferredTurnParams?.sandboxPolicy != null,
          conversation?.currentPermissions?.sandboxPolicy != null,
        ),
        derivedApprovalPolicy: resolvedPermissions.approvalPolicy,
        derivedApprovalsReviewer: resolvedPermissions.approvalsReviewer,
        derivedSandboxPolicy: sandboxPolicySummary(resolvedPermissions.sandboxPolicy),
        derivedActivePermissionProfile: resolvedPermissions.activePermissionProfile?.id ?? null,
        shouldSendPermissions,
        shouldSendApprovalsReviewer,
        requestApprovalPolicy: shouldSendPermissions ? (start.approvalPolicy ?? null) : null,
        requestApprovalsReviewer: shouldSendApprovalsReviewer ? (start.approvalsReviewer ?? null) : null,
        requestSandboxMode: shouldSendPermissions ? (start.sandbox ?? null) : null,
        requestPermissionProfile: shouldSendPermissions ? (start.permissions ?? null) : null,
        responseApprovalPolicy: resumeResponse.approvalPolicy,
        responseApprovalsReviewer: resumeResponse.approvalsReviewer,
        responseSandboxPolicy: sandboxPolicySummary(resumeResponse.sandbox),
        responseActivePermissionProfile: resumeResponse.activePermissionProfile?.id ?? null,
        approvalPolicyChanged: resumeResponse.approvalPolicy !== resolvedPermissions.approvalPolicy,
        approvalsReviewerChanged: resumeResponse.approvalsReviewer !== resolvedPermissions.approvalsReviewer,
        activePermissionProfileChanged:
          (resumeResponse.activePermissionProfile?.id ?? null) !== (resolvedPermissions.activePermissionProfile?.id ?? null),
        sandboxPolicyChanged: !deepEqual(resumeResponse.sandbox, resolvedPermissions.sandboxPolicy),
      },
    });
    hydrationTrace?.finish();
    return { status: `ready` };
  } catch (error) {
    if (
      !isCurrentResumeAttempt() ||
      (acquiredOwnershipBeforeRequest &&
        manager.getStreamRole(conversationId)?.role === `owner` &&
        manager.setConversationStreamRole(conversationId, null),
      !isCurrentResumeAttempt()) ||
      (hydrationTrace?.fail(error), !isCurrentResumeAttempt()) ||
      (useTailHydration && manager.releaseResumeNotificationBuffer(conversationId), !isCurrentResumeAttempt())
    )
      throw error;
    // writer 冲突 + paginated 历史：先抢救历史再抛。
    if (isWriterConflictError(error) && metadataReadResult?.thread.historyMode === `paginated`)
      try {
        await recoverWriterConflictedHistory(manager, {
          conversationId,
          isCurrentResumeAttempt,
          mapThreadTurns: historyPolicy.mapThreadTurns,
          requestOptions,
          thread: metadataReadResult.thread,
          turnMergePolicy: historyPolicy.turnMergePolicy,
          workspaceRoots: resumeWorkspaceRoots,
        });
      } catch (recoveryError) {
        manager.logger.warning(`Failed to hydrate writer-conflicted thread history`, {
          safe: { conversationId },
          sensitive: { error: recoveryError },
        });
      }
    throw (
      !isCurrentResumeAttempt() ||
        (errorMessage(error)?.includes(`session ${conversationId} is archived.`) &&
          manager.suppressArchivedConversation(conversationId),
        !isCurrentResumeAttempt()) ||
        manager.updateConversationState(conversationId, (draft: any) => {
          if (draft.resumeState === `resuming`) draft.resumeState = `needs_resume`;
        }),
      error
    );
  }
}
