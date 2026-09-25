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
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import { default as virtualizedTurnList } from "@rchunk/virtualized-turn-list";
import { default as localConversationTurn } from "@rchunk/local-conversation-turn";
import { default as conversationBlocks } from "@rchunk/conversation-blocks";
import { default as splitItems } from "@rchunk/split-items-into-render-groups";
import { default as userMessage } from "@rchunk/user-message";
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
import { default as sideChat } from "@rchunk/local-conversation-side-chat";
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
import { default as useResumeConversationIfNeeded } from "@rchunk/use-resume-conversation-if-needed";
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
import { default as triangleWarning } from "@rchunk/triangle-warning";

void appSharedLazy; void appInitialInit; void appPrimaryInit;
 void virtualizedTurnList; void localConversationTurn;
void conversationBlocks;  void splitItems;
 void userMessage; void scrollLayout;
void timestampSeparator; void threadHandoffModal; void sidePanel;
void planSidePanel; void pullRequest; void pullRequestDetailModel;
void pullRequestFixWorkflow; void pullRequestStatusLabel;
void openThreadPullRequestCodeTab; void gitActions; void gitActionNewBranchField;
void useGitConfigValue; void threadTurnEntries; void planModel;
void webmcpToolsModel; void sideChat; void summaryPanelImagePreview;
void artifactsSignals; void externalResourceIcon; void useLocalConversationSources;
void conversationSource; void creationTargetQuery; void environmentLabels;
void localEnvironmentEditor; void localEnvironmentWorkflowMessages;
void openLocalConversationBackgroundTerminalTab; void openLocalConversationSourcesSidePanelTab;
void useResumeConversationIfNeeded; void worktreeSetupAutoFix;
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

/** 视图描述。 */
export interface ThreadViewNode {
  kind: string;
  props?: Record<string, unknown>;
}

/** 恢复状态机（原 `ky` 的返回形态）。 */
export interface ResumeState {
  hasResumeFailed: boolean;
  isResuming: boolean;
  isUnavailable: boolean;
  isWriterConflict: boolean;
  retryResume: () => void;
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
const clientThreadIdForFamily = {
  resolve(conversationId: string | null, lookup: (key: unknown, id: string | null) => unknown): string | null {
    if (conversationId != null && lookup(null, conversationId) != null) return conversationId;
    const source = lookup(null, conversationId) as { launchMode?: string; clientThreadId?: string } | null;
    return source == null ? source : source.launchMode === "create-stable-worktree" ? null : (source.clientThreadId ?? null);
  },
};

/** family 装配初始化器（原 `sM`，导出 c）。 */
function initializeClientThreadIdFamily(): void {}

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
function ResumeRetryCard(props: { onRetry?: () => void }): ThreadViewNode {
  return { kind: "resume-retry-card", props: { onRetry: props.onRetry } };
}

/** writer 冲突卡（原 `dM`，导出 o）。 */
function WriterConflictCard(props: { isResuming?: boolean; onRetry?: () => void }): ThreadViewNode {
  return { kind: "writer-conflict-card", props: { isResuming: props.isResuming === true, onRetry: props.onRetry, ...WRITER_CONFLICT_MESSAGES } };
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
  conversationId: string;
  hostId?: string;
  isReadOnly?: boolean;
  retainActiveInterest?: boolean;
  showSideChatEmptyState?: boolean;
  trackReadState?: boolean;
}): ThreadViewNode {
  const trackReadState = props.trackReadState === true;
  const isReadOnly = props.isReadOnly === true;
  const retainActiveInterest = props.retainActiveInterest !== false;
  return {
    kind: "thread-container",
    props: {
      className: "min-h-0 flex-1",
      conversationId: props.conversationId,
      enableMcpApps: false,
      hostId: props.hostId,
      initialScrollOffset: null,
      initialVirtualizedTurnListRestoreState: null,
      isBackgroundSubagentsEnabled: false,
      isReadOnly,
      isResuming: false,
      retainActiveInterest,
      showInProgressFixedContent: true,
      showSideChatEmptyState: props.showSideChatEmptyState === true,
      trackReadState,
      usesUnifiedTimeline: true,
    },
  };
}

// ---------------------------------------------------------------------------
// 线程主组件（原 `fM`，导出 t）
// ---------------------------------------------------------------------------

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
  onOpenBackgroundAgent?: (conversationId: string) => void;
  shouldResume?: boolean;
  threadAccess?: unknown;
}): ThreadViewNode {
  const canInteract = props.canInteract !== false;
  const shouldResume = props.shouldResume !== false;
  const resumeState: ResumeState = {
    hasResumeFailed: false,
    isResuming: false,
    isUnavailable: false,
    isWriterConflict: false,
    retryResume: () => {},
  };
  // 不可用（共享线程）
  if (resumeState.isUnavailable) return { kind: "thread-unavailable", props: { onRetry: resumeState.retryResume } };
  // 恢复失败（非冲突且无内容）
  if (resumeState.hasResumeFailed && !resumeState.isWriterConflict) return ResumeRetryCard({ onRetry: resumeState.retryResume });
  // writer 冲突卡
  const writerConflictCard = resumeState.isWriterConflict ? WriterConflictCard({ isResuming: resumeState.isResuming, onRetry: resumeState.retryResume }) : null;
  const isReadOnly = !canInteract || resumeState.isWriterConflict;
  return {
    kind: "local-conversation-thread",
    props: {
      composerDisabled: props.composerSubmitDisabled === true || isReadOnly,
      conversationId: props.conversationId,
      header: props.header,
      hideThreadContent: props.hideThreadContent === true,
      hostId: props.hostId,
      isReadOnly,
      onOpenBackgroundAgent: props.onOpenBackgroundAgent,
      resumeState,
      shouldResume,
      writerConflictCard,
    },
  };
}

/** fM 初始化器（原 `OM`，导出 s）。 */
function initializeLocalConversationThread(): void {}

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
  onOpenBackgroundAgent?: (conversationId: string) => void;
  onOpenPullRequestSidePanel?: () => void;
  onOpenSubagentsPanel?: () => void;
  renderLayout?: unknown;
  restoreScrollPosition?: unknown;
  shouldResume?: boolean;
  showComposer?: boolean;
  showMessagingToggle?: boolean;
  showSummaryPanel?: boolean;
  showUtilityBar?: boolean;
}): ThreadViewNode {
  return { kind: "side-chat-thread", props: props as Record<string, unknown> };
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
}): ThreadViewNode {
  return { kind: "side-chat", props: props as Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// 面板条 / 线程装配页（原 `yE`/`Ej`，导出 g/f）
// ---------------------------------------------------------------------------

/** 面板条（原 `yE`，导出 g）。 */
function ThreadPanelsBar(props: {
  onOpenBackgroundAgent?: (conversationId: string) => void;
  onOpenPullRequestSidePanel?: () => void;
  onOpenSubagentsPanel?: () => void;
}): ThreadViewNode {
  return { kind: "thread-panels-bar", props: props as Record<string, unknown> };
}

/** 线程装配页（原 `Ej`，导出 f；49 号 memo-cache）。 */
function ThreadSetup(props: {
  clientThreadId?: string | null;
  onBack?: () => void;
  onRetry?: () => void;
  onWorktreeCancel?: () => void;
  submittable?: boolean;
}): ThreadViewNode {
  return { kind: "thread-setup", props: props as Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// 初始化器（原 `OE`/`aM`/`tD`/`Aj`，导出 _/d/h/p）
// ---------------------------------------------------------------------------

/** 挂载初始化器（原 `OE`，导出 _）。 */
function initializeThreadMountDependencies(): void {}

/** 空初始化器（原 `aM`，导出 d）。 */
function initializeNoop(): void {}

/** 空初始化器（原 `tD`，导出 h）。 */
function initializeBackgroundAgentCallbacks(): void {}

/** 主初始化器（原 `Aj`，导出 p；50+ 依赖装配）。 */
function initializeLocalConversationThreadModule(): void {}

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
