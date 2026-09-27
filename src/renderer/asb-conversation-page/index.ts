import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/latest-turn-preview";
import "@rchunk/local-conversation-page";
import "@rchunk/thread-emoji";
import "@rchunk/local-conversation-thread";
import "@rchunk/thread-overflow-menu";
import "@rchunk/chatgpt-conversation-page-core";

export interface AsbConversationPageProps { conversationId?: string; hostId?: string; title?: string; archived?: boolean; readOnly?: boolean; children?: unknown; onRename?(title: string): void; onArchive?(): void; }
let jsx: JsxRuntime;
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }

function AsbConversationPage(props: AsbConversationPageProps): unknown {
  const runtime = ensureJsx();
  if (!props.conversationId) return runtime.jsx("main", { role: "alert", children: "Conversation not found" });
  return runtime.jsxs("main", { className: "asb-conversation-page", "data-conversation-id": props.conversationId, "data-host-id": props.hostId, "data-read-only": props.readOnly ?? false, children: [runtime.jsxs("header", { children: [runtime.jsx("span", { "aria-hidden": true, children: "💬" }), runtime.jsx("input", { "aria-label": "Conversation title", disabled: props.readOnly, value: props.title ?? "New conversation", onChange: (event: { currentTarget: { value: string } }) => props.onRename?.(event.currentTarget.value) }), runtime.jsx("button", { type: "button", disabled: props.readOnly, onClick: props.onArchive, children: props.archived ? "Archived" : "Archive" })] }), runtime.jsx("section", { className: "conversation-thread", children: props.children })] });
}

export { AsbConversationPage };
