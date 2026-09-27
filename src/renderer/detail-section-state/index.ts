import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface DetailSectionStateProps extends Record<string, unknown> { children?: unknown; className?: string; tone?: "danger" | "secondary" }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ children, className = "", tone = "secondary", ...rest }: DetailSectionStateProps): unknown { return jsx().jsx("div", { ...rest, className: `detail-section-state ${tone === "danger" ? "text-danger" : "text-secondary"} ${className}`.trim(), children }); }
function n(): void {}
export { n, t };
