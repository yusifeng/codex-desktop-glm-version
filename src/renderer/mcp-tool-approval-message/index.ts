import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/app-connect-modal";
import "@rchunk/app-connect-modal-by-id";
import "@rchunk/apps-availability";
import "@rchunk/app-connect-availability";
import "@rchunk/first-app-connect-ambient-suggestions";
import "@rchunk/security-src";
import "@rchunk/use-app-connect-flow";

interface ApprovalCardProps { description?: unknown; icon?: unknown; isPrimaryActionLoading?: boolean; primaryActionLabel: string; secondaryActionLabel?: string; showDeclineShortcut?: boolean; title: unknown; onDecline(): void; onPrimaryActionClick?(): void; onSubmit(): void }
interface ApprovalReplyProps { conversationId: string; hostId: string; requestId: string; onReply?(reply: "accept" | "decline"): Promise<void> | void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function ApprovalCard(props: ApprovalCardProps): unknown { return jsx().jsxs("section", { "data-approval-card": true, children: [jsx().jsx("header", { children: props.title }), jsx().jsx("div", { children: props.description }), jsx().jsxs("footer", { children: [jsx().jsx("button", { type: "button", onClick: props.onDecline, children: props.secondaryActionLabel ?? "Decline" }), jsx().jsx("button", { type: "button", disabled: props.isPrimaryActionLoading, onClick: props.onPrimaryActionClick ?? props.onSubmit, children: props.isPrimaryActionLoading ? "Working…" : props.primaryActionLabel })] })] }); }
function replyCard(props: ApprovalReplyProps & { description: unknown; primaryActionLabel: string; title: string }): unknown { const reply = (value: "accept" | "decline") => props.onReply?.(value); return ApprovalCard({ title: props.title, description: props.description, primaryActionLabel: props.primaryActionLabel, onDecline: () => { void reply("decline"); }, onSubmit: () => { void reply("accept"); } }); }
function ToolSuggestionApproval(props: ApprovalReplyProps & { suggestion: { tool_name?: string; tool_title?: string } }): unknown { return replyCard({ ...props, title: props.suggestion.tool_title ?? props.suggestion.tool_name ?? "Tool required", description: "Enable this tool to continue", primaryActionLabel: "Enable" }); }
function ConnectorAuthorizationApproval(props: ApprovalReplyProps & { auth: { connector?: { connector_name?: string }; reason?: string } }): unknown { const name = props.auth.connector?.connector_name ?? "this app"; return replyCard({ ...props, title: `Connect ${name}`, description: props.auth.reason ?? `ChatGPT needs access to ${name}`, primaryActionLabel: "Connect" }); }
function UrlActionApproval(props: ApprovalReplyProps & { action: { message?: string; url: string } }): unknown { return replyCard({ ...props, title: "Action required", description: `${props.action.message ?? "Open the requested link"} ${props.action.url}`, primaryActionLabel: "Open link" }); }
function AuthorizationScopes({ authorization }: { authorization: { origin: string; scopes: Array<{ label: string; scope: string }> } }): unknown { return jsx().jsxs("div", { children: [jsx().jsx("p", { children: `Allow ${authorization.origin} to:` }), jsx().jsx("ul", { children: authorization.scopes.map(scope => jsx().jsx("li", { children: scope.label }, scope.scope)) })] }); }
function ElicitationMessage({ message }: { message: { descriptor?: { defaultMessage?: string }; values?: Record<string, unknown>; url?: string } }): unknown { return jsx().jsx("span", { children: message.descriptor?.defaultMessage ?? String(message.values?.message ?? message.url ?? "") }); }
function GenericApproval(props: ApprovalReplyProps & { title?: string; message?: string }): unknown { return replyCard({ ...props, title: props.title ?? "Approval required", description: props.message ?? "Review this request", primaryActionLabel: "Approve" }); }
function initializeApprovalRuntime(): void { void jsx(); }
export { ToolSuggestionApproval as a, initializeApprovalRuntime as c, AuthorizationScopes as d, initializeApprovalRuntime as f, initializeApprovalRuntime as i, ApprovalCard as l, initializeApprovalRuntime as n, GenericApproval as o, UrlActionApproval as r, ConnectorAuthorizationApproval as s, ElicitationMessage as t, initializeApprovalRuntime as u };
