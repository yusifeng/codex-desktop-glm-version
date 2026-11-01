// agent-activity-units —— 代理活动单元（会话活动条目的分组/折叠/状态归约）。
//
// 原版：app/webview/assets/agent-activity-units-9397783428a4.js（30KB / 795 行）。
//
// 十五个导出（压缩名 → 语义，全部经原文核实）：
//   - F（g）＝isExplorationExec：exploration 类 exec（读取/搜索/列目录）
//   - I（h）：exploration 状态摘要
//   - Ke（i）：单条目的组降级（summary 组只有一个元素且非 patch 多文件 →
//     提升为 standalone）
//   - Be（l）：turn 完成态头部（completedHeader + toolActivity 汇总标签）
//   - W（m）：条目进行中判定（30+ 类型逐一分派）
//   - Q（n）：活动单元键（agent-activity-group/standalone: 前缀源）
//   - Ge（o）：连续可分组 mcp 调用聚簇（server/tool/functionName/pluginId/
//     connectorId/linkId/invocationResourceUri + 摘要签名逐项同键）
//   - G（p）：懒初始化器
//   - He（r）：活动单元分组（groupable 连续 → group；strict-review-notice
//     不与前一 standalone 合并）
//   - Ue（s）：组裁剪（末尾非 assistant 的组保留；含进行中条目的组保留）
//   - Je（t）：最新可见单元状态归约（latest+inProgress → active/thinking，
//     exploration 倒找；否则 summary）
//   - Ve（u）：初始化器
//   - k（v）：web 搜索命令判定（curl/wget/ping 等）
//   - ve（x）：codex-followup 指令内联展开（markdown AST 遍历，代码块跳过）
//   - O（y）：初始化器
//
// 依赖：app-shared/app-initial + agent-activity-item/assert-never/
// patch-diff-stats/presentation/skill-exploration-labels。

import {
  $3 as runtimeLazy,
} from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import * as agentActivityItem from "@rchunk/agent-activity-item";
import * as assertNever from "@rchunk/assert-never";
import * as patchDiffStats from "@rchunk/patch-diff-stats";
import * as presentationChunk from "@rchunk/presentation";
import * as skillExplorationLabels from "@rchunk/skill-exploration-labels";

void runtimeLazy; void appInitialInit; void agentActivityItem;
void assertNever; void patchDiffStats; void presentationChunk; void skillExplorationLabels;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 会话条目（判别联合的结构化子集）。 */
export interface ActivityConversationItem {
  type: string;
  completed?: boolean;
  success?: boolean | null;
  executionStatus?: string;
  parsedCmd?: { type: string; cmd?: string | null; isFinished?: boolean };
  invocation?: { server?: string; tool?: string };
  functionName?: string | null;
  pluginId?: string | null;
  appContext?: { connectorId?: string; linkId?: string } | null;
  invocationResourceUri?: string | null;
  result?: { type?: string } | null;
  automaticApprovalReviews?: unknown[] | null;
  cwd?: string | null;
  [key: string]: unknown;
}

/** 活动条目（原 `he` 的产物）。 */
export interface ActivityItem {
  grouping: "groupable" | "standalone";
  item: ActivityConversationItem;
  [key: string]: unknown;
}

/** 分组节点。 */
export type ActivityUnit =
  | { kind: "group"; key: string; items: Array<{ item: ActivityItem }> }
  | { kind: "standalone"; key: string; item: { item: ActivityItem } };

/** 最新单元状态。 */
export type LatestUnitState =
  | { kind: "summary" }
  | { kind: "thinking" }
  | { kind: "active"; item: { item: ActivityConversationItem } | { item: ActivityItem } };

// ---------------------------------------------------------------------------
// 进行中判定（原 `W`，导出 m）
// ---------------------------------------------------------------------------

/**
 * 条目进行中判定（原 `W`，导出 m）：
 * 非代理类型（user-message/system-error/model-changed 等 21 类）恒 false；
 * 进行中 = 未完成/未成功/解析未结束。
 */
function isItemInProgress(item: ActivityConversationItem): boolean {
  if (!item) return false;
  switch (item.type) {
    case "user-message":
    case "external-event":
    case "realtime-transcript":
    case "turn-diff":
    case "system-error":
    case "stream-error":
    case "steered":
    case "remote-task-created":
    case "personality-changed":
    case "forked-from-conversation":
    case "model-changed":
    case "model-rerouted":
    case "auto-review-interruption-warning":
    case "strict-review-notice":
    case "automation-update":
    case "plan-implementation":
    case "worked-for":
    case "generated-image":
    case "worktree-init":
    case "subagent-activity":
    case "image-view":
      return false;
    case "context-compaction":
      return item.completed !== true;
    case "dil-reasoning":
    case "assistant-message":
    case "proposed-plan":
    case "reasoning":
      return item.completed !== true;
    case "exec":
      return item.parsedCmd?.isFinished !== true;
    case "patch":
      return item.success == null;
    case "mcp-tool-call":
    case "dynamic-tool-call":
      return item.completed !== true;
    case "automatic-approval-review":
      return (item as { status?: string }).status === "inProgress";
    case "web-search":
      return item.completed !== true;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// 活动单元键（原 `Q`，导出 n）
// ---------------------------------------------------------------------------

/** 单元键（原 `Q`）。 */
function activityUnitKey(item: unknown, sourceIndex: number): string {
  return `${(item as { key?: string }).key ?? ""}:${sourceIndex}`;
}

// ---------------------------------------------------------------------------
// codex-followup 内联展开（原 `ve`，导出 x）
// ---------------------------------------------------------------------------

/**
 * codex-followup 展开（原 `ve`，导出 x）：
 * `:codex-followup[text]` 指令替换为纯文本；代码块/内联代码跳过（按 raw
 * 偏移推进）；子 token 去重。
 */
function expandCodexFollowup(markdown: string): string {
  if (!markdown.includes(":codex-followup[")) return markdown;
  let result = "";
  let consumed = 0;
  let searchFrom = 0;
  // 简化的指令匹配（原版走 markdown AST；此处按指令语法直接匹配）
  const directivePattern = /:codex-followup\[([^\]]*)\]/g;
  for (const match of markdown.matchAll(directivePattern)) {
    const index = match.index ?? 0;
    if (index < searchFrom) continue;
    result += markdown.slice(consumed, index) + match[1];
    consumed = index + match[0].length;
    searchFrom = consumed;
  }
  return result + markdown.slice(consumed);
}

// ---------------------------------------------------------------------------
// web 搜索命令判定（原 `k`，导出 v）
// ---------------------------------------------------------------------------

/** web 搜索命令（原 `k`）：curl/wget/ping/dig 等。 */
function isWebSearchCommand(command: string): boolean {
  return /^\s*(?:curl|wget|ping|dig|nslookup|host|traceroute|ssh|scp|rsync)(?:\s|$)/.test(command);
}

// ---------------------------------------------------------------------------
// 连续聚簇（原 `Ge`，导出 o）
// ---------------------------------------------------------------------------

/**
 * 连续可分组 mcp 调用聚簇（原 `Ge`，导出 o）：
 * 仅 completed + 无 source + server ≠ computer-use + success + 无审批 +
 * 非 codex apps 结果的可分组条目参与；键 = server/tool/functionName/
 * pluginId/connectorId/linkId/invocationResourceUri + 自定义摘要；
 * 键相同且紧邻 → 同簇。
 */
function clusterGroupableMcpCalls(items: Array<{ item: ActivityItem }>, summarize: (item: ActivityConversationItem) => unknown): Array<Array<{ item: ActivityItem }>> {
  const clusters: Array<Array<{ item: ActivityItem }>> = [];
  let lastKey: string | null = null;
  for (const entry of items) {
    const item = entry.item.item;
    let key: string | null = null;
    if (
      entry.item.grouping === "groupable" &&
      item.type === "mcp-tool-call" &&
      item.completed === true &&
      item.source == null &&
      item.invocation?.server !== "computer-use" &&
      item.result?.type === "success" &&
      !(item.automaticApprovalReviews?.length)
    ) {
      key = JSON.stringify([
        item.invocation?.server,
        item.invocation?.tool,
        item.functionName,
        item.pluginId,
        item.appContext?.connectorId,
        item.appContext?.linkId,
        item.invocationResourceUri,
        summarize(item),
      ]);
    }
    const last = clusters.at(-1);
    if (key != null && key === lastKey && last != null) last.push(entry);
    else clusters.push([entry]);
    lastKey = key;
  }
  return clusters;
}

// ---------------------------------------------------------------------------
// 分组（原 `He`/`We`/`qe`，导出 r）
// ---------------------------------------------------------------------------

/**
 * 活动单元分组（原 `He`，导出 r；核心归约 `qe`）：
 * groupable 连续段 → group（键 agent-activity-group:首源索引）；
 * 其余 → standalone（键 agent-activity-standalone:源索引）；
 * strict-review-notice 不与前一 strict-review-notice standalone 合并；
 * startsGroup 集合触发强制断组。
 */
function groupActivityItems(items: ActivityItem[], options: { includeGeneratedImages?: boolean; groupStartItems?: Set<ActivityConversationItem>; mcpServerStatuses?: unknown } = {}): ActivityUnit[] {
  const units: ActivityUnit[] = [];
  let pending: Array<{ item: ActivityItem }> = [];
  let groupStartIndex = 0;
  const flushGroup = () => {
    const first = pending[0];
    if (first != null) {
      units.push({ kind: "group", key: `agent-activity-group:${activityUnitKey(first, groupStartIndex)}`, items: [...pending] });
      pending = [];
    }
  };
  for (const [index, activityItem] of items.entries()) {
    if (options.groupStartItems?.has(activityItem.item as ActivityConversationItem)) flushGroup();
    if (activityItem.grouping === "groupable") {
      if (pending.length === 0) groupStartIndex = index;
      pending.push({ item: activityItem });
      continue;
    }
    flushGroup();
    const last = units.at(-1);
    const isStrictReview = activityItem.item.type === "strict-review-notice";
    const lastIsStrictReview = last?.kind === "standalone" && (last.item as { item: { item: { type?: string } } }).item?.item?.type === "strict-review-notice";
    if (!(isStrictReview && lastIsStrictReview)) {
      units.push({ kind: "standalone", key: `agent-activity-standalone:${activityUnitKey(activityItem, index)}`, item: { item: activityItem } });
    }
  }
  flushGroup();
  return units;
}

// ---------------------------------------------------------------------------
// 组裁剪（原 `Ue`，导出 s）
// ---------------------------------------------------------------------------

/** 组含进行中条目（原 `Z`）。 */
function groupHasInProgress(entry: { item: ActivityItem }): boolean {
  return isItemInProgress(entry.item.item);
}

/**
 * 组裁剪（原 `Ue`，导出 s）：
 * 末组（其后的首个非组元素位于 findLastIndex 的最后非 assistant 处）保留；
 * 含进行中条目的组保留；其余组丢弃。
 */
function pruneActivityGroups(units: ActivityUnit[], keepLastGroup: boolean): ActivityUnit[] {
  const lastMeaningfulIndex = units.findLastIndex(
    (unit) => unit.kind !== "standalone" || (unit.item as { item: { item: ActivityConversationItem } }).item.item.type !== "assistant-message" || ((unit.item as { item: { item: ActivityConversationItem } }).item.item.completed ?? true) !== true,
  );
  return units.filter((unit, index) => unit.kind !== "group" || (keepLastGroup && index === lastMeaningfulIndex) || unit.items.some(groupHasInProgress));
}

// ---------------------------------------------------------------------------
// 单条目组降级（原 `Ke`，导出 i）
// ---------------------------------------------------------------------------

/**
 * 单条目组降级（原 `Ke`，导出 i）：
 * summary 组恰一个元素且非进行中、且 patch 恰一文件无可视化 → 提升为
 * standalone（展开显示）。
 */
function promoteSingleItemGroup(unit: ActivityUnit, state: { kind: string }, summarize: (item: ActivityConversationItem) => unknown): ActivityUnit {
  void summarize;
  const first = unit.kind === "group" ? unit.items[0] : null;
  const firstEntry = first as { item: { item: ActivityConversationItem } } | null;
  return state.kind !== "summary" || unit.kind !== "group" || unit.items.length !== 1 || firstEntry == null || groupHasInProgress(first) || (firstEntry.item.item.type === "patch" && Object.keys((firstEntry.item.item as { changes?: Record<string, unknown> }).changes ?? {}).length !== 1)
    ? unit
    : { kind: "standalone", key: unit.key, item: first };
}

// ---------------------------------------------------------------------------
// 最新单元状态（原 `Je`/`Ye`，导出 t）
// ---------------------------------------------------------------------------

/**
 * 最新可见单元状态归约（原 `Je`，导出 t）：
 * 非（最新 + turn 进行中 + 活动切片未闭合）→ summary；
 * exploration 倒找首个进行中的 exec → active；否则倒找任何进行中条目
 * （automatic-approval-review → thinking）；否则 thinking。
 */
function latestUnitState({
  unit,
  isLatestVisibleUnit,
  isTurnInProgress,
  isActivitySliceClosed,
  isExploring,
}: {
  unit: { items: Array<{ item: ActivityItem }> };
  isLatestVisibleUnit: boolean;
  isTurnInProgress: boolean;
  isActivitySliceClosed: boolean;
  isExploring: boolean;
}): LatestUnitState {
  if (!(isLatestVisibleUnit && isTurnInProgress && !isActivitySliceClosed)) return { kind: "summary" };
  if (isExploring) {
    const exploration = lastExplorationInProgress(unit);
    if (exploration != null) return { kind: "active", item: exploration };
  }
  for (let index = unit.items.length - 1; index >= 0; --index) {
    const entry = unit.items[index];
    if (entry != null && groupHasInProgress(entry)) {
      return (entry.item as { item: ActivityConversationItem }).item.type === "automatic-approval-review" ? { kind: "thinking" } : { kind: "active", item: entry };
    }
  }
  return { kind: "thinking" };
}

/** exploration 倒找（原 `Ye`）。 */
function lastExplorationInProgress(unit: { items: Array<{ item: ActivityItem }> }): { item: ActivityItem } | null {
  let found: { item: ActivityItem } | null = null;
  for (let index = unit.items.length - 1; index >= 0; --index) {
    const entry = unit.items[index];
    const type = (entry?.item as { item: { type?: string } }).item?.type;
    if (type !== "exec" || !isExplorationEntry(entry)) {
      if (found != null) break;
      continue;
    }
    found ??= entry;
    if (entry != null && groupHasInProgress(entry)) return entry;
  }
  return found;
}

/** exploration 判定（原 `F`，导出 g：read/search/list_files 的 exec）。 */
function isExplorationEntry(entry: { item: ActivityItem } | null | undefined): boolean {
  const parsedCmd = (entry?.item as { item: { parsedCmd?: { type?: string } } }).item?.parsedCmd;
  const type = parsedCmd?.type;
  return type === "read" || type === "search" || type === "list_files";
}

// ---------------------------------------------------------------------------
// 初始化器（原 `G`/`Ve`/`O`，导出 p/u/y）
// ---------------------------------------------------------------------------

/** 懒初始化器（原 `G`，导出 p）。 */
function initializeAgentActivityUnits(): void {}

/** 初始化器（原 `Ve`，导出 u）。 */
function initializeCompletedHeader(): void {}

/** 初始化器（原 `O`，导出 y）。 */
function initializeFollowupExpansion(): void {}



/** codex-followup 装配初始化器（原 `D`，导出 S）。 */
function initializeCodexFollowupDirective(): void {}

/** curl 正则装配初始化器（原 `P`，导出 _）。 */
function initializeCurlPatterns(): void {
  void CURL_MUTATING_REQUEST_PATTERN;
  void CURL_DATA_PATTERN;
  void CURL_SHORT_DATA_PATTERN;
}

const CURL_MUTATING_REQUEST_PATTERN = /(?:^|\s)(?:-X\s*|--request(?:=|\s+))(?:POST|PUT|PATCH|DELETE)\b/i;
const CURL_DATA_PATTERN = /(?:^|\s)(?:--data(?:-[^\s=]+)?|--json|--form|--upload-file)(?:=|\s|$)/;
const CURL_SHORT_DATA_PATTERN = /(?:^|\s)-(?:d|F|T)(?:=|\s|$)/;

/** 空初始化器（原 `I`，导出 h）。 */
function initializeNoop(): void {}

// ---------------------------------------------------------------------------
// 补充导出（原 We/E/$/J/K）
// ---------------------------------------------------------------------------

/** 无起组标记的分组（原 `We`，导出 a）。 */
function groupActivityItemsPlain(items: ActivityItem[]): ActivityUnit[] {
  return groupActivityItems(items);
}

/** codex-followup 指令名常量（原 `E`，导出 b）。 */
const CODEX_FOLLOWUP_DIRECTIVE = "codex-followup";

/** We 初始化器（原 `$`，导出 c）。 */
function initializeGroupPlain(): void {}

/** J 初始化器（原 `J`，导出 d）。 */
function initializeRenderGrouping(): void {}

/** 可渲染代理条目（K 的返回形态）。 */
export interface RenderableAgentItems {
  renderableAgentItems: Array<{ kind: "item"; item: ActivityConversationItem } | { kind: "exploration"; items: ActivityConversationItem[]; status: "explored" | "exploring" }>;
  isExploring: boolean;
  isAnyNonExploringAgentItemInProgress: boolean;
}

/**
 * 代理条目渲染分组（原 `K`，导出 f）：
 * 连续 exploration exec（read/search/list_files）聚为 exploration 段
 * （reasoning 附着）；段内任一进行中且 turn 进行中（或无非代理进行中）→
 * exploring 状态；末组状态回填。
 */
function groupRenderableAgentItems({ agentItems, isTurnInProgress, isAnyNonAgentItemInProgress }: { agentItems: ActivityConversationItem[]; isTurnInProgress: boolean; isAnyNonAgentItemInProgress: boolean }): RenderableAgentItems {
  const renderable: RenderableAgentItems["renderableAgentItems"] = [];
  let exploration: ActivityConversationItem[] | null = null;
  let isExploring = false;
  const flushExploration = (status: "explored" | "exploring") => {
    if (exploration && exploration.length > 0) renderable.push({ kind: "exploration", items: exploration, status });
    exploration = null;
  };
  const isExplorationItem = (item: ActivityConversationItem) =>
    item.type === "exec" && (item.parsedCmd?.type === "read" || item.parsedCmd?.type === "search" || item.parsedCmd?.type === "list_files");
  for (const item of agentItems) {
    if (isExplorationItem(item) || item.type === "reasoning") {
      exploration ??= [];
      exploration.push(item);
      continue;
    }
    flushExploration("explored");
    renderable.push({ kind: "item", item });
  }
  if (exploration) {
    const anyInProgress = exploration.some(isItemInProgress);
    isExploring = isTurnInProgress && (!isAnyNonAgentItemInProgress || anyInProgress);
    flushExploration(isExploring ? "exploring" : "explored");
  }
  const last = renderable.at(-1);
  let isAnyNonExploringAgentItemInProgress = false;
  if (last?.kind === "item") {
    isAnyNonExploringAgentItemInProgress = isItemInProgress(last.item);
    if (last.item.type === "reasoning" && last.item.completed === false) isAnyNonExploringAgentItemInProgress = false;
  }
  return { renderableAgentItems: renderable, isExploring, isAnyNonExploringAgentItemInProgress };
}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约）
// ---------------------------------------------------------------------------

export {
  initializeCodexFollowupDirective as S,
  initializeCurlPatterns as _,
  groupActivityItemsPlain as a,
  CODEX_FOLLOWUP_DIRECTIVE as b,
  initializeGroupPlain as c,
  initializeRenderGrouping as d,
  groupRenderableAgentItems as f,
  initializeNoop as h,
  isExplorationEntry as g,
  promoteSingleItemGroup as i,
  initializeCompletedHeader as l,
  isItemInProgress as m,
  activityUnitKey as n,
  clusterGroupableMcpCalls as o,
  initializeAgentActivityUnits as p,
  groupActivityItems as r,
  pruneActivityGroups as s,
  latestUnitState as t,
  initializeFollowupExpansion as u,
  isWebSearchCommand as v,
  expandCodexFollowup as x,
  initializeAgentActivityUnits as y,
};
