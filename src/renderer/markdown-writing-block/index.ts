// Plain markdown writing block with copy and add-to-chat actions.

import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as writingBlockSurfaceChunk from "@rchunk/writing-block-surface";
import * as writingBlockCopyButtonChunk from "@rchunk/writing-block-copy-button";

interface JsxRuntime { jsx(type: unknown, props: object, key?: string): unknown; jsxs(type: unknown, props: object, key?: string): unknown }
interface Ref<Value> { current: Value }
interface ReactRuntime { useRef<Value>(initialValue: Value): Ref<Value> }
interface MarkdownWritingBlockProps { className?: string; content: string; onAddSelectedTextToChat?(text: string, range: Range): void; showCopyButton?: boolean }

const shared = appSharedChunk as unknown as { $3?: () => void; I3: () => JsxRuntime; K2?: () => void; Xm?: () => void; Y2?: unknown; Yh?: unknown; Ym?: (content: string, event: unknown) => void; Zh?: () => void; dg?: () => void; e6: () => ReactRuntime; fg?: () => boolean };
const initial = appInitialChunk as unknown as { d6?: () => void; u6?: unknown };
const surface = writingBlockSurfaceChunk as unknown as { i?: () => void; r?: unknown };
const copyButton = writingBlockCopyButtonChunk as unknown as { n?: () => void; t?: unknown };
const { $3: initializeSharedRuntime, I3: getJsxRuntime, K2: initializeReactCompilerRuntime, Xm: initializeSelectionOverlay, Y2: FormattedMessage, Yh: Button, Ym: copyMarkdownContent, Zh: initializeIcons, dg: initializeMarkdownRuntime, e6: getReactRuntime, fg: useDarkMode } = shared;
const { d6: initializeWritingBlockActions, u6: AddIcon } = initial;
const { i: initializeWritingBlockSurface, r: WritingBlockSurface } = surface;
const { n: initializeCopyButton, t: WritingBlockCopyButton } = copyButton;

let jsx: JsxRuntime;
let React: ReactRuntime;
let initialized = false;

function initializeMarkdownWritingBlock(): void {
  if (initialized) return;
  initializeSharedRuntime?.();
  React = getReactRuntime();
  initializeReactCompilerRuntime?.();
  initializeIcons?.();
  initializeWritingBlockActions?.();
  initializeSelectionOverlay?.();
  initializeMarkdownRuntime?.();
  initializeCopyButton?.();
  initializeWritingBlockSurface?.();
  jsx = getJsxRuntime();
  initialized = true;
}

function MarkdownWritingBlock({ className, content, onAddSelectedTextToChat, showCopyButton = true }: MarkdownWritingBlockProps): unknown {
  initializeMarkdownWritingBlock();
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const addToChat = () => {
    const text = content.trim();
    const element = contentRef.current;
    if (text.length === 0 || element == null) return;
    const range = element.ownerDocument.createRange();
    range.selectNodeContents(element);
    onAddSelectedTextToChat?.(text, range);
  };
  const toolbar = jsx.jsxs("div", { "data-markdown-copy": "exclude", className: "flex items-center px-2 pt-2 pb-2 font-sans text-sm text-codex-description select-none", children: [onAddSelectedTextToChat == null ? null : jsx.jsxs(Button ?? "button", { color: "outline", size: "composer", onMouseDown: preventDefault, onClick: addToChat, children: [jsx.jsx(AddIcon ?? "span", { "aria-hidden": true, className: "icon-2xs" }), jsx.jsx(FormattedMessage ?? "span", { id: "selectedTextOverlay.addToCodex", defaultMessage: "Add to chat" })] }), showCopyButton ? jsx.jsx(WritingBlockCopyButton ?? "button", { className: "ms-auto", onCopy: (event: unknown) => copyMarkdownContent?.(content, event) }) : null] });
  const body = jsx.jsx("div", { ref: contentRef, className: "overflow-auto px-4 pt-2 pb-4 text-size-chat whitespace-pre-wrap [unicode-bidi:plaintext]", dir: "auto", children: content });
  return jsx.jsxs(WritingBlockSurface ?? "div", { "data-markdown-copy": "code-block", className, "data-theme": useDarkMode?.() ? "dark" : "light", children: [toolbar, body] });
}

function preventDefault(event: { preventDefault(): void }): void { event.preventDefault(); }

initializeMarkdownWritingBlock();
export { MarkdownWritingBlock };
