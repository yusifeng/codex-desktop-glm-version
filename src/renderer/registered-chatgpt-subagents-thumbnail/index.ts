import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-subagent-final-response-query";
import "@rchunk/conversation-thumbnail-ui";
import "@rchunk/subagent-row";
import type { ChatGptSubagent, SubagentStatus } from "@rchunk/chatgpt-subagents-panel";
export interface RegisteredChatGptSubagentsThumbnailProps { conversationId: string; responseExcerpt?: string | null; selectedThreadId?: string | null; subagents?: readonly ChatGptSubagent[] | null; title?: string }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function statusPriority(status: SubagentStatus): number { return status === "working" ? 0 : status === "waiting" ? 1 : status === "failed" ? 2 : 3; }
function RegisteredChatGptSubagentsThumbnail({ conversationId, responseExcerpt, selectedThreadId = null, subagents, title = "Subagents" }: RegisteredChatGptSubagentsThumbnailProps): unknown { if (subagents == null) return null; if (selectedThreadId != null) { const selected = subagents.find(item => item.threadId === selectedThreadId); return jsx().jsxs("article", { "data-conversation-id": conversationId, "data-status": selected?.status ?? "failed", children: [jsx().jsx("h3", { children: selected?.displayName ?? "Subagent" }), jsx().jsx("p", { children: responseExcerpt ?? selected?.statusMessage ?? selected?.prompt ?? null })] }); } if (subagents.length === 0) return null; return jsx().jsxs("article", { "data-conversation-id": conversationId, children: [jsx().jsx("h3", { children: title }), jsx().jsx("ul", { children: [...subagents].sort((left, right) => statusPriority(left.status) - statusPriority(right.status)).slice(0, 4).map(item => jsx().jsxs("li", { "data-status": item.status, children: [item.displayName ?? "Subagent", jsx().jsx("span", { className: "sr-only", children: item.status })] }, item.threadId)) })] }); }
export { RegisteredChatGptSubagentsThumbnail };
