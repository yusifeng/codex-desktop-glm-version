import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/codex-diff-css";
import "@rchunk/render-file-children";
import "@rchunk/register-pierre-themes";
export interface DiffFile { name?: string; path?: string; contents?: string; additions?: number; deletions?: number }
export interface DiffFileViewProps { className?: string; edit?: boolean; file: DiffFile; lineAnnotations?: readonly { line: number; label?: string }[]; onEditChange?(contents: string): void; onEditComplete?(contents: string): "accept" | "reject" | void; selectedLines?: readonly number[]; style?: Record<string, unknown> }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function DiffFileView(props: DiffFileViewProps): unknown { const path = props.file.path ?? props.file.name ?? "Untitled"; return jsx().jsxs("section", { className: props.className, style: props.style, "data-diff-file": path, "data-editable": props.edit ?? false, children: [jsx().jsxs("header", { children: [path, jsx().jsx("span", { children: `+${props.file.additions ?? 0} −${props.file.deletions ?? 0}` })] }), jsx().jsx("pre", { children: props.file.contents ?? "" }), jsx().jsx("div", { "data-selected-lines": props.selectedLines?.join(",") ?? "", children: (props.lineAnnotations ?? []).map(annotation => jsx().jsx("span", { "data-line": annotation.line, children: annotation.label ?? `Line ${annotation.line}` }, annotation.line)) }), props.edit ? jsx().jsx("textarea", { defaultValue: props.file.contents ?? "", onChange: (event: { currentTarget: { value: string } }) => props.onEditChange?.(event.currentTarget.value), onBlur: (event: { currentTarget: { value: string } }) => props.onEditComplete?.(event.currentTarget.value) }) : null] }); }
function initializeDiffFileView(): void { void jsx(); }
export { initializeDiffFileView as n, DiffFileView as t };
