// local-conversation-thread —— 本地会话线程主件（561KB / 13,285 行）。
//
// 原版：app/webview/assets/local-conversation-thread-c6e40fdd6d59.js。
//
// 十七个导出（压缩名 → 语义，全部经原文核实）：
//   - _（OE）：挂载初始化器（Chrome 标签/实时语音/线程桥等依赖装配）
//   - a（yM）：ResumeRetryCard —— 恢复失败重试卡（writerConflict 三消息）
//   - c（sM）：clientThreadIdFor family 装配（launchMode=create-stable-
//     worktree → null）
//   - d（aM）：空初始化器
//   - f（Ej）：ThreadSetup —— 新线程装配页（49 号 memo-cache：onBack/
//     onRetry/onWorktreeCancel/submittable）
//   - g（yE）：ThreadPanelsBar —— 面板条（后台代理/PR/子代理面板打开回调）
//   - h（tD）：空初始化器（背景代理打开回调族）
//   - i（cM）：SideChatThread —— 侧聊线程（20 号 memo-cache：shouldResume/
//     allowMissing/showUtilityBar/composer 变体/footer/右面板覆盖隐藏）
//   - l（oM）：clientThreadIdFor family 本体
//   - m（eD）：agentDisplayName —— 昵称规整（@ 前缀剥离 + agent-<id8> 兜底）
//   - n（pM）：ThreadContainer —— 主容器（60 号 memo-cache：trackReadState
//     的 pointer/key 捕获 → 已读标记 + Lj 线程体 + min-h-0 flex-1 包裹）
//   - o（dM）：WriterConflictCard —— writer 冲突卡（isResuming/onRetry +
//     warningCallout 布局）
//   - p（Aj）：主初始化器（50+ 依赖装配）
//   - r（lM）：SideChat —— 侧聊（44 号 memo-cache：conversationId 判定 →
//     uM 启动页/banner/只读/时间线路由 + 语音启用判定 + codexPerspective 包裹）
//   - s（OM）：fM 的初始化器（EM 恒真 family + DM hostId family）
//   - t（fM）：LocalConversationThread —— 线程主组件（39 号 memo-cache：
//     canInteract/shouldResume → resume 状态机（isResuming/hasResumeFailed/
//     isUnavailable/isWriterConflict）→ 不可用卡/重试卡/主装配三路由 +
//     writer 冲突卡 + 只读降级 + composer 禁用）
//   - u（iM）：isMainPanelActive —— 主面板判定（右面板展开 + 非
//     sidechat:/sidechat-loading:/background-agent: 前缀）
//
// 依赖：68 个文件（54 个新登记）。

import { default as openAutomationSidePanelTab2 } from "@rchunk/open-automation-side-panel-tab";
import { default as googleDriveResourceIcon } from "@rchunk/google-drive-resource-icon";
import { n as scrollToMatchInit2 } from "@rchunk/scroll-to-match";
import { r as useThreadScrollController2 } from "@rchunk/thread-scroll-controller-context-value";
import { default as resultCard2 } from "@rchunk/result-card";
import { default as gitlabMergeRequestFormDialog } from "@rchunk/gitlab-merge-request-form-dialog";
void openAutomationSidePanelTab2, googleDriveResourceIcon, scrollToMatchInit2, useThreadScrollController2, resultCard2, gitlabMergeRequestFormDialog;

import { $3 as appSharedLazy } from "@rchunk/app-shared";
import * as appSharedChunk from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import * as appInitialChunk from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as virtualizedTurnList from "@rchunk/virtualized-turn-list";
import * as localConversationTurn from "@rchunk/local-conversation-turn";
import * as conversationBlocks from "@rchunk/conversation-blocks";
import * as splitItems from "@rchunk/split-items-into-render-groups";
import * as userMessage from "@rchunk/user-message";
import { default as scrollLayout } from "@rchunk/thread-scroll-layout";
import { default as timestampSeparator } from "@rchunk/timestamp-separator";
import { default as threadHandoffModal } from "@rchunk/thread-handoff-modal";
import { default as sidePanel } from "@rchunk/side-panel";
import { default as planSidePanel } from "@rchunk/plan-side-panel";
import { default as pullRequest } from "@rchunk/pull-request";
import { default as pullRequestDetailModel } from "@rchunk/pull-request-detail-model";
import { default as pullRequestFixWorkflow } from "@rchunk/pull-request-fix-workflow";
import { default as pullRequestStatusLabel } from "@rchunk/pull-request-status-label";
import { default as openThreadPullRequestCodeTab } from "@rchunk/open-thread-pull-request-code-tab";
import { default as gitActions } from "@rchunk/local-conversation-git-actions";
import { default as gitActionNewBranchField } from "@rchunk/git-action-new-branch-field";
import { default as useGitConfigValue } from "@rchunk/use-git-config-value";
import { default as threadTurnEntries } from "@rchunk/local-conversation-thread-turn-entries";
import { default as planModel } from "@rchunk/local-conversation-plan-model";
import { default as webmcpToolsModel } from "@rchunk/local-conversation-webmcp-tools-model";
import * as sideChatRuntime from "@rchunk/local-conversation-side-chat";
import { default as summaryPanelImagePreview } from "@rchunk/local-conversation-summary-panel-image-preview";
import { default as artifactsSignals } from "@rchunk/local-conversation-artifacts-signals";
import { default as externalResourceIcon } from "@rchunk/local-conversation-external-resource-icon";
import { default as useLocalConversationSources } from "@rchunk/use-local-conversation-sources";
import { default as conversationSource } from "@rchunk/conversation-source";
import { default as creationTargetQuery } from "@rchunk/creation-target-query";
import { default as environmentLabels } from "@rchunk/environment-labels";
import { default as localEnvironmentEditor } from "@rchunk/local-environment-editor";
import { default as localEnvironmentWorkflowMessages } from "@rchunk/local-environment-workflow-messages";
import { default as openLocalConversationBackgroundTerminalTab } from "@rchunk/open-local-conversation-background-terminal-tab";
import { default as openLocalConversationSourcesSidePanelTab } from "@rchunk/open-local-conversation-sources-side-panel-tab";
import * as resumeConversationChunk from "@rchunk/use-resume-conversation-if-needed";
import { default as worktreeSetupAutoFix } from "@rchunk/worktree-setup-auto-fix";
import { default as realtimeVoiceHandoffTarget } from "@rchunk/realtime-voice-handoff-target";
import { default as realtimeVoiceLaunchSurface } from "@rchunk/realtime-voice-launch-surface";
import { default as realtimeVoiceMotion } from "@rchunk/realtime-voice-motion";
import { default as realtimeVoiceStageLayout } from "@rchunk/realtime-voice-stage-layout";
import { default as useRealtimeVoiceNativeOverlayTransitionEnabled } from "@rchunk/use-realtime-voice-native-overlay-transition-enabled";
import { default as remoteHostedPipAnchorBridge } from "@rchunk/remote-hosted-pip-anchor-bridge";
import { default as threadBridge } from "@rchunk/thread-bridge";
import { default as threadPinShortcutBridge } from "@rchunk/thread-pin-shortcut-bridge";
import { default as pendingOnboarding } from "@rchunk/pending-onboarding";
import { default as pluginPickerMenuContent } from "@rchunk/plugin-picker-menu-content";
import { default as publishActions } from "@rchunk/publish-actions";
import { default as resultValues } from "@rchunk/result-values";
import { default as runtimeChunk } from "@rchunk/runtime";
import { default as securityKeys } from "@rchunk/security-keys";
import { default as setupArtwork } from "@rchunk/setup-artwork";
import { default as commandExecutionCommand } from "@rchunk/command-execution-command";
import { default as automationDeleteConfirmationDialog } from "@rchunk/automation-delete-confirmation-dialog";
import { default as bookmarkedThreadUserMessageNavigation } from "@rchunk/bookmarked-thread-user-message-navigation";
import { default as artifactFilePreviewIcon } from "@rchunk/artifact-file-preview-icon";
import { default as layout } from "@rchunk/layout";
import { default as lock } from "@rchunk/lock";
import { default as modelPickerChevronDownSm } from "@rchunk/model-picker-chevron-down-sm";
import { default as openTarget } from "@rchunk/open-target";
import * as openTargetChunk from "@rchunk/open-target";
import { default as triangleWarning } from "@rchunk/triangle-warning";

void appSharedLazy; void appInitialInit; void appPrimaryInit;
void appPrimaryChunk;
 void virtualizedTurnList; void localConversationTurn;
void conversationBlocks;  void splitItems;
 void userMessage; void scrollLayout;
void timestampSeparator; void threadHandoffModal; void sidePanel;
void planSidePanel; void pullRequest; void pullRequestDetailModel;
void pullRequestFixWorkflow; void pullRequestStatusLabel;
void openThreadPullRequestCodeTab; void gitActions; void gitActionNewBranchField;
void useGitConfigValue; void threadTurnEntries; void planModel;
void webmcpToolsModel; void sideChatRuntime; void summaryPanelImagePreview;
void artifactsSignals; void externalResourceIcon; void useLocalConversationSources;
void conversationSource; void creationTargetQuery; void environmentLabels;
void localEnvironmentEditor; void localEnvironmentWorkflowMessages;
void openLocalConversationBackgroundTerminalTab; void openLocalConversationSourcesSidePanelTab;
void resumeConversationChunk; void worktreeSetupAutoFix;
void realtimeVoiceHandoffTarget; void realtimeVoiceLaunchSurface;
void realtimeVoiceMotion; void realtimeVoiceStageLayout;
void useRealtimeVoiceNativeOverlayTransitionEnabled; void remoteHostedPipAnchorBridge;
void threadBridge; void threadPinShortcutBridge; void pendingOnboarding;
void pluginPickerMenuContent; void publishActions; void resultValues;
void runtimeChunk; void securityKeys; void setupArtwork;
void commandExecutionCommand; void automationDeleteConfirmationDialog;
void bookmarkedThreadUserMessageNavigation; void artifactFilePreviewIcon;
void layout; void lock; void modelPickerChevronDownSm; void openTarget;
void triangleWarning;   
   

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 恢复状态机（原 `ky` 的返回形态）。 */
export interface ResumeState {
  hasResumeFailed: boolean;
  isResuming: boolean;
  isUnavailable: boolean;
  isWriterConflict: boolean;
  retryResume: () => void;
}

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: string | number): unknown;
  jsxs(type: unknown, props: Record<string, unknown>, key?: string | number): unknown;
}

interface ReactRuntime {
  useEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useState?<Value>(initialValue: Value): [Value, (value: Value | ((previous: Value) => Value)) => void];
}

type ScopeLike = {
  get(signal: unknown, parameter?: unknown): any;
  set?(signal: unknown, value: unknown, parameter?: unknown): void;
  watch?(listener: (scope: { get(signal: unknown, parameter?: unknown): any }) => void): (() => void) | void;
  value?: Record<string, any>;
};

const shared = appSharedChunk as unknown as Record<string, any>;
const initial = appInitialChunk as unknown as Record<string, any>;
const resumeRuntime = resumeConversationChunk as unknown as Record<string, any>;
let jsxRuntime: JsxRuntime | undefined;
let threadMountInitialized = false;
let setupInitialized = false;
let localThreadInitialized = false;
let moduleInitialized = false;
const activeInterestParameters = new Map<string, { hostId: string | undefined; threadId: string }>();

function jsx(): JsxRuntime {
  jsxRuntime ??= shared.I3?.() as JsxRuntime;
  if (jsxRuntime == null) throw new Error("local-conversation-thread requires the JSX runtime");
  return jsxRuntime;
}

function call(value: unknown): void { if (typeof value === "function") value(); }
function activeInterestParameter(hostId: string | undefined, threadId: string): { hostId: string | undefined; threadId: string } {
  const key = `${hostId ?? ""}\0${threadId}`;
  let parameter = activeInterestParameters.get(key);
  if (parameter == null) {
    parameter = { hostId, threadId };
    activeInterestParameters.set(key, parameter);
  }
  return parameter;
}
function query<Value>(signal: unknown, parameter?: unknown): Value | undefined {
  return typeof shared.BX === "function" && signal != null ? shared.BX(signal, parameter) as Value : undefined;
}
function appScope(): ScopeLike | null {
  if (typeof shared.LX !== "function") return null;
  try { return shared.LX(initial.$en ?? shared.ZI) as ScopeLike; } catch { return null; }
}
function currentRouteConversationId(scope: ScopeLike | null): string | null {
  if (scope == null) return null;
  try {
    const route = typeof shared.ttn === "function" ? shared.ttn(scope.value) : scope.value?.conversationId;
    return typeof route === "string" && route.length > 0 ? route : null;
  } catch { return null; }
}
function voiceTimelineEnabled(conversationId: string | null): boolean {
  if (conversationId == null) return false;
  const voiceState = query<unknown>(initial.YQt, conversationId);
  const configured = query<{ existingThreadVoiceEnabled?: boolean }>(initial.b1t);
  try { return initial.ACt?.(voiceState) === true || configured?.existingThreadVoiceEnabled === true; }
  catch { return configured?.existingThreadVoiceEnabled === true; }
}
function withThreadPlacementScope(child: unknown, conversationId: string | null, placement: "main" | "side", sourceConversationId: string | null, clientThreadId?: string | null): unknown {
  const Provider = shared.UX;
  if (typeof Provider !== "function" || initial.kht == null || typeof initial.jht !== "function") return child;
  // jht distinguishes established and pending composers by arity. Supplying a
  // fourth `null` still selects the pending-client branch and throws.
  const value = clientThreadId == null
    ? initial.jht(conversationId, placement, sourceConversationId)
    : initial.jht(conversationId, placement, sourceConversationId, clientThreadId);
  return jsx().jsx(Provider, { scope: initial.kht, value, children: child });
}
function interactionMarksRead(event: { defaultPrevented?: boolean; key?: string; type?: string }): boolean {
  return event.defaultPrevented !== true && (event.type !== "keydown" || !["Meta", "Control", "Alt", "AltGraph", "Shift"].includes(event.key ?? ""));
}
type UnreadConversationState = { hasConversation: boolean; hasPersistedUnreadTurn: boolean; hasUnreadTurn: boolean; persistedUnreadHostId: string | undefined };
function unreadConversationState(get: ScopeLike["get"], conversationId: string): UnreadConversationState {
  const hasConversation = Boolean(get(initial.zZt, conversationId));
  const registeredHostId = get(initial.wQt, conversationId) as string | undefined;
  const persistedUnreadHostId = hasConversation ? registeredHostId : (get(initial.o0t, conversationId)?.hostId ?? registeredHostId);
  const summary = get(initial.UQt, { hostId: persistedUnreadHostId, threadId: conversationId });
  const persistedUnread = get(initial.ewt);
  return {
    hasConversation,
    hasPersistedUnreadTurn: Array.isArray(persistedUnread?.[persistedUnreadHostId ?? ""]) && persistedUnread[persistedUnreadHostId!].includes(conversationId),
    hasUnreadTurn: summary?.summary?.hasUnreadTurn === true,
    persistedUnreadHostId,
  };
}
function markConversationRead(scope: ScopeLike | null, conversationId: string): void {
  if (scope == null) return;
  const state = unreadConversationState(scope.get.bind(scope), conversationId);
  if (!state.hasUnreadTurn && !state.hasPersistedUnreadTurn) return;
  try { initial.Ugn?.(scope, state.persistedUnreadHostId)?.markConversationAsRead?.(conversationId); } catch { /* read tracking is best effort */ }
}
function watchConversationRead(scope: ScopeLike | null, conversationId: string): (() => void) | void {
  if (scope?.watch == null) return;
  let initialized = false;
  let previousRequestId: string | null = null;
  let previousTurnId: string | null = null;
  let previousTurnStatus: string | null = null;
  let previousReceipt: any = scope.get(initial.eQt);
  return scope.watch(({ get }) => {
    if (initial.GPt != null && get(initial.GPt) !== true) return;
    const unread = unreadConversationState(get, conversationId);
    const requests = get(initial.UQt, { hostId: unread.persistedUnreadHostId, threadId: conversationId })?.requests;
    const requestId = Array.isArray(requests) ? requests.at(-1)?.id ?? null : null;
    const turnSummary = get(initial.WQt, { hostId: unread.persistedUnreadHostId, threadId: conversationId });
    const turnId = turnSummary?.lastTurnId ?? null;
    const turnStatus = turnSummary?.lastTurnStatus ?? null;
    const receipt = get(initial.eQt);
    if (!unread.hasUnreadTurn && !unread.hasPersistedUnreadTurn) {
      initialized = true;
      previousRequestId = requestId;
      previousTurnId = turnId;
      previousTurnStatus = turnStatus;
      previousReceipt = receipt;
      return;
    }
    const routeReceiptMatches = receipt !== previousReceipt && receipt?.conversationId === conversationId && receipt?.hostId === unread.persistedUnreadHostId && receipt?.turnId === turnId;
    if (!initialized || routeReceiptMatches || (unread.hasPersistedUnreadTurn && !unread.hasUnreadTurn) || previousRequestId !== requestId || previousTurnId !== turnId || previousTurnStatus !== turnStatus) {
      initialized = true;
      previousRequestId = requestId;
      previousTurnId = turnId;
      previousTurnStatus = turnStatus;
      previousReceipt = receipt;
      markConversationRead(scope, conversationId);
    }
  });
}
function unavailableResumeState(): ResumeState {
  return { hasResumeFailed: false, isResuming: false, isUnavailable: false, isWriterConflict: false, retryResume: () => undefined };
}
type BackgroundAgentTarget = { canInteract?: boolean; conversationId: string; displayName?: string };
function backgroundAgentCallbacks(scope: ScopeLike | null, parentConversationId: string, hostId: string | undefined, onOpen?: (agent: BackgroundAgentTarget) => void) {
  const resolve = (conversationId: string): BackgroundAgentTarget | null => {
    const resolver = (openTargetChunk as unknown as Record<string, any>).t;
    if (typeof resolver !== "function" || scope == null) return { conversationId };
    return resolver(scope, parentConversationId, hostId, conversationId) ?? null;
  };
  return {
    canOpen(conversationId: string): boolean { return resolve(conversationId) != null; },
    open(conversationId: string): void {
      const target = resolve(conversationId);
      if (target != null && (target.canInteract !== false || onOpen != null)) onOpen?.(target);
    },
  };
}

// ---------------------------------------------------------------------------
// 主面板判定（原 `iM`，导出 u）
// ---------------------------------------------------------------------------

/**
 * 主面板判定（原 `iM`，导出 u）：
 * 右面板展开且活动 tab 非 sidechat:/sidechat-loading:/background-agent: 前缀。
 */
function isMainPanelActive({ activeTabId, isRightPanelExpanded }: { activeTabId?: string | null; isRightPanelExpanded: boolean }): boolean {
  return (
    isRightPanelExpanded &&
    activeTabId?.startsWith("sidechat:") !== true &&
    activeTabId?.startsWith("sidechat-loading:") !== true &&
    activeTabId?.startsWith("background-agent:") !== true
  );
}

// ---------------------------------------------------------------------------
// agent 显示名（原 `eD`，导出 m）
// ---------------------------------------------------------------------------

/**
 * agent 显示名（原 `eD`，导出 m）：
 * 空 + 不生成兜底 → null；空 + 生成 → agent-<conversationId 前 8 位>；
 * @ 前缀剥离。
 */
function agentDisplayName({ agentNickname, conversationId, useGeneratedFallback }: { agentNickname?: string | null; conversationId: string; useGeneratedFallback?: boolean }): string | null {
  const trimmed = agentNickname?.trim();
  if (!useGeneratedFallback && !trimmed) return null;
  const effective = trimmed || `agent-${conversationId.slice(0, 8)}`;
  return effective.startsWith("@") ? effective.slice(1) : effective;
}

// ---------------------------------------------------------------------------
// clientThreadId family（原 `oM`/`sM`，导出 l/c）
// ---------------------------------------------------------------------------

/**
 * clientThreadIdFor family（原 `oM`，导出 l）：
 * 已有线程（Fa 命中）→ 原值；会话源（Yp）launchMode=create-stable-worktree
 * → null；否则 → clientThreadId。
 */
const fallbackClientThreadIdForFamily = {
  resolve(conversationId: string | null, lookup: (key: unknown, id: string | null) => unknown): string | null {
    if (conversationId != null && lookup(null, conversationId) != null) return conversationId;
    const source = lookup(null, conversationId) as { launchMode?: string; clientThreadId?: string } | null;
    if (source == null) return null;
    if (source.launchMode === "create-stable-worktree") return null;
    return source.clientThreadId ?? null;
  },
};
let clientThreadIdForFamily: unknown = fallbackClientThreadIdForFamily;

/** family 装配初始化器（原 `sM`，导出 c）。 */
function initializeClientThreadIdFamily(): void {
  if (clientThreadIdForFamily !== fallbackClientThreadIdForFamily) return;
  call(shared.$3);
  call(shared.QI);
  call(initial.C);
  const createDerivedFamily = shared.rZ;
  if (typeof createDerivedFamily !== "function" || shared.ZI == null) return;
  clientThreadIdForFamily = createDerivedFamily(shared.ZI, (conversationId: string | null, helpers: { get(signal: unknown, parameter?: unknown): any }) => {
    if (conversationId != null && helpers.get(initial.Ltn, conversationId) != null) return conversationId;
    const source = helpers.get(initial.y_t, conversationId);
    return source == null ? source : source.launchMode === "create-stable-worktree" ? null : source.clientThreadId;
  });
}

// ---------------------------------------------------------------------------
// 恢复重试卡 / writer 冲突卡（原 `yM`/`dM`，导出 a/o）
// ---------------------------------------------------------------------------

/** writer 冲突三消息（原文）。 */
const WRITER_CONFLICT_MESSAGES = {
  title: { defaultMessage: "This is open in another app", description: "Title shown when a conversation is already active elsewhere" },
  description: { defaultMessage: "Close it there to continue here.", description: "Explanation shown when a conversation can be read but is actively being used elsewhere" },
  retry: { defaultMessage: "Retry", description: "Button to retry opening a conversation after it stops being active elsewhere" },
} as const;

/** 重试卡（原 `yM`，导出 a）。 */
function ResumeRetryCard(props: { onRetry?: () => void }): unknown {
  const Button = shared.Yh ?? "button";
  return jsx().jsx("section", {
    className: "flex h-full flex-col items-center justify-center gap-3 select-none",
    "data-thread-state": "unavailable",
    role: "alert",
    children: jsx().jsxs(jsx().Fragment, { children: [
      jsx().jsx("h2", { children: "Task unavailable" }),
      jsx().jsx(Button, { color: "outline", type: "button", onClick: props.onRetry, children: "Retry" }),
    ] }),
  });
}

/** writer 冲突卡（原 `dM`，导出 o）。 */
function WriterConflictCard(props: { isResuming?: boolean; onRetry?: () => void }): unknown {
  const Button = shared.Yh ?? "button";
  return jsx().jsxs("section", {
    className: "flex flex-wrap items-center gap-3 rounded-lg border border-warning p-3",
    "data-thread-state": "writer-conflict",
    role: "alert",
    children: [
      jsx().jsxs("div", { className: "min-w-0 flex-1", children: [
        jsx().jsx("strong", { children: WRITER_CONFLICT_MESSAGES.title.defaultMessage }),
        jsx().jsx("p", { children: WRITER_CONFLICT_MESSAGES.description.defaultMessage }),
      ] }),
      jsx().jsx(Button, { color: "ghostActive", disabled: props.isResuming === true, type: "button", onClick: props.onRetry, children: WRITER_CONFLICT_MESSAGES.retry.defaultMessage }),
    ],
  });
}

// ---------------------------------------------------------------------------
// 线程容器（原 `pM`，导出 n）
// ---------------------------------------------------------------------------

/**
 * ThreadContainer（原 `pM`，导出 n）：
 * trackReadState 时 pointer/key 捕获 → 已读标记（仅键盘/指针交互）；
 * 挂载时标记一次；Lj 线程体（enableMcpApps=false/统一时间线/进行中固定内容）
 * 包裹 min-h-0 flex-1。
 */
function ThreadContainer(props: {
  backgroundAgentCallbacks?: { canOpen(conversationId: string): boolean; open(conversationId: string): void };
  children?: unknown;
  conversationId: string;
  hostId?: string;
  isReadOnly?: boolean;
  retainActiveInterest?: boolean;
  showSideChatEmptyState?: boolean;
  trackReadState?: boolean;
  onMarkRead?: (conversationId: string) => void;
}): unknown {
  const trackReadState = props.trackReadState === true;
  const isReadOnly = props.isReadOnly === true;
  const retainActiveInterest = props.retainActiveInterest !== false;
  const scope = appScope();
  // Original Lj subscribes to E_t before reading turn projections. This is a
  // runtime contract, not a DOM annotation: without it completed stream events
  // are persisted but the open transcript does not update until it is reopened.
  query(initial.E_t, retainActiveInterest ? activeInterestParameter(props.hostId, props.conversationId) : null);
  const projected = query<{ renderEntries?: Array<Record<string, any>>; visibleTurnEntries?: Array<Record<string, any>> }>(initial.M_, {
    conversationId: props.conversationId,
    isBackgroundSubagentsEnabled: true,
  });
  const markRead = (event?: { defaultPrevented?: boolean; key?: string; type?: string }) => {
    if (!trackReadState || (event != null && !interactionMarksRead(event))) return;
    if (props.onMarkRead != null) { props.onMarkRead(props.conversationId); return; }
    markConversationRead(scope, props.conversationId);
  };
  const react = shared.e6?.() as ReactRuntime | undefined;
  react?.useEffect?.(() => {
    if (!trackReadState) return;
    if (props.onMarkRead != null) { props.onMarkRead(props.conversationId); return; }
    return watchConversationRead(scope, props.conversationId);
  }, [props.conversationId, props.onMarkRead, scope, trackReadState]);
  // `visibleTurnEntries` is the lightweight conversation/context projection.
  // The original thread renderer consumes `renderEntries`, which also carries
  // assistant/tool transcript blocks assembled from thread/items/list.
  const entries = projected?.renderEntries ?? projected?.visibleTurnEntries ?? [];
  const Turn = (localConversationTurn as any).t;
  const RowComponent = ({ entry, latestTurnFooter, latestTurnFollowContentRef }: { entry: Record<string, any>; latestTurnFooter?: unknown; latestTurnFollowContentRef?: unknown }) => {
    if (entry.type === "gap") return jsx().jsx("div", { "aria-hidden": true, style: { height: entry.estimatedHeightPx ?? 0 } });
    if (entry.type === "child-elicitation") return null;
    if (entry.type === "voice-transcript" || entry.type === "voice-presentation") {
      return jsx().jsx("div", { "data-voice-turn": entry.type, children: entry.block?.text ?? entry.presentation ?? null });
    }
    const turn = entry.turn ?? entry;
    return Turn == null ? null : jsx().jsx(Turn, {
      ...entry,
      turn,
      conversationId: props.conversationId,
      hostId: props.hostId,
      isBackgroundSubagentsEnabled: entry.isBackgroundSubagentsEnabled !== false,
      isLatestTurn: entry.isLatestTurn === true,
      isMostRecentTurn: entry.isMostRecentTurn === true,
      isReadOnly,
      latestTurnFollowContentRef,
      renderMcpApps: entry.renderMcpApps !== false,
      turnRequests: entry.requests ?? entry.turnRequests ?? turn.requests,
      latestTurnFooter,
    });
  };
  const VirtualizedList = (virtualizedTurnList as any).t;
  const renderableEntries = entries.map((entry, index) => ({
    ...entry,
    type: entry.type ?? "turn",
    turnKey: String(entry.turnKey ?? entry.turnId ?? entry.turn?.turnId ?? index),
    isLatestTurn: entry.isLatestTurn === true || index === entries.length - 1,
    isMostRecentTurn: index === entries.length - 1,
  }));
  const turns = typeof VirtualizedList === "function" && renderableEntries.length > 0
    ? jsx().jsx(VirtualizedList, {
        collapseEmptyRows: false,
        entries: renderableEntries,
        preserveMeasuredTurnViewport: true,
        RowComponent,
      })
    : renderableEntries.map((entry) => jsx().jsx(RowComponent, { entry }, entry.turnKey));
  const body = props.children ?? jsx().jsx("div", {
    className: "flex min-h-0 flex-1 flex-col overflow-y-auto",
    "data-local-conversation-body": true,
    "data-conversation-id": props.conversationId,
    "data-host-id": props.hostId,
    "data-read-only": isReadOnly || undefined,
    "data-retain-active-interest": retainActiveInterest,
    "data-show-side-chat-empty-state": props.showSideChatEmptyState === true || undefined,
    children: renderableEntries.length === 0
      ? (props.showSideChatEmptyState === true ? jsx().jsx("div", { "data-side-chat-empty-state": true, children: "No messages yet" }) : null)
      : turns,
  });
  const ThreadScrollLayout = (scrollLayout as any).t;
  const scrollBody = typeof ThreadScrollLayout === "function"
    ? jsx().jsx(ThreadScrollLayout, {
        active: true,
        autoLoadHistory: true,
        children: body,
        preserveViewportOnContentGrowth: true,
        scrollOrigin: "bottom",
      })
    : body;
  return jsx().jsx("div", {
    className: "min-h-0 flex-1",
    "data-local-conversation-thread-container": true,
    onPointerDownCapture: markRead,
    onKeyDownCapture: markRead,
    onClickCapture: props.backgroundAgentCallbacks == null ? undefined : (event: { target?: { closest?(selector: string): { getAttribute(name: string): string | null } | null } }) => {
      const conversationId = event.target?.closest?.("[data-background-agent-id]")?.getAttribute("data-background-agent-id");
      if (conversationId != null && props.backgroundAgentCallbacks?.canOpen(conversationId)) props.backgroundAgentCallbacks.open(conversationId);
    },
    children: scrollBody,
  });
}

// ---------------------------------------------------------------------------
// 线程主组件（原 `fM`，导出 t）
// ---------------------------------------------------------------------------

function ThreadComposer(props: {
  className?: string;
  composerPresentation?: Record<string, any> | null;
  conversationId: string | null;
  disabled?: boolean;
  hostId?: string;
  lockedCollaborationMode?: unknown;
  showUtilityBar?: boolean;
}): unknown {
  const Composer = (appPrimaryChunk as any).ut;
  if (typeof Composer !== "function") {
    return jsx().jsx("div", { className: props.className, "aria-disabled": props.disabled === true, "data-thread-composer": true });
  }
  const presentation = props.composerPresentation ?? undefined;
  return jsx().jsx("div", {
    className: ["flex flex-col gap-2", props.className].filter(Boolean).join(" "),
    "data-thread-composer": true,
    "data-thread-find-composer": "true",
    children: jsx().jsx(Composer, {
      animateRadius: presentation?.animateRadius,
      composerLayoutMode: presentation?.composerLayoutMode,
      hideRunLocationDropdownOverride: presentation?.hideRunLocationDropdownOverride,
      hideSecondaryControls: presentation?.hideSecondaryControls,
      isThreadHistoryLoading: props.disabled === true,
      lockedCollaborationMode: props.lockedCollaborationMode,
      lockedLayout: presentation?.lockedLayout,
      onLocalConversationCreated: () => undefined,
      placeholderText: props.conversationId == null ? "Starting your task…" : undefined,
      radiusVariant: presentation?.radiusVariant,
      selectedProject: query(initial.mo),
      showUtilityBar: props.showUtilityBar !== false,
      showWorkspaceDropdownInUtilityBar: presentation?.showWorkspaceDropdownInUtilityBar === true,
      submitDisabled: props.disabled === true,
      surfaceClassName: props.className,
      surfaceVariant: presentation?.surfaceVariant,
    }),
  });
}

/**
 * LocalConversationThread（原 `fM`，导出 t）：
 * ① resume 状态机（shouldResume && canInteract && 会话/共享判定）；
 * ② 共享线程不可用 → 不可用卡；恢复失败（非 writer 冲突且无写者）→ 重试卡；
 * ③ writer 冲突 → WriterConflictCard（isResuming 透传）；
 * ④ 只读降级（canInteract=false 或 writer 冲突）；composer 禁用。
 */
function LocalConversationThread(props: {
  canInteract?: boolean;
  composerPresentation?: unknown;
  composerSubmitDisabled?: boolean;
  conversationId: string;
  disableScrollToTop?: boolean;
  header?: unknown;
  hideThreadContent?: boolean;
  hostId?: string;
  hostMcpApps?: boolean;
  onOpenBackgroundAgent?: (agent: BackgroundAgentTarget) => void;
  shouldResume?: boolean;
  threadAccess?: unknown;
}): unknown {
  const canInteract = props.canInteract !== false;
  const shouldResume = props.shouldResume !== false;
  const scope = appScope();
  const knownConversationSignal = query<boolean>(initial.zZt, props.conversationId);
  const threadProjection = query<{ visibleTurnEntries?: unknown[] }>(initial.M_, {
    conversationId: props.conversationId,
    isBackgroundSubagentsEnabled: true,
  });
  const hasVisibleThreadContent = (threadProjection?.visibleTurnEntries?.length ?? 0) > 0;
  const knownConversation = knownConversationSignal ?? false;
  const projectedHostId = query<string>(initial.wQt, props.conversationId);
  const resolvedHostId = props.hostId ?? projectedHostId;
  const isShared = props.threadAccess === "shared" || (typeof props.threadAccess === "object" && props.threadAccess != null && (props.threadAccess as { kind?: string }).kind === "shared");
  const resumeConversationId = shouldResume && canInteract && (knownConversation || isShared) ? props.conversationId : null;
  const resumeHook = resumeRuntime.n as ((conversationId: string | null, threadAccess?: string) => ResumeState) | undefined;
  const resumeState = resumeHook?.(resumeConversationId, isShared ? "shared" : "private") ?? unavailableResumeState();
  // 不可用（共享线程）
  if (isShared && resumeState.isUnavailable && !hasVisibleThreadContent) return jsx().jsx(ResumeRetryCard, { onRetry: resumeState.retryResume });
  // 恢复失败（非冲突且无内容）
  if (isShared && resumeState.hasResumeFailed && !resumeState.isWriterConflict && !hasVisibleThreadContent) return jsx().jsx(ResumeRetryCard, { onRetry: resumeState.retryResume });
  // writer 冲突卡
  const writerConflictCard = resumeState.isWriterConflict ? jsx().jsx(WriterConflictCard, { isResuming: resumeState.isResuming, onRetry: resumeState.retryResume }) : null;
  const isReadOnly = !canInteract || resumeState.isWriterConflict;
  const showComposer = canInteract && !resumeState.isWriterConflict;
  const composerDisabled = props.composerSubmitDisabled === true || isReadOnly || resumeState.isResuming;
  const agentCallbacks = backgroundAgentCallbacks(scope, props.conversationId, resolvedHostId, props.onOpenBackgroundAgent);
  const thread = props.hideThreadContent === true ? null : jsx().jsx(ThreadContainer, {
    backgroundAgentCallbacks: agentCallbacks,
    conversationId: props.conversationId,
    hostId: resolvedHostId,
    isReadOnly,
    retainActiveInterest: true,
  });
  return jsx().jsxs("section", {
    className: "flex h-full min-h-0 flex-col",
    "data-local-conversation-thread": props.conversationId,
    "data-host-id": resolvedHostId,
    "data-resuming": resumeState.isResuming || undefined,
    "data-writer-conflict": resumeState.isWriterConflict || undefined,
    children: [
      props.header == null ? null : jsx().jsx("header", { "data-thread-header": true, children: props.header }),
      jsx().jsx("div", { className: "relative flex min-h-0 flex-1 flex-col", children: thread }),
      writerConflictCard,
      props.hostMcpApps === true ? jsx().jsx("div", { "data-host-mcp-apps": true }) : null,
      showComposer ? jsx().jsx(ThreadComposer, {
        className: "shrink-0",
        composerPresentation: typeof props.composerPresentation === "object" ? props.composerPresentation as Record<string, any> : null,
        conversationId: props.conversationId,
        disabled: composerDisabled,
        hostId: resolvedHostId,
      }) : null,
    ],
  });
}

/** fM 初始化器（原 `OM`，导出 s）。 */
function initializeLocalConversationThread(): void {
  if (localThreadInitialized) return;
  localThreadInitialized = true;
  initializeThreadMountDependencies();
  initializeClientThreadIdFamily();
  call(resumeRuntime.t);
  call((virtualizedTurnList as any).n);
  call((virtualizedTurnList as any).r);
  call((localConversationTurn as any).n);
  call((conversationBlocks as any).p);
  call((splitItems as any).t);
  call((userMessage as any).n);
  call((gitActions as any).i);
  call((gitActions as any).n);
  call((scrollLayout as any).n);
}

// ---------------------------------------------------------------------------
// 侧聊线程（原 `cM`/`lM`，导出 i/r）
// ---------------------------------------------------------------------------

/**
 * SideChatThread（原 `cM`，导出 i）：
 * 20 号 memo-cache；shouldResume/allowMissingConversation/showUtilityBar/
 * composer 变体/footer/右面板覆盖隐藏/只读/转写可见性/renderLayout/
 * restoreScrollPosition/showComposer/showSummaryPanel/lockedCollaborationMode
 * 全 props 透传至 _M 主装配。
 */
function SideChatThread(props: {
  allowMissingConversation?: boolean;
  composerPresentation?: unknown;
  composerSurfaceClassName?: string;
  footerContent?: unknown;
  hideWhenCoveredByRightPanel?: boolean;
  isReadOnly?: boolean;
  isTranscriptVisible?: boolean;
  lockedCollaborationMode?: unknown;
  onOpenBackgroundAgent?: (agent: BackgroundAgentTarget) => void;
  onOpenPullRequestSidePanel?: () => void;
  onOpenSubagentsPanel?: () => void;
  renderLayout?: unknown;
  restoreScrollPosition?: unknown;
  shouldResume?: boolean;
  showComposer?: boolean;
  showMessagingToggle?: boolean;
  showSummaryPanel?: boolean;
  showUtilityBar?: boolean;
}): unknown {
  const clientThreadContext = typeof shared.LX === "function" && initial.wtn != null ? shared.LX(initial.wtn) : null;
  const clientThreadId = clientThreadContext?.value?.clientThreadId ?? clientThreadContext?.value ?? null;
  const scope = appScope();
  const mappedConversationId = clientThreadId == null ? null : query<string | null>(clientThreadIdForFamily, clientThreadId);
  const conversationId = mappedConversationId ?? currentRouteConversationId(scope);
  const hostId = query<string>(initial.wQt, conversationId);
  const exists = conversationId == null ? false : query<boolean>(initial.zZt, conversationId);
  const waitingForCreation = clientThreadId != null && conversationId == null;
  const missing = conversationId != null && exists === false;
  let content: unknown;
  if (waitingForCreation) {
    content = jsx().jsx(ThreadSetup, { clientThreadId, submittedThreadStart: query(initial.Ltn, clientThreadId) });
  } else if (missing && props.allowMissingConversation !== true) {
    content = jsx().jsx(ExpiredSideChat, { conversationId: conversationId!, sourceConversationId: currentRouteConversationId(scope), target: "right" });
  } else if (conversationId == null) {
    content = props.footerContent ?? null;
  } else {
    const isReadOnly = props.isReadOnly === true || missing;
    content = jsx().jsxs(jsx().Fragment, { children: [
      jsx().jsx(LocalConversationThread, {
        canInteract: !isReadOnly && props.showComposer !== false,
        composerPresentation: props.composerPresentation,
        conversationId,
        header: props.showUtilityBar === false ? undefined : jsx().jsx(ThreadPanelsBar, {
          onOpenBackgroundAgent: props.onOpenBackgroundAgent,
          onOpenPullRequestSidePanel: props.onOpenPullRequestSidePanel,
          onOpenSubagentsPanel: props.onOpenSubagentsPanel,
        }),
        hostId,
        onOpenBackgroundAgent: props.onOpenBackgroundAgent,
        shouldResume: props.shouldResume !== false,
      }),
      props.showSummaryPanel === false ? null : jsx().jsx("aside", { "data-thread-summary-panel": true }),
      props.footerContent == null ? null : jsx().jsx("footer", { "data-thread-footer": true, children: props.footerContent }),
    ] });
  }
  const surface = jsx().jsx("section", {
    className: props.composerSurfaceClassName,
    "data-side-chat-thread": clientThreadId ?? true,
    "data-conversation-id": conversationId ?? undefined,
    "data-hide-when-covered": props.hideWhenCoveredByRightPanel !== false || undefined,
    "data-transcript-visible": props.isTranscriptVisible !== false || undefined,
    "data-render-layout": props.renderLayout == null ? undefined : true,
    "data-restore-scroll-position": props.restoreScrollPosition == null ? undefined : true,
    "data-show-messaging-toggle": props.showMessagingToggle === true || undefined,
    "data-locked-collaboration-mode": props.lockedCollaborationMode == null ? undefined : true,
    children: content,
  });
  const Context = (sideChatRuntime as any).t;
  const contextual = Context?.Provider == null ? surface : jsx().jsx(Context.Provider, { value: SideChat, children: surface });
  const routeConversationId = currentRouteConversationId(scope) ?? conversationId;
  // The original established-thread path scopes the main placement by the
  // server conversation id. Carrying a stale client-new-thread id here causes
  // BrowserHostManager to create IAB pages under the wrong session route.
  return withThreadPlacementScope(contextual, conversationId, "main", routeConversationId, conversationId == null ? clientThreadId : null);
}

/**
 * SideChat（原 `lM`，导出 r；44 号 memo-cache）：
 * conversationId 无效 → uM 启动页；uM banner（会话进行中）；只读/时间线/
 * composer 显示矩阵；语音启用 → codexPerspective 包裹。
 */
function SideChat(props: {
  clientThreadId?: string | null;
  conversationId?: string | null;
  lockedCollaborationMode?: unknown;
  target?: unknown;
}): unknown {
  const scope = appScope();
  const sourceConversationId = currentRouteConversationId(scope);
  const available = query<boolean>(initial.zZt, props.conversationId ?? null);
  const isRunningElsewhere = query<boolean>(initial.XZt, props.conversationId ?? null);
  const hostId = query<string>(initial.wQt, props.conversationId ?? sourceConversationId);
  if (props.conversationId != null && available === false) {
    return jsx().jsx(ExpiredSideChat, { conversationId: props.conversationId, sourceConversationId, target: props.target });
  }
  const conversationId = props.conversationId ?? props.clientThreadId ?? null;
  const readOnly = isRunningElsewhere === true;
  const banner = props.conversationId != null && isRunningElsewhere === true
    ? jsx().jsx(ExpiredSideChat, { conversationId: props.conversationId, presentation: "banner", sourceConversationId, target: props.target })
    : null;
  const body = conversationId == null
    ? jsx().jsx(ThreadSetup, { clientThreadId: props.clientThreadId })
    : jsx().jsxs("section", {
        className: "flex h-full min-h-0 flex-col",
        "data-side-chat": conversationId,
        "data-unified-timeline": voiceTimelineEnabled(props.conversationId ?? null) || undefined,
        children: [
          banner,
          jsx().jsx(ThreadContainer, {
            conversationId,
            hostId,
            isReadOnly: readOnly,
            retainActiveInterest: !readOnly,
            showSideChatEmptyState: isRunningElsewhere === false,
          }),
          readOnly ? null : jsx().jsx(ThreadComposer, {
            className: "shrink-0",
            conversationId,
            disabled: false,
            hostId,
            lockedCollaborationMode: props.lockedCollaborationMode,
            showUtilityBar: false,
          }),
        ],
      });
  const Context = (sideChatRuntime as any).t;
  const contextual = Context?.Provider == null ? body : jsx().jsx(Context.Provider, { value: SideChat, children: body });
  const scoped = withThreadPlacementScope(contextual, props.conversationId ?? null, "side", sourceConversationId, props.clientThreadId);
  return voiceTimelineEnabled(props.conversationId ?? null)
    ? jsx().jsx("div", { className: "group/realtime-voice-thread relative flex h-full min-h-0 flex-1 flex-col overflow-clip", "data-realtime-voice-perspective": true, children: scoped })
    : scoped;
}

function ExpiredSideChat(props: {
  conversationId: string;
  presentation?: "banner" | "page";
  sourceConversationId: string | null;
  target?: unknown;
}): unknown {
  const scope = appScope();
  const react = shared.e6?.() as ReactRuntime | undefined;
  const state = react?.useState?.(false);
  const recreating = state?.[0] ?? false;
  const setRecreating = state?.[1] ?? (() => undefined);
  const sourceConversationId = props.sourceConversationId;
  const recreate = () => {
    if (scope == null || sourceConversationId == null || recreating || typeof (sideChatRuntime as any).r !== "function") return;
    setRecreating(true);
    const sourceHostId = scope.get(initial.wQt, sourceConversationId);
    const cwd = scope.get(initial.MZt, sourceConversationId);
    const collaborationMode = scope.get(initial.rQt, sourceConversationId);
    Promise.resolve((sideChatRuntime as any).r(scope, SideChat, {
      collaborationMode,
      cwd,
      displayTitle: undefined,
      hostId: sourceHostId,
      replaceTabId: `sidechat:${props.conversationId}`,
      sourceConversationId,
      target: props.target,
    })).catch(() => setRecreating(false));
  };
  const action = sourceConversationId == null ? null : jsx().jsx("button", {
    disabled: recreating,
    onClick: recreate,
    type: "button",
    children: recreating ? "Starting new side chat…" : "Start new side chat",
  });
  if (props.presentation === "banner") {
    return jsx().jsxs("div", { role: "alert", "data-side-chat-expired-banner": true, children: [
      jsx().jsx("strong", { children: "Side chat expired" }),
      jsx().jsx("span", { children: "This temporary side chat is no longer available; start a new side chat to continue" }),
      action,
    ] });
  }
  return jsx().jsxs("section", { className: "flex h-full flex-col items-center justify-center gap-2", "data-side-chat-expired": true, children: [
    jsx().jsx("h2", { children: "Side chat expired" }),
    jsx().jsx("p", { children: "This temporary side chat is no longer available; start a new side chat to continue" }),
    action,
  ] });
}

// ---------------------------------------------------------------------------
// 面板条 / 线程装配页（原 `yE`/`Ej`，导出 g/f）
// ---------------------------------------------------------------------------

/** 面板条（原 `yE`，导出 g）。 */
function ThreadPanelsBar(props: {
  onOpenBackgroundAgent?: (agent: BackgroundAgentTarget) => void;
  onOpenPullRequestSidePanel?: () => void;
  onOpenSubagentsPanel?: () => void;
}): unknown {
  return jsx().jsxs("nav", { "aria-label": "Thread panels", "data-thread-panels-bar": true, children: [
    props.onOpenSubagentsPanel == null ? null : jsx().jsx("button", { type: "button", onClick: props.onOpenSubagentsPanel, children: "Subagents" }),
    props.onOpenPullRequestSidePanel == null ? null : jsx().jsx("button", { type: "button", onClick: props.onOpenPullRequestSidePanel, children: "Pull request" }),
  ] });
}

/** 线程装配页（原 `Ej`，导出 f；49 号 memo-cache）。 */
function ThreadSetup(props: {
  clientThreadId?: string | null;
  onBack?: () => void;
  onRetry?: () => void;
  onWorktreeCancel?: () => void;
  submittable?: boolean;
  submittedThreadStart?: { hostId?: string; prompt?: string; status?: string } | null;
}): unknown {
  const pending = props.submittedThreadStart;
  const status = pending?.status ?? "creating";
  return jsx().jsxs("section", { className: "flex flex-col gap-4", "data-thread-setup": props.clientThreadId ?? true, "aria-live": status === "creating" || status === "queued" ? "polite" : "assertive", children: [
    pending?.prompt == null ? null : jsx().jsx("div", { "data-pending-user-message": true, children: pending.prompt }),
    status === "creating" || status === "queued" ? jsx().jsx("p", { role: "status", children: "Starting your task" }) : null,
    status === "outcome-unknown" ? jsx().jsx("p", { role: "alert", children: "Task creation is not yet confirmed. Do not submit it again while Codex checks its outcome" }) : null,
    status === "failed" ? jsx().jsxs("div", { role: "alert", children: [
      jsx().jsx("span", { children: "Could not start this chat" }),
      jsx().jsx("button", { type: "button", onClick: props.onRetry ?? props.onBack, children: props.onRetry == null ? "Go back" : "Try again" }),
    ] }) : null,
    pending == null && props.onWorktreeCancel != null ? jsx().jsx("button", { type: "button", onClick: props.onWorktreeCancel, children: "Cancel" }) : null,
  ] });
}

// ---------------------------------------------------------------------------
// 初始化器（原 `OE`/`aM`/`tD`/`Aj`，导出 _/d/h/p）
// ---------------------------------------------------------------------------

/** 挂载初始化器（原 `OE`，导出 _）。 */
function initializeThreadMountDependencies(): void {
  if (threadMountInitialized) return;
  threadMountInitialized = true;
  call(shared.$3);
  call(shared.K2);
  call(shared.FX);
  call(shared.wL);
  call(initial.C);
  call(appPrimaryInit);
  call((virtualizedTurnList as any).r);
  call((localConversationTurn as any).n);
  call((conversationBlocks as any).p);
  call((splitItems as any).t);
  call((userMessage as any).n);
  call((gitActions as any).i);
  call((gitActions as any).n);
  call((scrollLayout as any).n);
  call((resumeConversationChunk as any).t);
}

/** 空初始化器（原 `aM`，导出 d）。 */
function initializeNoop(): void {}

/** 空初始化器（原 `tD`，导出 h）。 */
function initializeBackgroundAgentCallbacks(): void {}

/** 主初始化器（原 `Aj`，导出 p；50+ 依赖装配）。 */
function initializeLocalConversationThreadModule(): void {
  if (moduleInitialized) return;
  moduleInitialized = true;
  initializeThreadMountDependencies();
  initializeClientThreadIdFamily();
  initializeLocalConversationThread();
  if (!setupInitialized) {
    setupInitialized = true;
    call((pendingOnboarding as any)?.t);
    call((worktreeSetupAutoFix as any)?.i);
    call((worktreeSetupAutoFix as any)?.n);
    call((threadTurnEntries as any)?.i);
    call((threadTurnEntries as any)?.r);
    call((threadBridge as any)?.n);
    call((threadPinShortcutBridge as any)?.n);
    call((useLocalConversationSources as any)?.t);
  }
}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约，17 个全部对齐）
// ---------------------------------------------------------------------------

export {
  initializeThreadMountDependencies as _,
  ResumeRetryCard as a,
  initializeClientThreadIdFamily as c,
  initializeNoop as d,
  ThreadSetup as f,
  ThreadPanelsBar as g,
  initializeBackgroundAgentCallbacks as h,
  SideChatThread as i,
  clientThreadIdForFamily as l,
  agentDisplayName as m,
  ThreadContainer as n,
  WriterConflictCard as o,
  initializeLocalConversationThreadModule as p,
  SideChat as r,
  initializeLocalConversationThread as s,
  LocalConversationThread as t,
  isMainPanelActive as u,
};
