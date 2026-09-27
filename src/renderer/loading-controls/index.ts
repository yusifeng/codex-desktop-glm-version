import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
interface EditorHeaderControls { annotationControl: unknown; commentsControl: unknown; editingControls: unknown; navigationControl: unknown; supplementalActions: unknown; zoomControl: unknown }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ paginated }: { paginated: boolean }): EditorHeaderControls { const placeholder = (kind: string) => jsx().jsx("span", { inert: true, "aria-hidden": true, "data-control": kind }); return { annotationControl: null, commentsControl: null, editingControls: null, navigationControl: paginated ? placeholder("navigation") : null, supplementalActions: null, zoomControl: placeholder("zoom") }; }
function n(): void {}
export { n, t };
