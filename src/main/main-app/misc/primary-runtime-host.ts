// @ts-nocheck

/** Owns primary-runtime install, diagnostics, feature cache, update polling, and restore lifecycle. */
export function createPrimaryRuntimeHostClass(
  dependencies: Record<string, any>,
) {
  const {
    runtime: n,
    logger: r,
    electron: l,
    defaultHostId: J,
    UpdatePoller: O6e,
    installRuntime: Q0,
    cancelInstalls: Y0,
    assertLocalHost: u2,
    diagnoseRuntime: c2,
    executeDependencyTool: D6e,
    readFeatureEnabled: Z0,
    readDependencies: F6e,
    repairRuntime: I6e,
    buildRuntime: a,
    restoreRuntime: N6e,
    retryIntervalMs: K0,
  } = dependencies;

  return class PrimaryRuntimeHost extends n.Uf {
    appServerConnectionRegistry;
    errorReporter;
    sharedObjectRepository;
    windowManager;
    getInternalUpdateCdnRequestHeaders;
    logger = r.i(`primary-runtime-host`);
    workspaceDependenciesFeatureEnabledByHostId = new Map();
    updatePoller;
    constructor(e, t, r, i, a, o) {
      (super(),
        (this.appServerConnectionRegistry = e),
        (this.errorReporter = t),
        (this.sharedObjectRepository = i),
        (this.windowManager = a),
        (this.getInternalUpdateCdnRequestHeaders = o),
        (this.updatePoller = new O6e({
          appServerConnectionRegistry: e,
          errorReporter: t,
          getInternalUpdateCdnRequestHeaders: o,
          getCacheStatus: (e) =>
            n.Cn({
              ...e,
              fetchImpl: (e, t) =>
                l.net.fetch(e instanceof URL ? e.toString() : e, t),
            }),
          getTarget: n.bn,
          globalState: r,
          hostId: J,
          installForConnection: Q0,
          isWorkspaceDependenciesFeatureEnabled: () =>
            this.isWorkspaceDependenciesFeatureEnabled(J),
          onProgress: (e) => {
            this.#i(J, e);
          },
          sharedObjectRepository: i,
        })));
    }
    getInstalledBundleVersion() {
      return n.xn();
    }
    install({ hostId: e, release: t }) {
      return this.#r(e, t);
    }
    cancelInstall({ hostId: e }) {
      return (u2(e), { canceled: Y0() });
    }
    async diagnoseDependencies({ hostId: e, probeExecutables: t = !1 }) {
      u2(e);
      let n = await c2({ hostId: e, probeExecutables: t });
      return {
        artifactToolVersion: n.artifactToolVersion,
        bundleVersion: n.bundleVersion,
        installed: n.installed,
        libreOfficeVersion: n.libreOfficeVersion,
        problems: n.problems,
      };
    }
    executeLoadDependenciesTool(e) {
      return D6e(e, async () => {
        let { hostId: t } = e;
        return (await Z0(this.appServerConnectionRegistry.getConnection(t)))
          ? F6e({ hostId: t })
          : null;
      });
    }
    finishInstall({ hostId: e, release: t }) {
      return this.#r(e, t);
    }
    getUpdateStatus() {
      return this.updatePoller.getStatus();
    }
    runUpdateNow({ release: e }) {
      return this.updatePoller.runNow(e);
    }
    async resetDependencies({ hostId: e, release: t }) {
      return (
        u2(e),
        await this.#n(e),
        I6e({
          connection: this.appServerConnectionRegistry.getConnection(e),
          errorReporter: this.errorReporter,
          getInternalUpdateCdnRequestHeaders:
            this.getInternalUpdateCdnRequestHeaders,
          onProgress: (t) => {
            this.#i(e, t);
          },
          release: t,
          runtimeConfig: this.sharedObjectRepository.get(
            `codex_runtimes_config`,
          ),
        })
      );
    }
    isWorkspaceDependenciesFeatureEnabled = (e) => {
      let t = this.workspaceDependenciesFeatureEnabledByHostId.get(e);
      if (t != null) return t;
      let n = Z0(this.appServerConnectionRegistry.getConnection(e)).catch(
        (t) => {
          throw (this.workspaceDependenciesFeatureEnabledByHostId.delete(e), t);
        },
      );
      return (this.workspaceDependenciesFeatureEnabledByHostId.set(e, n), n);
    };
    startUpdatePolling = () => {
      let e =
          process.env.BUILD_FLAVOR === `dev` &&
          process.env.CODEX_ELECTRON_PRIMARY_RUNTIME_UPDATE_MODE === `manual`,
        t = this.#e(!e);
      if (e)
        return (
          this.logger().info(`primary_runtime_auto_update_disabled`, {
            safe: { reason: `manual-update-mode` },
            sensitive: {},
          }),
          t
        );
      let n = () => {
          this.updatePoller.shouldPoll() && this.updatePoller.pollIfDue();
        },
        r = this.sharedObjectRepository.addSubscriber((e, t) => {
          (e === `statsig_default_enable_features` &&
            this.workspaceDependenciesFeatureEnabledByHostId.clear(),
            this.updatePoller.shouldTickForSharedObjectUpdate(e, t) && n());
        });
      n();
      let i = setInterval(n, K0);
      return (
        i.unref(),
        () => {
          (clearInterval(i), r(), t());
        }
      );
    };
    #e(e) {
      if (!a.i(a.in.resolve())) return () => void 0;
      let t = () => void 0,
        n = this.appServerConnectionRegistry.subscribe((n) => {
          n.hostId === `local` &&
            (t(),
            (t = n.type === `added` ? this.#t(n.connection, e) : () => void 0));
        });
      return () => {
        (n(), t());
      };
    }
    #t(e, t) {
      let n = new AbortController(),
        r = !1,
        i = () => {
          ((r = !1),
            n.abort(),
            (n = new AbortController()),
            Y0({ windowsFrameworksOnly: !0 }));
        },
        o = () => {
          if (((r = !1), e.getConnectionState() !== `connected`)) return;
          let { signal: i } = n;
          N6e(e, i)
            .then(() => {
              !i.aborted && t && this.updatePoller.requestImmediateCheck();
            })
            .catch((e) => {
              i.aborted ||
                ((r = !0),
                this.logger().warning(`primary_runtime_restore_failed`, {
                  safe: {},
                  sensitive: { error: e },
                }));
            });
        },
        s = () => {
          (i(), o());
        },
        c = e.registerInternalConnectionStateHandler(s),
        l = a.a(s),
        u = setInterval(() => {
          r && o();
        }, K0);
      return (
        u.unref(),
        s(),
        () => {
          (clearInterval(u), c(), l(), i());
        }
      );
    }
    async #n(e) {
      if (!(await this.isWorkspaceDependenciesFeatureEnabled(e)))
        throw Error(`Codex dependencies are disabled in settings.`);
    }
    async #r(e, t) {
      return (
        u2(e),
        await this.#n(e),
        Q0({
          connection: this.appServerConnectionRegistry.getConnection(e),
          errorReporter: this.errorReporter,
          getInternalUpdateCdnRequestHeaders:
            this.getInternalUpdateCdnRequestHeaders,
          onProgress: (t) => {
            this.#i(e, t);
          },
          release: t,
          runtimeConfig: this.sharedObjectRepository.get(
            `codex_runtimes_config`,
          ),
        })
      );
    }
    #i(e, t) {
      this.windowManager.sendMessageToAllWindows({
        type: `primary-runtime-install-progress`,
        hostId: e,
        progress: t,
      });
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createPrimaryRuntimeHostClass };
