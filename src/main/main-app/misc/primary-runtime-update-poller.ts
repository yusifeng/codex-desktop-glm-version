// @ts-nocheck

/** Owns primary-runtime startup/scheduled/manual update polling and concurrency. */
export function createPrimaryRuntimeUpdatePollerClass(
  dependencies: Record<string, any>,
) {
  const {
    runtime: n,
    logger: W0,
    updateIntervalMs: G0,
    isFeatureEnabled: X0,
    requiresWindowsFramework: s2,
    getWindowsRelease: o2,
  } = dependencies;

  return class PrimaryRuntimeUpdatePoller {
    options;
    startupChecked = !1;
    nextUpdateAtMs = null;
    running = !1;
    checkRequested = !1;
    constructor(e) {
      this.options = e;
    }
    shouldPoll() {
      return this.getStaticDisabledReason() == null;
    }
    requestImmediateCheck() {
      ((this.checkRequested = !0), this.pollIfDue());
    }
    shouldTickForSharedObjectUpdate(e, t) {
      return (
        (e === `statsig_default_enable_features` && X0(t)) ||
        e === `codex_runtimes_config`
      );
    }
    async getStatus() {
      let e = await this.getDisabledReason();
      return {
        disabledReason: e,
        enabled: e == null,
        isRunning: this.running,
        nextRunAt: this.nextUpdateAtMs,
        startupChecked: this.startupChecked,
      };
    }
    async pollIfDue() {
      if (this.getStaticDisabledReason() != null) return;
      let e = Date.now(),
        t =
          this.checkRequested ||
          (this.nextUpdateAtMs != null && e >= this.nextUpdateAtMs);
      if ((this.startupChecked && !t) || this.running) return;
      let n = !this.startupChecked;
      ((this.checkRequested = !1), (this.running = !0));
      try {
        if ((await this.getDisabledReason()) != null) {
          ((this.startupChecked = !0),
            (this.nextUpdateAtMs = this.getNextUpdateAtMs(e)));
          return;
        }
        let r = this.options.getTarget(),
          i = s2(r),
          a = i ? o2() : `latest`,
          o = await this.options.getCacheStatus({
            requireWindowsFramework: i,
            release: a,
            runtimeInstallConfig: this.getInstallConfig(),
            target: r,
          });
        if (this.checkRequested) return;
        if (!this.startupChecked) {
          if (
            ((this.startupChecked = !0),
            (this.nextUpdateAtMs = this.getNextUpdateAtMs(e)),
            o.status !== `missing` && o.status !== `outdated`)
          )
            return;
        } else if (!t) return;
        if (
          ((this.nextUpdateAtMs = this.getNextUpdateAtMs(e)),
          o.status === `current` || o.status === `unsupported`)
        )
          return;
        await this.installUpdate(a, n ? `startup_missing` : `scheduled_update`);
      } catch (e) {
        W0().warning(`primary_runtime_update_poll_failed`, {
          safe: {},
          sensitive: { error: e },
        });
      } finally {
        ((this.running = !1), this.checkRequested && this.pollIfDue());
      }
    }
    async runNow(e) {
      let t = await this.getDisabledReason();
      if (t != null)
        return {
          bundleVersion: null,
          nextRunAt: this.nextUpdateAtMs,
          reason: t,
          status: `skipped`,
        };
      if (this.running)
        return {
          bundleVersion: null,
          nextRunAt: this.nextUpdateAtMs,
          reason: `already-running`,
          status: `skipped`,
        };
      this.running = !0;
      try {
        let t = this.options.getTarget(),
          n = await this.options.getCacheStatus({
            requireWindowsFramework: s2(t, e),
            release: e,
            runtimeInstallConfig: this.getInstallConfig(),
            target: t,
          });
        if (n.status === `current`)
          return {
            bundleVersion: n.installedBundleVersion,
            nextRunAt: this.nextUpdateAtMs,
            reason: `current`,
            status: `already-current`,
          };
        if (n.status === `unsupported`)
          return {
            bundleVersion: null,
            nextRunAt: this.nextUpdateAtMs,
            reason: `unsupported-windows-version`,
            status: `skipped`,
          };
        let r = await this.installUpdate(e, `manual_update`);
        return {
          bundleVersion: r.bundleVersion,
          nextRunAt: this.nextUpdateAtMs,
          reason: r.status === `already-current` ? `current` : null,
          status: r.status,
        };
      } finally {
        ((this.running = !1), this.checkRequested && this.pollIfDue());
      }
    }
    getStaticDisabledReason() {
      return this.options.hostId === `local`
        ? this.options.sharedObjectRepository?.get(`codex_runtimes_config`) ==
          null
          ? `runtime-config-missing`
          : X0(
                this.options.sharedObjectRepository?.get(
                  `statsig_default_enable_features`,
                ),
              )
            ? null
            : `feature-gate-disabled`
        : `not-local-host`;
    }
    async getDisabledReason() {
      let e = this.getStaticDisabledReason();
      if (e != null) return e;
      try {
        return (await this.options.isWorkspaceDependenciesFeatureEnabled())
          ? null
          : `feature-gate-disabled`;
      } catch (e) {
        return (
          W0().warning(`workspace_dependencies_feature_check_failed`, {
            safe: {},
            sensitive: { error: e },
          }),
          `feature-gate-disabled`
        );
      }
    }
    getInstallConfig() {
      return (
        this.options.sharedObjectRepository?.get(`codex_runtimes_config`)
          ?.runtimes[n.yn] ?? n.Ka
      );
    }
    getNextUpdateAtMs(e) {
      let t = this.getJitterMs(),
        n = Math.floor(e / G0) * G0 + t;
      return n > e ? n : n + G0;
    }
    getJitterMs() {
      let e = this.options.globalState.get(
        n.iu.PRIMARY_RUNTIME_UPDATE_JITTER_MS,
      );
      if (typeof e == `number` && Number.isInteger(e) && e >= 0 && e < G0)
        return e;
      let t = Math.floor(Math.random() * G0);
      return (
        this.options.globalState.set(n.iu.PRIMARY_RUNTIME_UPDATE_JITTER_MS, t),
        t
      );
    }
    async installUpdate(e, t) {
      return this.options.installForConnection({
        connection: this.options.appServerConnectionRegistry.getConnection(
          this.options.hostId,
        ),
        errorReporter: this.options.errorReporter,
        getInternalUpdateCdnRequestHeaders:
          this.options.getInternalUpdateCdnRequestHeaders,
        onProgress: this.options.onProgress,
        release: e,
        runtimeConfig: this.options.sharedObjectRepository?.get(
          `codex_runtimes_config`,
        ),
        trigger: t,
      });
    }
  };
}

if (typeof module !== "undefined")
  module.exports = { createPrimaryRuntimeUpdatePollerClass };
