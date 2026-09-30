type Sandbox = {
  type?: string;
  writableRoots?: string[];
  [key: string]: unknown;
};
export function mergeUnique<T>(
  ...lists: Array<readonly T[] | null | undefined>
): T[] {
  const result: T[] = [];
  const seen = new Set<T>();
  for (const list of lists)
    for (const value of list ?? [])
      if (!seen.has(value)) {
        seen.add(value);
        result.push(value);
      }
  return result;
}
export const Nx = mergeUnique;
export function expandSandboxWritableRoots<T>(
  policy: T,
  roots: readonly unknown[],
): T {
  if (typeof policy !== "object" || policy == null || !("type" in policy) || policy.type !== "workspaceWrite") return policy;
  const current = "writableRoots" in policy && Array.isArray(policy.writableRoots)
    ? policy.writableRoots.filter((root): root is string => typeof root === "string")
    : [];
  const requested = roots.filter((root): root is string => typeof root === "string");
  const writableRoots = mergeUnique(current, requested);
  return writableRoots.length === current.length
    ? policy
    : ({ ...policy, writableRoots } as T);
}
export const Ox = expandSandboxWritableRoots;
export function sandboxMissingRoots(
  policy: unknown,
  roots: readonly unknown[],
): boolean {
  if (typeof policy !== "object" || policy == null || !("type" in policy) || policy.type !== "workspaceWrite") return false;
  const writableRoots = "writableRoots" in policy && Array.isArray(policy.writableRoots) ? policy.writableRoots : [];
  return roots.some((root) => typeof root === "string" && !writableRoots.includes(root));
}
export const kx = sandboxMissingRoots;
const isWindows = (path: string) =>
  /^[a-z]:[\/]/iu.test(path) || path.startsWith("\\");
export function filterCompatibleRoots(
  cwd: string | null | undefined,
  roots: readonly string[],
): string[] {
  if (cwd == null) return [...roots];
  const windows = isWindows(cwd);
  return roots.filter((root) => root === "~" || isWindows(root) === windows);
}
export const Ax = filterCompatibleRoots;
export function isWriterConflictError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  const lower = text.toLowerCase();
  return (
    lower.includes("already has an active writer") ||
    lower.includes("already has a live local writer")
  );
}
export const Px = isWriterConflictError;
export function Ex(value: unknown): Record<string, string[]> {
  if (typeof value !== "object" || value == null || Array.isArray(value))
    return {};
  const result: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value))
    if (Array.isArray(entry) && entry.every((item) => typeof item === "string"))
      result[key] = entry;
  return result;
}
export function Dx(
  current: readonly string[],
  required: readonly string[],
): boolean {
  return required.some((root) => !current.includes(root));
}
export function Vye({
  writableRootsByThread,
  conversationId,
  writableRoots,
}: {
  writableRootsByThread: Record<string, string[]>;
  conversationId: string;
  writableRoots: readonly string[];
}): Record<string, string[]> {
  return {
    ...writableRootsByThread,
    [conversationId]: mergeUnique(
      writableRootsByThread[conversationId],
      writableRoots,
    ),
  };
}
export function Cx(
  response: Record<string, unknown>,
  fallback: Record<string, unknown> | null | undefined = null,
  _useDefault?: unknown,
  _profile?: unknown,
): Record<string, unknown> {
  const result = { ...(fallback ?? {}), ...response };
  if (response.sandboxPolicy == null && fallback?.sandboxPolicy != null)
    result.sandboxPolicy = fallback.sandboxPolicy;
  return result;
}
export async function readDefaultPersonality(
  client: {
    sendRequest(
      method: string,
      params: unknown,
    ): Promise<{ config?: Record<string, unknown> }>;
  },
  settings: unknown,
  cwd?: string | null,
  config?: unknown,
): Promise<unknown> {
  void settings;
  const supplied = typeof config === "object" && config != null && !Array.isArray(config)
    ? (config as Record<string, unknown>)
    : undefined;
  const resolved =
    supplied ??
    (
      await client.sendRequest("config/read", {
        cwd: cwd ?? null,
        includeLayers: false,
      })
    ).config;
  return resolved?.personality ?? null;
}
export const Iye = readDefaultPersonality;
const mcpRequests = new Map<string, Promise<unknown>>();
export function listMcpServers(
  client: {
    sendRequest(
      method: string,
      params: unknown,
      options?: unknown,
    ): Promise<unknown>;
  },
  requestCache: Map<string, Promise<unknown>>,
  params: unknown,
  options?: unknown,
): Promise<unknown> {
  const key = JSON.stringify([params, options]);
  const existing = requestCache.get(key);
  if (existing) return existing;
  const request = client
    .sendRequest("mcpServerStatus/list", params, options)
    .finally(() => requestCache.delete(key));
  requestCache.set(key, request);
  return request;
}
export const Fye = listMcpServers;
export async function editLastUserTurn(input: {
  manager: { sendRequest(method: string, params: unknown): Promise<unknown> };
  conversationId: string;
  options?: Record<string, unknown>;
  startTurn?: (
    request: unknown,
    bufferedTurn: unknown,
    useDefault: boolean,
  ) => Promise<unknown>;
  turnMergePolicy?: unknown;
  ownerWindowError?: string;
}): Promise<unknown> {
  const response = await input.manager.sendRequest("thread/editLastUserTurn", {
    threadId: input.conversationId,
    ...input.options,
  });
  return input.startTurn == null
    ? response
    : input.startTurn(response, response, false);
}
export const Eye = editLastUserTurn;
export async function forkConversation(input: {
  manager: {
    sendRequest(
      method: string,
      params: unknown,
    ): Promise<Record<string, unknown>>;
  };
  params: Record<string, unknown>;
  beforeConversationAdded?: () => unknown;
  capabilities?: unknown;
  history?: unknown;
  hostMode?: unknown;
  compareSemanticVersions?: unknown;
  threadRecognition?: unknown;
  notificationDeferral?: unknown;
  saveThreadProjectAssignment?: unknown;
  workspaceStorage?: unknown;
}): Promise<Record<string, unknown>> {
  const response = await input.manager.sendRequest("thread/fork", input.params);
  await input.beforeConversationAdded?.();
  return { status: "created", ...response };
}
export const Mye = forkConversation;
export async function uve(
  manager: {
    sendRequest(
      method: string,
      params: unknown,
    ): Promise<Record<string, unknown>>;
  },
  params: Record<string, unknown>,
  _compareSemanticVersions?: unknown,
): Promise<Record<string, unknown>> {
  return manager.sendRequest("thread/fork", params);
}
export async function Tx(input: {
  manager?: { getConversation?(id: string): unknown };
  projectlessConversations?: unknown;
  result: Record<string, unknown>;
  params?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  return {
    ...input.result,
    conversation:
      typeof input.result.conversationId === "string"
        ? input.manager?.getConversation?.(input.result.conversationId)
        : null,
  };
}
export async function wx(input: {
  conversationId: string;
  product: { prepare?(value: unknown): Promise<unknown> };
  resumeParams: unknown;
  placement: unknown;
  projectAssignment?: unknown;
  saveThreadProjectAssignment?: unknown;
  workspaceStorage?: unknown;
}): Promise<Record<string, unknown>> {
  return {
    conversationId: input.conversationId,
    placement: input.placement,
    prepared: await input.product.prepare?.(input.resumeParams),
  };
}
export function tx(
  manager: unknown,
  params: Record<string, unknown>,
  capabilities: Record<string, unknown>,
  history: unknown,
) {
  return {
    manager,
    params,
    capabilities,
    history,
    trace:
      typeof capabilities.trace === "object" && capabilities.trace != null
        ? (capabilities.trace as { finish?(error?: unknown): void; trace?: unknown })
        : null,
    prepareRequest: async () => ({ status: "ready" }),
    copyThreadMetadata: (_source: string, _target: string) => undefined,
    prepare: async (value: unknown) => value,
  };
}
export async function Hye({
  conversationId,
  manager,
  resumeConversation,
  shouldHandleFailure,
}: {
  conversationId: string;
  manager: {
    getConversation(id: string): { cwd?: string | null; latestCollaborationMode?: unknown } | null;
    updateConversationState?(id: string, update: (state: Record<string, unknown>) => void): void;
    logger?: { warning(message: string, data?: unknown): void };
  };
  resumeConversation(params: Record<string, unknown>): Promise<{ status?: string }>;
  shouldHandleFailure(): boolean;
}): Promise<void> {
  const conversation = manager.getConversation(conversationId);
  try {
    await resumeConversation({
      conversationId,
      model: null,
      reasoningEffort: null,
      workspaceRoots: conversation?.cwd ? [conversation.cwd] : ["/"],
      collaborationMode: conversation?.latestCollaborationMode,
    });
  } catch (error) {
    if (!shouldHandleFailure()) throw error;
    manager.updateConversationState?.(conversationId, (state) => {
      state.resumeState = "needs_resume";
    });
    manager.logger?.warning("Failed to resume subagent for file approval", {
      sensitive: { error },
    });
    throw error;
  }
}
export function dye(input: Record<string, unknown>): Record<string, unknown> {
  return { ...input, canFork: true, supportsThreadMetadata: true };
}
