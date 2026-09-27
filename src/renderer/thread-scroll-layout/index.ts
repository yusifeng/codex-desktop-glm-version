import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/thread-scroll-controller-context-value";

export interface ThreadScrollLayoutProps { active?: boolean; autoLoadHistory?: boolean; children?: unknown; footer?: unknown; hideScrollbar?: boolean; initialOffset?: number; onScroll?(event: unknown): void; onUserScrollToTop?(): void; presentation?: "compact" | "default"; renderLayout?(parts: { content: unknown; footer: unknown; scrollToBottomButton: unknown }): unknown; scrollToBottomButton?: unknown; threadEndContent?: unknown }
let jsx: JsxRuntime;
function ThreadScrollLayout(props: ThreadScrollLayoutProps): unknown { const runtime = ensureJsx(); const content = runtime.jsxs("div", { className: props.presentation === "compact" ? "thread-scroll-content compact" : "thread-scroll-content", children: [props.children, props.threadEndContent] }); const layout = { content, footer: props.footer, scrollToBottomButton: props.scrollToBottomButton }; return props.renderLayout?.(layout) ?? runtime.jsxs("section", { className: props.hideScrollbar ? "thread-scroll-layout hide-scrollbar" : "thread-scroll-layout", "data-active": props.active !== false, onScroll: props.onScroll, children: [content, props.scrollToBottomButton, props.footer] }); }
const initialize = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { initialize as n, ThreadScrollLayout as t };
