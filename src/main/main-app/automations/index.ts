// automations —— cron/心跳自动化执行引擎（原版 8,725-9,982 区段）。
//
// 职责：
//   - 调度器工厂 createAutomationScheduler（原 pae）：tick 轮询（默认 30s，
//     每 tick 至多 3 个运行）、本地自动化远端同步（成功后 5 分钟节流）、
//     heartbeat 与普通 cron 两条执行路径、运行间互斥（automation id 集合 +
//     heartbeat 目标线程集合）；
//   - 立即执行 runAutomationNow（原 mae，run_now 触发）;
//   - 单次 cron 运行 runAutomationTurn/runAutomationForTarget（原 ks/gae）：
//     解析目标目录（projectless/project/legacy）、模型选择与降级、权限求解
//     （Ds/uae/fs）、worktree 支线（git worker create-worktree + 归属登记）、
//     可视化目录 writableRoots 追加、thread/turn 启动与失败回滚；
//   - heartbeat 运行（原 vae/yae/Ms/Eae/Dae/Oae/Fs）：线程忙闲判定
//     （Ns/Ps，含 app-server 通知 tail history 的 30s 超时竞速）、renderer
//     协作模式/权限状态缓存（12e4 过期）、prompt 模板渲染、turn 启动并
//     等待完成（600s 上限）或 fire-and-forget、thread_archived 时暂停自动化；
//   - 线性化顺序工具 runSequential（原 fae）。
//
// 与 R5 的 habitat 迁移层（67,683 一带的 localAutomationHabitatMigration）是
// 两码事，勿混淆。
//
// 模块加载期副作用：仅常量与 logger 创建（memoizedTaggedLogger），无
// Electron/fs/定时器副作用。
//
// 跨模块依赖（深析 §3.7）：权限求解与项目目录依赖 @chunk/shared 的 automation
// 登记表（jr/Pr/zr/Tr/xr/Qr/ni/ti/_r/ii 等压缩导出）；projectless 目录创建
// （ds/vt）、CUA config 写入（ns）、线程 config 装配（$o）、codex-app MCP
// overrides（os）、模型路由（Ln）、WSL 路径转换（zn）来自其他并行重写簇，
// 暂按语义名 import，缺导出待对应模块完成后对齐。

import { net } from "electron";
import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { memoizedTaggedLogger } from "@chunk/logger";
import {
  // automation 登记表与运行记录（shared 内部 registry）
  jr as listRunnableAutomations,
  Pr as recordAutomationRunStart,
  Qr as recordAutomationRunPendingStart,
  zr as setAutomationNextRunAt,
  Tr as computeAutomationNextRun,
  kr as isRruleDue,
  xd as isHeartbeatAutomation,
  xr as getCanonicalAutomation,
  Vr as updateCanonicalRecord,
  _r as pruneAutomationRegistry,
  ii as settleInterruptedAutomationRuns,
  ni as commitAutomationRunThread,
  ti as failAutomationRun,
  // 权限求解
  Od as getDefaultCodexConfig,
  Md as toManagedPermissionProfile,
  Fd as isPermissionCompatible,
  Dd as permissionProfileFor,
  Id as allowedPermissionProfilesFor,
  Ad as basePermissionProfileKind,
  Pd as isGuardianApprovalsProfile,
  Ed as permissionProfileSchema,
  // 目录/路径
  qo as unwrapStoredValue,
  Ns as expandHomeDir,
  Wo as joinProjectRootsAsCwd,
  zi as shouldUseWslPaths,
  $u as toConversationId,
  qi as visualizationIdForThread,
  ms as readDesktopTomlSection,
  // 配置/能力门
  Wu as appServerVersionGate,
  Ku as appServerSupportsListThreadTurns,
  zt as hostedAutomationsInstructions,
  Rt as composeThreadInstructions,
  Dc as configOverrideKeyForVersion,
  Xi as turnSummaryKind,
  Wn as ExecutionConfigLoadingError,
  $i as appServerErrorCode,
  yd as resolveAutomationModel,
  vd as findModelUpgrade,
  Cr as remoteHostedAutomationIdentity,
  // rrule
  wr as parseRruleIntervalMs,
  Er as nextRruleOccurrence,
  // global-state 键对象 + 设置键命名空间（shared 字母导出）
  iu as SHARED_STATE_KEYS,
  Td as AGENT_MODE_BY_HOST_ID,
  Fa as settingsKeys,
} from "@chunk/shared";
import { J as PERSISTED_ATOM_STATE_KEY } from "@chunk/bootstrap";
import {
  DEFAULT_DESKTOP_FEATURE_AVAILABILITY,
  getDesktopFeatureAvailability,
} from "../misc/availability";
import {
  createProjectlessThreadPathsViaAppServer,
  projectlessWorkspaceInstructions,
} from "../misc/projectless-workspace";
import { convertPathForExecutionHost } from "../misc/workspace-paths";
import { resolveAutomationModelRouting } from "../misc/model-routing";
import { scheduleComputerUseConfigWrite } from "../computer-use/config-writer";
import { buildThreadStartConfigOverrides } from "../misc/automation-thread-config";
import { resolveCodexAppMcpOverrides } from "../misc/codex-app-tools-config";

// ---------------------------------------------------------------------------
// 常量（原 8,725-8,734）
// ---------------------------------------------------------------------------

/** 调度器 tick 间隔（ms，原 nae = 3e4）。 */
const TICK_INTERVAL_MS = 30_000;
/** 两次运行的最小间隔（ms，原 gs = 6e4）。 */
const MIN_RUN_INTERVAL_MS = 60_000;
/** 本地自动化同步节流（ms，原 _s = 3e5）。 */
const SYNC_THROTTLE_MS = 300_000;
/** 每 tick 最多启动的运行数（原 rae = 3）。 */
const MAX_RUNS_PER_TICK = 3;
/** renderer 状态过期（ms，原 iae = 12e4）。 */
const RENDERER_STATE_STALE_MS = 120_000;
/** heartbeat 最小重试间隔（ms，原 vs = 6e4）。 */
const HEARTBEAT_MIN_INTERVAL_MS = 60_000;
/** turn 活动查询超时（ms，原 ys = 3e4）。 */
const TURN_ACTIVITY_TIMEOUT_MS = 30_000;
/** heartbeat 等待完成超时（ms，原 aae = 6e5）。 */
const HEARTBEAT_COMPLETION_TIMEOUT_MS = 600_000;

/** 必须保留的动态工具名（原 bs）。 */
const SET_THREAD_ARCHIVED_TOOL = `set_thread_archived`;
/** 必须剔除的动态工具名（原 oae）——写 settings 不允许自动化触达。 */
const WRITE_SETTINGS_TOOL = `write_settings`;

/** automations 具名 logger（原 xs）。 */
const logger = memoizedTaggedLogger(`automations`);

/** requestDynamicToolsForThreadStart 的默认实现（原 Ss）。 */
const noDynamicTools = async () => [];
/** isHostedAutomationAppAvailable 的默认实现（原 Cs）。 */
const hostedAppUnavailable = async () => false;

// ---------------------------------------------------------------------------
// remark-directive 输出约束模板（原 eae，8,636-8,684）
// ---------------------------------------------------------------------------

const HEARTBEAT_BASE_INSTRUCTIONS = `Response MUST end with a remark-directive block.

## Responding

- Answer the user normally and concisely. Explain what you found, what you did, and what the user should focus on now.
- Automations: use the memory file at \`$CODEX_HOME/automations/<automation_id>/memory.md\` (create it if missing).
  - Read it first (if present) to avoid repeating recent work, especially for "changes since last run" tasks.
  - Memory is important: some tasks must build on prior work, and others must avoid duplicating prior focus.
  - Before returning the directive, write a concise summary of what you did/decided plus the current run time.
  - Use the \`Automation ID:\` value provided in the message to locate/update this file.
- REQUIRED: End with a valid remark-directive block on its own line (not inline).
  - Always include an inbox item directive:
    \`::inbox-item{title="Sample title" summary="Place description here"}\`

## Choosing return value

- For recurring/bg threads (e.g., "pull datadog logs and fix any new bugs", "address the PR comments"):
  - Always return \`::inbox-item{...}\` with the title/summary the user should see.

## Guidelines

- Directives MUST be on their own line.
- Output exactly ONE inbox-item directive.
- Do NOT use invalid remark-directive formatting.
- DO NOT place commas between arguments.
  - Valid: \`::inbox-item{title="Sample title" summary="Place description here"}\`
  - Invalid: \`::inbox-item{title="Sample title",summary="Place description here"}\`
- When referring to files, use full absolute filesystem links in Markdown (not relative paths).
  - Valid: [\`/Users/alice/project/src/main.ts\`](/Users/alice/project/src/main.ts)
  - Invalid: \`src/main.ts\` or \`[main](src/main.ts)\`
- Try not to ask the user for more input if possible to infer.
- If a PR is opened by the automation, add the \`codex-automation\` label when available alongside the normal \`codex\` label.
- Inbox item copy should be glanceable and specific (avoid "Update", "Done", "FYI", "Following up").
  - Title: what this thread now _is_ (state + object). Aim ~4-8 words.
  - Title should explain what was built or what happened.
- Summary: what the user should _do/know next_ (next step, blocker, or waiting-on). Aim ~6-14 words.
- Summary should usually match the general automation name or prompt summary.
- Both title and summary should be fairly short; usually avoid one-word titles/summaries.
  - Prefer concrete nouns + verbs; include a crisp status cue when helpful: "blocked", "needs decision", "ready for review".

## Examples (inbox-item)

- Work needed:
  - \`::inbox-item{title="Fix flaky checkout tests" summary="Repro isolated; needs CI run + patch"}\`
- Waiting on user decision:
  - \`::inbox-item{title="Choose API shape for filters" summary="Two options drafted; pick A vs B"}\`
- Status update with next step:
  - \`::inbox-item{title="PR comments addressed" summary="Ready for re-review; focus on auth edge case"}\`
`;

/** heartbeat 输入模板（原 tae，8,685-8,692）。 */
const HEARTBEAT_PROMPT_TEMPLATE = `<heartbeat>
  <automation_id>{{AUTOMATION_ID}}</automation_id>
  <current_time_iso>{{NOW_ISO}}</current_time_iso>
  <instructions>
{{AUTOMATION_PROMPT}}
  </instructions>
</heartbeat>
`;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 自动化对象（原版以 any 在函数间流转；此处仅声明消费到的字段）。 */
export interface Automation {
  id: string;
  name: string;
  kind: string;
  prompt: string;
  rrule: unknown;
  lastRunAt: number | null;
  nextRunAt: number | null;
  updatedAt: number;
  targetThreadId: string;
  target?: { type: string; projectId?: string } | null;
  cwds: string[];
  executionEnvironment: string | null;
  pluginTemplateId: string | null;
  notificationPolicy: unknown;
  model: string | null;
  reasoningEffort: string | null;
  localEnvironmentConfigPath: string | null;
  settings?: { model?: string; reasoning_effort?: string | null; developer_instructions?: string } & Record<
    string,
    unknown
  >;
  [key: string]: unknown;
}

/** app-server 连接（原版接口在区间外；仅声明本模块触达的方法）。 */
export interface AppServerConnection {
  hostConfig: { id: string; [key: string]: unknown };
  appServerVersion: string | null;
  listModels(input: unknown): Promise<{ data: unknown[]; nextCursor?: string | null }>;
  getUserSavedConfiguration(cwd: string): Promise<any>;
  getConfigRequirements(): Promise<{ requirements: any }>;
  notifyAutomationRunsUpdated(): void;
  notifyAutomationRunTriggered(params: Record<string, unknown>): void;
  startThread(params: Record<string, unknown>): Promise<{ thread: { id: string; sessionId: string }; cwd?: string }>;
  startTurn(params: Record<string, unknown>, opts?: Record<string, unknown>): Promise<{ turn: { id: string; status?: string } }>;
  updateThreadTitle(threadId: string, title: string, subtitle: null): Promise<unknown>;
  readThread(id: string, opts?: unknown, fetchOpts?: unknown): Promise<any>;
  resumeThread(id: string, params: unknown): Promise<{ thread: any; cwd?: string }>;
  codexHome(): Promise<string>;
  platformPath(): Promise<any>;
  workspacesRoot(): Promise<string>;
  createDirectory(path: string, opts: { recursive: boolean }): Promise<unknown>;
  registerInternalNotificationHandler(handler: (notification: any) => void): () => void;
  registerInternalAuthenticatedPrincipalChangeHandler(handler: () => void): () => void;
  registerInternalConnectionStateHandler(handler: (state: unknown) => void): () => void;
}

/** git worker 请求函数（requestGitWorker）。 */
export type GitWorkerRequest = (request: {
  method: string;
  params: Record<string, unknown>;
}) => Promise<any>;

/** cron turn 已读状态准备器（prepareCronTurnReadState）。 */
export interface CronTurnReadState {
  handleStartFailure(): void;
}

// ---------------------------------------------------------------------------
// 权限求解（原 8,693-8,904）
// ---------------------------------------------------------------------------

/**
 * 无兼容组合时抛错前的最后一搏（原 fs，8,693-8,711）：
 * 在 managed requirements 允许的评审人 × 审批策略里找第一个兼容组合。
 */
function requireCompatiblePermissions(
  base: { approvalsReviewer: unknown; approvalPolicy: unknown; sandboxPolicy: { type: string } },
  managed?: {
    allowedApprovalsReviewers?: string[] | null;
    allowedApprovalPolicies?: string[] | null;
    allowedPermissionProfiles?: unknown[] | null;
  } | null,
) {
  let reviewers = [base.approvalsReviewer, ...(managed?.allowedApprovalsReviewers ?? [])];
  let policies = [base.approvalPolicy, ...(managed?.allowedApprovalPolicies ?? [])];
  let sandboxes = [base.sandboxPolicy, getDefaultCodexConfig().sandboxPolicy];
  for (let sandbox of sandboxes)
    if (sandbox.type !== `dangerFullAccess` && managed?.allowedPermissionProfiles == null) {
      for (let reviewer of reviewers)
        for (let policy of policies)
          if ((policy !== `never` || base.approvalPolicy === `never`) &&
            isPermissionCompatible(managed, toManagedPermissionProfile(sandbox), policy, reviewer))
            return {
              ...base,
              activePermissionProfile: null,
              sandboxPolicy: sandbox,
              approvalPolicy: policy,
              approvalsReviewer: reviewer,
            };
    }
  throw Error(`No compatible automation permissions satisfy the managed requirements`);
}

/** 解析自动化的项目目录（原 ps，8,712-8,717）。 */
function resolveAutomationProject(
  globalState: { get(key: unknown): unknown },
  target: { type: string; projectId?: string },
): { projectId: string; roots: string[] } | null {
  if (target.type === `projectless`) return null;
  let project = unwrapStoredValue(globalState.get(SHARED_STATE_KEYS.LOCAL_PROJECTS))[target.projectId!];
  if (project == null) throw Error(`Automation project no longer exists`);
  return { projectId: target.projectId!, roots: project.rootPaths.map(expandHomeDir) };
}

// n.iu 的 global-state 键对象（同名异义陷阱：与 misc/installer-attribution 的
// iu 单例无关）。

/** 兼容 cwd 列表（原 ms，8,718-8,720）：无项目时回退 `~`。 */
export function resolveCompatibilityCwds(
  globalState: { get(key: unknown): unknown },
  projectId: string | null,
): string[] {
  return projectId == null
    ? [expandHomeDir(`~`)]
    : (resolveAutomationProject(globalState, { type: `project`, projectId })?.roots ?? []);
}

/** worktree 运行的前置条件（原 hs，8,721-8,724）。 */
export function assertWorktreeTargetRequirements({
  compatibilityCwds,
  executionEnvironment,
  projectId,
}: {
  compatibilityCwds: string[];
  executionEnvironment: string | null;
  projectId: string | null;
}): void {
  if (executionEnvironment === `worktree` && (projectId == null || compatibilityCwds.length === 0))
    throw Error(`Worktree automations require a project with a folder`);
}

/**
 * 求解 cron 运行权限（原 Ds，8,843-8,875）。
 * - 期望档位：用户 config 显式 custom（sandbox_mode/approval_policy）→
 *   guardian-approvals（managed）→ auto；
 * - 受 managed 允许列表约束（Id），不兼容时回落到允许列表里的第一个可期档位；
 * - 仍无组合时 requireCompatiblePermissions 兜底抛错；
 * - projectless（a）时倾向 `never` + `user` 评审人，且 workspace-write 的
 *   网络访问沿用用户 config。
 */
function resolveAutomationPermissions(
  cwds: string[],
  userConfig: any,
  configRequirements: any,
  agentModeOverride: any = null,
  isProjectless = false,
): { approvalPolicy: unknown; approvalsReviewer: unknown; sandboxPolicy: any } {
  let expectedProfileKind: string;
  expectedProfileKind =
    userConfig.sandbox_mode != null || userConfig.approval_policy != null
      ? `custom`
      : isGuardianApprovalsProfile(basePermissionProfileKind(userConfig))
        ? `guardian-approvals`
        : `auto`;
  let desiredProfileKind = agentModeOverride ?? expectedProfileKind;
  let allowed = allowedPermissionProfilesFor(configRequirements, userConfig);
  let fallbackProfileKind = [`auto`, `granular`, `guardian-approvals`, `read-only`].find((kind) =>
    allowed.includes(kind),
  );
  let resolvedKind = allowed.includes(desiredProfileKind) ? desiredProfileKind : fallbackProfileKind;
  if (resolvedKind == null)
    return requireCompatiblePermissions(
      permissionProfileFor(desiredProfileKind, cwds, userConfig),
      configRequirements,
    );
  let profile = permissionProfileFor(resolvedKind, cwds, userConfig);
  let neverAllowed =
    configRequirements?.allowedApprovalPolicies == null ||
    configRequirements.allowedApprovalPolicies.includes(`never`);
  let reviewer =
    isProjectless &&
    neverAllowed &&
    (configRequirements?.allowedApprovalsReviewers == null ||
      configRequirements.allowedApprovalsReviewers.includes(`user`))
      ? `user`
      : profile.approvalsReviewer;
  return {
    approvalPolicy:
      neverAllowed && (isProjectless || (resolvedKind !== `granular` && reviewer === `user`))
        ? `never`
        : profile.approvalPolicy,
    approvalsReviewer: reviewer,
    sandboxPolicy:
      isProjectless &&
      profile.sandboxPolicy.type === `workspaceWrite` &&
      userConfig.sandbox_mode === `workspace-write` &&
      userConfig.sandbox_workspace_write?.network_access === true
        ? { ...profile.sandboxPolicy, networkAccess: true }
        : profile.sandboxPolicy,
  };
}

/** 读取按 host 覆盖的 agent-mode（原 uae，8,876-8,882）。 */
function readAgentModeOverrideForHost(
  globalState: { get(key: unknown): any },
  hostId: string,
): any {
  let byHost = globalState.get(PERSISTED_ATOM_STATE_KEY)?.[AGENT_MODE_BY_HOST_ID];
  if (typeof byHost != `object` || !byHost || Array.isArray(byHost)) return null;
  let value = Object.getOwnPropertyDescriptor(byHost, hostId)?.value;
  let parsed = permissionProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}


/**
 * 求解 heartbeat 运行权限（原 dae，8,883-8,904）：
 * 期望档位不兼容时按 auto↔guardian-approvals → read-only → 首个非
 * full-access 档位回退，全部落空才兜底抛错。
 */
function resolveHeartbeatPermissions(
  cwd: string[],
  userConfig: any,
  configRequirements: any,
): { approvalPolicy: unknown; approvalsReviewer: unknown; sandboxPolicy: any } {
  let allowed = allowedPermissionProfilesFor(configRequirements, userConfig);
  let expectedProfileKind = basePermissionProfileKind(userConfig);
  let desiredProfileKind =
    userConfig.sandbox_mode != null || userConfig.approval_policy != null
      ? `custom`
      : isGuardianApprovalsProfile(expectedProfileKind)
        ? `guardian-approvals`
        : `auto`;
  let resolved = desiredProfileKind;
  if (!allowed.includes(resolved)) {
    if (desiredProfileKind === `auto` && allowed.includes(`guardian-approvals`))
      resolved = `guardian-approvals`;
    else if (desiredProfileKind === `guardian-approvals` && allowed.includes(`auto`))
      resolved = `auto`;
    else if (allowed.includes(`read-only`)) resolved = `read-only`;
    else {
      let firstAllowed = allowed.find((kind: string) => kind !== `full-access`);
      if (firstAllowed == null)
        return requireCompatiblePermissions(
          permissionProfileFor(desiredProfileKind, cwd, userConfig),
          configRequirements,
        );
      resolved = firstAllowed;
    }
  }
  return permissionProfileFor(resolved, cwd, userConfig);
}

/** 顺序执行（原 fae，8,905-8,907）：reduce 成 promise 链。 */
function runSequential<T>(items: T[], task: (item: T, index: number) => Promise<void>) {
  return items.reduce(
    (chain, item, index) => chain.then(() => task(item, index)),
    Promise.resolve(),
  );
}

// ---------------------------------------------------------------------------
// 调度器（原 pae，8,908-9,105）
// ---------------------------------------------------------------------------

/** 调度器工厂参数（原 pae 的 options）。 */
export interface AutomationSchedulerOptions {
  appVersion: string;
  statsig: unknown;
  appServerConnectionRegistry: { getConnection(hostId: string): AppServerConnection };
  getDesktopFeatureAvailability?: () => Record<string, unknown>;
  requestGitWorker: GitWorkerRequest;
  globalState: {
    get(key: unknown): any;
    update(key: unknown, updater: (value: any) => any): void;
  };
  threadProjectAssignments: {
    setProjectless(params: { threadId: unknown; projectless: boolean }): Promise<unknown>;
    setAssignment(params: { threadId: unknown; assignment: unknown }): Promise<unknown>;
  };
  settingsStore: { getEffective(key: unknown): any };
  appServerClient: { hostConfig: unknown } & Record<string, unknown>;
  worktreeLifecycle: {
    setOwnerThread(params: { conversationId: unknown; worktree: unknown }): Promise<unknown>;
    requestCleanup(): void;
  };
  requestDynamicToolsForThreadStart?: () => Promise<any[]>;
  isHostedAutomationAppAvailable?: () => Promise<boolean>;
  syncAutomations?: () => Promise<unknown>;
  updateCanonicalAutomation?: (automation: unknown) => Promise<unknown> | unknown;
  deleteArchivedHeartbeat?: (automationId: string) => Promise<unknown> | unknown;
  isOnline?: () => boolean;
  prepareCronTurnReadState?: (params: {
    appServerConnection: AppServerConnection;
    threadId: string;
    notificationPolicy: unknown;
  }) => CronTurnReadState | undefined;
  isPackaged?: boolean;
  repoRoot?: string;
  tickMs?: number;
  maxPerTick?: number;
}

/** 调度器句柄（原 pae 的返回值）。 */
export interface AutomationScheduler {
  getRestartBlockers(): string[];
  start(): void;
  dispose(): void;
  setLocalAutomationsCapability(enabled: boolean): void;
  setHeartbeatThreadRendererState(state: {
    threadId?: string | null;
    isEligible: boolean;
    reason?: string | null;
    collaborationMode?: unknown | null;
    permissions?: unknown | null;
  }): void;
}

/**
 * 创建 automations 调度器（原 pae，8,908-9,105）。
 * 语义保持点：
 *   - tick 内先取连接、截取待运行列表（排除 in-flight），再决定是否远端同步；
 *   - 同步失败重置节流计时（下次 tick 立即重试）；
 *   - heartbeat 与目标线程互斥（j 集合），AbortController 贯穿 tick 代际；
 *   - execution-config-loading 失败视为「稍后重试」（gs 后），其余告警。
 */
export function createAutomationScheduler(options: AutomationSchedulerOptions): AutomationScheduler {
  let {
    appVersion,
    statsig,
    appServerConnectionRegistry,
    getDesktopFeatureAvailability: getAvailability = () => DEFAULT_DESKTOP_FEATURE_AVAILABILITY,
    requestGitWorker,
    globalState,
    threadProjectAssignments,
    settingsStore,
    appServerClient,
    worktreeLifecycle,
    requestDynamicToolsForThreadStart = noDynamicTools,
    isHostedAutomationAppAvailable = hostedAppUnavailable,
    syncAutomations,
    updateCanonicalAutomation,
    deleteArchivedHeartbeat,
    isOnline = () => net.isOnline(),
    prepareCronTurnReadState,
    isPackaged = true,
    repoRoot = process.cwd(),
    tickMs = TICK_INTERVAL_MS,
    maxPerTick = MAX_RUNS_PER_TICK,
  } = options;

  let disposed = false;
  let started = false;
  let tickInFlight = false;
  let nextSyncAtMs = 0;
  let localAutomationsEnabled = false;
  let tickTimer: ReturnType<typeof setInterval> | null | undefined;
  let runAbort = new AbortController();
  /** in-flight 运行的 automation id 集合（原 A）。 */
  let inFlightRunIds = new Set<string>();
  /** in-flight heartbeat 的目标线程集合（原 j）。 */
  let inFlightHeartbeatThreads = new Set<string>();
  /** renderer 上报的线程展示状态（原 M）。 */
  let heartbeatThreadRendererStates = new Map<
    string,
    { isEligible: boolean; reason?: string | null; updatedAtMs: number }
  >();
  /** renderer 上报的协作模式（原 N）。 */
  let heartbeatThreadCollaborationModes = new Map<string, unknown>();
  /** renderer 上报的权限（原 P）。 */
  let heartbeatThreadPermissions = new Map<string, unknown>();

  let tick = async () => {
    if (!tickInFlight && localAutomationsEnabled) {
      tickInFlight = true;
      try {
        let connection = appServerConnectionRegistry.getConnection(
          (appServerClient as { hostConfig: { id: string } }).hostConfig.id,
        );
        let takeDue = (now: number) =>
          listRunnableAutomations(now, maxPerTick + inFlightRunIds.size)
            .filter((automation: Automation) => !inFlightRunIds.has(automation.id))
            .slice(0, maxPerTick);
        let now = Date.now();
        let due = takeDue(now);
        if (syncAutomations != null && isOnline()) {
          if (due.length > 0) {
            try {
              await syncAutomations();
              nextSyncAtMs = Date.now() + SYNC_THROTTLE_MS;
            } catch (error) {
              nextSyncAtMs = 0;
              logger().warning(`Failed to synchronize local automations before run`, {
                safe: {},
                sensitive: { error },
              });
            }
            now = Date.now();
            due = takeDue(now);
          } else if (now >= nextSyncAtMs) {
            nextSyncAtMs = now + SYNC_THROTTLE_MS;
            syncAutomations().catch((error) => {
              nextSyncAtMs = 0;
              logger().warning(`Failed to synchronize local automations`, {
                safe: {},
                sensitive: { error },
              });
            });
          }
        }
        await Promise.all(
          due.map(async (automation: Automation) => {
            try {
              if (automation.lastRunAt != null && automation.lastRunAt + MIN_RUN_INTERVAL_MS > now) {
                setAutomationNextRunAt(automation.id, automation.lastRunAt + MIN_RUN_INTERVAL_MS);
                return;
              }
              if (isHeartbeatAutomation(automation)) {
                if (inFlightHeartbeatThreads.has(automation.targetThreadId)) {
                  setAutomationNextRunAt(automation.id, now + HEARTBEAT_MIN_INTERVAL_MS);
                  return;
                }
                inFlightHeartbeatThreads.add(automation.targetThreadId);
                inFlightRunIds.add(automation.id);
                runHeartbeatScheduled({
                  automation,
                  now,
                  appServerConnection: connection,
                  signal: runAbort.signal,
                  assertCurrent: () => {
                    if ((runAbort.signal.throwIfAborted(),
                      appServerConnectionRegistry.getConnection(
                        (appServerClient as { hostConfig: { id: string } }).hostConfig.id,
                      ) !== connection))
                      throw new DOMException(`Heartbeat connection was replaced`, `AbortError`);
                  },
                  heartbeatThreadRendererStates,
                  heartbeatThreadCollaborationModes,
                  heartbeatThreadPermissions,
                  updateCanonicalAutomation,
                  deleteArchivedHeartbeat,
                  isHostedAutomationAppAvailable,
                })
                  .catch((error) => {
                    (error instanceof Error && error.name === `AbortError`) ||
                      logger().warning(`Scheduled run failed`, {
                        safe: { automationId: automation.id, error },
                        sensitive: {},
                      });
                  })
                  .finally(() => {
                    inFlightRunIds.delete(automation.id);
                    inFlightHeartbeatThreads.delete(automation.targetThreadId);
                  });
                return;
              }
              let nextRunAt = computeAutomationNextRunAt({ automation, now });
              recordAutomationRunStart(automation.id, nextRunAt);
              await runAutomationTurn({
                statsig,
                appVersion,
                automation,
                appServerConnection: connection,
                desktopFeatureAvailability: getAvailability(),
                requestGitWorker,
                globalState,
                threadProjectAssignments,
                settingsStore,
                appServerClient,
                worktreeLifecycle,
                requestDynamicToolsForThreadStart,
                isHostedAutomationAppAvailable,
                prepareCronTurnReadState,
                isPackaged,
                repoRoot,
                runTrigger: `scheduled`,
              });
            } catch (error) {
              if (error instanceof ExecutionConfigLoadingError &&
                (error as any).result.reason === `execution-config-loading`) {
                let canonical = getCanonicalAutomation(automation.id);
                canonical?.updatedAt === automation.updatedAt &&
                  setAutomationNextRunAt(automation.id, Date.now() + MIN_RUN_INTERVAL_MS);
                return;
              }
              logger().warning(`Scheduled run failed`, {
                safe: { automationId: automation.id, error },
                sensitive: {},
              });
            }
          }),
        );
      } finally {
        tickInFlight = false;
      }
    }
  };
  let scheduleTick = () => {
    tick().catch((error) => {
      logger().debug(`Automation scheduler tick threw`, { safe: { error }, sensitive: {} });
    });
  };

  return {
    getRestartBlockers: () => [
      ...(tickInFlight ? [`automation.tick`] : []),
      ...(inFlightRunIds.size > 0 ? [`automation.heartbeat`] : []),
    ],
    start: () => {
      if (!(started || disposed)) {
        started = true;
        try {
          settleInterruptedAutomationRuns() &&
            appServerConnectionRegistry
              .getConnection((appServerClient as { hostConfig: { id: string } }).hostConfig.id)
              .notifyAutomationRunsUpdated();
        } catch (error) {
          logger().warning(`Failed to settle interrupted automation runs`, {
            safe: {},
            sensitive: { error },
          });
        }
        pruneAutomationRegistry(Date.now());
        scheduleTick();
        tickTimer = setInterval(scheduleTick, tickMs);
        tickTimer.unref();
      }
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      runAbort.abort();
      if (tickTimer != null) clearInterval(tickTimer);
      inFlightRunIds.clear();
      inFlightHeartbeatThreads.clear();
      heartbeatThreadRendererStates.clear();
      heartbeatThreadCollaborationModes.clear();
      heartbeatThreadPermissions.clear();
    },
    setLocalAutomationsCapability: (enabled: boolean) => {
      if (disposed || localAutomationsEnabled === enabled) return;
      localAutomationsEnabled = enabled;
      if (started && enabled) scheduleTick();
    },
    setHeartbeatThreadRendererState: (state) => {
      if (disposed) return;
      let threadId = state.threadId?.trim() ?? ``;
      if (threadId.length === 0) return;
      heartbeatThreadRendererStates.set(threadId, {
        isEligible: state.isEligible,
        reason: state.reason,
        updatedAtMs: Date.now(),
      });
      if (state.collaborationMode != null)
        heartbeatThreadCollaborationModes.set(threadId, state.collaborationMode);
      if (state.permissions == null) heartbeatThreadPermissions.delete(threadId);
      else heartbeatThreadPermissions.set(threadId, state.permissions);
    },
  };
}

// ---------------------------------------------------------------------------
// 立即执行（原 mae，9,106-9,159）
// ---------------------------------------------------------------------------

/** run_now 入口（原 mae）：heartbeat 走 yae，普通自动化走 ks。 */
export async function runAutomationNow({
  appVersion,
  statsig,
  automationId,
  appServerConnection,
  desktopFeatureAvailability = DEFAULT_DESKTOP_FEATURE_AVAILABILITY,
  requestGitWorker,
  globalState,
  threadProjectAssignments,
  settingsStore,
  appServerClient,
  worktreeLifecycle,
  requestDynamicToolsForThreadStart = noDynamicTools,
  isHostedAutomationAppAvailable = hostedAppUnavailable,
  prepareCronTurnReadState,
  isPackaged = true,
  repoRoot = process.cwd(),
  collaborationMode = null,
  permissions = null,
}: Omit<AutomationSchedulerOptions, "appServerConnectionRegistry" | "getDesktopFeatureAvailability" | "syncAutomations" | "updateCanonicalAutomation" | "deleteArchivedHeartbeat" | "isOnline" | "tickMs" | "maxPerTick"> & {
  automationId: string;
  appServerConnection: AppServerConnection;
  desktopFeatureAvailability?: Record<string, unknown>;
  collaborationMode?: unknown | null;
  permissions?: unknown | null;
}): Promise<void> {
  let automation = getCanonicalAutomation(automationId);
  if (!automation) throw Error(`Automation not found.`);
  if (isHeartbeatAutomation(automation)) {
    await runHeartbeatNow({
      automation,
      appServerConnection,
      collaborationMode,
      permissions,
      isHostedAutomationAppAvailable,
    });
    return;
  }
  let nextRunAt = computeAutomationNextRunAt({ automation, now: Date.now() });
  recordAutomationRunStart(automation.id, nextRunAt);
  await runAutomationTurn({
    statsig,
    appVersion,
    automation,
    appServerConnection,
    desktopFeatureAvailability,
    requestGitWorker,
    globalState,
    threadProjectAssignments,
    settingsStore,
    appServerClient,
    worktreeLifecycle,
    requestDynamicToolsForThreadStart,
    isHostedAutomationAppAvailable,
    prepareCronTurnReadState,
    isPackaged,
    repoRoot,
    runTrigger: `run_now`,
  });
}

// ---------------------------------------------------------------------------
// cron 运行主体（原 Os/ks/As/hae/js/gae/_ae，9,160-9,550）
// ---------------------------------------------------------------------------

/** 计算下次运行时间（原 Os，9,160-9,164）。 */
function computeAutomationNextRunAt({ automation, now }: { automation: Automation; now: number }) {
  return automation.nextRunAt != null &&
    automation.nextRunAt <= now &&
    isRruleDue(automation.rrule)
    ? null
    : computeAutomationNextRun({ automation, now });
}

/** cron 一次完整运行（原 ks，9,165-9,265）。 */
async function runAutomationTurn({
  appVersion,
  statsig,
  automation,
  appServerConnection,
  desktopFeatureAvailability,
  requestGitWorker,
  globalState,
  threadProjectAssignments,
  settingsStore,
  appServerClient,
  worktreeLifecycle,
  requestDynamicToolsForThreadStart,
  isHostedAutomationAppAvailable,
  prepareCronTurnReadState,
  isPackaged,
  repoRoot,
  runTrigger,
}: {
  appVersion: string;
  statsig: unknown;
  automation: Automation;
  appServerConnection: AppServerConnection;
  desktopFeatureAvailability: Record<string, unknown>;
  requestGitWorker: GitWorkerRequest;
  globalState: AutomationSchedulerOptions["globalState"];
  threadProjectAssignments: AutomationSchedulerOptions["threadProjectAssignments"];
  settingsStore: AutomationSchedulerOptions["settingsStore"];
  appServerClient: AutomationSchedulerOptions["appServerClient"];
  worktreeLifecycle: AutomationSchedulerOptions["worktreeLifecycle"];
  requestDynamicToolsForThreadStart: () => Promise<any[]>;
  isHostedAutomationAppAvailable: () => Promise<boolean>;
  prepareCronTurnReadState?: AutomationSchedulerOptions["prepareCronTurnReadState"];
  isPackaged: boolean;
  repoRoot: string;
  runTrigger: string;
}): Promise<void> {
  let targets: Array<{ type: string; cwd?: string; projectId?: string; roots?: string[]; project?: unknown }>;
  if (automation.target == null)
    targets = automation.cwds.map((cwd) => ({ type: `legacy`, cwd }));
  else if (automation.target.type === `projectless`) targets = [{ type: `projectless` }];
  else {
    let project = resolveAutomationProject(globalState, automation.target as { type: string; projectId: string });
    targets = project == null ? [] : [{ type: `project`, project }];
  }
  if (targets.length === 0) {
    logger().warning(`Scheduled run skipped: no folders configured`, {
      safe: { automationId: automation.id },
      sensitive: {},
    });
    return;
  }
  let { automationModel: defaultModel } = await resolveAutomationModelRouting(statsig);
  let modelSettings = {
    model: automation.model ?? defaultModel,
    reasoningEffort: automation.reasoningEffort ?? `medium`,
  };
  try {
    let models = await appServerConnection.listModels({ includeHidden: true, cursor: null, limit: 100 });
    modelSettings = resolveAutomationModel({
      automation,
      models: models.data,
      defaultModel,
    });
    if (automation.model != null && automation.model !== modelSettings.model) {
      logger().warning(`Automation model unavailable; falling back`, {
        safe: {
          automationId: automation.id,
          requestedModel: automation.model,
          fallbackModel: modelSettings.model,
        },
        sensitive: {},
      });
    }
  } catch (error) {
    logger().warning(`Failed to load models for automation run`, {
      safe: { automationId: automation.id, error },
      sensitive: {},
    });
  }
  for (let target of targets)
    appServerConnection.notifyAutomationRunTriggered({
      automationKind: automation.kind,
      cwd: targetCwd(target),
      executionEnvironment: automation.executionEnvironment,
      model: modelSettings.model,
      pluginTemplateId: automation.pluginTemplateId,
      reasoningEffort: modelSettings.reasoningEffort,
      rrule: automation.rrule,
      runTrigger,
    });
  let { requirements: configRequirements } = await appServerConnection.getConfigRequirements();
  let appToolNames = await collectAppToolNames(requestDynamicToolsForThreadStart);
  let hostedAutomationsAvailable = await isHostedAutomationsEnabled(isHostedAutomationAppAvailable);
  let failures: unknown[] = [];
  await runSequential(targets, (target) =>
    runAutomationForTarget({
      runTrigger,
      appVersion,
      automation,
      appServerConnection,
      desktopFeatureAvailability,
      requestGitWorker,
      globalState,
      threadProjectAssignments,
      settingsStore,
      appServerClient,
      worktreeLifecycle,
      configRequirements,
      target,
      automationModelSettings: modelSettings,
      appToolNames,
      hostedAutomationsAvailable,
      prepareCronTurnReadState,
      isPackaged,
      repoRoot,
    }).catch((error) => {
      failures.push(error);
      logger().warning(`Scheduled run failed`, {
        safe: { automationId: automation.id, error },
        sensitive: {},
      });
    }),
  );
  if (failures.length > 0) {
    throw failures[0] instanceof ExecutionConfigLoadingError &&
      (failures.length !== targets.length ||
        failures.some((error) => !(error instanceof ExecutionConfigLoadingError)))
      ? AggregateError(failures, `Automation run partially failed`)
      : failures[0];
  }
}

/** 目标 → cwd 字符串（原 As，9,266-9,268）。 */
function targetCwd(target: { type: string; cwd?: string; project?: { roots: string[] } }): string | null {
  return target.type === `legacy`
    ? target.cwd!
    : target.type === `project`
      ? joinProjectRootsAsCwd(target.project!.roots)
      : null;
}

/**
 * 收集动态工具名（原 hae，9,269-9,284）：namespace 工具展开子工具名，
 * 永远保留 set_thread_archived，永远剔除 write_settings；失败时只保留
 * set_thread_archived。
 */
async function collectAppToolNames(
  requestDynamicToolsForThreadStart: () => Promise<any[]>,
): Promise<string[]> {
  try {
    let tools = (await requestDynamicToolsForThreadStart()).flatMap((tool) =>
      tool.type === `namespace` ? tool.tools.map(({ name }: { name: string }) => name) : [tool.name],
    );
    return [...new Set([...tools, SET_THREAD_ARCHIVED_TOOL])].filter(
      (name) => name !== WRITE_SETTINGS_TOOL,
    );
  } catch (error) {
    logger().warning(`Failed to load dynamic tools for automation run`, {
      safe: { error },
      sensitive: {},
    });
    return [SET_THREAD_ARCHIVED_TOOL];
  }
}

/** hosted Automations 可用性（原 js，9,285-9,298）。 */
async function isHostedAutomationsEnabled(
  isHostedAutomationAppAvailable: () => Promise<boolean>,
): Promise<boolean> {
  if (remoteHostedAutomationIdentity()[0] !== 0) return false;
  try {
    return await isHostedAutomationAppAvailable();
  } catch (error) {
    logger().warning(`Failed to check hosted Automations availability`, {
      safe: {},
      sensitive: { error },
    });
    return false;
  }
}

/** 单目标运行（原 gae，9,299-9,540）。 */
async function runAutomationForTarget({
  runTrigger,
  appVersion,
  automation,
  appServerConnection,
  desktopFeatureAvailability,
  requestGitWorker,
  globalState,
  threadProjectAssignments,
  settingsStore,
  appServerClient,
  worktreeLifecycle,
  configRequirements,
  target,
  automationModelSettings,
  appToolNames,
  hostedAutomationsAvailable,
  prepareCronTurnReadState,
  isPackaged,
  repoRoot,
}: {
  runTrigger: string;
  appVersion: string;
  automation: Automation;
  appServerConnection: AppServerConnection;
  desktopFeatureAvailability: Record<string, unknown>;
  requestGitWorker: GitWorkerRequest;
  globalState: AutomationSchedulerOptions["globalState"];
  threadProjectAssignments: AutomationSchedulerOptions["threadProjectAssignments"];
  settingsStore: AutomationSchedulerOptions["settingsStore"];
  appServerClient: AutomationSchedulerOptions["appServerClient"];
  worktreeLifecycle: AutomationSchedulerOptions["worktreeLifecycle"];
  configRequirements: any;
  target: { type: string; cwd?: string; project?: { projectId: string; roots: string[] } };
  automationModelSettings: { model: string; reasoningEffort: string };
  appToolNames: string[];
  hostedAutomationsAvailable: boolean;
  prepareCronTurnReadState?: AutomationSchedulerOptions["prepareCronTurnReadState"];
  isPackaged: boolean;
  repoRoot: string;
}): Promise<void> {
  let threadTitle = `Automation: ${automation.name}`;
  let baseInstructions = HEARTBEAT_BASE_INSTRUCTIONS.trim();
  let isProjectless = target.type === `projectless`;
  let project = target.type === `project` ? target.project! : null;
  let projectRoots = project?.roots ?? [];
  let targetCwdOrNull = targetCwd(target);
  let cwd = targetCwdOrNull ?? expandHomeDir(`~`);
  let compatibilityCwds = target.type === `legacy` ? [target.cwd!] : projectRoots;
  let projectlessOutputDirectory: string | null = null;
  let projectlessWorkspaceBrowserRoot: string | null = null;
  if (isProjectless || targetCwdOrNull == null) {
    let paths = await createProjectlessThreadPathsViaAppServer({
      appServerClient,
      configuredWorkspaceRoot:
        (appServerClient as { hostConfig: { id: string } }).hostConfig.id === `local`
          ? settingsStore.getEffective(settingsKeys.projectlessWorkspaceRoot.key)
          : null,
      createSplitDirectories: true,
      homeDirectory: homedir(),
      prompt: automation.prompt,
    });
    let useWslPaths = shouldUseWslPaths((appServerClient as { hostConfig: unknown }).hostConfig);
    cwd = expandHomeDir(convertPathForExecutionHost(paths.cwd, useWslPaths));
    projectlessOutputDirectory = convertPathForExecutionHost(paths.outputDirectory, useWslPaths);
    projectlessWorkspaceBrowserRoot = convertPathForExecutionHost(paths.workspaceRoot, useWslPaths);
    compatibilityCwds = [expandHomeDir(projectlessWorkspaceBrowserRoot), ...projectRoots];
    if (!isProjectless) projectlessOutputDirectory = null;
  }
  let userConfig = await appServerConnection.getUserSavedConfiguration(cwd);
  let agentModeOverride = readAgentModeOverrideForHost(
    globalState,
    (appServerClient as { hostConfig: { id: string } }).hostConfig.id,
  );
  let projectlessInstructions =
    projectlessOutputDirectory == null
      ? null
      : projectlessWorkspaceInstructions({
          cwd,
          projectlessOutputDirectory,
          projectlessWorkspaceBrowserRoot,
        });
  let developerInstructions = [
    composeThreadInstructions({
      baseInstructions,
      isNonGitWorkspace: true,
      threadToolsEnabled: true,
      hostedAutomationsEnabled: hostedAutomationsAvailable,
    }),
    projectlessInstructions,
  ]
    .filter((section) => !!section)
    .join(`

`);
  let permissions = resolveAutomationPermissions(
    compatibilityCwds,
    userConfig,
    configRequirements,
    agentModeOverride,
    isProjectless,
  );
  let useWorktree = automation.executionEnvironment === `worktree` && !isProjectless;
  if (useWorktree && targetCwdOrNull == null)
    throw Error(`Worktree automations require a project with a folder`);
  let hasStableMetadata =
    useWorktree &&
    (await requestGitWorker({
      method: `stable-metadata`,
      params: {
        cwd,
        hostConfig: (appServerClient as { hostConfig: unknown }).hostConfig,
        operationSource: `git_direct_call`,
      },
    })) != null;
  let startThreadAt = async (threadCwd: string) => {
    let hostConfig = (appServerClient as { hostConfig: unknown }).hostConfig;
    scheduleComputerUseConfigWrite({ settingsStore, isPackaged, repoRoot });
    let threadConfig = await buildThreadStartConfigOverrides({
      appServerConnection,
      appVersion,
      desktopFeatureAvailability,
      cwd: threadCwd,
      isPackaged,
      repoRoot,
      shouldUseWslPaths: shouldUseWslPaths(hostConfig),
    });
    let startParams = {
      model: automationModelSettings.model,
      modelProvider: null,
      cwd: threadCwd,
      approvalPolicy: permissions.approvalPolicy,
      approvalsReviewer: permissions.approvalsReviewer,
      sandbox:
        permissions.sandboxPolicy.type === `dangerFullAccess`
          ? `danger-full-access`
          : permissions.sandboxPolicy.type === `readOnly`
            ? `read-only`
            : `workspace-write`,
      config: {
        ...threadConfig,
        ...(await resolveCodexAppMcpOverrides({
          hostConfig,
          appServerVersion: appServerConnection.appServerVersion,
        })),
        [configOverrideKeyForVersion(appServerConnection.appServerVersion)]: appToolNames,
      },
      developerInstructions,
      personality: null,
      ephemeral: null,
      threadSource: `automation`,
      dynamicTools: [],
      mockExperimentalField: null,
      experimentalRawEvents: false,
      serviceTier: null,
    };
    return appServerConnection.startThread(startParams);
  };
  let threadStart = null;
  let threadId = null;
  let worktreeGitRoot = null;
  let pendingRunToken = `pending:${randomUUIDForRun()}`;
  recordAutomationRunPendingStart(automation.id, pendingRunToken, automation.name, targetCwdOrNull);
  appServerConnection.notifyAutomationRunsUpdated();
  try {
    if (hasStableMetadata) {
      let branchState = await fetchDefaultRemoteBranch(
        cwd,
        requestGitWorker,
        appServerClient as never,
      );
      let worktreeResult = await requestGitWorker({
        method: `create-worktree`,
        params: {
          cwd,
          startingState: branchState,
          upstreamRefreshMode: `never`,
          localEnvironmentConfigPath: automation.localEnvironmentConfigPath,
          hostConfig: (appServerClient as { hostConfig: unknown }).hostConfig,
          operationSource: `git_direct_call`,
          worktreesRoot: readDesktopTomlSection(userConfig.desktop).worktreesRoot,
          useWorkspaceDir: (desktopFeatureAvailability as { workspaceDir?: boolean }).workspaceDir,
          streamId: randomUUIDForRun(),
        },
      });
      worktreeGitRoot = worktreeResult.worktreeGitRoot;
      threadStart = await startThreadAt(worktreeResult.worktreeWorkspaceRoot);
    } else threadStart = await startThreadAt(cwd);
    let startedThreadId = threadStart.thread.id;
    threadId = startedThreadId;
    if (worktreeGitRoot != null) {
      try {
        await worktreeLifecycle.setOwnerThread({
          conversationId: toConversationId(startedThreadId),
          worktree: worktreeGitRoot,
        });
        worktreeLifecycle.requestCleanup();
      } catch (error) {
        logger().warning(
          `Automation worktree thread started, but owner metadata could not be updated`,
          { safe: { automationId: automation.id }, sensitive: { error } },
        );
      }
    }
    if (isProjectless) {
      await threadProjectAssignments.setProjectless({
        threadId: toConversationId(startedThreadId),
        projectless: true,
      });
      if (projectlessWorkspaceBrowserRoot != null)
        globalState.update(SHARED_STATE_KEYS.THREAD_WORKSPACE_ROOT_HINTS, (hints) => ({
          ...hints,
          [startedThreadId]: projectlessWorkspaceBrowserRoot,
        }));
      if (projectlessOutputDirectory != null)
        globalState.update(SHARED_STATE_KEYS.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES, (hints) => ({
          ...hints,
          [startedThreadId]: projectlessOutputDirectory,
        }));
    } else if (project != null) {
      await threadProjectAssignments.setAssignment({
        threadId: toConversationId(startedThreadId),
        assignment: { projectKind: `local`, projectId: project.projectId },
      });
    }
    commitAutomationRunThread(pendingRunToken, threadId) ||
      recordAutomationRunPendingStart(automation.id, threadId, automation.name, targetCwdOrNull);
    appServerConnection.notifyAutomationRunsUpdated();
    setAutomationThreadTitle({
      automation,
      threadId,
      appServerConnection,
    });
  } catch (error) {
    throw (failAutomationRun(pendingRunToken, `auto`), appServerConnection.notifyAutomationRunsUpdated(), error);
  }
  if (threadStart == null || threadId == null) throw Error(`Automation thread start failed`);
  let writableRoots: string[];
  try {
    writableRoots = await automationWritableRootsForRun({
      sourceCwds: compatibilityCwds,
      worktreeCwd: threadStart.cwd!,
      requestGitWorker,
      appServerClient: appServerClient as never,
      automationId: automation.id,
      includeGitRoots: !isProjectless,
    });
  } catch (error) {
    throw (failAutomationRun(threadId, `auto`), appServerConnection.notifyAutomationRunsUpdated(), error);
  }
  let runPermissions = resolveAutomationPermissions(
    writableRoots,
    userConfig,
    configRequirements,
    agentModeOverride,
    isProjectless,
  );
  let visualizationId = visualizationIdForThread(threadId);
  let sandboxPolicy = runPermissions.sandboxPolicy;
  let runtimeWorkspaceRoots: string[] | null = null;
  if (visualizationId != null &&
    (sandboxPolicy.type === `workspaceWrite` || sandboxPolicy.type === `dangerFullAccess`)) {
    try {
      let [codexHomeOrWorkspacesRoot, platformPath] = await Promise.all([
        (desktopFeatureAvailability as { workspaceDir?: boolean }).workspaceDir
          ? (appServerClient as { workspacesRoot(): Promise<string> }).workspacesRoot()
          : (appServerClient as { codexHome(): Promise<string> }).codexHome(),
        appServerClient.platformPath(),
      ]);
      let visualizationDir = platformPath.join(
        convertPathForExecutionHost(codexHomeOrWorkspacesRoot, shouldUseWslPaths((appServerClient as { hostConfig: unknown }).hostConfig)),
        `visualizations`,
        ...String(visualizationId).split(`/`),
        threadId,
      );
      await (appServerClient as { createDirectory(path: string, opts: { recursive: boolean }): Promise<unknown> }).createDirectory(
        visualizationDir,
        { recursive: true },
      );
      if (sandboxPolicy.type === `workspaceWrite`) {
        sandboxPolicy = { ...sandboxPolicy, writableRoots: [...sandboxPolicy.writableRoots, visualizationDir] };
      } else if (sandboxPolicy.type === `dangerFullAccess`) {
        runtimeWorkspaceRoots = [...writableRoots, visualizationDir];
      }
    } catch (error) {
      if (sandboxPolicy.type === `dangerFullAccess`) runtimeWorkspaceRoots = writableRoots;
      logger().warning(`Failed to prepare visualization directory for automation run`, {
        safe: { automationId: automation.id },
        sensitive: { error },
      });
    }
  }
  let lastRunLabel =
    automation.lastRunAt == null
      ? `never`
      : `${new Date(automation.lastRunAt).toISOString()} (${automation.lastRunAt})`;
  let prompt = `${threadTitle}\nAutomation ID: ${automation.id}\nAutomation memory: $CODEX_HOME/automations/${automation.id}/memory.md\nLast run: ${lastRunLabel}\n\n${automation.prompt}`;
  let turnParams = {
    threadId,
    turnTrigger: `automation_cron_${runTrigger}`,
    input: [{ type: `text`, text: prompt, text_elements: [] }],
    cwd: threadStart.cwd,
    approvalPolicy: runPermissions.approvalPolicy,
    approvalsReviewer: runPermissions.approvalsReviewer,
    sandboxPolicy,
    runtimeWorkspaceRoots,
    model: automationModelSettings.model,
    effort: automationModelSettings.reasoningEffort,
    serviceTier: null,
    summary: turnSummaryKind,
    personality: null,
    outputSchema: null,
    collaborationMode: null,
  };
  let readState: CronTurnReadState | undefined;
  try {
    readState = prepareCronTurnReadState?.({
      appServerConnection,
      threadId: threadStart.thread.id,
      notificationPolicy: automation.notificationPolicy,
    });
  } catch (error) {
    logger().warning(`Failed to prepare automation task unread state`, {
      safe: {},
      sensitive: { error },
    });
  }
  try {
    await appServerConnection.startTurn(turnParams, {
      automationKind: automation.kind,
      notificationPolicy: automation.notificationPolicy,
      sessionId: threadStart.thread.sessionId,
    });
  } catch (error) {
    throw (readState?.handleStartFailure(), error);
  }
}

/** pending run 的随机 token（原 (0,_.randomUUID)()）。 */
function randomUUIDForRun(): string {
  return randomUUID();
}

/** 线程标题回填（原 _ae，9,541-9,550）：失败仅告警。 */
async function setAutomationThreadTitle({
  automation,
  threadId,
  appServerConnection,
}: {
  automation: Automation;
  threadId: string;
  appServerConnection: AppServerConnection;
}): Promise<void> {
  try {
    await appServerConnection.updateThreadTitle(threadId, automation.name, null);
  } catch (error) {
    logger().warning(`Failed to set automation thread title`, {
      safe: { automationId: automation.id, threadId, error },
      sensitive: {},
    });
  }
}

/** 默认远端分支（原 cae，8,806-8,812）。 */
async function fetchDefaultRemoteBranch(
  cwd: string,
  requestGitWorker: GitWorkerRequest,
  appServerClient: { hostConfig: unknown },
): Promise<{ type: `branch`; branchName: string }> {
  let { branch } = await requestGitWorker({
    method: `default-remote-branch`,
    params: { cwd, hostConfig: appServerClient.hostConfig, operationSource: `git_direct_call` },
  });
  return { type: `branch`, branchName: branch ?? `HEAD` };
}

/**
 * 运行的可写根集合（原 lae，8,813-8,842）：源 cwd + worktree cwd +
 * `$CODEX_HOME/automations/<id>`（WSL 转换）+ git worker 报告的
 * automation-writable-roots（按需）。
 */
async function automationWritableRootsForRun({
  sourceCwds,
  worktreeCwd,
  requestGitWorker,
  appServerClient,
  automationId,
  includeGitRoots,
}: {
  sourceCwds: string[];
  worktreeCwd: string;
  requestGitWorker: GitWorkerRequest;
  appServerClient: { hostConfig: unknown; codexHome(): Promise<string>; platformPath(): Promise<any> };
  automationId: string;
  includeGitRoots: boolean;
}): Promise<string[]> {
  let cwds = sourceCwds.length > 0 ? sourceCwds : [expandHomeDir(worktreeCwd)];
  let [codexHome, platformPath, gitRoots] = await Promise.all([
    appServerClient.codexHome(),
    appServerClient.platformPath(),
    Promise.all(
      includeGitRoots
        ? cwds.map((cwd) =>
            requestGitWorker({
              method: `automation-writable-roots`,
              params: {
                sourceCwd: cwd,
                worktreeCwd,
                hostConfig: appServerClient.hostConfig,
                operationSource: `git_direct_call`,
              },
            }).then(({ roots }) => roots),
          )
        : [],
    ),
  ]);
  return [
    ...new Set([
      ...sourceCwds,
      worktreeCwd,
      platformPath.join(
        convertPathForExecutionHost(codexHome, shouldUseWslPaths(appServerClient.hostConfig)),
        `automations`,
        automationId,
      ),
      ...gitRoots.flat(),
    ]),
  ];
}

// ---------------------------------------------------------------------------
// heartbeat 运行（原 vae/yae/Ms/bae/xae/Sae/Cae/wae/Tae/Ns/Ps/Eae/Dae/Oae/Fs）
// ---------------------------------------------------------------------------

/** heartbeat 调度运行（原 vae，9,551-9,660）。 */
async function runHeartbeatScheduled({
  automation,
  now,
  appServerConnection,
  signal,
  assertCurrent,
  heartbeatThreadRendererStates,
  heartbeatThreadCollaborationModes,
  heartbeatThreadPermissions,
  updateCanonicalAutomation,
  deleteArchivedHeartbeat,
  isHostedAutomationAppAvailable,
}: {
  automation: Automation;
  now: number;
  appServerConnection: AppServerConnection;
  signal?: AbortSignal;
  assertCurrent?: () => void;
  heartbeatThreadRendererStates: Map<string, { isEligible: boolean; reason?: string | null; updatedAtMs: number }>;
  heartbeatThreadCollaborationModes: Map<string, unknown>;
  heartbeatThreadPermissions: Map<string, unknown>;
  updateCanonicalAutomation?: AutomationSchedulerOptions["updateCanonicalAutomation"];
  deleteArchivedHeartbeat?: AutomationSchedulerOptions["deleteArchivedHeartbeat"];
  isHostedAutomationAppAvailable: () => Promise<boolean>;
}): Promise<void> {
  let schedule = parseHeartbeatSchedule({ rrule: automation.rrule, now });
  let thread = await appServerConnection.readThread(automation.targetThreadId).catch(() => null);
  assertCurrent?.();
  if (thread == null) {
    let nextRunAt = heartbeatNextRunAt({ nextScheduledRunAt: schedule.nextScheduledRunAt, now });
    setAutomationNextRunAt(automation.id, nextRunAt);
    logger().warning(`Heartbeat automation skipped: thread missing`, {
      safe: {
        automationId: automation.id,
        targetThreadId: automation.targetThreadId,
        blockReason: `thread_missing`,
        nextRunAt,
        ...schedule,
      },
      sensitive: {},
    });
    return;
  }
  let rendererBlock = rendererBlockReason({
    expectedThreadId: automation.targetThreadId,
    heartbeatThreadRendererStates,
  });
  if (rendererBlock != null) {
    let nextRunAt = heartbeatNextRunAt({ nextScheduledRunAt: schedule.nextScheduledRunAt, now });
    setAutomationNextRunAt(automation.id, nextRunAt);
    logger().debug(`Heartbeat automation blocked by renderer state`, {
      safe: {
        automationId: automation.id,
        targetThreadId: automation.targetThreadId,
        blockReason: rendererBlock,
        nextRunAt,
        ...schedule,
      },
      sensitive: {},
    });
    return;
  }
  let collaborationMode = applyHostedAutomationsInstructions(
    collaborationModeForThread(heartbeatThreadCollaborationModes, automation.targetThreadId),
    await isHostedAutomationsEnabled(isHostedAutomationAppAvailable),
  );
  if (collaborationMode == null) {
    let nextRunAt = heartbeatNextRunAt({ nextScheduledRunAt: schedule.nextScheduledRunAt, now });
    setAutomationNextRunAt(automation.id, nextRunAt);
    logger().debug(`Heartbeat automation waiting for renderer mode state`, {
      safe: {
        automationId: automation.id,
        targetThreadId: automation.targetThreadId,
        blockReason: `missing_collaboration_mode`,
        nextRunAt,
        ...schedule,
      },
      sensitive: {},
    });
    return;
  }
  let busyReason = await threadBusyReason({
    thread,
    appServerConnection,
    signal,
    assertCurrent,
  });
  if (busyReason != null) {
    let nextRunAt = heartbeatNextRunAt({ nextScheduledRunAt: schedule.nextScheduledRunAt, now });
    setAutomationNextRunAt(automation.id, nextRunAt);
    logger().debug(`Heartbeat automation blocked by thread state`, {
      safe: {
        automationId: automation.id,
        targetThreadId: automation.targetThreadId,
        blockReason: busyReason,
        nextRunAt,
        ...schedule,
      },
      sensitive: {},
    });
    return;
  }
  let nextRunAt = computeAutomationNextRun({ automation, now });
  recordAutomationRunStart(automation.id, nextRunAt);
  appServerConnection.notifyAutomationRunTriggered({
    automationKind: automation.kind,
    cwd: thread.cwd,
    executionEnvironment: null,
    model: null,
    pluginTemplateId: null,
    reasoningEffort: null,
    rrule: automation.rrule,
    runTrigger: `scheduled`,
  });
  try {
    await runHeartbeatTurn({
      automation,
      thread,
      appServerConnection,
      collaborationMode: await resolveHeartbeatModelSettings({
        automation,
        appServerConnection,
        collaborationMode,
      }),
      permissions: heartbeatThreadPermissions.get(automation.targetThreadId) ?? null,
      waitForCompletion: true,
      runTrigger: `scheduled`,
    });
  } catch (error) {
    if (appServerErrorCode(error) !== `thread_archived`) throw error;
    assertCurrent?.();
    let canonical = getCanonicalAutomation(automation.id);
    if (
      canonical?.kind !== `heartbeat` ||
      canonical.status !== `ACTIVE` ||
      canonical.targetThreadId !== automation.targetThreadId
    )
      return;
    // 原文：u == null ? n.Vr({...i, status:"PAUSED"}) != null : (await u(i.id)) === "deleted"
    // （u 为 deleteArchivedHeartbeat 选项；n.Vr 为 shared 的 canonical 更新。）
    if (
      deleteArchivedHeartbeat == null
        ? updateCanonicalRecord({ ...canonical, status: `PAUSED` }) != null
        : (await (deleteArchivedHeartbeat as (id: string) => Promise<unknown>)(
            canonical.id,
          )) === `deleted`
    )
      appServerConnection.notifyAutomationRunsUpdated();
  }
}

/** run_now 的 heartbeat 入口（原 yae，9,661-9,695）。 */
async function runHeartbeatNow({
  automation,
  appServerConnection,
  collaborationMode,
  permissions,
  isHostedAutomationAppAvailable,
}: {
  automation: Automation;
  appServerConnection: AppServerConnection;
  collaborationMode: unknown | null;
  permissions: unknown | null;
  isHostedAutomationAppAvailable: () => Promise<boolean>;
}): Promise<void> {
  let thread = await appServerConnection.readThread(automation.targetThreadId).catch(() => null);
  if (thread == null) throw Error(`Heartbeat thread not found.`);
  if (
    (await threadBusyReason({ thread, appServerConnection })) != null
  )
    throw Error(`Heartbeat thread is busy right now.`);
  let nextRunAt = computeAutomationNextRun({ automation, now: Date.now() });
  recordAutomationRunStart(automation.id, nextRunAt);
  appServerConnection.notifyAutomationRunTriggered({
    automationKind: automation.kind,
    cwd: thread.cwd,
    executionEnvironment: null,
    model: null,
    pluginTemplateId: null,
    reasoningEffort: null,
    rrule: automation.rrule,
    runTrigger: `run_now`,
  });
  let withInstructions = applyHostedAutomationsInstructions(
    collaborationMode,
    await isHostedAutomationsEnabled(isHostedAutomationAppAvailable),
  );
  if (withInstructions == null) throw Error(`Heartbeat thread mode is still loading.`);
  await runHeartbeatTurn({
    automation,
    thread,
    appServerConnection,
    collaborationMode: await resolveHeartbeatModelSettings({
      automation,
      appServerConnection,
      collaborationMode: withInstructions,
    }),
    permissions,
    waitForCompletion: false,
    runTrigger: `run_now`,
  });
}

/** heartbeat turn 执行（原 Ms，9,696-9,724）。 */
async function runHeartbeatTurn({
  automation,
  thread,
  appServerConnection,
  collaborationMode,
  permissions,
  waitForCompletion,
  runTrigger,
}: {
  automation: Automation;
  thread: any;
  appServerConnection: AppServerConnection;
  collaborationMode: unknown;
  permissions: unknown | null;
  waitForCompletion: boolean;
  runTrigger: string;
}): Promise<void> {
  let resumed = await resumeHeartbeatThread({ thread, appServerConnection });
  let resolvedPermissions =
    permissions ?? (await resolveHeartbeatPermissionsFromConfig({ appServerConnection, cwd: resumed.cwd }));
  let prompt = renderHeartbeatPrompt(automation);
  await startHeartbeatTurn({
    automation,
    appServerConnection,
    sessionId: resumed.sessionId,
    threadId: resumed.id,
    cwd: resumed.cwd,
    prompt,
    collaborationMode,
    approvalPolicy: (resolvedPermissions as { approvalPolicy: unknown }).approvalPolicy,
    approvalsReviewer: (resolvedPermissions as { approvalsReviewer: unknown }).approvalsReviewer,
    sandboxPolicy: (resolvedPermissions as { sandboxPolicy: unknown }).sandboxPolicy,
    model: null,
    effort: null,
    waitForCompletion,
    runTrigger,
  });
}

/** resume heartbeat 线程（原 bae，9,725-9,733）。 */
async function resumeHeartbeatThread({
  thread,
  appServerConnection,
}: {
  thread: any;
  appServerConnection: AppServerConnection;
}): Promise<{ id: string; cwd: string; path: unknown; sessionId: string }> {
  let resumed = await appServerConnection.resumeThread(thread.id, { cwd: thread.cwd, path: thread.path });
  return {
    id: resumed.thread.id,
    cwd: resumed.thread.cwd || resumed.cwd || thread.cwd,
    path: resumed.thread.path ?? thread.path,
    sessionId: resumed.thread.sessionId,
  };
}

/** 从用户 config 求解 heartbeat 权限（原 xae，9,734-9,740）。 */
async function resolveHeartbeatPermissionsFromConfig({
  appServerConnection,
  cwd,
}: {
  appServerConnection: AppServerConnection;
  cwd: string;
}): Promise<{ approvalPolicy: unknown; approvalsReviewer: unknown; sandboxPolicy: unknown }> {
  let [userConfig, requirements] = await Promise.all([
    appServerConnection.getUserSavedConfiguration(cwd),
    appServerConnection.getConfigRequirements().catch(() => ({ requirements: null })),
  ]);
  return resolveHeartbeatPermissions([cwd], userConfig, requirements.requirements);
}

/** 渲染 heartbeat prompt（原 Sae，9,741-9,746）。 */
function renderHeartbeatPrompt(automation: Automation): string {
  return HEARTBEAT_PROMPT_TEMPLATE.replaceAll(`{{AUTOMATION_ID}}`, automation.id)
    .replaceAll(`{{NOW_ISO}}`, new Date().toISOString())
    .replaceAll(`{{AUTOMATION_PROMPT}}`, automation.prompt);
}

/** 新鲜的 renderer 状态（原 Cae，9,747-9,750）：超过 12e4 视为过期并移除。 */
function freshRendererState(
  states: Map<string, { isEligible: boolean; reason?: string | null; updatedAtMs: number }>,
  threadId: string,
): { isEligible: boolean; reason?: string | null } | null {
  let state = states.get(threadId);
  return state == null
    ? null
    : Date.now() - state.updatedAtMs > RENDERER_STATE_STALE_MS
      ? (states.delete(threadId), null)
      : state;
}

/** 线程的协作模式（原 wae，9,751-9,753）。 */
function collaborationModeForThread(
  modes: Map<string, unknown>,
  threadId: string,
): unknown | null {
  return modes.get(threadId) ?? null;
}

/** renderer 侧阻塞原因（原 Tae，9,754-9,757）：无状态或不合格才阻塞。 */
function rendererBlockReason({
  expectedThreadId,
  heartbeatThreadRendererStates,
}: {
  expectedThreadId: string;
  heartbeatThreadRendererStates: Map<string, { isEligible: boolean; reason?: string | null; updatedAtMs: number }>;
}): string | null {
  let state = freshRendererState(heartbeatThreadRendererStates, expectedThreadId);
  return state == null || state.isEligible ? null : (state.reason ?? `renderer_ineligible`);
}

/**
 * 线程忙闲判定（原 Ns，9,758-9,805）：
 * - 非 active / activeFlags（waitingOnUserInput、waitingOnApproval、其他）
 *   直接阻塞；
 * - app-server 版本不可知时 `active_history_unavailable`；
 * - 否则竞速「tail 历史 + 内部通知」30s：turn/started|item/*|thread/status
 *   变化 → `active_recent_turn_activity`；最后一条 turn 未完成 →
 *   `active_without_completed_turn`；
 * - account/updated、thread/deleted、断连、principal 变更 → 立即中止。
 */
async function threadBusyReason({
  thread,
  appServerConnection,
  signal,
  assertCurrent,
}: {
  thread: any;
  appServerConnection: AppServerConnection;
  signal?: AbortSignal;
  assertCurrent?: () => void;
}): Promise<string | null> {
  if ((assertCurrent?.(), signal?.throwIfAborted(), thread.status.type !== `active`)) return null;
  let flagBlock = activeFlagBlockReason(thread.status);
  if (flagBlock != null) return flagBlock;
  if (appServerConnection.appServerVersion == null || appServerConnection.appServerVersion === `0.0.0`)
    return `active_history_unavailable`;
  let localAbort = new AbortController();
  let combinedSignal = AbortSignal.any([
    localAbort.signal,
    AbortSignal.timeout(TURN_ACTIVITY_TIMEOUT_MS),
    ...(signal == null ? [] : [signal]),
  ]);
  let sawActivity = false;
  let unsubscribeNotifications = appServerConnection.registerInternalNotificationHandler(
    (notification) => {
      if (
        notification.method === `account/updated` ||
        (notification.method === `thread/deleted` && notification.params?.threadId === thread.id)
      )
        localAbort.abort();
      else if (
        (notification.method === `turn/started` ||
          notification.method === `item/started` ||
          notification.method === `item/completed` ||
          notification.method === `thread/status/changed`) &&
        notification.params?.threadId === thread.id
      )
        sawActivity = true;
    },
  );
  let unsubscribePrincipalChange = appServerConnection.registerInternalAuthenticatedPrincipalChangeHandler(
    () => localAbort.abort(),
  );
  let unsubscribeConnectionState = appServerConnection.registerInternalConnectionStateHandler(
    (state) => {
      if (state !== `connected`) localAbort.abort();
    },
  );
  let fetchOpts = {
    priority: `background`,
    source: `tail_history`,
    timeoutMs: TURN_ACTIVITY_TIMEOUT_MS,
    signal: combinedSignal,
  };
  try {
    let lastTurn = appServerSupportsListThreadTurns(appServerConnection.appServerVersion)
      ? (
          await appServerConnection.listThreadTurns(
            thread.id,
            { limit: 1, itemsView: `notLoaded` },
            fetchOpts,
          )
        ).data[0]
      : (await appServerConnection.readThread(thread.id, { includeTurns: true }, fetchOpts))?.turns.at(-1);
    if ((assertCurrent?.(), combinedSignal.throwIfAborted(), sawActivity))
      return `active_recent_turn_activity`;
    if (lastTurn?.status !== `completed`) return `active_without_completed_turn`;
    let freshThread = await appServerConnection.readThread(thread.id, undefined, fetchOpts);
    return (
      assertCurrent?.(),
      combinedSignal.throwIfAborted(),
      sawActivity
        ? `active_recent_turn_activity`
        : freshThread?.id === thread.id
          ? activeFlagBlockReason(freshThread.status)
          : `active_history_unavailable`
    );
  } catch (error) {
    if (error instanceof Error && error.name === `AbortError`) throw error;
    return (
      assertCurrent?.(),
      signal?.throwIfAborted(),
      localAbort.signal.throwIfAborted(),
      `active_history_unavailable`
    );
  } finally {
    unsubscribeNotifications();
    unsubscribePrincipalChange();
    unsubscribeConnectionState();
  }
}

/** activeFlags → 阻塞原因（原 Ps，9,806-9,816）。 */
function activeFlagBlockReason(status: any): string | null {
  return status.type === `active`
    ? status.activeFlags.includes(`waitingOnUserInput`)
      ? `waiting_on_user_input`
      : status.activeFlags.includes(`waitingOnApproval`)
        ? `waiting_on_approval`
        : status.activeFlags.length > 0
          ? `active_with_flags`
          : null
    : null;
}

/** 启动 heartbeat turn（原 Eae，9,817-9,872）。 */
async function startHeartbeatTurn({
  automation,
  appServerConnection,
  sessionId,
  threadId,
  cwd,
  prompt,
  collaborationMode,
  approvalPolicy,
  approvalsReviewer,
  sandboxPolicy,
  model,
  effort,
  waitForCompletion,
  runTrigger,
}: {
  automation: Automation;
  appServerConnection: AppServerConnection;
  sessionId: string;
  threadId: string;
  cwd: string;
  prompt: string;
  collaborationMode: unknown;
  approvalPolicy: unknown;
  approvalsReviewer: unknown;
  sandboxPolicy: unknown;
  model: null;
  effort: null;
  waitForCompletion: boolean;
  runTrigger: string;
}): Promise<void> {
  let supportsServiceTierForTurn = appServerVersionGate(
    appServerConnection.appServerVersion,
    `serviceTierForTurn`,
  );
  let turnStartParams = {
    threadId,
    turnTrigger: `automation_heartbeat_${runTrigger}`,
    input: [{ type: `text`, text: prompt, text_elements: [] }],
    cwd,
    approvalPolicy,
    approvalsReviewer,
    sandboxPolicy,
    model,
    effort,
    serviceTier: supportsServiceTierForTurn ? void 0 : null,
    serviceTierForTurn: supportsServiceTierForTurn ? `default` : void 0,
    summary: turnSummaryKind,
    personality: null,
    outputSchema: null,
    collaborationMode,
  };
  if (waitForCompletion) {
    await startHeartbeatTurnAndWait({
      automation,
      appServerConnection,
      sessionId,
      threadId,
      turnStartParams,
    });
    return;
  }
  let waiter = createHeartbeatTurnWaiter({ appServerConnection, threadId });
  try {
    let startedTurn = await appServerConnection.startTurn(turnStartParams, {
      automationKind: `heartbeat`,
      ...(automation.notificationPolicy == null
        ? {}
        : { notificationPolicy: automation.notificationPolicy }),
      sessionId,
    });
    await waiter.waitForTurn(startedTurn.turn.id);
  } catch (error) {
    throw (waiter.dispose(), error);
  }
}

/** 启动并等待完成（原 Dae，9,873-9,919）：通知 + 600s 超时双通道。 */
async function startHeartbeatTurnAndWait({
  automation,
  appServerConnection,
  sessionId,
  threadId,
  turnStartParams,
}: {
  automation: Automation;
  appServerConnection: AppServerConnection;
  sessionId: string;
  threadId: string;
  turnStartParams: Record<string, unknown>;
}): Promise<void> {
  let observedTurnId: string | null = null;
  let cancelTimeout = () => {};
  let completion = new Promise<void>((resolve, reject) => {
    let timeout = setTimeout(() => {
      cancelTimeout();
      resolve();
    }, HEARTBEAT_COMPLETION_TIMEOUT_MS);
    let unsubscribe = appServerConnection.registerInternalNotificationHandler((notification) => {
      demuxHeartbeatTurnNotification({
        notification,
        threadId,
        turnId: observedTurnId,
        onTurnStarted: (turnId) => {
          observedTurnId = turnId;
        },
        onCompleted: (turnId, status) => {
          if (((observedTurnId = turnId), cancelTimeout(), status !== `completed`)) {
            reject(Error(`Heartbeat automation did not complete.`));
            return;
          }
          resolve();
        },
      });
    });
    cancelTimeout = () => {
      clearTimeout(timeout);
      unsubscribe();
      cancelTimeout = () => {};
    };
  });
  try {
    observedTurnId = (
      await appServerConnection.startTurn(turnStartParams, {
        automationKind: `heartbeat`,
        ...(automation.notificationPolicy == null
          ? {}
          : { notificationPolicy: automation.notificationPolicy }),
        sessionId,
      })
    ).turn.id;
    await completion;
  } catch (error) {
    throw (cancelTimeout(), error);
  }
}

/** fire-and-forget 的 turn 等待器（原 Oae，9,920-9,964）。 */
function createHeartbeatTurnWaiter({
  appServerConnection,
  threadId,
}: {
  appServerConnection: AppServerConnection;
  threadId: string;
}): {
  dispose(): void;
  waitForTurn(turnId: string): Promise<void>;
} {
  let startedTurnIds = new Set<string>();
  let awaitedTurnId: string | null = null;
  let waitTimeout: ReturnType<typeof setTimeout> | null = null;
  let resolveWait: (() => void) | null = null;
  let rejectWait: ((reason: unknown) => void) | null = null;
  let disposed = false;
  let checkCompleted = () => {
    if (awaitedTurnId != null && startedTurnIds.has(awaitedTurnId)) resolveWait?.();
  };
  let unsubscribe = appServerConnection.registerInternalNotificationHandler((notification) => {
    demuxHeartbeatTurnNotification({
      notification,
      threadId,
      turnId: null,
      onTurnStarted: (turnId) => {
        startedTurnIds.add(turnId);
        checkCompleted();
      },
      onCompleted: (turnId) => {
        startedTurnIds.add(turnId);
        checkCompleted();
      },
    });
  });
  let waitPromise = new Promise<void>((resolve, reject) => {
    resolveWait = resolve;
    rejectWait = reject;
  });
  let dispose = () => {
    if (disposed) return;
    disposed = true;
    if (waitTimeout != null) {
      clearTimeout(waitTimeout);
      waitTimeout = null;
    }
    unsubscribe();
  };
  return {
    dispose,
    waitForTurn: async (turnId) => {
      awaitedTurnId = turnId;
      waitTimeout = setTimeout(() => {
        rejectWait?.(Error(`Timed out waiting for heartbeat automation to start.`));
      }, TURN_ACTIVITY_TIMEOUT_MS);
      checkCompleted();
      try {
        await waitPromise;
      } finally {
        dispose();
      }
    },
  };
}

/** turn 通知分流（原 Fs，9,965-9,982）。 */
function demuxHeartbeatTurnNotification({
  notification,
  threadId,
  turnId,
  onTurnStarted,
  onCompleted,
}: {
  notification: { method: string; params?: any };
  threadId: string;
  turnId: string | null;
  onTurnStarted: (turnId: string) => void;
  onCompleted: (turnId: string, status: string) => void;
}): void {
  switch (notification.method) {
    case `turn/started`: {
      let params = notification.params;
      if (params.threadId !== threadId) return;
      onTurnStarted(params.turn.id);
      return;
    }
    case `turn/completed`: {
      let params = notification.params;
      if (params.threadId !== threadId || (turnId != null && params.turn.id !== turnId)) return;
      onCompleted(params.turn.id, params.turn.status);
      return;
    }
    default:
      return;
  }
}

// ---------------------------------------------------------------------------
// heartbeat 辅助（原 ws/sae/Ts/Es，8,738-8,805）
// ---------------------------------------------------------------------------

/** heartbeat 的下一次运行时间（原 ws，8,738-8,740）。 */
function heartbeatNextRunAt({
  nextScheduledRunAt,
  now,
}: {
  nextScheduledRunAt: number | null;
  now: number;
}): number {
  return nextScheduledRunAt == null ? now + HEARTBEAT_MIN_INTERVAL_MS : Math.min(nextScheduledRunAt, now + HEARTBEAT_MIN_INTERVAL_MS);
}

/** 解析 rrule → 调度描述（原 sae，8,741-8,748）。 */
function parseHeartbeatSchedule({
  rrule,
  now,
}: {
  rrule: unknown;
  now: number;
}): { scheduleKind: string; intervalMs: number | null; nextScheduledRunAt: number | null } {
  let intervalMs = parseRruleIntervalMs(rrule);
  return {
    scheduleKind: intervalMs == null ? `wall_clock` : `interval`,
    intervalMs,
    nextScheduledRunAt: nextRruleOccurrence({ rrule, now }),
  };
}

/** 注入 hosted automations 的 developer instructions（原 Ts，8,749-8,762）。 */
function applyHostedAutomationsInstructions(
  collaborationMode: unknown | null,
  hostedAutomationsEnabled: boolean,
): unknown | null {
  return collaborationMode == null
    ? null
    : {
        ...(collaborationMode as object),
        settings: {
          ...((collaborationMode as { settings: Record<string, unknown> }).settings ?? {}),
          developer_instructions: hostedAutomationsInstructions({
            baseInstructions: (collaborationMode as { settings: { developer_instructions?: string } })
              .settings.developer_instructions,
            hostedAutomationsEnabled,
          }),
        },
      };
}

/**
 * 拉全量模型列表并重选 heartbeat 模型（原 Es，8,763-8,805）：
 * 翻页拉取后用 shared 的 automation 模型规则重选；重选发生时覆盖
 * reasoning_effort；任何失败时原样返回 collaborationMode。
 */
async function resolveHeartbeatModelSettings({
  automation,
  appServerConnection,
  collaborationMode,
}: {
  automation: Automation;
  appServerConnection: AppServerConnection;
  collaborationMode: NonNullable<unknown>;
}): Promise<unknown> {
  let mode = collaborationMode as {
    settings: { model?: string; reasoning_effort?: string | null };
    [key: string]: unknown;
  };
  try {
    let models: unknown[] = [];
    let cursor: string | null = null;
    do {
      let page = await appServerConnection.listModels({ includeHidden: true, cursor, limit: 100 });
      models.push(...page.data);
      cursor = page.nextCursor ?? null;
    } while (cursor != null);
    if (models.length === 0) return collaborationMode;
    let selection = resolveAutomationModel({
      automation: {
        ...automation,
        model: findModelUpgrade(models, mode.settings.model)?.upgrade ?? mode.settings.model,
        reasoningEffort: mode.settings.reasoning_effort ?? null,
      },
      models,
    });
    let modelChanged = mode.settings.model !== selection.model;
    if (modelChanged) {
      logger().warning(`Heartbeat model changed for run`, {
        safe: {
          automationId: automation.id,
          requestedModel: mode.settings.model,
          selectedModel: selection.model,
        },
        sensitive: {},
      });
    }
    return {
      ...mode,
      settings: {
        ...mode.settings,
        model: selection.model,
        reasoning_effort:
          modelChanged || mode.settings.reasoning_effort != null ? selection.reasoningEffort : null,
      },
    };
  } catch (error) {
    logger().warning(`Failed to load models for heartbeat run`, {
      safe: { automationId: automation.id },
      sensitive: { error },
    });
    return collaborationMode;
  }
}
