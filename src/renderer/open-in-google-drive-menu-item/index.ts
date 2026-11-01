import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";
import * as connectModalChunk from "@rchunk/app-connect-modal";
import type { JsxRuntime } from "@rchunk/app-shared";
import { getPathBasename } from "../app-shared/runtime/get-path-basename";

export type GoogleWorkspaceTarget = "document" | "presentation" | "spreadsheet";
type Callable = (...args: unknown[]) => unknown;
interface AppRecord { id: string; isAccessible?: boolean; isEnabled?: boolean; name?: string; pluginDisplayNames?: string[] }
export interface GoogleDrivePlugin {
  displayName?: string;
  plugin: { enabled?: boolean; id: string; installed?: boolean; name?: string };
  [key: string]: unknown;
}
interface AnalyticsContext { inputMessageId?: string | null; messageId?: string | null; threadId?: string | null; turnId?: string | null }
interface ProductLogger { logProductEvent(name: unknown, payload: Record<string, unknown>): void }
interface UploadResult { connector_result: { _meta?: unknown; content?: unknown[]; isError?: boolean; structuredContent?: unknown } }
interface BaseProps {
  analyticsClickSource?: unknown; analyticsContext?: AnalyticsContext; getAnalyticsContext?(): AnalyticsContext | null;
  handleConnectApp?(app: AppRecord): Promise<unknown> | unknown; hostId: string; iconSize?: string; isOpening?: boolean;
  keepOpenWhileOpening?: boolean; onBeforeFileRead?(): Promise<boolean> | boolean; onCloseDropdown?(): void;
  onOpeningChange(opening: boolean): void; targetType: GoogleWorkspaceTarget; title?: string;
}
interface PathProps extends BaseProps { cwd?: string; path: string }
interface UploadProps extends BaseProps { readUploadFile(): Promise<{ bytes: Uint8Array; contentType: string; fileName: string }>; sourceId: string }
type Props = PathProps | UploadProps;

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const primary = primaryChunk as unknown as Record<string, unknown>;
const connectModal = connectModalChunk as unknown as Record<string, unknown>;
let jsx: JsxRuntime;
let messages: Record<string, { defaultMessage: string; description: string; id: string }>;
const GOOGLE_DRIVE_CONNECTOR_ID = "connector_5f3c8c41a1e54ad7a76272c89e2554fa";
const GOOGLE_DRIVE_UPLOAD_PATH = "/wham/apps/google_drive/upload";
const GOOGLE_URL = /https?:\/\/(?:docs|drive)\.google\.com\/[^\s"'<>),]+/i;

function invoke<T>(value: unknown, ...args: unknown[]): T { return (value as Callable)(...args) as T; }
function element(type: unknown, props: Record<string, unknown>): unknown { return jsx.jsx(type as never, props); }
function fileName(path: string): string { return getPathBasename(path); }
function extension(path: string): string { const name = fileName(path); const dot = name.lastIndexOf("."); return dot < 0 ? "" : name.slice(dot + 1).toLowerCase(); }
function targetForPath(path: string): GoogleWorkspaceTarget | null {
  switch (extension(path)) { case "docx": return "document"; case "xlsx": return "spreadsheet"; case "pptx": return "presentation"; default: return null; }
}
function normalized(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
function googleApp(apps: AppRecord[]): AppRecord | null {
  return apps.find((app) => app.id === GOOGLE_DRIVE_CONNECTOR_ID || [app.id, app.name, ...(app.pluginDisplayNames ?? [])].some((value) => value != null && normalized(value) === "google-drive")) ?? null;
}
function googleDriveReady(apps: AppRecord[]): boolean { const app = googleApp(apps); return app?.isAccessible === true && app.isEnabled === true; }
function googlePlugin(plugins: GoogleDrivePlugin[]): GoogleDrivePlugin | null {
  return plugins.find((plugin) => [plugin.plugin.id.split("@")[0], plugin.plugin.name, plugin.displayName].some((value) => value != null && normalized(value) === "google-drive")) ?? null;
}
function nextAction(apps: AppRecord[] | null | undefined, plugin: GoogleDrivePlugin | null):
  | { kind: "upload" | "refresh" } | { kind: "installPlugin" | "enablePlugin"; plugin: GoogleDrivePlugin }
  | { app: AppRecord; kind: "connectApp" | "openPluginDetail"; plugin?: GoogleDrivePlugin } {
  if (apps != null && googleDriveReady(apps)) return { kind: "upload" };
  if (plugin == null) return { kind: "refresh" };
  if (!plugin.plugin.installed) return { kind: "installPlugin", plugin };
  if (!plugin.plugin.enabled) return { kind: "enablePlugin", plugin };
  if (apps == null) return { kind: "refresh" };
  const app = googleApp(apps);
  if (app == null) return { kind: "refresh" };
  return app.isAccessible === true && app.isEnabled === false ? { app, kind: "openPluginDetail", plugin } : { app, kind: "connectApp" };
}
function resourceKind(target: GoogleWorkspaceTarget): unknown {
  const kinds = (shared.Fj ?? {}) as Record<string, unknown>;
  return (target === "document" ? kinds.CODEX_GOOGLE_WORKSPACE_RESOURCE_KIND_DOCUMENT : target === "spreadsheet" ? kinds.CODEX_GOOGLE_WORKSPACE_RESOURCE_KIND_SPREADSHEET : kinds.CODEX_GOOGLE_WORKSPACE_RESOURCE_KIND_PRESENTATION) ?? target;
}
function logDriveClick(input: { clickAction: unknown; clickSource: unknown; context: AnalyticsContext; productLogger: ProductLogger; resourceKind: GoogleWorkspaceTarget }): void {
  input.productLogger.logProductEvent(shared.Pj ?? "google_workspace_open", { threadId: input.context.threadId ?? undefined, turnId: input.context.turnId ?? undefined,
    inputMessageId: input.context.inputMessageId ?? undefined, messageId: input.context.messageId ?? undefined,
    resourceKind: resourceKind(input.resourceKind), clickAction: input.clickAction, clickSource: input.clickSource });
}
function contentType(path: string): string {
  switch (extension(path)) { case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"; default: return "application/octet-stream"; }
}
function safeHeader(value: string): string { return value.replace(/[\r\n"]/g, "_"); }
function joinBytes(parts: Uint8Array[]): Uint8Array { const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0)); let offset = 0; for (const part of parts) { result.set(part, offset); offset += part.length; } return result; }
function multipart(input: { fileBytes: Uint8Array; filename: string; mimeType: string; title: string }): { body: Uint8Array; boundary: string } {
  const boundary = `----codex-google-drive-${Math.random().toString(36).slice(2)}`;
  const parts: Uint8Array[] = []; const text = (value: string) => parts.push(new TextEncoder().encode(value));
  text(`--${boundary}\r\nContent-Disposition: form-data; name="arguments"\r\n\r\n${JSON.stringify({ title: input.title })}\r\n`);
  text(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${safeHeader(input.filename)}"\r\nContent-Type: ${input.mimeType}\r\n\r\n`);
  parts.push(input.fileBytes); text(`\r\n--${boundary}--\r\n`); return { body: joinBytes(parts), boundary };
}
class GoogleDriveConnectorAuthError extends Error { constructor() { super("Google Drive connector authentication is required."); this.name = "GoogleDriveConnectorAuthError"; } }
function hasAuthFailure(result: UploadResult["connector_result"]): boolean {
  if (typeof result._meta !== "object" || result._meta == null || Array.isArray(result._meta)) return false;
  const apps = (result._meta as Record<string, unknown>)._codex_apps;
  if (typeof apps !== "object" || apps == null || Array.isArray(apps)) return false;
  const failure = (apps as Record<string, unknown>).connector_auth_failure;
  return typeof failure === "object" && failure != null && !Array.isArray(failure) && (failure as Record<string, unknown>).is_auth_failure === true;
}
function extractGoogleUrl(value: unknown): string | null { return typeof value === "string" ? (value.match(GOOGLE_URL)?.[0]?.replace(/[.;:!?]+$/, "") ?? null) : null; }
function resultUrl(result: UploadResult): string | null {
  const structured = result.connector_result.structuredContent;
  if (typeof structured === "object" && structured != null && !Array.isArray(structured)) {
    const url = extractGoogleUrl((structured as Record<string, unknown>).url) ?? extractGoogleUrl((structured as Record<string, unknown>).webViewLink); if (url != null) return url;
  }
  for (const item of result.connector_result.content ?? []) if (typeof item === "object" && item != null && !Array.isArray(item) && (item as Record<string, unknown>).type === "text") {
    const url = extractGoogleUrl((item as Record<string, unknown>).text); if (url != null) return url;
  }
  return null;
}
async function uploadBytes(input: { bytes: Uint8Array; contentType: string; fileName: string; title?: string }): Promise<UploadResult> {
  if (targetForPath(input.fileName) == null) throw new Error("Unsupported file type. Expected one of: .docx, .pptx, .xlsx.");
  const form = multipart({ fileBytes: input.bytes, filename: input.fileName, mimeType: input.contentType, title: input.title ?? input.fileName });
  const client = (initial._dn as { getInstance(): { fetch(path: string, init: Record<string, unknown>): Promise<{ json(): Promise<UploadResult> }> } }).getInstance();
  const result = await (await client.fetch(GOOGLE_DRIVE_UPLOAD_PATH, { method: "POST", body: form.body, headers: { "Content-Type": `multipart/form-data; boundary=${form.boundary}` } })).json();
  if (hasAuthFailure(result.connector_result)) throw new GoogleDriveConnectorAuthError();
  if (result.connector_result.isError === true) throw new Error("Google Drive could not open this file.");
  return result;
}
async function uploadPath(input: { hostId: string; path: string; title?: string }): Promise<UploadResult> {
  if (targetForPath(input.path) == null) throw new Error("Unsupported file type. Expected one of: .docx, .pptx, .xlsx.");
  const response = await invoke<Promise<{ contentsBase64?: string }>>(initial.Qln, "read-file-binary", { params: { hostId: input.hostId, path: input.path } });
  if (response.contentsBase64 == null) throw new Error("File contents are unavailable.");
  return uploadBytes({ bytes: invoke<Uint8Array>(initial.Non, response.contentsBase64), contentType: contentType(input.path), fileName: fileName(input.path), title: input.title });
}
function appName(target: GoogleWorkspaceTarget): string { return target === "document" ? "Google Docs" : target === "spreadsheet" ? "Google Sheets" : "Google Slides"; }
function targetLabel(target: GoogleWorkspaceTarget): string { return `Export to ${appName(target)}`; }

function OpenInGoogleDriveMenuItem(input: Props | ({ path: string; targetType?: GoogleWorkspaceTarget } & Partial<BaseProps>)): unknown {
  initialize();
  const target = "path" in input ? targetForPath(input.path) : input.targetType;
  if (target == null) return null;
  if (input.hostId == null || input.onOpeningChange == null) return jsx.jsx("button", { type: "button", role: "menuitem", onClick: (input as { onOpen?(): void }).onOpen, children: targetLabel(target) });
  return GoogleDriveMenuItem({ ...(input as Props), targetType: target });
}

function GoogleDriveMenuItem(props: Props): unknown {
  const scope = invoke<{ get(signal: unknown, parameter?: unknown): unknown }>(shared.LX, initial.kht);
  const productLogger = invoke<ProductLogger>(shared.HX, initial.Cpn);
  const intl = invoke<{ formatMessage(descriptor: { defaultMessage: string; description?: string; id?: string }, values?: Record<string, unknown>): string }>(shared.n4);
  const appsQuery = invoke<{ data?: AppRecord[]; hardRefetchAppsList(): Promise<AppRecord[]> }>(initial.GEt, { hostId: props.hostId });
  const useNewLifecycle = invoke<boolean>(initial.ofn, "3350594701");
  const pluginsQuery = invoke<{ availablePlugins?: GoogleDrivePlugin[]; refetch(): Promise<{ availablePlugins?: GoogleDrivePlugin[] }> }>(initial.N4t, props.hostId, undefined, { enabled: !useNewLifecycle });
  const pluginAvailable = invoke<boolean>(initial.b6t, { hostId: props.hostId, enabled: useNewLifecycle });
  const installedQuery = invoke<{ data?: GoogleDrivePlugin[]; refetch(): Promise<{ data?: GoogleDrivePlugin[] }> }>(initial.c4t, { hostId: props.hostId, roots: undefined, resolveActiveRoots: true, enabled: pluginAvailable });
  const plugin = useNewLifecycle ? googlePlugin(installedQuery.data ?? []) : googlePlugin(pluginsQuery.availablePlugins ?? []);
  const installation = invoke<{ installPlugin(plugin: GoogleDrivePlugin, options: Record<string, unknown>): void; status?: { pluginId?: string } }>(initial.U2);
  const enablement = invoke<{ pendingPluginId?: string; setPluginEnabled(input: Record<string, unknown>): Promise<unknown> }>(initial.Vwt, { hostId: props.hostId });
  const openPluginDetail = invoke<(plugin: GoogleDrivePlugin) => void>(initial.o_n);
  const MenuItem = (shared.jf as { Item: unknown }).Item;
  const currentApps = appsQuery.data;
  const opening = props.isOpening === true;
  const refreshPlugin = async (): Promise<GoogleDrivePlugin | null> => {
    if (!useNewLifecycle) return googlePlugin((await pluginsQuery.refetch()).availablePlugins ?? []);
    if (!pluginAvailable) return null;
    return googlePlugin((await installedQuery.refetch()).data ?? []);
  };
  const toast = scope.get(shared.pk) as { danger(message: string, options?: unknown): void; success(message: string): void; warning(message: string, options?: unknown): { close(): void } };
  const warnInstall = (candidate: GoogleDrivePlugin) => { const notification = toast.warning(intl.formatMessage(messages.installRequired), { primaryAction: { label: intl.formatMessage(messages.installAction), onClick: () => { notification.close(); installation.installPlugin(candidate, { hostId: props.hostId, marketplaceAnalytics: primary.Zh, onSuccess: refreshPlugin }); } } }); };
  const connect = async (app: AppRecord) => { if (props.handleConnectApp != null) await props.handleConnectApp(app); };
  const warnConnect = (app: AppRecord) => { const notification = toast.warning(intl.formatMessage(messages.authFailure), { primaryAction: { label: intl.formatMessage(messages.connectAction), onClick: async () => { notification.close(); await connect(app); } } }); };
  const upload = async (disposition?: unknown) => {
    if (props.onBeforeFileRead != null && await props.onBeforeFileRead() === false) return;
    const context = props.getAnalyticsContext?.() ?? props.analyticsContext ?? {};
    logDriveClick({ clickAction: (shared.Mj as Record<string, unknown>).CODEX_GOOGLE_WORKSPACE_RESOURCE_CLICK_ACTION_UPLOAD_LOCAL_FILE,
      clickSource: props.analyticsClickSource, context, productLogger, resourceKind: props.targetType });
    let sourceId: string; let fileName: string; let result: UploadResult;
    if ("path" in props) { const path = props.cwd == null ? props.path : invoke<string>(shared.HI, props.cwd, props.path); sourceId = path; fileName = path; result = await uploadPath({ hostId: props.hostId, path, title: props.title }); }
    else { const file = await props.readUploadFile(); sourceId = props.sourceId; fileName = file.fileName; result = await uploadBytes({ ...file, title: props.title }); }
    const url = resultUrl(result);
    if (url != null) {
      const displayName = appName(props.targetType); const title = props.title?.trim();
      const attachment = { id: `google-drive-open:${props.targetType}:${sourceId}`, imageAttachments: [],
        text: `The user uploaded ${title == null || title.length === 0 ? fileName : `${title} from ${fileName}`} to ${displayName}.\n${displayName} link: ${url}`, title: `Opened in ${displayName}` };
      invoke(initial.U3, scope, (draft: { mcpAppModelContextAttachments: Array<{ id: string }> }) => { const index = draft.mcpAppModelContextAttachments.findIndex((item) => item.id === attachment.id); if (index < 0) draft.mcpAppModelContextAttachments.push(attachment); else draft.mcpAppModelContextAttachments[index] = attachment; });
      invoke(initial.kft, { disposition, href: url, initiator: "mcp_app_resource" }); return;
    }
    toast.success(intl.formatMessage({ id: "connectedApps.googleDrive.opened", defaultMessage: "Opened in {app}" }, { app: appName(props.targetType) }));
  };
  const run = async (disposition?: unknown) => {
    if (opening) return; props.onOpeningChange(true); let app = currentApps == null ? null : googleApp(currentApps);
    try {
      const action = nextAction(currentApps, plugin);
      if (action.kind === "upload") return await upload(disposition);
      if (action.kind === "installPlugin") return warnInstall(action.plugin);
      if (action.kind === "enablePlugin") { await enablement.setPluginEnabled({ pluginDisplayName: action.plugin.displayName, pluginId: action.plugin.plugin.id, enabled: true }); return; }
      if (action.kind === "connectApp") return await connect(action.app);
      if (action.kind === "openPluginDetail") return openPluginDetail(action.plugin as GoogleDrivePlugin);
      const [apps, refreshedPlugin] = await Promise.all([appsQuery.hardRefetchAppsList(), refreshPlugin()]); app = googleApp(apps);
      if (googleDriveReady(apps)) return await upload(disposition);
      if (refreshedPlugin?.plugin.installed !== true) return refreshedPlugin == null ? toast.warning(intl.formatMessage(messages.authFailure)) : warnInstall(refreshedPlugin);
      if (!refreshedPlugin.plugin.enabled) { await enablement.setPluginEnabled({ pluginDisplayName: refreshedPlugin.displayName, pluginId: refreshedPlugin.plugin.id, enabled: true }); return; }
      if (app?.isAccessible === true && app.isEnabled === false) return openPluginDetail(refreshedPlugin);
      if (app != null) return await connect(app);
      toast.warning(intl.formatMessage(messages.authFailure));
    } catch (error) {
      if (error instanceof GoogleDriveConnectorAuthError) { if (app == null) toast.warning(intl.formatMessage(messages.authFailure)); else warnConnect(app); }
      else toast.danger(intl.formatMessage({ id: "connectedApps.googleDrive.openFailed", defaultMessage: "Could not open in {app}" }, { app: appName(props.targetType) }), { errorAnalytics: { toastId: "connectedApps.googleDrive.openFailed" } });
    } finally { props.onOpeningChange(false); }
  };
  const disabled = opening || installation.status != null || enablement.pendingPluginId === plugin?.plugin.id;
  const close = () => { if (!props.keepOpenWhileOpening) props.onCloseDropdown?.(); };
  return element(MenuItem, { "aria-busy": opening, disabled, onClickCapture: (event: { preventDefault(): void; stopPropagation(): void }) => { const disposition = invoke(initial.wft, event); if (disposition != null) { event.preventDefault(); event.stopPropagation(); void run(disposition).finally(close); close(); } },
    onSelect: () => { void run().finally(close); close(); }, children: opening ? `Exporting to ${appName(props.targetType)}…` : targetLabel(props.targetType) });
}

function GoogleDriveConnectDialog(props: { app: AppRecord; hostId: string; onClose(): void; onOAuthStarted?(): void }): unknown {
  initialize(); const scope = invoke(shared.LX, shared.ZI); const queryClient = invoke(shared.CL); const shouldUseNew = invoke<boolean>(initial.ofn, "403472035");
  return element(connectModal.t, { app: props.app, hostId: props.hostId, onOpenChange: (open: boolean) => { if (!open) props.onClose(); }, onOAuthStarted: props.onOAuthStarted,
    onConnected: async () => invoke(initial.VEt, { scope, accountId: invoke(initial.W6t, scope), hostId: props.hostId, queryClient, shouldUseNewAppLifecycle: shouldUseNew }) });
}
function OpeningStatus(): unknown { initialize(); return jsx.jsxs("span", { className: "pointer-events-auto inline-flex h-token-button-composer shrink-0 cursor-default items-center gap-1.5 text-base leading-[18px] text-secondary", role: "status", children: [element(shared.Qh, { className: "icon-s" }), "Opening"] }); }

const initializeAnalytics = (): void => { if (typeof shared.fI === "function") invoke(shared.fI); };
const initializeUtilities = (): void => { for (const value of [shared.RI, initial.nun, initial.ydn]) if (typeof value === "function") invoke(value); };
let initialized = false;
function initialize(): void {
  if (initialized) return; initialized = true; initializeAnalytics(); initializeUtilities();
  for (const value of [shared.FX, shared.K2, shared.wL, initial.TDt, initial.Qgn, initial.G6t, initial.x3, initial.Dft, initial.sit, initial.y6t, initial.k3t, initial.D3t, initial.P2, initial.o1, initial.Rwt, initial.i4t, initial.l4t, initial.E4t, initial.ypn, initial.HEt, initial.snt, initial.$2t, shared.QI, initial.Rht, connectModal.n, initial.ifn]) if (typeof value === "function") invoke(value);
  jsx = invoke<JsxRuntime>(shared.I3);
  messages = { authFailure: { id: "connectedApps.googleDrive.authFailure", defaultMessage: "Connect Google Drive to open this file", description: "Google Drive needs authentication" },
    connectAction: { id: "connectedApps.googleDrive.connectAction", defaultMessage: "Connect", description: "Connect Google Drive" },
    installAction: { id: "connectedApps.googleDrive.installAction", defaultMessage: "Install", description: "Install Google Drive" },
    installRequired: { id: "connectedApps.googleDrive.installRequired", defaultMessage: "Install Google Drive to open this file", description: "Google Drive must be installed" } };
}

export { targetForPath as a, logDriveClick as c, initialize as i, OpeningStatus as n, initializeUtilities as o, OpenInGoogleDriveMenuItem as r, initializeAnalytics as s, GoogleDriveConnectDialog as t };
