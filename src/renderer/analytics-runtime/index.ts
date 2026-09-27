import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
interface AnalyticsScope { log?(descriptor: string, payload: Record<string, unknown>): void }
interface SharedPrompt { promptTextLength: number; shareId?: string; sourceConversationIsWorkMode?: boolean }
function metadata(value: SharedPrompt): Record<string, string | undefined> { return { hasShareId: "true", originalPromptTextLength: String(value.promptTextLength), shareId: value.shareId, shareSource: "shared_post", sourceConversationIsWorkMode: String(value.sourceConversationIsWorkMode === true) }; }
function a(scope: AnalyticsScope): void { scope.log?.("chatgpt_post_share_modal_shown", {}); }
function n(scope: AnalyticsScope, result: "failure" | "success", payload: Record<string, unknown> = {}): void { scope.log?.(result === "success" ? "chatgpt_post_share_copy_success" : "chatgpt_post_share_copy_failure", { shareType: "prompt-share", ...payload }); }
function r(scope: AnalyticsScope, shared: SharedPrompt): void { scope.log?.("chatgpt_share_prompt_link_landed", metadata(shared)); }
function i(scope: AnalyticsScope, shared: SharedPrompt, submittedLength?: number): void { scope.log?.("chatgpt_share_prompt_link_submitted", { ...metadata(shared), submittedPromptTextLength: submittedLength == null ? undefined : String(submittedLength) }); }
function t(): void {}
export { a, i, n, r, t };
