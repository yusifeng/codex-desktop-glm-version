import "@rchunk/rolldown-runtime";
import {
  QX as createScopedQueryFamily,
  YX as createScopedMutation,
  ZI as appScope,
  eZ as createScopedQuery,
} from "@rchunk/app-shared";
import { pnt as desktopBridge } from "@rchunk/app-initial";
import {
  a as initializeComputerHistoryQueries,
  t as historyQueryKey,
} from "@rchunk/computer-history-query";
import {
  n as initializeChronicleSettings,
  t as chronicleFeatureKey,
} from "@rchunk/chronicle-settings";

type ObservationBehavior = "ignore" | "observe";

interface ObservationRule {
  bundleID: string | null;
  scope: string;
  urlDomain: string | null;
}

interface ChronicleSettings {
  observation: {
    allowlist: ObservationRule[];
    blocklist: ObservationRule[];
    defaultApplicationBehavior: ObservationBehavior;
    defaultURLBehavior: ObservationBehavior;
  };
  [key: string]: unknown;
}

interface ChronicleService {
  clearHistory(scope: unknown, interval: unknown): Promise<unknown>;
  getSettings(): Promise<ChronicleSettings>;
  getState(): Promise<Record<string, unknown>>;
  listApplications(): Promise<unknown[]>;
  pause(): Promise<Record<string, unknown>>;
  resolveApplications(bundleIdentifiers: string[]): Promise<unknown[]>;
  resume(): Promise<Record<string, unknown>>;
  retryActivation(): Promise<Record<string, unknown>>;
  setEnabled(enabled: boolean): Promise<Record<string, unknown>>;
  updateSettings(settings: ChronicleSettings): Promise<ChronicleSettings>;
}

interface MemorySettingsState extends Record<string, unknown> {
  chronicleResearchPreviewEnabled: boolean;
  chronicleResearchPreviewVisible: boolean;
  isMemoryFeatureEnabled: boolean;
  memoryConfig: Record<string, unknown> & { disableOnExternalContext?: boolean };
}

interface ChronicleFormSettings {
  applicationBundleIdentifiers: string[];
  defaultApplicationBehavior: ObservationBehavior;
  defaultURLBehavior: ObservationBehavior;
  urlDomains: string[];
}

interface ProductLogger {
  logProductEvent(event: unknown, fields: Record<string, unknown>): void;
}

const bridge = desktopBridge as { chronicle?: ChronicleService | null };
const stateQueryKey = ["chronicle-state"];
const settingsQueryKey = ["chronicle-settings"];
const applicationsQueryKey = ["chronicle-applications"];
let chronicleStateQuery: unknown;
let chronicleSettingsQuery: unknown;
let chronicleApplicationsQuery: unknown;
let resolvedApplicationsQuery: unknown;
let setChronicleEnabledMutation: unknown;
let retryChronicleActivationMutation: unknown;
let pauseResumeChronicleMutation: unknown;
let updateChronicleApplicationMutation: unknown;
let clearChronicleHistoryMutation: unknown;
let saveChronicleSettingsMutation: unknown;

function requireChronicle(): ChronicleService {
  if (bridge.chronicle == null) throw new Error("Computer history is unavailable");
  return bridge.chronicle;
}

function memorySettingsState({
  chronicleResearchPreviewEnabled,
  chronicleResearchPreviewVisible,
  isMemoryFeatureEnabled,
  memoryConfig,
}: MemorySettingsState): Record<string, unknown> {
  const generateMemoriesEnabled = memoryConfig.generateMemories !== false;
  const useMemoriesEnabled = memoryConfig.useMemories !== false;
  return {
    chronicleResearchPreviewEnabled,
    chronicleResearchPreviewVisible,
    isMemoryFeatureEnabled,
    memoryConfig,
    memoryFeatureEnabled: isMemoryFeatureEnabled,
    generateMemoriesEnabled,
    useMemoriesEnabled,
    memoriesEnabled:
      isMemoryFeatureEnabled && generateMemoriesEnabled && useMemoriesEnabled,
    skipToolAssistedChatsEnabled: memoryConfig.disableOnExternalContext,
  };
}

function patchMemorySettings(
  current: MemorySettingsState,
  patch: {
    chronicleResearchPreviewEnabled?: boolean;
    isMemoryFeatureEnabled?: boolean;
    memoryConfigPatch?: Record<string, unknown>;
  } = {},
): Record<string, unknown> {
  return memorySettingsState({
    ...current,
    chronicleResearchPreviewEnabled:
      patch.chronicleResearchPreviewEnabled
      ?? current.chronicleResearchPreviewEnabled,
    isMemoryFeatureEnabled:
      patch.isMemoryFeatureEnabled ?? current.isMemoryFeatureEnabled,
    memoryConfig: { ...current.memoryConfig, ...patch.memoryConfigPatch },
  });
}

function logMemorySetting({
  productLogger,
  previousEnabled,
  selectedEnabled,
  settingName,
  state,
}: {
  previousEnabled: boolean;
  productLogger: ProductLogger;
  selectedEnabled: boolean;
  settingName: string;
  state: Record<string, unknown>;
}): void {
  productLogger.logProductEvent("memory_setting_updated", {
    settingName,
    previousEnabled,
    selectedEnabled,
    ...state,
  });
}

async function writeAndLogMemorySetting({
  productLogger,
  write,
  ...details
}: {
  previousEnabled: boolean;
  productLogger: ProductLogger;
  selectedEnabled: boolean;
  settingName: string;
  state: Record<string, unknown>;
  write(): Promise<unknown>;
}): Promise<void> {
  try {
    await write();
  } catch {
    return;
  }
  logMemorySetting({ productLogger, ...details });
}

function selectedRules(
  behavior: ObservationBehavior,
  allowlist: ObservationRule[],
  blocklist: ObservationRule[],
): ObservationRule[] {
  return behavior === "observe" ? blocklist : allowlist;
}

function chronicleSettingsToForm(settings: ChronicleSettings): ChronicleFormSettings {
  const read = (scope: "app" | "url", behavior: ObservationBehavior) =>
    selectedRules(
      behavior,
      settings.observation.allowlist,
      settings.observation.blocklist,
    ).flatMap((rule) => {
      if (rule.scope !== scope) return [];
      const value = scope === "app" ? rule.bundleID : rule.urlDomain;
      return value == null ? [] : [value];
    });
  return {
    defaultApplicationBehavior: settings.observation.defaultApplicationBehavior,
    applicationBundleIdentifiers: read(
      "app",
      settings.observation.defaultApplicationBehavior,
    ),
    defaultURLBehavior: settings.observation.defaultURLBehavior,
    urlDomains: read("url", settings.observation.defaultURLBehavior),
  };
}

function formToChronicleSettings(
  settings: ChronicleSettings,
  form: ChronicleFormSettings,
): ChronicleSettings {
  const allowlist = settings.observation.allowlist.filter(
    (rule) => rule.scope !== "app" && rule.scope !== "url",
  );
  const blocklist = settings.observation.blocklist.filter(
    (rule) => rule.scope !== "app" && rule.scope !== "url",
  );
  const applicationRules = form.applicationBundleIdentifiers.map((bundleID) => ({
    scope: "app",
    bundleID,
    urlDomain: null,
  }));
  const urlRules = form.urlDomains.map((urlDomain) => ({
    scope: "url",
    bundleID: null,
    urlDomain,
  }));
  (form.defaultApplicationBehavior === "observe" ? blocklist : allowlist)
    .push(...applicationRules);
  (form.defaultURLBehavior === "observe" ? blocklist : allowlist)
    .push(...urlRules);
  return {
    ...settings,
    observation: {
      ...settings.observation,
      defaultApplicationBehavior: form.defaultApplicationBehavior,
      defaultURLBehavior: form.defaultURLBehavior,
      allowlist,
      blocklist,
    },
  };
}

function isApplicationObserved(
  settings: ChronicleSettings,
  bundleIdentifier: string,
): boolean {
  const observation = settings.observation;
  const allowed = observation.allowlist.some(
    (rule) => rule.scope === "app" && rule.bundleID === bundleIdentifier,
  );
  const blocked = observation.blocklist.some(
    (rule) => rule.scope === "app" && rule.bundleID === bundleIdentifier,
  );
  return observation.defaultApplicationBehavior === "observe" ? !blocked : allowed;
}

function updateApplicationObservation(
  settings: ChronicleSettings,
  bundleIdentifier: string,
  observed: boolean,
): ChronicleSettings {
  const rule = { scope: "app", bundleID: bundleIdentifier, urlDomain: null };
  const allowlist = settings.observation.allowlist.filter(
    (entry) => entry.scope !== "app" || entry.bundleID !== bundleIdentifier,
  );
  const blocklist = settings.observation.blocklist.filter(
    (entry) => entry.scope !== "app" || entry.bundleID !== bundleIdentifier,
  );
  if (settings.observation.defaultApplicationBehavior === "observe") {
    if (!observed) blocklist.push(rule);
  } else if (observed) {
    allowlist.push(rule);
  }
  return {
    ...settings,
    observation: { ...settings.observation, allowlist, blocklist },
  };
}

function initializeMemoryConfigMutation(): void {}
function initializeChronicleConfigMutation(): void {
  initializeChronicleSettings();
}
function initializeMemorySettingsLogging(): void {}
function initializeChronicleServiceRuntime(): void {}

function initializeChronicleServiceQueries(): void {
  initializeComputerHistoryQueries();
  initializeChronicleSettings();
  const createQuery = createScopedQuery as unknown as (
    scope: unknown,
    factory: () => Record<string, unknown>,
  ) => unknown;
  const createFamily = createScopedQueryFamily as unknown as (
    scope: unknown,
    factory: (parameter: string[]) => Record<string, unknown>,
  ) => unknown;
  const createMutation = createScopedMutation as unknown as (
    scope: unknown,
    factory: () => Record<string, unknown>,
  ) => unknown;
  chronicleStateQuery = createQuery(appScope, () => ({
    enabled: bridge.chronicle != null,
    queryKey: stateQueryKey,
    queryFn: () => requireChronicle().getState(),
    retry: false,
    staleTime: 1000,
  }));
  chronicleSettingsQuery = createQuery(appScope, () => ({
    enabled: bridge.chronicle != null,
    queryKey: settingsQueryKey,
    queryFn: () => requireChronicle().getSettings(),
    retry: false,
    staleTime: 0,
  }));
  chronicleApplicationsQuery = createQuery(appScope, () => ({
    enabled: bridge.chronicle != null,
    queryKey: applicationsQueryKey,
    queryFn: () => requireChronicle().listApplications(),
    retry: false,
    staleTime: Infinity,
  }));
  resolvedApplicationsQuery = createFamily(appScope, (bundleIdentifiers) => ({
    enabled: bridge.chronicle != null && bundleIdentifiers.length > 0,
    queryKey: [...applicationsQueryKey, "selected", bundleIdentifiers],
    queryFn: () => requireChronicle().resolveApplications(bundleIdentifiers),
    retry: false,
    staleTime: Infinity,
  }));
  setChronicleEnabledMutation = createMutation(appScope, () => ({
    mutationKey: ["chronicle", "set-enabled"],
    mutationFn: ({ enabled }: { enabled: boolean }) =>
      requireChronicle().setEnabled(enabled),
  }));
  retryChronicleActivationMutation = createMutation(appScope, () => ({
    mutationKey: ["chronicle", "retry-activation"],
    mutationFn: () => requireChronicle().retryActivation(),
  }));
  pauseResumeChronicleMutation = createMutation(appScope, () => ({
    mutationKey: ["chronicle", "pause-resume"],
    mutationFn: (state: string) => state === "paused"
      ? requireChronicle().resume()
      : requireChronicle().pause(),
  }));
  updateChronicleApplicationMutation = createMutation(appScope, () => ({
    mutationKey: ["chronicle", "update-application"],
    mutationFn: async ({ application, observed }: {
      application: { bundleIdentifier: string };
      observed: boolean;
    }) => {
      const service = requireChronicle();
      const settings = await service.getSettings();
      return service.updateSettings(
        updateApplicationObservation(settings, application.bundleIdentifier, observed),
      );
    },
  }));
  clearChronicleHistoryMutation = createMutation(appScope, () => ({
    mutationKey: ["chronicle", "clear-history"],
    mutationFn: ({ interval, scope }: { interval: unknown; scope: unknown }) =>
      requireChronicle().clearHistory(scope, interval),
    invalidates: historyQueryKey,
  }));
  saveChronicleSettingsMutation = createMutation(appScope, () => ({
    mutationKey: ["chronicle", "save-settings"],
    mutationFn: async (form: ChronicleFormSettings) => {
      const service = requireChronicle();
      return service.updateSettings(
        formToChronicleSettings(await service.getSettings(), form),
      );
    },
  }));
  void chronicleFeatureKey;
}

export {
  useMemoryConfigMutation as C,
  initializeMemoryConfigMutation as S,
  patchMemorySettings as _,
  initializeChronicleServiceQueries as a,
  saveCombinedMemorySettings as b,
  retryChronicleActivationMutation as c,
  updateChronicleApplicationMutation as d,
  initializeChronicleServiceRuntime as f,
  useChronicleConfigMutation as g,
  initializeChronicleConfigMutation as h,
  clearChronicleHistoryMutation as i,
  saveChronicleSettingsMutation as l,
  chronicleSettingsToForm as m,
  chronicleSettingsQuery as n,
  pauseResumeChronicleMutation as o,
  isApplicationObserved as p,
  chronicleStateQuery as r,
  resolvedApplicationsQuery as s,
  chronicleApplicationsQuery as t,
  setChronicleEnabledMutation as u,
  initializeMemorySettingsLogging as v,
  writeAndLogMemorySetting as x,
  logMemorySetting as y,
};

function useMemoryConfigMutation(): Record<string, unknown> {
  return { mutationKey: ["memory", "config"] };
}

function useChronicleConfigMutation(): Record<string, unknown> {
  return { mutationKey: ["chronicle", "config"] };
}

async function saveCombinedMemorySettings(options: Record<string, unknown>): Promise<Record<string, unknown>> {
  return options;
}
