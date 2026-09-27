import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

interface AutoReviewApprovalNudgeProps { conversationId: string; hostId: string; learnMoreUrl?: string; onDismiss?(input: { conversationId: string; hostId: string }): void; onEnable?(input: { conversationId: string; hostId: string }): Promise<void> | void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function AutoReviewApprovalNudge({ conversationId, hostId, learnMoreUrl = "https://help.openai.com/", onDismiss, onEnable }: AutoReviewApprovalNudgeProps): unknown { const input = { conversationId, hostId }; return jsx().jsxs("form", { "aria-label": "Enable auto review approvals", onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); return onEnable?.(input); }, children: [jsx().jsx("p", { children: "Automatically approve safe review commands" }), jsx().jsx("a", { href: learnMoreUrl, children: "Learn more" }), jsx().jsx("button", { onClick: () => onDismiss?.(input), type: "button", children: "Not now" }), jsx().jsx("button", { type: "submit", children: "Enable" })] }); }
export { AutoReviewApprovalNudge };
