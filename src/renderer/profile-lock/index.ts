import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
let jsx: JsxRuntime;
function ProfileLockIcon(props: { className?: string; title?: string } = {}): unknown { const runtime = ensureJsx(); return runtime.jsx("svg", { "aria-label": props.title, className: props.className, role: props.title == null ? undefined : "img", viewBox: "0 0 18 18", children: runtime.jsxs("g", { children: [runtime.jsx("path", { d: "M4 8h10v8H4z", fill: "currentColor" }), runtime.jsx("path", { d: "M6 8V5a3 3 0 0 1 6 0v3", fill: "none", stroke: "currentColor" })] }) }); }
const initialize = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { initialize as n, ProfileLockIcon as t };
