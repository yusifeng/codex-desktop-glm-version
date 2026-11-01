import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as connectModalChunk from "@rchunk/app-connect-modal";
import * as connectModalByIdChunk from "@rchunk/app-connect-modal-by-id";
import * as appsAvailabilityChunk from "@rchunk/apps-availability";
import * as connectAvailabilityChunk from "@rchunk/app-connect-availability";
import * as ambientSuggestionsChunk from "@rchunk/first-app-connect-ambient-suggestions";
import * as securityChunk from "@rchunk/security-src";
import * as appConnectFlowChunk from "@rchunk/use-app-connect-flow";

interface ApprovalCardProps { description?: unknown; icon?: unknown; isPrimaryActionLoading?: boolean; primaryActionLabel: string; secondaryActionLabel?: string; showDeclineShortcut?: boolean; title: unknown; onDecline(): void; onPrimaryActionClick?(): void; onSubmit(): void }
interface ApprovalReplyProps { conversationId: string; hostId: string; requestId: string; onReply?(reply: "accept" | "decline"): Promise<void> | void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function callInitializer(value: unknown): void { if (typeof value === "function") value(); }
function initializeAll(values: unknown[]): void { for (const value of values) callInitializer(value); }

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
          jsx().jsxs(Button, { autoFocus, color: "primary", size: "toolbar", type: "submit", loading: props.isPrimaryActionLoading, onClick: props.onPrimaryActionClick, children: [jsx().jsx("span", { children: props.primaryActionLabel }), canUseShortcuts ? shortcut(approveKeys) : null] }),
        ] }),
      ],
    }),
  });
}
function createReplyHandler(props: ApprovalReplyProps): (value: "accept" | "decline") => Promise<void> {
  const scope = (sharedChunk as any).LX?.((sharedChunk as any).ZI);
  const react = (sharedChunk as any).e6?.();
  const replying = react?.useRef?.(false) ?? { current: false };
  return async (value: "accept" | "decline"): Promise<void> => {
    if (replying.current) return;
    replying.current = true;
    try {
      if (props.onReply != null) await props.onReply(value);
      else {
        const response = (initialChunk as any).Wgn?.(value) ?? value;
        await (initialChunk as any).Ugn(scope, props.hostId).replyWithMcpServerElicitationResponse(props.conversationId, props.requestId, response);
      }
    } catch {
      replying.current = false;
    }
  };
}
function stagedConnectionCard(props: ApprovalReplyProps & { begin(): Promise<void> | void; description: unknown; primaryActionLabel: string; title: string }): unknown {
  const react = (sharedChunk as any).e6?.();
  const [started, setStarted] = react?.useState?.(false) ?? [false, () => undefined];
  const startedRef = react?.useRef?.(false) ?? { current: false };
  const reply = createReplyHandler(props);
  const submit = async (): Promise<void> => {
    if (started || (react?.useState == null && startedRef.current)) {
      await reply("accept");
      return;
    }
    startedRef.current = true;
    setStarted(true);
    try { await props.begin(); }
    catch { startedRef.current = false; setStarted(false); }
  };
  return ApprovalCard({
    title: props.title,
    description: props.description,
    primaryActionLabel: started ? "Continue" : props.primaryActionLabel,
    secondaryActionLabel: "Decline",
    onDecline: () => { void reply("decline"); },
    onSubmit: () => { void submit(); },
  });
}
function ToolSuggestionApproval(props: ApprovalReplyProps & { suggestion: { install_url?: string; tool_id?: string; tool_name?: string; tool_title?: string; tool_type?: string } }): unknown {
  const flow = (appConnectFlowChunk as any).n?.({ hostId: props.hostId });
  const title = props.suggestion.tool_title ?? props.suggestion.tool_name ?? "Tool required";
  return stagedConnectionCard({
    ...props,
    title,
    description: "Enable this tool to continue",
    primaryActionLabel: "Enable",
    begin: async () => {
      if (props.suggestion.install_url != null && typeof flow?.handleOpenAppUrl === "function") flow.handleOpenAppUrl(props.suggestion.install_url);
      else if (props.suggestion.tool_type === "connector" && typeof flow?.handleConnectApp === "function") await flow.handleConnectApp({ id: props.suggestion.tool_id, name: title });
    },
  });
}
function ConnectorAuthorizationApproval(props: ApprovalReplyProps & { auth: { connector?: { connector_id?: string; connector_name?: string; install_url?: string }; reason?: string } }): unknown {
  const flow = (appConnectFlowChunk as any).n?.({ hostId: props.hostId });
  const connector = props.auth.connector;
  const name = connector?.connector_name ?? "this app";
  return stagedConnectionCard({
    ...props,
    title: `Connect ${name}`,
    description: props.auth.reason ?? `ChatGPT needs access to ${name}`,
    primaryActionLabel: "Connect",
    begin: async () => {
      if (connector?.install_url != null && typeof flow?.handleOpenAppUrl === "function") flow.handleOpenAppUrl(connector.install_url);
      else if (connector != null && typeof flow?.handleConnectApp === "function") await flow.handleConnectApp({ id: connector.connector_id, name });
    },
  });
}
function UrlActionApproval(props: ApprovalReplyProps & { action: { message?: string; url: string } }): unknown {
  const react = (sharedChunk as any).e6?.();
  const openedRef = react?.useRef?.(false) ?? { current: false };
  const [opened, setOpened] = react?.useState?.(false) ?? [false, () => undefined];
  const reply = createReplyHandler(props);
  const openLink = (): void => {
    if (openedRef.current) return;
    openedRef.current = true;
    setOpened(true);
    (initialChunk as any).kft?.({ href: props.action.url, initiator: "mcp_app_resource" });
  };
  const submit = (): void => {
    if (opened || (react?.useState == null && openedRef.current)) {
      void reply("accept");
      return;
    }
    openLink();
  };
  const primaryClick = (event?: { preventDefault?(): void }): void => {
    if (opened) return;
    event?.preventDefault?.();
    openLink();
  };
  const description = jsx().jsxs("div", { className: "flex min-w-0 flex-col gap-1", children: [
    jsx().jsx("div", { children: props.action.message }),
    jsx().jsxs("div", { className: "flex min-w-0 gap-2 text-size-chat-sm leading-5", children: [
      jsx().jsx("span", { className: "shrink-0", children: "URL" }),
      jsx().jsx("span", { className: "min-w-0 wrap-anywhere text-default", children: props.action.url }),
    ] }),
  ] });
  return ApprovalCard({
    icon: jsx().jsx((sharedChunk as any).S_ ?? "span", { className: "text-secondary", "aria-hidden": false, asset: (sharedChunk as any).Tl }),
    title: "Action required",
    description,
    primaryActionLabel: opened ? "Continue" : "Open link",
    onDecline: () => { void reply("decline"); },
    onPrimaryActionClick: primaryClick,
    onSubmit: submit,
  });
}
function AuthorizationScopes({ authorization }: { authorization: { origin: string; scopes: Array<{ label: string; scope: string }> } }): unknown {
  const FormattedMessage = (sharedChunk as any).Y2 ?? "span";
  const scopeDescriptors = new Map(Object.entries((securityChunk as any).r ?? {}));
  return jsx().jsxs("div", { className: "flex flex-col gap-2", children: [
    jsx().jsx("div", { className: "text-sm wrap-anywhere text-secondary", children: (sharedChunk as any).Y2 == null ? `Allow ${authorization.origin} to:` : jsx().jsx(FormattedMessage, { id: "settings.mcp.appConnectConsent.sitePermissions", defaultMessage: "Allow {origin} to:", values: { origin: authorization.origin } }) }),
    jsx().jsx("ul", { className: "flex flex-col gap-1", children: authorization.scopes.map(scope => {
      const descriptor = scopeDescriptors.get(scope.scope);
      return jsx().jsx("li", { className: "text-sm text-default", children: descriptor == null ? scope.label : jsx().jsx(FormattedMessage, { ...(descriptor as Record<string, unknown>) }) }, scope.scope);
    }) }),
  ] });
}
function ElicitationMessage({ message }: { message: { descriptor?: { defaultMessage?: string }; values?: Record<string, unknown>; url?: string } }): unknown {
  const values = message.url == null ? message.values : { ...message.values, link: (children: unknown) => jsx().jsx((initialChunk as any).Jot ?? "a", { className: "cursor-interaction text-info underline underline-offset-2", href: message.url, initiator: "mcp_app_resource", children }) };
  const FormattedMessage = (sharedChunk as any).Y2;
  return FormattedMessage == null
    ? jsx().jsx("span", { children: message.descriptor?.defaultMessage ?? String(message.values?.message ?? message.url ?? "") })
    : jsx().jsx(FormattedMessage, { ...message.descriptor, values });
}
let approvalCardInitialized = false;
function initializeApprovalCard(): void {
  if (approvalCardInitialized) return;
  approvalCardInitialized = true;
  initializeAll([(sharedChunk as any).$3, (sharedChunk as any).FX, (sharedChunk as any).K2,
    (initialChunk as any).aet, (primaryChunk as any).$t, (primaryChunk as any).aa,
    (sharedChunk as any).Zh, (sharedChunk as any).h_]);
  void jsx();
}
let authorizationScopesInitialized = false;
function initializeAuthorizationScopes(): void { if (!authorizationScopesInitialized) { authorizationScopesInitialized = true; callInitializer((securityChunk as any).t); callInitializer((sharedChunk as any).K2); void jsx(); } }
let connectorAuthorizationInitialized = false;
function initializeConnectorAuthorizationApproval(): void {
  if (connectorAuthorizationInitialized) return;
  connectorAuthorizationInitialized = true;
  initializeAll([(sharedChunk as any).$3, (sharedChunk as any).ni, (sharedChunk as any).SL,
    (sharedChunk as any).FX, (sharedChunk as any).wL, (initialChunk as any).wfn,
    (sharedChunk as any).e6, (sharedChunk as any).K2, (initialChunk as any).Wgn,
    (initialChunk as any).s6t, initializeAuthorizationScopes, (connectModalByIdChunk as any).r,
    (initialChunk as any).Ir, (initialChunk as any).d6t, (connectModalChunk as any).h,
    (connectAvailabilityChunk as any).r, (connectModalChunk as any).s,
    (connectAvailabilityChunk as any).t, (appConnectFlowChunk as any).t,
    (initialChunk as any).G6t, (initialChunk as any).Olt, (initialChunk as any).Dft,
    (sharedChunk as any).C_, (sharedChunk as any).lk, (initialChunk as any).B$,
    (initialChunk as any).HEt, (sharedChunk as any).QI, (connectModalChunk as any).n,
    (initialChunk as any).Bfn, (initialChunk as any).ifn, (sharedChunk as any).Z3,
    initializeApprovalCard]);
  void jsx();
}
let toolSuggestionInitialized = false;
function initializeToolSuggestionApproval(): void {
  if (toolSuggestionInitialized) return;
  toolSuggestionInitialized = true;
  initializeAll([(sharedChunk as any).$3, (sharedChunk as any).ni, (sharedChunk as any).SL,
    (sharedChunk as any).FX, (sharedChunk as any).wL, (initialChunk as any).wfn,
    (initialChunk as any).TDt, (sharedChunk as any).e6, (sharedChunk as any).K2,
    (initialChunk as any).Wgn, (initialChunk as any).Ir, (initialChunk as any).d6t,
    (appsAvailabilityChunk as any).n, (ambientSuggestionsChunk as any).n,
    (appConnectFlowChunk as any).t, (initialChunk as any).Olt, (sharedChunk as any).C_,
    (sharedChunk as any).lk, (initialChunk as any).y6t, (initialChunk as any).Ayt,
    (initialChunk as any).l6, (primaryChunk as any).Xh, (initialChunk as any).g2t,
    (initialChunk as any).L2, (initialChunk as any).Rwt, (initialChunk as any).i4t,
    (initialChunk as any).E4t, (initialChunk as any).B$, (initialChunk as any).HEt,
    (initialChunk as any).$2t, (sharedChunk as any).QI, (connectModalChunk as any).n,
    (initialChunk as any).ifn, (sharedChunk as any).Z3, initializeApprovalCard]);
  void jsx();
}
let urlActionInitialized = false;
function initializeUrlActionApproval(): void {
  if (urlActionInitialized) return;
  urlActionInitialized = true;
  initializeAll([(sharedChunk as any).$3, (sharedChunk as any).wl, (sharedChunk as any).FX,
    (initialChunk as any).wfn, (sharedChunk as any).e6, (sharedChunk as any).K2,
    (initialChunk as any).Wgn, (initialChunk as any).Dft, (sharedChunk as any).C_,
    (sharedChunk as any).QI, initializeApprovalCard]);
  void jsx();
}
let elicitationMessageInitialized = false;
function initializeElicitationMessage(): void {
  if (elicitationMessageInitialized) return;
  elicitationMessageInitialized = true;
  initializeAll([(sharedChunk as any).$3, (sharedChunk as any).K2, (initialChunk as any).Xot]);
  void jsx();
}
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
