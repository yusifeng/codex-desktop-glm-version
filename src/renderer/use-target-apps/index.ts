import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  $O as queryDurations,
  FX as initializeSignalRuntime,
  K2 as initializeIntlRuntime,
  LX as useScope,
  NK as isWorkspacePath,
  PK as isFilePath,
  UI as awaitHostRequest,
  _L as useQuery,
  e6 as ReactRuntime,
  ek as initializeMutationRuntime,
  gL as initializeUseQuery,
  lk as initializeHooksRuntime,
  n4 as useIntl,
  pk as toastManagerSignal,
  wL as initializeQueryOptions,
  type MaitaiScopeApi,
  type UseQueryResult,
} from "@rchunk/app-shared";
import {
  $en as routeScope,
  Cpn as analyticsServiceSignal,
  _ft as initializeOpenTargetMutation,
  fgn as initializeAccountState,
  hft as openTargetMutationSignal,
  itn as initializeRouteState,
  mft as initializeTargetAppsQuery,
  mnt as initializeAppServices,
  pnt as appServices,
  vft as targetAppsQuery,
  yft as fetchTargetApps,
  ypn as initializeAnalytics,
} from "@rchunk/app-initial";
import {
  n as analyticsAttributionSignal,
  t as initializeAnalyticsAttribution,
} from "@rchunk/codex-analytics-attribution";

interface TargetApp extends Record<string, unknown> {
  appPath?: string | null;
  available?: boolean;
  default?: boolean;
  id: string;
  kind?: string;
  resolvedIcon?: unknown;
  target: string;
}

interface TargetAppsResult extends Record<string, unknown> {
  availableTargets?: string[];
  mode?: unknown;
  preferredTarget?: string | null;
  targets: TargetApp[];
}

interface TargetAppsParameters extends Record<string, unknown> {
  cwd?: string;
  deferEnrichment?: boolean;
  hostId?: string;
  nativeBrowserDiscovery?: "known";
  path?: string;
}

interface TargetAppsQueryClient {
  getQueryData<Data>(queryKey: readonly unknown[]): Data | undefined;
  setQueryData<Data>(
    queryKey: readonly unknown[],
    value: Data | ((current: Data | undefined) => Data | undefined),
  ): void;
}

interface TargetAppsQueryDefinition {
  getOptions(parameters: TargetAppsParameters): {
    queryKey: readonly unknown[];
    [key: string]: unknown;
  };
}

interface OpenTargetOptions extends Record<string, unknown> {
  appPath?: string;
  column?: number;
  line?: number;
  openMode?: string;
  path?: string;
  persistPreferred?: boolean;
}

interface UseTargetAppsOptions extends Record<string, unknown> {
  cwd?: string;
  deferEnrichment?: boolean;
  hostId?: string;
  openPath?: string;
  turnId?: string;
}

interface PrefetchTargetAppsProps extends Record<string, unknown> {
  cwd?: string;
  delayMs?: number;
  hostId?: string;
  openPath?: string;
}

interface OpenTargetMutation {
  mutate(
    variables: Record<string, unknown>,
    callbacks: {
      onError(): void;
      onSuccess(result: { success: boolean }): void;
    },
  ): void;
}

function updateTarget(
  queryClient: TargetAppsQueryClient,
  queryKey: readonly unknown[],
  targetId: string,
  signal: AbortSignal | undefined,
  update: Partial<TargetApp>,
): void {
  if (signal?.aborted) return;
  queryClient.setQueryData<TargetAppsResult>(queryKey, (current) => {
    if (current == null) return current;
    const targets = current.targets.map((target) =>
      target.id === targetId ? { ...target, ...update } : target,
    );
    return {
      ...current,
      availableTargets: targets.flatMap((target) =>
        target.available ? [target.target] : [],
      ),
      targets,
    };
  });
}

async function enrichTargetApps(input: {
  params: TargetAppsParameters;
  queryClient: TargetAppsQueryClient;
  queryKey: readonly unknown[];
  signal?: AbortSignal;
}): Promise<TargetAppsResult> {
  const { params, queryClient, queryKey, signal } = input;
  const result = (await fetchTargetApps(params, signal)) as TargetAppsResult;
  if (signal?.aborted) return result;
  queryClient.setQueryData(queryKey, result);
  await Promise.all(
    result.targets.map(async (target) => {
      let available: boolean;
      try {
        available = (
          await awaitHostRequest(
            appServices.openIn.detectTarget({ target: target.target }),
            signal,
          )
        ).available;
      } catch {
        updateTarget(queryClient, queryKey, target.id, signal, {
          available: false,
          resolvedIcon: null,
        });
        return;
      }
      updateTarget(queryClient, queryKey, target.id, signal, {
        available,
        ...(available ? {} : { resolvedIcon: null }),
      });
      if (!available || signal?.aborted) return;
      try {
        const { icon } = await awaitHostRequest(
          appServices.openIn.loadTargetIcon({ target: target.target }),
          signal,
        );
        updateTarget(queryClient, queryKey, target.id, signal, {
          resolvedIcon: icon,
        });
      } catch {
        updateTarget(queryClient, queryKey, target.id, signal, {
          resolvedIcon: null,
        });
      }
    }),
  );
  return queryClient.getQueryData<TargetAppsResult>(queryKey) ?? result;
}

function canLoadTargets({ cwd, openPath }: UseTargetAppsOptions): boolean {
  return Boolean(cwd ?? openPath);
}

function isDiscoverableLocalPath(path: string | undefined): boolean {
  if (path == null) return false;
  if (isWorkspacePath(path) || isFilePath(path)) return true;
  try {
    const url = new URL(path);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isLocalHost(hostId: string | undefined): boolean {
  return hostId == null || hostId === "local";
}

async function loadTargetApps(input: {
  params: TargetAppsParameters;
  queryClient: TargetAppsQueryClient;
  queryKey: readonly unknown[];
  signal?: AbortSignal;
}): Promise<TargetAppsResult> {
  const { params, queryClient, queryKey, signal } = input;
  if (params.deferEnrichment) return enrichTargetApps(input);
  if (isLocalHost(params.hostId) && isDiscoverableLocalPath(params.path)) {
    const known = (await fetchTargetApps(
      { ...params, nativeBrowserDiscovery: "known" },
      signal,
    )) as TargetAppsResult;
    if (
      known.targets.some(
        (target) => target.kind === "native" && target.appPath != null,
      )
    ) {
      queryClient.setQueryData(queryKey, known);
    }
  }
  return (await fetchTargetApps(params, signal)) as TargetAppsResult;
}

function useTargetAppsQuery(options: TargetAppsParameters & {
  isQueryEnabled?: boolean;
}): UseQueryResult<TargetAppsResult> {
  const {
    cwd,
    deferEnrichment = false,
    hostId,
    isQueryEnabled = false,
    path,
  } = options;
  const scope = useScope(routeScope) as MaitaiScopeApi<Record<string, unknown>>;
  const parameters: TargetAppsParameters = {
    cwd,
    hostId,
    path,
    ...(deferEnrichment ? { deferEnrichment: true } : {}),
  };
  const baseOptions = (
    targetAppsQuery as TargetAppsQueryDefinition
  ).getOptions(parameters);
  const queryClient = scope.queryClient as TargetAppsQueryClient;
  return useQuery<TargetAppsResult>({
    ...baseOptions,
    queryFn: ({ signal }) =>
      loadTargetApps({
        params: parameters,
        queryClient,
        queryKey: baseOptions.queryKey,
        signal,
      }),
    enabled: canLoadTargets({ cwd, hostId, openPath: path }) && isQueryEnabled,
    staleTime: queryDurations.ONE_MINUTE,
  });
}

function useOpenTarget(options: UseTargetAppsOptions & {
  targets?: TargetApp[];
}): (target: string, options: OpenTargetOptions) => void {
  const {
    cwd,
    deferEnrichment = false,
    hostId,
    openPath,
    targets,
    turnId,
  } = options;
  const scope = useScope(routeScope) as MaitaiScopeApi<Record<string, unknown>>;
  const intl = useIntl();
  const showError = (): void => {
    scope.get(toastManagerSignal).danger(
      String(intl.formatMessage({
        id: "localConversation.openTarget.error",
        defaultMessage: "Unable to open item",
        description: "Toast shown when opening a file or website externally fails",
      })),
      { errorAnalytics: { toastId: "localConversation.openTarget.error" } },
    );
  };
  return (target, openOptions) => {
    const {
      appPath,
      column,
      line,
      openMode,
      path,
      persistPreferred,
    } = openOptions;
    const resolvedPath = path ?? openPath ?? cwd;
    if (!resolvedPath) return;
    const selectedTarget = targets?.find(
      (candidate) =>
        candidate.target === target &&
        (candidate.appPath ?? null) === (appPath ?? null),
    );
    if (selectedTarget?.kind === "editor" && turnId != null) {
      const attribution = analyticsAttributionSignal == null
        ? null
        : scope.get(analyticsAttributionSignal);
      if (attribution != null) {
        scope.get(analyticsServiceSignal).submitCodexAnalyticsEvent?.({
          action: "open_in_ide",
          eventKind: "action",
          metadata: { target },
          threadId: attribution.threadId,
          turnId,
        });
      }
    }
    if (persistPreferred && cwd) {
      const queryApi = scope.query as unknown as {
        setData(
          query: unknown,
          parameters: TargetAppsParameters,
          updater: (current: TargetAppsResult | undefined) =>
            | TargetAppsResult
            | undefined,
        ): void;
      };
      queryApi.setData(
        targetAppsQuery,
        {
          cwd,
          hostId,
          path: openPath,
          ...(deferEnrichment ? { deferEnrichment: true } : {}),
        },
        (current) =>
          current && {
            ...current,
            preferredTarget: target,
            targets: current.targets.map((candidate) => ({
              ...candidate,
              default: candidate.target === target || undefined,
            })),
          },
      );
    }
    (scope.get(openTargetMutationSignal) as OpenTargetMutation).mutate(
      {
        path: resolvedPath,
        cwd: cwd ?? null,
        target,
        appPath,
        line,
        column,
        openMode,
        ...(persistPreferred && cwd
          ? { persistPreferredTargetPath: cwd }
          : {}),
        hostId,
      },
      {
        onSuccess: (result) => {
          if (!result.success) showError();
        },
        onError: showError,
      },
    );
  };
}

function useTargetApps(options: UseTargetAppsOptions): {
  availableTargets: string[];
  canLoadTargets: boolean;
  hasLoadedTargets: boolean;
  isLoadingTargets: boolean;
  mode: unknown;
  open(target: string, options: OpenTargetOptions): void;
  preferredTarget: string | null;
  targets: TargetApp[];
} {
  const { cwd, deferEnrichment = false, hostId, openPath, turnId } = options;
  const query = useTargetAppsQuery({
    cwd,
    hostId,
    isQueryEnabled: deferEnrichment,
    path: openPath,
    deferEnrichment,
  });
  const open = useOpenTarget({
    cwd,
    deferEnrichment,
    hostId,
    openPath,
    targets: query.data?.targets,
    turnId,
  });
  return {
    canLoadTargets: canLoadTargets(options),
    preferredTarget: query.data?.preferredTarget ?? null,
    targets: query.data?.targets ?? [],
    availableTargets: query.data?.availableTargets ?? [],
    mode: query.data?.mode,
    hasLoadedTargets: query.data != null,
    isLoadingTargets: query.isFetching,
    open,
  };
}

function PrefetchTargetApps(props: PrefetchTargetAppsProps): null {
  const { cwd, delayMs = 0, hostId, openPath } = props;
  const loadable = canLoadTargets({ cwd, hostId, openPath });
  const immediatelyEnabled = delayMs <= 0;
  const { data, refetch } = useTargetAppsQuery({
    cwd,
    hostId,
    isQueryEnabled: immediatelyEnabled,
    path: openPath,
  });
  const refetchEvent = ReactRuntime.useEffectEvent?.(() => {
    void refetch();
  }) ?? (() => {
    void refetch();
  });
  ReactRuntime.useEffect(() => {
    if (immediatelyEnabled || !loadable || data != null) return;
    const timeout = window.setTimeout(refetchEvent, delayMs);
    return () => window.clearTimeout(timeout);
  }, [loadable, cwd, data, delayMs, hostId, openPath, immediatelyEnabled]);
  return null;
}

let initialized = false;
function initializeUseTargetApps(): void {
  if (initialized) return;
  initialized = true;
  initializeCompilerRuntime();
  initializeUseQuery();
  initializeSignalRuntime();
  initializeQueryOptions();
  ReactRuntime();
  initializeIntlRuntime();
  initializeHooksRuntime();
  initializeOpenTargetMutation();
  initializeTargetAppsQuery();
  initializeAnalyticsAttribution();
  initializeAnalytics();
  initializeRouteState();
  initializeAccountState();
  initializeMutationRuntime();
  initializeAppServices();
}

export {
  initializeUseTargetApps as n,
  useTargetApps as r,
  PrefetchTargetApps as t,
};
