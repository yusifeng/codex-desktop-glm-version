import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
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
  diffMode: DiffMode;
  expanded: boolean;
  hideWhitespace: boolean;
  loadFullFilesEnabled: boolean;
  richPreviewEnabled: boolean;
  wordDiffsEnabled: boolean;
  wrap: boolean;
  onSelectDiffMode(mode: DiffMode): void;
  onToggleExpanded(): void;
  onToggleHideWhitespace(): void;
  onToggleLoadFullFiles(): void;
  onToggleRichPreview(): void;
  onToggleWordDiffs(): void;
  onToggleWrap(): void;
}
export interface ReviewOptionsProps {
  copyGitApplyCommandDisabled?: boolean;
  diffControls: DiffControls;
  refreshGitQueriesDisabled?: boolean;
  showCopyGitApplyCommand?: boolean;
  showHideWhitespace?: boolean;
  showLoadFullFiles?: boolean;
  showRefreshGitQueries?: boolean;
  onClickCopyGitApplyCommand?(): void;
  onRefreshGitQueries?(): void;
}
export interface ReviewScrollerProps {
  bottomInset?: "actions" | "composer" | null;
  children(width: number): unknown;
  className?: string;
  disableScrollAnchoring?: boolean;
  isFileTreeOpen?: boolean;
  [key: string]: unknown;
}
export interface ReviewFile extends Record<string, unknown> {
  additions?: number;
  comments?: unknown[];
  deletions?: number;
  diff?: unknown;
  generated?: boolean;
  metadata?: { additionLines?: unknown; name?: string; [key: string]: unknown };
  name?: string;
  patch?: unknown;
  path?: string;
  status?: string;
}
export interface PullRequestDiffProps extends Record<string, unknown> {
  diff: ReviewFile;
  expanded?: boolean;
  mode?: DiffMode;
  wrap?: boolean;
}
interface ReviewRequest extends Record<string, unknown> {
  changes?: ReviewFile[];
  diff?: { files?: ReviewFile[]; headRevision?: string | null; status?: string; [key: string]: unknown };
  error?: unknown;
  files?: ReviewFile[];
  headRevision?: string | null;
  isLoading?: boolean;
  status?: string;
}
interface ReviewSlots {
  content: unknown;
  headerRows: Array<{ content: unknown; id: string }>;
}
export interface PullRequestReviewProps {
  baseBranch?: string | null;
  headBranch?: string | null;
  headRevision?: string | null;
  isRefreshing?: boolean;
  onCopyGitApplyCommand?(): void;
  onRefresh?(): Promise<unknown> | unknown;
  onRequestChanges?(comments: unknown[]): void;
  renderFile?(file: ReviewFile, controls: DiffControls): unknown;
  renderSlots?: ((slots: ReviewSlots) => unknown) | { content?: unknown };
  request: ReviewRequest | null;
  sourceControl?: unknown;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
function initializeReviewScroller(): void {
  React ??= getReactRuntime();
  jsx ??= getJsxRuntime();
}
function initializeDiffRenderer(): void {
  initializeReviewScroller();
}
function initializeReviewToolbar(): void {
  initializeReviewScroller();
}
function initializePullRequestReview(): void {
  initializeReviewScroller();
  initializeDiffRenderer();
  initializeReviewToolbar();
}

function ReviewScroller(props: ReviewScrollerProps): unknown {
  const runtime = ensureJsx();
  const width = typeof props["containerWidth"] === "number" ? props["containerWidth"] : 0;
  const bottomClass = props.bottomInset === "actions" ? "pb-16" : props.bottomInset === "composer" ? "pb-composer" : "pb-3";
  return runtime.jsx("div", {
    className: `relative flex h-full min-w-0 flex-1 ${props.className ?? ""}`,
    children: runtime.jsx("div", {
      className: `flex h-full min-w-0 flex-1 flex-col overflow-y-auto ${bottomClass}`,
      style: props.disableScrollAnchoring ? { overflowAnchor: "none" } : undefined,
      children: props.children(width),
    }),
  });
}

function ReviewOptions(props: ReviewOptionsProps): unknown {
  const runtime = ensureJsx();
  const controls = props.diffControls;
  return runtime.jsxs("div", {
    className: "flex items-center gap-1.5",
    children: [
      props.showRefreshGitQueries
        ? runtime.jsx("button", { type: "button", disabled: props.refreshGitQueriesDisabled || props.onRefreshGitQueries == null, onClick: props.onRefreshGitQueries, children: "Refresh" })
        : null,
      runtime.jsx("button", { type: "button", onClick: controls.onToggleWrap, children: controls.wrap ? "Disable word wrap" : "Enable word wrap" }),
      runtime.jsx("button", { type: "button", onClick: controls.onToggleExpanded, children: controls.expanded ? "Collapse all diffs" : "Expand all diffs" }),
      runtime.jsx("button", { type: "button", onClick: () => controls.onSelectDiffMode(controls.diffMode === "unified" ? "right" : "unified"), children: `Diff mode: ${controls.diffMode}` }),
      props.showHideWhitespace === false
        ? null
        : runtime.jsx("button", { type: "button", onClick: controls.onToggleHideWhitespace, children: controls.hideWhitespace ? "Show whitespace" : "Hide whitespace" }),
      props.showLoadFullFiles === false
        ? null
        : runtime.jsx("button", { type: "button", onClick: controls.onToggleLoadFullFiles, children: controls.loadFullFilesEnabled ? "Use patch only" : "Load full files" }),
      props.showCopyGitApplyCommand
        ? runtime.jsx("button", { type: "button", disabled: props.copyGitApplyCommandDisabled, onClick: props.onClickCopyGitApplyCommand, children: "Copy git apply command" })
        : null,
    ],
  });
}

function filePath(file: ReviewFile, index = 0): string {
  const value = file.path ?? file.name ?? file.metadata?.name;
  return typeof value === "string" && value.length > 0 ? value.replaceAll("\\", "/") : `Changed file ${index + 1}`;
}
function diffText(file: ReviewFile): string {
  const value = file.diff ?? file.patch ?? file.content ?? "";
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
function PullRequestDiff({ diff, expanded = true, mode = "unified", wrap = false, ...rest }: PullRequestDiffProps): unknown {
  const path = filePath(diff);
  const content = diffText(diff);
  const runtime = ensureJsx();
  return runtime.jsxs("article", {
    ...rest,
    className: "pull-request-diff",
    "data-diff-mode": mode,
    "data-hunk-separators": diff.metadata?.additionLines ? "line-info" : "metadata",
    "data-path": path,
    children: [
      runtime.jsxs("header", { children: [runtime.jsx("strong", { children: path }), diff.status == null ? null : ` ${diff.status}`, diff.generated ? " Generated" : ""] }),
      expanded
        ? runtime.jsx("pre", { style: { whiteSpace: wrap ? "pre-wrap" : "pre" }, children: content.length > 0 ? content : "No patch content available" })
        : null,
    ],
  });
}

function requestFiles(request: ReviewRequest | null): ReviewFile[] {
  if (request == null) return [];
  if (Array.isArray(request.files)) return request.files;
  if (Array.isArray(request.changes)) return request.changes;
  if (Array.isArray(request.diff?.files)) return request.diff.files;
  return [];
}
function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  if (typeof error === "string" && error.trim().length > 0) return error;
  return "Pull request changes are unavailable";
}
function applySlots(renderSlots: PullRequestReviewProps["renderSlots"], slots: ReviewSlots): unknown {
  if (typeof renderSlots === "function") return renderSlots(slots);
  return slots.content;
}

function PullRequestCodeReview(props: PullRequestReviewProps): unknown {
  initializePullRequestReview();
  const runtime = ensureJsx();
  const request = props.request;
  const files = requestFiles(request);
  const [diffMode, setDiffMode] = React.useState<DiffMode>("unified");
  const [expanded, setExpanded] = React.useState(true);
  const [hideWhitespace, setHideWhitespace] = React.useState(false);
  const [loadFullFilesEnabled, setLoadFullFilesEnabled] = React.useState(false);
  const [richPreviewEnabled, setRichPreviewEnabled] = React.useState(true);
  const [wordDiffsEnabled, setWordDiffsEnabled] = React.useState(true);
  const [wrap, setWrap] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [refreshError, setRefreshError] = React.useState<string | null>(null);
  const controls: DiffControls = {
    diffMode,
    expanded,
    hideWhitespace,
    loadFullFilesEnabled,
    richPreviewEnabled,
    wordDiffsEnabled,
    wrap,
    onSelectDiffMode: setDiffMode,
    onToggleExpanded: () => setExpanded((value) => !value),
    onToggleHideWhitespace: () => setHideWhitespace((value) => !value),
    onToggleLoadFullFiles: () => setLoadFullFilesEnabled((value) => !value),
    onToggleRichPreview: () => setRichPreviewEnabled((value) => !value),
    onToggleWordDiffs: () => setWordDiffsEnabled((value) => !value),
    onToggleWrap: () => setWrap((value) => !value),
  };
  const refresh = async (): Promise<void> => {
    if (refreshing || props.isRefreshing || props.onRefresh == null) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      await props.onRefresh();
    } catch (error) {
      setRefreshError(errorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };
  const toolbar = runtime.jsx(ReviewOptions, {
    diffControls: controls,
    onClickCopyGitApplyCommand: props.onCopyGitApplyCommand,
    onRefreshGitQueries: props.onRefresh == null ? undefined : () => { void refresh(); },
    refreshGitQueriesDisabled: refreshing || props.isRefreshing,
    showCopyGitApplyCommand: props.onCopyGitApplyCommand != null,
    showRefreshGitQueries: props.onRefresh != null,
  });
  const headerRows = [
    props.sourceControl == null ? null : { id: "review-pull-request-source", content: props.sourceControl },
    { id: "review-pull-request-toolbar", content: toolbar },
  ].filter((row): row is { id: string; content: unknown } => row != null);
  const shell = (content: unknown): unknown => applySlots(props.renderSlots, { content, headerRows });
  if (request == null)
    return shell(runtime.jsx("section", { className: "pull-request-code-review", role: "alert", children: "Pull request review unavailable" }));
  if (request.isLoading === true || request.status === "loading")
    return shell(runtime.jsx("div", { className: "pull-request-code-review", role: "status", children: "Loading pull request changes…" }));
  const requestError = request.error ?? refreshError;
  if (requestError != null || request.status === "error")
    return shell(runtime.jsxs("div", { className: "pull-request-code-review", role: "alert", children: [errorMessage(requestError), props.onRefresh == null ? null : runtime.jsx("button", { type: "button", disabled: refreshing, onClick: () => { void refresh(); }, children: "Try again" })] }));
  const loadedRevision = request.headRevision ?? request.diff?.headRevision;
  if (props.headRevision != null && loadedRevision != null && props.headRevision !== loadedRevision)
    return shell(runtime.jsxs("div", { className: "pull-request-code-review", role: "alert", children: ["The pull request changed while its diff was loading.", props.onRefresh == null ? null : runtime.jsx("button", { type: "button", onClick: () => { void refresh(); }, children: "Try again" })] }));
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filtered = files.filter((file, index) => filePath(file, index).toLocaleLowerCase().includes(normalizedSearch));
  const activePath = filtered.some((file, index) => filePath(file, index) === selectedPath) ? selectedPath : filtered.length === 1 ? filePath(filtered[0]) : null;
  const visible = activePath == null ? filtered : filtered.filter((file, index) => filePath(file, index) === activePath);
  const legacyContent = typeof props.renderSlots === "object" ? props.renderSlots.content : undefined;
  const content = files.length === 0 && legacyContent !== undefined
    ? legacyContent
    : files.length === 0
      ? runtime.jsx("p", { children: "No changed files" })
      : runtime.jsxs("div", {
          className: "pull-request-code-review-layout",
          children: [
            runtime.jsxs("aside", {
              children: [
                runtime.jsx("input", { "aria-label": "Filter files", value: search, onChange: (event: { currentTarget: { value: string } }) => setSearch(event.currentTarget.value) }),
                filtered.length === 0
                  ? runtime.jsx("p", { children: "No matching files" })
                  : runtime.jsx("ul", { children: filtered.map((file, index) => { const path = filePath(file, index); return runtime.jsx("li", { children: runtime.jsxs("button", { type: "button", "aria-current": path === activePath ? "true" : undefined, onClick: () => setSelectedPath(path === activePath ? null : path), children: [path, file.comments?.length ? ` (${file.comments.length})` : ""] }) }, path); }) }),
              ],
            }),
            runtime.jsx(ReviewScroller, {
              bottomInset: "actions",
              disableScrollAnchoring: true,
              isFileTreeOpen: true,
              children: () => runtime.jsx("div", { children: visible.map((file, index) => props.renderFile?.(file, controls) ?? runtime.jsx(PullRequestDiff, { diff: file, expanded, mode: diffMode, wrap }, filePath(file, index))) }),
            }),
          ],
        });
  return shell(runtime.jsxs("section", {
    className: "pull-request-code-review",
    "data-base-branch": props.baseBranch,
    "data-head-branch": props.headBranch,
    "data-hide-whitespace": hideWhitespace,
    "data-load-full-files": loadFullFilesEnabled,
    "data-rich-preview": richPreviewEnabled,
    "data-word-diffs": wordDiffsEnabled,
    children: [runtime.jsxs("div", { className: "pull-request-code-review-heading", children: [props.headBranch ?? "Pull request", props.baseBranch == null ? null : ` into ${props.baseBranch}`] }), toolbar, content],
  }));
}

function ensureJsx(): JsxRuntime {
  if (jsx == null) initializeReviewScroller();
  return jsx;
}

export {
  ReviewOptions as a,
  initializeReviewScroller as c,
  initializeDiffRenderer as i,
  initializePullRequestReview as n,
  initializeReviewToolbar as o,
  PullRequestDiff as r,
  ReviewScroller as s,
  PullRequestCodeReview as t,
};
