import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as joinClasses, type JsxRuntime } from "@rchunk/app-shared";

interface SurfaceProps extends Record<string, unknown> { as?: string; children?: unknown; className?: string; style?: Record<string, unknown> }
interface HeaderActionProps { activeLabel?: string; children?: unknown; disabled?: boolean; expanded?: boolean; label: string; onClick?(): void; pressed?: boolean; showActiveBackground?: boolean; size?: "compact" | "default"; testId?: string }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function o({ as = "div", className, ...props }: SurfaceProps): unknown { return jsx().jsx(as, { ...props, "data-popcorn-header-surface": "", className: joinClasses("inline-flex h-8 shrink-0 items-center rounded-xl bg-surface-elevated-secondary/90", as === "button" && "cursor-interaction", className) }); }
function r(): unknown { return jsx().jsx("span", { "aria-hidden": true, "data-popcorn-header-divider": "", className: "h-5 w-px shrink-0 bg-border" }); }
function i({ title, trailingContent }: { title: unknown; trailingContent?: unknown }): unknown { return o({ className: "max-w-full gap-2 px-2", children: [jsx().jsx("span", { className: "truncate px-1 py-1", children: title }), trailingContent == null ? null : jsx().jsxs(jsx().Fragment, { children: [r(), trailingContent] })] }); }
function n({ ariaLabel, children, trailingContent }: { ariaLabel: string; children?: unknown; trailingContent?: unknown }): unknown { return o({ "aria-label": ariaLabel, className: "max-w-full px-2", role: "toolbar", children: jsx().jsxs("div", { className: "flex items-center gap-2", children: [children, trailingContent == null ? null : jsx().jsxs(jsx().Fragment, { children: [r(), trailingContent] })] }) }); }
function t({ activeLabel, children, disabled = false, expanded, label, onClick, pressed, showActiveBackground = true, size = "compact", testId }: HeaderActionProps): unknown {
  const active = pressed === true && activeLabel != null;
  const accessibleLabel = active ? activeLabel : label;
  return jsx().jsx("button", { type: "button", "data-popcorn-header-action": "", "data-active-label": active || undefined, "aria-label": accessibleLabel, "aria-expanded": expanded, "aria-pressed": pressed, "data-testid": testId, disabled, onClick, title: accessibleLabel, className: joinClasses("inline-flex items-center", size === "compact" ? "h-6 min-w-6 rounded-md" : "h-7 min-w-7 rounded-full", showActiveBackground && (expanded || pressed) && "bg-text-info/10 text-info"), children: [children, activeLabel == null ? null : jsx().jsx("span", { children: accessibleLabel })] });
}
function s(): void {}
function a(): void {}
export { a, i, n, o, r, s, t };
