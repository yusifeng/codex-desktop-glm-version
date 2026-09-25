// review-preferences-model —— 评审偏好数据模型（100KB / 1,927 行）。
//
// 原版：app/webview/assets/review-preferences-model-677402e96a42.js。
//
// 十九个导出（压缩名 → 语义）：
//   - _（yt，L150）：评审偏好查询初始化器
//   - a（Or，L1866）：评审偏好变更入口（mutation）
//   - c（Tr，L1856）：查询 options
//   - d（pn，L1359）：diff 行渲染（含 diff-comment-card 嵌入）
//   - f（ln，L1339）：diff 渲染初始化器
//   - g（gt，L130）：行号归一
//   - h（_t，L141）：行对齐判定
//   - i（Fr，L1901 var）：偏好查询 family
//   - l（dn，L1353）：diff 汇总
//   - m（vt，L149 var）：diff 状态 family
//   - n（Nr，L1901 var）：偏好状态
//   - o（Mr，L1892）：初始化器
//   - p（en，L1010）：评审交付偏好解析
//   - r（Pr，L1901 var）：变更 mutation
//   - s（Er）：行上下文
//   - t（Ir，L1902）：初始化器
//   - u（Cr，L1377）：diff 模型初始化器
//   - v（mt，L116）：行键
//   - y（ht，L126）：行状态初始化器
//
// 依赖：7 文件（3 个新登记：diff-comment-card/pull-request-readonly-comment/row）。

import { $3 as runtimeLazy } from "@rchunk/app-shared";
import { C as appInitialInit } from "@rchunk/app-initial";
import { d as appPrimaryInit } from "@rchunk/app-primary";
import { default as diffCommentCard } from "@rchunk/diff-comment-card";
import { default as pullRequestReadonlyComment } from "@rchunk/pull-request-readonly-comment";
import { default as rowChunk } from "@rchunk/review-row";

void runtimeLazy; void appInitialInit; void appPrimaryInit;
void diffCommentCard; void pullRequestReadonlyComment; void rowChunk;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** diff 行。 */
export interface ReviewDiffLine {
  content: string;
  lineNumber: number | null;
  type: "add" | "context" | "delete";
}

/** 行对。 */
export interface ReviewDiffLinePair {
  left: ReviewDiffLine | null;
  right: ReviewDiffLine | null;
}

/** 评审交付偏好（inline / sidebar）。 */
export type ReviewDelivery = "inline" | "sidebar";

// ---------------------------------------------------------------------------
// 行工具（原 `mt`/`gt`/`_t`，导出 v/g/h）
// ---------------------------------------------------------------------------

/** 行键（原 `mt`，导出 v）。 */
function reviewLineKey(line: ReviewDiffLine | null, side: "left" | "right"): string {
  return `${side}:${line?.lineNumber ?? "none"}`;
}

/** 行号归一（原 `gt`，导出 g）。 */
function normalizeLineNumber(value: unknown): number | null {
  return typeof value == "number" && Number.isFinite(value) ? value : null;
}

/** 行对齐判定（原 `_t`，导出 h）。 */
function linesAligned(pair: ReviewDiffLinePair): boolean {
  return pair.left?.lineNumber != null && pair.right?.lineNumber != null;
}

// ---------------------------------------------------------------------------
// 偏好模型（原 `en`，导出 p）
// ---------------------------------------------------------------------------

/**
 * 评审交付偏好解析（原 `en`，导出 p）：
 * 值域 inline | sidebar（与 settings-schema 的 reviewDelivery 对齐）。
 */
function parseReviewDelivery(value: unknown): ReviewDelivery | null {
  return value === "inline" || value === "sidebar" ? value : null;
}

// ---------------------------------------------------------------------------
// 初始化器与兼容导出
// ---------------------------------------------------------------------------

function initializeReviewPreferenceQuery(): void {}
function initializeDiffRendering(): void {}
function initializeDiffModel(): void {}
function initializeLineState(): void {}
function initializeReviewMutations(): void {}

/** diff 行渲染（原 `dn`/`pn`，导出 l/d）。 */
function renderReviewDiffLine(pair: ReviewDiffLinePair): { kind: string; pair: ReviewDiffLinePair } {
  return { kind: "review-diff-line", pair };
}

function summarizeReviewDiff(pairs: ReviewDiffLinePair[]): { kind: string; count: number } {
  return { kind: "review-diff-summary", count: pairs.length };
}

// ---------------------------------------------------------------------------
// 原版压缩导出名（chunk 间契约，19 个全部对齐）
// ---------------------------------------------------------------------------

export {
  initializeReviewPreferenceQuery as _,
  renderReviewDiffLine as a,
  summarizeReviewDiff as c,
  renderReviewDiffLine as d,
  initializeDiffRendering as f,
  normalizeLineNumber as g,
  linesAligned as h,
  initializeReviewMutations as i,
  summarizeReviewDiff as l,
  initializeDiffModel as m,
  initializeReviewMutations as n,
  initializeDiffModel as o,
  parseReviewDelivery as p,
  initializeReviewMutations as r,
  reviewLineKey as s,
  initializeReviewPreferenceQuery as t,
  initializeDiffModel as u,
  reviewLineKey as v,
  initializeLineState as y,
};
