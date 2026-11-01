import * as appConnectAvailabilityChunk from "@rchunk/app-connect-availability";
import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";
import type { IntlShape, ReactRuntime } from "@rchunk/app-shared";

interface ConnectableApp {
  id: string;
  isAccessible?: boolean;
  name?: string;
  [key: string]: unknown;
}
interface ResumeTarget extends Record<string, unknown> {
  kind: string;
  reauthLinkId?: string | null;
  addAccountAttempt?: unknown;
}
interface PendingConnect extends Record<string, unknown> {
  appConnectOptions?: Record<string, unknown>;
  marketplaceAnalytics?: Record<string, unknown>;
  oauthState?: string;
  pluginInstallOAuthState?: string;
  requestedCompanionConnectorIds?: string[];
  resumeTarget: ResumeTarget;
  returnTo?: string;
}
interface ConnectOptions extends Record<string, unknown> {
  addAccountAttempt?: unknown;
  appConnectOptions?: Record<string, unknown>;
  forceInApp?: boolean;
  googleOAuthBundlePrepared?: boolean;
  isAddingAccount?: boolean;
  microsoftOAuthBundlePrepared?: boolean;
  mustShowInstallationInterstitial?: boolean;
  reauthLinkId?: string | null;
}
interface AppConnectFlowOptions {
  connect?(
    app: ConnectableApp,
    options?: Record<string, unknown>,
  ): Promise<{ kind?: string; redirectUrl?: string } | null>;
  getPending?(
    appId: string,
    hostId: string,
    target?: ResumeTarget,
  ): PendingConnect | null;
  hostId?: string;
  marketplaceAnalytics?: Record<string, unknown>;
  onConnectStarted?(app: ConnectableApp): void;
  onExternalConnectStarted?(app: ConnectableApp): void;
  openExternal?(url: string): void;
  savePending?(
    pending: PendingConnect & {
      appId?: string;
      hostId: string;
      redirectUrl?: string;
    },
  ): string | null | void;
  clearPending?(input: { hostId: string; oauthState?: string }): void;
}
interface AppConnectFlow {
  connectingApp: ConnectableApp | null;
  connectingOptions?: Record<string, unknown>;
  clearConnectingApp(): void;
  clearPendingAppConnect(input: Record<string, unknown>): void;
  handleAppConnected(appId: string, target?: ResumeTarget): void;
  handleAppConnectOAuthStarted(event: OAuthStartedEvent): string | null | void;
  handleConnectApp(
    app: ConnectableApp,
    options?: ConnectOptions,
  ): Promise<void>;
  handleExternalConnectStarted(
    app: ConnectableApp,
    target?: ResumeTarget,
  ): void;
  handleOpenAppUrl(url?: string | null): void;
  isAppConnectPending(appId: string, target?: ResumeTarget): boolean;
  isAppReauthPending(appId: string): boolean;
}
interface OAuthStartedEvent extends Record<string, unknown> {
  app: ConnectableApp;
  appConnectOptions?: Record<string, unknown>;
  isGithubConnector?: boolean;
  marketplaceAnalytics?: Record<string, unknown>;
  pastedLinkProductExperience?: unknown;
  pluginInstallOAuthState?: string;
  previousOAuthState?: string;
  redirectUrl: string;
  requestedCompanionConnectorIds?: string[];
  resumeTarget?: ResumeTarget;
  returnTo?: string;
}
interface PendingController {
  clearPendingAppConnect(input: { hostId: string; oauthState?: string }): void;
  getPendingAppConnectForApp(
    appId: string,
    hostId: string,
    target?: ResumeTarget | ((target: ResumeTarget) => boolean),
  ): PendingConnect | null;
  isAppConnectPending(
    appId: string,
    target: ResumeTarget | ((target: ResumeTarget) => boolean),
    hostId: string,
  ): boolean;
  markAppConnectOAuthPending(
    input: Record<string, unknown>,
  ): string | null | void;
}
interface QueryClient {
  fetchQuery(options: unknown): Promise<Record<string, unknown> | null>;
}
interface ScopeApi {
  get<Value>(key: unknown): Value;
}
interface ToastService {
  danger(message: unknown, options?: Record<string, unknown>): void;
  info(message: unknown): void;
}
interface SharedDependencies {
  CL(): QueryClient;
  LX(scope: unknown): ScopeApi;
  ZI: unknown;
  e6(): ReactRuntime;
  n4(): IntlShape;
  pk: unknown;
  [key: string]: unknown;
}
interface InitialDependencies {
  Jgn: unknown;
  Lr(): PendingController;
  J3t(connector: Record<string, unknown>, authTypeOverride?: unknown): boolean;
  Q3t(connector: Record<string, unknown>, authTypeOverride?: unknown): string;
  X3t(appId: string, options: Record<string, unknown>): unknown;
  Z3t(intl: IntlShape): unknown;
  c6t(options: Record<string, unknown>): Promise<{ kind?: string } | null>;
  e6t(intl: IntlShape): unknown;
  g6t(appId: string, options: Record<string, unknown>): unknown;
  h6t(
    appId: string,
    options?: Record<string, unknown>,
  ): Record<string, unknown>;
  kft(options: Record<string, unknown>): void;
  lfn(): unknown;
  n6t(options: { intl: IntlShape }): unknown;
  ofn(experimentId: string): boolean;
  s6t(app: ConnectableApp, options: Record<string, unknown>): string;
  t6t(app: ConnectableApp, options: Record<string, unknown>): string;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedDependencies;
const initial = appInitialChunk as unknown as InitialDependencies;
const modal = appConnectModalChunk as unknown as Record<string, unknown>;
const availability = appConnectAvailabilityChunk as unknown as Record<
  string,
  unknown
>;
let react: ReactRuntime;

function useAppConnectFlow(
  options: AppConnectFlowOptions = {},
): AppConnectFlow {
  if (
    options.connect != null ||
    options.getPending != null ||
    options.savePending != null
  ) {
    return createInjectedConnectFlow(options);
  }
  initializeAppConnectFlow();
  const {
    hostId = "local",
    marketplaceAnalytics,
    onConnectStarted,
    onExternalConnectStarted,
  } = options;
  const router = react.useContext<{
    location?: { pathname: string; search: string; hash: string };
  } | null>(initial.Jgn);
  const scope = shared.LX(shared.ZI);
  const intl = shared.n4();
  const queryClient = shared.CL();
  const featureEnabled = initial.ofn("2761268526");
  const statsigClient = initial.lfn();
  const pendingController = initial.Lr();
  const [connectingApp, setConnectingApp] =
    react.useState<ConnectableApp | null>(null);
  const [connectingOptions, setConnectingOptions] = react.useState<
    Record<string, unknown> | undefined
  >(undefined);
  const [installingAppId, setInstallingAppId] = react.useState<string | null>(
    null,
  );

  const getPending = (appId: string, target?: ResumeTarget) =>
    pendingController.getPendingAppConnectForApp(
      appId,
      hostId,
      target == null || isDefaultAppsTarget(target)
        ? isReusablePendingTarget
        : target,
    );
  const toast = () => scope.get<ToastService>(shared.pk);
  const clearConnectingApp = () => {
    setConnectingApp(null);
    setConnectingOptions(undefined);
  };
  let handleAppConnectOAuthStarted: AppConnectFlow["handleAppConnectOAuthStarted"];

  const handleConnectApp = async (
    app: ConnectableApp,
    connectOptions: ConnectOptions = {},
  ) => {
    const {
      appConnectOptions,
      addAccountAttempt,
      forceInApp = false,
      isAddingAccount = false,
      reauthLinkId,
      googleOAuthBundlePrepared = false,
      microsoftOAuthBundlePrepared = false,
      mustShowInstallationInterstitial,
    } = connectOptions;
    if (installingAppId != null) return;
    const pending =
      reauthLinkId == null && (!app.isAccessible || isAddingAccount)
        ? getPending(app.id)
        : null;
    const effectiveOptions = initial.h6t(
      app.id,
      appConnectOptions ??
        (reauthLinkId == null
          ? pending?.appConnectOptions
          : getPending(app.id, { kind: "apps-tab", reauthLinkId })
              ?.appConnectOptions),
    );
    const analytics = pending?.marketplaceAnalytics ?? marketplaceAnalytics;
    onConnectStarted?.(app);

    if (!featureEnabled && !forceInApp && pending == null) {
      openExternalUrl(initial.t6t(app, effectiveOptions));
      onExternalConnectStarted?.(app);
      return;
    }

    const connectors = callModal<Record<string, unknown>[]>(
      "f",
      { connectorId: app.id, statsigClient },
      [],
    );
    const hasCompanionConnector =
      callModal<unknown>("m", app.id, null, connectors) != null;
    const requiresBundle = callModal<boolean>(
      "c",
      { connectorId: app.id, statsigClient },
      false,
    );
    if (
      !forceInApp &&
      !googleOAuthBundlePrepared &&
      !microsoftOAuthBundlePrepared &&
      pending == null &&
      app.isAccessible !== true &&
      (hasCompanionConnector || requiresBundle)
    ) {
      setInstallingAppId(app.id);
      const installInput = {
        scope,
        appId: app.id,
        browserAccountId: undefined,
        hostId,
        queryClient,
      };
      const installer = hasCompanionConnector ? availability.i : availability.n;
      if (typeof installer === "function") {
        await (
          installer as (input: Record<string, unknown>) => Promise<unknown>
        )(
          hasCompanionConnector
            ? { ...installInput, connectors }
            : installInput,
        ).finally(() => setInstallingAppId(null));
      }
    }

    if (
      pending != null ||
      (mustShowInstallationInterstitial === false &&
        (!forceInApp || isAddingAccount) &&
        (!app.isAccessible || isAddingAccount) &&
        (isAddingAccount || (!hasCompanionConnector && !requiresBundle)))
    ) {
      setInstallingAppId(app.id);
      const result = await queryClient
        .fetchQuery(
          initial.X3t(app.id, { productSku: effectiveOptions.productSku }),
        )
        .catch(() => null)
        .then(async (connector) => {
          if (
            connector != null &&
            connector.status !== "DISABLED_BY_ADMIN" &&
            initial.g6t(app.id, effectiveOptions) == null &&
            initial.J3t(connector, effectiveOptions.authTypeOverride) &&
            initial.Q3t(connector, effectiveOptions.authTypeOverride) ===
              "OAUTH"
          ) {
            return initial.c6t({
              allowBrowserFallback: false,
              app,
              appConnectOptions: effectiveOptions,
              connector,
              installAttemptId: analytics?.installAttemptId,
              requestedCompanionConnectorIds:
                pending?.requestedCompanionConnectorIds,
              onOAuthStarted: (redirectUrl: string) =>
                handleAppConnectOAuthStarted({
                  app,
                  marketplaceAnalytics: analytics,
                  pastedLinkProductExperience:
                    pending?.pastedLinkProductExperience,
                  pluginInstallOAuthState:
                    pending?.pluginInstallOAuthState ??
                    (pending?.resumeTarget.kind === "plugin-install"
                      ? pending.oauthState
                      : undefined),
                  previousOAuthState: pending?.oauthState,
                  requestedCompanionConnectorIds:
                    pending?.requestedCompanionConnectorIds,
                  resumeTarget: pending?.resumeTarget ?? {
                    kind: "apps-tab",
                    addAccountAttempt,
                  },
                  isGithubConnector:
                    app.id === "connector_76869538009648d5b282a4bb21c3d157" ||
                    connector.template_id ===
                      "templated_apps_GitHubEnterprise" ||
                    connector.service === "github",
                  redirectUrl,
                  returnTo:
                    (effectiveOptions.redirectAfter as string | undefined) ??
                    pending?.returnTo,
                  appConnectOptions: effectiveOptions,
                }),
              openInBrowser: openBrowser,
              queryClient,
            });
          }
          return connector == null
            ? null
            : { kind: "requires-connection-form" };
        })
        .finally(() => setInstallingAppId(null));
      if (result?.kind === "oauth-started") {
        toast().info(initial.n6t({ intl }));
        return;
      }
      if (pending != null && result?.kind !== "requires-connection-form") {
        toast().danger(initial.Z3t(intl), {
          errorAnalytics: { toastId: "useAppConnectFlow.handleConnectApp" },
        });
        return;
      }
    }
    setConnectingOptions(effectiveOptions);
    setConnectingApp(app);
  };

  const isAppConnectPending = (appId: string, target?: ResumeTarget) =>
    installingAppId === appId ||
    connectingApp?.id === appId ||
    pendingController.isAppConnectPending(
      appId,
      target ?? isReusablePendingTarget,
      hostId,
    ) ||
    getPending(appId, target) != null;
  const handleAppConnected = (appId: string, target?: ResumeTarget) => {
    const pending = getPending(appId, target);
    if (pending == null) return;
    const pluginOAuthState =
      pending.pluginInstallOAuthState ??
      (pending.resumeTarget.kind === "plugin-install"
        ? pending.oauthState
        : undefined);
    if (pluginOAuthState != null) {
      const failed = callInitial<boolean>("Ur", scope, false, pluginOAuthState);
      if (failed)
        toast().danger(initial.e6t(intl), {
          errorAnalytics: { toastId: "useAppConnectFlow.handleAppConnected" },
        });
      else callInitial("Hr", scope, undefined, pluginOAuthState);
    }
    pendingController.clearPendingAppConnect({
      oauthState: pending.oauthState,
      hostId,
    });
  };
  const handleExternalConnectStarted = (
    app: ConnectableApp,
    target?: ResumeTarget,
  ) => {
    const pending = getPending(app.id, target);
    if (pending != null) {
      const pluginOAuthState =
        pending.pluginInstallOAuthState ??
        (pending.resumeTarget.kind === "plugin-install"
          ? pending.oauthState
          : undefined);
      if (
        pluginOAuthState != null &&
        callInitial<boolean>("Ur", scope, false, pluginOAuthState)
      ) {
        toast().danger(initial.e6t(intl), {
          errorAnalytics: {
            toastId: "useAppConnectFlow.handleExternalConnectStarted",
          },
        });
      }
      pendingController.clearPendingAppConnect({
        oauthState: pending.oauthState,
        hostId,
      });
    }
    onExternalConnectStarted?.(app);
  };
  const isAppReauthPending = (appId: string) =>
    pendingController.isAppConnectPending(appId, isReauthTarget, hostId) ||
    pendingController.getPendingAppConnectForApp(
      appId,
      hostId,
      isReauthTarget,
    ) != null;

  handleAppConnectOAuthStarted = (event) => {
    const analytics = event.marketplaceAnalytics ?? marketplaceAnalytics;
    const reusable =
      event.previousOAuthState == null &&
      (event.resumeTarget == null || event.resumeTarget.kind === "apps-tab")
        ? getPending(event.app.id, event.resumeTarget)
        : null;
    const previousOAuthState = event.previousOAuthState ?? reusable?.oauthState;
    const resumeTarget = reusable?.resumeTarget ?? event.resumeTarget;
    const oauthState = pendingController.markAppConnectOAuthPending({
      app: event.app,
      appConnectOptions: event.appConnectOptions ?? reusable?.appConnectOptions,
      hostId,
      isGithubConnector: event.isGithubConnector,
      marketplaceAnalytics: reusable?.marketplaceAnalytics ?? analytics,
      pastedLinkProductExperience:
        event.pastedLinkProductExperience ??
        reusable?.pastedLinkProductExperience,
      pluginInstallOAuthState:
        event.pluginInstallOAuthState ??
        reusable?.pluginInstallOAuthState ??
        (reusable?.resumeTarget.kind === "plugin-install"
          ? reusable.oauthState
          : undefined),
      requestedCompanionConnectorIds:
        event.requestedCompanionConnectorIds ??
        reusable?.requestedCompanionConnectorIds,
      redirectUrl: event.redirectUrl,
      returnTo:
        resumeTarget?.kind === "apps-tab" &&
        resumeTarget.reauthLinkId != null &&
        resumeTarget.addAccountAttempt != null
          ? (reusable?.returnTo ?? currentRoute(router?.location))
          : (event.returnTo ??
            reusable?.returnTo ??
            currentRoute(router?.location)),
      resumeTarget,
    });
    if (
      oauthState != null &&
      previousOAuthState != null &&
      previousOAuthState !== oauthState
    ) {
      pendingController.clearPendingAppConnect({
        oauthState: previousOAuthState,
        hostId,
      });
    }
    return oauthState;
  };

  return {
    connectingApp,
    connectingOptions,
    clearConnectingApp,
    clearPendingAppConnect: (input) =>
      pendingController.clearPendingAppConnect({ ...input, hostId }),
    handleAppConnected,
    handleAppConnectOAuthStarted,
    handleConnectApp,
    handleExternalConnectStarted,
    handleOpenAppUrl: openExternalUrl,
    isAppConnectPending,
    isAppReauthPending,
  };
}

function createInjectedConnectFlow(
  options: AppConnectFlowOptions,
): AppConnectFlow {
  const hostId = options.hostId ?? "local";
  const flow: AppConnectFlow = {
    connectingApp: null,
    connectingOptions: undefined,
    clearConnectingApp() {
      flow.connectingApp = null;
      flow.connectingOptions = undefined;
    },
    clearPendingAppConnect(input) {
      options.clearPending?.({ ...input, hostId });
    },
    handleAppConnected(appId, target) {
      const pending = options.getPending?.(appId, hostId, target);
      if (pending != null)
        options.clearPending?.({ oauthState: pending.oauthState, hostId });
    },
    handleAppConnectOAuthStarted(event) {
      const pending = options.getPending?.(
        event.app.id,
        hostId,
        event.resumeTarget,
      );
      return options.savePending?.({
        ...pending,
        appId: event.app.id,
        hostId,
        resumeTarget: pending?.resumeTarget ??
          event.resumeTarget ?? { kind: "apps-tab" },
        oauthState: pending?.oauthState,
        redirectUrl: event.redirectUrl,
      });
    },
    async handleConnectApp(app, connectOptions = {}) {
      if (flow.connectingApp != null) return;
      options.onConnectStarted?.(app);
      const pending = options.getPending?.(app.id, hostId);
      if (
        !app.isAccessible &&
        pending == null &&
        connectOptions.forceInApp !== true
      ) {
        options.onExternalConnectStarted?.(app);
        return;
      }
      flow.connectingApp = app;
      flow.connectingOptions = connectOptions;
      try {
        const result = await options.connect?.(app, connectOptions);
        if (result?.kind === "oauth-started" && result.redirectUrl != null)
          flow.handleAppConnectOAuthStarted({
            app,
            redirectUrl: result.redirectUrl,
          });
      } finally {
        flow.clearConnectingApp();
      }
    },
    handleExternalConnectStarted(app, target) {
      const pending = options.getPending?.(app.id, hostId, target);
      if (pending != null)
        options.clearPending?.({ oauthState: pending.oauthState, hostId });
      options.onExternalConnectStarted?.(app);
    },
    handleOpenAppUrl(url) {
      const normalized = url?.trim();
      if (normalized) options.openExternal?.(normalized);
    },
    isAppConnectPending(appId, target) {
      return (
        flow.connectingApp?.id === appId ||
        options.getPending?.(appId, hostId, target) != null
      );
    },
    isAppReauthPending(appId) {
      return (
        options.getPending?.(appId, hostId, {
          kind: "apps-tab",
          reauthLinkId: "pending",
        }) != null
      );
    },
  };
  return flow;
}

function callModal<Result>(
  name: string,
  input: unknown,
  fallback: Result,
  extra?: unknown,
): Result {
  const candidate = modal[name];
  return typeof candidate === "function"
    ? (candidate as (...arguments_: unknown[]) => Result)(input, extra)
    : fallback;
}
function callInitial<Result>(
  name: string,
  input: unknown,
  fallback: Result,
  extra?: unknown,
): Result {
  const candidate = initial[name];
  return typeof candidate === "function"
    ? (candidate as (...arguments_: unknown[]) => Result)(input, extra)
    : fallback;
}
function openBrowser(url: string): void {
  initial.kft({
    disposition: undefined,
    href: url,
    initiator: "open_in_browser_bridge",
    openTarget: "external-browser",
  });
}
function openExternalUrl(url?: string | null): void {
  const normalized = url?.trim();
  if (normalized) openBrowser(normalized);
}
function isReauthTarget(target: ResumeTarget): boolean {
  return target.kind === "apps-tab" && target.reauthLinkId != null;
}
function isDefaultAppsTarget(target: ResumeTarget): boolean {
  return target.kind === "apps-tab" && target.reauthLinkId == null;
}
function isReusablePendingTarget(target: ResumeTarget): boolean {
  return (
    isDefaultAppsTarget(target) ||
    (target.kind === "plugin-install" &&
      target.origin == null &&
      target.pendingElicitationReply == null &&
      (target.installOptions as Record<string, unknown> | undefined)
        ?.pendingElicitationReply == null)
  );
}
function currentRoute(location?: {
  pathname: string;
  search: string;
  hash: string;
}): string {
  return location == null
    ? `${window.location.pathname}${window.location.search}${window.location.hash}`
    : `${location.pathname}${location.search}${location.hash}`;
}

let initialized = false;
function initializeAppConnectFlow(): void {
  if (initialized) return;
  initialized = true;
  const call = (source: Record<string, unknown>, name: string) => {
    const candidate = source[name];
    if (typeof candidate === "function") (candidate as () => unknown)();
  };
  for (const name of [
    "$3",
    "SL",
    "FX",
    "e6",
    "K2",
    "Qgn",
    "s6t",
    "_6t",
    "Ir",
    "Yr",
    "h",
    "r",
    "s",
    "t",
    "G6t",
    "Dft",
    "lk",
    "Wr",
    "QI",
    "Bfn",
    "ifn",
  ]) {
    if (name in shared)
      call(shared as unknown as Record<string, unknown>, name);
    else if (name in initial)
      call(initial as unknown as Record<string, unknown>, name);
    else if (name in modal) call(modal, name);
    else call(availability, name);
  }
  react = shared.e6();
}

export { useAppConnectFlow as n, initializeAppConnectFlow as t };
