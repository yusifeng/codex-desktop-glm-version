import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";

export interface WritingBlockSurfaceProps {
  children?: unknown;
  className?: string;
  header?: unknown;
  leadingContent?: unknown;
  style?: Record<string, string | number>;
}
export interface WritingBlockRegionProps { children?: unknown; className?: string }

let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }

const writingBlockCssVariables: Record<string, string> = {
  "--oai-wb-spacing": "0.75rem",
  "--oai-wb-text-primary": "var(--text-primary)",
  "--oai-wb-surface-primary": "var(--surface-primary)",
  "--oai-wb-border": "var(--border-light)",
  "--oai-wb-accent": "var(--accent-blue)",
  "--oai-wb-radius": "0.75rem",
  "--oai-wb-shadow": "0 8px 24px rgb(0 0 0 / 8%)",
};

function WritingBlockFrame(props: WritingBlockSurfaceProps): unknown {
  return jsx().jsxs("section", { "data-oai-writing-block-surface": true, className: props.className, style: { ...writingBlockCssVariables, ...props.style }, children: [
    props.header || props.leadingContent ? jsx().jsxs("header", { "data-writing-block-header": true, children: [props.leadingContent, props.header] }) : null,
    jsx().jsx("div", { "data-writing-block-content": true, children: props.children }),
  ] });
}
function WritingBlockControls(props: WritingBlockRegionProps): unknown { return jsx().jsx("div", { className: props.className, "data-writing-block-controls": true, children: props.children }); }
function WritingBlockEditorRegion(props: WritingBlockRegionProps): unknown { return jsx().jsx("div", { className: props.className, "data-writing-block-editor": true, children: props.children }); }
function initializeWritingBlockVariables(): void { void writingBlockCssVariables; }
function initializeWritingBlockSurface(): void { void jsx(); }

export { initializeWritingBlockVariables as a, initializeWritingBlockSurface as i, WritingBlockFrame as n, writingBlockCssVariables as o, WritingBlockControls as r, WritingBlockEditorRegion as t };
