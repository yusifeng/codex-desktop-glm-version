import {
  $3 as reactCompilerRuntime,
  $O as timeConstants,
  BX as useSignalValue,
  EU as gitSettings,
  FX as initializeSignalRuntime,
  QI as initializeScopeRuntime,
  SU as normalizeDesktopConfig,
  TU as worktreeSettings,
  ZI as appScope,
  _L as useQuery,
  ek as initializeQueryHooks,
  gL as initializeReactQuery,
  rZ as createDerivedFamily,
  wL as initializeAutomationRuntime,
} from "@rchunk/app-shared";
import {
  $sn as initializeHostConfig,
  Bcn as readSetting,
  Bfn as initializeAppServices,
  Con as initializeHostConfigQueries,
  Gcn as localConfigAvailable,
  Gsn as hostInvalidationKey,
  Jht as worktreeRootQueryKey,
  Jsn as configInvalidationKey,
  Kht as codexWorktreesQueryKey,
  Ksn as settingsInvalidationKey,
  Ucn as writeLocalSetting,
  Ugn as getHostService,
  Vcn as initializeGitService,
  Wgn as initializeHostServices,
  _cn as initializeRemoteConfig,
  _on as normalizeHostConfig,
  aun as initializeQueryInvalidation,
  lcn as remoteConfigQuery,
  mcn as worktreesQuery,
  oun as invalidateQuery,
  qht as initializeGitQueries,
  won as getRpcClient,
} from "@rchunk/app-initial";

void reactCompilerRuntime;

export interface WorktreeSetting<Value = unknown> {
  key: string;
  defaultValue?: Value;
}

export interface RemoteConfigResponse {
  config: { desktop: Record<string, unknown> };
  [key: string]: unknown;
}

export interface RemoteConfigData {
  configReadSucceeded?: boolean;
  configWriteTarget?: { filePath?: string | null };
  config?: { desktop?: Record<string, unknown> };
}

export interface WorktreeScope {
  get(signal: unknown, parameter?: unknown): { data?: RemoteConfigData };
  query: {
    snapshot(signal: unknown, parameter: unknown): {
      cancel(): Promise<void>;
      getOrFetch(): Promise<{ response: RemoteConfigResponse }>;
      queryKey: unknown;
      setData(data: { response: RemoteConfigResponse }): void;
    };
  };
  queryClient: unknown;
}

let worktreeConfig$: import("@rchunk/app-shared").ScopedDerivedFamily<
  Record<string, unknown>,
  string,
  import("@rchunk/app-shared").ResolvedWorktreeSettings | null
>;

async function updateWorktreeSetting<Value>(
  scope: WorktreeScope,
  hostId: string,
  setting: WorktreeSetting<Value>,
  value: Value,
): Promise<void> {
  if (hostId === "local") {
    await writeLocalSetting(scope, setting, value);
    return;
  }
  const snapshot = scope.query.snapshot(remoteConfigQuery, hostId);
  const previous = await snapshot.getOrFetch();
  await snapshot.cancel();
  const writeTarget = scope.get(remoteConfigQuery, hostId).data?.configWriteTarget;
  snapshot.setData({
    ...previous,
    response: {
      ...previous.response,
      config: Object.assign(structuredClone(previous.response.config), {
        desktop: {
          ...previous.response.config.desktop,
          [setting.key]: value,
        },
      }),
    },
  });
  try {
    const service = getHostService(scope, hostId) as {
      sendRequest(method: string, parameters: unknown): Promise<void>;
    };
    await service.sendRequest("config/batchWrite", {
      edits: [
        {
          keyPath: `desktop.${setting.key}`,
          value,
          mergeStrategy: "replace",
        },
      ],
      filePath: writeTarget?.filePath ?? null,
      expectedVersion: null,
      reloadUserConfig: true,
    });
  } catch (error) {
    snapshot.setData(previous);
    throw error;
  } finally {
    const keys: unknown[] = [
      [...configInvalidationKey, hostId],
      [...hostInvalidationKey, hostId],
      [...settingsInvalidationKey, hostId],
    ];
    if (setting.key === gitSettings.worktreeRoot.key) {
      keys.push(
        worktreeRootQueryKey(hostId),
        codexWorktreesQueryKey(hostId),
        scope.query.snapshot(worktreesQuery, { hostId }).queryKey,
      );
    }
    await Promise.all(keys.map((key) => invalidateQuery(scope.queryClient, key)));
  }
}

function initializeWorktreeConfig(): void {
  initializeSignalRuntime();
  initializeAutomationRuntime();
  initializeHostServices();
  initializeHostConfig();
  initializeQueryInvalidation();
  initializeScopeRuntime();
  initializeRemoteConfig();
  initializeGitService();
  initializeAppServices();
  initializeGitQueries();
  worktreeConfig$ = createDerivedFamily(
    appScope,
    (hostId: string, { get }) => {
      if (hostId === "local") {
        return get(localConfigAvailable)
          ? normalizeDesktopConfig({
              [gitSettings.worktreeRoot.key]: readSetting(
                get,
                gitSettings.worktreeRoot,
              ),
              [worktreeSettings.autoCleanupEnabled.key]: readSetting(
                get,
                worktreeSettings.autoCleanupEnabled,
              ),
              [worktreeSettings.keepCount.key]: readSetting(
                get,
                worktreeSettings.keepCount,
              ),
            })
          : null;
      }
      const remote = get(remoteConfigQuery, hostId) as { data?: RemoteConfigData };
      return remote.data?.configReadSucceeded === true
        ? normalizeDesktopConfig(remote.data.config?.desktop ?? {})
        : null;
    },
  );
}

function useCodexWorktrees(
  host: unknown,
  operationSource: string,
  options?: { enabled?: boolean },
): unknown {
  const hostConfig = normalizeHostConfig(host);
  const config = useSignalValue(worktreeConfig$, hostConfig) as {
    worktreesRoot?: string | null;
  } | null;
  const worktreesRoot = config?.worktreesRoot ?? null;
  const enabled = config != null && (options?.enabled ?? true);
  const queryKey = codexWorktreesQueryKey(hostConfig, worktreesRoot);
  return useQuery({
    enabled,
    queryKey,
    queryFn: ({ signal }) =>
      getRpcClient("git").request({
        method: "codex-worktrees",
        params: { hostConfig: host, operationSource, worktreesRoot },
        signal,
      }),
    staleTime: timeConstants.INFINITE,
    gcTime: 1_800_000,
  });
}

function initializeUseCodexWorktrees(): void {
  initializeReactQuery();
  initializeSignalRuntime();
  initializeQueryHooks();
  initializeHostConfigQueries();
  initializeWorktreeConfig();
  initializeGitQueries();
}

export {
  worktreeConfig$ as a,
  updateWorktreeSetting as i,
  useCodexWorktrees as n,
  initializeWorktreeConfig as r,
  initializeUseCodexWorktrees as t,
};
