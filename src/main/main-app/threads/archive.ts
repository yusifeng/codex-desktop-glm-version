// Thread archive/unarchive lifecycle.
//
// 原版 main-C-Mhak1n.ts 41,278-41,455。该 owner 保留远端 inactive archive
// fallback、pin placement undo、worktree cleanup admission、thread-missing metadata
// 清理和 broadcast/cache 副作用顺序；AppServerConversationManager 只负责装配依赖。

import {
  Cs as isDurableHost,
  Of as zString,
  Za as isPathWithin,
  Wu as versionSupportsFeature,
  wf as zObject,
} from "@chunk/shared";
import { conversationTurns } from "../turns/canonical-history";
import { H_ as subAgentMetadata } from "./projection";
import { threadReferenceCapabilityKey } from "./reference-capability";

type UnknownRecord = Record<string, any>;

export interface ArchiveContext {
  hostId: string;
  logger: any;
  archiveUndoDurationMs: number;
  useAppServerPins: boolean;
  isElectronWindow(): boolean;
  isEphemeralConversation(conversationId: string): boolean;
  discardConversationFromCache(conversationId: string): Promise<void> | void;
  getThreadSummary(conversationId: string): any;
  beforeArchiveConversation(conversationId: string, conversation: any): Promise<void>;
  conversations: Map<string, any>;
  projectlessState: any;
  storage: any;
  threadsById: Map<string, any>;
  archivingConversationIds: Set<string>;
  archivedPinnedThreadPlacements: Map<string, any>;
  isConversationSuppressedAfterArchive(conversationId: string): boolean;
  addSuppressedArchivedConversationId(conversationId: string): void;
  deleteSuppressedArchivedConversationId(conversationId: string): void;
  listActiveThreads(): Promise<any[]>;
  readThread(conversationId: string): Promise<any>;
  archiveInactiveThread(
    conversationId: string,
    removeCatalogEntryIfMissing: boolean,
    discardProvisionalThread: boolean,
  ): Promise<{ success: boolean; threadMissing?: boolean }>;
  archiveThread(conversationId: string): Promise<void>;
  unarchiveThread(conversationId: string): Promise<void>;
  broadcastThreadArchived(payload: any): Promise<void>;
  broadcastThreadUnarchived(payload: any): Promise<void>;
  loadUnarchivedThread(conversationId: string): Promise<void>;
  prepareOwnedThreadForUnarchive(conversationId: string): Promise<void>;
  removeConversationFromCache(conversationId: string): void;
  emitThreadArchived(conversationId: string): void;
  pendingThreadArchives: {
    add(conversationId: string, value: { cwd: string; cleanupWorktree: boolean }): void;
    remove(conversationId: string): void;
  };
  getPinnedThreadIds(): Promise<string[]>;
  setThreadPinned(value: { threadId: string; pinned: boolean; beforeThreadId?: string | null }): Promise<void>;
  getManagedWorktreeCleanup(cwd: string): Promise<boolean>;
}

interface ArchiveContextFactoryInput {
  useAppServerPins: boolean;
  appServerVersion: string | null | undefined;
  threadStore: any;
  projectlessState: any;
  storage: any;
  archivingConversationIds: Set<string>;
  archivedPinnedThreadPlacements: ArchiveContext["archivedPinnedThreadPlacements"];
  runtime: any;
  isLocalHost(hostId: string): boolean;
  worktreeRoots: {
    getManagedWorktreeRoots(): Promise<string[]>;
    getConfiguredWorktreeRoot(): Promise<string>;
  };
  pendingThreadArchives: ArchiveContext["pendingThreadArchives"];
  ipcBridge: any;
  inactiveThreadUnsubscriber: any;
  manager: any;
  events: any;
  conversationCacheEvictor: any;
}

export class UnarchivedConversationLoadError extends Error {
  constructor(conversationId: string) {
    super(`Unarchived conversation ${conversationId} could not be loaded`);
    this.name = `UnarchivedConversationLoadError`;
  }
}

export const errorBodySchema = zObject({ message: zString() }).loose();
export const errorResponseSchema = zObject({ error: errorBodySchema }).loose();

/** 从 manager 装配 archive 生命周期所需的最小宿主面（原版 ab）。 */
export function archiveContextFactory(input: ArchiveContextFactoryInput): ArchiveContext {
  let { manager, runtime, threadStore } = input;
  let hostId = manager.getHostId();
  let listActiveThreads = () => threadStore.listAllThreads({ modelProviders: null });
  return {
    hostId,
    logger: manager.logger,
    archiveUndoDurationMs: runtime.archiveUndoDurationMs,
    useAppServerPins: input.useAppServerPins,
    isElectronWindow: () => runtime.hasDesktopRuntime,
    isEphemeralConversation: threadStore.isEphemeralConversation.bind(threadStore),
    discardConversationFromCache: (conversationId) => manager.discardConversationFromCache(conversationId),
    getThreadSummary: threadStore.getThreadSummary.bind(threadStore),
    async beforeArchiveConversation() {},
    conversations: threadStore.conversations,
    projectlessState: input.projectlessState,
    storage: input.storage,
    threadsById: threadStore.threadsById,
    archivingConversationIds: input.archivingConversationIds,
    archivedPinnedThreadPlacements: input.archivedPinnedThreadPlacements,
    isConversationSuppressedAfterArchive: threadStore.isConversationSuppressed.bind(threadStore),
    addSuppressedArchivedConversationId: threadStore.suppressArchivedConversation.bind(threadStore),
    deleteSuppressedArchivedConversationId: threadStore.unsuppressArchivedConversation.bind(threadStore),
    listActiveThreads,
    readThread: (conversationId) => manager.readThread(conversationId, { includeTurns: false }),
    async archiveInactiveThread(conversationId, removeCatalogEntryIfMissing, discardProvisionalThread) {
      let inactiveArchive = runtime.inactiveThreadArchive;
      if (inactiveArchive == null) return { success: false };
      if (input.isLocalHost(hostId))
        return inactiveArchive.archiveInactiveThread({
          hostId,
          threadId: conversationId,
          removeCatalogEntryIfMissing,
          discardProvisionalThread,
        });
      if ((await listActiveThreads()).some((thread: any) => thread.id === conversationId))
        return { success: false };
      return { success: await inactiveArchive.removeMissingEntry({ hostId, threadId: conversationId }) };
    },
    archiveThread: (conversationId) => manager.sendRequest(`thread/archive`, { threadId: conversationId }),
    unarchiveThread: (conversationId) => manager.sendRequest(`thread/unarchive`, { threadId: conversationId }),
    broadcastThreadArchived: (payload) => input.ipcBridge?.threadArchived?.(payload) ?? Promise.resolve(),
    broadcastThreadUnarchived: (payload) => input.ipcBridge?.threadUnarchived?.(payload) ?? Promise.resolve(),
    loadUnarchivedThread: (conversationId) => manager.hydrateBackgroundThreads([conversationId]),
    async prepareOwnedThreadForUnarchive(conversationId) {
      if (manager.getStreamRole(conversationId)?.role !== `owner`) return;
      await manager.sendRequest(`thread/unsubscribe`, { threadId: conversationId });
      input.inactiveThreadUnsubscriber.clearConversationStreamOwnership(conversationId);
    },
    removeConversationFromCache: (conversationId) =>
      input.conversationCacheEvictor.evictConversation(conversationId, { reason: `archive` }),
    emitThreadArchived: (conversationId) => input.events.emitThreadArchived(conversationId),
    pendingThreadArchives: input.pendingThreadArchives,
    async getPinnedThreadIds() {
      let pinnedThreads = await runtime.pinnedThreads();
      return pinnedThreads == null ? [] : (await pinnedThreads.list(void 0)).threadIds;
    },
    async setThreadPinned(value) {
      await (await runtime.pinnedThreads())?.set(value);
    },
    async getManagedWorktreeCleanup(cwd) {
      if (
        runtime.hasDesktopRuntime &&
        !isDurableHost(hostId) &&
        versionSupportsFeature(input.appServerVersion, `threadAttachments`)
      )
        return true;
      let isManaged = (await input.worktreeRoots.getManagedWorktreeRoots()).some((root) =>
        isPathWithin({ worktreesRoot: root, cwd }),
      );
      if (!isManaged && input.isLocalHost(hostId)) {
        let configuredRoot = await input.worktreeRoots.getConfiguredWorktreeRoot();
        isManaged = isPathWithin({ worktreesRoot: configuredRoot, cwd });
      }
      return isManaged;
    },
  };
}

export async function deleteArchivedConversation(
  input: { runtime: any; hostId: string; handleThreadDeletion(value: unknown): void },
  conversationId?: string,
) {
  let deleted = await input.runtime.deleteArchivedThreads(input.hostId, conversationId);
  input.handleThreadDeletion(deleted);
  return deleted;
}

/** 归档入口（原版 ub）：补齐 cwd 后交给 performArchiveConversation。 */
export async function archiveConversation(
  context: ArchiveContext,
  conversationId: string,
  options: UnknownRecord,
): Promise<void> {
  if (context.isEphemeralConversation(conversationId)) {
    await context.discardConversationFromCache(conversationId);
    return;
  }
  let summary = context.getThreadSummary(conversationId);
  let conversation = context.conversations.get(conversationId);
  await context.beforeArchiveConversation(conversationId, conversation ?? summary);
  conversation = context.conversations.get(conversationId);
  if (conversation == null) {
    if (summary == null && !context.isElectronWindow()) return;
    await performArchiveConversation(context, conversationId, summary?.cwd ?? `/`, {
      ...options,
      cleanupWorktree: summary != null && options.cleanupWorktree,
    });
    return;
  }
  let cwd = context.threadsById.get(conversationId)?.cwd || conversationCwd(conversation);
  if (cwd === `/` && options.cleanupWorktree !== false && subAgentMetadata(conversation.source) == null)
    try {
      cwd = (await context.readThread(conversationId)).thread.cwd || `/`;
    } catch (error) {
      context.logger.warning(`Failed to recover archive worktree directory`, {
        safe: { conversationId },
        sensitive: { error },
      });
    }
  await performArchiveConversation(context, conversationId, cwd, {
    useAppServerPins: options.useAppServerPins,
    cleanupWorktree:
      options.cleanupWorktree !== false && cwd !== `/` && subAgentMetadata(conversation.source) == null,
    source: options.source,
  });
}

/** 取消归档（原版 db）：恢复流 ownership、快照和旧 pin placement。 */
export async function unarchiveConversation(
  context: ArchiveContext,
  conversationId: string,
  restorePin = false,
): Promise<void> {
  await context.prepareOwnedThreadForUnarchive(conversationId);
  context.pendingThreadArchives.remove(conversationId);
  context.logger.info(`Unarchive requested`, { safe: { conversationId }, sensitive: {} });
  try {
    await context.unarchiveThread(conversationId);
    context.logger.info(`Unarchive succeeded`, { safe: { conversationId }, sensitive: {} });
  } catch (error) {
    context.logger.error(`Unarchive failed`, {
      safe: { conversationId },
      sensitive: { conversationId, error },
    });
    throw error;
  }
  await context.loadUnarchivedThread(conversationId);
  if (!context.conversations.has(conversationId))
    throw new UnarchivedConversationLoadError(conversationId);
  context.broadcastThreadUnarchived({ hostId: context.hostId, conversationId }).catch((error) => {
    context.logger.warning(`Failed to broadcast unarchived thread`, {
      safe: { conversationId },
      sensitive: { error },
    });
  });
  if (context.useAppServerPins) return;
  let placementKey = `${context.hostId}:${conversationId}`;
  let placement = context.archivedPinnedThreadPlacements.get(placementKey);
  context.archivedPinnedThreadPlacements.delete(placementKey);
  if (restorePin && placement != null && placement.expiresAt >= Date.now())
    try {
      await context.setThreadPinned({
        threadId: conversationId,
        pinned: true,
        beforeThreadId: placement.beforeThreadId,
      });
    } catch {}
}

/** 归档核心（原版 fb）。副作用顺序是持久化 → pin → cache/broadcast。 */
export async function performArchiveConversation(
  context: ArchiveContext,
  conversationId: string,
  cwd: string,
  options: UnknownRecord,
): Promise<void> {
  context.logger.info(`Archive requested`, {
    safe: { source: options.source },
    sensitive: { conversationId },
  });
  let wasSuppressed = context.isConversationSuppressedAfterArchive(conversationId);
  let placementKey = `${context.hostId}:${conversationId}`;
  context.archivedPinnedThreadPlacements.delete(placementKey);
  let beforeThreadId: string | null | undefined;
  if (!context.useAppServerPins)
    try {
      let pinnedIds = await context.getPinnedThreadIds();
      let index = pinnedIds.indexOf(conversationId);
      if (index !== -1) beforeThreadId = pinnedIds[index + 1] ?? null;
    } catch {}
  let archivedInactive = false;
  let cleanupWorktree = options.cleanupWorktree !== false;
  if (cleanupWorktree)
    try {
      cleanupWorktree = await context.getManagedWorktreeCleanup(cwd);
    } catch {}
  context.addSuppressedArchivedConversationId(conversationId);
  context.archivingConversationIds.add(conversationId);
  try {
    context.pendingThreadArchives.add(conversationId, { cwd, cleanupWorktree });
    try {
      await context.archiveThread(conversationId);
    } catch (error) {
      if (!isNoRolloutError(error, conversationId)) {
        if (!wasSuppressed) context.deleteSuppressedArchivedConversationId(conversationId);
        throw error;
      }
      context.logger.info(`Archive skipped because thread has no active rollout`, {
        safe: { conversationId },
        sensitive: { error },
      });
      let inactiveResult: { success: boolean; threadMissing?: boolean };
      try {
        inactiveResult = await context.archiveInactiveThread(
          conversationId,
          true,
          options.source === `realtime_voice_provisional`,
        );
        if (!inactiveResult.success) throw Error(`Inactive thread archive did not persist`);
      } catch (nestedError) {
        if (!wasSuppressed) context.deleteSuppressedArchivedConversationId(conversationId);
        context.logger.warning(`Failed to persist inactive thread archive`, {
          safe: { conversationId },
          sensitive: { error: nestedError },
        });
        throw nestedError;
      }
      archivedInactive = true;
      if (inactiveResult.threadMissing === true) {
        let cleanupResults = await Promise.allSettled([
          context.projectlessState.removeConversation(conversationId),
          Promise.resolve(
            context.storage.writeValue(threadReferenceCapabilityKey(conversationId), void 0),
          ),
        ]);
        for (let result of cleanupResults)
          if (result.status === `rejected`)
            context.logger.warning(`Failed to clean up retired thread metadata`, {
              safe: { conversationId },
              sensitive: { error: result.reason },
            });
      }
    }
    if (!context.useAppServerPins)
      try {
        await context.setThreadPinned({ threadId: conversationId, pinned: false });
        if (beforeThreadId !== void 0)
          context.archivedPinnedThreadPlacements.set(placementKey, {
            beforeThreadId,
            expiresAt: Date.now() + context.archiveUndoDurationMs,
          });
      } catch {}
    context.removeConversationFromCache(conversationId);
    context
      .broadcastThreadArchived({ hostId: context.hostId, conversationId, cwd })
      .catch((error) => {
        context.logger.warning(`Failed to broadcast archived thread`, {
          safe: { conversationId },
          sensitive: { error },
        });
      });
    if (archivedInactive) context.emitThreadArchived(conversationId);
  } finally {
    context.archivingConversationIds.delete(conversationId);
  }
}

function conversationCwd(conversation: any): string {
  if (conversation.cwd) return conversation.cwd;
  let turns = conversationTurns(conversation);
  for (let index = turns.length - 1; index >= 0; --index) {
    let cwd = turns[index]?.params.cwd;
    if (cwd) return cwd;
  }
  return `/`;
}

function errorMessage(error: unknown): string | null {
  if (error instanceof Error) return error.message;
  let direct = errorBodySchema.safeParse(error);
  if (direct.success) return direct.data.message;
  let nested = errorResponseSchema.safeParse(error);
  return nested.success ? nested.data.error.message : null;
}

function isNoRolloutError(error: unknown, conversationId: string): boolean {
  return errorMessage(error)?.includes(`no rollout found for thread id ${conversationId}`) ?? false;
}

export {
  archiveContextFactory as ab,
  archiveConversation as ub,
  unarchiveConversation as db,
  performArchiveConversation as fb,
  deleteArchivedConversation as ob,
};
