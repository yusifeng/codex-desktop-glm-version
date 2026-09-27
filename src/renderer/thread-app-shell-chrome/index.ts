import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/thread-shell-runtime";
import "@rchunk/thread-panel-toggle-button";

export interface ThreadAppShellChromeProps { children?: unknown; leading?: unknown; onToggleSidePanel?(): void; showReviewTab?: boolean; sidePanelOpen?: boolean; threadType: "local" | "new" | "remote"; title?: unknown; trailing?: unknown }
let jsx: JsxRuntime;
function ThreadAppShellChrome(props: ThreadAppShellChromeProps): unknown { const runtime = ensureJsx(); return runtime.jsxs("div", { className: `thread-app-shell thread-${props.threadType}`, children: [runtime.jsxs("header", { className: "thread-app-shell-toolbar", children: [props.leading, runtime.jsx("div", { className: "thread-app-shell-title", children: props.title }), props.showReviewTab ? runtime.jsx("button", { type: "button", children: "Review" }) : null, runtime.jsx("button", { type: "button", "aria-pressed": props.sidePanelOpen, "aria-label": "Toggle side panel", onClick: props.onToggleSidePanel, children: "Side panel" }), props.trailing] }), props.children] }); }
const initialize = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { initialize as n, ThreadAppShellChrome as t };
