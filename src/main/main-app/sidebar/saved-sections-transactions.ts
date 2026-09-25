// 已保存自定义分区：事务边界（SectionTransition）。
//
// 对应 main-C-Mhak1n.ts 94,235-94,503：
//   - tBe SectionTransition：14 个私有字段的事务边界——listSections/
//     listSectionThreadIds/createSection/updateSection/deleteSection/
//     setThreadSection/saveReplica/completeMigration 的事务语义：
//     · 创建预留（reserveCreation 冲突拒绝）+ movedThread 记录 + 失败回滚
//       （discardCreatedSection）
//     · replica 冲突判定（hostSectionIds 比对 + 名称匹配回退）
//     · completeMigration 的全段就绪校验（boundThreadIds 归属检查）
//     · Symbol.dispose 时清理未完成的创建
//   - 与 undo/redo 栈的交互：构造参数由 SectionUndoRedoStack#y 提供
import { randomUUID } from "node:crypto";
import { Uf as EventEmitterBase } from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import {
  type SectionStateSource,
  type SectionOperationContext,
  type SectionScope,
  type SavedSectionsState,
  type SavedSection,
  PINNED_SECTION_UUID,
  diffSectionScope,
  snapshotMatches,
  snapshotFor,
  clampToScope,
  applyScopeToState,
  applyReplicaState,
  threadIdOfItemKey,
  reconcileHostSections,
  reconcileSectionMembers,
} from "./saved-sections-state";

const logger = memoizedTaggedLogger("saved-custom-sections");

interface PendingCreation {
  hostId: string;
  logicalSectionId: string;
  pending: boolean;
  release(): void;
  replicaId?: string;
  movedThread?: { threadId: string; previousSectionId: string | null };
}

export interface SectionTransitionScope extends SectionScope {
  // scope 即差分描述（sections/collections/structure）。
}

/**
 * 分区事务边界（原 `tBe`）。
 *
 * 一次事务内的所有 server 调用共享同一个 assertCurrent（#v）；
 * 创建走预留（防并发同逻辑段双建），失败或 dispose 时回滚。
 */
export class SectionTransition extends (EventEmitterBase as new () => {}) {
  #logger = logger;
  #source: SectionStateSource;
  #enqueueMutation: <T>(operation: () => Promise<T>) => Promise<T>;
  #enqueueRead: <T>(operation: () => Promise<T>) => Promise<T>;
  #scope: SectionTransitionScope;
  #threadHostIds: Record<string, string>;
  #movedItemKey: string | undefined;
  #assertNotReleased: () => void;
  #saveReplicaImpl: (sectionId: string, hostId: string, replicaId: string) => Promise<"applied" | "unchanged" | "conflict">;
  #migrationHostId: string | undefined;
  #completeMigrationImpl: (hostId: string, operationId: string) => Promise<"applied" | "conflict" | "unchanged">;
  #createdReplicasByHost = new Map<string, Map<string, string>>();
  #pendingCreations = new Set<PendingCreation>();
  #released = false;
  #lastListing: { hostIds: string[]; sections: Array<{ hostId: string; id: string; name: string }> } | undefined;
  #hostListing: { hostIds: string[]; sections: Array<{ hostId: string; id: string; name: string }> } | undefined;
  #sectionThreadIds = new Map<string, Set<string>>();

  constructor(
    source: SectionStateSource,
    enqueueMutation: <T>(operation: () => Promise<T>) => Promise<T>,
    enqueueRead: <T>(operation: () => Promise<T>) => Promise<T>,
    scope: SectionTransitionScope,
    threadHostIds: Record<string, string>,
    movedItemKey: string | undefined,
    assertNotReleased: () => void,
    saveReplicaImpl: (sectionId: string, hostId: string, replicaId: string) => Promise<"applied" | "unchanged" | "conflict">,
    migrationHostId: string | undefined,
    completeMigrationImpl: (hostId: string, operationId: string) => Promise<"applied" | "conflict" | "unchanged">,
  ) {
    super();
    this.#source = source;
    this.#enqueueMutation = enqueueMutation;
    this.#enqueueRead = enqueueRead;
    this.#scope = scope;
    this.#threadHostIds = threadHostIds;
    this.#movedItemKey = movedItemKey;
    this.#assertNotReleased = assertNotReleased;
    this.#saveReplicaImpl = saveReplicaImpl;
    this.#migrationHostId = migrationHostId;
    this.#completeMigrationImpl = completeMigrationImpl;
  }

  async listSections(options: { hostId?: string } = {}) {
    return this.#enqueueRead(async () => {
      const listing = await this.#source.server.listSections(options, this.#operationContext());
      this.#assertActive();
      for (const hostId of listing.hostIds) this.#source.getConnection(hostId);
      if (options.hostId != null) this.#source.getConnection(options.hostId);
      if (this.#migrationHostId != null && listing.hostIds.includes(this.#migrationHostId)) this.#hostListing = listing;
      if (options.hostId === this.#migrationHostId) {
        this.#lastListing = listing;
        this.#sectionThreadIds.clear();
      }
      return listing;
    });
  }

  async listSectionThreadIds({ hostId, sectionId }: { hostId: string; sectionId: string }) {
    if (!this.#lastListing?.sections.some(({ hostId: sectionHost, id }) => sectionHost === hostId && id === sectionId))
      this.#assertReplicaInScope(hostId, sectionId);
    const before = this.#lastListing;
    const threadIds = await this.#source.server.listSectionThreadIds({ hostId, sectionId }, this.#operationContext());
    this.#assertActive();
    this.#source.getConnection(hostId);
    if (before === this.#lastListing) this.#sectionThreadIds.set(sectionId, new Set(threadIds));
    return threadIds;
  }

  /** 建段（原 `createSection`）：预留 + movedThread 记录 + 失败回滚。 */
  async createSection(request: { hostId: string; logicalSectionId: string; name: string; threadIdToMove: string | null; previousSectionId: string | null }) {
    this.#assertActive();
    this.#lastListing = undefined;
    if (!this.#scope.sections.some(({ id }) => id === request.logicalSectionId))
      throw new Error("Section is outside this transition");
    this.#assertThreadInScope(request.hostId, request.threadIdToMove, request.logicalSectionId);
    if ([...(this.#createdReplicasByHost.get(request.hostId)?.values() ?? [])].includes(request.logicalSectionId))
      throw new DOMException("Section was already created in this transition", "AbortError");
    const release = this.#source.reserveCreation(request.hostId, request.logicalSectionId);
    if (release == null)
      throw new DOMException("Section creation conflicts with another operation", "AbortError");
    const pending: PendingCreation = { hostId: request.hostId, logicalSectionId: request.logicalSectionId, pending: true, release };
    this.#pendingCreations.add(pending);
    try {
      const section = await this.#source.server.createSection(request, this.#operationContext(), (moved) => {
        pending.movedThread = moved;
      });
      pending.replicaId = section.id;
      this.#assertActive();
      this.#source.getConnection(request.hostId);
      const replicas = this.#createdReplicasByHost.get(request.hostId) ?? new Map();
      replicas.set(section.id, request.logicalSectionId);
      this.#createdReplicasByHost.set(request.hostId, replicas);
      return section;
    } catch (error) {
      throw (await this.#discardCreation(pending), error);
    } finally {
      pending.pending = false;
    }
  }

  async updateSection(request: { hostId: string; sectionId: string; name: string }) {
    return this.#enqueueMutation(async () => {
      this.#lastListing = undefined;
      this.#assertReplicaInScope(request.hostId, request.sectionId);
      await this.#source.server.updateSection(request, this.#operationContext());
      await this.#source.onServerChanged(request.hostId, () => this.#assertActive());
    });
  }

  async deleteSection(request: { hostId: string; sectionId: string }) {
    return this.#enqueueMutation(async () => {
      this.#lastListing = undefined;
      this.#assertReplicaInScope(request.hostId, request.sectionId);
      await this.#source.server.deleteSection(request, this.#operationContext());
      await this.#source.onServerChanged(request.hostId, () => this.#assertActive());
    });
  }

  async setThreadSection(request: { hostId: string; threadId: string; sectionId: string | null; beforeThreadId: string | null; previousSectionId?: string }) {
    return this.#enqueueMutation(async () => {
      this.#lastListing = undefined;
      this.#assertThreadInScope(
        request.hostId,
        request.threadId,
        request.sectionId == null
          ? undefined
          : (this.#createdReplicasByHost.get(request.hostId)?.get(request.sectionId) ??
              this.#scope.sections.find(
                ({ before, after }) =>
                  before?.hostSectionIds?.[request.hostId] === request.sectionId ||
                  after?.hostSectionIds?.[request.hostId] === request.sectionId,
              )?.id),
      );
      if (request.sectionId != null && request.sectionId !== PINNED_SECTION_UUID)
        this.#assertReplicaInScope(request.hostId, request.sectionId);
      const changed = await this.#source.server.setThreadSection(request, this.#operationContext());
      if (changed)
        await this.#source.onServerChanged(request.hostId, () => this.#assertActive(), {
          hostId: request.hostId,
          threadId: request.threadId,
          sectionId: request.sectionId as string,
          previousSectionId: request.previousSectionId,
        });
      return { success: changed };
    });
  }

  /** replica 保存（原 `saveReplica`）：冲突判定 + 预留释放/回滚。 */
  async saveReplica({ sectionId, hostId, replicaId }: { sectionId: string; hostId: string; replicaId: string }): Promise<"applied" | "unchanged" | "conflict"> {
    this.#assertActive();
    if (
      this.#createdReplicasByHost.get(hostId)?.get(replicaId) !== sectionId &&
      !this.#scope.sections.some(
        ({ id, before, after }) =>
          id === sectionId &&
          (before?.hostSectionIds?.[hostId] === replicaId ||
            after?.hostSectionIds?.[hostId] === replicaId ||
            (hostId === this.#migrationHostId &&
              this.#hostListing?.sections.some((section) => section.hostId === hostId && section.id === replicaId && section.name === after?.name) &&
              !this.#source.read().sections.some((section) => section.id !== sectionId && section.hostSectionIds?.[hostId] === replicaId))),
      )
    )
      return "conflict";
    if (this.#createdReplicasByHost.get(hostId)?.get(replicaId) !== sectionId) {
      const existingReplica = this.#source.read().sections.find(({ id }) => id === sectionId)?.hostSectionIds?.[hostId];
      if (existingReplica != null && existingReplica !== replicaId) return "conflict";
    }
    try {
      const result = await this.#saveReplicaImpl(sectionId, hostId, replicaId);
      const pending = [...this.#pendingCreations].find(
        (entry) => entry.hostId === hostId && entry.logicalSectionId === sectionId && entry.replicaId === replicaId,
      );
      if (pending != null) {
        if (result === "applied" || result === "unchanged") {
          this.#pendingCreations.delete(pending);
          pending.release();
          if (pending.movedThread != null)
            await this.#source.onServerChanged(hostId, () => this.#assertActive(), {
              hostId,
              threadId: pending.movedThread!.threadId,
              sectionId: replicaId,
              previousSectionId: pending.movedThread!.previousSectionId ?? undefined,
            });
          await this.#source.onServerChanged(hostId, () => this.#assertActive());
        } else {
          await this.#discardCreation(pending);
        }
      }
      return result;
    } catch (error) {
      const pending = [...this.#pendingCreations].find((entry) => entry.hostId === hostId && entry.replicaId === replicaId);
      if (pending != null) await this.#discardCreation(pending);
      throw error;
    }
  }

  /** 迁移完成（原 `completeMigration`）：全段就绪 + 归属校验。 */
  async completeMigration({ hostId, operationId }: { hostId: string; operationId: string }): Promise<"applied" | "conflict" | "unchanged"> {
    return this.#enqueueRead(async () => {
      this.#assertActive();
      if (
        hostId !== this.#migrationHostId ||
        this.#pendingCreations.size > 0 ||
        !this.#lastListing?.hostIds.includes(hostId) ||
        !this.#lastListing.sections.every(({ id }) => this.#sectionThreadIds.has(id))
      )
        return "conflict";
      const current = this.#source.read();
      const conflicted = this.#scope.sections.some(({ id, before }) => {
        const unboundThreadIds = (before?.itemKeys ?? []).flatMap((itemKey) => {
          const threadId = itemKey.startsWith("codex:thread:local:") ? itemKey.slice(19) : null;
          return threadId == null || threadIdOfItemKey(itemKey) == null ? [] : [threadId];
        });
        if (unboundThreadIds.length > 0 && unboundThreadIds.every((threadId) => this.#threadHostIds[threadId] != null && this.#threadHostIds[threadId] !== hostId))
          return false;
        const replicaId = current.sections.find((section) => section.id === id)?.hostSectionIds?.[hostId];
        if (replicaId == null || !this.#lastListing?.sections.some((section) => section.hostId === hostId && section.id === replicaId))
          return true;
        const members = this.#sectionThreadIds.get(replicaId);
        return unboundThreadIds.some(
          (threadId) => (this.#threadHostIds[threadId] == null || this.#threadHostIds[threadId] === hostId) && !members?.has(threadId),
        );
      });
      return conflicted ? "conflict" : this.#completeMigrationImpl(hostId, operationId);
    });
  }

  [Symbol.dispose]() {
    this.#released = true;
    for (const pending of this.#pendingCreations)
      if (!pending.pending)
        void this.#discardCreation(pending).catch((error) => {
          if (!(error instanceof Error && error.name === "AbortError"))
            this.#logger().warning("Failed to clean up a retired section creation", {
              safe: {},
              sensitive: { error },
            });
        });
    this.#createdReplicasByHost.clear();
    this.#lastListing = undefined;
    this.#hostListing = undefined;
    this.#sectionThreadIds.clear();
  }

  async #discardCreation(pending: PendingCreation) {
    pending.pending = true;
    try {
      if (pending.replicaId != null)
        await this.#source.server.discardCreatedSection(pending.hostId, pending.replicaId, this.#operationContext(), pending.movedThread);
    } finally {
      this.#pendingCreations.delete(pending);
      pending.release();
    }
  }

  #assertActive() {
    if (this.#released) throw new DOMException("Section transition released", "AbortError");
    this.#assertNotReleased();
  }

  #assertReplicaInScope(hostId: string, replicaId: string) {
    this.#assertActive();
    if (
      !this.#createdReplicasByHost.get(hostId)?.has(replicaId) &&
      !this.#scope.sections.some(
        ({ before, after }) => before?.hostSectionIds?.[hostId] === replicaId || after?.hostSectionIds?.[hostId] === replicaId,
      )
    )
      throw new Error("Replica is outside this transition");
  }

  #assertThreadInScope(hostId: string, threadId: string | null, logicalSectionId: string | undefined) {
    this.#assertActive();
    const itemKey = `codex:thread:local:${threadId}`;
    if (
      (threadId != null && this.#threadHostIds[threadId] != null && this.#threadHostIds[threadId] !== hostId) ||
      (threadId != null &&
        itemKey !== this.#movedItemKey &&
        !this.#scope.sections.some(
          ({ id, before, after }) =>
            (this.#migrationHostId == null || id === logicalSectionId) &&
            [...(before?.itemKeys ?? []), ...(after?.itemKeys ?? [])].includes(itemKey),
        ))
    )
      throw new Error("Thread is outside this transition");
  }

  #operationContext(): SectionOperationContext {
    return {
      getConnection: (hostId) => {
        if (this.#migrationHostId != null && hostId !== this.#migrationHostId)
          throw new Error("Host is outside this migration");
        return this.#source.getConnection(hostId);
      },
      assertCurrent: () => this.#assertActive(),
      assertSourceCurrent: () => {
        if (!this.#source.isSourceCurrent())
          throw new DOMException("Section source retired", "AbortError");
      },
      canDeleteCreatedReplica: (hostId, replicaId) =>
        !this.#source.read().sections.some((section) => section.hostSectionIds?.[hostId] === replicaId),
    };
  }
}
