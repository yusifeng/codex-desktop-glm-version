import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

interface ConversationThumbnailProps { draft?: string; requestExcerpt?: string | null; responseExcerpt?: string | null; statusState: { type: "error" | "idle" | "loading"; unread?: boolean; unreadCount?: number }; title: string; waitingFor?: "waitingOnApproval" | "waitingOnUserInput" | null }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function statusLabel(props: ConversationThumbnailProps): string | null {
  if (props.waitingFor === "waitingOnApproval") return "Awaiting approval";
  if (props.waitingFor === "waitingOnUserInput") return "Needs input";
  if (props.statusState.type === "error") return "Task failed";
  if (props.statusState.type === "loading") return "Working";
  if (props.draft) return "Draft";
  return props.statusState.unread || (props.statusState.unreadCount ?? 0) > 0 ? "Unread response" : null;
}
function ConversationThumbnail(props: ConversationThumbnailProps): unknown {
  const label = statusLabel(props);
  if (!props.responseExcerpt && !props.requestExcerpt && props.statusState.type === "idle" && label == null && !props.draft) return null;
  const request = props.draft && props.statusState.type === "idle" && props.waitingFor == null ? props.draft : props.requestExcerpt;
  return jsx().jsxs("article", { "aria-label": props.title, "data-status": props.statusState.type, children: [jsx().jsx("h3", { children: props.title }), label == null ? null : jsx().jsx("span", { children: label }), request == null ? null : jsx().jsx("blockquote", { children: request.slice(0, 300) }), props.draft ? null : props.responseExcerpt == null ? null : jsx().jsx("p", { children: props.responseExcerpt.slice(0, 600) })] });
}
function initializeConversationThumbnailUi(): void { void jsx(); }
export { initializeConversationThumbnailUi as n, ConversationThumbnail as t };
