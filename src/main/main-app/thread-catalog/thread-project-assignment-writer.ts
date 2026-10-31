// @ts-nocheck

/** Owns serialized thread↔project assignment observation, writes, and migration. */
export function createThreadProjectAssignmentWriterClass(
  dependencies: Record<string, any>,
) {
  const {
    runtime: n,
    timers: D,
    enqueueKeyed: d2,
    pageSize: U6e,
    batchSize: f2,
  } = dependencies;

  return class ThreadProjectAssignmentWriter {
    globalState;
    connection;
    serverProjectId;
    isEnabled;
    legacyProjectId;
    publish;
    pendingWrites = new Map();
    projectlessIds;
    projectlessIdSet = new Set();
    constructor(e, t, n, r = () => !0, i = () => void 0, a = () => {}) {
      ((this.globalState = e),
        (this.connection = t),
        (this.serverProjectId = n),
        (this.isEnabled = r),
        (this.legacyProjectId = i),
        (this.publish = a));
    }
    async observe(e, t, n) {
      this.isEnabled() &&
        t !== void 0 &&
        !this.matches(e, t) &&
        (await this.refresh(e, n));
    }
    async refresh(e, t) {
      await d2(this.pendingWrites, e, async () => {
        if ((t.throwIfAborted(), !this.isEnabled())) return;
        let { thread: n } = await this.connection.sendAppServerRequest(
          `thread/read`,
          {
            threadId: e,
            includeTurns: !1,
          },
        );
        (t.throwIfAborted(),
          this.isEnabled() &&
            n.projectId !== void 0 &&
            this.adopt(e, n.projectId));
      });
    }
    matches(e, t) {
      let r = this.globalState.get(n.iu.THREAD_PROJECT_ASSIGNMENTS)?.[e];
      return t == null
        ? this.localProjectId(r) == null
        : this.legacyProjectId(t) == null ||
            (this.localProjectId(r) === this.legacyProjectId(t) &&
              !this.isExplicitlyProjectless(e));
    }
    adopt(e, t) {
      if (this.matches(e, t)) return;
      let r = {
          assignments:
            this.globalState.get(n.iu.THREAD_PROJECT_ASSIGNMENTS) ?? {},
          projectlessThreadIds:
            this.globalState.get(n.iu.PROJECTLESS_THREAD_IDS) ?? [],
        },
        i = r.assignments[e];
      if (i != null && this.localProjectId(i) == null) return;
      let a = t == null ? null : this.legacyProjectId(t);
      if (
        (t != null && (a == null || this.activeServerProjectId(a) == null)) ||
        (t == null && i == null)
      )
        return;
      let { records: o, memberships: s } = n.oa(r, [
        {
          threadId: n.$u(e),
          assignment: a == null ? null : { projectKind: `local`, projectId: a },
          projectless: t == null,
        },
      ]);
      Object.keys(s).length !== 0 &&
        (this.globalState.set(n.iu.THREAD_PROJECT_ASSIGNMENTS, o.assignments),
        this.globalState.set(
          n.iu.PROJECTLESS_THREAD_IDS,
          o.projectlessThreadIds,
        ),
        this.publish(s));
    }
    async write(e, t, r, i, a, o, s) {
      await d2(this.pendingWrites, e, async () => {
        let c = this.globalState.get(n.iu.THREAD_PROJECT_ASSIGNMENTS)?.[e],
          l = t == null && s === `local`;
        if (n.sa(c, t) && !l) {
          await r();
          return;
        }
        let u = this.localProjectId(t);
        if (
          o === void 0 &&
          (s == null || s === `local`) &&
          this.isEnabled() &&
          (l || u != null || this.localProjectId(c) != null)
        ) {
          if ((a.throwIfAborted(), (await i()) && this.isEnabled())) {
            a.throwIfAborted();
            let t = u == null ? `` : this.activeServerProjectId(u);
            if (t == null)
              throw Error(
                `Cannot assign a thread to an unavailable local project`,
              );
            await this.connection.sendAppServerRequest(
              `thread/metadata/update`,
              {
                threadId: e,
                projectId: t,
              },
            );
          } else a.throwIfAborted();
        }
        await r();
      });
    }
    async syncAssignment(e, t, r) {
      await d2(this.pendingWrites, e, async () => {
        if ((r.throwIfAborted(), !this.isEnabled())) return;
        let i = this.globalState.get(n.iu.THREAD_PROJECT_ASSIGNMENTS)?.[e],
          a = this.localProjectId(i),
          o = a == null ? void 0 : this.activeServerProjectId(a),
          s = i == null && this.isExplicitlyProjectless(e);
        if (o != null || s) {
          let n = o ?? null;
          t !== n &&
            (await this.connection.sendAppServerRequest(
              `thread/metadata/update`,
              {
                threadId: e,
                projectId: n ?? ``,
              },
            ));
        }
      });
    }
    async migrate(e, t, r) {
      let i = this.globalState.get(
        n.iu.APP_SERVER_PROJECTS_MIGRATION_BY_HOST,
      )?.[e];
      if (
        !this.isEnabled() ||
        (i?.threadAssignmentsMigrated === !0 &&
          i.threadAssignmentsReadMigrated === !0)
      )
        return;
      let a = new Set(
          i?.threadAssignmentsReadMigrated === !0
            ? i.pendingThreadAssignmentIds
            : [
                ...Object.keys(
                  this.globalState.get(n.iu.THREAD_PROJECT_ASSIGNMENTS) ?? {},
                ),
                ...(this.globalState.get(n.iu.PROJECTLESS_THREAD_IDS) ?? []),
              ],
        ),
        o = null;
      do {
        t.throwIfAborted();
        let e = await this.connection.sendAppServerRequest(`thread/list`, {
          cursor: o,
          limit: U6e,
          archived: !1,
          modelProviders: [],
          sourceKinds: n.ua,
          useStateDbOnly: !0,
        });
        t.throwIfAborted();
        for (let n = 0; n < e.data.length; n += f2) {
          let o = await Promise.allSettled(
            e.data.slice(n, n + f2).map(async (e) => {
              (i?.threadAssignmentsMigrated !== !0 &&
                (i?.threadAssignmentsReadMigrated !== !0 ||
                  i.pendingThreadAssignmentIds?.includes(e.id)) &&
                (await this.syncAssignment(e.id, e.projectId, t)),
                await this.observe(e.id, e.projectId, t),
                a.delete(e.id),
                t.throwIfAborted(),
                r?.(e.id));
            }),
          );
          for (let e of o) if (e.status === `rejected`) throw e.reason;
          await (0, D.setTimeout)(0, void 0, { signal: t });
        }
        o = e.nextCursor;
      } while (o != null);
      (t.throwIfAborted(),
        this.globalState.update(
          n.iu.APP_SERVER_PROJECTS_MIGRATION_BY_HOST,
          (t) => ({
            ...t,
            [e]: {
              ...t?.[e],
              version: 1,
              projectsMigrated: !0,
              threadAssignmentsMigrated:
                t?.[e] === i || !t?.[e]?.pendingThreadAssignmentIds?.length,
              threadAssignmentsReadMigrated: !0,
              pendingThreadAssignmentIds: [
                ...new Set([
                  ...a,
                  ...(t?.[e] === i
                    ? []
                    : (t?.[e]?.pendingThreadAssignmentIds ?? [])),
                ]),
              ],
            },
          }),
        ));
    }
    getServerProjectId(e) {
      let t = this.localProjectId(e);
      if (t == null) return null;
      let n = this.activeServerProjectId(t);
      if (n == null)
        throw Error(`Cannot assign a thread to an unavailable local project`);
      return n;
    }
    isExplicitlyProjectless(e) {
      let t = this.globalState.get(n.iu.PROJECTLESS_THREAD_IDS);
      return (
        t !== this.projectlessIds &&
          ((this.projectlessIds = t), (this.projectlessIdSet = new Set(t))),
        this.projectlessIdSet.has(e)
      );
    }
    localProjectId(e) {
      return e?.projectKind !== `local` ||
        (e.projectOrigin === `chatgpt` &&
          this.globalState.get(n.iu.LOCAL_PROJECTS)?.[e.projectId] == null &&
          this.serverProjectId(e.projectId) == null)
        ? null
        : e.projectId;
    }
    activeServerProjectId(e) {
      return this.globalState.get(n.iu.LOCAL_PROJECTS)?.[e] == null
        ? void 0
        : this.serverProjectId(e);
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createThreadProjectAssignmentWriterClass };
