// @ts-nocheck

const PINNED_SECTION_ID = "01984de2-8f74-7c91-a3b2-5c5e937cf318";
const LOCAL_THREAD_PREFIX = "codex:thread:local:";

/** Owns one saved-section undo/redo transition and its temporary server replicas. */
export function createSavedSectionTransitionClass(dependencies: Record<string, any>) {
  const { RpcHandlerBase, createLogger, isInternalThreadId } = dependencies;

  return class SavedSectionTransition extends RpcHandlerBase {
    #logger = createLogger("saved-custom-sections");
    #source;
    #enqueueMutation;
    #enqueueListOperation;
    #affectedState;
    #threadHostIds;
    #transitionItemKey;
    #assertTransitionCurrent;
    #saveReplicaToState;
    #replicasByHost = new Map();
    #pendingCreations = new Set();
    #disposed = false;
    #migrationHostId;
    #completeMigrationInState;
    #migrationHostSnapshot;
    #allHostsSnapshot;
    #migrationSectionThreadIds = new Map();

    constructor(
      source: any,
      enqueueMutation: any,
      enqueueListOperation: any,
      affectedState: any,
      threadHostIds: any,
      transitionItemKey: any,
      assertTransitionCurrent: any,
      saveReplicaToState: any,
      migrationHostId: any,
      completeMigrationInState: any,
    ) {
      super();
      this.#source = source;
      this.#enqueueMutation = enqueueMutation;
      this.#enqueueListOperation = enqueueListOperation;
      this.#affectedState = affectedState;
      this.#threadHostIds = threadHostIds;
      this.#transitionItemKey = transitionItemKey;
      this.#assertTransitionCurrent = assertTransitionCurrent;
      this.#saveReplicaToState = saveReplicaToState;
      this.#migrationHostId = migrationHostId;
      this.#completeMigrationInState = completeMigrationInState;
    }

    async listSections(options: Record<string, any> = {}) {
      return this.#enqueueListOperation(async () => {
        const snapshot = await this.#source.server.listSections(options, this.#serverContext());
        this.#assertCurrent();
        for (const hostId of snapshot.hostIds) this.#source.getConnection(hostId);
        if (
          this.#migrationHostId != null &&
          snapshot.hostIds.includes(this.#migrationHostId)
        ) {
          this.#allHostsSnapshot = snapshot;
        }
        if (options.hostId === this.#migrationHostId) {
          this.#migrationHostSnapshot = snapshot;
          this.#migrationSectionThreadIds.clear();
        }
        return snapshot;
      });
    }

    async listSectionThreadIds(request: any) {
      if (
        !this.#migrationHostSnapshot?.sections.some(
          ({ hostId, id }: any) => hostId === request.hostId && id === request.sectionId,
        )
      ) {
        this.#assertReplicaInTransition(request.hostId, request.sectionId);
      }
      const expectedSnapshot = this.#migrationHostSnapshot;
      const threadIds = await this.#source.server.listSectionThreadIds(
        request,
        this.#serverContext(),
      );
      this.#assertCurrent();
      this.#source.getConnection(request.hostId);
      if (expectedSnapshot === this.#migrationHostSnapshot) {
        this.#migrationSectionThreadIds.set(request.sectionId, new Set(threadIds));
      }
      return threadIds;
    }

    async createSection(request: any) {
      this.#assertCurrent();
      this.#migrationHostSnapshot = undefined;
      if (!this.#affectedState.sections.some(({ id }: any) => id === request.logicalSectionId)) {
        throw Error("Section is outside this transition");
      }
      if (request.threadIdToMove != null) {
        this.#assertThreadInTransition(
          request.hostId,
          request.threadIdToMove,
          request.logicalSectionId,
        );
      }
      if (
        [...(this.#replicasByHost.get(request.hostId)?.values() ?? [])].includes(
          request.logicalSectionId,
        )
      ) {
        throw new DOMException("Section was already created in this transition", "AbortError");
      }
      const release = this.#source.reserveCreation(request.hostId, request.logicalSectionId);
      if (release == null) {
        throw new DOMException("Section creation conflicts with another operation", "AbortError");
      }
      const creation: any = {
        hostId: request.hostId,
        logicalSectionId: request.logicalSectionId,
        pending: true,
        release,
      };
      this.#pendingCreations.add(creation);
      try {
        const replica = await this.#source.server.createSection(
          request,
          this.#serverContext(),
          (movedThread: any) => {
            creation.movedThread = movedThread;
          },
        );
        creation.replicaId = replica.id;
        this.#assertCurrent();
        this.#source.getConnection(request.hostId);
        const replicas = this.#replicasByHost.get(request.hostId) ?? new Map();
        replicas.set(replica.id, request.logicalSectionId);
        this.#replicasByHost.set(request.hostId, replicas);
        return replica;
      } catch (error) {
        await this.#discardCreation(creation);
        throw error;
      } finally {
        creation.pending = false;
      }
    }

    async updateSection(request: any) {
      return this.#enqueueMutation(async () => {
        this.#migrationHostSnapshot = undefined;
        this.#assertReplicaInTransition(request.hostId, request.sectionId);
        await this.#source.server.updateSection(request, this.#serverContext());
        await this.#source.onServerChanged(request.hostId, () => this.#assertCurrent());
      });
    }

    async deleteSection(request: any) {
      return this.#enqueueMutation(async () => {
        this.#migrationHostSnapshot = undefined;
        this.#assertReplicaInTransition(request.hostId, request.sectionId);
        await this.#source.server.deleteSection(request, this.#serverContext());
        await this.#source.onServerChanged(request.hostId, () => this.#assertCurrent());
      });
    }

    async setThreadSection(request: any) {
      return this.#enqueueMutation(async () => {
        this.#migrationHostSnapshot = undefined;
        this.#assertThreadInTransition(
          request.hostId,
          request.threadId,
          request.sectionId == null
            ? undefined
            : (this.#replicasByHost.get(request.hostId)?.get(request.sectionId) ??
                this.#affectedState.sections.find(
                  ({ before, after }: any) =>
                    before?.hostSectionIds?.[request.hostId] === request.sectionId ||
                    after?.hostSectionIds?.[request.hostId] === request.sectionId,
                )?.id),
        );
        if (request.sectionId != null && request.sectionId !== PINNED_SECTION_ID) {
          this.#assertReplicaInTransition(request.hostId, request.sectionId);
        }
        const success = await this.#source.server.setThreadSection(
          request,
          this.#serverContext(),
        );
        if (success) {
          await this.#source.onServerChanged(
            request.hostId,
            () => this.#assertCurrent(),
            request,
          );
        }
        return { success };
      });
    }

    async saveReplica({ sectionId, hostId, replicaId }: any) {
      this.#assertCurrent();
      if (
        this.#replicasByHost.get(hostId)?.get(replicaId) !== sectionId &&
        !this.#affectedState.sections.some(
          ({ id, before, after }: any) =>
            id === sectionId &&
            (before?.hostSectionIds?.[hostId] === replicaId ||
              after?.hostSectionIds?.[hostId] === replicaId ||
              (hostId === this.#migrationHostId &&
                this.#allHostsSnapshot?.sections.some(
                  (section: any) =>
                    section.hostId === hostId &&
                    section.id === replicaId &&
                    section.name === after?.name,
                ) &&
                !this.#source
                  .read()
                  .sections.some(
                    (section: any) =>
                      section.id !== sectionId &&
                      section.hostSectionIds?.[hostId] === replicaId,
                  )))
        )
      ) {
        return "conflict";
      }
      if (this.#replicasByHost.get(hostId)?.get(replicaId) !== sectionId) {
        const existingReplicaId = this.#source
          .read()
          .sections.find(({ id }: any) => id === sectionId)?.hostSectionIds?.[hostId];
        if (existingReplicaId != null && existingReplicaId !== replicaId) return "conflict";
      }
      try {
        const result = this.#saveReplicaToState(sectionId, hostId, replicaId);
        const creation: any = [...this.#pendingCreations].find(
          (candidate: any) =>
            candidate.hostId === hostId &&
            candidate.logicalSectionId === sectionId &&
            candidate.replicaId === replicaId,
        );
        if (creation != null) {
          if (result === "applied" || result === "unchanged") {
            this.#pendingCreations.delete(creation);
            creation.release();
            if (creation.movedThread != null) {
              await this.#source.onServerChanged(hostId, () => this.#assertCurrent(), {
                hostId,
                threadId: creation.movedThread.threadId,
                sectionId: replicaId,
                previousSectionId: creation.movedThread.previousSectionId ?? undefined,
              });
            }
            await this.#source.onServerChanged(hostId, () => this.#assertCurrent());
          } else {
            await this.#discardCreation(creation);
          }
        }
        return result;
      } catch (error) {
        const creation: any = [...this.#pendingCreations].find(
          (candidate: any) =>
            candidate.hostId === hostId && candidate.replicaId === replicaId,
        );
        if (creation != null) await this.#discardCreation(creation);
        throw error;
      }
    }

    async completeMigration({ hostId, operationId }: any) {
      return this.#enqueueListOperation(async () => {
        this.#assertCurrent();
        if (
          hostId !== this.#migrationHostId ||
          this.#pendingCreations.size > 0 ||
          !this.#migrationHostSnapshot?.hostIds.includes(hostId) ||
          !this.#migrationHostSnapshot.sections.every(({ id }: any) =>
            this.#migrationSectionThreadIds.has(id),
          )
        ) {
          return "conflict";
        }
        const currentState = this.#source.read();
        const hasConflict = this.#affectedState.sections.some(({ id, before }: any) => {
          const localThreadIds = (before?.itemKeys ?? []).flatMap((itemKey: string) => {
            const threadId = itemKey.startsWith(LOCAL_THREAD_PREFIX)
              ? itemKey.slice(LOCAL_THREAD_PREFIX.length)
              : null;
            return threadId == null || isInternalThreadId(threadId) ? [] : [threadId];
          });
          if (
            localThreadIds.length > 0 &&
            localThreadIds.every(
              (threadId: string) =>
                this.#threadHostIds[threadId] != null &&
                this.#threadHostIds[threadId] !== hostId,
            )
          ) {
            return false;
          }
          const replicaId = currentState.sections.find(
            (section: any) => section.id === id,
          )?.hostSectionIds?.[hostId];
          if (
            replicaId == null ||
            !this.#migrationHostSnapshot?.sections.some(
              (section: any) => section.hostId === hostId && section.id === replicaId,
            )
          ) {
            return true;
          }
          const migratedThreadIds = this.#migrationSectionThreadIds.get(replicaId);
          return localThreadIds.some(
            (threadId: string) =>
              (this.#threadHostIds[threadId] == null ||
                this.#threadHostIds[threadId] === hostId) &&
              !migratedThreadIds?.has(threadId),
          );
        });
        return hasConflict
          ? "conflict"
          : this.#completeMigrationInState(hostId, operationId);
      });
    }

    [Symbol.dispose]() {
      this.#disposed = true;
      for (const creation of this.#pendingCreations) {
        if (!creation.pending) {
          this.#discardCreation(creation).catch((error: unknown) => {
            if (!(error instanceof Error && error.name === "AbortError")) {
              this.#logger().warning("Failed to clean up a retired section creation", {
                safe: {},
                sensitive: { error },
              });
            }
          });
        }
      }
      this.#replicasByHost.clear();
      this.#migrationHostSnapshot = undefined;
      this.#allHostsSnapshot = undefined;
      this.#migrationSectionThreadIds.clear();
    }

    async #discardCreation(creation: any) {
      creation.pending = true;
      try {
        if (creation.replicaId != null) {
          await this.#source.server.discardCreatedSection(
            creation.hostId,
            creation.replicaId,
            this.#serverContext(),
            creation.movedThread,
          );
        }
      } finally {
        this.#pendingCreations.delete(creation);
        creation.release();
      }
    }

    #assertCurrent() {
      if (this.#disposed) {
        throw new DOMException("Section transition released", "AbortError");
      }
      this.#assertTransitionCurrent();
    }

    #assertReplicaInTransition(hostId: string, replicaId: string) {
      this.#assertCurrent();
      if (
        !this.#replicasByHost.get(hostId)?.has(replicaId) &&
        !this.#affectedState.sections.some(
          ({ before, after }: any) =>
            before?.hostSectionIds?.[hostId] === replicaId ||
            after?.hostSectionIds?.[hostId] === replicaId,
        )
      ) {
        throw Error("Replica is outside this transition");
      }
    }

    #assertThreadInTransition(hostId: string, threadId: string, logicalSectionId?: string) {
      this.#assertCurrent();
      const itemKey = `${LOCAL_THREAD_PREFIX}${threadId}`;
      if (
        (this.#threadHostIds[threadId] != null && this.#threadHostIds[threadId] !== hostId) ||
        (itemKey !== this.#transitionItemKey &&
          !this.#affectedState.sections.some(
            ({ id, before, after }: any) =>
              (this.#migrationHostId == null || id === logicalSectionId) &&
              [...(before?.itemKeys ?? []), ...(after?.itemKeys ?? [])].includes(itemKey),
          ))
      ) {
        throw Error("Thread is outside this transition");
      }
    }

    #serverContext() {
      return {
        getConnection: (hostId: string) => {
          if (this.#migrationHostId != null && hostId !== this.#migrationHostId) {
            throw Error("Host is outside this migration");
          }
          return this.#source.getConnection(hostId);
        },
        assertCurrent: () => this.#assertCurrent(),
        assertSourceCurrent: () => {
          if (!this.#source.isSourceCurrent()) {
            throw new DOMException("Section source retired", "AbortError");
          }
        },
        canDeleteCreatedReplica: (hostId: string, replicaId: string) =>
          !this.#source
            .read()
            .sections.some((section: any) => section.hostSectionIds?.[hostId] === replicaId),
      };
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createSavedSectionTransitionClass };
}
