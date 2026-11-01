import "@rchunk/rolldown-runtime";
import "@rchunk/country-codes";
import "@rchunk/google-logo";
import "@rchunk/connector-post-connect-dialog";
import { I3 as getJsxRuntime, e6 as ReactRuntime } from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";

interface ConnectorDefinition { connectorId: string; kind?: string; [key: string]: unknown }
interface ConnectorLink { [key: string]: unknown }
interface CompanionConnector { id?: string; status?: string; [key: string]: unknown }
interface ConnectorApp { description?: string; id: string; isAccessible?: boolean; name: string; [key: string]: unknown }
interface StatsigClient { checkGate?(name: string, options?: Record<string, unknown>): boolean; getFeatureGate?(name: string): { value?: boolean } | boolean }
interface ScopeLike {
  get?(signal: unknown): unknown;
  launchConnectorPostConnect?(input: Record<string, unknown>): Promise<boolean> | boolean;
  watch?(listener: (scope: ScopeLike) => void): (() => void) | void;
}
interface AppConnectModalProps {
  allowBrowserFallback?: boolean;
  app: ConnectorApp;
  appConnectOptions?: Record<string, unknown>;
  authTypeOverride?: string;
  beforeConnect?(): Promise<boolean | void> | boolean | void;
  closeOnFailedConnect?: boolean;
  closeOnOAuthStarted?: boolean;
  connectApp?(input: { app: ConnectorApp }): Promise<boolean>;
  connectorAuth?: { authReason: string; linkId?: string };
  descriptionOverride?: string;
  githubRepositoryAccess?: { installationUrl?: string; onContinue?(): void };
  hostId?: string;
  installAttemptId?: string;
  isAddingAccount?: boolean;
  isCompletingConnection?: boolean;
  isReconnecting?: boolean;
  onConnected?(linkId?: string): Promise<void> | void;
  onConnectFailed?(reason: "connect_failed" | "request_failed"): void;
  onConnectStarted?(): void;
  onConsentAction?(action: string): void;
  onConsentShown?(): void;
  onExternalConnectStarted?(): void;
  onOAuthStarted?(event: Record<string, unknown>): void;
  onOpenChange(open: boolean): void;
  open?: boolean;
  postConnectSource?: string;
  reauthLinkId?: string;
  requestedCompanionConnectorIds?: string[];
  serviceAccountId?: string;
  showResultToasts?: boolean;
  waitForConnectedHandler?: boolean;
}
interface ConnectorApi { safePost<Response>(path: string, options: Record<string, unknown>): Promise<Response> }

const GOOGLE_DEFINITIONS: readonly ConnectorDefinition[] = [
  { connectorId: "connector_2128aebfecb84f64a069897515042a44", kind: "gmail" },
  { connectorId: "connector_947e0d954944416db111db556030eea6", kind: "google-calendar" },
  { connectorId: "connector_c0f748249d6a42aea4b00fd375570ded", kind: "google-contacts" },
  { connectorId: "connector_5f3c8c41a1e54ad7a76272c89e2554fa", kind: "google-drive" },
];
const MICROSOFT_DEFINITIONS: readonly ConnectorDefinition[] = [
  { connectorId: "connector_4aaab2856305417b993eca9a216aaf6e", kind: "outlook-email" },
  { connectorId: "connector_e6a7394682e24467ac68c60696f275a4", kind: "outlook-calendar" },
  { connectorId: "connector_1e4f6a44acf14e3ca1d96672f8c945bc", kind: "sharepoint" },
  { connectorId: "connector_246af0940da3457da0e751171dc1ce60", kind: "teams" },
];
const GOOGLE_BY_ID = new Map(GOOGLE_DEFINITIONS.map((definition) => [definition.connectorId, definition]));
const MICROSOFT_BY_ID = new Map(MICROSOFT_DEFINITIONS.map((definition) => [definition.connectorId, definition]));
const jsx: JsxRuntime = getJsxRuntime();
const client = apiClient as unknown as ConnectorApi;

function gateEnabled(clientValue: StatsigClient | undefined, gate: string, options: { disableExposureLog: boolean }): boolean {
  const checked = clientValue?.checkGate?.(gate, options);
  if (typeof checked === "boolean") return checked;
  const feature = clientValue?.getFeatureGate?.(gate);
  return typeof feature === "boolean" ? feature : feature?.value === true;
}
function resolveUnlinkedCompanions(input: {
  availableAppIds: ReadonlySet<string>;
  companionConnectorIds: readonly string[];
  companionConnectors: readonly (CompanionConnector | null | undefined)[];
  companionLinks: readonly (ConnectorLink | null | undefined)[];
  connectorById: ReadonlyMap<string, ConnectorDefinition>;
}): Array<{ connector: CompanionConnector; definition: ConnectorDefinition }> {
  return input.companionConnectorIds.flatMap((connectorId, index) => {
    const connector = input.companionConnectors[index];
    const link = input.companionLinks[index];
    const definition = input.connectorById.get(connectorId);
    return connector == null || link === undefined || definition == null || link != null || connector.status === "DISABLED_BY_ADMIN" || !input.availableAppIds.has(connectorId)
      ? []
      : [{ connector, definition }];
  });
}

function resolveMicrosoftCompanionConnectors(input: Omit<Parameters<typeof resolveUnlinkedCompanions>[0], "connectorById">) {
  return resolveUnlinkedCompanions({ ...input, connectorById: MICROSOFT_BY_ID });
}
function isMicrosoftBundleEnabled({ connectorId, disableExposureLog = false, statsigClient }: { connectorId: string; disableExposureLog?: boolean; statsigClient?: StatsigClient }): boolean {
  return MICROSOFT_BY_ID.has(connectorId) && gateEnabled(statsigClient, "enable-bundled-apps-msft", { disableExposureLog });
}
function resolveGoogleCompanionConnectors(input: Omit<Parameters<typeof resolveUnlinkedCompanions>[0], "connectorById"> & { connectors?: readonly ConnectorDefinition[] }) {
  const connectorById = new Map((input.connectors ?? GOOGLE_DEFINITIONS).map((definition) => [definition.connectorId, definition]));
  return resolveUnlinkedCompanions({ ...input, connectorById });
}
function getGoogleBundleDefinitions({ connectorId, disableExposureLog = false, statsigClient }: { connectorId: string; disableExposureLog?: boolean; statsigClient?: StatsigClient }): ConnectorDefinition[] {
  if (!GOOGLE_BY_ID.has(connectorId) || !gateEnabled(statsigClient, "enable-bundled-apps-google", { disableExposureLog })) return [];
  const includeDrive = gateEnabled(statsigClient, "include-gdrive-in-google-bundle", { disableExposureLog });
  return GOOGLE_DEFINITIONS.filter((definition) => includeDrive || definition.kind !== "google-drive");
}
function initializeGoogleBundle(): void {}
function findConnectorDefinition(connectorId: string, connectors: readonly ConnectorDefinition[]): ConnectorDefinition | undefined {
  return new Map(connectors.map((connector) => [connector.connectorId, connector])).get(connectorId);
}
function companionConnectorIds(
  currentConnectorId: string,
  definitions: readonly ConnectorDefinition[],
): string[] {
  return definitions.flatMap((definition) =>
    definition.connectorId === currentConnectorId ? [] : [definition.connectorId],
  );
}
function getMicrosoftCompanionConnectorIds(currentConnectorId: string): string[] {
  return companionConnectorIds(currentConnectorId, MICROSOFT_DEFINITIONS);
}
function getGoogleCompanionConnectorIds(
  currentConnectorId: string,
  definitions: readonly ConnectorDefinition[],
): string[] {
  return companionConnectorIds(currentConnectorId, definitions);
}

async function launchConnectorPostConnect(input: { scope: ScopeLike; accountId: string | null; connectorId: string; source?: string; onBeforeLaunch?(): void }): Promise<boolean> {
  const currentAccountId = input.scope.get?.("accountId");
  if (currentAccountId !== undefined && currentAccountId !== input.accountId) return false;
  if (input.accountId == null) return true;
  input.onBeforeLaunch?.();
  return await input.scope.launchConnectorPostConnect?.({ accountId: input.accountId, connectorId: input.connectorId, source: input.source }) ?? true;
}

interface ScrollElement {
  addEventListener(type: "scroll", listener: () => void, options?: { passive?: boolean }): void;
  clientHeight: number;
  dataset: Record<string, string | undefined>;
  removeEventListener(type: "scroll", listener: () => void): void;
  scrollHeight: number;
  scrollTop: number;
}
function assignRef(ref: unknown, value: ScrollElement | null): void {
  if (typeof ref === "function") (ref as (node: ScrollElement | null) => void)(value);
  else if (ref != null && typeof ref === "object")
    (ref as { current: ScrollElement | null }).current = value;
}
function OverflowFade(props: { children?: unknown; className?: string; fade?: "mask" | "overlay"; fadeClassName?: string; scrollClassName?: string; scrollProps?: Record<string, unknown> & { ref?: unknown } }): unknown {
  const fade = props.fade ?? "overlay";
  const rootRef = ReactRuntime.useRef<ScrollElement | null>(null);
  const scrollRef = ReactRuntime.useRef<ScrollElement | null>(null);
  const contentRef = ReactRuntime.useRef<ScrollElement | null>(null);
  ReactRuntime.useLayoutEffect(() => {
    const root = rootRef.current;
    const scroll = scrollRef.current;
    const content = contentRef.current;
    if (root == null || scroll == null || content == null) return;
    const update = () => {
      const measured = fade === "mask" ? scroll : content;
      const overflow = measured.scrollHeight > scroll.clientHeight + 1;
      root.dataset.hasOverflow = overflow ? "true" : "false";
      root.dataset.canScrollUp = scroll.scrollTop > 1 ? "true" : "false";
      root.dataset.canScrollDown = overflow && scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight - 1 ? "true" : "false";
    };
    update();
    scroll.addEventListener("scroll", update, { passive: true });
    if (typeof ResizeObserver === "undefined")
      return () => scroll.removeEventListener("scroll", update);
    const observer = new ResizeObserver(update);
    observer.observe(scroll as unknown as Element);
    observer.observe(content as unknown as Element);
    return () => { scroll.removeEventListener("scroll", update); observer.disconnect(); };
  }, [fade]);
  const scrollProps = props.scrollProps ?? {};
  return jsx.jsxs("div", {
    ref: rootRef,
    className: ["group relative", props.className].filter(Boolean).join(" "),
    "data-can-scroll-down": "false",
    "data-can-scroll-up": "false",
    "data-has-overflow": "false",
    children: [
      jsx.jsx("div", {
        ...scrollProps,
        ref: (node: ScrollElement | null) => { scrollRef.current = node; assignRef(scrollProps.ref, node); },
        className: [fade === "mask" ? "scroll-fade-mask" : null, props.scrollClassName, scrollProps.className].filter(Boolean).join(" "),
        children: jsx.jsx("div", { ref: contentRef, children: props.children }),
      }),
      fade === "overlay" ? jsx.jsx("div", { "aria-hidden": true, className: ["pointer-events-none absolute bottom-0 hidden h-10 bg-gradient-to-b from-transparent to-surface-elevated-secondary/90 group-data-[can-scroll-down=true]:block", props.fadeClassName].filter(Boolean).join(" ") }) : null,
    ],
  });
}
function initializeOverflowFade(): void {}
function initializePostConnectRuntime(): void {}
function initializeMicrosoftBundle(): void {}
function normalizeDescription(value: unknown): string { return typeof value === "string" ? value.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") : ""; }

interface ConnectResult extends Record<string, unknown> {
  kind?: "browser-fallback" | "connected-directly" | "failed" | "oauth-started";
  linkId?: string;
  oauth_url?: string;
  redirectUrl?: string;
}
function AppConnectModal({
  app,
  appConnectOptions,
  authTypeOverride,
  beforeConnect,
  closeOnFailedConnect = false,
  closeOnOAuthStarted = true,
  connectApp,
  connectorAuth,
  descriptionOverride,
  hostId,
  installAttemptId,
  isCompletingConnection = false,
  isReconnecting = false,
  onConnected,
  onConnectFailed,
  onConnectStarted,
  onConsentAction,
  onConsentShown,
  onExternalConnectStarted,
  onOAuthStarted,
  onOpenChange,
  open = true,
  reauthLinkId,
  requestedCompanionConnectorIds,
  serviceAccountId,
  waitForConnectedHandler = false,
}: AppConnectModalProps): unknown {
  const [status, setStatus] = ReactRuntime.useState<"idle" | "connecting" | "connected" | "error">("idle");
  ReactRuntime.useEffect?.(() => { if (open) onConsentShown?.(); }, [open]);
  if (!open || isCompletingConnection) return null;
  const connect = async () => {
    if (status === "connecting") return;
    setStatus("connecting");
    onConnectStarted?.();
    try {
      if (await beforeConnect?.() === false) { setStatus("idle"); return; }
      const result: ConnectResult = connectApp == null
        ? await client.safePost<ConnectResult>("/connectors/{connector_id}/connect", {
            parameters: { path: { connector_id: app.id } },
            requestBody: {
              app_connect_options: appConnectOptions,
              auth_type_override: authTypeOverride,
              host_id: hostId,
              install_attempt_id: installAttemptId,
              link_id: reauthLinkId ?? connectorAuth?.linkId,
              requested_companion_connector_ids: requestedCompanionConnectorIds,
              service_account_id: serviceAccountId,
            },
          })
        : { kind: await connectApp({ app }) ? "connected-directly" : "failed" };
      const redirectUrl = typeof result.redirectUrl === "string"
        ? result.redirectUrl
        : typeof result.oauth_url === "string" ? result.oauth_url : null;
      const kind = result.kind ?? (redirectUrl == null ? "connected-directly" : "oauth-started");
      if (kind === "failed") {
        setStatus("error");
        onConnectFailed?.("connect_failed");
        if (closeOnFailedConnect) onOpenChange(false);
        return;
      }
      if (kind === "browser-fallback") {
        onExternalConnectStarted?.();
        onOpenChange(false);
        return;
      }
      if (kind === "oauth-started" && redirectUrl != null) {
        onOAuthStarted?.({
          app: { id: app.id, name: app.name },
          isGithubConnector: app.id === "connector_76869538009648d5b282a4bb21c3d157",
          redirectUrl,
          requestedCompanionConnectorIds,
        });
        if (closeOnOAuthStarted) onOpenChange(false);
        return;
      }
      setStatus("connected");
      const handled = onConnected?.(result.linkId);
      if (waitForConnectedHandler) await handled;
    } catch (error) {
      setStatus("error");
      onConnectFailed?.("request_failed");
      if (closeOnFailedConnect) onOpenChange(false);
    }
  };
  return jsx.jsxs("dialog", { open: true, children: [
    jsx.jsx("h2", { children: `${isReconnecting ? "Reconnect" : "Connect"} ${app.name}` }),
    jsx.jsx("p", { children: normalizeDescription(descriptionOverride ?? app.description) }),
    connectorAuth != null && ["reauth_required", "reauthentication_required"].includes(connectorAuth.authReason) ? jsx.jsx("p", { role: "note", children: "Your connection needs to be authorized again." }) : null,
    status === "error" ? jsx.jsx("p", { role: "alert", children: "Connection failed. Try again." }) : null,
    status === "connected" ? jsx.jsx("p", { role: "status", children: "Connected" }) : null,
    jsx.jsxs("footer", { children: [jsx.jsx("button", { type: "button", onClick: () => { onConsentAction?.("cancel"); onOpenChange(false); }, children: "Cancel" }), jsx.jsx("button", { type: "button", disabled: status === "connecting", onClick: () => { onConsentAction?.("connect"); return connect(); }, children: isReconnecting ? "Reconnect" : "Connect" })] }),
  ] });
}
function initializeAppConnectModal(): void { initializeApiClient(); initializeGoogleBundle(); initializeMicrosoftBundle(); initializePostConnectRuntime(); initializeOverflowFade(); }

export {
  resolveMicrosoftCompanionConnectors as a,
  isMicrosoftBundleEnabled as c,
  resolveGoogleCompanionConnectors as d,
  getGoogleBundleDefinitions as f,
  initializeGoogleBundle as h,
  launchConnectorPostConnect as i,
  OverflowFade as l,
  findConnectorDefinition as m,
  initializeAppConnectModal as n,
  getMicrosoftCompanionConnectorIds as o,
  getGoogleCompanionConnectorIds as p,
  initializePostConnectRuntime as r,
  initializeMicrosoftBundle as s,
  AppConnectModal as t,
  initializeOverflowFade as u,
};
