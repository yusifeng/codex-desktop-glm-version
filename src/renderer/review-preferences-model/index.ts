// Review diff annotations, file-tree icons, and persisted review preferences.
// The release bundled these three owners together; the nineteen short exports
// below remain the cross-chunk ABI and therefore must not be renamed.

import { normalizePathSeparators as normalizePath } from "../app-shared/runtime/path-key-policy";
import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  type ScopedSignal,
} from "@rchunk/app-shared";
import {
  dun as createPersistedPreference,
  rgn as initializePreferenceRuntime,
} from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as diffCommentCardChunk from "@rchunk/diff-comment-card";
import * as readonlyCommentChunk from "@rchunk/pull-request-readonly-comment";
import * as reviewRowChunk from "@rchunk/review-row";
import {
  COMPLETE_FILE_TREE_SPRITE,
  MINIMAL_FILE_TREE_SPRITE,
  STANDARD_FILE_TREE_SPRITE,
} from "./file-tree-sprites";

void onceExport;
void appPrimaryChunk;
void diffCommentCardChunk;
void readonlyCommentChunk;
void reviewRowChunk;

type DiffSide = "additions" | "deletions";
interface CommentPosition { line: number; path: string; side?: "left" | "right" }
interface ReviewComment extends Record<string, unknown> {
  localWorkspaceRoot?: string | null;
  position: CommentPosition;
  replyToReviewThreadId?: string | null;
  reviewThreadId?: string | null;
}
interface CommentAnnotation { attached?: boolean; comment: ReviewComment; source: "model" | "readonly" | "user" }
interface DraftAnnotation {
  key: string; lineNumber: number; localDiffHunk?: unknown; localWorkspaceRoot?: string | null;
  path: string; side: DiffSide; startLine?: number; startSide?: DiffSide;
}
interface ReviewAnnotation {
  lineNumber: number;
  metadata: ({ kind: "comment" } & CommentAnnotation) | ({ kind: "draft-comment" } & DraftAnnotation);
  side: DiffSide;
}
interface DiffCommentModelOptions {
  allowCommentDrafts?: boolean; commentAuthorAvatarUrl?: string | null; commentAuthorLabel?: string | null;
  comments?: ReviewComment[]; conversationId?: string | null; cwd?: string | null; diffPath: string;
  enableComments?: boolean; modelComments?: ReviewComment[]; onCommentsChange?(comments: ReviewComment[]): void;
  onReadonlyCommentReply?(comment: ReviewComment): void; onSelectionClear?(): void;
  readonlyComments?: ReviewComment[]; renderReadonlyComment?(comment: ReviewComment, action: unknown): unknown;
  renderReadonlyCommentActions?(comment: ReviewComment, canReply: boolean, reply: () => void): unknown;
  renderReadonlyCommentBody?(comment: ReviewComment): unknown; submittingCommentKeys?: Set<string>;
  workspaceRoot?: string | null;
}
interface AddDraftCommentInput { lineNumber: number; localDiffHunk?: unknown; side: DiffSide; startLine?: number; startSide?: DiffSide }
interface DiffCommentModel {
  addDraftComment(input: AddDraftCommentInput): void; annotationKeys: Set<string>;
  annotations: ReviewAnnotation[]; renderCommentAnnotation(annotation: ReviewAnnotation): unknown;
}

// Diff-line annotation helpers (release exports v/y/g/h/_/m/f/p).
function lineNumberFromEventPath(path: EventTarget[]): number | null {
  for (const target of path) {
    if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) continue;
    const value = target.getAttribute("data-line") ?? target.getAttribute("data-column-number");
    if (value == null) continue;
    const lineNumber = Number.parseInt(value, 10);
    if (!Number.isNaN(lineNumber)) return lineNumber;
  }
  return null;
}
function initializeLineEventHelpers(): void {}
function additionsCommentAnnotations(annotations: ReviewAnnotation[]): Array<{ lineNumber: number; metadata: ReviewAnnotation["metadata"] }> {
  return annotations.flatMap((annotation) => annotation.side === "additions" ? [{ lineNumber: annotation.lineNumber, metadata: annotation.metadata }] : []);
}
function asAdditionsAnnotation(annotation: ReviewAnnotation): ReviewAnnotation | undefined {
  if (annotation.metadata.kind !== "comment" && annotation.metadata.kind !== "draft-comment") return undefined;
  return { side: "additions", lineNumber: annotation.lineNumber, metadata: annotation.metadata };
}
let annotationKey = (side: DiffSide, lineNumber: number): string => `${side}:${lineNumber}`;
function initializeAnnotationKey(): void { annotationKey = (side, lineNumber) => `${side}:${lineNumber}`; }
function canonicalPath(value: string): string { return normalizePath(value).replace(/\/+$/u, ""); }
function basename(value: string): string { const normalized = normalizePath(value); return normalized.split("/").at(-1) ?? normalized; }
function commentIdentity(comment: ReviewComment, workspaceRoot?: string | null): string {
  const position = comment.position;
  return [canonicalPath(comment.localWorkspaceRoot ?? workspaceRoot ?? ""), canonicalPath(position.path), position.side ?? "right", String(position.line), String(comment.reviewThreadId ?? comment.replyToReviewThreadId ?? "")].join("::");
}
function matchesDiffPath(commentPath: string, diffPath: string, cwd?: string | null): boolean {
  const comment = canonicalPath(commentPath), diff = canonicalPath(diffPath);
  return comment === diff || basename(comment) === basename(diff) || (cwd != null && canonicalPath(`${cwd}/${comment}`) === diff);
}
function toCommentAnnotation(comment: ReviewComment, source: CommentAnnotation["source"], attached?: boolean): ReviewAnnotation {
  return { side: comment.position.side === "left" ? "deletions" : "additions", lineNumber: comment.position.line, metadata: { kind: "comment", attached, comment, source } };
}
function draftToAnnotation([key, draft]: [string, Omit<DraftAnnotation, "key">]): ReviewAnnotation {
  return { side: draft.side, lineNumber: draft.lineNumber, metadata: { kind: "draft-comment", key, ...draft } };
}
let diffRuntimeInitialized = false;
function initializeDiffCommentModel(): void {
  if (diffRuntimeInitialized) return;
  diffRuntimeInitialized = true;
  initializeAnnotationKey();
  getReactRuntime();
  getJsxRuntime();
}
function useDiffCommentModel(options: DiffCommentModelOptions): DiffCommentModel {
  initializeDiffCommentModel();
  const React = getReactRuntime(), jsx = getJsxRuntime();
  const [drafts, setDrafts] = React.useState<Record<string, Omit<DraftAnnotation, "key">>>({});
  const allowDrafts = options.allowCommentDrafts ?? options.enableComments ?? false;
  const workspaceMatches = (comment: ReviewComment): boolean => comment.localWorkspaceRoot == null || options.workspaceRoot == null || canonicalPath(comment.localWorkspaceRoot) === canonicalPath(options.workspaceRoot);
  const userComments = (options.comments ?? []).filter(workspaceMatches);
  const userKeys = new Set(userComments.map((comment) => commentIdentity(comment, options.workspaceRoot)));
  const readonly = (options.readonlyComments ?? []).map((comment) => ({
    comment,
    attached: userKeys.has(commentIdentity(comment, options.workspaceRoot)) || userKeys.has(commentIdentity({ ...comment, localWorkspaceRoot: options.workspaceRoot }, options.workspaceRoot)),
  }));
  const readonlyKeys = new Set(readonly.map(({ comment }) => commentIdentity(comment, options.workspaceRoot)));
  const commentAnnotations: ReviewAnnotation[] = options.enableComments ? [
    ...userComments.filter((comment) => !readonlyKeys.has(commentIdentity(comment, options.workspaceRoot))).map((comment) => toCommentAnnotation(comment, "user")),
    ...readonly.map(({ comment, attached }) => toCommentAnnotation(comment, "readonly", attached)),
    ...(options.modelComments ?? []).filter(workspaceMatches).map((comment) => toCommentAnnotation(comment, "model")),
  ].filter((annotation) => matchesDiffPath((annotation.metadata as { comment: ReviewComment }).comment.position.path, options.diffPath, options.cwd)) : [];
  const draftAnnotations = allowDrafts ? Object.entries(drafts)
    .filter(([, draft]) => draft.localWorkspaceRoot == null ? options.workspaceRoot == null : options.workspaceRoot != null && canonicalPath(draft.localWorkspaceRoot) === canonicalPath(options.workspaceRoot))
    .map(draftToAnnotation) : [];
  const annotations = options.enableComments ? [...commentAnnotations, ...draftAnnotations] : [];
  const annotationKeys = new Set<string>();
  for (const annotation of commentAnnotations) if (annotation.metadata.kind !== "comment" || annotation.metadata.source !== "readonly") annotationKeys.add(annotationKey(annotation.side, annotation.lineNumber));
  for (const annotation of draftAnnotations) annotationKeys.add(annotationKey(annotation.side, annotation.lineNumber));
  const addDraftComment = (input: AddDraftCommentInput): void => {
    if (!allowDrafts) return;
    const key = options.workspaceRoot == null ? annotationKey(input.side, input.lineNumber) : `${canonicalPath(options.workspaceRoot)}::${annotationKey(input.side, input.lineNumber)}`;
    setDrafts((current) => current[key] != null ? current : { ...current, [key]: {
      side: input.side, lineNumber: input.lineNumber, path: basename(options.diffPath), localWorkspaceRoot: options.workspaceRoot,
      ...(input.startLine != null && (input.startLine !== input.lineNumber || input.startSide !== input.side) ? { startLine: input.startLine } : {}),
      ...(input.startSide != null && input.startSide !== input.side ? { startSide: input.startSide } : {}), localDiffHunk: input.localDiffHunk,
    } });
  };
  const renderCommentAnnotation = (annotation: ReviewAnnotation): unknown => {
    const metadata = annotation.metadata;
    if (metadata.kind === "draft-comment") return jsx.jsx("div", { "data-review-comment-kind": "draft", "data-review-comment-key": metadata.key, children: options.commentAuthorLabel ?? "Draft comment" });
    const { comment, source } = metadata;
    if (source === "readonly" && options.renderReadonlyComment != null) {
      const action = options.onReadonlyCommentReply != null && comment.reviewThreadId != null ? jsx.jsx("button", { type: "button", onClick: () => options.onReadonlyCommentReply?.(comment), children: "Reply" }) : null;
      return options.renderReadonlyComment(comment, action);
    }
    return jsx.jsx("div", { "data-review-comment-kind": source, "data-review-comment-line": annotation.lineNumber, children: options.renderReadonlyCommentBody?.(comment) ?? comment.body ?? comment.text ?? "" });
  };
  return { annotations, annotationKeys, addDraftComment, renderCommentAnnotation };
}

// File-tree built-in icon configuration (release exports l/d/u/c/a/o).
type BuiltinIconSet = "complete" | "minimal" | "none" | "standard" | string;
interface IconDescriptor { body?: string; height?: number; name: string; remappedFrom?: string; token?: string; viewBox?: string; width?: number }
interface FileTreeIconOptions {
  byFileExtension?: Record<string, string | IconDescriptor>; byFileName?: Record<string, string | IconDescriptor>;
  byFileNameContains?: Record<string, string | IconDescriptor>; colored?: boolean;
  remap?: Record<string, string | IconDescriptor>; set?: BuiltinIconSet; spriteSheet?: string;
}
interface NormalizedFileTreeIconOptions extends FileTreeIconOptions { colored: boolean; set: BuiltinIconSet }
const STANDARD_ICON_TOKENS = new Set(["bash", "c", "cpp", "css", "database", "default", "font", "git", "go", "html", "image", "javascript", "json", "markdown", "mcp", "python", "ruby", "rust", "swift", "table", "text", "typescript", "zip"]);
const FILE_NAME_ICONS: Record<string, string> = {
  ".babelrc": "babel", ".bashrc": "bash", ".dockerignore": "docker", ".eslintrc": "eslint", ".gitattributes": "git", ".gitignore": "git", ".gitmodules": "git", ".prettierignore": "text", "biome.json": "biome", "bun.lock": "bun", "bun.lockb": "bun", "claude.md": "claude", "compose.yaml": "docker", "compose.yml": "docker", dockerfile: "docker", gemfile: "ruby", "package-lock.json": "npm", "package.json": "npm", "pnpm-lock.yaml": "npm", rakefile: "ruby", "tailwind.config.js": "tailwind", "tailwind.config.ts": "tailwind", "tsconfig.json": "typescript", "vite.config.js": "vite", "vite.config.ts": "vite", "webpack.config.js": "webpack", "yarn.lock": "npm",
};
const EXTENSION_ICONS: Record<string, string> = {
  "7z": "zip", astro: "astro", bash: "bash", bmp: "image", bz2: "zip", c: "c", cc: "cpp", cjs: "javascript", cpp: "cpp", css: "css", csv: "table", cts: "typescript", cxx: "cpp", db: "database", eot: "font", erb: "ruby", gif: "image", go: "go", gql: "graphql", graphql: "graphql", gz: "zip", h: "c", hpp: "cpp", htm: "html", html: "html", ico: "image", jar: "zip", jpeg: "image", jpg: "image", js: "javascript", json: "json", jsonc: "json", jsonl: "json", jsx: "react", less: "css", markdown: "markdown", mcp: "mcp", md: "markdown", mdx: "markdown", mjs: "javascript", mts: "typescript", ods: "table", otf: "font", png: "image", py: "python", rb: "ruby", rs: "rust", sass: "sass", scss: "sass", sh: "bash", sql: "database", sqlite: "database", svelte: "svelte", svg: "image", swift: "swift", tar: "zip", tf: "terraform", tgz: "zip", tif: "image", tiff: "image", ts: "typescript", tsv: "table", tsx: "react", ttf: "font", txt: "text", vue: "vue", wasm: "wasm", webp: "image", woff: "font", woff2: "font", xls: "table", xlsx: "table", yaml: "yml", yml: "yml", zig: "zig", zip: "zip",
};
function initializeFileTreeSpriteSheets(): void {}
function getFileTreeSpriteSheet(set: BuiltinIconSet): string {
  return set === "none" || set === "minimal"
    ? MINIMAL_FILE_TREE_SPRITE
    : set === "standard"
      ? STANDARD_FILE_TREE_SPRITE
      : COMPLETE_FILE_TREE_SPRITE;
}
function supportsColoredBuiltins(set: BuiltinIconSet): boolean { return set !== "none" && set === "complete"; }
function hasCustomIconConfiguration(options: FileTreeIconOptions): boolean { return options.spriteSheet != null || options.remap != null || options.byFileName != null || options.byFileExtension != null || options.byFileNameContains != null; }
function normalizeFileTreeIconOptions(options?: BuiltinIconSet | FileTreeIconOptions | null): NormalizedFileTreeIconOptions {
  if (options == null) return { set: "complete", colored: true };
  if (typeof options === "string") return { set: options, colored: true };
  return { ...options, set: options.set ?? (hasCustomIconConfiguration(options) ? "none" : "complete"), colored: options.colored ?? true };
}
function remappedDescriptor(value: string | IconDescriptor, remappedFrom: string): IconDescriptor { return typeof value === "string" ? { name: value, remappedFrom } : { ...value, remappedFrom }; }
function extensionCandidates(fileName: string): string[] { const parts = fileName.toLowerCase().split("."), values: string[] = []; for (let index = 1; index < parts.length; index++) values.push(parts.slice(index).join(".")); return values; }
function builtinToken(set: BuiltinIconSet, fileName: string, extensions: string[]): string | undefined {
  if (set === "minimal" || set === "none") return undefined;
  const complete = set === "complete", byName = FILE_NAME_ICONS[fileName.toLowerCase()];
  if (byName != null && (complete || STANDARD_ICON_TOKENS.has(byName))) return byName;
  for (const extension of extensions) { const token = EXTENSION_ICONS[extension]; if (token != null && (complete || STANDARD_ICON_TOKENS.has(token))) return token; }
  return "default";
}
function createFileTreeIconResolver(options?: BuiltinIconSet | FileTreeIconOptions | null): { resolveIcon(iconName: string, path?: string | null): IconDescriptor } {
  initializeFileTreeIconRuntime();
  const normalized = normalizeFileTreeIconOptions(options);
  const byFileName = new Map(Object.entries(normalized.byFileName ?? {}).map(([key, value]) => [key.toLowerCase(), value]));
  const byExtension = new Map(Object.entries(normalized.byFileExtension ?? {}).map(([key, value]) => [key.trim().toLowerCase(), value]));
  const contains = Object.entries(normalized.byFileNameContains ?? {}).map(([key, value]) => [key.toLowerCase(), value] as const);
  return { resolveIcon(iconName, path) {
    if (iconName === "file-tree-icon-file" && path != null) {
      const fileName = path.split("/").at(-1) ?? path, lowerName = fileName.toLowerCase(), named = byFileName.get(lowerName);
      if (named != null) return remappedDescriptor(named, iconName);
      for (const [fragment, value] of contains) if (lowerName.includes(fragment)) return remappedDescriptor(value, iconName);
      const extensions = extensionCandidates(fileName);
      for (const extension of extensions) { const descriptor = byExtension.get(extension); if (descriptor != null) return remappedDescriptor(descriptor, iconName); }
      const token = builtinToken(normalized.set, fileName, extensions);
      if (token != null && normalized.set !== "none") return { name: `file-tree-builtin-${token}`, remappedFrom: iconName, token };
    }
    const remapped = normalized.remap?.[iconName];
    return remapped == null ? { name: iconName } : remappedDescriptor(remapped, iconName);
  } };
}
let fileTreeIconRuntimeInitialized = false;
function initializeFileTreeIconRuntime(): void { if (!fileTreeIconRuntimeInitialized) { fileTreeIconRuntimeInitialized = true; initializeFileTreeSpriteSheets(); } }
function initializeFileTreeIconContext(): void {}

// Persisted review preferences (release exports n/r/i/t).
let filterGeneratedFilesPreference: ScopedSignal<Record<string, unknown>, boolean>;
let loadFullFilesPreference: ScopedSignal<Record<string, unknown>, boolean>;
let skipRevertConfirmationPreference: ScopedSignal<Record<string, unknown>, boolean>;
let preferencesInitialized = false;
function initializeReviewPreferences(): void {
  if (preferencesInitialized) return;
  preferencesInitialized = true;
  initializePreferenceRuntime();
  filterGeneratedFilesPreference = createPersistedPreference("review-filter-generated-files", false);
  loadFullFilesPreference = createPersistedPreference("load-full-files", true);
  skipRevertConfirmationPreference = createPersistedPreference("skip-revert-confirmation", false);
}

export {
  initializeAnnotationKey as _, createFileTreeIconResolver as a, normalizeFileTreeIconOptions as c,
  supportsColoredBuiltins as d, initializeDiffCommentModel as f, additionsCommentAnnotations as g,
  asAdditionsAnnotation as h, skipRevertConfirmationPreference as i, getFileTreeSpriteSheet as l,
  annotationKey as m, filterGeneratedFilesPreference as n, initializeFileTreeIconRuntime as o,
  useDiffCommentModel as p, loadFullFilesPreference as r, initializeFileTreeIconContext as s,
  initializeReviewPreferences as t, initializeFileTreeSpriteSheets as u, lineNumberFromEventPath as v,
  initializeLineEventHelpers as y,
};
