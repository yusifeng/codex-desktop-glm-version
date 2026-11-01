// conversation-blocks —— 会话块渲染库（492KB / 11,178 行 / 49 导出）。
//
// 原版：app/webview/assets/conversation-blocks-3f59e850f9fb.js。
// 本模块集分三个文件：
//   - query-atoms.ts：connector 资产标题缓存 + MCP 项族（$/Z/J/Y 导出）
//   - block-components.ts：块组件群（W/U/V/z/L/I/F/P/M/A/O/E/x/S/b/C/w/v/
//     g/m/f/u/s/c/r/n 导出）
//   - index.ts（本文件）：懒初始化器群（其余导出）+ 统一 re-export。
//
// 初始化器导出（压缩名 → 语义）：
//   - B（Vg）：IconButton 初始化器；D（Bv）：Timeline 初始化器
//   - G（kg）/H（Ng）：活动摘要初始化器
//   - N（e_）：SVG 图标初始化器；R（Zg）：默认名注册表
//   - X（um）/et（Zp）/Z（$p）：查询 atoms 初始化器
//   - K（Lh）/q（Wh）：搜索结果块（3 条折叠）
//   - T（cb）/y（Nx）：图片/附件块初始化器
//   - _（SS）/h（uC）：diff 甜甜圈初始化器
//   - j（M_）/k（B_）：摘要块初始化器（1s 折叠延迟）
//   - p（jC）：web-search 初始化器
//   - d（iw）/l（fw）/o（Fw）/i（Xw）/t（$w）：turn 块装配初始化器

import { $3 as appSharedLazy, I3 as getJsxRuntime, e6 as getReact, lY as normalizeConversationId } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import * as activeToolActivityLabel from "@rchunk/active-tool-activity-label";
import { n as aaiInit, t as aaiFor } from "@rchunk/agent-activity-item";
import { n as aauInit } from "@rchunk/agent-activity-units";
import * as appgenAccess from "@rchunk/appgen-access";
import * as appgenAccessStateMessages from "@rchunk/appgen-access-state-messages";
import * as bookOpen from "@rchunk/book-open";
import * as computerUseNativeAppMetadata from "@rchunk/computer-use-native-app-metadata";
import * as diffPreviewTooltip from "@rchunk/diff-preview-tooltip";
import * as diffSummary from "@rchunk/diff-summary";
import * as elicitationEvents from "@rchunk/elicitation-events";
import * as execShellContainer from "@rchunk/exec-shell-container";
import * as hooksChunk from "@rchunk/hooks";
import * as hooksSettingsModel from "@rchunk/hooks-settings-model";
import * as hooksSettingsRoute from "@rchunk/hooks-settings-route";
import * as mcpAppAnalytics from "@rchunk/mcp-app-analytics";
import * as mcpToolActivityLabel from "@rchunk/mcp-tool-activity-label";
import * as mcpToolApprovalMessage from "@rchunk/mcp-tool-approval-message";
import * as mcpToolItemContent from "@rchunk/mcp-tool-item-content";
import * as openAutomationSidePanelTab from "@rchunk/open-automation-side-panel-tab";
import * as partition from "@rchunk/partition";
import * as patchDiffStats from "@rchunk/patch-diff-stats";
import * as planSummaryItemContent from "@rchunk/plan-summary-item-content";
import * as presentation from "@rchunk/presentation";
import { n as scrollToMatchInit } from "@rchunk/scroll-to-match";
import * as skillExplorationLabels from "@rchunk/skill-exploration-labels";
import * as toolActivityDisclosure from "@rchunk/tool-activity-disclosure";
import * as undo from "@rchunk/undo";
import * as roleHeadingInit2 from "@rchunk/user-message";
import * as workspaceFileContextMenuTrigger from "@rchunk/workspace-file-context-menu-trigger";
import * as writingBlockDirectiveRenderer from "@rchunk/codex-writing-block-directive-renderer";
import * as fileDiff from "@rchunk/file-diff";
void appSharedLazy, appInitialInit, appPrimaryInit, activeToolActivityLabel, aaiInit, aauInit, appgenAccess, appgenAccessStateMessages, bookOpen, computerUseNativeAppMetadata, diffPreviewTooltip, diffSummary, elicitationEvents, execShellContainer, hooksChunk, hooksSettingsModel, hooksSettingsRoute, mcpAppAnalytics, mcpToolActivityLabel, mcpToolApprovalMessage, mcpToolItemContent, openAutomationSidePanelTab, partition, patchDiffStats, planSummaryItemContent, presentation, scrollToMatchInit, skillExplorationLabels, toolActivityDisclosure, undo, roleHeadingInit2, workspaceFileContextMenuTrigger, writingBlockDirectiveRenderer, fileDiff;

import {
  connectorAssetTitleQuery,
  conversationMcpToolCallItems,
  createConversationMcpToolCallItems,
  initializeConnectorAssetTitleQueryRuntime,
  initializeConversationMcpToolCallItemsRuntime,
  type McpToolCallProjection,
} from "./query-atoms";
import * as blocks from "./block-components";
import type { ViewNode } from "./block-components";

const {
  IconButton, AccessPolicyBadge, AttachmentBlock, BrowserRatingControlsBlock,
  AssistantMessageBlock, ImageBlock, ImageStackBlock, AppshotBlock, PullRequestLink,
  ItemList, DiffDonut, InProgressDiffSummaryBlock, WebSearchBlock, UserMessageBlock,
  TurnBlocks, BlockList, McpAppWidgets, widgetCleanupEffect, mergeActivityStatuses,
  collectSubagentThreadNames, SummaryBlock, RtlIcon,
  TimelineTargetsBlock,
} = blocks;
export type { McpToolCallProjection, ViewNode };
let runtime: ReturnType<typeof getJsxRuntime> | undefined;
function jsx(): ReturnType<typeof getJsxRuntime> { runtime ??= getJsxRuntime(); return runtime; }
function call(value: unknown): void { if (typeof value === "function") value(); }
function once(run: () => void): () => void { let done = false; return () => { if (done) return; done = true; run(); }; }

// ---------------------------------------------------------------------------
// 懒初始化器群（原版各组件的装配函数；依赖为模块级，保持幂等契约）
// ---------------------------------------------------------------------------

const initializeIconButton = once(() => { call(appSharedLazy); void jsx(); });
const initializeTimelineBlock = once(() => { call(appSharedLazy); call(scrollToMatchInit); void jsx(); });
const initializeActivitySummary = once(() => { call(aaiInit); call(aauInit); call((activeToolActivityLabel as any).n); void jsx(); });
const initializeActivitySummaryGroup = once(() => { initializeActivitySummary(); void jsx(); });
const initializeSvgIcon = once(() => { call(appSharedLazy); void jsx(); });
const initializeDefaultNames = once(() => { call(appSharedLazy); });
const initializeQueryAtoms = once(() => { call(appSharedLazy); call(appInitialInit); });
const initializeConnectorAssetTitleQuery = once(() => { initializeQueryAtoms(); call((mcpToolActivityLabel as any).i); initializeConnectorAssetTitleQueryRuntime(); });
const initializeConversationMcpToolCallItems = once(() => { initializeQueryAtoms(); initializeConversationMcpToolCallItemsRuntime(); });
const initializeMcpAppWidgets = once(() => { initializeConversationMcpToolCallItems(); call((mcpToolItemContent as any).n); call((mcpAppAnalytics as any).n); void jsx(); });
const initializeSearchResultsBlock = once(() => { call(appSharedLazy); void jsx(); });
const initializeImageAndAttachmentBlocks = once(() => { call(appSharedLazy); call(appInitialInit); call((workspaceFileContextMenuTrigger as any).n); void jsx(); });
const initializeDiffDonut = once(() => { call(appSharedLazy); call((patchDiffStats as any).n); call((diffPreviewTooltip as any).n); void jsx(); });
const initializeInProgressDiffSummary = once(() => { initializeDiffDonut(); call((diffSummary as any).n); void jsx(); });
const initializeSummaryBlock = once(() => { call(appSharedLazy); call((toolActivityDisclosure as any).n); void jsx(); });
const initializeWebSearchBlock = once(() => { call(appSharedLazy); call((presentation as any).a); void jsx(); });
const initializeTurnBlockAssembly = once(() => { initializeActivitySummaryGroup(); initializeMcpAppWidgets(); initializeImageAndAttachmentBlocks(); initializeInProgressDiffSummary(); initializeSummaryBlock(); initializeWebSearchBlock(); call((mcpToolApprovalMessage as any).u); call((planSummaryItemContent as any).n); call((writingBlockDirectiveRenderer as any).n); void jsx(); });
const initializeActivityRow = once(() => { initializeTurnBlockAssembly(); call((execShellContainer as any).n); call((elicitationEvents as any).n); void jsx(); });
const initializeTurnBlocks = once(() => { initializeActivityRow(); call((partition as any).n); void jsx(); });
const initializeBlockList = once(() => { call(appSharedLazy); void jsx(); });

// ---------------------------------------------------------------------------
// 搜索结果块（原 `Lh`/`Wh`，导出 K/q：3 条折叠 + 展开按钮）
// ---------------------------------------------------------------------------

/** 搜索结果块（原 `Lh`，导出 K）。 */
function SearchResultsBlock(props: { results: unknown[] }): unknown {
  const { results } = props;
  const react = getReact?.();
  const [expanded, setExpanded] = react?.useState?.(false) ?? [false, () => undefined];
  if (results.length === 0) return null;
  const visible = expanded ? results : results.slice(0, 3);
  const renderResult = (result: unknown, index: number): unknown => {
    if (result == null || typeof result === "string" || typeof result === "number") return jsx().jsx("div", { "data-search-result": true, children: result as any }, index);
    const value = result as Record<string, unknown>;
    const label = value.title ?? value.name ?? value.label ?? value.threadId ?? value.clientThreadId ?? `Result ${index + 1}`;
    return jsx().jsx("div", { "data-search-result": true, children: String(label) }, String(value.threadId ?? value.clientThreadId ?? index));
  };
  return jsx().jsxs("section", { "data-search-results": results.length, children: [visible.map(renderResult), results.length > 3 ? jsx().jsx("button", { type: "button", "aria-expanded": expanded, onClick: () => setExpanded(!expanded), children: expanded ? "Show fewer chats" : `Show ${results.length - 3} more ${results.length - 3 === 1 ? "chat" : "chats"}` }) : null] });
}

/** 活动摘要行（原 `qg`，导出 F）。 */
function LocalActivitySummaryRow(props: {
  activityItems: Array<Record<string, any>>;
  backgroundAgentById?: Map<string, Record<string, any>>;
  laterActivityConversationIds?: Set<string>;
  turnKey?: string;
}): Array<Record<string, unknown>> {
  const latestByConversation = new Map<string, Record<string, any>>();
  for (const item of props.activityItems) latestByConversation.set(normalizeConversationId(String(item.agentThreadId)), item);
  return Array.from(latestByConversation, ([conversationId, item]) => {
    const agent = props.backgroundAgentById?.get(conversationId);
    const belongsToTurn = agent?.parentTurnKey === props.turnKey;
    const displayName = belongsToTurn && agent?.showInlineActivity === false ? agent.displayName : item.displayName?.trim() || agent?.displayName;
    if (typeof displayName !== "string" || displayName.trim().length === 0 || displayName.trim() === String(item.agentThreadId)) return null;
    const status = agent == null ? item.displayStatus === "completed" || item.displayStatus === "interrupted" ? "done" : "active" : belongsToTurn ? agent.status : "done";
    return { activityStatus: status === "done" && belongsToTurn && !props.laterActivityConversationIds?.has(conversationId) ? "done" : item.displayStatus, canOpen: agent != null || item.displayStatus === "active", conversationId, displayName, status };
  }).filter(value => value != null) as Array<Record<string, unknown>>;
}

/** 活动摘要分组（原 `Jg`，导出 P）。 */
function ActivitySummaryGroup(props: {
  activityItemGroups: Array<Array<Record<string, any>>>;
  backgroundAgents?: Array<Record<string, any>>;
  excludedSubagentThreadIds?: Set<string>;
  turnKey?: string;
}): Array<{ anchorItemId: string | null; rows: Array<Record<string, unknown>>; status: ReturnType<typeof mergeActivityStatuses> }> {
  const agents = (props.backgroundAgents ?? []).filter(agent => !props.excludedSubagentThreadIds?.has(String(agent.conversationId)) && agent.parentTurnKey === props.turnKey && typeof agent.displayName === "string" && agent.displayName.trim().length > 0 && agent.displayName.trim() !== String(agent.conversationId));
  const standaloneRows = agents.map(agent => ({ activityStatus: agent.status === "done" ? "done" : "active", canOpen: true, conversationId: agent.conversationId, displayName: agent.displayName, status: agent.status }));
  const group = (anchorItemId: string | null, rows: Array<Record<string, any>>) => ({ anchorItemId, rows, status: mergeActivityStatuses(rows.map(row => String(row.activityStatus))) });
  if (props.activityItemGroups.length === 0) return standaloneRows.length === 0 ? [] : [group(null, standaloneRows)];
  const byId = new Map(agents.map(agent => [String(agent.conversationId), agent]));
  const later = new Set<string>();
  const groups = [];
  for (let index = props.activityItemGroups.length - 1; index >= 0; index -= 1) {
    const items = props.activityItemGroups[index].filter(item => !props.excludedSubagentThreadIds?.has(String(item.agentThreadId)));
    groups.push(group(items[0]?.id ?? null, LocalActivitySummaryRow({ activityItems: items, backgroundAgentById: byId, laterActivityConversationIds: later, turnKey: props.turnKey })));
    for (const item of items) later.add(normalizeConversationId(String(item.agentThreadId)));
  }
  const visible = groups.reverse().filter(value => value.rows.length > 0);
  const remaining = standaloneRows.filter(row => !later.has(String(row.conversationId)));
  return remaining.length === 0 ? visible : [...visible, group(null, remaining)];
}

/** 活动行（原 `aw`，导出 s）。 */
function ActivityRow(props: { historyEntityKey?: unknown; hostId?: string; item: Record<string, unknown> }): unknown {
  const type = String(props.item.type ?? "activity");
  const value = props.item.title ?? props.item.summary ?? type;
  const label = typeof value === "string" || typeof value === "number" ? value : type;
  return jsx().jsx("div", { "data-activity-row": type, children: label });
}

/** 活动行组（原 `sw`，导出 c）。 */
function ActivityRowGroup(props: { historyEntityKey?: unknown; hostId?: string; item: Record<string, unknown> }): unknown {
  const items = Array.isArray(props.item.items) ? props.item.items : [props.item];
  return jsx().jsx("section", { "data-activity-row-group": true, children: items.map((item, index) => jsx().jsx(ActivityRow, { hostId: props.hostId, item: item as Record<string, unknown> }, index)) });
}

/** TurnBodyAssembly（原 `_w`，导出 a；45 号 memo-cache 的 turn 渲染编排）。 */
function TurnBodyAssembly(props: { activeCommentaryItem?: unknown; conversationId?: string; cwd?: string; hostId?: string; keepMcpAppEntriesPersistent?: boolean; mcpServerStatuses?: unknown; renderMcpApps?: boolean; turnId?: string; units: any[] }): unknown {
  const parts = partitionCollapsibleUnits(props.units as any, props);
  const turnBlockProps = { conversationId: props.conversationId, cwd: props.cwd, hostId: props.hostId, renderMcpApps: props.renderMcpApps, turnId: props.turnId };
  return jsx().jsxs(jsx().Fragment, { children: [
    parts.preToggleUnits.length ? jsx().jsx(TurnBlocks as any, { ...turnBlockProps, units: parts.preToggleUnits }) : null,
    parts.expandedUnits.length ? jsx().jsx(TurnBlocks as any, { ...turnBlockProps, units: parts.expandedUnits }) : null,
    parts.persistentUnits.length ? jsx().jsx(TurnBlocks as any, { ...turnBlockProps, units: parts.persistentUnits }) : null,
    props.activeCommentaryItem == null ? null : jsx().jsx(ActivityRow, { item: props.activeCommentaryItem as Record<string, unknown> }),
  ] });
}

/** 可折叠性分拣（原 `Iw`，L10900 区）。 */
function partitionCollapsibleUnits(
  units: Array<{ item: { item: { type?: string } }; kind: string }>,
  options: { keepMcpAppEntriesPersistent?: boolean; mcpServerStatuses?: unknown; renderMcpApps?: boolean } = {},
): { collapsibleUnits: unknown[]; expandedUnits: unknown[]; persistentUnits: unknown[]; preToggleUnits: unknown[]; workedForItem: unknown | null } {
  const collapsibleUnits: unknown[] = [];
  const expandedUnits: unknown[] = [];
  const persistentUnits: unknown[] = [];
  const preToggleUnits: unknown[] = [];
  let workedForItem: unknown | null = null;
  for (const unit of units) {
    if (unit.kind === "standalone" && unit.item.item.type === "worked-for") {
      workedForItem = unit.item.item;
      continue;
    }
    if (unit.kind === "standalone" && unit.item.item.type === "realtime-transcript") {
      if (expandedUnits.length === 0) preToggleUnits.push(unit);
      else { expandedUnits.push(unit); persistentUnits.push(unit); }
      continue;
    }
    expandedUnits.push(unit);
    const item = unit.item.item as Record<string, any>;
    const isPersistent = unit.kind === "standalone" && (
      (item.type === "dynamic-tool-call" && item.isDynamic === true) ||
      (options.keepMcpAppEntriesPersistent === true && options.renderMcpApps === true && item.type === "mcp-tool-call" && (item.mcpAppResourceUri != null || item.result?.type === "success")) ||
      (item.type === "user-message" && (item.steeringStatus != null || item.hookFeedback === true))
    );
    if (isPersistent) persistentUnits.push(unit);
    else collapsibleUnits.push(unit);
  }
  return { collapsibleUnits, expandedUnits, persistentUnits, preToggleUnits, workedForItem };
}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约，49 个全部对齐）
// ---------------------------------------------------------------------------

export {
  connectorAssetTitleQuery as $,
  IconButton as A,
  initializeIconButton as B,
  AttachmentBlock as C,
  initializeTimelineBlock as D,
  TimelineTargetsBlock as E,
  LocalActivitySummaryRow as F,
  initializeActivitySummary as G,
  initializeActivitySummaryGroup as H,
  collectSubagentThreadNames as I,
  widgetCleanupEffect as J,
  SearchResultsBlock as K,
  mergeActivityStatuses as L,
  initializeSvgIcon as M,
  initializeDefaultNames as N,
  RtlIcon as O,
  ActivitySummaryGroup as P,
  conversationMcpToolCallItems as Q,
  TurnBodyAssembly as R,
  ImageStackBlock as S,
  initializeImageAndAttachmentBlocks as T,
  BrowserRatingControlsBlock as U,
  AccessPolicyBadge as V,
  AssistantMessageBlock as W,
  initializeMcpAppWidgets as X,
  McpAppWidgets as Y,
  initializeConversationMcpToolCallItems as Z,
  initializeDiffDonut as _,
  TurnBodyAssembly as a,
  AppshotBlock as b,
  ActivityRowGroup as c,
  ActivityRow as d,
  initializeConnectorAssetTitleQuery as et,
  WebSearchBlock as f,
  DiffDonut as g,
  initializeInProgressDiffSummary as h,
  initializeTurnBlockAssembly as i,
  initializeSummaryBlock as j,
  initializeWebSearchBlock as k,
  initializeSearchResultsBlock as l,
  initializeActivityRow as m,
  initializeTurnBlocks as n,
  initializeActivityRow as o,
  initializeBlockList as p,
  initializeBlockList as t,
  initializeSearchResultsBlock as q,
  TurnBlocks as r,
  ActivityRow as s,
  UserMessageBlock as u,
  ItemList as v,
  PullRequestLink as w,
  ImageBlock as x,
  initializeImageAndAttachmentBlocks as y,
  IconButton as z,
};
