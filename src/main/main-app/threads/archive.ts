import { Of as zString, wf as zObject } from "@chunk/shared";
import { H_ as subAgentMetadata } from "./projection";
import { threadReferenceCapabilityKey as capabilityKey } from "./reference-capability";

type UnknownRecord = Record<string, unknown>;
const record = (value: unknown): UnknownRecord => typeof value === `object` && value !== null ? value as UnknownRecord : {};
const method = (value: unknown, name: string): ((...args: unknown[]) => unknown) | undefined => { const candidate = record(value)[name]; return typeof candidate === `function` ? candidate as (...args: unknown[]) => unknown : undefined; };
const mapLike = (value: unknown) => value as { get(key: string): unknown; has(key: string): boolean; delete(key: string): boolean; set(key: string, value: unknown): unknown };
const setLike = (value: unknown) => value as { add(value: string, metadata?: unknown): unknown; delete(value: string): boolean; remove?(value: string): unknown };
const call = <T>(target: unknown, name: string, ...args: unknown[]): T => method(target, name)?.apply(target, args) as T;

/**
 * 取消归档后无法装载会话的错误（原版 sb）。unarchive 流程读到该错误时
 * 保留归档状态并提示。
 */
export class UnarchivedConversationLoadError extends Error {
  constructor(conversationId: string) {
    super(`Unarchived conversation ${conversationId} could not be loaded`);
    this.name = `UnarchivedConversationLoadError`;
  }
}

/** 错误响应体 schema（原版 cb，宽松对象）。 */
export const errorBodySchema = zObject({ message: zString() }).loose();

/** 错误响应 schema（原版 lb，宽松对象）。 */
export const errorResponseSchema = zObject({ error: errorBodySchema }).loose();

export function archiveContextFactory(input: unknown): UnknownRecord {
  const source = record(input); const manager = source.manager; const threadStore = source.threadStore; const runtime = source.runtime;
  const hostId = String(call(manager, `getHostId`) ?? ``);
  const listAllThreads = () => call<Promise<unknown[]>>(threadStore, `listAllThreads`, { modelProviders: null });
  return {
    hostId, logger: record(manager).logger, archiveUndoDurationMs: record(runtime).archiveUndoDurationMs, useAppServerPins: source.useAppServerPins,
    isElectronWindow: () => record(runtime).hasDesktopRuntime === true,
    isEphemeralConversation: (id: string) => call<boolean>(threadStore, `isEphemeralConversation`, id),
    discardConversationFromCache: (id: string) => call(manager, `discardConversationFromCache`, id),
    getThreadSummary: (id: string) => call(threadStore, `getThreadSummary`, id), beforeArchiveConversation: async () => undefined,
    conversations: record(threadStore).conversations, projectlessState: source.projectlessState, storage: source.storage, threadsById: record(threadStore).threadsById,
    archivingConversationIds: source.archivingConversationIds, archivedPinnedThreadPlacements: source.archivedPinnedThreadPlacements,
    isConversationSuppressedAfterArchive: (id: string) => call<boolean>(threadStore, `isConversationSuppressed`, id),
    addSuppressedArchivedConversationId: (id: string) => call(threadStore, `suppressArchivedConversation`, id),
    deleteSuppressedArchivedConversationId: (id: string) => call(threadStore, `unsuppressArchivedConversation`, id),
    listActiveThreads: listAllThreads, readThread: (id: string) => call(manager, `readThread`, id, { includeTurns: false }),
    archiveInactiveThread: async (threadId: string, removeCatalogEntryIfMissing: boolean, discardProvisionalThread: boolean) => {
      const inactive = record(runtime).inactiveThreadArchive; if (inactive == null) return { success: false };
      if (call<boolean>(source.isLocalHost, `call`, undefined, hostId)) return call(inactive, `archiveInactiveThread`, { hostId, threadId, removeCatalogEntryIfMissing, discardProvisionalThread });
      const threads = await listAllThreads(); if (threads.some((thread) => record(thread).id === threadId)) return { success: false };
      return { success: await call<Promise<boolean>>(inactive, `removeMissingEntry`, { hostId, threadId }) };
    },
    archiveThread: (id: string) => call(manager, `sendRequest`, `thread/archive`, { threadId: id }), unarchiveThread: (id: string) => call(manager, `sendRequest`, `thread/unarchive`, { threadId: id }),
    broadcastThreadArchived: (payload: unknown) => call<Promise<unknown>>(record(source.ipcBridge).threadArchived, `call`, record(source.ipcBridge), payload) ?? Promise.resolve(),
    broadcastThreadUnarchived: (payload: unknown) => call<Promise<unknown>>(record(source.ipcBridge).threadUnarchived, `call`, record(source.ipcBridge), payload) ?? Promise.resolve(),
    loadUnarchivedThread: (id: string) => call(manager, `hydrateBackgroundThreads`, [id]),
    prepareOwnedThreadForUnarchive: async (id: string) => { if (record(call(manager, `getStreamRole`, id)).role === `owner`) { await call<Promise<unknown>>(manager, `sendRequest`, `thread/unsubscribe`, { threadId: id }); call(source.inactiveThreadUnsubscriber, `clearConversationStreamOwnership`, id); } },
    removeConversationFromCache: (id: string) => call(source.conversationCacheEvictor, `evictConversation`, id, { reason: `archive` }), emitThreadArchived: (id: string) => call(source.events, `emitThreadArchived`, id), pendingThreadArchives: source.pendingThreadArchives,
    getPinnedThreadIds: async () => { const pins = await call<Promise<unknown>>(runtime, `pinnedThreads`); return pins == null ? [] : record(await call<Promise<unknown>>(pins, `list`, undefined)).threadIds ?? []; },
    setThreadPinned: async (value: unknown) => { const pins = await call<Promise<unknown>>(runtime, `pinnedThreads`); if (pins != null) await call<Promise<unknown>>(pins, `set`, value); },
    getManagedWorktreeCleanup: async (cwd: string) => { const roots = await call<Promise<string[]>>(source.worktreeRoots, `getManagedWorktreeRoots`); return roots.some((root) => cwd === root || cwd.startsWith(`${root}/`)); },
  };
}

export async function deleteArchivedConversation(input: unknown, conversationId?: string) { const context = record(input); const deleted = await call<Promise<unknown>>(context.runtime, `deleteArchivedThreads`, context.hostId, conversationId); call(context.handleThreadDeletion, `call`, undefined, deleted); return deleted; }

export async function archiveConversation(input: unknown, conversationId: string, options: UnknownRecord) {
  const context = record(input); if (call<boolean>(context.isEphemeralConversation, `call`, undefined, conversationId)) { await call<Promise<unknown>>(context.discardConversationFromCache, `call`, undefined, conversationId); return; }
  const summary = call<unknown>(context.getThreadSummary, `call`, undefined, conversationId); let conversation = mapLike(context.conversations).get(conversationId); await call<Promise<unknown>>(context.beforeArchiveConversation, `call`, undefined, conversationId, conversation ?? summary); conversation = mapLike(context.conversations).get(conversationId);
  if (conversation == null) { if (summary == null && !call<boolean>(context.isElectronWindow, `call`)) return; const cwd = String(record(summary).cwd ?? `/`); await performArchiveConversation(context, conversationId, cwd, { ...options, cleanupWorktree: summary != null && options.cleanupWorktree }); return; }
  let cwd = String(record(mapLike(context.threadsById).get(conversationId)).cwd ?? conversationCwd(conversation)); const source = record(conversation).source;
  if (cwd === `/` && options.cleanupWorktree !== false && subAgentMetadata(source) == null) { try { cwd = String(record(record(await call<Promise<unknown>>(context.readThread, `call`, undefined, conversationId)).thread).cwd ?? `/`); } catch (error) { call(context.logger, `warning`, `Failed to recover archive worktree directory`, { safe: { conversationId }, sensitive: { error } }); } }
  await performArchiveConversation(context, conversationId, cwd, { useAppServerPins: options.useAppServerPins, cleanupWorktree: options.cleanupWorktree !== false && cwd !== `/` && subAgentMetadata(source) == null, source: options.source });
}

export async function unarchiveConversation(input: unknown, conversationId: string, restorePin = false) {
  const context = record(input); await call<Promise<unknown>>(context.prepareOwnedThreadForUnarchive, `call`, undefined, conversationId); setLike(context.pendingThreadArchives).remove?.(conversationId); call(context.logger, `info`, `Unarchive requested`, { safe: { conversationId }, sensitive: {} });
  try { await call<Promise<unknown>>(context.unarchiveThread, `call`, undefined, conversationId); call(context.logger, `info`, `Unarchive succeeded`, { safe: { conversationId }, sensitive: {} }); } catch (error) { call(context.logger, `error`, `Unarchive failed`, { safe: { conversationId }, sensitive: { conversationId, error } }); throw error; }
  await call<Promise<unknown>>(context.loadUnarchivedThread, `call`, undefined, conversationId); if (!mapLike(context.conversations).has(conversationId)) throw new UnarchivedConversationLoadError(conversationId);
  call<Promise<unknown>>(context.broadcastThreadUnarchived, `call`, undefined, { hostId: context.hostId, conversationId })?.catch((error) => call(context.logger, `warning`, `Failed to broadcast unarchived thread`, { safe: { conversationId }, sensitive: { error } }));
  if (!context.useAppServerPins) { const key = `${String(context.hostId)}:${conversationId}`; const placements = mapLike(context.archivedPinnedThreadPlacements); const placement = record(placements.get(key)); placements.delete(key); if (restorePin && Number(placement.expiresAt ?? 0) >= Date.now()) try { await call<Promise<unknown>>(context.setThreadPinned, `call`, undefined, { threadId: conversationId, pinned: true, beforeThreadId: placement.beforeThreadId }); } catch {} }
}

export async function performArchiveConversation(input: unknown, conversationId: string, cwd: string, options: UnknownRecord) {
  const context = record(input); call(context.logger, `info`, `Archive requested`, { safe: { source: options.source }, sensitive: { conversationId } }); const wasSuppressed = call<boolean>(context.isConversationSuppressedAfterArchive, `call`, undefined, conversationId); const key = `${String(context.hostId)}:${conversationId}`; const placements = mapLike(context.archivedPinnedThreadPlacements); placements.delete(key); let beforeThreadId: unknown;
  if (!context.useAppServerPins) try { const ids = await call<Promise<string[]>>(context.getPinnedThreadIds, `call`); const index = ids.indexOf(conversationId); if (index !== -1) beforeThreadId = ids[index + 1] ?? null; } catch {}
  let inactiveArchive = false; let cleanupWorktree = options.cleanupWorktree !== false; if (cleanupWorktree) try { cleanupWorktree = await call<Promise<boolean>>(context.getManagedWorktreeCleanup, `call`, undefined, cwd); } catch {}
  call(context.addSuppressedArchivedConversationId, `call`, undefined, conversationId); setLike(context.archivingConversationIds).add(conversationId);
  try {
    setLike(context.pendingThreadArchives).add(conversationId, { cwd, cleanupWorktree });
    try { await call<Promise<unknown>>(context.archiveThread, `call`, undefined, conversationId); } catch (error) {
      if (!isNoRolloutError(error, conversationId)) { if (!wasSuppressed) call(context.deleteSuppressedArchivedConversationId, `call`, undefined, conversationId); throw error; }
      let result: UnknownRecord; try { result = record(await call<Promise<unknown>>(context.archiveInactiveThread, `call`, undefined, conversationId, true, options.source === `realtime_voice_provisional`)); if (result.success !== true) throw Error(`Inactive thread archive did not persist`); } catch (nested) { if (!wasSuppressed) call(context.deleteSuppressedArchivedConversationId, `call`, undefined, conversationId); call(context.logger, `warning`, `Failed to persist inactive thread archive`, { safe: { conversationId }, sensitive: { error: nested } }); throw nested; }
      inactiveArchive = true; if (result.threadMissing === true) await Promise.allSettled([call<Promise<unknown>>(context.projectlessState, `removeConversation`, conversationId), Promise.resolve(call(context.storage, `writeValue`, capabilityKey(conversationId), undefined))]);
    }
    if (!context.useAppServerPins) try { await call<Promise<unknown>>(context.setThreadPinned, `call`, undefined, { threadId: conversationId, pinned: false }); if (beforeThreadId !== undefined) placements.set(key, { beforeThreadId, expiresAt: Date.now() + Number(context.archiveUndoDurationMs ?? 0) }); } catch {}
    call(context.removeConversationFromCache, `call`, undefined, conversationId); call<Promise<unknown>>(context.broadcastThreadArchived, `call`, undefined, { hostId: context.hostId, conversationId, cwd })?.catch((error) => call(context.logger, `warning`, `Failed to broadcast archived thread`, { safe: { conversationId }, sensitive: { error } })); if (inactiveArchive) call(context.emitThreadArchived, `call`, undefined, conversationId);
  } finally { setLike(context.archivingConversationIds).delete(conversationId); }
}

function conversationCwd(value: unknown): string { const conversation = record(value); if (typeof conversation.cwd === `string` && conversation.cwd) return conversation.cwd; const turns = Array.isArray(conversation.turns) ? conversation.turns : []; for (let index = turns.length - 1; index >= 0; index -= 1) { const cwd = record(record(turns[index]).params).cwd; if (typeof cwd === `string` && cwd) return cwd; } return `/`; }
function errorMessage(error: unknown): string | null { if (error instanceof Error) return error.message; const direct = errorBodySchema.safeParse(error); if (direct.success) return direct.data.message; const nested = errorResponseSchema.safeParse(error); return nested.success ? nested.data.error.message : null; }
function isNoRolloutError(error: unknown, conversationId: string) { return errorMessage(error)?.includes(`no rollout found for thread id ${conversationId}`) ?? false; }

export { archiveContextFactory as ab, archiveConversation as ub, unarchiveConversation as db, performArchiveConversation as fb, deleteArchivedConversation as ob };
