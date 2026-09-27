import "@rchunk/rolldown-runtime";
import {
  $O as queryDurations,
  FX as initializeSignalRuntime,
  I3 as jsxRuntime,
  Q3 as logger,
  RI as joinPath,
  S_ as IconAsset,
  VI as normalizePath,
  Y2 as FormattedMessage,
  Yh as Button,
  e6 as ReactRuntime,
  n4 as useIntl,
} from "@rchunk/app-shared";
import {
  $en as routeScope,
  $ln as createQueryKey,
  Qln as invokeRendererCommand,
  _ft as initializeOpenTargetMutation,
  itn as initializeRouteState,
  mnt as initializeAppServices,
  pnt as appServices,
  vft as targetAppsQuery,
} from "@rchunk/app-initial";
import {
  n as initializeUseTargetApps,
  r as useTargetApps,
  t as PrefetchTargetApps,
} from "@rchunk/use-target-apps";
import {
  a as initializeReviewPreferences,
  c as reviewDiffStyleSignal,
  d as reviewFileViewModeSignal,
  l as reviewLineDiffTypeSignal,
  o as reviewTreeFlattenSignal,
  u as reviewTreeIconsSignal,
} from "@rchunk/review-preferences-model";

interface ReviewEntry extends Record<string, unknown> {
  changeKind?: "added" | "copied" | "deleted" | "modified" | "renamed" | "type-changed" | "unmerged" | "untracked";
  path: string;
}
interface FileTreeEntry { displayPath: string; entry: ReviewEntry; treePath: string; }

function getFilePathFromEvent(event: { composedPath(): EventTarget[] }): string | null {
  for (const target of event.composedPath()) {
    if (!(target instanceof Element) || target.getAttribute("data-item-type") !== "file") continue;
    const path = target.getAttribute("data-item-path");
    if (path) return path;
  }
  return null;
}

function initializeFileTreeEvents(): void {}

function normalizeReviewEntries(entries: ReviewEntry[]): FileTreeEntry[] {
  return entries.map((entry) => {
    const treePath = normalizePath(entry.path).replace(/^\/+/, "");
    return { displayPath: treePath, entry, treePath };
  });
}

function mapChangeKind(kind: ReviewEntry["changeKind"]): ReviewEntry["changeKind"] {
  if (kind === "copied") return "added";
  if (kind === "type-changed" || kind === "unmerged") return "modified";
  return kind;
}

function ReviewFileTree(props: {
  activePath?: string | null;
  allowSelectingActivePath?: boolean;
  commentCountByPath?: Map<string, number>;
  cwd?: string | null;
  entries: ReviewEntry[];
  hostId: string;
  onSelectPath(path: string): void;
  reserveBottomPadding?: boolean;
}): unknown {
  const entries = normalizeReviewEntries(props.entries);
  const activeTreePath = entries.find((entry) => entry.entry.path === props.activePath)?.treePath;
  return jsxRuntime().jsx("div", {
    className: "h-full min-h-0 w-full px-2",
    children: jsxRuntime().jsx("ul", {
      role: "tree",
      children: entries.map(({ entry, treePath }) => jsxRuntime().jsx("li", {
        role: "treeitem",
        "aria-selected": activeTreePath === treePath,
        "data-item-type": "file",
        "data-item-path": treePath,
        "data-change-kind": mapChangeKind(entry.changeKind),
        onClick: () => {
          if (props.allowSelectingActivePath || entry.path !== props.activePath) props.onSelectPath(entry.path);
        },
        children: [treePath, props.commentCountByPath?.get(entry.path) ? ` (${props.commentCountByPath.get(entry.path)})` : ""],
      }, treePath)),
    }),
  });
}

function FileTreeSearch(props: {
  autoFocus?: boolean;
  inputId?: string;
  inputRef?: unknown;
  onQueryChange(value: string): void;
  searchQuery: string;
}): unknown {
  const intl = useIntl();
  const inputId = props.inputId ?? "file-tree-search";
  return jsxRuntime().jsxs("div", {
    className: "relative flex h-token-button-composer w-full items-center gap-1.5 rounded-lg border border-default",
    children: [
      jsxRuntime().jsx("label", { className: "sr-only", htmlFor: inputId, children: jsxRuntime().jsx(FormattedMessage, { id: "codex.fileTreeSearch.label", defaultMessage: "Filter files" }) }),
      jsxRuntime().jsx("input", {
        autoFocus: props.autoFocus, id: inputId, ref: props.inputRef, type: "text", value: props.searchQuery,
        placeholder: String(intl.formatMessage({ id: "codex.fileTreeSearch.placeholder", defaultMessage: "Filter files…" })),
        onChange: (event: { target: { value: string } }) => props.onQueryChange(event.target.value),
      }),
      props.searchQuery.length === 0 ? null : jsxRuntime().jsx(Button, { "aria-label": "Clear file filter", onClick: () => props.onQueryChange(""), children: "×" }),
    ],
  });
}

function EmptyFileSearch(): unknown {
  return jsxRuntime().jsx("div", { className: "px-2 py-2", children: jsxRuntime().jsx(FormattedMessage, { id: "codex.review.fileSearch.empty", defaultMessage: "No matching files" }) });
}

type GeneratedState = "set" | "unset" | "unspecified";
function globToRegExp(pattern: string, matchBase: boolean): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/gu, "\\$&").replace(/\*\*/gu, ".*").replace(/\*/gu, "[^/]*").replace(/\?/gu, "[^/]");
  return new RegExp(matchBase ? `(?:^|/)${escaped}$` : `^${escaped}$`, "u");
}
function parseGeneratedAttributes(
  source: string | null | undefined,
  options: { basePath?: string | null } = {},
): ((path: string) => GeneratedState | null) | null {
  if (!source) return null;
  const basePath = options.basePath == null ? null : normalizePath(options.basePath).replace(/^\/+|\/+$/gu, "");
  const rules = source.split(/\r?\n/u).flatMap((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("[attr]")) return [];
    const parts = trimmed.split(/\s+/u);
    if (parts.length < 2) return [];
    let state: GeneratedState | null = null;
    for (const attribute of parts.slice(1)) {
      if (attribute === "linguist-generated" || attribute === "linguist-generated=true") state = "set";
      else if (attribute === "-linguist-generated" || attribute === "linguist-generated=false") state = "unset";
      else if (attribute === "!linguist-generated") state = "unspecified";
    }
    if (state == null) return [];
    const pattern = parts[0].replace(/^\/+/, "");
    return [{ matcher: globToRegExp(pattern, !pattern.includes("/")), state }];
  });
  if (rules.length === 0) return null;
  return (path) => {
    const normalized = normalizePath(path);
    const relative = basePath == null ? normalized : normalized === basePath ? "" : normalized.startsWith(`${basePath}/`) ? normalized.slice(basePath.length + 1) : null;
    if (relative == null) return null;
    let state: GeneratedState | null = null;
    for (const rule of rules) if (rule.matcher.test(relative)) state = rule.state;
    return state;
  };
}

function collectAttributePaths(gitRoot: string | null | undefined, paths: string[]): string[] {
  if (gitRoot == null) return [];
  const result = new Set<string>();
  for (const path of paths) {
    const parts = normalizePath(path).split("/").filter(Boolean);
    for (let index = 0; index < parts.length - 1; index += 1) result.add(joinPath(gitRoot, `${parts.slice(0, index + 1).join("/")}/.gitattributes`));
  }
  return [...result];
}

function useGeneratedFilePaths(input: {
  cwd?: string | null;
  gitCommonDir?: string | null;
  gitRoot?: string | null;
  hostId: string;
  paths: string[];
}): { hasLinguistGeneratedAttributes: boolean; hasUnhandledAttributesFiles: boolean; isReady: boolean; paths: Set<string> } {
  const attributePaths = [
    input.gitRoot == null ? null : `${normalizePath(input.gitRoot)}/.gitattributes`,
    input.gitCommonDir == null ? null : `${normalizePath(input.gitCommonDir)}/info/attributes`,
    ...collectAttributePaths(input.gitRoot, input.paths),
  ].filter((path): path is string => path != null);
  void createQueryKey; void invokeRendererCommand; void queryDurations;
  return { hasLinguistGeneratedAttributes: false, hasUnhandledAttributesFiles: attributePaths.length > 0, isReady: true, paths: new Set() };
}

let initializedCore = false;
function initializeFileTreeCore(): void {
  if (initializedCore) return;
  initializedCore = true;
  initializeSignalRuntime(); initializeUseTargetApps(); initializeOpenTargetMutation(); initializeAppServices(); initializeRouteState();
  initializeReviewPreferences();
  void routeScope; void appServices; void targetAppsQuery; void useTargetApps; void PrefetchTargetApps;
  void reviewDiffStyleSignal; void reviewFileViewModeSignal; void reviewLineDiffTypeSignal; void reviewTreeFlattenSignal; void reviewTreeIconsSignal;
}
let initializedSearch = false;
function initializeFileTreeSearch(): void { if (!initializedSearch) { initializedSearch = true; initializeFileTreeCore(); } }
let initializedAttributes = false;
function initializeGeneratedAttributes(): void { if (!initializedAttributes) { initializedAttributes = true; initializeFileTreeCore(); } }
let initializedReviewTree = false;
function initializeReviewFileTree(): void {
  if (initializedReviewTree) return;
  initializedReviewTree = true; initializeFileTreeCore(); initializeFileTreeSearch(); initializeGeneratedAttributes();
  void logger; void IconAsset; void ReactRuntime;
}

export {
  initializeGeneratedAttributes as a,
  initializeFileTreeSearch as c,
  getFilePathFromEvent as d,
  initializeFileTreeEvents as f,
  parseGeneratedAttributes as i,
  ReviewFileTree as l,
  ReviewFileTree as n,
  useGeneratedFilePaths as o,
  initializeReviewFileTree as r,
  FileTreeSearch as s,
  EmptyFileSearch as t,
  initializeFileTreeCore as u,
};
