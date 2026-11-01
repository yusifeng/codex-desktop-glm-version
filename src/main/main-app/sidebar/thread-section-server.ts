// @ts-nocheck

export function createThreadSectionServerClass(dependencies) {
  const {
    Qze,
    ThreadSectionEngine,
    isValidAppServerVersion,
    gH,
    hH,
    RetryLookupCache,
    me,
    n,
    pinnedThreadSectionId,
    supportsAppServerSections,
  } = dependencies;
  return class ThreadSectionServer {
      globalState;
      appServerConnectionRegistry;
      observedConnections = new WeakSet();
      threadLookupsByConnection = new WeakMap();
      pinnedSectionIdsByConnection = new WeakMap();
      pendingHostMutations = new Map();
      pendingMigrationMarkers = new Set();
      threadSectionEngine = new ThreadSectionEngine({
        readThread: (e, t, n) => this.readThread(e.connection, t, n, e.beforeSendRequest),
        listThreads: (e, t) => e.connection.listThreads(t, void 0, e.beforeSendRequest),
        moveThread: async (e, t) => {
          await e.connection.sendAppServerRequest(`thread/section/move`, t, e.beforeSendRequest);
        },
        listSections: (e, t) =>
          e.connection.sendAppServerRequest(`threadSection/list`, t, e.beforeSendRequest),
        createSection: (e, t) =>
          e.connection.sendAppServerRequest(`threadSection/create`, t, e.beforeSendRequest),
        updateSection: async (e, t) => {
          await e.connection.sendAppServerRequest(`threadSection/update`, t, e.beforeSendRequest);
        },
        deleteSection: async (e, t) => {
          await e.connection.sendAppServerRequest(`threadSection/delete`, t, e.beforeSendRequest);
        },
      });
      constructor(e, t) {
        ((this.globalState = e), (this.appServerConnectionRegistry = t));
      }
      async listPinnedThreads({ hostId: e, cloudThreadIds: t } = {}) {
        let r = this.appServerConnectionRegistry.getAllHostIds(),
          i = r.filter((e) => !n.Cs(e)),
          a =
            e == null &&
            (i.length === 0 ||
              i.some(
                (e) =>
                  this.appServerConnectionRegistry.getMaybeConnection(e)?.getConnectionState() !==
                  `connected`,
              )),
          o = (await this.getHosts(e)).filter((t) => e != null || !n.Cs(t.hostId)),
          s = o.filter((e) => e.pinnedSectionId != null),
          c = o.filter((e) => e.pinnedSectionId == null),
          l = new Set(t);
        e ?? (await this.migrateLegacyPinnedThreads(s, c, l));
        let u = this.getMigratedThreadIds(s),
          d = hH(this.globalState).filter((e) => !u.has(e) && !l.has(e)),
          f = Array.from(
            new Set(
              (
                await Promise.all(s.map((e) => this.threadSectionEngine.listHostSectionThreadIds(e)))
              ).flat(),
            ),
          ),
          p = await Promise.all(
            d.map(async (t) =>
              ((await this.findLegacyThreadOwnerInHosts(t, c, { hostId: e, forDiscovery: !0 })) ==
                null &&
                !a &&
                !(e == null && r.some(n.Cs))) ||
              (e == null &&
                (await this.threadSectionEngine.findThreadOwner(t, s, { forDiscovery: !0 })) != null)
                ? null
                : t,
            ),
          );
        return {
          threadIds: Array.from(new Set([...f, ...p.filter((e) => e != null)])),
          serverOrderedThreadIds: f,
        };
      }
      async listPinnedThreadIds({ hostId: e } = {}) {
        return (await this.listPinnedThreads({ hostId: e })).threadIds;
      }
      async listSections({ hostId: e } = {}, t) {
        t?.assertCurrent();
        let r = (await this.getSupportedHosts(e, t)).filter(
          (t) => (e != null || !n.Cs(t.hostId)) && supportsAppServerSections(t.connection.appServerVersion),
        );
        return this.threadSectionEngine.listSections(r.map((e) => this.bindSectionOperation(e, t)));
      }
      async listSectionThreadIds({ hostId: e, sectionId: t }, n) {
        return this.threadSectionEngine.listHostSectionThreadIds(
          await this.getCustomSectionHost(e, n),
          t,
        );
      }
      async createSection(
        { hostId: e, threadIdToMove: t, logicalSectionId: n, name: r, previousSectionId: i },
        a,
        o,
      ) {
        let s = await this.getCustomSectionHost(e, a),
          c = s.connection.captureRequestLifetime(),
          l =
            a == null
              ? await this.threadSectionEngine.createSection(s, r, n)
              : (
                  await s.connection.sendAppServerRequest(
                    `threadSection/create`,
                    { name: r },
                    s.beforeSendRequest,
                  )
                ).section,
          u;
        try {
          if ((a?.assertCurrent(), t == null)) return l;
          if (
            !(await this.setThreadSection(
              { beforeThreadId: null, hostId: e, previousSectionId: i, sectionId: l.id, threadId: t },
              a,
              (e) => {
                ((u = { threadId: t, previousSectionId: e }), o?.(u));
              },
            ))
          )
            throw Error(`App-server section thread changed sections`);
          return l;
        } catch (t) {
          throw (
            await this.discardCreatedSection(
              e,
              l.id,
              a ?? {
                getConnection: () => s.connection,
                assertCurrent: c,
                assertSourceCurrent: c,
                canDeleteCreatedReplica: () => !0,
              },
              u,
            ),
            t
          );
        }
      }
      async discardCreatedSection(e, t, n, r) {
        let i =
            n == null
              ? void 0
              : {
                  ...n,
                  assertCurrent: () => {
                    if ((n.assertSourceCurrent(), !n.canDeleteCreatedReplica(e, t)))
                      throw new DOMException(`Created section was adopted`, `AbortError`);
                  },
                },
          a = await this.getCustomSectionHost(e, i);
        await this.runHostMutation(a.migrationIdentity, async () => {
          if (r != null) {
            let e = await this.threadSectionEngine.findThreadOwner(r.threadId, [a]);
            e?.sectionId === t &&
              (await this.threadSectionEngine.setThreadSection(e, {
                threadId: r.threadId,
                sectionId: r.previousSectionId,
                previousSectionId: t,
              }));
          }
          (await this.threadSectionEngine.listHostSectionThreadIds(a, t)).length === 0 &&
            (await this.threadSectionEngine.deleteSection(a, t));
        });
      }
      async updateSection({ hostId: e, sectionId: t, name: n }, r) {
        let i = await this.getCustomSectionHost(e, r);
        await this.threadSectionEngine.updateSection(i, t, n);
      }
      async deleteSection({ hostId: e, sectionId: t }, n) {
        let r = await this.getCustomSectionHost(e, n);
        await this.threadSectionEngine.deleteSection(r, t);
      }
      async setThreadSection(
        { hostId: e, threadId: t, sectionId: n, beforeThreadId: r, previousSectionId: i },
        a,
        o,
      ) {
        let s = await this.getCustomSectionHost(e, a);
        return this.runHostMutation(s.migrationIdentity, async () => {
          a?.assertCurrent();
          let e = await this.threadSectionEngine.findThreadOwner(t, [s], {
            throwOnMissingThread: !0,
          });
          return (
            e != null &&
            (o?.(e.sectionId),
            this.threadSectionEngine.setThreadSection(e, {
              threadId: t,
              sectionId: n,
              beforeThreadId: r,
              previousSectionId: i,
            }))
          );
        });
      }
      async setThreadPinned({
        threadId: e,
        pinned: t,
        hostId: n,
        beforeThreadId: r,
        onThreadSectionChange: i,
      }) {
        let a = await this.getSupportedHosts(n),
          o =
            n == null
              ? await this.threadSectionEngine.findThreadOwner(e, a, { throwOnAmbiguousOwner: !0 })
              : a[0];
        return o == null
          ? null
          : this.runHostMutation(o.migrationIdentity, async () => {
              let n = await this.threadSectionEngine.findThreadOwner(e, [o], {
                throwOnMissingThread: !0,
              });
              if (n == null) return null;
              let a = await this.threadSectionEngine.setThreadPinned(n, {
                threadId: e,
                pinned: t,
                beforeThreadId: r,
              });
              return (
                a && i?.(n.sectionId, n.hostId),
                hH(this.globalState).includes(e) &&
                  (await this.markThreadMigrated(n.migrationIdentity, e)),
                a
              );
            });
      }
      async isLegacyThread({ threadId: e, hostId: t }) {
        let n = (await this.getHosts(t)).filter((e) => e.pinnedSectionId == null);
        return (await this.findLegacyThreadOwnerInHosts(e, n, { hostId: t })) != null;
      }
      async movePinnedThread({ threadId: e, beforeThreadId: t, hostId: n }) {
        let r = await this.getSupportedHosts(n),
          i =
            n == null
              ? await this.threadSectionEngine.findThreadOwner(e, r, { throwOnAmbiguousOwner: !0 })
              : r[0];
        return i == null
          ? null
          : this.runHostMutation(i.migrationIdentity, async () => {
              let n = await this.threadSectionEngine.findThreadOwner(e, [i], {
                throwOnMissingThread: !0,
              });
              return n == null
                ? null
                : this.threadSectionEngine.movePinnedThread(n, { threadId: e, beforeThreadId: t });
            });
      }
      async getSupportedHosts(e, t) {
        return (await this.getHosts(e, t)).filter((e) => e.pinnedSectionId != null);
      }
      async getCustomSectionHost(e, t) {
        (t?.getConnection(e), t?.assertCurrent());
        let n = (await this.getSupportedHosts(e, t))[0];
        if (n == null || !supportsAppServerSections(n.connection.appServerVersion))
          throw Error(`App server does not support custom thread sections`);
        return this.bindSectionOperation(n, t);
      }
      bindSectionOperation(e, t) {
        if (t == null) return e;
        let n = t.getConnection(e.hostId),
          r = () => {
            if (
              (t.assertCurrent(),
              e.connection !== n ||
                t.getConnection(e.hostId) !== n ||
                this.appServerConnectionRegistry.getMaybeConnection(e.hostId) !== n)
            )
              throw new DOMException(`Section operation connection retired`, `AbortError`);
          };
        return (r(), { ...e, beforeSendRequest: r });
      }
      async getHosts(e, t) {
        let r = e == null ? this.appServerConnectionRegistry.getAllHostIds() : [e];
        return (
          await Promise.all(
            r.map(async (e) => {
              let r =
                  t == null
                    ? this.appServerConnectionRegistry.getMaybeConnection(e)
                    : t.getConnection(e),
                i =
                  t == null
                    ? void 0
                    : () => {
                        if ((t.assertCurrent(), t.getConnection(e) !== r))
                          throw new DOMException(`Section source retired`, `AbortError`);
                      };
              if ((i?.(), r?.getConnectionState() !== `connected`)) return null;
              this.observedConnections.has(r) ||
                (this.observedConnections.add(r),
                r.registerInternalAuthenticatedPrincipalChangeHandler(() => {
                  this.threadLookupsByConnection.delete(r);
                }),
                r.registerInternalNotificationHandler((e) => {
                  if (e.method === `thread/started`) {
                    let t = Qze.safeParse(e.params);
                    t.success && this.threadLookupsByConnection.get(r)?.delete(t.data.thread.id);
                  }
                }),
                r.registerInternalConnectionStateHandler((e) => {
                  e !== `connected` &&
                    (this.pinnedSectionIdsByConnection.delete(r),
                    this.threadLookupsByConnection.delete(r));
                }));
              let a = r.appServerVersion,
                o = a != null && a !== `0.0.0` && n.Qu(a) ? a : null;
              if ((a == null && !r.isLocal) || (o != null && !isValidAppServerVersion(o)))
                return { hostId: e, connection: r, pinnedSectionId: null };
              let s = this.pinnedSectionIdsByConnection.get(r);
              if (!this.pinnedSectionIdsByConnection.has(r)) {
                if (
                  ((s = o == null ? await this.findPinnedSectionId(r, i) : pinnedThreadSectionId),
                  s != null && o == null)
                )
                  try {
                    await r.listThreads(
                      { cursor: null, limit: 1, sectionId: s, sortKey: `section_position` },
                      void 0,
                      i,
                    );
                  } catch (e) {
                    if (
                      !(e instanceof Error) ||
                      !(
                        (gH(e, -32602) && /^invalid params$/i.test(e.message)) ||
                        /(?:unknown variant|unsupported|invalid).*(?:section_position|sort)/i.test(
                          e.message,
                        )
                      )
                    )
                      throw e;
                    s = null;
                  }
                (i?.(), this.pinnedSectionIdsByConnection.set(r, s));
              }
              if (s == null) return { hostId: e, connection: r, pinnedSectionId: null };
              let c = await r.codexHome();
              return (
                i?.(),
                { hostId: e, migrationIdentity: `${e}:${c}`, connection: r, pinnedSectionId: s }
              );
            }),
          )
        ).filter((e) => e != null);
      }
      async findPinnedSectionId(e, t) {
        let n = null;
        do {
          let r;
          try {
            r = await e.sendAppServerRequest(`threadSection/list`, { cursor: n, limit: 100 }, t);
          } catch (e) {
            if (
              !(e instanceof Error) ||
              !(
                gH(e, -32601) ||
                /method not found|unknown method|unsupported app-server method|unknown variant `threadSection\/list`|-32601/i.test(
                  e.message,
                )
              )
            )
              throw e;
            return null;
          }
          let i = r.data.find(({ id: e }) => e === pinnedThreadSectionId);
          if (i != null) return i.id;
          n = r.nextCursor;
        } while (n != null);
        throw Error(`App server does not expose the pinned thread section`);
      }
      async migrateLegacyPinnedThreads(e, t, n) {
        let r = this.getMigratedThreadIds(e),
          i = await Promise.all(
            hH(this.globalState)
              .filter((e) => !r.has(e) && !n.has(e))
              .map(async (n) => {
                let r = await this.threadSectionEngine.findThreadOwner(n, e, { forDiscovery: !0 });
                return r != null &&
                  (await this.findLegacyThreadOwnerInHosts(n, t, { forDiscovery: !0 })) != null
                  ? { threadId: n, owner: null }
                  : { threadId: n, owner: r };
              }),
          );
        await Promise.all(
          i.flatMap(({ threadId: e, owner: t }) =>
            t == null
              ? []
              : [
                  this.runHostMutation(t.migrationIdentity, async () => {
                    if (this.getMigratedThreadIds([t]).has(e)) return;
                    let n = await this.threadSectionEngine.findThreadOwner(e, [t], {
                      throwOnMissingThread: !0,
                    });
                    n != null &&
                      (n.isPinned ||
                        (await this.threadSectionEngine.setThreadPinned(n, {
                          threadId: e,
                          pinned: !0,
                        })),
                      await this.markThreadMigrated(n.migrationIdentity, e));
                  }),
                ],
          ),
        );
      }
      async findLegacyThreadOwnerInHosts(e, t, n = {}) {
        let r = (
          await Promise.all(
            t.map(async (t) => {
              try {
                return (await this.readThread(t.connection, e, n.forDiscovery === !0))?.id === e
                  ? t
                  : null;
              } catch (e) {
                if (n.hostId != null || !(e instanceof Error) || !me(e)) throw e;
                return null;
              }
            }),
          )
        ).filter((e) => e != null);
        return r.length === 1 ? (r[0] ?? null) : null;
      }
      readThread(e, t, n, r) {
        let i = this.threadLookupsByConnection.get(e);
        return !n || r != null
          ? (i?.delete(t), e.readThread(t, { includeTurns: !1 }, void 0, r))
          : (i ?? ((i = new RetryLookupCache((error) => error instanceof Error && me(error))), this.threadLookupsByConnection.set(e, i)),
            i.read(t, () => e.readThread(t, { includeTurns: !1 })));
      }
      getMigratedThreadIds(e) {
        let t = this.globalState.get(n.iu.APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST) ?? {},
          r = e.map(({ migrationIdentity: e }) => e);
        return new Set(
          r.flatMap((e) =>
            (t[e] ?? []).filter((t) => !this.pendingMigrationMarkers.has(`${e}\0${t}`)),
          ),
        );
      }
      async runHostMutation(e, t) {
        let n = (this.pendingHostMutations.get(e) ?? Promise.resolve()).then(t),
          r = n.then(
            () => {},
            () => {},
          );
        this.pendingHostMutations.set(e, r);
        try {
          return await n;
        } finally {
          this.pendingHostMutations.get(e) === r && this.pendingHostMutations.delete(e);
        }
      }
      async markThreadMigrated(e, t) {
        let r = `${e}\0${t}`,
          i = this.globalState.get(n.iu.APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST) ?? {};
        (!i[e]?.includes(t) || this.pendingMigrationMarkers.has(r)) &&
          (i[e]?.includes(t) ||
            this.globalState.set(n.iu.APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST, {
              ...i,
              [e]: [...(i[e] ?? []), t],
            }),
          this.pendingMigrationMarkers.add(r),
          await this.globalState.flushOrThrow(),
          this.pendingMigrationMarkers.delete(r));
      }
    };
}

if (typeof module !== "undefined") module.exports = { createThreadSectionServerClass };
