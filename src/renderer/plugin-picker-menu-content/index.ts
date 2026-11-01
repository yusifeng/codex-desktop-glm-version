import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as connectPluginsChunk from "@rchunk/connect-plugins-submenu-item";
import "@rchunk/rolldown-runtime";
import * as searchPluginsChunk from "@rchunk/use-search-plugins";
import type { IntlShape, JsxRuntime, ReactRuntime } from "@rchunk/app-shared";

type Component = (props: Record<string, unknown>) => unknown;
interface PluginRecord {
  canonicalAppId?: string | null;
  installedPlugin?: Record<string, unknown>;
  logoDarkPath?: string | null;
  logoPath?: string | null;
  plugin: {
    id: string;
    name: string;
    remotePluginId?: string | null;
    shareContext?: { remotePluginId?: string | null } | null;
  };
  [key: string]: unknown;
}
interface FeaturedPlugin extends Record<string, unknown> {
  displayName: string;
  id: string;
  installedPlugin?: Record<string, unknown>;
  remotePluginId?: string | null;
  status?: string;
}
interface PluginPickerDataOptions {
  cwd?: string;
  hostId: string;
  marketplaceAnalytics?: Record<string, unknown>;
  pluginHostId?: string;
  workComposer?: boolean;
}
interface PluginPickerData {
  connectedPlugins: PluginRecord[];
  defaultConnectedPluginLimit?: number;
  featuredPlugins: FeaturedPlugin[];
  hasLoadError: boolean;
  isLoading: boolean;
  openPluginInstall(
    plugin: FeaturedPlugin,
    options?: Record<string, unknown>,
  ): void;
  pluginsFeatureEnabled: boolean;
  pluginInstallationStatus: Record<string, unknown> | null;
}
interface PluginPickerProps {
  connectedPlugins: PluginRecord[];
  defaultConnectedPluginLimit?: number;
  featuredPlugins: FeaturedPlugin[];
  hasLoadError: boolean;
  onConnectPlugin(plugin: FeaturedPlugin): void;
  onOpenPluginDirectory(): void;
  onPluginSelectionChange(plugin: PluginRecord, selected: boolean): void;
  selectedPluginIds?: readonly string[];
  workRecommendationsHostId: string;
}
interface ScopeApi {
        get<Value>(signal: unknown): Value;
  set<Parameter, Value>(
    family: unknown,
    parameter: Parameter,
    update: (value: Value) => Value,
  ): void;
}
interface MenuComponents {
  CheckboxItem: Component;
  Item: Component;
  ItemIcon: Component;
  Message: Component;
  SearchInput: Component;
  Section: Component;
  Separator: Component;
}
interface SharedDependencies {
  $O: { ONE_MINUTE: number };
  BX<Parameter, Value>(
    family: unknown,
    parameter: Parameter,
    options?: Record<string, unknown>,
  ): Value;
  FZ(): Promise<never>;
  I3(): JsxRuntime;
  QX(
    scope: unknown,
    getOptions: (
      parameter: string,
      context: { get<Value>(signal: unknown, parameter?: unknown): Value },
    ) => Record<string, unknown>,
  ): unknown;
  Y2: Component;
  ZI: unknown;
  e6(): ReactRuntime;
  jf: MenuComponents;
  n4(): IntlShape;
  oZ(
    scope: unknown,
    initial: (parameter: string) => Record<string, number>,
  ): unknown;
  [key: string]: unknown;
}
interface QueryResult<Data> {
  data?: Data;
  error?: unknown;
  isLoading: boolean;
  refetch(): Promise<unknown>;
}
interface Availability {
  available: boolean;
  isLoading: boolean;
}
interface InitialDependencies {
  Dlt: Component;
  E4t(options: {
    additionalSearchValues(plugin: PluginRecord): string[];
    plugins: PluginRecord[];
    query: string;
  }): PluginRecord[];
  H6t: unknown;
  LWt(
    plugin: PluginRecord,
  ): { displayName?: string; iconSmall?: string } | null;
  L4t(authMethod: string | null): boolean;
  M6t: () => void;
  P6t(hostId: string): { authMethod?: string | null } | null;
  S6t(options: { enabled: boolean; hostId: string }): Availability;
  Tv(plugins: PluginRecord[]): PluginRecord[];
  U2(): {
    installPlugin(
      plugin: Record<string, unknown>,
      options: Record<string, unknown>,
    ): void;
    status?: Record<string, unknown>;
  };
  b6t(options: { hostId: string }): boolean;
  c4t(options: {
    enabled: boolean;
    hostId: string;
    roots?: string[];
  }): QueryResult<PluginRecord[]>;
  cJt(): void;
  g4t(input: {
    plugins: PluginRecord[];
    isComputerUseAvailable: boolean;
    isExternalBrowserUseAvailable: boolean;
    isInAppBrowserUseAvailable: boolean;
    isMessagesAvailable: boolean;
  }): PluginRecord[];
  hv(plugin: FeaturedPlugin, fallback: unknown): FeaturedPlugin;
  m4t: readonly unknown[];
  o4t(hostId: string): boolean;
  ov: unknown;
  q6t(value: string): string;
  u4t: unknown;
  wDt(plugin: PluginRecord): string;
  ye?: unknown;
  [key: string]: unknown;
}

const shared = appSharedChunk as unknown as SharedDependencies;
const initial = appInitialChunk as unknown as InitialDependencies;
const ConnectPluginsSubmenuItem = (
  connectPluginsChunk as unknown as { t: Component }
).t;
let jsx: JsxRuntime;
let react: ReactRuntime;
let pluginUsageByAccount: unknown;
let installedPluginsByRecency: unknown;

function recordPluginUse(scope: ScopeApi, plugin: PluginRecord): void {
  initializePluginPickerState();
  const accountId = scope.get<string | null>(initial.H6t);
  if (accountId == null) return;
  const key = pluginUsageKey(plugin);
  scope.set<string, Record<string, number>>(
    pluginUsageByAccount,
    accountId,
    (usage) => ({
      ...usage,
      [key]: Math.min((usage[key] ?? 0) + 1, Number.MAX_SAFE_INTEGER),
    }),
  );
}

function pluginUsageKey(plugin: PluginRecord): string {
  return initial.q6t(
    plugin.canonicalAppId?.trim() ||
      plugin.plugin.remotePluginId ||
      plugin.plugin.name,
  );
}

let stateInitialized = false;
function initializePluginPickerState(): void {
  if (stateInitialized) return;
  stateInitialized = true;
  callInitializers(["jZ", "FX", "G6t", "cJt", "i4t", "E4t", "QI", "p0t", "ek"]);
  pluginUsageByAccount = shared.oZ(shared.ZI, () => ({}));
  installedPluginsByRecency = shared.QX(shared.ZI, (hostId, { get }) => {
    const accountId = get<string | null>(initial.H6t);
    const recency =
      accountId == null
        ? []
          : Object.entries(
              get<Record<string, number>>(pluginUsageByAccount, accountId),
            )
            .sort((left, right) => right[1] - left[1])
            .map(([id]) => id);
    return {
      enabled: false,
      queryKey: [
        ...initial.m4t,
        "work-composer-installed",
        accountId,
        hostId,
        "connectors",
        undefined,
        recency,
      ],
      queryFn: shared.FZ,
      retry: false,
      staleTime: shared.$O.ONE_MINUTE,
    };
  });
}

function usePluginPickerData(
  options: PluginPickerDataOptions,
): PluginPickerData {
  initializePluginPickerData();
  const {
    cwd,
    hostId,
    marketplaceAnalytics,
    pluginHostId = hostId,
    workComposer = false,
  } = options;
  const hostFeature = initial.b6t({ hostId }) as boolean;
  const remotePluginHost = initial.o4t(pluginHostId);
  const roots = remotePluginHost
    ? undefined
    : [cwd].filter(
        (value): value is string => value != null && value.length > 0,
      );
  const installed = initial.c4t({
    enabled: hostFeature,
    hostId: pluginHostId,
    roots,
  });
  const hostAuthentication = initial.P6t(hostId);
  const canUseFeatured = shared.BX<string, boolean>(initial.u4t, hostId);
  const shouldLoadFeatured =
    hostFeature &&
    canUseFeatured === true &&
    initial.L4t(hostAuthentication?.authMethod ?? null);
  const featuredCatalog = shared.BX<
    string,
    { sections?: Array<{ id: string; plugins: FeaturedPlugin[] }> } | undefined
  >(initial.ov, hostId, { enabled: shouldLoadFeatured });
  const shouldCheckAvailability = hostFeature && !initial.o4t(pluginHostId);
  const availabilityOptions = { enabled: shouldCheckAvailability, hostId };
  const computerUse = initial.S6t(availabilityOptions);
  const messages = callAvailability("G4t", {
    computerUseAvailability: computerUse,
    hostId,
  });
  const externalBrowser = callAvailability("Y4t", availabilityOptions);
  const inAppBrowser = callAvailability("q4t", availabilityOptions);

  // The release keeps the Work-specific query disabled while the unified picker rolls out.
  const useWorkComposerQuery = workComposer && false;
  const workInstalled = shared.BX<string, QueryResult<PluginRecord[]>>(
    installedPluginsByRecency,
    pluginHostId,
    { enabled: hostFeature && useWorkComposerQuery },
  );
  const installation = initial.U2();
  const openPluginInstall = (
    plugin: FeaturedPlugin,
    installOptions: Record<string, unknown> = {},
  ) => {
    installation.installPlugin(
      plugin.installedPlugin ?? {
        displayName: plugin.displayName,
        remoteMarketplaceName: "chatgpt-workspace",
        remotePluginId: plugin.remotePluginId ?? plugin.id,
      },
      {
        ...installOptions,
        hostId,
        ...(marketplaceAnalytics == null ? {} : { marketplaceAnalytics }),
        onSuccess: async () => {
          await installed.refetch();
        },
      },
    );
  };
  const sourcePlugins =
    (useWorkComposerQuery ? workInstalled.data : installed.data) ?? [];
  const connectedPlugins = initial.Tv(
    initial.g4t({
      plugins: sourcePlugins,
      isComputerUseAvailable: computerUse.available,
      isExternalBrowserUseAvailable: externalBrowser.available,
      isInAppBrowserUseAvailable: inAppBrowser.available,
      isMessagesAvailable: messages.available,
    }),
  );
  const installedIds = new Set(installed.data?.flatMap(pluginIdentifiers));
  const featuredPlugins =
    !shouldLoadFeatured || installed.data == null
      ? []
      : (featuredCatalog?.sections
          ?.find((section) => section.id === "featured")
          ?.plugins.filter(
            (plugin) =>
              !installedIds.has(plugin.id) &&
              plugin.status !== "DISABLED_BY_ADMIN",
          )
          .slice(0, 8)
          .map((plugin) => initial.hv(plugin, null)) ?? []);
  const installationStatus =
    installation.status?.hostId === hostId ? installation.status : null;
  return {
    connectedPlugins,
    defaultConnectedPluginLimit: useWorkComposerQuery ? 10 : undefined,
    featuredPlugins,
    hasLoadError:
      (installed.error != null || workInstalled.error != null) &&
      connectedPlugins.length === 0,
    isLoading:
      installed.isLoading ||
      workInstalled.isLoading ||
      computerUse.isLoading ||
      messages.isLoading ||
      externalBrowser.isLoading ||
      inAppBrowser.isLoading,
    openPluginInstall,
    pluginsFeatureEnabled: hostFeature,
    pluginInstallationStatus: installationStatus,
  };
}

function callAvailability(
  name: string,
  input: Record<string, unknown>,
): Availability {
  const candidate = initial[name];
  return typeof candidate === "function"
    ? (candidate as (options: Record<string, unknown>) => Availability)(input)
    : { available: false, isLoading: false };
}

function pluginIdentifiers({ plugin }: PluginRecord): string[] {
  return [
    plugin.id,
    plugin.remotePluginId,
    plugin.shareContext?.remotePluginId,
  ].filter((value): value is string => value != null);
}

let dataInitialized = false;
function initializePluginPickerData(): void {
  if (dataInitialized) return;
  dataInitialized = true;
  callInitializers(["FX", "wL", "M6t", "x6t", "J4t", "K4t", "y6t", "W4t"]);
  initializePluginPickerState();
  callInitializers(["L2", "xv", "_v", "i4t", "iv", "l4t", "E4t"]);
}

function PluginPickerItem({
  onSelectionChange,
  plugin,
  selected,
}: {
  onSelectionChange(plugin: PluginRecord, selected: boolean): void;
  plugin: PluginRecord;
  selected?: boolean;
}): unknown {
  const metadata = initial.LWt(plugin);
  const icon = jsx.jsx(PluginLogo, {
    name: plugin.plugin.name,
    logoDarkUrl: metadata?.iconSmall ?? plugin.logoDarkPath,
    logoUrl: metadata?.iconSmall ?? plugin.logoPath,
  });
  const label = metadata?.displayName ?? initial.wDt(plugin);
  return selected == null
    ? jsx.jsx(shared.jf.Item, {
        leftIcon: icon,
        onSelect: () => onSelectionChange(plugin, true),
        children: jsx.jsx("span", { children: label }),
      })
    : jsx.jsx(shared.jf.CheckboxItem, {
        checked: selected,
        leftIcon: icon,
        onCheckedChange: (checked: boolean) =>
          onSelectionChange(plugin, checked),
        children: jsx.jsx("span", { children: label }),
      });
}

function PluginLogo({
  logoDarkUrl,
  logoUrl,
  name,
}: {
  logoDarkUrl?: string | null;
  logoUrl?: string | null;
  name: string;
}): unknown {
  return jsx.jsx(shared.jf.ItemIcon, {
    size: "xs",
    children: jsx.jsx(initial.Dlt, {
      alt: "",
      className: "size-full object-contain",
      knownAppId: name,
      logoDarkUrl,
      logoUrl,
      fallback: jsx.jsx((shared.Gm ?? "span") as unknown, {
        className: "size-full text-secondary",
      }),
    }),
  });
}

function PluginPickerMenuContent(props: PluginPickerProps): unknown {
  initializePluginPickerMenuContent();
  const intl = shared.n4();
  const [query, setQuery] = react.useState("");
  const searched = initial.E4t({
    additionalSearchValues: additionalSearchValues,
    plugins: props.connectedPlugins,
    query,
  });
  const visiblePlugins =
    props.defaultConnectedPluginLimit != null && query.trim().length === 0
      ? searched.slice(0, props.defaultConnectedPluginLimit)
      : searched;
  const searchInput = jsx.jsx(shared.jf.SearchInput, {
    autoFocus: true,
    className: "mb-1",
    placeholder: intl.formatMessage({
      id: "composer.workMode.plugins.search",
      defaultMessage: "Search plugins…",
      description:
        "Placeholder for the plugin search field in the Chat home composer",
    }),
    value: query,
    onChange: (event: { currentTarget: { value: string } }) =>
      setQuery(event.currentTarget.value),
  });
  const items = visiblePlugins.map((plugin) =>
    jsx.jsx(
      PluginPickerItem,
      {
        onSelectionChange: props.onPluginSelectionChange,
        plugin,
        selected: props.selectedPluginIds?.includes(plugin.plugin.id),
      },
      plugin.plugin.id,
    ),
  );
  const emptyState = jsx.jsx(PluginPickerEmptyState, {
    hasLoadError: props.hasLoadError,
    isEmpty: searched.length === 0,
    isSearching: query.trim().length > 0,
  });
  const connectSection = jsx.jsxs(jsx.Fragment, {
    children: [
      jsx.jsx(shared.jf.Separator, {}),
      jsx.jsx(shared.jf.Section, {
        className: "flex flex-col",
        children: jsx.jsx(ConnectPluginsSubmenuItem, {
          featuredPlugins: props.featuredPlugins,
          label: jsx.jsx(shared.Y2, {
            id: "composer.workMode.plugins.connect",
            defaultMessage: "Connect plugins",
            description:
              "Label and action for connecting plugins from the Chat home composer plugin picker",
          }),
          onConnectPlugin: props.onConnectPlugin,
          onOpenPluginDirectory: props.onOpenPluginDirectory,
          workRecommendationsHostId: props.workRecommendationsHostId,
        }),
      }),
    ],
  });
  return jsx.jsxs(jsx.Fragment, {
    children: [
      searchInput,
      null,
      jsx.jsxs(jsx.Fragment, {
        children: [
          jsx.jsxs(shared.jf.Section, {
            className: "min-h-0 flex-1 overflow-y-auto",
            children: [items, emptyState],
          }),
          connectSection,
        ],
      }),
    ],
  });
}

function additionalSearchValues(plugin: PluginRecord): string[] {
  const metadata = initial.LWt(plugin);
  return metadata == null || metadata.displayName == null
    ? []
    : [metadata.displayName];
}

function PluginPickerEmptyState({
  hasLoadError,
  isEmpty,
  isSearching,
}: {
  hasLoadError: boolean;
  isEmpty: boolean;
  isSearching: boolean;
}): unknown {
  if (hasLoadError) {
    return jsx.jsx(shared.jf.Message, {
      compact: true,
      role: "status",
      tone: "error",
      children: jsx.jsx(shared.Y2, {
        id: "composer.workMode.plugins.loadError",
        defaultMessage: "Couldn't load plugins",
        description:
          "Error shown when plugins fail to load in the Chat home composer",
      }),
    });
  }
  if (!isEmpty) return null;
  return jsx.jsx(shared.jf.Message, {
    compact: true,
    role: "status",
    children: jsx.jsx(
      shared.Y2,
      isSearching
        ? {
            id: "composer.workMode.plugins.search.empty",
            defaultMessage: "No plugins found",
            description:
              "Empty state when plugin search has no matches in the Chat home composer",
          }
        : {
            id: "composer.workMode.plugins.installed.empty",
            defaultMessage: "No connected plugins",
            description:
              "Empty state when there are no connected and available plugins in the Chat home composer",
          },
    ),
  });
}

let menuInitialized = false;
function initializePluginPickerMenuContent(): void {
  if (menuInitialized) return;
  menuInitialized = true;
  callInitializers(["FX", "G6t", "GWt", "If"]);
  initializePluginPickerData();
  (connectPluginsChunk as unknown as { n(): void }).n();
  (searchPluginsChunk as unknown as { t(): void }).t();
  react = shared.e6();
  jsx = shared.I3();
}

function callInitializers(names: readonly string[]): void {
  for (const name of names) {
    const candidate = name in shared ? shared[name] : initial[name];
    if (typeof candidate === "function") (candidate as () => unknown)();
  }
}

initializePluginPickerState();
export {
  initializePluginPickerState as a,
  usePluginPickerData as i,
  initializePluginPickerMenuContent as n,
  recordPluginUse as o,
  initializePluginPickerData as r,
  PluginPickerMenuContent as t,
};
