import { Wn as ResumeNotReadyError, Zo as errorToString } from "@chunk/shared";
import { hasCompleteHistory, lastIncompleteTurn, lastTurn, mergedConversationTurns } from "../turns/canonical-history";

type UnknownRecord = Record<string, unknown>;
type StreamRole = { role: string; ownerClientId?: string } | null | undefined;
export interface DelegateOptions<T extends { result: unknown }> { conversationId: string; getStreamRole(id: string): StreamRole; markConversationNeedsResumeForUnavailableOwner(id: string, ownerId: string): void; resumeConversationForUnavailableOwner(options: UnknownRecord | string): Promise<{ status: string }>; workspaceRoots: string[]; collaborationMode: unknown; reasoningEffort: unknown; serviceTier?: unknown; useAppServerPermissionDefault?: unknown; sendRequest(role: StreamRole): Promise<T | null> }
export async function ny<T extends { result: unknown } = { result: unknown }>(options: DelegateOptions<T>): Promise<T | null> {
  const role = options.getStreamRole(options.conversationId);
  try { return await options.sendRequest(role); } catch (error) {
    if (role?.role !== `follower` || !errorToString(error).includes(`no-client-found`)) throw error;
    options.markConversationNeedsResumeForUnavailableOwner(options.conversationId, role.ownerClientId ?? ``);
    const result = await options.resumeConversationForUnavailableOwner({ conversationId: options.conversationId, model: null, ...(options.serviceTier === undefined ? {} : { serviceTier: options.serviceTier }), reasoningEffort: options.reasoningEffort, workspaceRoots: options.workspaceRoots, useAppServerPermissionDefault: options.useAppServerPermissionDefault, collaborationMode: options.collaborationMode });
    if (result.status === `not-ready`) throw new ResumeNotReadyError(result);
    return null;
  }
}
export const delegateRequestToFollowerOwner = ny;

interface WatchFile { hostId: string; path: string; refreshMode?: string; threadId?: string; server?: string; uri?: string }
interface OpenSources { reviewFiles: WatchFile[]; openFiles: WatchFile[]; mcpResourcesByMcpAppId: Map<string, WatchFile[]> }
interface WatchTarget { hostId: string; path: string; reviewFiles: WatchFile[]; openFiles: WatchFile[]; mcpResources: Map<string, WatchFile> }
interface Watch { watchId: string; target: WatchTarget; ignoreChangesUntilMs: number; isStarted: boolean; shouldUnwatchOnStart: boolean; startPromise: Promise<unknown> }
interface WatchParams { logger: { warning(message: string, details: unknown): void }; createId(): string; getWatchPath(conversationId: string, path: string): string | null; requestClient: { sendRequest(method: string, params: UnknownRecord): Promise<unknown> }; schedule(callback: () => void, delay: number): unknown }
const emptySources = (): OpenSources => ({ reviewFiles: [], openFiles: [], mcpResourcesByMcpAppId: new Map() });
const key = (hostId: string, path: string): string => `${hostId}\0${path}`;

export class sve {
  private readonly params: WatchParams; private readonly openFilesByConversationId = new Map<string, OpenSources>();
  private readonly watchesByKey = new Map<string, Watch>(); private readonly watchesByWatchId = new Map<string, Watch>();
  private readonly pendingIgnoreChangesUntilMsByKey = new Map<string, number>();
  constructor(params: WatchParams) { this.params = params; }
  dispose(): void { this.openFilesByConversationId.clear(); this.pendingIgnoreChangesUntilMsByKey.clear(); this.sync(); }
  setOpenReviewFileSourceFiles(id: string, files: WatchFile[]): void { const source = this.openFilesByConversationId.get(id) ?? emptySources(); source.reviewFiles = files; this.setSources(id, source); }
  setOpenFileTabFiles(id: string, files: WatchFile[]): void { const source = this.openFilesByConversationId.get(id) ?? emptySources(); source.openFiles = files; this.setSources(id, source); }
  async setOpenMcpResources(id: string, appId: string, files: WatchFile[]): Promise<void> {
    const source = this.openFilesByConversationId.get(id) ?? emptySources();
    const previous = source.mcpResourcesByMcpAppId.get(appId);
    files.length === 0 ? source.mcpResourcesByMcpAppId.delete(appId) : source.mcpResourcesByMcpAppId.set(appId, files);
    this.setSources(id, source);
    try {
      await Promise.all(files.map((file) => this.getStartPromise(id, file)));
    } catch (error) {
      const current = this.openFilesByConversationId.get(id);
      if (current?.mcpResourcesByMcpAppId.get(appId) === files) {
        previous == null ? current.mcpResourcesByMcpAppId.delete(appId) : current.mcpResourcesByMcpAppId.set(appId, previous);
        this.setSources(id, current);
      }
      throw error;
    }
  }
  removeConversation(id: string): void { this.openFilesByConversationId.delete(id); this.sync(); }
  getFileChangeMessages(watchId: string): UnknownRecord[] {
    if (this.isFileChangeIgnored(watchId)) return []; const target = this.watchesByWatchId.get(watchId)?.target; if (target == null) return [];
    const paths = new Set<string>(); const messages: UnknownRecord[] = target.reviewFiles.map((file) => { if (file.refreshMode === `auto`) paths.add(file.path); return { type: file.refreshMode === `manual` ? `review-file-source-changed` : `refetch-review-file-source`, hostId: file.hostId, path: file.path }; });
    target.openFiles.forEach((file) => paths.add(file.path));
    return [...messages, ...Array.from(paths, (path) => ({ type: `open-file-changed`, hostId: target.hostId, path })), ...Array.from(target.mcpResources.values(), (file) => ({ type: `mcp-resource-updated`, hostId: file.hostId, notification: { method: `notifications/resources/updated`, params: { uri: file.uri } }, server: file.server, threadId: file.threadId }))];
  }
  ignoreFileChangeEvents(id: string, file: { hostId: string; path: string } | boolean): void { if (typeof file === `boolean`) { if (!file) return; for (const watch of this.watchesByKey.values()) watch.ignoreChangesUntilMs = Date.now() + 5000; return; } const path = this.params.getWatchPath(id, file.path); if (path == null) return; const watchKey = key(file.hostId, path); const entry = this.watchesByKey.get(watchKey); const until = Date.now() + 5000; if (entry != null) entry.ignoreChangesUntilMs = Math.max(entry.ignoreChangesUntilMs, until); else { const expiry = Math.max(this.pendingIgnoreChangesUntilMsByKey.get(watchKey) ?? 0, until); this.pendingIgnoreChangesUntilMsByKey.set(watchKey, expiry); this.params.schedule(() => { if ((this.pendingIgnoreChangesUntilMsByKey.get(watchKey) ?? 0) <= expiry) this.pendingIgnoreChangesUntilMsByKey.delete(watchKey); }, 5000); } }
  private isFileChangeIgnored(id: string): boolean { const watch = this.watchesByWatchId.get(id); if (watch == null || watch.ignoreChangesUntilMs <= 0) return false; if (Date.now() < watch.ignoreChangesUntilMs) return true; watch.ignoreChangesUntilMs = 0; return false; }
  private setSources(id: string, source: OpenSources): void { source.reviewFiles.length === 0 && source.openFiles.length === 0 && source.mcpResourcesByMcpAppId.size === 0 ? this.openFilesByConversationId.delete(id) : this.openFilesByConversationId.set(id, source); this.sync(); }
  private target(next: Map<string, WatchTarget>, id: string, file: WatchFile): WatchTarget | null { const path = this.params.getWatchPath(id, file.path); if (path == null) return null; const watchKey = key(file.hostId, path); const current = next.get(watchKey) ?? { hostId: file.hostId, path, reviewFiles: [], openFiles: [], mcpResources: new Map() }; next.set(watchKey, current); return current; }
  private sync(): void {
    const next = new Map<string, WatchTarget>(); for (const [id, sources] of this.openFilesByConversationId) { for (const file of sources.reviewFiles) this.target(next, id, file)?.reviewFiles.push(file); for (const file of sources.openFiles) this.target(next, id, file)?.openFiles.push(file); for (const files of sources.mcpResourcesByMcpAppId.values()) for (const file of files) this.target(next, id, file)?.mcpResources.set(JSON.stringify([file.threadId, file.server, file.uri]), file); }
    for (const [watchKey, watch] of this.watchesByKey) { const target = next.get(watchKey); if (target == null) this.stop(watchKey, watch); else watch.target = target; }
    for (const [watchKey, target] of next) if (!this.watchesByKey.has(watchKey)) this.start(watchKey, target);
  }
  private start(watchKey: string, target: WatchTarget): void { const watchId = `open-file-${this.params.createId()}`; const pendingIgnore = this.pendingIgnoreChangesUntilMsByKey.get(watchKey) ?? 0; const watch: Watch = { watchId, target, ignoreChangesUntilMs: pendingIgnore > Date.now() ? pendingIgnore : 0, isStarted: false, shouldUnwatchOnStart: false, startPromise: Promise.resolve() }; this.pendingIgnoreChangesUntilMsByKey.delete(watchKey); this.watchesByKey.set(watchKey, watch); this.watchesByWatchId.set(watchId, watch); watch.startPromise = this.params.requestClient.sendRequest(`fs/watch`, { path: target.path, watchId }).then(() => { watch.isStarted = true; if (watch.shouldUnwatchOnStart) this.stopRequest(watchId); }).catch((error: unknown) => { if (this.watchesByKey.get(watchKey) === watch) { this.watchesByKey.delete(watchKey); this.watchesByWatchId.delete(watchId); this.params.logger.warning(`Failed to watch open file`, { safe: {}, sensitive: { error, hostId: target.hostId, path: target.path } }); } throw error; }); watch.startPromise.catch(() => undefined); }
  private stop(watchKey: string, watch: Watch): void { this.watchesByKey.delete(watchKey); this.watchesByWatchId.delete(watch.watchId); if (!watch.isStarted) watch.shouldUnwatchOnStart = true; else this.stopRequest(watch.watchId); }
  private stopRequest(watchId: string): void { this.params.requestClient.sendRequest(`fs/unwatch`, { watchId }).catch((error: unknown) => this.params.logger.warning(`Failed to unwatch open file`, { safe: {}, sensitive: { error } })); }
  private getStartPromise(id: string, file: WatchFile): Promise<unknown> { const path = this.params.getWatchPath(id, file.path); if (path == null) return Promise.reject(Error(`MCP resource path is not watchable`)); return this.watchesByKey.get(key(file.hostId, path))?.startPromise ?? Promise.reject(Error(`MCP resource watch was not registered`)); }
}
export const OpenFileWatchRegistry = sve;

export function ry(state: unknown, policy?: unknown): string | undefined {
  if (typeof state !== `object` || state === null) return;
  const turn = [...mergedConversationTurns(state as never, policy as never)].reverse().find((entry) => entry.turnId != null);
  return turn?.status === `inProgress` && typeof turn.turnId === `string` ? turn.turnId : undefined;
}
export function iy(state: unknown): boolean {
  if (typeof state !== `object` || state === null) return false;
  const record = state as UnknownRecord;
  if (Array.isArray(record.unconfirmedTurnSubmissions) && record.unconfirmedTurnSubmissions.some((entry) => typeof entry === `object` && entry !== null && (entry as UnknownRecord).terminal !== true)) return true;
  const turns = mergedConversationTurns(record as never, undefined as never) as UnknownRecord[];
  if (record.resumeState === `needs_resume`) return typeof record.threadRuntimeStatus === `object` && record.threadRuntimeStatus !== null && (record.threadRuntimeStatus as UnknownRecord).type === `active`;
  if (turns.length === 0) return record.resumeState === `resuming`;
  return lastIncompleteTurn({ turns } as never)?.status === `inProgress`;
}
export function ove(state: unknown, request: unknown, policy?: unknown): UnknownRecord | null {
  if (typeof state !== `object` || state === null) return null;
  const record = state as UnknownRecord;
  const turn = typeof request === `object` && request !== null ? request as UnknownRecord : null;
  const latest = lastTurn(record as never) as UnknownRecord | null;
  const params = turn?.params as UnknownRecord | undefined;
  const collaboration = params?.collaborationMode as UnknownRecord | undefined;
  const collaborationSettings = collaboration?.settings as UnknownRecord | undefined;
  return {
    originator: record.originator,
    inProgress: iy(state),
    activeTurnId: ry(state, policy) ?? null,
    hasMisalignmentPolicyViolation: latest?.error != null &&
      (latest.error as UnknownRecord).codexErrorInfo === `misalignmentPolicyViolation`,
    latestModel: record.latestModel,
    latestReasoningEffort: record.latestReasoningEffort,
    threadStartKind: record.threadStartKind,
    threadSource: record.threadSource,
    requestTraceId: turn?.requestTraceId,
    turnConfiguration: turn == null ? undefined : {
      model: collaborationSettings?.model ?? params?.model ?? null,
      reasoningEffort: turn.requestedReasoningEffort ??
        collaborationSettings?.reasoning_effort ?? params?.effort ?? null,
      serviceTier: params?.serviceTierForTurn ?? params?.serviceTier ?? null,
    },
  };
}
export async function ave(manager: unknown, conversationId: string, helpers: UnknownRecord): Promise<void> {
  const target = manager as UnknownRecord;
  const method = (name: string) => target[name] as ((...args: unknown[]) => unknown);
  const getConversation = method(`getConversation`) as (id: string) => UnknownRecord | null;
  const getStreamRole = method(`getStreamRole`) as (id: string) => StreamRole;
  try {
    await method(`waitForPendingThreadSettingsUpdate`).call(manager, conversationId);
  } catch (error) {
    if (getStreamRole.call(manager, conversationId)?.role !== `follower` || !errorToString(error).includes(`no-client-found`)) throw error;
  }
  const conversation = getConversation.call(manager, conversationId);
  const delegated = await ny({
    conversationId,
    getStreamRole: (id) => getStreamRole.call(manager, id),
    markConversationNeedsResumeForUnavailableOwner: helpers.markConversationNeedsResumeForUnavailableOwner as (id: string, ownerId: string) => void,
    resumeConversationForUnavailableOwner: helpers.resumeConversationForUnavailableOwner as (options: UnknownRecord | string) => Promise<{ status: string }>,
    workspaceRoots: [String(method(`getConversationCwd`).call(manager, conversationId) ?? `/`)],
    collaborationMode: conversation?.latestCollaborationMode ?? null,
    reasoningEffort: conversation?.latestReasoningEffort ?? null,
    sendRequest: async (role) => {
      const result = await (helpers.sendThreadFollowerRequest as (role: StreamRole, method: string, params: UnknownRecord) => Promise<unknown>)(role, `thread-follower-compact-thread`, { conversationId });
      return result == null ? null : { result };
    },
  });
  if (delegated) return;
  if (getStreamRole.call(manager, conversationId)?.role !== `owner`) throw Error(String(helpers.ownerWindowError));
  (helpers.registerPendingManualContextCompaction as (id: string) => void)(conversationId);
  try {
    await method(`sendRequest`).call(manager, `thread/compact/start`, { threadId: conversationId });
  } catch (error) {
    (helpers.removePendingManualContextCompaction as (id: string) => void)(conversationId);
    throw error;
  }
}
export async function dve(manager: unknown, request: { method: string; params: UnknownRecord }): Promise<UnknownRecord | undefined> {
  const target = manager as UnknownRecord;
  const fn = (name: string) => target[name] as ((...args: unknown[]) => unknown);
  const params = request.params;
  const id = String(params.conversationId ?? ``);
  fn(`assertThreadFollowerOwner`).call(manager, id);
  switch (request.method) {
    case `thread-follower-set-queued-follow-ups-state`:
      await ((target.turnCoordinator as UnknownRecord).acceptFromFollower as (...args: unknown[]) => unknown)(id, (params.state as UnknownRecord)[id] ?? []);
      return { method: request.method, result: { ok: true } };
    case `thread-follower-command-approval-decision`:
      fn(`replyWithCommandExecutionApprovalDecision`).call(manager, id, params.requestId, params.decision); break;
    case `thread-follower-file-approval-decision`:
      fn(`replyWithFileChangeApprovalDecision`).call(manager, id, params.requestId, params.decision); break;
    case `thread-follower-permissions-request-approval-response`:
      fn(`replyWithPermissionsRequestApprovalResponse`).call(manager, id, params.requestId, params.response); break;
    case `thread-follower-submit-mcp-server-elicitation-response`:
      fn(`replyWithMcpServerElicitationResponse`).call(manager, id, params.requestId, params.response); break;
    case `thread-follower-submit-user-input`:
      fn(`replyWithUserInputResponse`).call(manager, id, params.requestId, params.response); break;
    case `thread-follower-compact-thread`:
      await fn(`compactThread`).call(manager, id); break;
    case `thread-follower-edit-last-user-turn`:
      await fn(`editLastUserTurn`).call(manager, id, params); break;
    case `thread-follower-interrupt-turn`:
      try {
        const interruptedTurnId = await fn(`interruptConversation`).call(manager, id, params.mode, params.expectedTurnId);
        return { method: request.method, result: { interruptedTurnId, ok: true } };
      } catch (error) {
        if (params.mode !== `user-stop` || !(error instanceof Error) || !(`interruptedTurnId` in error) || typeof error.interruptedTurnId !== `string`) throw error;
        return { method: request.method, result: { interruptedTurnId: error.interruptedTurnId, goalPauseError: error.message, ok: true } };
      }
    case `thread-follower-load-complete-history`: {
      const conversation = fn(`getConversation`).call(manager, id);
      const wasComplete = conversation != null && hasCompleteHistory(conversation as never);
      const before = fn(`getConversationStreamRevision`).call(manager, id);
      await fn(`getCompleteConversationTurns`).call(manager, id);
      const after = fn(`getConversationStreamRevision`).call(manager, id) as number | null;
      const revision = (!wasComplete && after != null && after > ((before as number | null) ?? 0) ? after : null) ?? fn(`broadcastConversationSnapshot`).call(manager, id);
      if (revision == null) throw Error(`no-client-found: thread stream owner became unavailable`);
      return { method: request.method, result: { revision } };
    }
    case `thread-follower-start-turn`: {
      const result = await fn(`startTurn`).call(manager, id, params.turnStart);
      return { method: request.method, result: { result } };
    }
    case `thread-follower-steer-turn`: {
      const result = await fn(`steerTurn`).call(manager, id, params.input, params.restoreMessage, params.serviceTier, params.attachments, params.clientUserMessageId, params.additionalContext, params.toolOutput);
      return { method: request.method, result: { result } };
    }
    case `thread-follower-update-daybreak`:
      await fn(`updateThreadDaybreakEnabled`).call(manager, id, params.daybreakEnabled); break;
    case `thread-follower-update-thread-settings`:
      if (params.activeTurnId == null)
        return { method: request.method, result: { applied: await fn(`updateThreadSettingsForNextTurn`).call(manager, id, params.threadSettings, params.condition) } };
      await fn(`updateThreadPermissions`).call(manager, id, params.threadSettings, params.activeTurnId);
      return { method: request.method, result: { applied: true } };
    default:
      return undefined;
  }
  return { method: request.method, result: { ok: true } };
}
export const handleThreadFollowerRequest = dve;
export const activeTurnId = ry;
export const hasInProgressLocalTurn = iy;
export const readThreadExecutionState = ove;
export const compactThreadViaFollower = ave;
