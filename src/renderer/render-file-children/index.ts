import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/codex-diff-css";
interface LineAnnotation { id?: string | number; line?: number; [key: string]: unknown }
interface RenderFileChildrenProps<FileValue> { file: FileValue; getAnnotationSlotName?(annotation: LineAnnotation): string; getHoveredLine?(): number | null; lineAnnotations?: LineAnnotation[]; renderAnnotation?(annotation: LineAnnotation): unknown; renderCustomHeader?(file: FileValue): unknown; renderGutterUtility?(getHoveredLine?: () => number | null): unknown; renderHeaderFilenameSuffix?(file: FileValue): unknown; renderHeaderMetadata?(file: FileValue): unknown; renderHeaderPrefix?(file: FileValue): unknown }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function RenderFileChildren<FileValue>(props: RenderFileChildrenProps<FileValue>): unknown { const custom = props.renderCustomHeader?.(props.file); const children: unknown[] = []; if (custom != null) children.push(jsx().jsx("div", { slot: "header", children: custom })); else { const entries: Array<[string, unknown]> = [["header-prefix", props.renderHeaderPrefix?.(props.file)], ["header-filename-suffix", props.renderHeaderFilenameSuffix?.(props.file)], ["header-metadata", props.renderHeaderMetadata?.(props.file)]]; for (const [slot, value] of entries) if (value != null) children.push(jsx().jsx("div", { slot, children: value })); } if (props.renderAnnotation != null) for (const [index, annotation] of (props.lineAnnotations ?? []).entries()) children.push(jsx().jsx("div", { slot: props.getAnnotationSlotName?.(annotation) ?? `line-${annotation.line ?? index}`, children: props.renderAnnotation(annotation) }, index)); if (props.renderGutterUtility != null) children.push(jsx().jsx("div", { slot: "gutter-utility-slot", children: props.renderGutterUtility(props.getHoveredLine) })); return jsx().jsx(jsx().Fragment, { children }); }
function initialize(): void {}
export { RenderFileChildren as n, initialize as t };
