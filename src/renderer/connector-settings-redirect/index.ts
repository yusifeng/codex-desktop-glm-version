// connector-settings-redirect —— 连接器设置深链的规范插件跳转与连接兜底。

import * as appConnectLinkNavigationChunk from "@rchunk/app-connect-link-navigation";
import * as appConnectModalChunk from "@rchunk/app-connect-modal";
import * as appConnectModalByIdChunk from "@rchunk/app-connect-modal-by-id";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

void runtimeChunk;

interface AccountState {
  accountId?: string | null;
  isLoading?: boolean;
  userId?: string | null;
}

interface RouterLocation {
  key?: string;
  search: string;
}

interface ConnectorOptions extends Record<string, unknown> {
  productSku?: string;
  redirectAfter?: string;
}

interface MarketplacePlugin {
  displayName: string;
  pluginId: string;
}

interface ConnectorMetadata {
  description?: string | null;
  distribution_channel?: unknown;
  logo_url?: string | null;
  logo_url_dark?: string | null;
  name: string;
}

interface QueryResult<Data> {
  data?: Data | null;
  isFetching: boolean;
  isPending: boolean;
  refetch(): unknown;
}

type Navigate = (
  destination: string,
  options?: { replace?: boolean; state?: unknown },
) => void;

type Component = (props: Record<string, unknown>) => unknown;

interface SharedRuntime {
  $3(): void;
  $O: { FIVE_MINUTES: number };
  FX(): void;
  I3(): JsxRuntime;
  LX(scope: unknown): unknown;
  QI(): void;
  SB: string;
  ZI: unknown;
  _L<Data>(options: Record<string, unknown>): QueryResult<Data>;
  e6: (() => ReactRuntime) & ReactRuntime;
  ek(): void;
  gL(): void;
  wL(): void;
}

interface InitialRuntime {
  Let: Component;
  M6t(): void;
  N6t(): AccountState;
  Qgn(): void;
  Ret(): void;
  X3t(
    connectorId: string,
    options: { productSku?: string },
  ): Record<string, unknown>;
  Ygn: Component;
  _6t(): void;
  c1(input: {
    pluginId: string;
    pluginName: string;
    remoteMarketplaceName: string;
  }): string;
  i_n(): RouterLocation;
  j6t(): { isLoading?: boolean };
  k6t(): void;
  l1(): void;
  l_n(): { connectorId?: string | null };
  o_n(): Navigate;
  s6t(): void;
  v6t(
    connectorId: string,
    parameters: URLSearchParams,
    origin: string,
  ): ConnectorOptions;
}

interface PrimaryRuntime {
  co(scope: unknown, connectorId: string): Promise<MarketplacePlugin | null>;
  lo(): void;
}

interface ConnectStateRuntime {
  Ir(): void;
  Lr(): { markAppConnectOAuthPending(event: Record<string, unknown>): unknown };
}

const {
  $3: initializeRuntimeLazy,
  $O: durations,
  FX: initializeMaitaiRuntime,
  I3: getJsxRuntime,
  LX: useScope,
  QI: initializeAppScope,
  SB: remoteMarketplaceName,
  ZI: AppScope,
  _L: useQuery,
  e6: getReactRuntime,
  ek: initializeQueryRuntime,
  gL: initializeUseQuery,
  wL: initializeSharedRuntime,
} = appSharedChunk as unknown as SharedRuntime;
const initialRuntime = appInitialChunk as unknown as InitialRuntime &
  ConnectStateRuntime;
const {
  Ir: initializeAppConnectState,
  Let: LoadingView,
  Lr: useAppConnectFlow,
  M6t: initializeRouteParameters,
  N6t: useAccountState,
  Qgn: initializeAccountRuntime,
  Ret: initializeLoadingView,
  X3t: createConnectorMetadataQuery,
  Ygn: NavigateView,
  _6t: initializeAccountState,
  c1: createPluginDetailPath,
  i_n: useLocation,
  j6t: usePluginsLoadingState,
  k6t: initializePluginsLoadingState,
  l1: initializeRouterRuntime,
  l_n: useRouteParameters,
  o_n: useNavigate,
  s6t: initializePluginRoutes,
  v6t: parseConnectorOptions,
} = initialRuntime;
const { co: fetchMarketplacePlugin, lo: initializeMarketplacePluginQuery } =
  appPrimaryChunk as unknown as PrimaryRuntime;
const { n: isAppConnectLinkNavigation, t: initializeAppConnectLinkNavigation } =
  appConnectLinkNavigationChunk;
const { n: initializeAppConnectModal, t: AppConnectModal } =
  appConnectModalChunk;
const { r: initializeAppConnectModalById, t: ConnectorLoadState } =
  appConnectModalByIdChunk;

let jsxRuntime: JsxRuntime | null = null;
let reactRuntime: ReactRuntime | null = null;

function getRuntime(): { jsx: JsxRuntime; React: ReactRuntime } {
  if (jsxRuntime == null || reactRuntime == null)
    initializeConnectorSettingsRedirect();
  if (jsxRuntime == null || reactRuntime == null)
    throw new Error("Connector settings redirect runtime failed to initialize");
  return { jsx: jsxRuntime, React: reactRuntime };
}

function ConnectorFallbackModal({
  connectorId,
  options,
}: {
  connectorId: string;
  options: ConnectorOptions;
}): unknown {
  const { jsx, React } = getRuntime();
  const navigate = useNavigate();
  const hasClosed = React.useRef(false);
  const { markAppConnectOAuthPending } = useAppConnectFlow();
  const query = useQuery<ConnectorMetadata>(
    createConnectorMetadataQuery(connectorId, {
      productSku: options.productSku,
    }),
  );
  const close = () => {
    if (hasClosed.current) return;
    hasClosed.current = true;
    if (!isAppConnectLinkNavigation(options))
      navigate("/settings/plugins-settings", { replace: true });
  };

  if (query.data == null) {
    return jsx.jsx(ConnectorLoadState, {
      isPending: query.isPending,
      isFetching: query.isFetching,
      onOpenChange: (open: boolean) => {
        if (!open) close();
      },
      onRetry: () => query.refetch(),
    });
  }

  const metadata = query.data;
  const app = {
    id: connectorId,
    name: metadata.name,
    description: metadata.description,
    logoUrl: metadata.logo_url,
    logoUrlDark: metadata.logo_url_dark ?? null,
    distributionChannel: metadata.distribution_channel ?? null,
    appMetadata: null,
    branding: null,
    iconAssets: null,
    iconDarkAssets: null,
    installUrl: null,
    isAccessible: false,
    isEnabled: false,
    labels: null,
    pluginDisplayNames: [],
  };
  return jsx.jsx(AppConnectModal, {
    allowBrowserFallback: false,
    app,
    appConnectOptions: options,
    closeOnOAuthStarted: false,
    onOpenChange: (open: boolean) => {
      if (!open) close();
    },
    onConnected: close,
    onOAuthStarted: (event: Record<string, unknown>) => {
      markAppConnectOAuthPending({
        ...event,
        appConnectOptions: options,
        returnTo: options.redirectAfter ?? "/settings/plugins-settings",
      });
    },
  });
}

function ConnectorSettingsRedirect({
  startConnection,
}: {
  startConnection?: boolean;
}): unknown {
  const { jsx } = getRuntime();
  const scope = useScope(AppScope);
  const location = useLocation();
  const navigate = useNavigate();
  const routeParameters = useRouteParameters();
  const account = useAccountState();
  const plugins = usePluginsLoadingState();
  const parameters = new URLSearchParams(location.search);
  const connectorId =
    (routeParameters.connectorId ?? parameters.get("connector"))?.trim() ?? "";
  const authenticated = account.accountId != null && account.userId != null;
  const pluginQuery = useQuery<MarketplacePlugin>({
    queryKey: [
      "connector-settings",
      account.accountId,
      account.userId,
      connectorId,
    ],
    queryFn: () => fetchMarketplacePlugin(scope, connectorId),
    enabled:
      authenticated &&
      !account.isLoading &&
      !plugins.isLoading &&
      connectorId !== "",
    staleTime: durations.FIVE_MINUTES,
  });

  if (connectorId === "")
    return jsx.jsx(NavigateView, {
      to: "/settings/plugins-settings",
      replace: true,
    });
  if (
    account.isLoading ||
    plugins.isLoading ||
    (authenticated && pluginQuery.isPending)
  ) {
    return jsx.jsx(LoadingView, {
      fillParent: true,
      debugName: "ConnectorSettingsRedirect",
    });
  }
  if (!authenticated)
    return jsx.jsx(NavigateView, {
      to: "/settings/plugins-settings",
      replace: true,
    });

  const options = parseConnectorOptions(
    connectorId,
    parameters,
    globalThis.window?.location.origin ?? "https://chatgpt.com",
  );
  const shouldStartConnection =
    startConnection === true || parameters.get("add-connector-link") === "true";

  if (pluginQuery.data == null) {
    if (shouldStartConnection) {
      return jsx.jsx(
        ConnectorFallbackModal,
        { connectorId, options },
        String(account.accountId) +
          ":" +
          String(account.userId) +
          ":" +
          connectorId +
          ":" +
          (location.key ?? ""),
      );
    }
    return jsx.jsx(ConnectorLoadState, {
      isPending: false,
      isFetching: pluginQuery.isFetching,
      onOpenChange: (open: boolean) => {
        if (!open) navigate("/settings/plugins-settings", { replace: true });
      },
      onRetry: () => pluginQuery.refetch(),
    });
  }

  const plugin = pluginQuery.data;
  const path = createPluginDetailPath({
    pluginId: plugin.pluginId,
    pluginName: plugin.pluginId,
    remoteMarketplaceName,
  });
  const connectorSetup = shouldStartConnection
    ? {
        accountId: account.accountId,
        userId: account.userId,
        connectorId,
        options,
      }
    : undefined;
  return jsx.jsx(NavigateView, {
    to: path,
    replace: true,
    state: {
      pluginDisplayName: plugin.displayName,
      pluginDetailDeepLinkMode: "view",
      connectorSetup,
    },
  });
}

function initializeConnectorSettingsRedirect(): void {
  if (jsxRuntime != null && reactRuntime != null) return;
  initializeRuntimeLazy?.();
  initializeSharedRuntime?.();
  initializeMaitaiRuntime?.();
  initializeUseQuery?.();
  initializeQueryRuntime?.();
  initializeAppScope?.();
  initializeAccountRuntime?.();
  initializeAccountState?.();
  initializeRouteParameters?.();
  initializeRouterRuntime?.();
  initializePluginRoutes?.();
  initializePluginsLoadingState?.();
  initializeLoadingView?.();
  initializeMarketplacePluginQuery?.();
  initializeAppConnectState?.();
  initializeAppConnectLinkNavigation?.();
  initializeAppConnectModal?.();
  initializeAppConnectModalById?.();
  reactRuntime =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  jsxRuntime =
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

initializeConnectorSettingsRedirect();

export { ConnectorSettingsRedirect };
