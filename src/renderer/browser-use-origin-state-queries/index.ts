import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  $O as queryDurations,
  CL as useQueryClient,
  E4 as arraySchema,
  FX as initializeSignalRuntime,
  G4 as recordSchema,
  H4 as objectSchema,
  LX as useScope,
  Q3 as logger,
  QI as initializeQueryRuntime,
  SL as initializeQueryClientHook,
  Z3 as initializeLogger,
  Z4 as originDecisionSchema,
  ZI as appScope,
  ek as initializeMutationRuntime,
  g4 as initializeValidationRuntime,
  iL as useMutation,
  k4 as booleanSchema,
  q4 as stringSchema,
  rL as initializeUseMutation,
  rZ as createDerivedFamily,
  type MaitaiScopeApi,
  type UseMutationResult,
} from "@rchunk/app-shared";
import {
  $sn as initializeBrowserUseSettings,
  Bfn as initializeConfigurationState,
  Kdn as getWritableConfigurationLayer,
  Nsn as parseNetworkPattern,
  Qln as invokeRendererCommand,
  Ugn as getAppServerClient,
  Wgn as initializeAppServerClient,
  Xdn as initializeConfigurationLayers,
  Ydn as configurationLayerPath,
  aun as initializeCommandQueries,
  bsn as initializeOriginParser,
  ksn as originPatternMatches,
  lcn as configurationQuery,
  mnt as initializeAppServices,
  nun as initializeRendererCommands,
  pnt as appServices,
  sun as useInvalidateBrowserState,
  tun as createCommandQueryFamily,
  ugn as defaultHostId,
} from "@rchunk/app-initial";
import { parseHttpUrl as parseBrowserUrl } from "../app-initial/runtime/parse-http-url";
import {
  domainMatchesPattern,
  parseOriginPattern,
} from "../app-initial/runtime/parse-origin-pattern";
import { configurationQueryKey } from "../app-initial/runtime/configuration-query-key";
import { createCommandQueryKey } from "../app-initial/runtime/create-command-query-key";

type OriginDecision = "allow" | "deny" | null;
type BrowserCapability =
  | "origin"
  | "history"
  | "upload"
  | "download"
  | "fullCdp"
  | "autoReview"
  | "persistentApproval";

interface OriginPolicy extends Record<string, unknown> {
  access?: OriginDecision;
  autoReview?: boolean | OriginDecision;
  downloads?: OriginDecision;
  fullCdpAccess?: OriginDecision;
  full_cdp_access?: OriginDecision;
  persistentApproval?: boolean | null;
  uploads?: OriginDecision;
}

interface BrowserUseConfiguration extends Record<string, unknown> {
  allowGlobalPersistentApproval?: boolean;
  allowHistoryAccess?: boolean;
  defaultOriginPolicy?: OriginPolicy;
  default_origin_policy?: OriginPolicy;
  disableAutoReview?: boolean;
  origins?: Record<string, OriginPolicy | null | undefined>;
}

interface NetworkConfiguration extends Record<string, unknown> {
  allowedDomains?: string[];
  deniedDomains?: string[];
  domains?: Record<string, "allow" | "deny" | null | undefined>;
  enabled?: boolean;
  managedAllowedDomainsOnly?: boolean;
}

interface BrowserPolicyConfiguration extends Record<string, unknown> {
  allowBrowserAndComputerUse?: boolean;
  browserUse?: BrowserUseConfiguration;
  featureRequirements?: {
    browser_use?: boolean;
    browser_use_external?: boolean;
    browser_use_full_cdp_access?: boolean;
    in_app_browser?: boolean;
  };
  network?: NetworkConfiguration;
}

interface ParsedOrigin {
  canonicalKey: string;
  canonicalPattern: string;
  hostname: string;
}

interface ConfigurationEdit {
  keyPath: string;
  mergeStrategy: "replace" | "upsert";
  value: unknown;
}

interface OriginRuleUpdate {
  configUpdate?: { origin: string; policy: OriginPolicy | null };
  updates: unknown;
}

interface ConfigurationReadResult {
  configReadSucceeded?: boolean;
  configWriteTarget?: { filePath?: string | null } | null;
  config: BrowserPolicyConfiguration;
}

interface ConfigurationQueryResult {
  layers: unknown;
  readSucceeded?: boolean;
  response: {
    config: BrowserPolicyConfiguration;
    layers: unknown;
  };
}

interface BrowserUsePermissionsService {
  clearPrewarmedThreads(): Promise<void>;
  updateIabHistoryApprovalMode(value: unknown): Promise<unknown>;
  updateOriginRules(value: unknown): Promise<unknown>;
  updateWebMcpEnabled(value: unknown): Promise<unknown>;
}

function getOriginPolicies(
  configuration: BrowserPolicyConfiguration | null | undefined,
): Array<{ pattern: string; policy: OriginPolicy }> {
  const policies: Array<{ pattern: string; policy: OriginPolicy }> = [];
  for (const [pattern, policy] of Object.entries(
    configuration?.browserUse?.origins ?? {},
  )) {
    const parsed = parseOriginPattern(pattern) as unknown as ParsedOrigin | null;
    if (
      parsed != null &&
      policy != null &&
      Object.values(policy).some((value) => value != null)
    ) {
      policies.push({ pattern: parsed.canonicalPattern, policy });
    }
  }
  return policies;
}

function getNetworkRules(
  configuration: BrowserPolicyConfiguration | null | undefined,
): Array<{ decision: "allow" | "deny"; pattern: ParsedOrigin }> {
  const network = configuration?.network;
  const entries: Array<[string, "allow" | "deny"]> = network?.domains == null
    ? [
        ...(network?.allowedDomains ?? []).map(
          (domain): [string, "allow"] => [domain, "allow"],
        ),
        ...(network?.deniedDomains ?? []).map(
          (domain): [string, "deny"] => [domain, "deny"],
        ),
      ]
    : Object.entries(network.domains).flatMap(([pattern, decision]) =>
        decision == null ? [] : [[pattern, decision]],
      );
  return entries.flatMap(([pattern, decision]) => {
    const parsed = parseNetworkPattern(pattern) as ParsedOrigin | null;
    return parsed == null || parsed.canonicalPattern.length === 0
      ? []
      : [{ decision, pattern: parsed }];
  });
}

function hasBrowserUseRestrictions(
  configuration: BrowserPolicyConfiguration | null | undefined,
): boolean {
  if (configuration == null) return false;
  const browserUse = configuration.browserUse;
  const requirements = configuration.featureRequirements;
  const network = configuration.network;
  return (
    configuration.allowBrowserAndComputerUse != null ||
    requirements?.in_app_browser != null ||
    requirements?.browser_use != null ||
    requirements?.browser_use_external != null ||
    requirements?.browser_use_full_cdp_access != null ||
    browserUse?.allowHistoryAccess != null ||
    browserUse?.disableAutoReview != null ||
    browserUse?.allowGlobalPersistentApproval != null ||
    (browserUse?.defaultOriginPolicy != null &&
      Object.values(browserUse.defaultOriginPolicy).some((value) => value != null)) ||
    getOriginPolicies(configuration).length > 0 ||
    network?.enabled === false ||
    network?.managedAllowedDomainsOnly === true ||
    getNetworkRules(configuration).some(({ decision }) => decision === "deny")
  );
}

function isBrowserUseSupported(
  configuration: BrowserPolicyConfiguration | null | undefined,
): boolean {
  return (
    configuration?.allowBrowserAndComputerUse !== false &&
    (configuration?.featureRequirements?.browser_use !== false ||
      configuration?.featureRequirements?.browser_use_external !== false)
  );
}

function isDefaultCapabilityAllowed(
  configuration: BrowserPolicyConfiguration | null | undefined,
  capability: BrowserCapability,
): boolean {
  if (
    (capability !== "history" && configuration?.network?.enabled === false) ||
    !isBrowserUseSupported(configuration)
  ) return false;
  const browserUse = configuration?.browserUse;
  const policy = browserUse?.defaultOriginPolicy;
  switch (capability) {
    case "origin":
      return configuration?.network?.managedAllowedDomainsOnly !== true && policy?.access !== "deny";
    case "history": return browserUse?.allowHistoryAccess !== false;
    case "upload": return policy?.uploads !== "deny";
    case "download": return policy?.downloads !== "deny";
    case "fullCdp":
      return configuration?.featureRequirements?.browser_use_full_cdp_access !== false && policy?.fullCdpAccess !== "deny";
    case "autoReview": return browserUse?.disableAutoReview !== true && policy?.autoReview !== "deny";
    case "persistentApproval": return policy?.persistentApproval !== false;
  }
}

function isGlobalPersistentApprovalAllowed(
  configuration: BrowserPolicyConfiguration | null | undefined,
): boolean {
  return isBrowserUseSupported(configuration) &&
    configuration?.browserUse?.allowGlobalPersistentApproval !== false;
}

function isBrowserModeAllowed(
  configuration: BrowserPolicyConfiguration | null | undefined,
  mode: "iab" | "extension" | "cdp" | undefined,
): boolean {
  if (configuration?.allowBrowserAndComputerUse === false) return false;
  const requirements = configuration?.featureRequirements;
  switch (mode) {
    case "iab": return requirements?.in_app_browser !== false && requirements?.browser_use !== false;
    case "extension": return requirements?.browser_use_external !== false;
    case "cdp":
    case undefined: return requirements?.browser_use !== false;
  }
}

function isNetworkOriginAllowed(
  configuration: BrowserPolicyConfiguration | null | undefined,
  origin: ParsedOrigin,
): boolean {
  if (configuration?.network?.enabled === false) return false;
  let explicitlyAllowed = false;
  for (const rule of getNetworkRules(configuration)) {
    if (domainMatchesPattern(rule.pattern, origin.hostname)) {
      if (rule.decision === "deny") return false;
      explicitlyAllowed = true;
    }
  }
  return configuration?.network?.managedAllowedDomainsOnly !== true || explicitlyAllowed;
}

function isOriginPolicyAllowed(
  configuration: BrowserPolicyConfiguration | null | undefined,
  origin: ParsedOrigin,
  field: keyof OriginPolicy,
): boolean {
  const policies = getOriginPolicies(configuration);
  const patternCounts = new Map<string, number>();
  for (const entry of policies) {
    patternCounts.set(entry.pattern, (patternCounts.get(entry.pattern) ?? 0) + 1);
  }
  let explicitlyAllowed = false;
  for (const entry of policies) {
    const pattern = parseOriginPattern(entry.pattern) as unknown as ParsedOrigin | null;
    if (pattern == null || !originPatternMatches(pattern, origin)) continue;
    const value = entry.policy[field];
    if (value === "deny" || value === false) return false;
    if ((value === "allow" || value === true) && patternCounts.get(entry.pattern) === 1) {
      explicitlyAllowed = true;
    }
  }
  if (explicitlyAllowed) return true;
  const fallback = configuration?.browserUse?.defaultOriginPolicy?.[field];
  return fallback !== "deny" && fallback !== false;
}

const capabilityPolicyFields: Partial<Record<BrowserCapability, keyof OriginPolicy>> = {
  download: "downloads",
  upload: "uploads",
  fullCdp: "fullCdpAccess",
  autoReview: "autoReview",
  persistentApproval: "persistentApproval",
};

function isSiteCapabilityAllowed(
  configuration: BrowserPolicyConfiguration | null | undefined,
  url: string,
  capability: BrowserCapability,
): boolean {
  if (
    !isBrowserUseSupported(configuration) ||
    (capability === "fullCdp" && configuration?.featureRequirements?.browser_use_full_cdp_access === false) ||
    (capability === "autoReview" && configuration?.browserUse?.disableAutoReview === true)
  ) return false;
  const origin = parseBrowserUrl(url) as unknown as ParsedOrigin | null;
  if (
    origin == null ||
    !isNetworkOriginAllowed(configuration, origin) ||
    !isOriginPolicyAllowed(configuration, origin, "access")
  ) return false;
  return capability === "origin" ||
    isOriginPolicyAllowed(configuration, origin, capabilityPolicyFields[capability] as keyof OriginPolicy);
}

function originPatternMatchesUrl(entry: { pattern: string }, url: string): boolean {
  const pattern = parseOriginPattern(entry.pattern) as unknown as ParsedOrigin | null;
  const origin = parseBrowserUrl(url) as unknown as ParsedOrigin | null;
  return pattern != null && origin != null && originPatternMatches(pattern, origin);
}

function domainPatternMatchesUrl(entry: { pattern: ParsedOrigin }, url: string): boolean {
  const origin = parseBrowserUrl(url) as unknown as ParsedOrigin | null;
  return origin != null && domainMatchesPattern(entry.pattern, origin.hostname);
}

let capabilityPolicyFieldsInitialized = false;
function initializeCapabilityPolicyFields(): void {
  if (capabilityPolicyFieldsInitialized) return;
  capabilityPolicyFieldsInitialized = true;
  initializeOriginParser();
}

interface LegacyPermissionsResult {
  allowedDomains: string[];
  deniedDomains: string[];
  enabled: boolean | null;
  hardDenyAllowlistMisses: false;
}

let legacyPermissionsSchema: ReturnType<typeof objectSchema>;
function initializeLegacyPermissionsSchema(): void {
  if (legacyPermissionsSchema != null) return;
  initializeOriginParser();
  initializeValidationRuntime();
  legacyPermissionsSchema = objectSchema({
    network: objectSchema({
      enabled: booleanSchema().nullish().catch(null),
      domains: recordSchema(stringSchema(), originDecisionSchema()).nullish().catch(null),
      denied_domains: arraySchema(stringSchema()).catch([]),
    }),
  });
}

function parseLegacyPermissions(value: Record<string, unknown> | null | undefined): LegacyPermissionsResult | null {
  const defaultPermissions = value?.default_permissions;
  const permissions = recordSchema(stringSchema(), originDecisionSchema()).safeParse(value?.permissions);
  if (typeof defaultPermissions !== "string" || !permissions.success) return null;
  initializeLegacyPermissionsSchema();
  const parsed = legacyPermissionsSchema.safeParse(
    (permissions.data as Record<string, unknown>)[defaultPermissions.trim()],
  );
  if (!parsed.success) return null;
  const network = (parsed.data as { network: { enabled?: boolean | null; domains?: Record<string, string> | null; denied_domains: string[] } }).network;
  return {
    enabled: network.enabled ?? null,
    allowedDomains: [],
    deniedDomains: network.domains == null
      ? network.denied_domains
      : Object.entries(network.domains).flatMap(([domain, decision]) => decision === "deny" ? [domain] : []),
    hardDenyAllowlistMisses: false,
  };
}

function getLegacyCapabilityPolicy(policy: OriginPolicy | null | undefined, capability: BrowserCapability): unknown {
  switch (capability) {
    case "origin": return policy?.access;
    case "download": return policy?.downloads;
    case "upload": return policy?.uploads;
    case "fullCdp": return policy?.full_cdp_access;
    default: return undefined;
  }
}

function createCapabilityEdit(update: { capability: BrowserCapability; enabled: boolean }): ConfigurationEdit {
  if (update.capability === "history") {
    return { keyPath: "browser_use.allow_history_access", value: update.enabled, mergeStrategy: "upsert" };
  }
  const field = { origin: "access", download: "downloads", upload: "uploads", fullCdp: "full_cdp_access" }[update.capability];
  return {
    keyPath: `browser_use.default_origin_policy.${field}`,
    value: update.enabled ? "allow" : "deny",
    mergeStrategy: "upsert",
  };
}

function createOriginPolicyEdits(
  configuration: BrowserUseConfiguration | null | undefined,
  update: { origin: string; policy: OriginPolicy | null },
): ConfigurationEdit[] {
  const parsed = parseOriginPattern(update.origin) as unknown as ParsedOrigin | null;
  if (parsed == null) throw new Error("Invalid Browser Use origin pattern");
  const matchingKeys = Object.keys(configuration?.origins ?? {}).filter(
    (key) => (parseOriginPattern(key) as unknown as ParsedOrigin | null)?.canonicalKey === parsed.canonicalKey,
  );
  const canonicalKey = matchingKeys[0] ?? parsed.canonicalPattern;
  const basePath = `browser_use.origins.${JSON.stringify(canonicalKey)}`;
  if (update.policy == null) {
    return (matchingKeys.length > 0 ? matchingKeys : [canonicalKey]).map((key) => ({
      keyPath: `browser_use.origins.${JSON.stringify(key)}`,
      value: null,
      mergeStrategy: "replace",
    }));
  }
  if (matchingKeys.length > 1) {
    const merged: OriginPolicy = { access: null, downloads: null, uploads: null, full_cdp_access: null };
    for (const field of ["access", "downloads", "uploads", "full_cdp_access"] as const) {
      merged[field] = matchingKeys.map((key) => configuration?.origins?.[key]?.[field]).includes("deny")
        ? "deny"
        : (configuration?.default_origin_policy?.[field] ?? null);
    }
    return [
      { keyPath: basePath, value: { ...merged, ...update.policy }, mergeStrategy: "replace" },
      ...matchingKeys.slice(1).map((key) => ({ keyPath: `browser_use.origins.${JSON.stringify(key)}`, value: null, mergeStrategy: "replace" as const })),
    ];
  }
  return Object.entries(update.policy).map(([field, value]) => ({
    keyPath: `${basePath}.${field}`,
    value,
    mergeStrategy: value == null ? "replace" : "upsert",
  }));
}

let initializedModels = false;
function initializeBrowserUseModels(): void {
  if (initializedModels) return;
  initializedModels = true;
  initializeCapabilityPolicyFields();
  initializeLegacyPermissionsSchema();
}

async function writeBrowserCapability(
  scope: MaitaiScopeApi<unknown>,
  hostId: string,
  configuration: ConfigurationReadResult | null | undefined,
  update: { capability: BrowserCapability; enabled: boolean },
): Promise<void> {
  if (configuration?.configReadSucceeded !== true || !Object.hasOwn(configuration.config, "browser_use")) {
    throw new Error("Browser Use user configuration is not supported");
  }
  await getAppServerClient(scope, hostId).sendRequest("config/batchWrite", {
    edits: [createCapabilityEdit(update)],
    filePath: configuration.configWriteTarget?.filePath ?? null,
    expectedVersion: null,
  });
  await (scope.query as unknown as { invalidate(query: unknown, parameter: string): Promise<void> }).invalidate(configurationQuery, hostId);
}

function browserUsePermissions(): BrowserUsePermissionsService {
  const service = appServices.browserUsePermissions;
  if (service == null) throw new Error("Browser Use permissions are not supported");
  return service as BrowserUsePermissionsService;
}

function useWebMcpMutation(): UseMutationResult<unknown, Error, unknown> {
  const invalidate = useInvalidateBrowserState() as (key: readonly unknown[]) => Promise<void>;
  return useMutation({ mutationFn: (value) => browserUsePermissions().updateWebMcpEnabled(value), onSettled: () => invalidate(browserOriginStateKey) });
}

function useFullCdpMutation({ hostId }: { hostId: string }): UseMutationResult<unknown, Error, unknown> {
  const scope = useScope(appScope) as MaitaiScopeApi<unknown>;
  const invalidate = useInvalidateBrowserState() as (key: readonly unknown[]) => Promise<void>;
  return useMutation({
    mutationFn: (enabled) => invokeRendererCommand("browser-use-full-cdp-access-enabled-write", { params: { enabled } }),
    onSuccess: async () => { await Promise.all([invalidate(browserOriginStateKey), browserUsePermissions().clearPrewarmedThreads()]); },
    onError: (error) => { logger.error("Failed to update Browser Use full CDP access", { safe: {}, sensitive: { error: String(error) } }); void invalidate(browserOriginStateKey); },
  });
}

async function clearBrowsingData(dataTypes: unknown): Promise<unknown> {
  try {
    return await invokeRendererCommand("browser-browsing-data-clear", { params: { dataTypes } });
  } catch (error) {
    logger.error("Failed to clear browser browsing data", { safe: { error: String(error) }, sensitive: {} });
    throw error;
  }
}

function useClearBrowsingDataMutation(): UseMutationResult<unknown, Error, unknown> {
  return useMutation({ mutationFn: clearBrowsingData });
}

function useOriginRulesMutation(hostId = defaultHostId): UseMutationResult<unknown, Error, OriginRuleUpdate> {
  const scope = useScope(appScope) as MaitaiScopeApi<unknown>;
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBrowserState() as (key: readonly unknown[]) => Promise<void>;
  return useMutation({
    mutationFn: async ({ updates, configUpdate }) => {
      const service = browserUsePermissions();
      const cached = queryClient.getQueryData([...configurationQueryKey, hostId]) as ConfigurationQueryResult | undefined;
      if (configUpdate != null) {
        if (cached?.readSucceeded !== true || !Object.hasOwn(cached.response.config, "browser_use")) throw new Error("Browser Use user configuration is unavailable");
        const edits = createOriginPolicyEdits(cached.response.config.browserUse, configUpdate);
        if (edits.length > 0) {
          const layer = getWritableConfigurationLayer(cached.response.layers) as { name: string; config?: Record<string, unknown> } | null;
          const filePath = layer == null ? null : configurationLayerPath(layer.name);
          const originalOrigins = cached.response.config.browserUse?.origins ?? null;
          const client = getAppServerClient(scope, hostId);
          const write = await client.sendRequest("config/batchWrite", { edits, filePath, expectedVersion: null }) as { version?: unknown };
          try { return await service.updateOriginRules(updates); }
          catch (updateError) {
            try {
              await client.sendRequest("config/batchWrite", { edits: [{ keyPath: "browser_use.origins", value: originalOrigins, mergeStrategy: "replace" }], filePath, expectedVersion: write.version });
            } catch (restoreError) {
              throw new AggregateError([updateError, restoreError], "Failed to restore Browser Use site permissions");
            }
            throw updateError;
          }
        }
      }
      return service.updateOriginRules(updates);
    },
    scope: { id: "browser-use-origin-rules" },
    onSettled: async (_data, _error, variables) => {
      if (variables.configUpdate != null) {
        await Promise.all([invalidate(browserOriginStateKey), queryClient.invalidateQueries({ queryKey: [...configurationQueryKey, hostId] })]);
      } else await invalidate(browserOriginStateKey);
    },
    onError: (error) => logger.error("Failed to update browser-use origin rules", { safe: {}, sensitive: { error: String(error) } }),
  });
}

function commandMutation(command: string, errorMessage: string): UseMutationResult<unknown, Error, unknown> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (value) => invokeRendererCommand(command, { params: { approvalMode: value } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: browserOriginStateKey }),
    onError: (error) => { logger.error(errorMessage, { safe: { error: String(error) }, sensitive: {} }); void queryClient.invalidateQueries({ queryKey: browserOriginStateKey }); },
  });
}

function useApprovalModeMutation(): UseMutationResult<unknown, Error, unknown> {
  return commandMutation("browser-use-approval-mode-write", "Failed to update browser-use approval mode");
}

function useHistoryApprovalModeMutation(): UseMutationResult<unknown, Error, unknown> {
  return commandMutation("browser-use-history-approval-mode-write", "Failed to update browser-use history approval mode");
}

function useIabHistoryApprovalModeMutation(): UseMutationResult<unknown, Error, unknown> {
  const invalidate = useInvalidateBrowserState() as (key: readonly unknown[]) => Promise<void>;
  return useMutation({
    mutationFn: (value) => browserUsePermissions().updateIabHistoryApprovalMode(value),
    onSuccess: () => invalidate(browserOriginStateKey),
    onError: (error) => { logger.error("Failed to update IAB history approval mode", { safe: {}, sensitive: { error: String(error) } }); void invalidate(browserOriginStateKey); },
  });
}

function useFileTransferApprovalModeMutation(): UseMutationResult<unknown, Error, { approvalMode: unknown; kind: unknown }> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ approvalMode, kind }) => invokeRendererCommand("browser-use-file-transfer-approval-mode-write", { params: { approvalMode, kind } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: browserOriginStateKey }),
    onError: (error) => { logger.error("Failed to update browser-use file transfer approval mode", { safe: { error: String(error) }, sensitive: {} }); void queryClient.invalidateQueries({ queryKey: browserOriginStateKey }); },
  });
}

let browserOriginStateKey: readonly unknown[];
let browserOriginStateQuery: unknown;
let browserUseSupportFamily: unknown;
let initialized = false;
function initializeBrowserUseOriginState(): void {
  if (initialized) return;
  initialized = true;
  initializeCompilerRuntime();
  initializeUseMutation();
  initializeQueryClientHook();
  initializeSignalRuntime();
  initializeBrowserUseModels();
  initializeConfigurationLayers();
  initializeAppServerClient();
  initializeBrowserUseSettings();
  initializeCommandQueries();
  initializeAppServices();
  initializeQueryRuntime();
  initializeConfigurationState();
  initializeLogger();
  initializeMutationRuntime();
  initializeRendererCommands();
  browserOriginStateKey = createCommandQueryKey("browser-use-origin-state-read");
  browserOriginStateQuery = createCommandQueryFamily(appScope, "browser-use-origin-state-read", { refetchOnMount: "always", staleTime: queryDurations.FIVE_SECONDS });
  browserUseSupportFamily = createDerivedFamily(appScope, (hostId: string, { get }) => {
    if (appServices.browserUsePermissions == null) return "unsupported";
    const result = get(configurationQuery, hostId) as { data?: ConfigurationReadResult; isError: boolean; isPending: boolean };
    return result.isPending ? "loading" : result.isError || result.data?.configReadSucceeded !== true
      ? "error" : Object.hasOwn(result.data.config, "browser_use") ? "supported" : "unsupported";
  });
}

export {
  initializeCapabilityPolicyFields as C,
  isGlobalPersistentApprovalAllowed as D,
  isDefaultCapabilityAllowed as E,
  hasBrowserUseRestrictions as S,
  isBrowserModeAllowed as T,
  initializeLegacyPermissionsSchema as _,
  useClearBrowsingDataMutation as a,
  getNetworkRules as b,
  useFileTransferApprovalModeMutation as c,
  useOriginRulesMutation as d,
  useWebMcpMutation as f,
  getLegacyCapabilityPolicy as g,
  parseLegacyPermissions as h,
  initializeBrowserUseOriginState as i,
  useFullCdpMutation as l,
  initializeBrowserUseModels as m,
  browserUseSupportFamily as n,
  useApprovalModeMutation as o,
  writeBrowserCapability as p,
  clearBrowsingData as r,
  useHistoryApprovalModeMutation as s,
  browserOriginStateQuery as t,
  useIabHistoryApprovalModeMutation as u,
  domainPatternMatchesUrl as v,
  isSiteCapabilityAllowed as w,
  getOriginPolicies as x,
  originPatternMatchesUrl as y,
};
