import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/summary";
import "@rchunk/writing-block-floating-slash-menu";
import "@rchunk/writing-block-surface";
import "@rchunk/editable-writing-block";
import "@rchunk/writing-block-app-capabilities";
import "@rchunk/pending-edits-dialog";
import "@rchunk/artifact-entry";
import "@rchunk/library-file-metadata";
import "@rchunk/library-multiplayer-access";

const jsxRuntime = getJsxRuntime();
export interface WritingBlockDocument { content?: string; editorKey: string; title?: string }
export interface WritingBlockFrameProps { className?: string; header?: unknown; onClose?(): void }
export interface WritingBlockProps {
  auxiliaryContent?: unknown;
  collapsed?: boolean;
  collapsedContent?: unknown;
  document?: WritingBlockDocument | null;
  earlierVersion?: unknown;
  frameProps?: WritingBlockFrameProps;
  hasPendingEdits?: boolean;
  isExpanded?: boolean;
  isStreaming?: boolean;
  onBeforeDocumentExport?(): Promise<void> | void;
  onDocumentChange?(content: string): void;
  onExpandChange?(expanded: boolean): void;
  onPreviewClose?(): void;
  previewActions?: unknown;
  previewContent?: unknown;
  showMagicEditAction?: boolean;
  title?: string;
  variant?: "document" | "text";
}
export interface LibraryWritingBlockProps extends WritingBlockProps { conversationId: string; error?: string | null; instanceId: string; libraryContent?: string | null; libraryFileId?: string | null; libraryLoading?: boolean; messageId: string; multiplayerAllowed?: boolean; refIndex: number; onRetry?(): void }

function WritingBlockFrame({ children, title, actions }: { actions?: unknown; children?: unknown; title?: string }): unknown { return jsxRuntime.jsxs("article", { className: "my-4 overflow-hidden rounded-xl border border-default", children: [jsxRuntime.jsxs("header", { className: "flex min-w-0 items-center gap-3 p-4", children: [jsxRuntime.jsx("span", { className: "min-w-0 flex-1 truncate font-medium", children: title ?? "Document" }), actions] }), children] }); }
function WritingBlock(props: WritingBlockProps): unknown {
  if (props.earlierVersion != null) return props.earlierVersion;
  if (props.collapsed && props.collapsedContent != null) return props.collapsedContent;
  const title = props.title ?? props.document?.title ?? "Document";
  if (props.document == null || props.variant !== "document") return jsxRuntime.jsxs(WritingBlockFrame, { title, actions: props.previewActions, children: [jsxRuntime.jsx("div", { className: "whitespace-pre-wrap p-4", children: props.document?.content ?? props.previewContent }), props.auxiliaryContent] });
  const expanded = props.isExpanded ?? false;
  return jsxRuntime.jsxs(WritingBlockFrame, { title, actions: props.previewActions, children: [expanded ? jsxRuntime.jsxs("section", { "data-editor-key": props.document.editorKey, className: "min-h-0", children: [props.frameProps?.header, jsxRuntime.jsx("textarea", { className: props.frameProps?.className, disabled: props.isStreaming, value: props.document.content ?? "", onChange: (event: { target: { value: string } }) => props.onDocumentChange?.(event.target.value) }), props.previewContent, jsxRuntime.jsx("button", { type: "button", onClick: () => { props.frameProps?.onClose?.(); props.onPreviewClose?.(); props.onExpandChange?.(false); }, children: "Close" })] }) : jsxRuntime.jsx("button", { type: "button", className: "w-full whitespace-pre-wrap p-4 text-start", onClick: () => props.onExpandChange?.(true), children: props.document.content ?? props.previewContent }), props.hasPendingEdits ? jsxRuntime.jsx("div", { role: "status", children: "Pending edits" }) : null, props.showMagicEditAction ? jsxRuntime.jsx("button", { type: "button", children: "Edit with ChatGPT" }) : null, props.auxiliaryContent] });
}
function LibraryWritingBlock(props: LibraryWritingBlockProps): unknown {
  if (props.libraryFileId != null && props.multiplayerAllowed === false) return jsxRuntime.jsx("div", { role: "alert", children: "This document is unavailable" });
  if (props.libraryFileId != null && props.libraryLoading) return jsxRuntime.jsx("div", { role: "status", children: "Loading document…" });
  if (props.libraryFileId != null && props.error) return jsxRuntime.jsxs("div", { role: "alert", children: ["Couldn’t sync this document", props.onRetry ? jsxRuntime.jsx("button", { type: "button", onClick: props.onRetry, children: "Try again" }) : null] });
  const document = props.document ?? (props.libraryFileId != null && props.libraryContent != null ? { editorKey: props.libraryFileId, title: props.title, content: props.libraryContent } : null);
  return jsxRuntime.jsx(WritingBlock, { ...props, document });
}
function initializeWritingBlock(): void {}
function initializeLibraryWritingBlock(): void {}
export { initializeWritingBlock as i, initializeLibraryWritingBlock as n, WritingBlock as r, LibraryWritingBlock as t };
