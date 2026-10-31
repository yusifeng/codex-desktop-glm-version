// @ts-nocheck

/** Owns pending/managed worktree creation, archive transfer, worker streams, and cleanup. */
export function createWorktreeServiceClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    crypto: _,
    featureFlags: Tr,
    logger: ZZ,
    chunkItems: dp,
    cleanupChunkSize: XZ,
    isProtectedWorkspaceRoot: YZ,
    readThreadMetadata: qZ,
    hasUnavailablePinnedMetadata: UQe,
    getPinnedProtectedRoots: HQe,
    planWorktreeCleanup: Ree,
    isPreMigrationProtectionActive: GQe,
    getProtectedWorkspaceRoots: KQe,
    getPinnedThreadIds: JZ,
    getSelectedProject: Nr,
    setSelectedProject: Lr,
    maxOutputLength,
    preservedOutputLines,
  } = dependencies;

  function QZ(current: string, addition: string) {
    if (!addition) return current;
    const combined = `${current}${addition}`;
    if (combined.length <= maxOutputLength) return combined;
    const tail = combined.slice(-32_000);
    const preserved = preservedOutputLines.filter((line: string) =>
      combined.includes(line),
    );
    if (preserved.every((line: string) => tail.includes(line))) return tail;
    const prefix = `${preserved.join(`\n`)}\n`;
    return `${prefix}${tail.slice(prefix.length)}`;
  }

  function $Z(entry: any, addition: string, phase: string) {
    return phase === `setting-up`
      ? { ...entry, setupOutputText: QZ(entry.setupOutputText, addition) }
      : {
          ...entry,
          worktreeOutputText: QZ(entry.worktreeOutputText, addition),
        };
  }

  function ZQe(error: unknown) {
    return error instanceof Error && error.name === `AbortError`;
  }

  function QQe(reason: string) {
    switch (reason) {
      case `settings-delete-targeted`:
        return `worktree_settings_delete`;
      case `archive-cleanup`:
        return `worktree_archive_cleanup`;
      case `startup-cleanup`:
        return `worktree_auto_cleanup`;
      case `new-branch-cleanup`:
        return `worktree_new_branch_cleanup`;
      case `remove-workspace-root-cleanup`:
        return `worktree_remove_workspace_root_cleanup`;
    }
  }

  class WorktreeService {
    options;
    statesById = new Map();
    newbornWorktreeRoots = new Set();
    newbornWorktreeRootsByStreamId = new Map();
    cancelledWorktreeStreamIds = new Set();
    workerEventSubscriptions = new n.Wr();
    cleanupRunning = !1;
    cleanupPending = !1;
    constructor(e) {
      ((this.options = e),
        this.workerEventSubscriptions.add(
          this.options.subscribeGitWorkerEvent(`create-worktree-path`, (e) => {
            this.handleCreateWorktreePath(e);
          }),
        ),
        this.workerEventSubscriptions.add(
          this.options.subscribeGitWorkerEvent(
            `create-worktree-setup-started`,
            (e) => {
              this.handleCreateWorktreeSetupStarted(e);
            },
          ),
        ),
        this.workerEventSubscriptions.add(
          this.options.subscribeGitWorkerEvent(
            `create-worktree-stream`,
            (e) => {
              this.handleCreateWorktreeStream(e);
            },
          ),
        ),
        this.publish());
    }
    dispose() {
      (this.workerEventSubscriptions.dispose(),
        this.cancelledWorktreeStreamIds.clear());
    }
    create(e) {
      if (this.statesById.has(e.id)) return;
      let t = {
        ...e,
        createdAt: Date.now(),
        attempt: 1,
        phase: `queued`,
        labelEdited: !1,
        worktreeOutputText: ``,
        setupOutputText: ``,
        errorMessage: null,
        worktreeWorkspaceRoot: null,
        worktreeGitRoot: null,
        needsAttention: !1,
        isPinned: !1,
        pinnedBeforeThreadId: null,
      };
      (this.statesById.set(t.id, { entry: t, runtime: null }),
        this.publish(),
        this.start(t.id));
    }
    cancel(e, t = !1) {
      let n = this.statesById.get(e);
      if (t) {
        if (
          n == null ||
          n.entry.launchMode === `create-stable-worktree` ||
          n.entry.conversationStartResult != null ||
          n.entry.phase === `worktree-ready` ||
          n.entry.phase === `failed`
        )
          return;
        let e = n.entry.worktreeGitRoot,
          t = n.runtime;
        (t != null && this.cancelWorktreeCreation(t, e),
          (n.runtime = null),
          (n.entry = {
            ...n.entry,
            executionTarget: `source-workspace`,
            phase: `worktree-ready`,
            worktreeWorkspaceRoot: n.entry.sourceWorkspaceRoot,
            worktreeGitRoot: null,
            errorMessage: null,
            needsAttention: !1,
          }),
          this.publish(),
          t == null &&
            e != null &&
            this.deleteWorktree(e, `new-branch-cleanup`));
        return;
      }
      (n?.runtime != null &&
        this.cancelWorktreeCreation(n.runtime, n.entry.worktreeGitRoot),
        this.statesById.delete(e) &&
          (this.publish(),
          n?.runtime == null &&
            n?.entry.worktreeGitRoot != null &&
            this.deleteWorktree(
              n.entry.worktreeGitRoot,
              `new-branch-cleanup`,
            )));
    }
    dismiss(e) {
      let t = this.statesById.get(e);
      (t?.runtime?.abortController.abort(),
        this.statesById.delete(e) &&
          (this.publish(),
          t?.entry.phase === `failed` &&
            t.entry.worktreeGitRoot != null &&
            this.deleteWorktree(
              t.entry.worktreeGitRoot,
              `new-branch-cleanup`,
            )));
    }
    retry(e) {
      let t = this.statesById.get(e);
      if (!t || t.entry.conversationStartResult != null) return;
      let n = t.entry.phase === `failed` ? t.entry.worktreeGitRoot : null;
      (t.runtime?.abortController.abort(),
        (t.entry = {
          ...t.entry,
          attempt: t.entry.attempt + 1,
          phase: `queued`,
          worktreeOutputText: ``,
          setupOutputText: ``,
          errorMessage: null,
          worktreeWorkspaceRoot: null,
          worktreeGitRoot: null,
          needsAttention: !1,
        }),
        (t.runtime = null),
        this.publish(),
        n != null && this.deleteWorktree(n, `new-branch-cleanup`),
        this.start(e));
    }
    continueWithoutSetup(e) {
      this.updateEntry(e, (e) =>
        e.phase !== `failed` ||
        e.worktreeGitRoot == null ||
        e.worktreeWorkspaceRoot == null
          ? e
          : {
              ...e,
              phase: `worktree-ready`,
              needsAttention: !1,
              setupOutputText: QZ(
                e.setupOutputText,
                `[info] Continuing without local environment setup
  `,
              ),
            },
      );
    }
    updateMetadata(e, t) {
      this.updateEntry(e, (e) => {
        switch (t.type) {
          case `conversationStartResult`:
            return { ...e, conversationStartResult: t.result };
          case `isPinned`:
            return { ...e, isPinned: t.isPinned };
          case `pinnedBeforeThreadId`:
            return { ...e, pinnedBeforeThreadId: t.beforeThreadId };
          case `label`:
            return { ...e, label: t.label };
          case `labelEdited`:
            return { ...e, labelEdited: t.labelEdited };
          case `needsAttention`:
            return { ...e, needsAttention: t.needsAttention };
        }
      });
    }
    getPendingWorktrees() {
      return Array.from(this.statesById.values(), (e) => e.entry);
    }
    getRestartBlockers() {
      let e = this.getPendingWorktrees();
      return [
        ...(e.some(({ phase: e }) => e !== `failed` && e !== `worktree-ready`)
          ? [`worktree.creating`]
          : []),
        ...(e.some(
          ({ phase: e, launchMode: t, conversationStartResult: n }) =>
            e === `worktree-ready` &&
            t !== `create-stable-worktree` &&
            n == null,
        )
          ? [`worktree.starting-conversation`]
          : []),
      ];
    }
    async start(e) {
      let t = this.statesById.get(e);
      if (!t) return;
      let { entry: r } = t,
        i = {
          abortController: new AbortController(),
          cleanupRequested: !1,
          worktreeGitRoot: null,
          outputDecoder: new TextDecoder(),
          streamId: (0, _.randomUUID)(),
        };
      ((t.runtime = i),
        this.updateEntry(e, (e) => ({
          ...e,
          phase: `creating`,
          worktreeOutputText: `[info] Starting worktree creation
  `,
        })));
      try {
        let { worktreesRoot: a } = await this.options.getHostWorktreeSettings();
        if (i.abortController.signal.aborted) {
          this.cancelledWorktreeStreamIds.delete(i.streamId);
          return;
        }
        let o = await this.requestGitWorker({
          method: `create-worktree`,
          params: {
            hostConfig: this.options.hostConfig,
            operationSource: `worktree_pending_create`,
            cwd: n.Ns(r.sourceWorkspaceRoot),
            startingState: r.startingState,
            upstreamRefreshMode:
              this.options.settingsStore.getEffective(
                n.hs.upstreamRefreshMode.key,
              ) ?? `never`,
            localEnvironmentConfigPath: r.localEnvironmentConfigPath,
            streamId: i.streamId,
            pendingWorktreeId: r.id,
            allowSetupFailure: !0,
            worktreesRoot: a,
            useWorkspaceDir: Tr().workspaceDir,
            setUpSyncedBranch:
              r.launchMode !== `create-stable-worktree` && void 0,
          },
          signal: i.abortController.signal,
        });
        i.worktreeGitRoot = o.worktreeGitRoot;
        let s = await n.V(o.worktreeGitRoot);
        if (t.runtime !== i || i.abortController.signal.aborted) {
          this.forgetNewbornWorktreeStream(i.streamId);
          return;
        }
        if (o.setupError != null) {
          (ZZ().info(`[worktree-create] setup-failed`, {
            safe: {
              worktreeId: s,
              flow: `pending`,
              launchMode: r.launchMode,
              hasLocalEnvironment: r.localEnvironmentConfigPath != null,
            },
            sensitive: {},
          }),
            this.updateEntry(e, (e) => ({
              ...e,
              phase: `failed`,
              errorMessage: o.setupError,
              worktreeGitRoot: o.worktreeGitRoot,
              worktreeWorkspaceRoot: o.worktreeWorkspaceRoot,
              needsAttention: !0,
            })));
          let t = this.statesById.get(e);
          (t && (t.runtime = null), this.notifyFailure(e, o.setupError));
          return;
        }
        if (
          (this.updateEntry(e, (e) => ({
            ...e,
            phase: `worktree-ready`,
            worktreeGitRoot: o.worktreeGitRoot,
            worktreeWorkspaceRoot: o.worktreeWorkspaceRoot,
          })),
          ZZ().info(`[worktree-create] ready`, {
            safe: {
              worktreeId: s,
              flow: `pending`,
              launchMode: r.launchMode,
              hasLocalEnvironment: r.localEnvironmentConfigPath != null,
              wasNewbornProtected: this.newbornWorktreeRoots.has(
                o.worktreeGitRoot,
              ),
              protectedNewbornCount: this.newbornWorktreeRoots.size,
            },
            sensitive: {},
          }),
          r.launchMode === `create-stable-worktree`)
        ) {
          (this.forgetNewbornWorktreeStream(i.streamId),
            await this.addWorkspaceRoots(
              [o.worktreeWorkspaceRoot, ...n.Uo(r.sourceWorkspaceRoots)],
              r.label,
            ),
            this.statesById.delete(e),
            this.publish());
          return;
        }
        let c = this.statesById.get(e);
        (c?.runtime === i && (c.runtime = null), this.runCleanup());
      } catch (t) {
        ((i.worktreeGitRoot =
          i.worktreeGitRoot ??
          this.newbornWorktreeRootsByStreamId.get(i.streamId) ??
          null),
          this.forgetNewbornWorktreeStream(i.streamId));
        let n = this.statesById.get(e);
        if (
          (n?.runtime === i && (n.runtime = null),
          i.abortController.signal.aborted || ZQe(t))
        )
          return;
        let r = t instanceof Error ? t.message : String(t);
        (this.updateEntry(e, (e) =>
          $Z(
            { ...e, phase: `failed`, errorMessage: r, needsAttention: !0 },
            `[stderr] ${r}\n`,
            e.phase,
          ),
        ),
          this.notifyFailure(e, r));
      } finally {
        i.cleanupRequested &&
          i.worktreeGitRoot != null &&
          (this.cancelledWorktreeStreamIds.delete(i.streamId),
          await this.deleteWorktree(i.worktreeGitRoot, `new-branch-cleanup`));
      }
    }
    cancelWorktreeCreation(e, t) {
      ((e.cleanupRequested = !0),
        (e.worktreeGitRoot =
          t ??
          e.worktreeGitRoot ??
          this.newbornWorktreeRootsByStreamId.get(e.streamId) ??
          null),
        e.worktreeGitRoot ?? this.cancelledWorktreeStreamIds.add(e.streamId),
        e.abortController.abort());
    }
    async handleArchiveCleanup({ conversationId: e, cwd: t, signal: r }) {
      let i = n.Ns(t);
      if (i == null) return;
      let { worktreesRoot: a } = await this.options.getHostWorktreeSettings(),
        o = await this.requestGitWorker({
          method: `resolve-worktree-for-thread`,
          params: {
            cwd: i,
            conversationId: n.$u(e),
            hostConfig: this.options.hostConfig,
            operationSource: `worktree_archive_cleanup`,
            worktreesRoot: a,
          },
        }),
        s = new Set();
      o.worktreeGitRoot != null && s.add(o.worktreeGitRoot);
      let { worktrees: c } = await this.requestGitWorker({
        method: `codex-worktrees`,
        params: {
          hostConfig: this.options.hostConfig,
          operationSource: `worktree_archive_cleanup`,
          worktreesRoot: a,
        },
      });
      for (let t of (0, dp.default)(c, XZ))
        (r?.throwIfAborted(),
          await Promise.all(
            t.map(async (t) => {
              let { ownerThreadId: r } = await this.requestGitWorker({
                method: `worktree-owner`,
                params: {
                  cwd: n.Ns(t.dir),
                  hostConfig: this.options.hostConfig,
                  operationSource: `worktree_archive_cleanup`,
                },
              });
              r === e && s.add(t.dir);
            }),
          ));
      for (let t of s)
        (r?.throwIfAborted(), await this.cleanupArchivedWorktree(e, t, r));
    }
    async archiveAttachedWorktree(e, t, r) {
      let { worktreesRoot: i } = await this.options.getHostWorktreeSettings(),
        a = await this.requestGitWorker({
          method: `stable-metadata`,
          params: {
            cwd: n.Ns(t),
            hostConfig: this.options.hostConfig,
            operationSource: `worktree_archive_cleanup`,
          },
        });
      if (a == null)
        throw Error(`Could not verify the task's primary checkout.`);
      if (n.gl(a.root, r))
        throw Error(`The task's primary checkout cannot be removed.`);
      let { worktrees: o } = await this.requestGitWorker({
        method: `codex-worktrees`,
        params: {
          hostConfig: this.options.hostConfig,
          operationSource: `worktree_archive_cleanup`,
          worktreesRoot: i,
        },
      });
      if (!o.some((e) => e.dir === r)) return;
      let { ownerThreadId: s } = await this.requestGitWorker({
        method: `worktree-owner`,
        params: {
          cwd: n.Ns(r),
          hostConfig: this.options.hostConfig,
          operationSource: `worktree_archive_cleanup`,
        },
      });
      s === e && (await this.cleanupArchivedWorktree(e, r, void 0));
    }
    async cleanupArchivedWorktree(e, t, r) {
      if (
        YZ({
          globalState: this.options.globalState,
          hostId: this.options.hostId,
          worktreeDir: String(t),
        })
      )
        return;
      let i = await n.Gi({
        archivedThreadId: e,
        listThreads: (e) =>
          this.options.appServerConnection.listThreads(e, {
            priority: `background`,
            source: `thread_list`,
          }),
        worktreeRoot: t,
      });
      if ((r?.throwIfAborted(), i != null))
        try {
          (await this.setOwnerThread({
            worktree: t,
            conversationId: n.$u(i.id),
          }),
            ZZ().info(`[worktree-archive-cleanup] owner-transferred`, {
              safe: {
                worktreeId: await n.V(t),
                archivedThreadId: e,
                replacementOwnerThreadId: i.id,
              },
              sensitive: {},
            }));
          return;
        } catch (r) {
          ZZ().warning(`[worktree-archive-cleanup] owner-transfer-failed`, {
            safe: {
              worktreeId: await n.V(t),
              archivedThreadId: e,
              replacementOwnerThreadId: i.id,
            },
            sensitive: { error: r },
          });
          return;
        }
      await this.deleteWorktree(t, `archive-cleanup`);
    }
    async createManagedWorktree({
      hostId: e,
      cwd: t,
      startingState: r,
      name: i,
      localEnvironmentConfigPath: a,
      streamId: o,
    }) {
      try {
        let { worktreesRoot: s } = await this.options.getHostWorktreeSettings(),
          c = await this.requestGitWorker({
            method: `create-worktree`,
            params: {
              hostConfig: this.options.getHostConfigForHostId(e),
              operationSource: `worktree_managed_create`,
              cwd: n.Ns(t),
              startingState: r,
              name: i,
              upstreamRefreshMode:
                this.options.settingsStore.getEffective(
                  n.hs.upstreamRefreshMode.key,
                ) ?? `never`,
              localEnvironmentConfigPath: a,
              streamId: o,
              worktreesRoot: s,
              useWorkspaceDir: Tr().workspaceDir,
            },
          }),
          l = this.newbornWorktreeRoots.has(c.worktreeGitRoot);
        return (
          this.newbornWorktreeRoots.add(c.worktreeGitRoot),
          ZZ().info(`[worktree-create] ready`, {
            safe: {
              worktreeId: await n.V(c.worktreeGitRoot),
              flow: `managed`,
              hasLocalEnvironment: a != null,
              wasNewbornProtected: l,
              protectedNewbornCount: this.newbornWorktreeRoots.size,
            },
            sensitive: {},
          }),
          this.runCleanup(),
          c
        );
      } catch (e) {
        throw (this.forgetNewbornWorktreeStream(o), e);
      }
    }
    async deleteWorktree(e, t) {
      (this.forgetNewbornWorktreeRoot(e),
        await this.requestGitWorker({
          method: `delete-worktree`,
          params: {
            worktree: n.Ps(e),
            force: !0,
            reason: t,
            hostConfig: this.options.hostConfig,
            operationSource: QQe(t),
          },
        }),
        this.options.windowManager.sendMessageToAllWindows({
          type: `worktrees-reload-requested`,
          hostId: this.options.hostId,
        }),
        this.runCleanup());
    }
    async setOwnerThread({ worktree: e, conversationId: t }) {
      let r = n.Ps(e);
      (await this.requestGitWorker({
        method: `set-worktree-owner-thread`,
        params: {
          worktree: r,
          conversationId: t,
          hostConfig: this.options.hostConfig,
          operationSource: `worktree_set_owner_thread`,
        },
      }),
        ZZ().info(`[worktree-create] owner-thread-set`, {
          safe: { worktreeId: await n.V(r), ownerThreadId: t },
          sensitive: {},
        }),
        this.forgetNewbornWorktreeRoot(e));
    }
    requestCleanup() {
      this.runCleanup();
    }
    async runCleanup() {
      if (((this.cleanupPending = !0), !this.cleanupRunning)) {
        this.cleanupRunning = !0;
        try {
          for (; this.cleanupPending;) {
            this.cleanupPending = !1;
            try {
              await this.runCleanupOnce();
            } catch (e) {
              ZZ().warning(`[worktree-cleanup] run-failed`, {
                safe: {},
                sensitive: { error: e },
              });
            }
          }
        } finally {
          this.cleanupRunning = !1;
        }
      }
    }
    async runCleanupOnce() {
      let {
        autoCleanupEnabled: e,
        keepCount: t,
        worktreesRoot: r,
      } = await this.options.getHostWorktreeSettings();
      if (!e) return;
      let i = this.options.executionHost;
      await n.B(i, r);
      let { worktrees: a } = await this.requestGitWorker({
        method: `codex-worktrees`,
        params: {
          hostConfig: this.options.hostConfig,
          operationSource: `worktree_auto_cleanup`,
          worktreesRoot: r,
        },
      });
      if (a.length <= t) return;
      let o = KQe({
          globalState: this.options.globalState,
          hostId: this.options.hostId,
          worktrees: a,
        }),
        s =
          this.options.getPinnedThreadIds == null
            ? JZ(this.options.globalState)
            : await this.options.getPinnedThreadIds(),
        c = new Map(),
        l = await Promise.all(
          a.map(async (e) => {
            let t = null,
              r = !1;
            try {
              ({ ownerThreadId: t } = await this.requestGitWorker({
                method: `worktree-owner`,
                params: {
                  cwd: n.Ns(e.dir),
                  hostConfig: this.options.hostConfig,
                  operationSource: `worktree_auto_cleanup`,
                },
              }));
            } catch {
              ((t = null), (r = !0));
            }
            c.set(String(e.dir), r);
            let a = null;
            try {
              let t = await n.Di.stat(e.dir, i);
              a = t.birthtimeMs > 0 ? t.birthtimeMs : null;
            } catch {
              a = null;
            }
            return { worktree: e, ownerThreadId: t, createdAtMs: a };
          }),
        ),
        u = Array.from(
          new Set([
            ...l.map((e) => e.ownerThreadId).filter((e) => e != null),
            ...s,
          ]),
        ),
        d = await qZ(this.options.appServerConnection, i, u);
      if (UQe({ pinnedThreadIds: s, threadMetadataById: d })) {
        ZZ().info(
          `[worktree-cleanup] skip-pinned-thread-metadata-unavailable`,
          {
            safe: { pinnedThreadCount: s.length },
            sensitive: {},
          },
        );
        return;
      }
      let f = HQe({ pinnedThreadIds: s, threadMetadataById: d, worktrees: a }),
        p = Array.from(
          this.statesById.values(),
          (e) => e.entry.worktreeGitRoot,
        ).filter((e) => e != null),
        m = Array.from(this.newbornWorktreeRoots),
        h = Ree({
          records: l,
          keepCount: t,
          threadMetadataById: d,
          pinnedThreadIds: s,
          protectPreMigrationOwnerlessWorktrees: GQe(this.options.globalState),
          protectedWorktreeDirs: Array.from(new Set([...o, ...f, ...p, ...m])),
        }),
        g = new Set(o),
        _ = h.candidates.filter((e) => !g.has(String(e.worktree.dir)));
      ZZ().info(`[worktree-cleanup] plan-summary`, {
        safe: {
          totalWorktrees: a.length,
          keepCount: t,
          protectedWorkspaceRootCount: o.length,
          protectedPinnedThreadCount: f.length,
          protectedPendingCount: p.length,
          protectedNewbornCount: m.length,
          ownerlessCount: l.filter((e) => e.ownerThreadId == null).length,
          candidatesCount: h.candidates.length,
          deletesPlanned: _.length,
        },
        sensitive: {},
      });
      let v = new Set([...o, ...f, ...p, ...m]),
        y = _.slice(0, 20);
      await Promise.all(
        y.map(async (e) => {
          let t = String(e.worktree.dir),
            r = c.get(t) === !0,
            i = e.ownerThreadId == null ? null : (d[e.ownerThreadId] ?? null);
          ZZ().info(`[worktree-cleanup] delete-candidate`, {
            safe: {
              worktreeId: await n.V(e.worktree.dir),
              reason: e.ownerThreadId == null ? `ownerless` : `owned`,
              ownerThreadId: e.ownerThreadId,
              ownerThreadUpdatedAtMs: i?.updatedAtMs ?? null,
              ownerThreadInProgress: i?.isInProgress ?? !1,
              createdAtMs: e.createdAtMs,
              ownerReadFailed: r,
              isProtected: v.has(t),
            },
            sensitive: {},
          });
        }),
      );
      for (let e of (0, dp.default)(_, XZ)) {
        if (
          (this.options.getPinnedThreadIds == null
            ? JZ(this.options.globalState)
            : await this.options.getPinnedThreadIds()
          ).some((e) => !s.includes(e))
        ) {
          this.cleanupPending = !0;
          break;
        }
        let t = await qZ(
            this.options.appServerConnection,
            i,
            e.map((e) => e.ownerThreadId).filter((e) => e != null),
          ),
          n = new Set(
            Array.from(
              this.statesById.values(),
              (e) => e.entry.worktreeGitRoot,
            ),
          );
        (
          await Promise.allSettled(
            e
              .filter((e) => {
                let r = e.worktree.dir;
                return (
                  !YZ({
                    globalState: this.options.globalState,
                    hostId: this.options.hostId,
                    worktreeDir: r,
                  }) &&
                  !n.has(r) &&
                  !this.newbornWorktreeRoots.has(r) &&
                  (e.ownerThreadId == null ||
                    t[e.ownerThreadId]?.isInProgress !== !0)
                );
              })
              .map(async (e) => {
                await this.requestGitWorker({
                  method: `delete-worktree`,
                  params: {
                    worktree: e.worktree.dir,
                    force: !0,
                    reason: `startup-cleanup`,
                    hostConfig: this.options.hostConfig,
                    operationSource: `worktree_auto_cleanup`,
                  },
                });
              }),
          )
        ).some((e) => e.status === `fulfilled`) &&
          this.options.windowManager.sendMessageToAllWindows({
            type: `worktrees-reload-requested`,
            hostId: this.options.hostId,
          });
      }
    }
    async handleCreateWorktreePath(e) {
      if (e.hostId === this.options.hostId) {
        if (this.cancelledWorktreeStreamIds.delete(e.streamId)) {
          try {
            await this.deleteWorktree(e.worktreeGitRoot, `new-branch-cleanup`);
          } catch (e) {
            ZZ().warning(`Failed to delete cancelled worktree allocation`, {
              safe: {},
              sensitive: { error: e },
            });
          }
          return;
        }
        (this.newbornWorktreeRoots.add(e.worktreeGitRoot),
          this.newbornWorktreeRootsByStreamId.set(
            e.streamId,
            e.worktreeGitRoot,
          ),
          ZZ().info(`[worktree-create] path-allocated`, {
            safe: {
              worktreeId: await n.V(e.worktreeGitRoot),
              protectedNewbornCount: this.newbornWorktreeRoots.size,
            },
            sensitive: {},
          }));
      }
    }
    forgetNewbornWorktreeStream(e) {
      let t = this.newbornWorktreeRootsByStreamId.get(e);
      t != null &&
        (this.newbornWorktreeRootsByStreamId.delete(e),
        this.newbornWorktreeRoots.delete(t));
    }
    forgetNewbornWorktreeRoot(e) {
      this.newbornWorktreeRoots.delete(e);
      for (let [t, n] of this.newbornWorktreeRootsByStreamId)
        n === e && this.newbornWorktreeRootsByStreamId.delete(t);
    }
    handleCreateWorktreeStream(e) {
      let t = Array.from(this.statesById.entries()).find(
        ([, t]) => t.runtime?.streamId === e.streamId,
      );
      if (!t) return;
      let [n, r] = t;
      if (r.runtime == null) return;
      let i = r.runtime.outputDecoder.decode(e.data, { stream: !0 });
      this.updateEntry(n, (e) => $Z(e, i, e.phase));
    }
    handleCreateWorktreeSetupStarted(e) {
      let t = Array.from(this.statesById.entries()).find(
        ([, t]) => t.runtime?.streamId === e.streamId,
      );
      t &&
        this.updateEntry(t[0], (e) =>
          e.phase === `creating` ? { ...e, phase: `setting-up` } : e,
        );
    }
    requestGitWorker(e) {
      return this.options.requestGitWorker(e);
    }
    async addWorkspaceRoots(e, t) {
      this.options.hostConfig.kind === `local` &&
        (await this.options.assignUnassignedThreadsBeforeProjectRootsChange(e));
      let r = await this.options.createProjectForRoots(e, t);
      r != null &&
        (this.options.windowManager.sendMessageToAllWindows({
          type: `global-state-updated`,
          keys: [n.iu.LOCAL_PROJECTS, n.iu.PROJECT_ORDER],
        }),
        Nr(this.options.globalState) ??
          (Lr(this.options.globalState, { type: `local`, projectId: r.id }),
          this.options.windowManager.sendMessageToAllWindows({
            type: `global-state-updated`,
            keys: [n.iu.SELECTED_PROJECT],
          })),
        this.options.windowManager.sendMessageToAllWindows({
          type: `workspace-root-options-updated`,
        }));
    }
    notifyFailure(e, t) {
      let r = this.options.settingsStore.getEffective(n.Na.turnMode.key);
      if (r === `off`) return;
      let i = this.options.windowManager.getPrimaryWindow();
      if (!i || (r === `unfocused` && i.isFocused())) return;
      let a = {
        id: `worktree-init-failed-${e}`,
        kind: `turn-complete`,
        title: `Worktree setup failed`,
        body: t,
      };
      this.options.desktopNotificationManager.showNotification(
        a,
        i.webContents,
        () => {},
      );
    }
    publish() {
      let e = Array.from(this.statesById.values(), (e) => e.entry).sort(
        (e, t) => e.createdAt - t.createdAt,
      );
      this.options.setSharedPendingWorktrees(e);
    }
    updateEntry(e, t) {
      let n = this.statesById.get(e);
      n && ((n.entry = t(n.entry)), this.publish());
    }
  }

  return WorktreeService;
}

if (typeof module !== `undefined`)
  module.exports = { createWorktreeServiceClass };
