import {
  Dc as dynamicToolsConfigKey,
  Oc as serializeDynamicTools,
  Wa as resolveModelServiceTier,
  Wu as supportsAppServerFeature,
  Yo as buildBaseThreadConfig,
  Cs as isDurableHost,
  gl as arePathsEquivalent,
  ic as versionedFeatureOverrides,
  nc as applyFeatureOverrides,
} from "@chunk/shared";
import type { AnyTurn } from "../turns/canonical-history";
import { turnParamsFromReadResponse } from "./hydration";
import {
  firstWritableRoot,
  mergeThreadProfiles,
  resolveThreadCwd,
  resolveWorkspaceSandboxPolicy,
} from "../workspace/config";

export const TURN_START_TIMEOUT_MS = 30_000;
export const OWNER_WINDOW_ERROR =
  "Please continue this conversation on the window where it was started.";
export async function resolveServiceTier(
  requested: string | null | undefined,
  logger: { warning(message: string, data?: unknown): void },
  readRequirements: () => Promise<{
    featureRequirements?: { fast_mode?: boolean };
  }>,
): Promise<string | null> {
  if (requested == null) return null;
  try {
    const requirements = await readRequirements();
    return (requirements as any).requirements?.featureRequirements?.fast_mode === false ||
      requirements.featureRequirements?.fast_mode === false
      ? null
      : requested;
  } catch (error) {
    logger.warning("Failed to load config requirements for service tier", {
      safe: {},
      sensitive: { error },
    });
    return null;
  }
}
export const mx = resolveServiceTier;
export function logFeatureOverrideResolved(
  logger: { info(message: string, data?: unknown): void },
  defaults: Record<string, unknown> | null,
  config: unknown,
): void {
  const resolved = typeof config === "object" && config != null && !Array.isArray(config)
    ? (config as Record<string, unknown>) : {};
  logger.info("Concurrent reasoning summaries thread-start config resolved", {
    safe: {
      featureOverride: defaults?.concurrent_reasoning_summaries ?? null,
      threadStartConfig:
        typeof resolved["features.concurrent_reasoning_summaries"] === "boolean"
          ? resolved["features.concurrent_reasoning_summaries"]
          : null,
    },
    sensitive: {},
  });
}
export const vx = logFeatureOverrideResolved;

const RUNNING_SUMMARY_INSTRUCTIONS =
  "The pet activity pill uses update_running_summary. Before starting substantial work, call it with a short statement of intent, then update it only when your high-level objective or phase changes. If the tool is deferred, discover update_running_summary with tool search first. Skip it for brief direct answers. Never update on a timer or for routine tool calls.";
const WRITING_BLOCK_INSTRUCTIONS = "### Writing blocks\n\n- A writing block contains a finished, reusable writing artifact that the user can copy, edit, or use outside this conversation. It is not a generic callout or formatting container.\n- Use a writing block only when the response itself delivers such an artifact, including a polished email, chat message, social post, or document.\n- Do not use a writing block for explanations, analysis, plans, progress updates, code, or ordinary conversational responses. Use normal Markdown for those unless an active skill defines the response as a writing-block artifact.\n- Use this exact syntax:\n\n:::writing{variant=\"<variant>\" id=\"<id>\"}\n<content>\n:::\n\n- Never put any other text on the same line as an opening or closing writing block fence. The opening fence line must contain only `:::writing{...}`; the closing fence line must contain only `:::`.\n- `variant` is required and must be `email`, `chat_message`, `social_post`, `document`, `standard`, or a variant defined by the active skill. Use `standard` for a reusable artifact that does not fit a more specific variant.\n- `id` is required and must be a unique five-digit string that has not been used for another writing block in the thread.\n- Keep the same `id` when revising an existing writing block. Generate a new unique `id` for a new artifact.\n- Use a separate writing block for each distinct artifact. Do not combine unrelated artifacts in one block, and use at most three writing blocks in one response.\n- Use tone sections instead of separate writing blocks for alternatives of the same artifact.\n- If `variant=\"email\"`, include a `subject`.\n- When the user asks for an email, always use `variant=\"email\"`; never use `variant=\"standard\"` for an email, even when its fields or body are simple.\n- Include `recipient`, `cc`, and `bcc` only when the user provided the corresponding email addresses. Never invent email addresses.\n- Do not use `subject`, `recipient`, `cc`, or `bcc` for other variants.\n- If distinct tone or style choices would materially help the user, put at most three alternatives in one writing block and start every alternative with a line in this exact form:\n\n---tone <label>\n<alternative content>\n\n- Every ---tone <label> marker must be alone on its line. Keep each tone label short, put the best default version first, and make every alternative a complete version of the artifact.\n- Do not add tone markers when alternatives would not be useful; write the artifact body directly.\n- Keep any explanation outside the writing block and do not mention this formatting contract to the user.";

function appendInstructions(current: unknown, addition: string): string {
  return typeof current === "string" && current.length > 0 ? `${current}\n\n${addition}` : addition;
}

type ShellPolicy = Record<string, any>;
function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
function stringRecord(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}
function filterRecord(value: unknown): Record<string, "include" | "exclude"> | undefined {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return undefined;
  const result: Record<string, "include" | "exclude"> = {};
  for (const [key, setting] of Object.entries(value))
    if (setting === "include" || setting === "exclude") result[key.toLowerCase()] = setting;
  return result;
}
function shellPolicyFromConfig(config: Record<string, any> | null | undefined): ShellPolicy | null {
  if (config == null) return null;
  const nested = typeof config.shell_environment_policy === "object" &&
    config.shell_environment_policy != null && !Array.isArray(config.shell_environment_policy)
    ? config.shell_environment_policy : {};
  const read = (key: string) => config[`shell_environment_policy.${key}`] ?? nested[key];
  const policy: ShellPolicy = {};
  if (typeof read("inherit") === "string") policy.inherit = read("inherit");
  if (Array.isArray(read("include_only"))) policy.include_only = stringArray(read("include_only"));
  if (typeof read("ignore_default_excludes") === "boolean") policy.ignore_default_excludes = read("ignore_default_excludes");
  if (typeof read("experimental_use_profile") === "boolean") policy.experimental_use_profile = read("experimental_use_profile");
  if (Array.isArray(read("exclude"))) policy.exclude = stringArray(read("exclude"));
  const nestedFilters = filterRecord(nested.filters);
  const flatFilters = filterRecord(config["shell_environment_policy.filters"]);
  const dottedFilters = Object.entries(config).filter(([key]) => key.startsWith("shell_environment_policy.filters."));
  const hasLegacyLists = config["shell_environment_policy.exclude"] != null ||
    config["shell_environment_policy.include_only"] != null;
  if (flatFilters != null || dottedFilters.length > 0 || (nestedFilters != null && !hasLegacyLists)) {
    policy.filters = { ...nestedFilters, ...flatFilters };
    delete policy.exclude;
    delete policy.include_only;
    for (const [key, value] of dottedFilters)
      if (value === "include" || value === "exclude") policy.filters[key.slice(33).toLowerCase()] = value;
  }
  const set = read("set");
  if (typeof set === "object" && set != null && !Array.isArray(set))
    policy.set = { ...stringRecord(nested.set), ...stringRecord(set) };
  const dottedSet: Record<string, string> = {};
  for (const [key, value] of Object.entries(config))
    if (key.startsWith("shell_environment_policy.set.") && typeof value === "string") dottedSet[key.slice(29)] = value;
  if (Object.keys(dottedSet).length > 0) policy.set = { ...policy.set, ...dottedSet };
  return Object.keys(policy).length === 0 ? null : policy;
}
function mergeShellPolicies(base: ShellPolicy, override: ShellPolicy | null): ShellPolicy {
  const merged: ShellPolicy = { ...base, ...override, set: { ...base?.set, ...override?.set } };
  if (override?.filters == null) {
    if (override?.exclude != null || override?.include_only != null) delete merged.filters;
  } else {
    delete merged.exclude;
    delete merged.include_only;
    merged.filters = { ...base?.filters, ...override.filters };
  }
  return merged;
}
function applyCapturedShell(policy: ShellPolicy, captured: { exclude: string[]; set: Record<string, string> }): ShellPolicy {
  const { filters, ...rest } = policy;
  if (filters != null) {
    rest.exclude = Object.keys(filters).filter((key) => filters[key] === "exclude");
    rest.include_only = Object.keys(filters).filter((key) => filters[key] === "include");
  }
  const set = { ...stringRecord(rest.set) };
  const exclude = new Set([...stringArray(rest.exclude), ...captured.exclude]);
  for (const key of exclude) delete set[key];
  for (const [key, value] of Object.entries(captured.set)) {
    set[key] = value;
    exclude.delete(key);
  }
  return { ...rest, set, exclude: [...exclude] };
}
function flattenShellPolicy(policy: ShellPolicy): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (policy.filters != null) result["shell_environment_policy.filters"] = policy.filters;
  if (typeof policy.inherit === "string") result["shell_environment_policy.inherit"] = policy.inherit;
  if (policy.filters == null && Array.isArray(policy.include_only))
    result["shell_environment_policy.include_only"] = policy.include_only;
  if (typeof policy.ignore_default_excludes === "boolean")
    result["shell_environment_policy.ignore_default_excludes"] = policy.ignore_default_excludes;
  if (typeof policy.experimental_use_profile === "boolean")
    result["shell_environment_policy.experimental_use_profile"] = policy.experimental_use_profile;
  if (policy.filters == null && Array.isArray(policy.exclude))
    result["shell_environment_policy.exclude"] = policy.exclude;
  if (policy.set != null && typeof policy.set === "object") result["shell_environment_policy.set"] = policy.set;
  return result;
}
async function applyWorktreeShellEnvironment(
  start: any,
  cwd: unknown,
  readShellEnvironment: () => Promise<any>,
  readHostConfig: () => Promise<any>,
  logger: any,
): Promise<any> {
  try {
    const { shellEnvironment } = await readShellEnvironment();
    if (shellEnvironment == null) return start;
    const hostConfig = await readHostConfig();
    if (hostConfig == null) return start;
    const config = start.config ?? {};
    const current = shellPolicyFromConfig(config);
    const policy = mergeShellPolicies(
      shellPolicyFromConfig(hostConfig) ?? current ?? { inherit: "all" },
      current,
    );
    const cleaned = { ...config };
    for (const key of Object.keys(cleaned))
      if (key.startsWith("shell_environment_policy.")) delete cleaned[key];
    return {
      ...start,
      config: {
        ...cleaned,
        shell_environment_policy: undefined,
        ...flattenShellPolicy(applyCapturedShell(policy, shellEnvironment)),
      },
    };
  } catch (error) {
    logger.warning("Failed to apply worktree shell environment config", {
      safe: {},
      sensitive: { cwd, error },
    });
    return start;
  }
}

export async function buildThreadStartConfig(
  config: Record<string, unknown>,
  services: any,
  permissions: Record<string, unknown> | null,
  historyMode?: string | null,
  version?: string | null,
): Promise<Record<string, unknown>> {
  const { requestClient, logger } = services;
  const priority = services.priority ?? "critical";
  const serviceTier = await resolveServiceTier(config.serviceTier as string | null, logger, () =>
    requestClient.sendRequest("configRequirements/read", undefined, {
      priority,
      timeoutMs: TURN_START_TIMEOUT_MS,
    }),
  );
  let result: any = await buildBaseThreadConfig(
    config.model,
    serviceTier,
    services.fetchProxyConfig,
    config.cwd,
    config.permissionsConfig,
    services.fetchCodexConfig,
    config.personality,
    config.approvalsReviewer,
    {
      baseInstructions: config.baseInstructions,
      permissionSelection: config.permissionSelection,
      threadSource: config.threadSource,
    },
  );
  const overrides = config.instructionOverrides as Record<string, unknown> | null | undefined;
  if (
    config.allowMemoryPromptOverrides &&
    (overrides?.memoryReadPrompt != null ||
      overrides?.memoryPhaseOnePrompt != null ||
      overrides?.memoryPhaseTwoPrompt != null)
  ) {
    result.config = {
      ...result.config,
      ...(overrides?.memoryReadPrompt == null ? {} : { "memories.read_prompt": overrides.memoryReadPrompt }),
      ...(overrides?.memoryPhaseOnePrompt == null ? {} : { "memories.phase_one_prompt": overrides.memoryPhaseOnePrompt }),
      ...(overrides?.memoryPhaseTwoPrompt == null ? {} : { "memories.phase_two_prompt": overrides.memoryPhaseTwoPrompt }),
    };
  }
  result = applyFeatureOverrides(
    result,
    versionedFeatureOverrides(config.defaultFeatureOverrides, requestClient.getAppServerVersion()),
  );
  if (services.readShellEnvironment != null)
    result = await applyWorktreeShellEnvironment(
      result,
      config.cwd,
      services.readShellEnvironment,
      async () =>
        config.hostConfig === undefined
          ? mergeThreadProfiles((await requestClient.sendRequest(
              "config/read",
              { includeLayers: false, cwd: config.cwd },
              { priority, timeoutMs: 500 },
            )).config)
          : config.hostConfig,
      logger,
    );
  let hasRunningSummaryTool = false;
  if (services.readDynamicTools != null) {
    const dynamicTools = await services.readDynamicTools();
    const flattened = dynamicTools.flatMap((tool: any) => tool.type === "namespace" ? tool.tools : [tool]);
    hasRunningSummaryTool = flattened.some(({ name }: any) => name === "update_running_summary");
    result.dynamicTools = undefined;
    if (config.registerDynamicTools !== false)
      result.dynamicTools = config.usesDesktopMcp ? [] : serializeDynamicTools(dynamicTools);
    if (config.usesDesktopMcp)
      result.config = {
        ...result.config,
        [dynamicToolsConfigKey(requestClient.getAppServerVersion())]: flattened.map(({ name }: any) => name),
      };
  }
  if (services.readDeveloperInstructions != null) {
    const read = await services.readDeveloperInstructions({
      baseInstructions: result.developerInstructions ?? undefined,
      cwd: result.cwd ?? config.cwd,
      includeProseDetailLevelInstructions: config.includeProseDetailLevelInstructions,
      instructionOverrides:
        overrides?.desktopContextSection != null || overrides?.workspaceDependenciesSection != null
          ? {
              desktopContextSection: overrides.desktopContextSection,
              workspaceDependenciesSection: overrides.workspaceDependenciesSection,
            }
          : null,
      sidebarSectionToolsEnabled: config.sidebarSectionToolsEnabled,
      threadId: config.threadId ?? null,
      threadToolsEnabled: (config.defaultFeatureOverrides as any)?.thread_tools === true,
      hostId: requestClient.hostId,
    });
    result.developerInstructions = read.instructions;
  }
  if (hasRunningSummaryTool)
    result.developerInstructions = appendInstructions(result.developerInstructions, RUNNING_SUMMARY_INSTRUCTIONS);
  if (config.writingBlockInstructions)
    result.developerInstructions = appendInstructions(result.developerInstructions, WRITING_BLOCK_INSTRUCTIONS);
  if (config.additionalDeveloperInstructions != null)
    result.developerInstructions = appendInstructions(
      result.developerInstructions,
      config.additionalDeveloperInstructions as string,
    );
  if (permissions == null ||
      (typeof permissions.approvalPolicy === "object" && permissions.approvalPolicy != null && "granular" in permissions.approvalPolicy))
    result = { ...result, config: { ...result.config, "features.request_permissions_tool": true } };
  if (
    result.ephemeral !== true &&
    (historyMode === "paginated" || supportsAppServerFeature(version, "defaultPaginatedHistory"))
  ) result = { ...result, historyMode };
  return result;
}
export const gx = buildThreadStartConfig;
function normalize(value: string): string {
  let normalized = value.replaceAll("\\", "/");
  while (normalized.length > 1 && normalized.endsWith("/") && !/^[a-zA-Z]:\/$/u.test(normalized))
    normalized = normalized.slice(0, -1);
  return /^[a-zA-Z]:\//u.test(normalized) || normalized.startsWith("//")
    ? normalized.toLowerCase()
    : normalized;
}
export function resolveThreadCwdFromResponse({
  requestedCwd,
  responseCwd,
  threadCwd,
  fallbackCwd,
}: {
  requestedCwd?: string | null;
  responseCwd?: string | null;
  threadCwd?: string | null;
  fallbackCwd?: string | null;
}): string | undefined {
  const effective = responseCwd || threadCwd;
  if (requestedCwd != null && effective != null) {
    const request = normalize(requestedCwd),
      base = normalize(effective);
    if (request === base || request.startsWith(base + "/")) return requestedCwd;
  }
  return effective ?? requestedCwd ?? fallbackCwd ?? undefined;
}
export const xx = resolveThreadCwdFromResponse;

async function readMergedHostConfig(client: any, cwd: string, priority = "critical") {
  return client.sendRequest(
    "config/read",
    { cwd: isDurableHost(client.hostId) ? null : cwd, includeLayers: false },
    { priority, timeoutMs: 500 },
  ).then((response: any) => mergeThreadProfiles(response.config)).catch(() => null);
}
export const yx = readMergedHostConfig;
function normalizePersonality(value: unknown): "friendly" | "pragmatic" | null {
  return value === "friendly" || value === "pragmatic" ? value : null;
}
function stripPermissionConfig(config: Record<string, any> | null | undefined) {
  if (config == null) return config;
  const permissionKeys = [
    "approval_policy", "approvals_reviewer", "sandbox_mode", "sandbox_workspace_write",
    "permissions", "default_permissions", "profile", "profiles", "network_requirements",
    "auto_review", "features.guardian_approval", "features.guardianv2",
    "features.request_permissions_tool",
  ];
  const allowed = (key: string) =>
    !permissionKeys.some((permissionKey) => key === permissionKey || key.startsWith(`${permissionKey}.`));
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(config)) {
    if (!allowed(key)) continue;
    if (key === "features" && typeof value === "object" && value != null && !Array.isArray(value)) {
      const entries = Object.entries(value).filter(([feature]) => allowed(`features.${feature}`));
      if (entries.length > 0) result.features = Object.fromEntries(entries);
    } else result[key] = value;
  }
  return result;
}
function enableTokenBudgetHistoryNotes(config: Record<string, any> | null | undefined, version: string) {
  if (!supportsAppServerFeature(version, "tokenBudgetHistoryNotes"))
    throw Error("FailedPrecondition: history_notes_extension_unsupported");
  const nested = config?.["features.token_budget"];
  const result = {
    ...config,
    "features.token_budget": {
      ...(typeof nested === "object" && nested != null && !Array.isArray(nested) ? nested : {}),
      enabled: true,
      use_history_notes_extension: true,
    },
  };
  delete result["features.token_budget.enabled"];
  delete result["features.token_budget.use_history_notes_extension"];
  return result;
}

export function buildResumeProduct(
  settings: Record<string, any>,
  requestClient: any,
  logger: any,
  history: any,
  usePermissionDefault: (id: string) => boolean,
  readSettingsOverride?: (input: { model: string | null; cwd: string }) => Promise<any>,
): any {
  const readCatalogEntry = settings.readCatalogEntry;
  const beginHydration = settings.beginHydration;
  const bounded = settings.useBoundedCloudHistory;
  const historyMapper = history as { mapThreadTurns?: (input: unknown) => AnyTurn[] };
  const callableCatalog =
    typeof readCatalogEntry === "function"
      ? (readCatalogEntry as (hostId: string, threadId: string) => Promise<unknown>)
      : undefined;
  return {
    readCatalogEntry: (hostId, threadId) => callableCatalog?.(hostId, threadId),
    useBoundedCloudHistory:
      typeof bounded === "function"
        ? (bounded as () => boolean)() === true
        : bounded === true,
    ...(typeof beginHydration === "function"
      ? { beginHydration: beginHydration as (input: unknown) => unknown }
      : {}),
    async prepare(input: any) {
      const { conversation, params, permissions, workspaceRoots } = input;
      settings.restricted;
      if (
        params.preserveServerConfiguration === true &&
        (requestClient.hostId === "durable" || (settings.isBrowserRuntime && requestClient.hostId === "local"))
      ) {
        return {
          start: {},
          defaultFeatureOverrides: null,
          requestOptions: input.requestOptions,
          backgroundRequestOptions: undefined,
          preserveServerPermissions: true,
          canReuseRunningThread: true,
          independentHistory: null,
          useTurnsPageFallback: false,
          drainRemainingHistory: true,
          completeRequest: ({ threadId, excludeTurns, initialTurnsPage }: any) => ({ threadId, excludeTurns, initialTurnsPage }),
          async getResult(response: any) {
            return {
              model: response.model.trim() || null,
              collaborationModel: response.model,
              reasoningEffort: response.reasoningEffort,
              developerInstructions: null,
              threadStartKind: null,
            };
          },
        };
      }
      const model = (
        params.model ??
        conversation?.latestCollaborationMode.settings.model ??
        params.collaborationMode?.settings.model
      )?.trim() || null;
      const cwd = workspaceRoots[0] ?? "/";
      const executionSettings = await (readSettingsOverride == null
        ? settings.readSettings(model, cwd)
        : readSettingsOverride({ model, cwd }));
      if ("status" in executionSettings) return executionSettings;
      const hostConfig = "defaultPersonality" in executionSettings
        ? await readMergedHostConfig(requestClient, cwd, input.requestOptions.priority)
        : undefined;
      const personality = "defaultPersonality" in executionSettings
        ? hostConfig == null
          ? null
          : (normalizePersonality(hostConfig.personality) ??
            normalizePersonality(hostConfig.model_personality) ??
            executionSettings.defaultPersonality)
        : executionSettings.personality;
      const mode = conversation?.mode;
      const threadStartKind = conversation?.threadStartKind ??
        (input.thread?.threadSource === "realtime_voice" ? "realtime_voice" : "default");
      let start = await buildThreadStartConfig(
        {
          model,
          serviceTier: input.serviceTier,
          cwd,
          permissionsConfig: permissions,
          approvalsReviewer: permissions.approvalsReviewer,
          personality,
          hostConfig,
          defaultFeatureOverrides: executionSettings.defaultFeatureOverrides,
          instructionOverrides: executionSettings.instructionOverrides,
          allowMemoryPromptOverrides: settings.allowMemoryPromptOverrides,
          threadId: params.conversationId,
          includeProseDetailLevelInstructions: executionSettings.includeProseDetailLevelInstructions,
          writingBlockInstructions:
            executionSettings.writingBlocks && executionSettings.includeProseDetailLevelInstructions,
          usesDesktopMcp: settings.usesDesktopMcp,
          registerDynamicTools: false,
        },
        {
          requestClient,
          logger,
          priority: input.requestOptions.priority,
          fetchProxyConfig: settings.fetchProxyConfig,
          fetchCodexConfig: () => settings.readCodexConfig(cwd),
          readShellEnvironment:
            settings.readShellEnvironment == null ? undefined : () => settings.readShellEnvironment(cwd),
          readDeveloperInstructions: settings.readDeveloperInstructions,
          readDynamicTools:
            settings.usesDesktopMcp && settings.readDynamicTools != null
              ? () => settings.readDynamicTools({
                  featureOverrides: executionSettings.defaultFeatureOverrides,
                  mode: mode ?? "default",
                  threadStartKind,
                })
              : undefined,
        },
        permissions,
        "legacy",
        requestClient.getAppServerVersion(),
      );
      const preserveServerPermissions =
        (params.permissions == null &&
          (requestClient.hostId === "durable" || (settings.isBrowserRuntime && requestClient.hostId === "local"))) ||
        (params.permissions == null && settings.isBrowserRuntime && requestClient.hostId.startsWith("remote-control:")) ||
        (params.useAppServerPermissionDefault === true && usePermissionDefault(params.conversationId));
      if (settings.isTokenBudgetThread(params.conversationId))
        start.config = enableTokenBudgetHistoryNotes(start.config, requestClient.getAppServerVersion());
      if (preserveServerPermissions) start.config = stripPermissionConfig(start.config);
      return {
        start,
        defaultFeatureOverrides: executionSettings.defaultFeatureOverrides,
        requestOptions: input.requestOptions,
        backgroundRequestOptions: undefined,
        preserveServerPermissions,
        canReuseRunningThread: true,
        independentHistory: null,
        useTurnsPageFallback: false,
        drainRemainingHistory: true,
        completeRequest: (request: any) => request,
        async getResult(response: any) {
          return {
            model: response.model.trim() || null,
            collaborationModel: response.model,
            reasoningEffort: undefined,
            developerInstructions: null,
            threadStartKind: null,
          };
        },
      };
    },
    getThreadStartKind: () => null,
    workspace: {
      projectlessPathSentinel: "~",
      getWritableRoot: firstWritableRoot,
      getCwd: resolveThreadCwd,
      getSandboxPolicy: resolveWorkspaceSandboxPolicy,
      arePathsEquivalent,
    },
    history: {
      mapResumeResponse: (response, context) =>
        historyMapper.mapThreadTurns?.(turnParamsFromReadResponse(response as any, context as any)) ?? [],
    },
  };
}
export const xye = buildResumeProduct;
export function buildDefaultTurnConfig(
  manager: {
    requestClient: {
      hostId: string;
      sendRequest(method: string, params?: unknown, options?: unknown): Promise<any>;
    };
    logger: { error(message: string, data?: unknown): void };
    getHostId(): string;
    getAccount(options: unknown): Promise<any>;
    getAuthMethod(options: unknown): Promise<string | null>;
    sendRequest(
      method: string,
      params: unknown,
      options?: unknown,
    ): Promise<unknown>;
  },
  options: {
    runtime: { isCopilotApiAvailable(): Promise<boolean> };
    storage: { readGlobalState(key: string): Promise<unknown> };
  },
  assertActive: () => void,
  onChanged: () => void,
) {
  let pendingWrite: Promise<unknown> | null = null;
  return {
    readServiceTier: async (model: string | null) => {
      while (pendingWrite != null) await pendingWrite.catch(() => undefined);
      assertActive();
      try {
        if (
          manager.getHostId() === "local" &&
          (await options.storage.readGlobalState("use-copilot-auth-if-available")) === true &&
          (await options.runtime.isCopilotApiAvailable())
        ) return null;
        const [account, authMethod] = await Promise.all([
          manager.getAccount({ priority: "critical" }),
          manager.getAuthMethod({ priority: "critical" }).catch(() => null),
        ]);
        if (authMethod === "personalAccessToken" || account.account?.type !== "chatgpt") return null;
        const requirements = await manager.requestClient.sendRequest(
          "configRequirements/read",
          undefined,
          { priority: "critical" },
        );
        if (requirements.requirements?.featureRequirements?.fast_mode === false) return null;
        const configResponse = await manager.requestClient.sendRequest(
          "config/read",
          { includeLayers: false, cwd: null },
          { priority: "critical" },
        );
        const config = mergeThreadProfiles(configResponse.config ?? {});
        if (config.service_tier != null)
          return resolveModelServiceTier(null, config.service_tier);
        const modelResponse = await manager.requestClient.sendRequest(
          "model/list",
          { includeHidden: true, cursor: null, limit: 100 },
          { priority: "critical" },
        );
        const selectedModel = model ?? config.model;
        const modelInfo = selectedModel == null
          ? modelResponse.data.find((entry: any) => entry.isDefault)
          : modelResponse.data.find((entry: any) => entry.model === selectedModel || entry.id === selectedModel);
        return resolveModelServiceTier(modelInfo ?? null, null);
      } catch (error) {
        manager.logger.error("Failed to read saved service tier for request", {
          safe: {},
          sensitive: { error },
        });
        return null;
      }
    },
    writeServiceTier: async (serviceTier: string | null, profile: string | null) => {
      const previous = pendingWrite;
      const write = (async () => {
        await previous?.catch(() => undefined);
        assertActive();
        return manager.sendRequest("config/batchWrite", {
          edits: [{
            keyPath: profile == null ? "service_tier" : `profiles.${profile}.service_tier`,
            value: serviceTier ?? "default",
            mergeStrategy: "upsert",
          }],
          filePath: null,
          expectedVersion: null,
          reloadUserConfig: true,
        });
      })();
      pendingWrite = write;
      try {
        return await write;
      } finally {
        if (pendingWrite === write) {
          pendingWrite = null;
          onChanged();
        }
      }
    },
    writeModel: (model: string, effort: unknown, profile: string | null) => {
      const prefix = profile == null ? "" : `profiles.${profile}.`;
      return manager.sendRequest("config/batchWrite", {
        edits: [
          { keyPath: `${prefix}model`, value: model, mergeStrategy: "upsert" },
          { keyPath: `${prefix}model_reasoning_effort`, value: effort, mergeStrategy: "upsert" },
        ],
        filePath: null,
        expectedVersion: null,
        reloadUserConfig: true,
      });
    },
    readShellEnvironmentPolicy: async () => null,
  };
}
export const wye = buildDefaultTurnConfig;
