import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ isDragActive = false }: { isDragActive?: boolean }): unknown { return jsx().jsx("svg", { "aria-hidden": true, focusable: "false", "data-active": isDragActive, children: jsx().jsx("rect", { x: 1, y: 1, width: "calc(100% - 2px)", height: "calc(100% - 2px)", rx: 15, fill: "none", stroke: "currentColor", strokeWidth: 1, strokeDasharray: "7 6.3" }) }); }
function n(): void {}
export { n, t };
