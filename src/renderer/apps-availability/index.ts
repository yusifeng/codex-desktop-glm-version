import {
  $3 as getCompilerRuntime,
  CL as useQueryClient,
  FX as initializeScopeRuntime,
  G2 as defineMessages,
  HX as useSignalValue,
  K2 as initializeInternationalization,
  LX as useScope,
  Q3 as logger,
  QI as initializeQueryClient,
  SL as initializeQueryClientHook,
  Z3 as initializeQueryRuntime,
  ZI as appScope,
  iL as useMutation,
  lk as initializeToastRuntime,
  n4 as useIntl,
  pk as toastManagerSignal,
  rL as initializeMutationHook,
  type IntlShape,
  type MessageDescriptor,
} from "@rchunk/app-shared";
import {
  $sn as initializeSavedConfig,
  Bfn as initializeHostConfig,
  G6t as initializeBrowserSkills,
  Gsn as availableAppsDependencyKey,
  H6t as appsCapabilitySignal,
  HEt as initializeAppsCapability,
  Jsn as appsListKey,
  Ksn as connectorsDependencyKey,
  LEt as getAvailableAppsQueryKey,
  Qsn as getSavedConfigMetadata,
  Ugn as getHostBridge,
  Wgn as initializeHostBridge,
  aun as initializeHostRequests,
  ffn as readExperiment,
  pfn as initializeExperimentRuntime,
  sun as useInvalidateQuery,
} from "@rchunk/app-initial";
import { a as initializeSuggestionsEligibility, n as getSuggestionsQueryKey } from "@rchunk/new-chat-page-suggestions-eligibility";
import "@rchunk/rolldown-runtime";

interface AvailableApp { id: string; isEnabled: boolean; name?: string }
interface AvailabilityUpdate { appId: string; appName?: string; enabled: boolean }
interface AppsAvailabilityController {
  isUpdating: boolean;
  setAppEnabled(update: AvailabilityUpdate): Promise<unknown>;
  updatingAppId: string | null;
}
interface QueryClient {
  cancelQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
  getQueryData<T>(queryKey: readonly unknown[]): T | undefined;
  setQueryData<T>(queryKey: readonly unknown[], value: T): void;
}
interface ScopeApi {
  get<T>(signal: unknown): T;
}
interface CompilerRuntime { c(size: number): unknown[] }

let compiler: CompilerRuntime;
let appsConfigKey: string;
let messages: Record<string, MessageDescriptor>;

function configEdits({ appId, enabled }: AvailabilityUpdate): Array<{ keyPath: string; mergeStrategy: "upsert"; value: boolean }> {
  return [{ keyPath: `${appsConfigKey}.${appId}.enabled`, value: enabled, mergeStrategy: "upsert" }];
}

function useAppsAvailability(options?: { hostId?: string }): AppsAvailabilityController {
  const cache = compiler.c(36);
  const hostId = options?.hostId ?? "local";
  const scope = useScope(appScope) as unknown as ScopeApi;
  const capability = useSignalValue(appsCapabilitySignal as never);
  const queryClient = useQueryClient() as unknown as QueryClient;
  const invalidate = useInvalidateQuery();
  const intl = useIntl() as IntlShape;
  let queryKey: readonly unknown[];
  if (cache[0] !== capability || cache[1] !== hostId || cache[2] !== scope) {
    queryKey = getAvailableAppsQueryKey(hostId, readExperiment(scope, "403472035"), undefined);
    cache[0] = capability; cache[1] = hostId; cache[2] = scope; cache[3] = queryKey;
  } else queryKey = cache[3] as readonly unknown[];
  let onSettled: () => Promise<void>;
  if (cache[4] !== queryKey || cache[5] !== hostId || cache[6] !== invalidate) {
    onSettled = async () => {
      await Promise.all([
        invalidate(getSuggestionsQueryKey(hostId)), invalidate(queryKey),
        invalidate([...availableAppsDependencyKey, hostId]), invalidate([...connectorsDependencyKey, hostId]),
        invalidate(appsListKey), invalidate(["user-saved-config"]),
      ]);
    };
    cache[4] = queryKey; cache[5] = hostId; cache[6] = invalidate; cache[7] = onSettled;
  } else onSettled = cache[7] as typeof onSettled;
  let mutationFn: (update: AvailabilityUpdate) => Promise<unknown>;
  if (cache[8] !== hostId || cache[9] !== queryClient || cache[10] !== scope) {
    mutationFn = async ({ appId, enabled }) => {
      const metadata = await getSavedConfigMetadata(scope, queryClient, hostId);
      const result = await getHostBridge(scope, hostId).sendRequest("config/batchWrite", {
        edits: configEdits({ appId, enabled }), filePath: metadata?.filePath ?? null,
        expectedVersion: metadata?.expectedVersion ?? null, reloadUserConfig: true,
      }) as { status?: string };
      if (result.status === "okOverridden") throw Error("App setting is overridden by project configuration");
      return result;
    };
    cache[8] = hostId; cache[9] = queryClient; cache[10] = scope; cache[11] = mutationFn;
  } else mutationFn = cache[11] as typeof mutationFn;
  let onMutate: (update: AvailabilityUpdate) => Promise<{ previousApps: AvailableApp[] | undefined }>;
  if (cache[12] !== queryKey || cache[13] !== queryClient) {
    onMutate = async ({ appId, enabled }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousApps = queryClient.getQueryData<AvailableApp[]>(queryKey);
      if (previousApps) queryClient.setQueryData(queryKey, previousApps.map((app) => app.id !== appId || app.isEnabled === enabled ? app : { ...app, isEnabled: enabled }));
      return { previousApps };
    };
    cache[12] = queryKey; cache[13] = queryClient; cache[14] = onMutate;
  } else onMutate = cache[14] as typeof onMutate;
  let onSuccess: (_data: unknown, update: AvailabilityUpdate, context?: { previousApps?: AvailableApp[] }) => Promise<void>;
  if (cache[15] !== queryKey || cache[16] !== intl || cache[17] !== invalidate || cache[18] !== queryClient || cache[19] !== scope) {
    onSuccess = async (_data, { appId, appName, enabled }, context) => {
      if (enabled && context?.previousApps?.find((app) => app.id === appId)?.isEnabled === false) {
        await invalidate(queryKey);
        if (queryClient.getQueryData<AvailableApp[]>(queryKey)?.find((app) => app.id === appId)?.isEnabled === false) throw Error("App remains disabled after updating its configuration");
      }
      const resolvedName = appName ?? queryClient.getQueryData<AvailableApp[]>(queryKey)?.find((app) => app.id === appId)?.name ?? appId;
      scope.get<{ success(message: string): void }>(toastManagerSignal).success(String(intl.formatMessage(enabled ? messages.enableSuccess : messages.disableSuccess, { appName: resolvedName })));
    };
    cache[15] = queryKey; cache[16] = intl; cache[17] = invalidate; cache[18] = queryClient; cache[19] = scope; cache[20] = onSuccess;
  } else onSuccess = cache[20] as typeof onSuccess;
  let onError: (error: unknown, update: AvailabilityUpdate, context?: { previousApps?: AvailableApp[] }) => void;
  if (cache[21] !== queryKey || cache[22] !== intl || cache[23] !== queryClient || cache[24] !== scope) {
    onError = (error, _update, context) => {
      logger.error("Failed to update app enablement", { safe: {}, sensitive: { error } });
      scope.get<{ danger(message: string, options?: unknown): void }>(toastManagerSignal).danger(String(intl.formatMessage(messages.updateError)), { errorAnalytics: { toastId: "appsAvailability.onError.updateError" } });
      if (context?.previousApps) queryClient.setQueryData(queryKey, context.previousApps);
    };
    cache[21] = queryKey; cache[22] = intl; cache[23] = queryClient; cache[24] = scope; cache[25] = onError;
  } else onError = cache[25] as typeof onError;
  let mutationOptions: Record<string, unknown>;
  if (cache[26] !== onSettled || cache[27] !== mutationFn || cache[28] !== onMutate || cache[29] !== onSuccess || cache[30] !== onError) {
    mutationOptions = { mutationFn, onMutate, onSuccess, onError, onSettled };
    cache[26] = onSettled; cache[27] = mutationFn; cache[28] = onMutate; cache[29] = onSuccess; cache[30] = onError; cache[31] = mutationOptions;
  } else mutationOptions = cache[31] as Record<string, unknown>;
  const mutation = useMutation(mutationOptions as never) as unknown as { isPending: boolean; mutateAsync(update: AvailabilityUpdate): Promise<unknown>; variables?: AvailabilityUpdate };
  const updatingAppId = mutation.isPending ? mutation.variables?.appId ?? null : null;
  let result: AppsAvailabilityController;
  if (cache[32] !== mutation.isPending || cache[33] !== mutation.mutateAsync || cache[34] !== updatingAppId) {
    result = { setAppEnabled: mutation.mutateAsync, isUpdating: mutation.isPending, updatingAppId };
    cache[32] = mutation.isPending; cache[33] = mutation.mutateAsync; cache[34] = updatingAppId; cache[35] = result;
  } else result = cache[35] as AppsAvailabilityController;
  return result;
}

function initializeAppsAvailability(): void {
  compiler = getCompilerRuntime() as CompilerRuntime;
  initializeMutationHook(); initializeQueryClientHook(); initializeScopeRuntime(); initializeInternationalization();
  initializeSuggestionsEligibility(); initializeHostBridge(); initializeBrowserSkills(); initializeToastRuntime();
  initializeAppsCapability(); initializeSavedConfig(); initializeHostRequests(); initializeQueryClient(); initializeHostConfig();
  initializeExperimentRuntime(); initializeQueryRuntime();
  appsConfigKey = "apps";
  messages = defineMessages({
    enableSuccess: { id: "apps.enable.success", defaultMessage: "{appName} app enabled", description: "Toast shown after successfully enabling an app" },
    disableSuccess: { id: "apps.disable.success", defaultMessage: "{appName} app disabled", description: "Toast shown after successfully disabling an app" },
    updateError: { id: "apps.update.error", defaultMessage: "Failed to update app", description: "Toast shown when enabling or disabling an app fails" },
  });
}

export { useAppsAvailability as n, initializeAppsAvailability as t };
