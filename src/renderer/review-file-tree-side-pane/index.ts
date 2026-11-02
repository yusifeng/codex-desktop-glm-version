import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/filter-alt";
import "@rchunk/pull-request-actions";
import "@rchunk/pull-request-comment";
import "@rchunk/pull-request-detail-model";
import "@rchunk/pull-request-readonly-comment";
import * as reviewFileTreePane from "@rchunk/review-file-tree-pane";
import "@rchunk/review-preferences-model";
import * as conversationDiffComments from "@rchunk/conversation-diff-comments";

interface ReviewFile extends Record<string, unknown> {
  additions?: number;
  comments?: number | unknown[];
  deletions?: number;
  generated?: boolean;
  path: string;
  status?: string;
}

interface CommentPropsInput extends Record<string, unknown> {
  comments?: unknown[];
  conversationId?: string;
  enableComments?: boolean;
  localConversationId?: string | null;
  modelComments?: unknown[];
  onCommentsChange?(comments: unknown[]): void;
  path?: string;
  readonlyComments?: unknown[];
  renderReadonlyComment?: unknown;
  service?: Record<string, unknown>;
}

interface ReviewFileTreeProps extends Record<string, unknown> {
  activeFilePath?: string | null;
  autoFocusSearch?: boolean;
  commentCountByPath?: Map<string, number> | Record<string, number>;
  entries?: ReviewFile[];
  files?: ReviewFile[];
  includeHidden?: boolean;
  isLoading?: boolean;
  onOpenFile?(path: string): void;
  onQueryChange?(query: string): void;
  onRootChange?(root: string): void;
  onSelectFile?(path: string): void;
  query?: string;
  root?: string;
  roots?: string[];
  type?: "changed-files" | string;
}

type JsxRuntime = ReturnType<typeof sharedChunk.I3>;

let runtime: JsxRuntime | undefined;
let coreInitialized = false;
let commentHooksInitialized = false;
let folderIconInitialized = false;
let badgeInitialized = false;

function jsx(): JsxRuntime {
  runtime ??= sharedChunk.I3();
  return runtime;
}

function initializeCommentHooks(): void {
  if (commentHooksInitialized) return;
  commentHooksInitialized = true;
  conversationDiffComments.t?.();
}

function useReviewCommentProps(input: CommentPropsInput): { commentProps: Record<string, unknown> } {
  initializeCommentHooks();
  const commentProps: Record<string, unknown> = {};
  const explicitKeys = [
    "enableComments",
    "comments",
    "modelComments",
    "onCommentsChange",
    "readonlyComments",
    "renderReadonlyComment",
    "path",
  ] as const;
  for (const key of explicitKeys) if (key in input) commentProps[key] = input[key];

  if (input.conversationId != null) {
    const state = conversationDiffComments.n(
      input.localConversationId ?? input.conversationId,
      input.service as Parameters<typeof conversationDiffComments.n>[1],
    );
    if (!("enableComments" in commentProps)) commentProps.enableComments = true;
    if (!("comments" in commentProps)) commentProps.comments = state.comments;
    if (!("modelComments" in commentProps)) commentProps.modelComments = state.modelComments;
    if (!("onCommentsChange" in commentProps)) commentProps.onCommentsChange = state.setComments;
  }
  return { commentProps };
}

function initializeFolderIcon(): void {
  folderIconInitialized = true;
}

function FolderIcon(props: Record<string, unknown> = {}): unknown {
  initializeFolderIcon();
  return jsx().jsx("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: 20,
    height: 20,
    fill: "currentColor",
    viewBox: "0 0 20 20",
    "aria-hidden": props["aria-label"] == null ? true : undefined,
    ...props,
    children: jsx().jsx("path", {
      d: "M2.75 5.75c0-.69.56-1.25 1.25-1.25h3.28c.4 0 .78.19 1.01.51l.74.99H16c.69 0 1.25.56 1.25 1.25v7A1.25 1.25 0 0 1 16 15.5H4a1.25 1.25 0 0 1-1.25-1.25v-8.5Z",
    }),
  });
}

function initializeCommentBadge(): void {
  badgeInitialized = true;
}

function CommentBadge(props: { children?: unknown; count?: number; isActive?: boolean }): unknown {
  initializeCommentBadge();
  const count = props.count ?? 1;
  const label = `${count} ${count === 1 ? "comment" : "comments"}`;
  return jsx().jsxs("span", {
    className: "relative inline-flex",
    children: [
      props.children,
      props.isActive
        ? jsx().jsx("span", {
            "aria-label": label,
            className: "absolute -end-1.5 -top-1.5 inline-flex min-w-3.5 items-center justify-center rounded-full",
            children: count === 1 ? "1" : count,
          })
        : null,
    ],
  });
}

function pathIsHidden(path: string): boolean {
  return path.split(/[\\/]/u).some((part) => part.startsWith(".") && part !== "." && part !== "..");
}

function fileCommentCount(file: ReviewFile, counts: ReviewFileTreeProps["commentCountByPath"]): number {
  if (counts instanceof Map) return counts.get(file.path) ?? 0;
  if (counts != null) return counts[file.path] ?? 0;
  if (Array.isArray(file.comments)) return file.comments.length;
  return typeof file.comments === "number" ? file.comments : 0;
}

function normalizeFiles(input: ReviewFileTreeProps): ReviewFile[] {
  const files = input.files ?? input.entries ?? [];
  const unique = new Map<string, ReviewFile>();
  for (const candidate of files) {
    if (candidate == null || typeof candidate.path !== "string" || candidate.path.length === 0) continue;
    const existing = unique.get(candidate.path);
    unique.set(candidate.path, existing == null ? candidate : { ...existing, ...candidate });
  }
  return [...unique.values()].sort((left, right) => left.path.localeCompare(right.path));
}

function rootForFile(path: string | null | undefined, roots: readonly string[]): string | undefined {
  if (path == null) return undefined;
  return [...roots]
    .filter((root) => path === root || path.startsWith(`${root.replace(/[\\/]$/u, "")}/`))
    .sort((left, right) => right.length - left.length)[0];
}

function renderEmptyState(isLoading: boolean, hasQuery: boolean): unknown {
  const message = isLoading
    ? "Loading directory entries"
    : hasQuery
      ? "No matching files"
      : "No files in this folder";
  return jsx().jsx("div", { className: "px-2 py-2 text-start", role: "status", children: message });
}

function ReviewFileTreeSidePane(input: ReviewFileTreeProps): unknown {
  initializeReviewFileTreeSidePane();
  const roots = [...new Set(input.roots ?? [])];
  const selectedRoot = input.root ?? rootForFile(input.activeFilePath, roots) ?? roots[0] ?? "";
  const query = input.query ?? "";
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visible = normalizeFiles(input).filter((file) => {
    if (!input.includeHidden && pathIsHidden(file.path)) return false;
    if (selectedRoot !== "" && file.path !== selectedRoot && !file.path.startsWith(`${selectedRoot.replace(/[\\/]$/u, "")}/`)) return false;
    return normalizedQuery === "" || file.path.toLocaleLowerCase().includes(normalizedQuery);
  });

  const rootPicker = roots.length > 1
    ? jsx().jsx("select", {
        "aria-label": "Repository root",
        defaultValue: selectedRoot,
        onChange: (event: { currentTarget?: { value: string }; target?: { value: string } }) => {
          input.onRootChange?.(event.currentTarget?.value ?? event.target?.value ?? "");
        },
        children: roots.map((root) => jsx().jsx("option", { value: root, children: root }, root)),
      })
    : null;

  const search = jsx().jsx("input", {
    "aria-label": "Filter files",
    autoFocus: input.autoFocusSearch,
    type: "search",
    value: query,
    onChange: (event: { currentTarget?: { value: string }; target?: { value: string } }) => {
      input.onQueryChange?.(event.currentTarget?.value ?? event.target?.value ?? "");
    },
  });

  const content = visible.length === 0
    ? renderEmptyState(input.isLoading === true, normalizedQuery.length > 0)
    : jsx().jsx("ul", {
        role: "tree",
        children: visible.map((file) => {
          const commentCount = fileCommentCount(file, input.commentCountByPath);
          const summary = [
            file.generated ? "generated" : null,
            typeof file.additions === "number" ? `+${file.additions}` : null,
            typeof file.deletions === "number" ? `−${file.deletions}` : null,
            commentCount > 0 ? `${commentCount} ${commentCount === 1 ? "comment" : "comments"}` : null,
          ].filter(Boolean).join(" · ");
          return jsx().jsx("li", {
            role: "treeitem",
            "data-file-status": file.status,
            children: jsx().jsx("button", {
              "aria-current": file.path === input.activeFilePath ? "page" : undefined,
              onClick: () => input.onSelectFile?.(file.path),
              onDoubleClick: () => input.onOpenFile?.(file.path),
              type: "button",
              children: [
                file.path,
                summary.length > 0 ? ` · ${summary}` : "",
                commentCount > 0
                  ? jsx().jsx(CommentBadge, { count: commentCount, isActive: true, children: null })
                  : null,
              ],
            }),
          }, file.path);
        }),
      });

  return jsx().jsxs("aside", {
    "aria-label": input.type === "changed-files" ? "Changed files" : "Workspace files",
    className: "relative flex h-full min-h-0 min-w-[200px] max-w-[60%] flex-col border-l border-default",
    children: [rootPicker, search, content],
  });
}

function initializeReviewFileTreeSidePane(): void {
  if (coreInitialized) return;
  coreInitialized = true;
  reviewFileTreePane.r?.();
  initializeCommentHooks();
  initializeFolderIcon();
  initializeCommentBadge();
}

export {
  FolderIcon as a,
  useReviewCommentProps as c,
  initializeCommentBadge as i,
  initializeReviewFileTreeSidePane as n,
  initializeFolderIcon as o,
  CommentBadge as r,
  initializeCommentHooks as s,
  ReviewFileTreeSidePane as t,
};
