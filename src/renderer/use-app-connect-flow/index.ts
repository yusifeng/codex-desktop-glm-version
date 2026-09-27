import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-connect-modal";
import "@rchunk/app-connect-availability";

interface ConnectableApp { id: string; isAccessible?: boolean; name?: string }
interface ResumeTarget extends Record<string, unknown> { kind: string; reauthLinkId?: string | null }
interface PendingConnect { appConnectOptions?: Record<string, unknown>; hostId?: string; oauthState?: string; resumeTarget: ResumeTarget }
interface AppConnectFlowOptions {
  connect?(app: ConnectableApp, options?: Record<string, unknown>): Promise<{ kind?: string; redirectUrl?: string } | null>;
  getPending?(appId: string, hostId: string, target?: ResumeTarget): PendingConnect | null;
  hostId?: string;
  marketplaceAnalytics?: unknown;
  onConnectStarted?(app: ConnectableApp): void;
  onExternalConnectStarted?(app: ConnectableApp): void;
  openExternal?(url: string): void;
  savePending?(pending: PendingConnect & { appId?: string; hostId: string; redirectUrl?: string }): string | null | void;
  clearPending?(input: { hostId: string; oauthState?: string }): void;
}
interface AppConnectFlow { connectingApp: ConnectableApp | null; connectingOptions?: Record<string, unknown>; clearConnectingApp(): void; clearPendingAppConnect(input: Record<string, unknown>): void; handleAppConnected(appId: string, target?: ResumeTarget): void; handleAppConnectOAuthStarted(event: Record<string, unknown>): string | null | void; handleConnectApp(app: ConnectableApp, options?: Record<string, unknown>): Promise<void>; handleExternalConnectStarted(app: ConnectableApp, target?: ResumeTarget): void; handleOpenAppUrl(url?: string | null): void; isAppConnectPending(appId: string, target?: ResumeTarget): boolean; isAppReauthPending(appId: string): boolean }
function n(options: AppConnectFlowOptions = {}): AppConnectFlow {
  const hostId = options.hostId ?? "local";
  const flow: AppConnectFlow = {
    connectingApp: null,
    connectingOptions: undefined,
    clearConnectingApp() { flow.connectingApp = null; flow.connectingOptions = undefined; },
    clearPendingAppConnect(input) { options.clearPending?.({ ...input, hostId }); },
    handleAppConnected(appId, target) { const pending = options.getPending?.(appId, hostId, target); if (pending != null) options.clearPending?.({ oauthState: pending.oauthState, hostId }); },
    handleAppConnectOAuthStarted(event) { const eventApp = event.app; const app = eventApp != null && typeof eventApp === "object" && "id" in eventApp && typeof eventApp.id === "string" ? eventApp as ConnectableApp : null; const eventTarget = event.resumeTarget; const target = eventTarget != null && typeof eventTarget === "object" && "kind" in eventTarget && typeof eventTarget.kind === "string" ? eventTarget as ResumeTarget : undefined; const pending = app == null ? null : options.getPending?.(app.id, hostId, target); const resumeTarget = pending?.resumeTarget ?? target ?? { kind: "apps-tab" }; return options.savePending?.({ ...pending, appId: app?.id, hostId, resumeTarget, oauthState: pending?.oauthState, redirectUrl: typeof event.redirectUrl === "string" ? event.redirectUrl : undefined }); },
    async handleConnectApp(app, connectOptions = {}) { if (flow.connectingApp != null) return; options.onConnectStarted?.(app); const pending = options.getPending?.(app.id, hostId); if (!app.isAccessible && pending == null && connectOptions.forceInApp !== true) { options.onExternalConnectStarted?.(app); return; } flow.connectingApp = app; flow.connectingOptions = connectOptions; try { const result = await options.connect?.(app, connectOptions); if (result?.kind === "oauth-started" && result.redirectUrl != null) flow.handleAppConnectOAuthStarted({ app, redirectUrl: result.redirectUrl }); } finally { flow.clearConnectingApp(); } },
    handleExternalConnectStarted(app, target) { const pending = options.getPending?.(app.id, hostId, target); if (pending != null) options.clearPending?.({ oauthState: pending.oauthState, hostId }); options.onExternalConnectStarted?.(app); },
    handleOpenAppUrl(url) { const normalized = url?.trim(); if (normalized) options.openExternal?.(normalized); },
    isAppConnectPending(appId, target) { return flow.connectingApp?.id === appId || options.getPending?.(appId, hostId, target) != null; },
    isAppReauthPending(appId) { const target: ResumeTarget = { kind: "apps-tab", reauthLinkId: "pending" }; return options.getPending?.(appId, hostId, target) != null; },
  };
  return flow;
}
function t(): void {}
export { n, t };
