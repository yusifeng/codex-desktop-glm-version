import type { AnyTurn } from "../turns/canonical-history";

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
    return requirements.featureRequirements?.fast_mode === false
      ? null
      : requested;
  } catch (error) {
    logger.warning("Failed to read service tier requirements", {
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
  const resolved =
    typeof config === "object" && config != null && !Array.isArray(config)
      ? (config as Record<string, unknown>)
      : {};
  logger.info("thread_feature_overrides_resolved", {
    safe: {
      defaultConcurrentReasoningSummaries:
        defaults?.concurrent_reasoning_summaries ?? null,
      concurrentReasoningSummaries:
        resolved.concurrent_reasoning_summaries ??
        resolved["features.concurrent_reasoning_summaries"] ??
        null,
    },
    sensitive: {},
  });
}
export const vx = logFeatureOverrideResolved;
export async function buildThreadStartConfig(
  config: Record<string, unknown>,
  _services: unknown,
  permissions: Record<string, unknown> | null,
  historyMode?: string | null,
  _version?: string | null,
): Promise<Record<string, unknown>> {
  const result = { ...config };
  const features = {
    ...((result.features as Record<string, unknown> | undefined) ?? {}),
  };
  if (permissions == null || typeof permissions.approvalPolicy === "object")
    features.request_permissions_tool = true;
  if (Object.keys(features).length) result.features = features;
  if (result.ephemeral !== true && historyMode === "paginated")
    result.historyMode = historyMode;
  return result;
}
export const gx = buildThreadStartConfig;
function normalize(value: string): string {
  return value.replaceAll("\\", "/").replace(/\/+$/u, "").toLowerCase();
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
  if (requestedCwd && effective) {
    const request = normalize(requestedCwd),
      base = normalize(effective);
    if (request === base || request.startsWith(base + "/")) return requestedCwd;
  }
  return effective ?? requestedCwd ?? fallbackCwd ?? undefined;
}
export const xx = resolveThreadCwdFromResponse;
export function buildResumeProduct(
  settings: Record<string, unknown>,
  requestClient: unknown,
  logger: unknown,
  history: unknown,
  usePermissionDefault: (id: string) => boolean,
  readSettingsOverride?: unknown,
): {
  readCatalogEntry(hostId: string, threadId: string): Promise<unknown> | undefined;
  useBoundedCloudHistory: boolean;
  beginHydration?: (input: unknown) => unknown;
  prepare(input: unknown): Promise<Record<string, unknown>>;
  getThreadStartKind(thread: unknown): string | null;
  workspace: {
    projectlessPathSentinel: string;
    getWritableRoot(policy: unknown): string | null;
    getCwd(input: unknown): string | null;
    getSandboxPolicy(input: unknown): unknown;
    arePathsEquivalent(left: string, right: string): boolean;
  };
  history: { mapResumeResponse(response: unknown, context: unknown): AnyTurn[] };
} {
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
    prepare: async (input) => ({
      input,
      requestClient,
      logger,
      usePermissionDefault,
      readSettingsOverride,
    }),
    getThreadStartKind: () => null,
    workspace: {
      projectlessPathSentinel: "~",
      getWritableRoot: (policy) => {
        if (typeof policy !== "object" || policy == null || !("writableRoots" in policy)) return null;
        const roots = policy.writableRoots;
        return Array.isArray(roots)
          ? roots.find((root): root is string => typeof root === "string") ?? null
          : null;
      },
      getCwd: (input) =>
        typeof input === "object" && input != null && "cwd" in input && typeof input.cwd === "string"
          ? input.cwd
          : null,
      getSandboxPolicy: (input) =>
        typeof input === "object" && input != null && "sandboxPolicy" in input
          ? input.sandboxPolicy
          : null,
      arePathsEquivalent: (left, right) => normalize(left) === normalize(right),
    },
    history: {
      mapResumeResponse: (response) => historyMapper.mapThreadTurns?.(response) ?? [],
    },
  };
}
export const xye = buildResumeProduct;
export function buildDefaultTurnConfig(
  manager: {
    sendRequest(
      method: string,
      params: unknown,
      options?: unknown,
    ): Promise<unknown>;
  },
  _options: unknown,
  assertActive: () => void,
  onChanged: () => void,
) {
  let serviceTier: string | null = null;
  return {
    readServiceTier: async () => serviceTier,
    writeServiceTier: async (_id: string, value: string | null) => {
      assertActive();
      serviceTier = value;
      await manager.sendRequest("config/batchWrite", {
        edits: [{ key: "service_tier", value }],
      });
      onChanged();
    },
    writeModel: async () => undefined,
    readShellEnvironmentPolicy: async () => null,
  };
}
export const wye = buildDefaultTurnConfig;
