// Plugin directory search hook. Restores local AppServer and hosted plugin
// search, pagination, project-root context, visibility filtering, and merging
// with installed plugin state.
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

type DirectoryTab = "openai" | "workspace" | "personal";

export interface UseSearchPluginsOptions {
  directoryTab?: DirectoryTab;
  hostId?: string;
  limit?: number;
  searchTerm: string;
}

export interface PluginSearchResult {
  data: Array<Record<string, any>> | undefined;
  error: unknown;
  fetchNextPage(): Promise<void>;
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
}

const shared = appSharedChunk as unknown as Record<string, any>;
const initial = appInitialChunk as unknown as Record<string, any>;

const DEFAULT_LIMIT = 50;
const DEBOUNCE_MS = 200;
const MINIMUM_SEARCH_VERSION = "0.147.0-alpha.6";
const DIRECTORY_SCOPE: Record<DirectoryTab, string> = {
  openai: "global",
  workspace: "workspace",
  personal: "personal",
};
const HOSTED_SCOPE: Record<string, string> = {
  global: "GLOBAL",
  workspace: "WORKSPACE",
  personal: "USER",
};

let initialized = false;

function buildSearchQueryOptions({
  appScope,
  accountId,
  enabled,
  hostId,
  hostedBrowserPlugins,
  limit,
  queryClient,
  roots,
  scope,
  searchTerm,
}: {
  appScope: unknown;
  accountId: string | null;
  enabled: boolean;
  hostId: string;
  hostedBrowserPlugins: boolean;
  limit: number;
  queryClient: unknown;
  roots?: string[];
  scope?: string;
  searchTerm: string;
}): unknown {
  return shared.uL({
    enabled,
    getNextPageParam: (page: { nextCursor?: string | null }) => page.nextCursor ?? undefined,
    initialPageParam: null,
    placeholderData: shared.MZ,
    queryFn: async ({ pageParam, signal }: { pageParam?: string | null; signal?: AbortSignal }) => {
      if (hostedBrowserPlugins) {
        const response = await initial.udn.safeGet("/ps/plugins/search", {
          parameters: {
            query: {
              q: searchTerm,
              scope: scope == null ? undefined : HOSTED_SCOPE[scope],
              limit,
              pageToken: pageParam ?? undefined,
            },
          },
          additionalHeaders: initial.G3t(),
          signal: initial.d4t(signal),
        });
        return {
          nextCursor: response.pagination.next_page_token,
          plugins: response.plugins.map((plugin: unknown) => ({
            plugin: initial.r4t(plugin),
            pluginServicePlugin: plugin,
          })),
        };
      }

      const response = await initial.Ugn(appScope, hostId).sendRequest(
        "plugin/search",
        {
          searchTerm,
          scope,
          ...(roots == null || roots.length === 0 ? {} : { cwds: roots }),
          cursor: pageParam ?? null,
          limit,
        },
        { timeoutMs: initial.p4t },
      );
      const plugins = await initial.D4t({
        hostId,
        plugins: initial.v4t(
          response.data.map(({ marketplaceName, marketplacePath, plugin }: Record<string, any>) => ({
            interface: null,
            name: marketplaceName,
            path: marketplacePath,
            plugins: [plugin],
          })),
        ),
        queryClient,
        signal: initial.d4t(signal),
      });
      return {
        nextCursor: response.nextCursor,
        plugins: plugins.map((plugin: unknown) => ({ plugin, pluginServicePlugin: null })),
      };
    },
    queryKey: [
      ...initial.m4t,
      "search",
      hostId,
      scope,
      searchTerm,
      limit,
      ...(roots ?? []),
      ...(accountId == null ? [] : [accountId]),
    ],
    retry: false,
    select: (data: { pages: Array<{ plugins: unknown[] }> }) => data.pages.flatMap((page) => page.plugins),
    staleTime: shared.$O.ONE_MINUTE,
  });
}

function useSearchPlugins({
  directoryTab,
  hostId = initial.ugn,
  limit = DEFAULT_LIMIT,
  searchTerm,
}: UseSearchPluginsOptions): PluginSearchResult {
  initializeSearchPlugins();
  const appScope = shared.LX(shared.ZI);
  const trimmedSearchTerm = searchTerm.trim();
  const debouncedSearchTerm = initial.Cht(trimmedSearchTerm, DEBOUNCE_MS);
  const queryClient = shared.CL();
  const host = initial.P6t(hostId);
  shared.HX(initial.H6t);
  const appServerVersion = shared.BX(initial.Ifn, hostId);
  const searchSupported =
    (initial.L4t(host?.authMethod ?? null) || host?.authMethod === "apikey") &&
    appServerVersion != null &&
    (appServerVersion === "0.0.0" || shared.tY(appServerVersion, MINIMUM_SEARCH_VERSION) >= 0);

  const projectRootsQuery = shared.BX(initial.bcn, { hostId }, { enabled: true });
  const roots = projectRootsQuery.data?.roots;
  const installedPluginsQuery = initial.c4t({ hostId, roots });
  const pluginSettings = initial.e8t();
  const { value: hiddenPluginGate } = initial.afn("1349514884");
  const { hiddenPluginIds } = initial.Bv(hiddenPluginGate);
  const debouncePending = trimmedSearchTerm !== debouncedSearchTerm;
  const remoteSearchEnabled = searchSupported && trimmedSearchTerm.length > 0 && !debouncePending;

  const remoteSearch = shared.eL(buildSearchQueryOptions({
    appScope,
    accountId: null,
    enabled: remoteSearchEnabled,
    hostId,
    hostedBrowserPlugins: false,
    limit,
    queryClient,
    roots,
    scope: directoryTab == null ? undefined : DIRECTORY_SCOPE[directoryTab],
    searchTerm: debouncedSearchTerm,
  }));

  const error = projectRootsQuery.error ?? installedPluginsQuery.error ?? remoteSearch.error;
  const isLoading = trimmedSearchTerm.length > 0 && (
    projectRootsQuery.isLoading ||
    installedPluginsQuery.isLoading ||
    (searchSupported && ((debouncePending && remoteSearch.data == null) || remoteSearch.isLoading))
  );
  const fetchNextPage = async () => {
    if (remoteSearchEnabled && remoteSearch.hasNextPage) await remoteSearch.fetchNextPage();
  };

  if (
    trimmedSearchTerm.length === 0 ||
    isLoading ||
    installedPluginsQuery.data == null ||
    (remoteSearchEnabled && remoteSearch.data == null && remoteSearch.error == null)
  ) {
    return {
      data: undefined,
      error,
      fetchNextPage,
      hasNextPage: false,
      isFetchNextPageError: remoteSearch.isFetchNextPageError,
      isFetchingNextPage: remoteSearch.isFetchingNextPage,
      isLoading,
    };
  }

  const installedByKey = new Map<string, any>();
  for (const installed of installedPluginsQuery.data) {
    installedByKey.set(initial.R3t(installed.plugin), installed);
  }
  const remotePlugins = (remoteSearch.data ?? []).map(({ plugin }: Record<string, any>) => plugin);
  const servicePluginByKey = new Map<string, any>();
  for (const { plugin, pluginServicePlugin } of remoteSearch.data ?? []) {
    if (pluginServicePlugin != null) servicePluginByKey.set(initial.R3t(plugin.plugin), pluginServicePlugin);
  }

  const data = initial.jv(remotePlugins, hiddenPluginIds, pluginSettings).map((plugin: Record<string, any>) => {
    const key = initial.R3t(plugin.plugin);
    const installed = installedByKey.get(key) ?? null;
    const pluginServicePlugin = servicePluginByKey.get(key);
    return {
      ...(pluginServicePlugin == null ? initial.dv(plugin) : initial.gv(pluginServicePlugin, installed)),
      enabled: installed?.plugin.enabled ?? plugin.plugin.enabled,
      installed: installed?.plugin.installed ?? plugin.plugin.installed,
      ...(installed == null ? {} : { installedPlugin: installed }),
      logoDarkPath: plugin.logoDarkPath ?? installed?.logoDarkPath ?? null,
      logoPath: plugin.logoPath ?? installed?.logoPath ?? null,
    };
  });

  return {
    data,
    error,
    fetchNextPage,
    hasNextPage: remoteSearchEnabled && remoteSearch.hasNextPage,
    isFetchNextPageError: remoteSearch.isFetchNextPageError,
    isFetchingNextPage: remoteSearch.isFetchingNextPage,
    isLoading: false,
  };
}

function initializeSearchPlugins(): void {
  if (initialized) return;
  initialized = true;
  for (const name of ["jZ", "$I", "SL", "FX", "wL"]) shared[name]?.();
  for (const name of ["z3t", "Wgn", "HZt", "G6t", "M6t", "$6t", "zv", "K3t", "xv", "E4t", "_cn", "Bfn", "ifn", "pdn", "Sht", "_v", "P6t", "i4t"]) initial[name]?.();
  shared.QI?.();
  shared.ek?.();
}

initializeSearchPlugins();

export { useSearchPlugins as n, initializeSearchPlugins as t };
