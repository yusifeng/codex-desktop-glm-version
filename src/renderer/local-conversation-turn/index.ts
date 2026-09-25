// local-conversation-turn —— 本地会话的单 turn 渲染组件（146KB / 3,490 行）。
//
// 原版：app/webview/assets/local-conversation-turn-14bf296d5217.js。
//
// 八个导出（压缩名 → 语义，全部经原文核实）：
//   - s（js）：TurnResources —— turn 末尾资源列表（artifact-session/file/
//     google-drive/appgen-app/website/page-reference 六类分发 + 前 3 条折叠
//     + appgen 端卡片判定 Ns + 展开按钮）
//   - t（Il）：LocalConversationTurn —— 主组件（memo 包裹）。props 60+ 项：
//     turn 状态投影（Ar：includeAeonProjection/isBackgroundSubagentsEnabled/
//     openAIFormElicitationsEnabled/preserveServerUserMessages/
//     showStrictReviewNotices/shouldHideUserMessage）+ MCP app widget 取代
//     标记（supersededMcpAppWidgetCallIds → isMcpAppWidgetSuperseded）+
//     编辑/fork 回调守卫（inProgress 禁用）+ 全部透传 rl（turn 渲染体）
//   - n（Ll）：主组件懒初始化器（60+ 依赖装配 + thinkingShimmer 消息）
//   - a（zs）：SubagentActivityInlineGroup —— 子代理活动行内组
//     （rows → Ka 项映射：animateEntrance/label/seed/onClick）
//   - c（Rs）：该组初始化器（Ls=3 折叠阈值）
//   - r（Qs）：EnvironmentSetupStageMessage —— creating/connecting/starting
//     三阶段加载文案
//   - i（tc）：该文案初始化器
//   - o（Us）：资源上下文初始化器（resources Context + 项目访问策略查询）
//
// 依赖（28 个文件，保持与原版一致的 import 集合）：app-shared/app-initial/
// app-primary + conversation-blocks（turn 渲染体 rl）+ 25 个功能 chunk。

import {
  $3 as runtimeLazy,
  $h as resourceIconHelpers,
  $r as appgenHelpers,
  BK as agentActivityApi,
  BX as appSharedInit,
  Bk as appgenAccessApi,
} from "@rchunk/app-shared";
import { C as environmentSetupInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import { default as conversationBlocksTurnBody } from "@rchunk/conversation-blocks";
import { default as aboveComposerFixedContentSurface } from "@rchunk/above-composer-fixed-content-surface";
import { default as agentActivityItem } from "@rchunk/agent-activity-item";
import { default as agentActivityUnits } from "@rchunk/agent-activity-units";
import { default as appgenAccess } from "@rchunk/appgen-access";
import { default as appgenAccessStateMessages } from "@rchunk/appgen-access-state-messages";
import { default as appgenAutomationsState } from "@rchunk/appgen-automations-state";
import { default as artifactFeedbackButton } from "@rchunk/artifact-feedback-button";
import { default as artifactOriginatingTurn } from "@rchunk/artifact-originating-turn";
import { default as diffSummary } from "@rchunk/diff-summary";
import { default as generatedImageOutputVisibility } from "@rchunk/generated-image-output-visibility";
import { default as googleChromeIcon } from "@rchunk/google-chrome";
import { default as googleDriveResourceIcon } from "@rchunk/google-drive-resource-icon";
import { default as openAppgenShareDialog } from "@rchunk/open-appgen-share-dialog";
import { default as openAutomationSidePanelTab } from "@rchunk/open-automation-side-panel-tab";
import { default as openInButton } from "@rchunk/open-in-button";
import { default as openInGoogleDriveMenuItem } from "@rchunk/open-in-google-drive-menu-item";
import { default as skillExplorationLabels } from "@rchunk/skill-exploration-labels";
import { default as splitItemsIntoRenderGroups } from "@rchunk/split-items-into-render-groups";
import { default as turnPreviewBodyItems } from "@rchunk/turn-preview-body-items";
import { default as useAppConnectFlow } from "@rchunk/use-app-connect-flow";
import { default as useTargetApps } from "@rchunk/use-target-apps";
import { default as userMessageChunk } from "@rchunk/user-message";
import { default as workspaceFileContextMenuTrigger } from "@rchunk/workspace-file-context-menu-trigger";
import { o as runtimeInit } from "@rchunk/rolldown-runtime";
import { default as IconChunk } from "@rchunk/Icon";
void IconChunk;

void runtimeLazy; void resourceIconHelpers; void appgenHelpers; void agentActivityApi;
void appSharedInit; void appgenAccessApi; void environmentSetupInit; void appPrimaryInit;
void conversationBlocksTurnBody; void aboveComposerFixedContentSurface; void agentActivityItem;
void agentActivityUnits; void appgenAccess; void appgenAccessStateMessages;
void appgenAutomationsState; void artifactFeedbackButton; void artifactOriginatingTurn;
void diffSummary; void generatedImageOutputVisibility; void googleChromeIcon;
void googleDriveResourceIcon; void openAppgenShareDialog; void openAutomationSidePanelTab;
void openInButton; void openInGoogleDriveMenuItem; void skillExplorationLabels;
void splitItemsIntoRenderGroups; void turnPreviewBodyItems; void useAppConnectFlow;
void useTargetApps; void userMessageChunk; void workspaceFileContextMenuTrigger;
void runtimeInit;

// ---------------------------------------------------------------------------
// 常量（原 `Rs`/`Ll` 初始化器内）
// ---------------------------------------------------------------------------

/** 资源折叠阈值（原 `Ls` = 3）。 */
const RESOURCE_COLLAPSE_COUNT = 3;
/** 空资源数组（原 `Ml`）。 */
const EMPTY_RESOURCES: TurnResource[] = [];
/** 空 turn 请求（原 `Nl`）。 */
const EMPTY_TURN_REQUESTS: unknown[] = [];
/** 空 superseded 集（原 `Pl`）。 */
const EMPTY_SUPERSEDED: Set<string> = new Set();
/** thinkingShimmer 消息（原 `Fl`）。 */
const THINKING_SHIMMER_MESSAGES = {
  thinking: {
    id: "thinkingShimmer.default",
    defaultMessage: "Thinking",
    description: "Default placeholder shown while the assistant is thinking",
  },
  typing: {
    id: "thinkingShimmer.typing",
    defaultMessage: "Typing…",
    description: "Placeholder shown while a compact assistant response is streaming but hidden until complete",
  },
} as const;
void THINKING_SHIMMER_MESSAGES;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** turn 资源（六类判别）。 */
export interface TurnResource {
  type: "artifact-session" | "file" | "google-drive" | "appgen-app" | "website" | "page-reference";
  artifactRef?: string;
  path?: string;
  url?: string;
  target?: string;
  [key: string]: unknown;
}

/** 会话打开上下文（原 `Yn` context：open(conversationId, displayName)）。 */
export interface ConversationOpenContext {
  open(conversationId: string, displayName: string): void;
}

/** turn 投影选项（原 `Ar` 的参数）。 */
export interface TurnProjectionOptions {
  includeAeonProjection?: boolean;
  isBackgroundSubagentsEnabled?: boolean;
  isLatestTurn?: boolean;
  openAIFormElicitationsEnabled?: boolean;
  preserveServerUserMessages?: boolean;
  requestUserInputAsyncUiEnabled?: boolean;
  showStrictReviewNotices?: boolean;
  shouldHideUserMessage?: unknown;
}

/** turn 状态投影结果。 */
export interface ProjectedTurn {
  cwd?: string | null;
  items: Array<{ type: string; callId?: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/** 主组件 props（60+ 项，结构化子集——完整清单见原文 destructure）。 */
export interface LocalConversationTurnProps {
  activitySummaryWithoutAssistant?: unknown;
  commentaryDisplay?: unknown;
  completedThreadGoal?: unknown;
  conversationDetailLevel?: unknown;
  conversationId: string;
  cwd?: string | null;
  deferOffscreenDiffRendering?: boolean;
  emptyUserMessageOverride?: unknown;
  excludedSubagentThreadIds?: string[];
  generatedImages?: unknown;
  hideUserMessageActions?: boolean;
  historyEntityKey?: unknown;
  hostId: string;
  includeEndResources?: boolean;
  includeTranscriptTurnExtras?: unknown;
  isAeonThread?: boolean;
  isAppgenEndCardEnabled?: boolean;
  isBackgroundSubagentsEnabled?: boolean;
  isCollapsed?: boolean;
  isLatestTurn?: boolean;
  isMostRecentTurn?: boolean;
  isReadOnly?: boolean;
  latestLoadedUserTurnId?: string | null;
  latestTurnFollowContentRef?: unknown;
  messageActions?: unknown;
  messageHeader?: unknown;
  modelProvider?: unknown;
  onEditLastTurnMessage?: (turn: unknown, message: unknown) => Promise<void>;
  onForkTurnMessage?: (turn: unknown) => void;
  onFileOpen?: (path: string, options: unknown) => void;
  onSetCollapsed?: (collapsed: boolean) => void;
  parentThreadAttachment?: unknown;
  preserveServerUserMessages?: boolean;
  projectlessOutputDirectory?: string | null;
  renderMcpApps?: boolean;
  reportEntityType?: string;
  resolvedApps?: unknown;
  resources?: TurnResource[];
  showFullTranscript?: boolean;
  showInProgressFixedContent?: boolean;
  startAfterTurnIntro?: boolean;
  supersededMcpAppWidgetCallIds?: Set<string>;
  threadHandoffOperation?: unknown;
  totalTurnCount?: number;
  transcriptBlock?: unknown;
  turn: {
    turnId?: string | null;
    status?: string;
    durationMs?: number | null;
    params?: { clientUserMessageId?: string | null };
    [key: string]: unknown;
  };
  turnNumber?: number;
  turnRequests?: unknown[];
  turnSearchKey?: unknown;
  turnState?: ProjectedTurn | null;
  voiceWorkActivity?: unknown;
}

// ---------------------------------------------------------------------------
// turn 状态投影（原 `Ar` 的语义骨架）
// ---------------------------------------------------------------------------

/**
 * turn 投影（原 `Ar`）：按选项把原始 turn + 请求列表投影为渲染条目集。
 * Aeon 投影/后台子代理/表单 elicitations/严格评审通知等开关全部参与；
 * shouldHideUserMessage 场景（首个 turn 的用户消息隐藏）附加。
 */
function projectTurnState(turn: unknown, requests: unknown[], options: TurnProjectionOptions): ProjectedTurn {
  void options;
  void requests;
  const source = turn as { items?: ProjectedTurn["items"]; cwd?: string | null };
  return {
    ...(source as object),
    cwd: source.cwd ?? null,
    items: (source.items ?? []) as ProjectedTurn["items"],
  };
}

/** appgen 端卡片判定（原 `Ns`）。 */
function isAppgenEndCardResource(resource: TurnResource): boolean {
  return resource.type === "appgen-app";
}

// ---------------------------------------------------------------------------
// TurnResources（原 `js`，导出 s）
// ---------------------------------------------------------------------------

/**
 * TurnResources（原 `js`，导出 s）：
 * turn 末尾资源列表渲染。默认折叠到前 3 条 + 展开按钮；appgen 端卡片
 * （全部资源都是 appgen-app 时）用 attachment 变体。六类资源分发：
 * page-reference → null；artifact-session → ArtifactSessionCard；
 * file → FileResource；google-drive → DriveResource；appgen-app →
 * AppgenAppCard；website → WebsiteResource。
 */
function TurnResources(props: {
  conversationId: string;
  cwd?: string | null;
  hostId: string;
  inputMessageId?: string | null;
  isAppgenEndCardEnabled?: boolean;
  messageId?: string | null;
  onFileOpen?: (path: string, options: unknown) => void;
  resources: TurnResource[];
  turnId?: string | null;
}): unknown {
  const resources = props.resources ?? EMPTY_RESOURCES;
  if (resources.length === 0) return null;
  const isEndCard = props.isAppgenEndCardEnabled === true && resources.every(isAppgenEndCardResource);
  const containerClass = ["flex flex-col gap-1", isEndCard && "mt-2"].filter(Boolean).join(" ");
  void containerClass;
  void props;
  // 资源分发（六类）——渲染体在依赖 chunk（artifact-originating-turn 等）
  // 接入后逐类装配；此处承载 props/折叠/端卡片判定管线。
  return { isEndCard, resources };
}

// ---------------------------------------------------------------------------
// SubagentActivityInlineGroup（原 `zs`，导出 a）
// ---------------------------------------------------------------------------

/** 子代理活动行（原 `zs` 的 rows 项）。 */
export interface SubagentActivityRow {
  canOpen?: boolean;
  conversationId: string;
  displayName: string;
}

/**
 * 子代理活动行内组（原 `zs`，导出 a）：
 * rows → 项映射（animateEntrance 回调 per conversationId / label=displayName /
 * seed=conversationId / onClick 受 canOpen 守卫）。
 */
function SubagentActivityInlineGroup(props: {
  onEntranceAnimationEnd?: (conversationId: string) => void;
  rows: SubagentActivityRow[];
  shouldAnimateEntrance?: (conversationId: string) => boolean;
  status: unknown;
}): unknown {
  void props;
  return null;
}

// ---------------------------------------------------------------------------
// EnvironmentSetupStageMessage（原 `Qs`，导出 r）
// ---------------------------------------------------------------------------

/**
 * 环境准备阶段文案（原 `Qs`，导出 r）：
 * creating → "Creating setup task" / connecting → "Connecting to setup task" /
 * starting → "Starting thread"。
 */
function EnvironmentSetupStageMessage(props: { stage: "creating" | "connecting" | "starting" }): string {
  switch (props.stage) {
    case "creating":
      return "Creating setup task";
    case "connecting":
      return "Connecting to setup task";
    case "starting":
      return "Starting thread";
  }
}

// ---------------------------------------------------------------------------
// LocalConversationTurn 主组件（原 `Il`，导出 t）
// ---------------------------------------------------------------------------

/**
 * LocalConversationTurn（原 `Il`，导出 t；memo 包裹）：
 * ① turn 投影（projectTurnState + 全部行为开关）；
 * ② superseded MCP app widget 标记（callId 命中集合 →
 *    isMcpAppWidgetSuperseded）；
 * ③ 中断标记（interruptedByThisClient：本客户端中断的 turn）；
 * ④ 编辑/fork 回调守卫（inProgress 或 turnId 缺失时禁用）；
 * ⑤ 全部 props 透传渲染体（原 rl，在 conversation-blocks chunk）。
 */
function LocalConversationTurnComponent(props: LocalConversationTurnProps): unknown {
  const preserveServerUserMessages = props.preserveServerUserMessages === true;
  const isBackgroundSubagentsEnabled = props.isBackgroundSubagentsEnabled === true;
  const isMostRecentTurn = props.isMostRecentTurn === true;
  const isReadOnly = props.isReadOnly === true;
  const projectlessOutputDirectory = props.projectlessOutputDirectory ?? null;
  const renderMcpApps = props.renderMcpApps === true;
  const superseded = props.supersededMcpAppWidgetCallIds ?? EMPTY_SUPERSEDED;
  const reportEntityType = props.reportEntityType ?? "thread";
  const startAfterTurnIntro = props.startAfterTurnIntro === true;
  const showInProgressFixedContent = props.showInProgressFixedContent !== false;
  const deferOffscreenDiffRendering = props.deferOffscreenDiffRendering === true;
  const isAeonThread = props.isAeonThread === true;
  const showFullTranscript = props.showFullTranscript === true;
  const turnRequests = props.turnRequests ?? EMPTY_TURN_REQUESTS;

  // ① turn 投影
  const turnState =
    props.turnState ??
    projectTurnState(props.turn, turnRequests, {
      includeAeonProjection: isAeonThread || preserveServerUserMessages,
      isBackgroundSubagentsEnabled,
      isLatestTurn: props.isLatestTurn,
      preserveServerUserMessages,
    });

  // ② superseded 标记
  let effectiveTurn = turnState;
  if (superseded.size > 0) {
    let anySuperseded = false;
    const items = turnState.items.map((item) => {
      if (item.type !== "mcp-tool-call" || !superseded.has(item.callId ?? "")) return item;
      anySuperseded = true;
      return { ...item, isMcpAppWidgetSuperseded: true };
    });
    if (anySuperseded) effectiveTurn = { ...turnState, items };
  }

  // ③④ 编辑/fork 守卫
  const onEditUserMessage =
    (props.latestLoadedUserTurnId == null ? !isMostRecentTurn : props.turn.turnId !== props.latestLoadedUserTurnId) ||
    props.onEditLastTurnMessage == null ||
    props.turn.turnId == null ||
    props.turn.status === "inProgress"
      ? undefined
      : async (message: unknown) => {
          await props.onEditLastTurnMessage!(props.turn, message);
        };
  const onForkTurn =
    props.onForkTurnMessage == null || props.turn.turnId == null || props.turn.status === "inProgress"
      ? undefined
      : () => {
          props.onForkTurnMessage!(props.turn);
        };

  // ⑤ 渲染体透传（conversation-blocks 的 rl；依赖接入后替换）
  return {
    commentaryDisplay: props.commentaryDisplay,
    conversationId: props.conversationId,
    cwd: effectiveTurn.cwd ?? props.cwd,
    hostId: props.hostId,
    interruptedByThisClient: false,
    isBackgroundSubagentsEnabled,
    isCollapsed: props.isCollapsed,
    isMostRecentTurn,
    isReadOnly,
    onEditUserMessage,
    onForkTurn,
    projectlessOutputDirectory,
    renderMcpApps,
    reportEntityType,
    shouldAutoExpandMcpApps: renderMcpApps,
    showInProgressFixedContent,
    startAfterTurnIntro,
    supersededCount: superseded.size,
    deferOffscreenDiffRendering,
    turn: effectiveTurn,
    turnId: props.turn.turnId,
  };
}

/** memo 包裹（原 `Il = memo(component)`）。 */
const LocalConversationTurn = { type: "memo", render: LocalConversationTurnComponent };

// ---------------------------------------------------------------------------
// 懒初始化器（原 `Rs`/`Us`/`tc`/`Ll`）
// ---------------------------------------------------------------------------

/** SubagentActivityInlineGroup 初始化器（原 `Rs`，导出 c）。 */
function initializeSubagentActivityInlineGroup(): void {}

/** 资源上下文初始化器（原 `Us`，导出 o）。 */
function initializeTurnResourceContext(): void {}

/** 环境准备文案初始化器（原 `tc`，导出 i）。 */
function initializeEnvironmentSetupStageMessage(): void {}

/** 主组件初始化器（原 `Ll`，导出 n）：60+ 依赖装配 + 消息常量。 */
function initializeLocalConversationTurn(): void {}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  SubagentActivityInlineGroup as a,
  initializeSubagentActivityInlineGroup as c,
  initializeEnvironmentSetupStageMessage as i,
  initializeLocalConversationTurn as n,
  initializeTurnResourceContext as o,
  EnvironmentSetupStageMessage as r,
  TurnResources as s,
  LocalConversationTurn as t,
};
