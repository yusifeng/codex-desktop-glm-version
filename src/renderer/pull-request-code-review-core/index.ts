import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/codex-diff-css";
import "@rchunk/review-preferences-model";
import "@rchunk/pull-request-readonly-comment";
import "@rchunk/pull-request-revision-queries-core";
import "@rchunk/pull-request-code-review-navigation-core";
import "@rchunk/pull-request-comment";
import "@rchunk/pull-request-detail-model";
import "@rchunk/arrow-curved-right";
import "@rchunk/review-diff-virtualizer-metrics";
import "@rchunk/review-file-tree-pane";
import "@rchunk/text-shorter";
import "@rchunk/code-diff";
import "@rchunk/pull-request-error-description";
import "@rchunk/middle-truncated-text";

export type DiffMode = "left" | "right" | "split" | "unified";
export interface DiffControls {
  diffMode: DiffMode; expanded: boolean; hideWhitespace: boolean; loadFullFilesEnabled: boolean;
  richPreviewEnabled: boolean; wordDiffsEnabled: boolean; wrap: boolean;
  onSelectDiffMode(mode: DiffMode): void; onToggleExpanded(): void; onToggleHideWhitespace(): void;
  onToggleLoadFullFiles(): void; onToggleRichPreview(): void; onToggleWordDiffs(): void; onToggleWrap(): void;
}
export interface ReviewOptionsProps {
  copyGitApplyCommandDisabled?: boolean; diffControls: DiffControls; refreshGitQueriesDisabled?: boolean;
  showCopyGitApplyCommand?: boolean; showHideWhitespace?: boolean; showLoadFullFiles?: boolean; showRefreshGitQueries?: boolean;
  onClickCopyGitApplyCommand?(): void; onRefreshGitQueries?(): void;
}
export interface ReviewScrollerProps {
  bottomInset?: "actions" | "composer" | null; children(width: number): unknown; className?: string;
  disableScrollAnchoring?: boolean; isFileTreeOpen?: boolean; [key: string]: unknown;
}
export interface PullRequestDiffProps { diff: { metadata?: { additionLines?: unknown }; [key: string]: unknown }; [key: string]: unknown }
export interface PullRequestReviewProps {
  baseBranch?: string | null; headBranch?: string | null; headRevision?: string | null;
  isRefreshing?: boolean; onRefresh?(): void; onRequestChanges?(comments: unknown[]): void;
  renderSlots?: Record<string, unknown>; request: { account?: unknown; comparison?: unknown; pullRequest?: unknown; [key: string]: unknown };
  sourceControl?: unknown;
}

let jsx: JsxRuntime;
function initializeReviewScroller(): void { jsx = getJsxRuntime(); }
function initializeDiffRenderer(): void { jsx = getJsxRuntime(); }
function initializeReviewToolbar(): void { jsx = getJsxRuntime(); }
function initializePullRequestReview(): void { initializeReviewScroller(); initializeDiffRenderer(); initializeReviewToolbar(); }

function ReviewScroller(props: ReviewScrollerProps): unknown {
  const runtime = ensureJsx();
  const width = typeof props["containerWidth"] === "number" ? props["containerWidth"] : 0;
  const bottomClass = props.bottomInset === "actions" ? "pb-16" : props.bottomInset === "composer" ? "pb-composer" : "pb-3";
  return runtime.jsx("div", { className: `relative flex h-full min-w-0 flex-1 ${props.className ?? ""}`, children:
    runtime.jsx("div", { className: `flex h-full min-w-0 flex-1 flex-col overflow-y-auto ${bottomClass}`,
      style: props.disableScrollAnchoring ? { overflowAnchor: "none" } : undefined,
      children: props.children(width) }) });
}

function ReviewOptions(props: ReviewOptionsProps): unknown {
  const runtime = ensureJsx(); const controls = props.diffControls;
  return runtime.jsxs("div", { className: "flex items-center gap-1.5", children: [
    props.showRefreshGitQueries ? runtime.jsx("button", { type: "button", disabled: props.refreshGitQueriesDisabled || props.onRefreshGitQueries == null, onClick: props.onRefreshGitQueries, children: "Refresh" }) : null,
    runtime.jsx("button", { type: "button", onClick: controls.onToggleWrap, children: controls.wrap ? "Disable word wrap" : "Enable word wrap" }),
    runtime.jsx("button", { type: "button", onClick: controls.onToggleExpanded, children: controls.expanded ? "Collapse all diffs" : "Expand all diffs" }),
    runtime.jsx("button", { type: "button", onClick: () => controls.onSelectDiffMode(controls.diffMode === "unified" ? "right" : "unified"), children: `Diff mode: ${controls.diffMode}` }),
    props.showHideWhitespace === false ? null : runtime.jsx("button", { type: "button", onClick: controls.onToggleHideWhitespace, children: controls.hideWhitespace ? "Show whitespace" : "Hide whitespace" }),
    props.showLoadFullFiles === false ? null : runtime.jsx("button", { type: "button", onClick: controls.onToggleLoadFullFiles, children: controls.loadFullFilesEnabled ? "Use patch only" : "Load full files" }),
    props.showCopyGitApplyCommand ? runtime.jsx("button", { type: "button", disabled: props.copyGitApplyCommandDisabled, onClick: props.onClickCopyGitApplyCommand, children: "Copy git apply command" }) : null,
  ] });
}

function PullRequestDiff(props: PullRequestDiffProps): unknown {
  const { diff, ...rest } = props;
  return ensureJsx().jsx("div", { ...rest, className: "pull-request-diff", "data-hunk-separators": diff.metadata?.additionLines ? "line-info" : "metadata", children: diff });
}

function PullRequestCodeReview(props: PullRequestReviewProps): unknown {
  const runtime = ensureJsx();
  const controls = createDefaultDiffControls();
  const toolbar = runtime.jsx(ReviewOptions, { diffControls: controls, onRefreshGitQueries: props.onRefresh, refreshGitQueriesDisabled: props.isRefreshing, showRefreshGitQueries: props.onRefresh != null });
  const empty = props.request == null;
  return runtime.jsxs("section", { className: "pull-request-code-review", "data-base-branch": props.baseBranch, "data-head-branch": props.headBranch, children: [
    toolbar,
    empty ? runtime.jsx("p", { children: "Pull request review unavailable" }) : runtime.jsx(ReviewScroller, { bottomInset: "actions", children: () => runtime.jsx("div", { "data-review-request": true, children: props.renderSlots?.content ?? null }) }),
  ] });
}

function createDefaultDiffControls(): DiffControls {
  const noop = (): void => {};
  return { diffMode: "unified", expanded: true, hideWhitespace: false, loadFullFilesEnabled: false,
    richPreviewEnabled: true, wordDiffsEnabled: true, wrap: false, onSelectDiffMode: noop,
    onToggleExpanded: noop, onToggleHideWhitespace: noop, onToggleLoadFullFiles: noop,
    onToggleRichPreview: noop, onToggleWordDiffs: noop, onToggleWrap: noop };
}
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

export { ReviewOptions as a, initializeReviewScroller as c, initializeDiffRenderer as i, initializePullRequestReview as n, initializeReviewToolbar as o, PullRequestDiff as r, ReviewScroller as s, PullRequestCodeReview as t };
