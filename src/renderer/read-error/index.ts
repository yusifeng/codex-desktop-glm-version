import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/detail-section-state";
interface ReadErrorProps { children?: unknown; loading?: boolean; onRetry?(): void }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ children = "Unable to load this section", loading = false, onRetry }: ReadErrorProps): unknown { return jsx().jsxs("div", { role: "alert", children: [children, onRetry == null ? null : jsx().jsx("button", { type: "button", disabled: loading, onClick: onRetry, children: loading ? "Trying again…" : "Try again" })] }); }
function n(): void {}
export { n, t };
