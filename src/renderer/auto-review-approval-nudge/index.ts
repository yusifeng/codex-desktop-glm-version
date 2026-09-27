import "@rchunk/rolldown-runtime";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
interface Props { conversationId: string; hostId: string; learnMoreUrl?: string; onDismiss?(input: { conversationId: string; hostId: string }): void; onEnable?(input: { conversationId: string; hostId: string }): Promise<void> | void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function AutoReviewApprovalNudge({ conversationId, hostId, learnMoreUrl = "https://openai.com", onDismiss, onEnable }: Props): unknown { let pending = false; const enable = async () => { if (pending) return; pending = true; try { await onEnable?.({ conversationId, hostId }); } finally { pending = false; } }; return jsx().jsxs("form", { onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); void enable(); }, children: [jsx().jsxs("div", { children: [jsx().jsx("h2", { children: "Want fewer approval prompts?" }), jsx().jsxs("p", { children: ["ChatGPT can automatically approve eligible actions while it works. This may use more credits. ", jsx().jsx("a", { href: learnMoreUrl, children: "Learn more." })] })] }), jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", disabled: pending, onClick: () => onDismiss?.({ conversationId, hostId }), children: "Keep manual approvals" }), jsx().jsx("button", { type: "submit", disabled: pending, autoFocus: true, children: "Approve for me" })] })] }); }
export { AutoReviewApprovalNudge };
