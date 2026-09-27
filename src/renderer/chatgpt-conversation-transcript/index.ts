import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/timestamp-separator";
import "@rchunk/artifact-viewer";

export interface TranscriptTurn { id: string; role: "assistant" | "system" | "user"; text?: string; timestamp?: string | number; [key: string]: unknown }
export interface ChatgptConversationTranscriptProps { conversationId: string; emptyState?: unknown; pendingSubmission?: { text?: string } | null; renderMode?: "conversation" | "sidebar"; turns?: TranscriptTurn[]; }
let jsx: JsxRuntime;
function ChatgptConversationTranscript(props: ChatgptConversationTranscriptProps): unknown { const runtime = ensureJsx(); const turns = props.turns ?? []; if (turns.length === 0 && props.pendingSubmission == null) return props.emptyState ?? null; return runtime.jsxs("div", { className: "chatgpt-conversation-transcript", "data-conversation-id": props.conversationId, "data-render-mode": props.renderMode ?? "sidebar", children: [turns.map((turn) => runtime.jsxs("article", { "data-turn-id": turn.id, "data-role": turn.role, children: [turn.timestamp == null ? null : runtime.jsx("time", { children: String(turn.timestamp) }), runtime.jsx("p", { children: turn.text })] }, turn.id)), props.pendingSubmission == null ? null : runtime.jsx("article", { "data-pending": true, children: props.pendingSubmission.text })] }); }
const initialize = (): void => { jsx = getJsxRuntime(); };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
export { initialize as n, ChatgptConversationTranscript as t };
