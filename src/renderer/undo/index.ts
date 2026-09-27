import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
const jsx = getJsxRuntime();
function UndoIcon(props: Record<string, unknown> = {}): unknown { return jsx.jsx("svg", { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none", ...props, children: jsx.jsx("path", { d: "M16 10.8a4.3 4.3 0 0 0-4.3-4.3H4.9l2.2 2.2-.9.9-3.3-3.3 3.3-3.3.9.9-2.2 2.2h6.8a5.7 5.7 0 0 1 0 11.4H8.3v-1.3h3.4a4.3 4.3 0 0 0 4.3-4.4Z", fill: "currentColor" }) }); }
function initializeUndoIcon(): void { getReactRuntime(); }
export { initializeUndoIcon as n, UndoIcon as t };
