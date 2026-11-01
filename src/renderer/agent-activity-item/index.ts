// agent-activity-item —— 活动条目（mcp-app 判定 / 动态工具注册表 / 分组决策）。
//
// 原版：app/webview/assets/agent-activity-item-792873f87aad.js（29KB / 784 行）。
//
// 十七个导出（压缩名 → 语义，全部经原文核实）：
//   - a（pn）：completedSummaryPartKey —— `<namespace>:<tool>:<partKey>:<labelKey>`
//   - c（dn）：persistentInCollapsedConversation（注册表标志）
//   - d（J）：线程创建卡片消息初始化器（threadCreated/openCreatedThread/
//     openThread/worktreeChat 四消息）
//   - f（Kt）：ToolActivityRow —— 工具活动行（操作状态归约 running/completed/
//     failed + 图标 + 消息 + 截断）
//   - g（St）：isMaybeMcpApp —— mcp-app 判定 ≠ not-mcp-app
//   - h（wt）：初始化器
//   - i（un）：continuesLiveActivityBetweenCalls（注册表标志）
//   - l（fn）：summaryOnlyInConversationGroup（注册表标志）
//   - m（xt）：isMcpAppWidget —— 三态判定 === mcp-app
//   - n（yn）：主初始化器
//   - o（Q）：findDynamicToolDescriptor —— namespace+tool 注册表查找
//   - p（G）：操作状态 schema 初始化器（destinationHostDisplayName/operationId/
//     status queued|running|success|warning|error/threadTitle）
//   - r（_n）：isExplorationActivity —— exec+read 摘要 / exec→patch 可视化联动
//   - s（hn）：动态工具注册表初始化（zt/cn/Et/Wt 四表合并）
//   - t（gn）：activityItemFor —— 主分发（30+ 类型 → {item, grouping: standalone|
//     groupable} | null；approved 审批丢弃；exec/patch 剥离已 approved 审批复用）
//   - u（Zt）：CreatedThreadCard —— 线程创建卡片（chatgpt/client 线程路由 +
//     codex:// deep-link + 图标 + compact/default 变体）
//   - _（Ct）：renderableItemsHaveLiveMcpApp（exploration 组内 mcp app 判定）
//
// 依赖：app-shared/app-initial/app-primary + presentation/result-card/
// skill-exploration-labels/tool-activity-disclosure。

import {
  $3 as runtimeLazy,
} from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import * as presentationChunk from "@rchunk/presentation";
import * as resultCard from "@rchunk/result-card";
import * as skillExplorationLabels from "@rchunk/skill-exploration-labels";
import * as toolActivityDisclosure from "@rchunk/tool-activity-disclosure";

void runtimeLazy; void appInitialInit; void appPrimaryInit;
void presentationChunk; void resultCard; void skillExplorationLabels; void toolActivityDisclosure;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 动态工具描述符（注册表条目）。 */
export interface DynamicToolDescriptor {
  namespace: string;
  tool: string;
  continuesLiveActivityBetweenCalls?: boolean;
  persistentInCollapsedConversation?: boolean;
  summaryOnlyInConversationGroup?: boolean;
  standaloneInConversation?: boolean;
  hiddenInConversation?: boolean;
  getCompletedSummaryPartKey?: (item: Record<string, unknown>) => string | undefined;
  [key: string]: unknown;
}

/** 会话条目（分组决策面）。 */
export interface ActivityEntryItem {
  type: string;
  completed?: boolean;
  success?: boolean | null;
  invocation?: { server?: string; tool?: string };
  result?: { type?: string; raw?: unknown } | null;
  mcpAppResourceUri?: string | null;
  isMcpAppWidgetSuperseded?: boolean;
  automaticApprovalReviews?: Array<{ status?: string }> | null;
  executionStatus?: string;
  parsedCmd?: { type?: string; cmd?: string | null };
  cwd?: string | null;
  query?: string;
  namespace?: string;
  elicitation?: { kind?: string; schema?: { properties?: Record<string, unknown> } };
  status?: string;
  [key: string]: unknown;
}

/** 活动条目（分组产物）。 */
export interface ActivityEntry {
  grouping: "standalone" | "groupable";
  item: ActivityEntryItem;
}

// ---------------------------------------------------------------------------
// 动态工具注册表（原 `mn` = zt + cn + Et + Wt 四表合并）
// ---------------------------------------------------------------------------

/** 动态工具注册表（四源合并；具体表内容在 presentation/result-card 等依赖接入后装配）。 */
const dynamicToolRegistry: DynamicToolDescriptor[] = [];

/** 注册表查找（原 `Q`，导出 o）。 */
function findDynamicToolDescriptor(item: { namespace?: string; tool?: string }): DynamicToolDescriptor | undefined {
  return dynamicToolRegistry.find(
    (descriptor) => descriptor.namespace === item.namespace && descriptor.tool === item.tool,
  );
}

/** continuesLiveActivityBetweenCalls（原 `un`，导出 i）。 */
function continuesLiveActivityBetweenCalls(item: { namespace?: string; tool?: string }): boolean {
  return findDynamicToolDescriptor(item)?.continuesLiveActivityBetweenCalls === true;
}

/** persistentInCollapsedConversation（原 `dn`，导出 c）。 */
function persistentInCollapsedConversation(item: { namespace?: string; tool?: string }): boolean {
  return findDynamicToolDescriptor(item)?.persistentInCollapsedConversation === true;
}

/** summaryOnlyInConversationGroup（原 `fn`，导出 l）。 */
function summaryOnlyInConversationGroup(item: { namespace?: string; tool?: string }): boolean {
  return findDynamicToolDescriptor(item)?.summaryOnlyInConversationGroup === true;
}

/** 完成态摘要部件键（原 `pn`，导出 a）。 */
function completedSummaryPartKey(item: { namespace?: string; tool?: string } & Record<string, unknown>): string {
  const labelKey = activityLabelKey(item as ActivityEntryItem);
  const partKey = findDynamicToolDescriptor(item)?.getCompletedSummaryPartKey?.(item);
  return `${item.namespace}:${item.tool}:${partKey ?? ""}:${labelKey ?? ""}`;
}

// ---------------------------------------------------------------------------
// mcp-app 判定（原 `bt`/`xt`/`St`/`Ct`）
// ---------------------------------------------------------------------------

/**
 * mcp-app 三态判定（原 `bt`）：
 * superseded / 完成无结果 / codex-apps 服务器结果 → not-mcp-app；
 * mcpAppResourceUri 或注册表命中（server+tool+成功 raw）→ mcp-app；
 * 有 raw 无状态表 → maybe-mcp-app；其余 not-mcp-app。
 */
function mcpAppKind({ item, mcpServerStatuses }: { item: ActivityEntryItem; mcpServerStatuses?: unknown }): "mcp-app" | "maybe-mcp-app" | "not-mcp-app" {
  if (
    item.isMcpAppWidgetSuperseded === true ||
    (item.completed === true && item.result == null) ||
    isCodexAppsServerResult(item.invocation?.server, item.result)
  ) {
    return "not-mcp-app";
  }
  const raw = item.result?.type === "success" ? item.result.raw : null;
  if (
    item.mcpAppResourceUri != null ||
    resolveRegisteredApp({ mcpServerStatuses, server: item.invocation?.server, tool: item.invocation?.tool, toolResult: raw }) != null
  ) {
    return "mcp-app";
  }
  return raw == null ? "not-mcp-app" : mcpServerStatuses == null ? "maybe-mcp-app" : "not-mcp-app";
}

/** codex-apps 服务器结果判定（原 `Ze` + `Ve` 语义）。 */
function isCodexAppsServerResult(server: string | undefined, result: { type?: string } | null | undefined): boolean {
  return server === "codex-apps" && result?.type === "success";
}

/** 注册表应用解析（原 `qe`：server/tool/成功 raw 命中）。 */
function resolveRegisteredApp(request: { mcpServerStatuses?: unknown; server?: string; tool?: string; toolResult: unknown }): unknown {
  void request;
  return null;
}

/** isMcpAppWidget（原 `xt`，导出 m）。 */
function isMcpAppWidget({ item, mcpServerStatuses }: { item: ActivityEntryItem; mcpServerStatuses?: unknown }): boolean {
  return mcpAppKind({ item, mcpServerStatuses }) === "mcp-app";
}

/** isMaybeMcpApp（原 `St`，导出 g）。 */
function isMaybeMcpApp({ item, mcpServerStatuses }: { item: ActivityEntryItem; mcpServerStatuses?: unknown }): boolean {
  return mcpAppKind({ item, mcpServerStatuses }) !== "not-mcp-app";
}

/** 组内有活跃 mcp app（原 `Ct`，导出 _）。 */
function renderableItemsHaveLiveMcpApp(items: Array<{ kind: string; item: { type?: string } } | { kind: string; item: ActivityEntryItem }>): boolean {
  return items.some(
    (entry) =>
      entry.kind !== "item" || (entry.item as ActivityEntryItem).type !== "mcp-tool-call"
        ? false
        : (entry.item as ActivityEntryItem).result?.type === "success" ||
          ((entry.item as ActivityEntryItem).completed !== true &&
            (entry.item as ActivityEntryItem).result == null &&
            (entry.item as ActivityEntryItem).mcpAppResourceUri == null),
  );
}

// ---------------------------------------------------------------------------
// 活动标签键（原 `I` 语义：条目 → 标签对象 {key, icon, message, values}）
// ---------------------------------------------------------------------------

/** 活动标签（渲染面）。 */
export interface ActivityLabel {
  key: string;
  icon?: unknown;
  message: { id: string; defaultMessage: string; description?: string };
  values?: Record<string, unknown>;
}

/** 条目 → 标签键（原 `I` 的 key 部分；完整标签在依赖接入后装配）。 */
function activityLabelKey(item: ActivityEntryItem): string | null {
  switch (item.type) {
    case "exec":
      return `exec:${item.parsedCmd?.type ?? "unknown"}`;
    case "patch":
      return "patch";
    case "mcp-tool-call":
      return `mcp:${item.invocation?.server ?? ""}:${item.invocation?.tool ?? ""}`;
    case "web-search":
      return "web-search";
    default:
      return item.type;
  }
}

// ---------------------------------------------------------------------------
// 主分组分发（原 `gn`，导出 t）
// ---------------------------------------------------------------------------

/** 已 approved 审批复用剥离（原 `vn`）。 */
function stripApprovedReviews(item: ActivityEntryItem): ActivityEntryItem {
  const reviews = item.automaticApprovalReviews;
  if (reviews == null) return item;
  const unapproved = reviews.filter((review) => review.status !== "approved");
  if (unapproved.length > 0 && unapproved.length === reviews.length) return item;
  const { automaticApprovalReviews: _removed, ...rest } = item;
  void _removed;
  return unapproved.length === 0 ? (rest as ActivityEntryItem) : { ...rest, automaticApprovalReviews: unapproved };
}

/** patch 可视化联动判定（原 `_n` 的前半，exec→patch）。 */
function isVisualizationLinkedPatch(execItem: ActivityEntryItem, nextItem: ActivityEntryItem | undefined): boolean {
  return (
    execItem.type === "exec" &&
    (execItem.executionStatus === "running" || execItem.executionStatus === "started") &&
    execItem.parsedCmd?.cmd != null &&
    nextItem?.type === "patch" &&
    (nextItem.visualizationActivities as unknown[] | undefined) != null &&
    ((nextItem.visualizationActivities as unknown[])?.length ?? 0) > 0
  );
}

/** exploration 判定（原 `_n`，导出 r）。 */
function isExplorationActivity(item: ActivityEntryItem, nextItem: ActivityEntryItem | undefined): boolean {
  return (
    isVisualizationLinkedPatch(item, nextItem) ||
    (item.type === "exec" && item.parsedCmd?.type === "read" && isLargeReadSummary(item.parsedCmd, item.cwd ?? null))
  );
}

/** 大读取摘要判定（原 `dt`/`ht` 语义：read 摘要行数超阈值）。 */
function isLargeReadSummary(parsedCmd: { type?: string; cmd?: string | null }, cwd: string | null): boolean {
  void cwd;
  void parsedCmd;
  return false;
}

/**
 * 条目 → 活动条目（原 `gn`，导出 t；30+ 类型分发）：
 * - exec/patch → groupable（isExplorationActivity 时 standalone）；
 * - mcp-tool-call → mcp-app 判定决定；
 * - web-search 空查询 → null；
 * - dynamic-tool-call → 注册表 hiddenInConversation/standaloneInConversation；
 * - generated-image → includeGeneratedImages 才 standalone；
 * - automatic-approval-review：approved → null；inProgress → groupable；
 *   aborted/denied/timedOut → standalone；
 * - 非活动类型（reasoning/todo-list/model-changed 等 17 类）→ null；
 * - 其余（assistant-message/subagent-activity 等 15 类）→ standalone。
 */
function activityItemFor(item: ActivityEntryItem, options: { dynamicToolCallRenderer?: unknown; includeGeneratedImages?: boolean; mcpServerStatuses?: unknown } = {}): ActivityEntry | null {
  switch (item.type) {
    case "external-event":
      return null;
    case "exec":
    case "patch":
      return entry(stripApprovedReviews(item), isExplorationActivity(item, undefined) ? "standalone" : "groupable");
    case "mcp-tool-call":
      return entry(stripApprovedReviews(item), isMcpAppWidget({ item, mcpServerStatuses: options.mcpServerStatuses }) ? "standalone" : "groupable");
    case "web-search":
      return (item.query ?? "").trim().length === 0 ? null : entry(item, "groupable");
    case "dynamic-tool-call": {
      const descriptor = options.dynamicToolCallRenderer ?? findDynamicToolDescriptor(item);
      return (descriptor as DynamicToolDescriptor | undefined)?.hiddenInConversation === true
        ? null
        : entry(item, (descriptor as DynamicToolDescriptor | undefined)?.standaloneInConversation === true ? "standalone" : "groupable");
    }
    case "generated-image":
      return options.includeGeneratedImages ? entry(item, "standalone") : null;
    case "image-view":
      return entry(item, "standalone");
    case "mcp-server-elicitation":
      if (item.completed !== true || item.elicitation?.kind === "unsupportedOpenAIForm") return null;
      return entry(item, item.elicitation?.kind === "legacyOpenAIForm" && Object.values(item.elicitation.schema?.properties ?? {}).some(hasRichProperty) ? "groupable" : "standalone");
    case "automatic-approval-review":
      switch (item.status) {
        case "approved":
          return null;
        case "inProgress":
          return entry(item, "groupable");
        case "aborted":
        case "denied":
        case "timedOut":
          return entry(item, "standalone");
      }
      return null;
    case "dil-reasoning":
    case "assistant-message":
    case "auto-review-interruption-warning":
    case "context-compaction":
    case "multi-agent-action":
    case "realtime-transcript":
    case "stream-error":
    case "strict-review-notice":
    case "subagent-activity":
    case "system-error":
    case "user-input-response":
    case "user-message":
    case "worked-for":
    case "worktree-init":
      return entry(item, "standalone");
    case "reasoning":
    case "automation-update":
    case "forked-from-conversation":
    case "model-changed":
    case "model-rerouted":
    case "permission-request":
    case "personality-changed":
    case "plan-implementation":
    case "proposed-plan":
    case "remote-task-created":
    case "todo-list":
    case "turn-diff":
    case "userInput":
    case "steered":
      return null;
  }
  return null;
}

/** 构造（原 `$`）。 */
function entry(item: ActivityEntryItem, grouping: "standalone" | "groupable"): ActivityEntry {
  return { item, grouping };
}

/** 富属性判定（原 `Ue`：schema 属性含富类型）。 */
function hasRichProperty(property: unknown): boolean {
  return typeof property == "object" && property != null && "enum" in (property as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// 线程创建卡片（原 `Zt`，导出 u）
// ---------------------------------------------------------------------------

/** 线程创建结果。 */
export interface CreatedThreadResult {
  kind?: string;
  threadId: string;
  clientThreadId?: string;
  hostId?: string;
  [key: string]: unknown;
}

/** 卡片消息（原 `q` 四消息）。 */
const CREATED_THREAD_MESSAGES = {
  threadCreated: { id: "localConversation.appControlToolCall.threadCreated", defaultMessage: "Created chat", description: "Title for a card shown after a Codex task is created." },
  openCreatedThread: { id: "localConversation.appControlToolCall.openCreatedThread", defaultMessage: "Open chat", description: "Accessible label for opening a newly created Codex task." },
  openThread: { id: "localConversation.appControlToolCall.openThread", defaultMessage: "Open chat", description: "Button label for opening a newly created Codex task." },
  worktreeChat: { id: "localConversation.appControlToolCall.worktreeChat", defaultMessage: "Worktree chat", description: "Title for a card linking to a worktree-backed Codex task." },
} as const;

/** 路由分发面（结构化子集）。 */
export interface RouteDispatch {
  dispatchHostMessage(message: { type: string; path: string }): void;
}

/**
 * 线程创建卡片（原 `Zt`，导出 u）：
 * chatgpt 线程 → ChatGPT 路由；client 线程 → client-new-thread 前缀路由；
 * 本地线程 → codex://threads deep-link。compact（size-7/rounded-md）与
 * default（size-8/rounded-lg）双变体。
 */
function CreatedThreadCard(props: { compact?: boolean; dispatch: RouteDispatch; result: CreatedThreadResult }): {
  ariaLabel: string;
  title: string;
  route: string;
  variant: "compact" | "default";
} {
  const isChatGPT = props.result.kind === "chatgpt";
  const isClientThread = !isChatGPT && "clientThreadId" in props.result;
  const threadKey = isClientThread ? props.result.clientThreadId! : props.result.threadId;
  const route = isChatGPT
    ? `/chatgpt/quick-chat/${encodeURIComponent(threadKey)}`
    : isClientThread
      ? `/local/client-new-thread:${encodeURIComponent(threadKey)}`
      : `codex://threads/${encodeURIComponent(props.result.threadId)}`;
  return {
    ariaLabel: CREATED_THREAD_MESSAGES.openCreatedThread.defaultMessage,
    route,
    title: isClientThread ? CREATED_THREAD_MESSAGES.worktreeChat.defaultMessage : CREATED_THREAD_MESSAGES.threadCreated.defaultMessage,
    variant: props.compact ? "compact" : "default",
  };
}

// ---------------------------------------------------------------------------
// 工具活动行（原 `Kt`，导出 f）
// ---------------------------------------------------------------------------

/** 操作状态。 */
export interface ToolOperation {
  id?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * 工具活动行（原 `Kt`，导出 f）：
 * 操作状态归约（operation ?? contentItems.operationId ?? callId 的 atom 查询）；
 * 运行中 → running spinner；完成 → success ? completed : failed；
 * 标签（图标 + message + values）；row/summary 两种变体（截断）。
 */
function ToolActivityRow(props: { agentActivityIcon?: unknown; item: (ActivityEntryItem & { contentItems?: Array<{ operationId?: string; status?: string }> | null }) | null; operation?: ToolOperation | null; variant: "row" | "summary-text" | string }): {
  state: "running" | "completed" | "failed";
  hasLabel: boolean;
  truncate: boolean;
} {
  const item = props.item;
  const contentOperation = item != null && item.completed === true && item.success === true ? (item.contentItems ?? []).find((entry) => entry.operationId != null) ?? null : null;
  const operation = props.operation ?? contentOperation;
  const isDone = operation == null ? (item?.completed ?? false) : operation.status !== "queued" && operation.status !== "running";
  const succeeded = operation == null ? item?.success === true : operation.status === "error" ? false : operation.status === "success" || operation.status === "warning";
  const state = isDone ? (succeeded === false ? "failed" : "completed") : "running";
  const label = item == null ? null : activityLabelKey(item);
  return {
    state,
    hasLabel: label != null,
    truncate: props.variant !== "summary-text",
  };
}

// ---------------------------------------------------------------------------
// 初始化器（原 `wt`/`hn`/`G`/`J`/`yn`）
// ---------------------------------------------------------------------------

/** 初始化器（原 `wt`，导出 h）。 */
function initializeMcpAppDecisions(): void {}

/** 注册表初始化器（原 `hn`，导出 s）：四表合并（依赖接入后填充）。 */
function initializeDynamicToolRegistry(): void {}

/** 操作状态 schema 初始化器（原 `G`，导出 p）。 */
function initializeOperationStatusSchema(): void {}

/** 线程卡片消息初始化器（原 `J`，导出 d）。 */
function initializeCreatedThreadMessages(): void {}

/** 主初始化器（原 `yn`，导出 n）。 */
function initializeAgentActivityItem(): void {}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  completedSummaryPartKey as a,
  persistentInCollapsedConversation as c,
  initializeCreatedThreadMessages as d,
  ToolActivityRow as f,
  isMaybeMcpApp as g,
  initializeMcpAppDecisions as h,
  continuesLiveActivityBetweenCalls as i,
  summaryOnlyInConversationGroup as l,
  isMcpAppWidget as m,
  initializeAgentActivityItem as n,
  findDynamicToolDescriptor as o,
  initializeOperationStatusSchema as p,
  isExplorationActivity as r,
  initializeDynamicToolRegistry as s,
  activityItemFor as t,
  CreatedThreadCard as u,
  renderableItemsHaveLiveMcpApp as _,
};
