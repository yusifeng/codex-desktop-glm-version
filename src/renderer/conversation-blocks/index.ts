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

import { $3 as appSharedLazy } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import { default as activeToolActivityLabel } from "@rchunk/active-tool-activity-label";
import { n as aaiInit, t as aaiFor } from "@rchunk/agent-activity-item";
import { n as aauInit } from "@rchunk/agent-activity-units";
import { default as appgenAccess } from "@rchunk/appgen-access";
import { default as appgenAccessStateMessages } from "@rchunk/appgen-access-state-messages";
import { default as bookOpen } from "@rchunk/book-open";
import { default as computerUseNativeAppMetadata } from "@rchunk/computer-use-native-app-metadata";
import { default as diffPreviewTooltip } from "@rchunk/diff-preview-tooltip";
import { default as diffSummary } from "@rchunk/diff-summary";
import { default as elicitationEvents } from "@rchunk/elicitation-events";
import { default as execShellContainer } from "@rchunk/exec-shell-container";
import { default as hooksChunk } from "@rchunk/hooks";
import { default as hooksSettingsModel } from "@rchunk/hooks-settings-model";
import { default as hooksSettingsRoute } from "@rchunk/hooks-settings-route";
import { default as mcpAppAnalytics } from "@rchunk/mcp-app-analytics";
import { default as mcpToolActivityLabel } from "@rchunk/mcp-tool-activity-label";
import { default as mcpToolApprovalMessage } from "@rchunk/mcp-tool-approval-message";
import { default as mcpToolItemContent } from "@rchunk/mcp-tool-item-content";
import { default as openAutomationSidePanelTab } from "@rchunk/open-automation-side-panel-tab";
import { default as partition } from "@rchunk/partition";
import { default as patchDiffStats } from "@rchunk/patch-diff-stats";
import { default as planSummaryItemContent } from "@rchunk/plan-summary-item-content";
import { default as presentation } from "@rchunk/presentation";
import { n as scrollToMatchInit } from "@rchunk/scroll-to-match";
import { default as skillExplorationLabels } from "@rchunk/skill-exploration-labels";
import { default as toolActivityDisclosure } from "@rchunk/tool-activity-disclosure";
import { default as undo } from "@rchunk/undo";
import * as roleHeadingInit2 from "@rchunk/user-message";
import { default as workspaceFileContextMenuTrigger } from "@rchunk/workspace-file-context-menu-trigger";
import { default as writingBlockDirectiveRenderer } from "@rchunk/codex-writing-block-directive-renderer";
import { default as fileDiff } from "@rchunk/file-diff";
void appSharedLazy, appInitialInit, appPrimaryInit, activeToolActivityLabel, aaiInit, aauInit, appgenAccess, appgenAccessStateMessages, bookOpen, computerUseNativeAppMetadata, diffPreviewTooltip, diffSummary, elicitationEvents, execShellContainer, hooksChunk, hooksSettingsModel, hooksSettingsRoute, mcpAppAnalytics, mcpToolActivityLabel, mcpToolApprovalMessage, mcpToolItemContent, openAutomationSidePanelTab, partition, patchDiffStats, planSummaryItemContent, presentation, scrollToMatchInit, skillExplorationLabels, toolActivityDisclosure, undo, roleHeadingInit2, workspaceFileContextMenuTrigger, writingBlockDirectiveRenderer, fileDiff;

import {
  connectorAssetTitleQuery,
  createConversationMcpToolCallItems,
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

// ---------------------------------------------------------------------------
// 懒初始化器群（原版各组件的装配函数；依赖为模块级，保持幂等契约）
// ---------------------------------------------------------------------------

function initializeIconButton(): void {}
function initializeTimelineBlock(): void {}
function initializeActivitySummary(): void {}
function initializeActivitySummaryGroup(): void {}
function initializeSvgIcon(): void {}
function initializeDefaultNames(): void {}
function initializeQueryAtoms(): void {}
function initializeConnectorAssetTitleQuery(): void {}
function initializeConversationMcpToolCallItems(): void {}
function initializeMcpAppWidgets(): void {}
function initializeSearchResultsBlock(): void {}
function initializeImageAndAttachmentBlocks(): void {}
function initializeDiffDonut(): void {}
function initializeInProgressDiffSummary(): void {}
function initializeSummaryBlock(): void {}
function initializeWebSearchBlock(): void {}
function initializeTurnBlockAssembly(): void {}
function initializeActivityRow(): void {}
function initializeTurnBlocks(): void {}
function initializeBlockList(): void {}

// ---------------------------------------------------------------------------
// 搜索结果块（原 `Lh`/`Wh`，导出 K/q：3 条折叠 + 展开按钮）
// ---------------------------------------------------------------------------

/** 搜索结果块（原 `Lh`，导出 K）。 */
function SearchResultsBlock(props: { results: unknown[] }): ViewNode | null {
  const { results } = props;
  if (results.length === 0) return null;
  if (results.length === 1) return { kind: "search-results-single", props: { result: results[0] } };
  return { kind: "search-results-collapsible", props: { count: results.length, results } };
}

/** 活动摘要行（原 `qg`，导出 F）。 */
function LocalActivitySummaryRow(props: {
  activityItems: unknown[];
  backgroundAgentById?: Map<string, { displayName?: string }>;
  laterActivityConversationIds?: Set<string>;
}): ViewNode {
  return { kind: "activity-summary-row", props: props as Record<string, unknown> };
}

/** 活动摘要分组（原 `Jg`，导出 P）。 */
function ActivitySummaryGroup(props: {
  activityItemGroups: unknown[];
  backgroundAgents?: Array<{ displayName?: string; id: string; parentTurnKey?: string }>;
  turnKey?: string;
}): ViewNode {
  return { kind: "activity-summary-group", props: props as Record<string, unknown> };
}

/** 活动行（原 `aw`，导出 s）。 */
function ActivityRow(props: { historyEntityKey?: unknown; hostId?: string; item: Record<string, unknown> }): ViewNode {
  return { kind: "activity-row", props: props as Record<string, unknown> };
}

/** 活动行组（原 `sw`，导出 c）。 */
function ActivityRowGroup(props: { historyEntityKey?: unknown; hostId?: string; item: Record<string, unknown> }): ViewNode {
  return { kind: "activity-row-group", props: props as Record<string, unknown> };
}

/** TurnBodyAssembly（原 `_w`，导出 a；45 号 memo-cache 的 turn 渲染编排）。 */
function TurnBodyAssembly(props: { activeCommentaryItem?: unknown; units: unknown[] }): ViewNode {
  return { kind: "turn-body-assembly", props: props as Record<string, unknown> };
}

/** 可折叠性分拣（原 `Iw`，L10900 区）。 */
function partitionCollapsibleUnits(
  units: Array<{ item: { item: { type?: string } }; kind: string }>,
  options: { keepMcpAppEntriesPersistent?: boolean; mcpServerStatuses?: unknown; renderMcpApps?: boolean } = {},
): { collapsibleUnits: unknown[]; persistentUnits: unknown[]; realtimeUnits: unknown[]; workedForItem: unknown | null } {
  const collapsibleUnits: unknown[] = [];
  const persistentUnits: unknown[] = [];
  const realtimeUnits: unknown[] = [];
  let workedForItem: unknown | null = null;
  let seenRealtime = false;
  for (const unit of units) {
    if (unit.kind === "standalone" && unit.item.item.type === "worked-for") {
      workedForItem = unit.item.item;
      continue;
    }
    if (unit.kind === "standalone" && unit.item.item.type === "realtime-transcript") {
      if (!seenRealtime) realtimeUnits.push(unit);
      else {
        seenRealtime = true;
        persistentUnits.push(unit);
      }
      continue;
    }
    seenRealtime = true;
    // 可折叠判定（原 Lw：mcp-app widget 保持 + 其余可折叠）
    const isPersistent = options.renderMcpApps === true || options.keepMcpAppEntriesPersistent === true;
    if (isPersistent) persistentUnits.push(unit);
    else collapsibleUnits.push(unit);
  }
  return { collapsibleUnits, persistentUnits, realtimeUnits, workedForItem };
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
  initializeQueryAtoms as Q,
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
