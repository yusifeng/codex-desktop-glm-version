import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
export interface ConversationNode { author?: { role?: string }; id?: string; end_turn?: boolean }
export interface ResumableConversation { async_status?: "streaming" | "unread" | string; conversation_id: string; current_node?: string | null; is_read_only?: boolean; mapping?: Record<string, unknown>; nodes?: readonly ConversationNode[] }
export interface CompletionResumeScope { getConversation(conversationId: string): ResumableConversation | null; resume(conversation: ResumableConversation, signal: AbortSignal, voiceContinuation?: unknown): Promise<ResumableConversation | void> }
function isResumable(conversation: ResumableConversation | null): conversation is ResumableConversation { const first = conversation?.nodes?.[0]; return Boolean(conversation && !conversation.is_read_only && first?.author?.role === "user" && first.id); }
async function resumeChatGptCompletion(scope: CompletionResumeScope, conversationId: string, voiceContinuation?: unknown, signal: AbortSignal = new AbortController().signal): Promise<ResumableConversation | void> { const conversation = scope.getConversation(conversationId); if (!isResumable(conversation) || signal.aborted) return; return scope.resume(conversation, signal, voiceContinuation); }
const completionResumeQuery = { getOptions(scope: CompletionResumeScope, conversationId: string): Record<string, unknown> { const conversation = scope.getConversation(conversationId); return { enabled: conversation != null, queryKey: ["chatgpt-completion-resume", conversationId, conversation?.current_node], retry: false, staleTime: 60_000, queryFn: ({ signal }: { signal: AbortSignal }) => resumeChatGptCompletion(scope, conversationId, undefined, signal) }; } } as const;
function initializeResumeChatGptCompletion(): void {}
export { initializeResumeChatGptCompletion as n, resumeChatGptCompletion as r, completionResumeQuery as t };
