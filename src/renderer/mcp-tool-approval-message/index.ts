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
interface ConnectorRecord { id: string; installUrl?: string; isAccessible?: boolean; isEnabled?: boolean; name?: string }
interface PluginRecord { description?: string; displayName?: string; plugin: { enabled?: boolean; id: string; installed?: boolean; name?: string; remotePluginId?: string } }
interface ConnectorAuthorization {
  connector: {
    auth_reason?: "missing_link" | "oauth_upgrade_required" | string;
    connection_consent?: { origin: string; scopes: Array<{ label: string; scope: string }> };
    connector_id: string;
    connector_name?: string;
    install_url?: string;
    link_id?: string;
    requested_scopes?: string[];
  };
  reason?: string;
  url?: string;
}
interface ToolSuggestion {
  install_url?: string;
  remote_plugin_id?: string;
  suggest_type?: "enable" | "install";
  suggestion_id?: string;
  tool_id: string;
  tool_name?: string;
  tool_title?: string;
  tool_type?: "connector" | "plugin";
}
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
function list<Value>(value: unknown): Value[] { return Array.isArray(value) ? value as Value[] : []; }
function connectorReady(app: ConnectorRecord | null, requireEnabled: boolean): boolean {
  return app?.isAccessible === true && (!requireEnabled || app.isEnabled === true);
}
function pluginReady(plugin: PluginRecord | null, requireEnabled: boolean): boolean {
  return plugin?.plugin.installed === true && (!requireEnabled || plugin.plugin.enabled === true);
}
function showToast(notifications: any, kind: "danger" | "warning", message: string, toastId: string): void {
  notifications?.[kind]?.(message, { errorAnalytics: { toastId } });
}
function formatMessage(intl: any, defaultMessage: string, values?: Record<string, unknown>): string {
  return intl?.formatMessage?.({ defaultMessage }, values) ?? defaultMessage.replace(/\{(\w+)\}/g, (_match, key) => String(values?.[key] ?? `{${key}}`));
}
function connectModal(flow: any, props: ApprovalReplyProps, resumeTarget: Record<string, unknown>, onConnected: () => Promise<void>): unknown {
  const Modal = (connectModalChunk as any).t;
  if (typeof Modal !== "function" || flow?.connectingApp == null) return null;
  return jsx().jsx(Modal, {
    app: flow.connectingApp,
    hostId: props.hostId,
    onConnected,
    onExternalConnectStarted: flow.onExternalConnectStarted,
    onOAuthStarted: (event: Record<string, unknown>) => flow.handleAppConnectOAuthStarted?.({ ...event, resumeTarget }),
    onOpenChange: (open: boolean) => { if (!open) flow.clearConnectingApp?.(); },
  });
}
function ToolSuggestionApproval(props: ApprovalReplyProps & { suggestion: ToolSuggestion }): unknown {
  const react = (sharedChunk as any).e6?.();
  const notifications = (sharedChunk as any).HX?.((sharedChunk as any).pk);
  const intl = (sharedChunk as any).n4?.();
  const notify = (kind: "danger" | "warning", text: string, id: string): void => showToast(notifications, kind, text, id);
  const format = (text: string, values?: Record<string, unknown>): string => formatMessage(intl, text, values);
  const [loading, setLoading] = react?.useState?.(false) ?? [false, () => undefined];
  const stageRef = (react?.useRef?.("idle") ?? { current: "idle" }) as { current: "idle" | "started" };
  const reply = createReplyHandler(props);
  const suggestion = props.suggestion;
  const type = suggestion.tool_type ?? "connector";
  const action = suggestion.suggest_type ?? "enable";
  const title = suggestion.tool_title ?? suggestion.tool_name ?? "Tool required";
  const resumeTarget = { kind: "tool-suggestion-elicitation", conversationId: props.conversationId, requestId: props.requestId, response: (initialChunk as any).Wgn?.("accept") ?? "accept" };
  const appsQuery = (initialChunk as any).GEt?.({ enabled: type === "connector", hostId: props.hostId }) ?? {};
  const apps = list<ConnectorRecord>(appsQuery.data);
  const app = apps.find(candidate => candidate.id === suggestion.tool_id) ?? null;
  const pluginQuery = (initialChunk as any).N4t?.(props.hostId, undefined, { enabled: type === "plugin" }) ?? {};
  const plugins = list<PluginRecord>(pluginQuery.availablePlugins ?? pluginQuery.data);
  const plugin = plugins.find(candidate => candidate.plugin.id === suggestion.tool_id || candidate.plugin.remotePluginId === suggestion.remote_plugin_id) ?? null;
  const flow = (appConnectFlowChunk as any).n?.({ hostId: props.hostId, onExternalConnectStarted: () => { stageRef.current = "started"; } }) ?? {};
  const appToggle = (appsAvailabilityChunk as any).n?.({ hostId: props.hostId }) ?? {};
  const pluginToggle = (initialChunk as any).Vwt?.({ hostId: props.hostId }) ?? {};
  const pluginInstall = (initialChunk as any).U2?.() ?? {};
  const isReady = (nextApp = app, nextPlugin = plugin): boolean => type === "connector"
    ? connectorReady(nextApp, action === "enable")
    : pluginReady(nextPlugin, action === "enable");
  const refreshAndAccept = async (): Promise<void> => {
    setLoading(true);
    try {
      if (type === "connector") {
        const refreshed = list<ConnectorRecord>(await appsQuery.hardRefetchAppsList?.());
        const next = refreshed.find(candidate => candidate.id === suggestion.tool_id) ?? null;
        if (!connectorReady(next, action === "enable")) {
          notify("danger", format("{toolName} is not ready yet. Finish setting it up, then continue", { toolName: title }), "inlineToolSuggestionRequestCard.handleContinue.connectorNotReady");
          return;
        }
      } else {
        const refreshed = await (pluginQuery.refetch?.() ?? pluginQuery.reload?.());
        const available = list<PluginRecord>(refreshed?.availablePlugins ?? refreshed?.data ?? pluginQuery.availablePlugins);
        const next = available.find(candidate => candidate.plugin.id === suggestion.tool_id || candidate.plugin.remotePluginId === suggestion.remote_plugin_id) ?? null;
        if (!pluginReady(next, action === "enable")) {
          notify("danger", format("{toolName} is not ready yet. Finish setting it up, then continue", { toolName: title }), "inlineToolSuggestionRequestCard.handleContinue.pluginNotReady");
          return;
        }
      }
      await reply("accept");
    } catch {
      notify("danger", "Could not refresh this tool suggestion", "inlineToolSuggestionRequestCard.handleContinue.genericLoadError");
    } finally { setLoading(false); }
  };
  const start = async (): Promise<void> => {
    if (stageRef.current === "started" || isReady()) { await refreshAndAccept(); return; }
    setLoading(true);
    try {
      if (type === "connector") {
        stageRef.current = "started";
        if (action === "enable" && app != null) await appToggle.setAppEnabled?.({ appId: app.id, enabled: true });
        else if (app != null) await flow.handleConnectApp?.(app);
        else flow.handleOpenAppUrl?.(suggestion.install_url);
      } else if (action === "enable") {
        if (plugin == null) { notify("danger", "Could not load this plugin right now", "inlineToolSuggestionRequestCard.handlePrimaryAction.missingPlugin"); return; }
        stageRef.current = "started";
        await pluginToggle.setPluginEnabled?.({ pluginDisplayName: plugin.displayName ?? plugin.plugin.name ?? title, pluginId: plugin.plugin.id, plugin: plugin.plugin, enabled: true });
      } else {
        if (plugin == null) { notify("danger", "Could not load this plugin right now", "inlineToolSuggestionRequestCard.handleInstallPlugin.missingPlugin"); return; }
        stageRef.current = "started";
        await pluginInstall.installPlugin?.(plugin, { elicitationOwnsConnectorRefresh: true, hostId: props.hostId, origin: "in_conversation_elicitation" });
      }
    } catch {
      stageRef.current = "idle";
      notify("danger", `Could not ${action === "install" ? "install" : "enable"} ${title}`, "inlineToolSuggestionRequestCard.handlePrimaryAction.actionError");
    } finally { setLoading(false); }
  };
  const card = ApprovalCard({
    title: stageRef.current === "started" && action === "install" ? `Click Continue when you're done setting up ${title}` : title,
    description: type === "connector" ? app?.name == null ? "Connect this app to continue" : app.name : plugin?.description ?? "Enable this tool to continue",
    primaryActionLabel: stageRef.current === "started" || isReady() ? "Continue" : action === "install" ? "Install" : "Enable",
    isPrimaryActionLoading: loading,
    onDecline: () => { void reply("decline"); },
    onSubmit: () => { void start(); },
  });
  return jsx().jsxs(jsx().Fragment, { children: [card, connectModal(flow, props, resumeTarget, refreshAndAccept)] });
}
function ConnectorAuthorizationApproval(props: ApprovalReplyProps & { auth: ConnectorAuthorization }): unknown {
  const react = (sharedChunk as any).e6?.();
  const notifications = (sharedChunk as any).HX?.((sharedChunk as any).pk);
  const intl = (sharedChunk as any).n4?.();
  const notify = (kind: "danger" | "warning", text: string, id: string): void => showToast(notifications, kind, text, id);
  const format = (text: string, values?: Record<string, unknown>): string => formatMessage(intl, text, values);
  const [loading, setLoading] = react?.useState?.(false) ?? [false, () => undefined];
  const externalStarted = react?.useRef?.(false) ?? { current: false };
  const reply = createReplyHandler(props);
  const connector = props.auth.connector;
  const name = connector.connector_name ?? "this app";
  const queryHost = props.hostId === "durable" ? ((initialChunk as any).ugn ?? props.hostId) : props.hostId;
  const appsQuery = (initialChunk as any).GEt?.({ hostId: queryHost }) ?? {};
  const apps = list<ConnectorRecord>(appsQuery.data);
  const app = apps.find(candidate => candidate.id === connector.connector_id) ?? null;
  const resumeTarget = { kind: "connector-auth-elicitation", conversationId: props.conversationId, requestId: props.requestId };
  const flow = (appConnectFlowChunk as any).n?.({ hostId: props.hostId, onExternalConnectStarted: () => { externalStarted.current = true; } }) ?? {};
  const claimed = (initialChunk as any).Lr?.().isAppConnectCallbackClaimed?.(connector.connector_id, resumeTarget) === true;
  const pending = flow.isAppConnectPending?.(connector.connector_id, resumeTarget) === true;
  const continueMode = connector.connection_consent == null && (externalStarted.current || pending || claimed);
  const send = async (value: "accept" | "decline"): Promise<void> => {
    flow.clearPendingAppConnect?.({ appId: connector.connector_id, resumeTarget });
    await reply(value);
  };
  const refreshAndAccept = async (): Promise<void> => {
    setLoading(true);
    try {
      const refreshed = list<ConnectorRecord>(await appsQuery.hardRefetchAppsList?.());
      if (!connectorReady(refreshed.find(candidate => candidate.id === connector.connector_id) ?? null, false)) {
        notify("warning", format("{connectorName} is not ready yet. Finish signing in, then continue", { connectorName: name }), "inlineConnectorAuthRequestCard.handleContinue.connectorNotReady");
        return;
      }
      await send("accept");
    } catch {
      notify("danger", "Could not refresh this connector", "inlineConnectorAuthRequestCard.handleContinue.genericLoadError");
    } finally { setLoading(false); }
  };
  const start = async (): Promise<void> => {
    if (continueMode || externalStarted.current) { await refreshAndAccept(); return; }
    setLoading(true);
    try {
      if (connector.connection_consent != null) {
        await (initialChunk as any).Y3t?.({ connectorId: connector.connector_id, authorization: connector.connection_consent });
        await send("accept");
        void appsQuery.hardRefetchAppsList?.();
        return;
      }
      const startConnection = (initialChunk as any).l6t;
      if (typeof startConnection === "function") {
        const outcome = await startConnection({
          app: { id: connector.connector_id, installUrl: app?.installUrl ?? connector.install_url, name },
          authReason: connector.auth_reason,
          fallbackUrl: props.auth.url,
          linkId: connector.link_id,
          openInBrowser: (url: string) => flow.handleOpenAppUrl?.(url),
          queryClient: (sharedChunk as any).CL?.(),
          requestedScopes: connector.requested_scopes,
        });
        if (outcome?.kind === "connected-directly") { await send("accept"); return; }
        if (outcome?.kind === "oauth-started") flow.handleAppConnectOAuthStarted?.({ app: { id: connector.connector_id, name }, redirectUrl: outcome.redirectUrl, resumeTarget });
        if (outcome?.kind === "failed") notify("danger", "Could not start connector authentication", "composer.connectorAuth.startError");
        externalStarted.current = outcome?.kind === "oauth-started" || outcome?.kind === "browser-fallback";
        return;
      }
      externalStarted.current = true;
      if (app != null) await flow.handleConnectApp?.(app);
      else flow.handleOpenAppUrl?.(connector.install_url);
    } catch {
      externalStarted.current = false;
      notify("danger", `Could not connect ${name}`, "inlineConnectorAuthRequestCard.handlePrimaryAction.actionError");
    } finally { setLoading(false); }
  };
  const reason = connector.connection_consent != null
    ? AuthorizationScopes({ authorization: connector.connection_consent })
    : props.auth.reason ?? (connector.auth_reason === "oauth_upgrade_required" ? "Your current connection doesn't include the permissions needed for this request." : `ChatGPT needs access to ${name}`);
  const card = ApprovalCard({
    title: name,
    description: reason,
    primaryActionLabel: continueMode ? "Continue" : connector.auth_reason === "oauth_upgrade_required" ? "Update access" : connector.auth_reason === "missing_link" ? "Connect" : "Reconnect",
    isPrimaryActionLoading: loading || claimed,
    onDecline: () => { void send("decline"); },
    onSubmit: () => { void start(); },
  });
  return jsx().jsxs(jsx().Fragment, { children: [card, connectModal(flow, props, resumeTarget, refreshAndAccept)] });
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
    if (opened || openedRef.current) {
      void reply("accept");
      return;
    }
    openLink();
  };
  const primaryClick = (event?: { preventDefault?(): void }): void => {
    if (opened || openedRef.current) return;
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
