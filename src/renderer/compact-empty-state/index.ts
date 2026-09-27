import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface CompactEmptyStateProps { actions?: unknown; className?: string; contentClassName?: string; description?: unknown; icon: unknown; title: unknown }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t(props: CompactEmptyStateProps): unknown { return jsx().jsx("div", { className: `compact-empty-state ${props.className ?? ""}`.trim(), children: jsx().jsxs("div", { className: props.contentClassName, children: [jsx().jsx("div", { "data-slot": "icon", children: props.icon }), jsx().jsx("div", { "data-slot": "title", children: props.title }), props.description == null ? null : jsx().jsx("div", { "data-slot": "description", children: props.description }), props.actions == null ? null : jsx().jsx("div", { "data-slot": "actions", children: props.actions })] }) }); }
function n(): void {}
export { n, t };
