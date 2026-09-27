import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/popcorn-icons";
import "@rchunk/app-primary";
import "@rchunk/arrow-rotate-ccw";
interface Annotation { id: string; prompt?: string; selected?: boolean }
interface AnnotationControlsProps { annotations?: Annotation[]; busy?: boolean; currentIndex?: number; onAcceptAll?(): void; onCancel?(): void; onNavigate?(index: number): void; onSend?(annotations: Annotation[]): Promise<void> | void; onStop?(): Promise<void> | void; onUndo?(): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function selected(annotations: Annotation[]): Annotation[] { const explicitlySelected = annotations.filter(annotation => annotation.selected); return explicitlySelected.length === 0 ? annotations : explicitlySelected; }
function t({ annotations = [], busy = false, currentIndex = 0, onAcceptAll, onCancel, onNavigate, onSend, onStop, onUndo }: AnnotationControlsProps): unknown { const chosen = selected(annotations); return jsx().jsxs("section", { "aria-label": "Artifact review", children: [jsx().jsx("span", { children: `${annotations.length} annotations` }), jsx().jsx("button", { disabled: currentIndex <= 0, onClick: () => onNavigate?.(currentIndex - 1), type: "button", children: "Previous request" }), jsx().jsx("button", { disabled: currentIndex >= annotations.length - 1, onClick: () => onNavigate?.(currentIndex + 1), type: "button", children: "Next request" }), jsx().jsx("button", { onClick: onUndo, type: "button", children: "Undo" }), jsx().jsx("button", { onClick: onAcceptAll, type: "button", children: "Accept all" }), jsx().jsx("button", { onClick: onCancel, type: "button", children: "Cancel" }), busy ? jsx().jsx("button", { onClick: onStop, type: "button", children: "Stop" }) : jsx().jsx("button", { disabled: chosen.length === 0, onClick: () => onSend?.(chosen), type: "button", children: "Send" })] }); }
const a = t;
const i = t;
const o = t;
const r = t;
const s = t;
function n(): void {}
export { a, i, n, o, r, s, t };
