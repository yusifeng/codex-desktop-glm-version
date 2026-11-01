import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
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
function callInitializer(value: unknown): void { if (typeof value === "function") value(); }

/** 原 `kt`：审批卡片公共壳，含键盘审批注册、快捷键提示与加载态。 */
function ApprovalCard(props: ApprovalCardProps): unknown {
  const autoFocus = Boolean((primaryChunk as any).et?.());
  const canUseShortcuts = autoFocus && !props.isPrimaryActionLoading;
  const approveKeys = (sharedChunk as any).BX?.((initialChunk as any).net, "approval.approve");
  const declineKeys = (sharedChunk as any).BX?.((initialChunk as any).net, "approval.decline");
  (primaryChunk as any).$e?.({ enabled: canUseShortcuts, onApprove: props.onSubmit, onDecline: props.onDecline });
  const shortcut = (keys: unknown): unknown => keys == null ? null : jsx().jsx((sharedChunk as any).m_ ?? "kbd", { keysLabel: keys });
  const secondaryLabel = props.secondaryActionLabel ?? jsx().jsx((sharedChunk as any).Y2 ?? "span", {
    id: "composer.toolSuggestion.notNow", defaultMessage: "Not now", description: "Secondary action label for declining a suggestion-style request",
  });
  const Button = (sharedChunk as any).Yh ?? "button";
  const rootClass = "text-size-chat flex flex-col overflow-hidden rounded-xl border border-default bg-surface text-default";
  return jsx().jsx("div", {
    "data-approval-card": true,
    className: rootClass,
    children: jsx().jsxs("form", {
      className: "flex flex-wrap items-center gap-3 p-3",
      onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); props.onSubmit(); },
      children: [
        jsx().jsxs("div", { className: "flex min-w-0 flex-1 basis-64 items-center gap-3", children: [
          jsx().jsx("span", { className: "flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-secondary/92 text-secondary", children: props.icon }),
          jsx().jsxs("div", { className: "min-w-0 flex-1", children: [
            jsx().jsx("div", { className: "truncate text-size-chat font-medium text-default select-none", children: props.title }),
            props.description == null ? null : jsx().jsx("div", { className: "text-codex-description text-size-chat-sm", children: props.description }),
          ] }),
        ] }),
        jsx().jsxs("div", { className: "ms-auto flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2", children: [
          jsx().jsxs(Button, { color: "outline", disabled: props.isPrimaryActionLoading, size: "toolbar", type: "button", onClick: props.onDecline, children: [jsx().jsx("span", { children: secondaryLabel }), props.showDeclineShortcut !== false && canUseShortcuts ? shortcut(declineKeys) : null] }),
          jsx().jsxs(Button, { autoFocus, color: "primary", size: "toolbar", type: "submit", loading: props.isPrimaryActionLoading, onClick: props.onPrimaryActionClick ?? props.onSubmit, children: [jsx().jsx("span", { children: props.primaryActionLabel }), canUseShortcuts ? shortcut(approveKeys) : null] }),
        ] }),
      ],
    }),
  });
}
function replyCard(props: ApprovalReplyProps & { description: unknown; primaryActionLabel: string; title: string }): unknown { const reply = (value: "accept" | "decline") => props.onReply?.(value); return ApprovalCard({ title: props.title, description: props.description, primaryActionLabel: props.primaryActionLabel, secondaryActionLabel: "Decline", onDecline: () => { void reply("decline"); }, onSubmit: () => { void reply("accept"); } }); }
function ToolSuggestionApproval(props: ApprovalReplyProps & { suggestion: { tool_name?: string; tool_title?: string } }): unknown { return replyCard({ ...props, title: props.suggestion.tool_title ?? props.suggestion.tool_name ?? "Tool required", description: "Enable this tool to continue", primaryActionLabel: "Enable" }); }
function ConnectorAuthorizationApproval(props: ApprovalReplyProps & { auth: { connector?: { connector_name?: string }; reason?: string } }): unknown { const name = props.auth.connector?.connector_name ?? "this app"; return replyCard({ ...props, title: `Connect ${name}`, description: props.auth.reason ?? `ChatGPT needs access to ${name}`, primaryActionLabel: "Connect" }); }
function UrlActionApproval(props: ApprovalReplyProps & { action: { message?: string; url: string } }): unknown { return replyCard({ ...props, title: "Action required", description: `${props.action.message ?? "Open the requested link"} ${props.action.url}`, primaryActionLabel: "Open link" }); }
function AuthorizationScopes({ authorization }: { authorization: { origin: string; scopes: Array<{ label: string; scope: string }> } }): unknown {
  const FormattedMessage = (sharedChunk as any).Y2 ?? "span";
  return jsx().jsxs("div", { className: "flex flex-col gap-2", children: [
    jsx().jsx("div", { className: "text-sm wrap-anywhere text-secondary", children: (sharedChunk as any).Y2 == null ? `Allow ${authorization.origin} to:` : jsx().jsx(FormattedMessage, { id: "settings.mcp.appConnectConsent.sitePermissions", defaultMessage: "Allow {origin} to:", values: { origin: authorization.origin } }) }),
    jsx().jsx("ul", { className: "flex flex-col gap-1", children: authorization.scopes.map(scope => jsx().jsx("li", { className: "text-sm text-default", children: scope.label }, scope.scope)) }),
  ] });
}
function ElicitationMessage({ message }: { message: { descriptor?: { defaultMessage?: string }; values?: Record<string, unknown>; url?: string } }): unknown {
  const values = message.url == null ? message.values : { ...message.values, link: (children: unknown) => jsx().jsx((initialChunk as any).Jot ?? "a", { className: "cursor-interaction text-info underline underline-offset-2", href: message.url, initiator: "mcp_app_resource", children }) };
  const FormattedMessage = (sharedChunk as any).Y2;
  return FormattedMessage == null
    ? jsx().jsx("span", { children: message.descriptor?.defaultMessage ?? String(message.values?.message ?? message.url ?? "") })
    : jsx().jsx(FormattedMessage, { ...message.descriptor, values });
}
function GenericApproval(props: ApprovalReplyProps & { title?: string; message?: string }): unknown { return replyCard({ ...props, title: props.title ?? "Approval required", description: props.message ?? "Review this request", primaryActionLabel: "Approve" }); }
let approvalCardInitialized = false;
function initializeApprovalCard(): void { if (!approvalCardInitialized) { approvalCardInitialized = true; void jsx(); } }
let authorizationScopesInitialized = false;
function initializeAuthorizationScopes(): void { if (!authorizationScopesInitialized) { authorizationScopesInitialized = true; void jsx(); } }
let connectorAuthorizationInitialized = false;
function initializeConnectorAuthorizationApproval(): void {
  if (connectorAuthorizationInitialized) return;
  connectorAuthorizationInitialized = true;
  initializeAuthorizationScopes();
  initializeApprovalCard();
  void jsx();
}
let toolSuggestionInitialized = false;
function initializeToolSuggestionApproval(): void {
  if (toolSuggestionInitialized) return;
  toolSuggestionInitialized = true;
  initializeApprovalCard();
  void jsx();
}
let urlActionInitialized = false;
function initializeUrlActionApproval(): void {
  if (urlActionInitialized) return;
  urlActionInitialized = true;
  initializeApprovalCard();
  void jsx();
}
let elicitationMessageInitialized = false;
function initializeElicitationMessage(): void { if (!elicitationMessageInitialized) { elicitationMessageInitialized = true; void jsx(); } }
export {
  ToolSuggestionApproval as a,
  initializeConnectorAuthorizationApproval as c,
  AuthorizationScopes as d,
  initializeAuthorizationScopes as f,
  initializeUrlActionApproval as i,
  ApprovalCard as l,
  initializeElicitationMessage as n,
  initializeToolSuggestionApproval as o,
  UrlActionApproval as r,
  ConnectorAuthorizationApproval as s,
  ElicitationMessage as t,
  initializeApprovalCard as u,
};
