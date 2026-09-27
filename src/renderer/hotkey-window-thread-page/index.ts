import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/local-conversation-stream-role-product-event";
import "@rchunk/virtualized-turn-list";
import "@rchunk/local-conversation-thread";
import "@rchunk/use-hotkey-window-detail-layout";

export interface HotkeyWindowThreadPageProps { conversationId?: string; title?: string; projectLabel?: string; mainWindowPath?: string; children?: unknown; onBack?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function HotkeyWindowThreadPage(props: HotkeyWindowThreadPageProps): unknown {
  const runtime = ensureJsx();
  if (!props.conversationId) return runtime.jsx("a", { "data-redirect": true, href: props.mainWindowPath ?? "/", children: "Open Codex" });
  return runtime.jsxs("main", { className: "hotkey-window-thread-page", "data-conversation-id": props.conversationId, children: [runtime.jsxs("header", { children: [runtime.jsx("button", { type: "button", onClick: props.onBack, children: "Back" }), runtime.jsxs("div", { children: [runtime.jsx("h1", { children: props.title ?? "Conversation" }), props.projectLabel ? runtime.jsx("span", { children: props.projectLabel }) : null] })] }), runtime.jsx("section", { className: "hotkey-window-thread", children: props.children })] });
}

export { HotkeyWindowThreadPage };
