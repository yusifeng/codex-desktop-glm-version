// @ts-nocheck

/** Owns app-server project migration, writes, ordering, deletion recovery, and thread membership sync. */
export function createHostAppServerProjectsClass(
  dependencies: Record<string, any>,
) {
  const {
    runtime: n,
    createLogger,
    ThreadProjectAssignmentWriter: W6e,
    PendingProjectDeletionScheduler: K6e,
    computeProjectOrderMoves: H6e,
    enqueueKeyed: d2,
    projectListPageSize: q6e,
    projectOrderKey: J6e,
    deletionGraceMs: Nt,
    normalizeProjectRoot: zn,
    now,
  } = dependencies;

  return class HostAppServerProjects {
    globalState;
    connection;
    cache;
    logger = createLogger(`host-app-server-projects`);
    serverProjectsByLegacyId = new Map();
    legacyProjectIdsByServerId = new Map();
    pendingProjectWrites = new Map();
    pendingDeletions;
    threadAssignments;
    started = !1;
    threadAssignmentsEnabled = !1;
    membershipLifetime = new AbortController();
    threadMigration = null;
    pendingCreatedThreadIds = new Set();
    pendingObservedThreadIds = new Set();
    membershipSync = Promise.resolve();
    projectInitialization = null;
    connectionLifetime = new AbortController();
    connected = !0;
    migrationIdentity = null;
    projectSupport = `unknown`;
    projectsReady = !1;
    disposed = !1;
    constructor(e, t, n, r = () => {}) {
      ((this.globalState = e),
        (this.connection = t),
        (this.cache = n),
        (this.threadAssignments = new W6e(
          e,
          t,
          (e) => this.serverProjectsByLegacyId.get(e)?.id,
          () => this.threadAssignmentsEnabled,
          (e) => this.legacyProjectIdsByServerId.get(e),
          r,
        )),
        (this.pendingDeletions = new K6e(e, (e, t, n) => this.finishPendingDeletion(e, t, n))));
    }
    start() {
      this.started = !0;
      let e = this.connection.registerInternalThreadObservationHandler((e) =>
          this.observeThreads(e),
        ),
        t = this.connection.registerInternalNotificationHandler((e) => {
          if (e.method === `thread/started`) {
            let t = n.ir(e.params);
            t != null && this.observeThreads([t]);
          }
          if (
            !this.threadAssignmentsEnabled ||
            (e.method !== `thread/unarchived` && e.method !== `turn/completed`)
          )
            return;
          let t = n.ar(e.params);
          if (t == null || (e.method === `turn/completed` && !this.pendingCreatedThreadIds.has(t)))
            return;
          let r = AbortSignal.any([this.connectionLifetime.signal, this.membershipLifetime.signal]);
          this.syncAssignments(async (e) => {
            let i = this.globalState.get(n.iu.APP_SERVER_PROJECTS_MIGRATION_BY_HOST)?.[e];
            (this.pendingCreatedThreadIds.has(t) ||
            i?.threadAssignmentsReadMigrated !== !0 ||
            i.pendingThreadAssignmentIds?.includes(t)
              ? await this.threadAssignments.syncAssignment(t, void 0, r)
              : await this.threadAssignments.refresh(t, r),
              r.throwIfAborted(),
              this.pendingCreatedThreadIds.delete(t),
              i?.pendingThreadAssignmentIds?.includes(t) &&
                this.globalState.update(n.iu.APP_SERVER_PROJECTS_MIGRATION_BY_HOST, (n) => {
                  let r = n?.[e];
                  return r == null
                    ? (n ?? void 0)
                    : {
                        ...n,
                        [e]: {
                          ...r,
                          pendingThreadAssignmentIds: r.pendingThreadAssignmentIds?.filter(
                            (e) => e !== t,
                          ),
                        },
                      };
                }));
          }, r);
        }),
        r = this.connection.registerInternalConnectionStateHandler((e) => {
          e === `connected`
            ? (this.connected ||
                ((this.connected = !0),
                (this.connectionLifetime = new AbortController()),
                (this.projectSupport = `unknown`)),
              this.startConnectionSync())
            : (this.pendingDeletions.stop(),
              (this.connected = !1),
              this.connectionLifetime.abort(),
              (this.projectsReady = !1),
              (this.projectInitialization = null),
              (this.threadMigration = null),
              this.pendingCreatedThreadIds.clear());
        });
      return (
        this.startConnectionSync(),
        () => {
          (this.pendingDeletions.stop(),
            (this.disposed = !0),
            this.pendingCreatedThreadIds.clear(),
            this.connectionLifetime.abort(),
            r(),
            t(),
            e());
        }
      );
    }
    observeThreads(e) {
      if (!this.threadAssignmentsEnabled || this.disposed || !this.connected) return;
      let t = AbortSignal.any([this.connectionLifetime.signal, this.membershipLifetime.signal]);
      for (let { id: r, projectId: i } of e) {
        if (i === void 0 || this.pendingObservedThreadIds.has(r)) continue;
        this.pendingObservedThreadIds.add(r);
        let e = this.threadMigration;
        this.membershipSync = this.membershipSync
          .then(() =>
            this.syncAssignments(async (a) => {
              (await e, t.throwIfAborted());
              let o = this.globalState.get(n.iu.APP_SERVER_PROJECTS_MIGRATION_BY_HOST)?.[a];
              o?.threadAssignmentsMigrated !== !0 ||
                o.pendingThreadAssignmentIds?.includes(r) ||
                this.pendingCreatedThreadIds.has(r) ||
                (await this.threadAssignments.observe(r, i, t));
            }, t),
          )
          .finally(() => this.pendingObservedThreadIds.delete(r));
      }
    }
    getProjectDeletionDeadline(e) {
      return this.migrationIdentity == null
        ? void 0
        : this.pendingDeletions.get(this.migrationIdentity, e)?.deleteAfterMs;
    }
    writeProject(e, t, n) {
      return this.runProjectWrite(
        t.id,
        async (r) => {
          let i = this.migrationIdentity;
          if (i == null) throw Error(`App-server project identity is unavailable`);
          let a = this.pendingDeletions.get(i, t.id);
          if (e === `project/delete`) {
            let e = this.serverProjectsByLegacyId.get(t.id);
            e != null &&
              a == null &&
              this.pendingDeletions.set(i, t.id, {
                projectId: e.id,
                deleteAfterMs: now() + Nt,
              });
          } else if (a != null) {
            if (
              a.deleteAfterMs <= now() ||
              this.serverProjectsByLegacyId.get(t.id)?.id !== a.projectId
            )
              throw Error(`This project can no longer be restored`);
          } else await this.writeAppServerProject(e, t, r, n);
        },
        async () => {
          let r = this.migrationIdentity;
          (e === `project/create` &&
            r != null &&
            this.pendingDeletions.get(r, t.id) != null &&
            this.pendingDeletions.set(r, t.id, void 0),
            this.cache.writeProject(e, t, n),
            r != null &&
              (await this.globalState.flushOrThrow(), this.pendingDeletions.schedule(r, t.id)));
        },
      );
    }
    finishPendingDeletion(e, t, n) {
      return this.runProjectWrite(t, async (r) => {
        let i = this.pendingDeletions.get(e, t);
        this.migrationIdentity !== e ||
          i?.projectId !== n.projectId ||
          i.deleteAfterMs !== n.deleteAfterMs ||
          i.deleteAfterMs > now() ||
          (await this.deleteAppServerProject(n.projectId, r),
          this.serverProjectsByLegacyId.get(t)?.id === n.projectId &&
            this.serverProjectsByLegacyId.delete(t),
          this.pendingDeletions.set(e, t, void 0),
          await this.globalState.flushOrThrow());
      });
    }
    async deleteAppServerProject(e, t) {
      try {
        await this.connection.sendAppServerRequest(`project/delete`, { projectId: e });
      } catch (t) {
        if (!(t instanceof Error) || t.message !== `project not found: ${e}`) throw t;
      }
      t.throwIfAborted();
    }
    updateProject(e, t) {
      return this.runProjectWrite(
        e,
        async (r) => {
          let i = this.serverProjectsByLegacyId.get(e);
          if (i == null) throw Error(`Cannot update a project that no longer exists in app-server`);
          let a =
            t.appearance === void 0
              ? void 0
              : this.projectMetadata(
                  t.appearance,
                  (await this.connection.sendAppServerRequest(`project/read`, { projectId: i.id }))
                    .project.metadata,
                );
          r.throwIfAborted();
          let o = await this.connection.sendAppServerRequest(`project/update`, {
            projectId: i.id,
            name: t.name,
            roots: t.rootPaths?.map((e) => ({ path: zn(e, n.zi(this.connection.hostConfig)) })),
            metadata: a,
          });
          (r.throwIfAborted(), this.storeProject(o.project, e));
        },
        () => this.cache.updateProject(e, t),
      );
    }
    moveProject(e, t) {
      return this.runProjectWrite(e, async (n) => {
        let r = this.serverProjectsByLegacyId.get(e),
          i = t == null ? null : this.serverProjectsByLegacyId.get(t);
        if (r == null || (t != null && i == null))
          throw Error(`Cannot reorder a project that no longer exists in app-server`);
        (await this.connection.sendAppServerRequest(`project/move`, {
          projectId: r.id,
          beforeProjectId: i?.id ?? null,
        }),
          n.throwIfAborted());
      });
    }
    setProjectOrder(e, t) {
      return this.runProjectWrite(J6e, async (n) => {
        let r = (e) =>
          e.flatMap((e) => {
            let t = this.serverProjectsByLegacyId.get(e);
            return t == null ? [] : [t.id];
          });
        for (let i of H6e(r(e), r(t)))
          (n.throwIfAborted(), await this.connection.sendAppServerRequest(`project/move`, i));
      });
    }
    async runProjectWrite(e, t, n) {
      let r = this.connectionLifetime.signal;
      (await this.ensureProjectsReady(),
        r.throwIfAborted(),
        await d2(this.pendingProjectWrites, e, async () => {
          (r.throwIfAborted(),
            this.projectSupport === `supported` && (await t(r), r.throwIfAborted()),
            n != null && (await n()));
        }));
    }
    async writeAppServerProject(e, t, r, i) {
      let a = this.serverProjectsByLegacyId.get(t.id),
        o = {
          name: t.name,
          roots: t.rootPaths.map((e) => ({ path: zn(e, n.zi(this.connection.hostConfig)) })),
          ...(i === void 0 && a != null
            ? {}
            : {
                metadata: this.projectMetadata(
                  i === void 0 ? this.cache.getAppearance(t.id) : i,
                  a?.metadata,
                ),
              }),
        },
        s =
          a == null
            ? await this.connection.sendAppServerRequest(
                e === `project/create` ? `project/create` : `project/import`,
                { ...o, idempotencyKey: t.id },
              )
            : await this.connection.sendAppServerRequest(`project/update`, {
                ...o,
                projectId: a.id,
              });
      (r.throwIfAborted(), this.storeProject(s.project, t.id));
    }
    setThreadAssignmentsEnabled(e) {
      this.threadAssignmentsEnabled !== e &&
        ((this.threadAssignmentsEnabled = e),
        this.membershipLifetime.abort(),
        (this.membershipLifetime = new AbortController()),
        (this.threadMigration = null),
        e && this.started && this.startConnectionSync());
    }
    async getThreadStartProjectId(e) {
      return !this.threadAssignmentsEnabled ||
        e?.projectKind !== `local` ||
        (await this.ensureProjectsReady(),
        !this.threadAssignmentsEnabled || this.projectSupport !== `supported`)
        ? null
        : this.threadAssignments.getServerProjectId(e);
    }
    async writeThreadAssignment(e, t, n, r, i) {
      await this.threadAssignments.write(
        e,
        t,
        async () => {
          let a =
            (i == null || i === `local`) && r !== void 0 && r == null && t?.projectKind === `local`;
          (a && this.pendingCreatedThreadIds.add(e),
            (!this.threadAssignmentsEnabled || a) && this.invalidateMembershipCheckpoints(e),
            await n());
        },
        async () => (await this.ensureProjectsReady(), this.projectSupport === `supported`),
        this.connectionLifetime.signal,
        r,
        i,
      );
    }
    invalidateMembershipCheckpoints(e) {
      this.globalState.update(n.iu.APP_SERVER_PROJECTS_MIGRATION_BY_HOST, (t) => {
        if (t != null)
          return Object.fromEntries(
            Object.entries(t).map(([t, n]) => [
              t,
              t.startsWith(`${this.cache.hostId}:`)
                ? {
                    ...n,
                    threadAssignmentsMigrated: !1,
                    pendingThreadAssignmentIds:
                      e == null
                        ? n.pendingThreadAssignmentIds
                        : [...new Set([...(n.pendingThreadAssignmentIds ?? []), e])],
                  }
                : n,
            ]),
          );
      });
    }
    startConnectionSync() {
      if (!this.connected || this.disposed || this.threadMigration != null) return;
      let e = AbortSignal.any([this.connectionLifetime.signal, this.membershipLifetime.signal]),
        t = this.syncAssignments(async (t) => {
          (await this.threadAssignments.migrate(t, e, (e) => {
            this.pendingCreatedThreadIds.delete(e);
          }),
            this.pendingCreatedThreadIds.size > 0 && this.invalidateMembershipCheckpoints());
        }, e).finally(() => {
          this.threadMigration === t && (this.threadMigration = null);
        });
      this.threadMigration = t;
    }
    async syncAssignments(e, t) {
      try {
        (t.throwIfAborted(),
          await this.ensureProjectsReady(),
          t.throwIfAborted(),
          this.threadAssignmentsEnabled &&
            this.projectSupport === `supported` &&
            this.migrationIdentity != null &&
            (await e(this.migrationIdentity)));
      } catch (e) {
        t.aborted ||
          this.logger.warning(`Local app-server assignment sync failed`, {
            safe: {},
            sensitive: { error: e },
          });
      }
    }
    ensureProjectsReady() {
      if (this.disposed || !this.connected)
        return Promise.reject(Error(`App-server projects are disconnected`));
      if (this.projectsReady || this.projectSupport === `unsupported`) return Promise.resolve();
      if (this.projectInitialization != null) return this.projectInitialization;
      let e = this.connectionLifetime.signal,
        t = this.initializeProjects(e).finally(() => {
          this.projectInitialization === t && (this.projectInitialization = null);
        });
      return ((this.projectInitialization = t), t);
    }
    async initializeProjects(e) {
      (await Promise.allSettled(this.pendingProjectWrites.values()), e.throwIfAborted());
      let t = await this.connection.codexHome();
      e.throwIfAborted();
      let r = `${this.cache.hostId}:${t}`;
      this.migrationIdentity = r;
      for (let e of Object.keys(this.pendingDeletions.getAll(r))) {
        let t = this.cache.getProjects()[e];
        t != null && this.cache.writeProject(`project/delete`, t);
      }
      if (!n.Wu(this.connection.appServerVersion, `projects`)) {
        this.projectSupport = `unsupported`;
        return;
      }
      let i = await this.listProjects(e);
      e.throwIfAborted();
      let a =
        this.globalState.get(n.iu.APP_SERVER_PROJECT_ID_BY_LEGACY_PROJECT_ID_BY_HOST)?.[r] ?? {};
      this.legacyProjectIdsByServerId.clear();
      for (let [e, t] of Object.entries(a)) this.legacyProjectIdsByServerId.set(t, e);
      ((this.projectSupport = `supported`), this.serverProjectsByLegacyId.clear());
      for (let e of i) this.storeProject(e);
      let o = this.globalState.get(n.iu.APP_SERVER_PROJECTS_MIGRATION_BY_HOST)?.[r],
        s = new Map((this.globalState.get(n.iu.PROJECT_ORDER) ?? []).map((e, t) => [e, t])),
        c = Object.values(this.cache.getProjects()).sort(
          (e, t) => (s.get(e.id) ?? 2 ** 53 - 1) - (s.get(t.id) ?? 2 ** 53 - 1),
        );
      for (let t of c)
        if ((e.throwIfAborted(), !(this.serverProjectsByLegacyId.has(t.id) || a[t.id] != null)))
          try {
            await this.writeAppServerProject(`project/import`, t, e);
          } catch (e) {
            if (
              !(e instanceof Error) ||
              !e.message.startsWith(`idempotency key refers to deleted project:`)
            )
              throw e;
          }
      (e.throwIfAborted(),
        o?.projectsMigrated !== !0 &&
          this.globalState.update(n.iu.APP_SERVER_PROJECTS_MIGRATION_BY_HOST, (e) => ({
            ...e,
            [r]: { version: 1, projectsMigrated: !0, threadAssignmentsMigrated: !1 },
          })),
        e.throwIfAborted(),
        (this.projectsReady = !0),
        this.pendingDeletions.resume(r),
        this.logger.info(`Local app-server project migration completed`, {
          safe: { projectCount: this.serverProjectsByLegacyId.size },
          sensitive: {},
        }));
    }
    async listProjects(e) {
      let t = [],
        n = null;
      do {
        e.throwIfAborted();
        let r = await this.connection.sendAppServerRequest(`project/list`, {
          cursor: n,
          limit: q6e,
        });
        (e.throwIfAborted(), t.push(...r.data), (n = r.nextCursor));
      } while (n != null);
      return t;
    }
    storeProject(e, t) {
      let r = t ?? this.legacyProjectIdsByServerId.get(e.id) ?? e.id;
      if (
        t != null &&
        t !== e.id &&
        (this.serverProjectsByLegacyId.delete(e.id), this.migrationIdentity != null)
      ) {
        let r = this.migrationIdentity;
        this.globalState.update(n.iu.APP_SERVER_PROJECT_ID_BY_LEGACY_PROJECT_ID_BY_HOST, (n) => ({
          ...n,
          [r]: { ...n?.[r], [t]: e.id },
        }));
      }
      (this.legacyProjectIdsByServerId.set(e.id, r), this.serverProjectsByLegacyId.set(r, e));
    }
    projectMetadata(e, t) {
      let n = { ...t };
      return (
        e == null
          ? (delete n[`appearance.color`], delete n[`appearance.marker`])
          : ((n[`appearance.color`] = e.color),
            (n[`appearance.marker`] = JSON.stringify(e.marker))),
        n
      );
    }
  }
}

if (typeof module !== "undefined")
  module.exports = { createHostAppServerProjectsClass };
