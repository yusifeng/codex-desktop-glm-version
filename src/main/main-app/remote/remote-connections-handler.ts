// @ts-nocheck

/** Owns SSH, WSL, and remote-control connection catalogs, refreshes, and connection lifecycle. */
export function createRemoteConnectionsHandlerClass(dependencies: Record<string, any>) {
  const {
    runtime: n,
    createLogger,
    deepEqual,
    discoverSshAliases: Q2,
    resolveSshAlias: $2,
    authorizeRemoteControlEnvironments,
    renameRemoteControlEnvironment,
    deleteRemoteControlEnvironment,
    listRemoteControlEnvironments,
    checkRemoteControlAuthorization,
    requestRemoteControlEnrollmentStepUpToken: y5e,
    RemoteControlFeatureUnavailableError,
    RemoteControlPermissionError,
    RemoteControlAuthError,
    getSshHostConfig,
    RemoteCodexInstaller,
    normalizeRemotePath: zn,
    randomUUID,
    homeDirectory,
    pathJoin,
    setTimer,
  } = dependencies;

var l4 = createLogger(`remote-connections/window-context`),
  E5e = 250,
  D5e = class RemoteConnectionsHandler {
    appState;
    sharedObjectRepository;
    owningHostId;
    appServerConnectionRegistry;
    desktopApiOptions;
    desktopAuthAppServerClient;
    remoteControlDeviceKeyClient;
    getHostConfigForHostId;
    getAppServerClientForHostId;
    createAndRegisterRemoteConnection;
    disposeRemoteConnection;
    reconcileAuthoritativeCatalogHosts;
    remoteConnectionsByHostId = new Map();
    remoteControlRefreshGeneration = 0;
    remoteSshRefreshGeneration = 0;
    latestRemoteSshRefresh = Promise.resolve({ remoteConnections: [] });
    remoteControlEnableRefresh = null;
    wslRefreshGeneration = 0;
    latestWslRefresh = Promise.resolve([]);
    shouldLoadRemoteControlConnections = !1;
    shouldLoadWslConnections = !1;
    constructor(e, t, n, r, i, a, o, s, c, l, u, d) {
      ((this.appState = e),
        (this.sharedObjectRepository = t),
        (this.owningHostId = n),
        (this.appServerConnectionRegistry = r),
        (this.desktopApiOptions = i),
        (this.desktopAuthAppServerClient = a),
        (this.remoteControlDeviceKeyClient = o),
        (this.getHostConfigForHostId = s),
        (this.getAppServerClientForHostId = c),
        (this.createAndRegisterRemoteConnection = l),
        (this.disposeRemoteConnection = u),
        (this.reconcileAuthoritativeCatalogHosts = d));
    }
    reconcileRemoteConnections(e) {
      let t = this.remoteConnectionsByHostId.size,
        n = 0,
        r = new Map();
      for (let t of e) t.hostId !== this.owningHostId && r.set(t.hostId, t);
      for (let e of r.values()) {
        let t = e.hostId,
          r = this.remoteConnectionsByHostId.get(t),
          i = this.appServerConnectionRegistry.getMaybeConnection(t);
        if (!e.autoConnect) {
          i != null && this.disposeRemoteConnection(t);
          continue;
        }
        if (!(i != null && A5e(r, e))) {
          i != null && this.disposeRemoteConnection(t);
          try {
            this.appServerConnectionRegistry.addConnection(
              t,
              this.createAndRegisterRemoteConnection(e),
            );
          } catch (e) {
            ((n += 1),
              l4().warning(`reconcile_create_connection_failed`, {
                safe: {},
                sensitive: { error: e, hostId: t },
              }));
          }
        }
      }
      for (let e of this.remoteConnectionsByHostId.keys())
        r.has(e) || this.disposeRemoteConnection(e);
      this.remoteConnectionsByHostId.clear();
      for (let [e, t] of r) this.remoteConnectionsByHostId.set(e, t);
      l4().info(`reconcile_completed`, {
        safe: { nextConnectionCount: r.size, previousConnectionCount: t, creationFailureCount: n },
        sensitive: {},
      });
    }
    handleLocalRemoteControlIdentityChanged() {
      (this.removeLocalRemoteControlConnection(),
        this.shouldLoadRemoteControlConnections &&
          this.refreshRemoteControlConnections().catch((e) => {
            l4().warning(`refresh_remote_control_for_local_identity_failed`, {
              safe: {},
              sensitive: { error: e },
            });
          }));
    }
    refreshRemoteConnections() {
      let e = ++this.remoteSshRefreshGeneration;
      return (
        (this.latestRemoteSshRefresh = this.refreshRemoteSshConnections(e)),
        this.latestRemoteSshRefresh
      );
    }
    async refreshRemoteSshConnections(e) {
      let t = this.remoteConnectionsByHostId.size;
      l4().info(`refresh_started`, { safe: { previousConnectionCount: t }, sensitive: {} });
      let n = await this.loadRemoteConnections();
      if (e !== this.remoteSshRefreshGeneration) return this.latestRemoteSshRefresh;
      (this.reconcileAuthoritativeCatalogHosts?.(
        `ssh`,
        new Set(this.loadSavedRemoteConnections().map((e) => e.hostId)),
      ),
        deepEqual(this.sharedObjectRepository.get(`remote_ssh_connections`), n)
          ? this.reconcileRemoteConnections(this.getSharedRemoteConnections())
          : this.sharedObjectRepository.set(`remote_ssh_connections`, n));
      let r = O5e(n);
      return (
        l4().info(`refresh_completed`, {
          safe: {
            previousConnectionCount: t,
            nextConnectionCount: n.length,
            discoveredConnectionCount: r.discovered,
            codexManagedConnectionCount: r.codexManaged,
            autoConnectConnectionCount: n.filter((e) => e.autoConnect).length,
          },
          sensitive: {},
        }),
        { remoteConnections: this.getSharedRemoteConnections() }
      );
    }
    discoverRemoteConnections() {
      return { sshAliases: Q2(u4()) };
    }
    async refreshRemoteControlConnections() {
      let e = ++this.remoteControlRefreshGeneration;
      if (!this.shouldLoadRemoteControlConnections)
        return (
          this.sharedObjectRepository.set(`remote_control_connections`, []),
          this.sharedObjectRepository.set(`remote_control_connections_state`, {
            available: !1,
            accessRequired: !1,
            authRequired: !1,
            clientAuthorized: !1,
          }),
          { remoteControlConnections: [] }
        );
      let t = this.sharedObjectRepository.get(`remote_control_connections`),
        n =
          this.sharedObjectRepository.get(`remote_control_connections_state`)?.clientAuthorized ===
          !0,
        r = t?.length ?? 0;
      l4().info(`refresh_remote_control_started`, {
        safe: { previousConnectionCount: r },
        sensitive: {},
      });
      let i = await this.loadRemoteControlConnections(e);
      if (e !== this.remoteControlRefreshGeneration)
        return {
          remoteControlConnections:
            this.sharedObjectRepository.get(`remote_control_connections`) ?? [],
        };
      let a = this.filterLocalRemoteControlConnection(i).map((e) => ({
        ...e,
        autoConnect: this.getAutoConnectForRemoteConnection(e),
      }));
      this.sharedObjectRepository.set(`remote_control_connections`, a);
      let o =
        this.sharedObjectRepository.get(`remote_control_connections_state`)?.clientAuthorized ===
        !0;
      return (
        o &&
          this.reconcileAuthoritativeCatalogHosts?.(
            `remote-control`,
            new Set(a.map((e) => e.hostId)),
          ),
        o
          ? this.connectRemoteConnectionsAndLogFailures(
              a.filter((e) => e.autoConnect).map((e) => e.hostId),
            )
          : n &&
            (await Promise.all((t ?? []).map((e) => this.disconnectRemoteConnection(e.hostId)))),
        l4().info(`refresh_remote_control_completed`, {
          safe: {
            previousConnectionCount: r,
            nextConnectionCount: a.length,
            autoConnectConnectionCount: a.filter((e) => e.autoConnect).length,
          },
          sensitive: {},
        }),
        { remoteControlConnections: a }
      );
    }
    async setRemoteControlConnectionsEnabled(e) {
      if (this.shouldLoadRemoteControlConnections === e) {
        let e = this.sharedObjectRepository.get(`remote_control_connections`);
        if (e != null) return { remoteControlConnections: e };
        if (this.remoteControlEnableRefresh != null) return this.remoteControlEnableRefresh;
      }
      this.shouldLoadRemoteControlConnections = e;
      let t = this.refreshRemoteControlConnections();
      this.remoteControlEnableRefresh = t;
      try {
        return await t;
      } finally {
        this.remoteControlEnableRefresh === t && (this.remoteControlEnableRefresh = null);
      }
    }
    async setRemoteWslConnectionsEnabled(e) {
      if (this.shouldLoadWslConnections === e) {
        let e = this.sharedObjectRepository.get(`remote_wsl_connections`);
        if (e != null) return { remoteWslConnections: e };
      }
      return ((this.shouldLoadWslConnections = e), this.refreshRemoteWslConnections());
    }
    async refreshRemoteWslConnections() {
      let e = ++this.wslRefreshGeneration,
        t = this.runRemoteWslRefresh(e);
      return (
        (this.latestWslRefresh = t),
        { remoteWslConnections: await this.waitForLatestWslRefresh(t) }
      );
    }
    async waitForLatestWslRefresh(e) {
      let t = await e,
        n = this.latestWslRefresh;
      return e === n ? t : this.waitForLatestWslRefresh(n);
    }
    async runRemoteWslRefresh(e) {
      if (!this.shouldLoadWslConnections)
        return (this.sharedObjectRepository.set(`remote_wsl_connections`, []), []);
      let t;
      try {
        t = await this.loadRemoteWslConnections();
      } catch (t) {
        if (e !== this.wslRefreshGeneration) return [];
        throw t;
      }
      if (e !== this.wslRefreshGeneration) return [];
      let n = t.connections;
      return (
        t.authoritative &&
          this.reconcileAuthoritativeCatalogHosts?.(`wsl`, new Set(n.map((e) => e.hostId))),
        this.sharedObjectRepository.set(`remote_wsl_connections`, n),
        this.connectRemoteConnectionsAndLogFailures(
          n.filter((e) => e.autoConnect).map((e) => e.hostId),
        ),
        l4().info(`refresh_wsl_completed`, {
          safe: {
            enabled: this.shouldLoadWslConnections,
            nextConnectionCount: n.length,
            autoConnectConnectionCount: n.filter((e) => e.autoConnect).length,
          },
          sensitive: {},
        }),
        n
      );
    }
    async authorizeRemoteControlConnections() {
      return (
        await authorizeRemoteControlEnvironments({
          appServerClient: this.desktopAuthAppServerClient,
          desktopApiOptions: this.desktopApiOptions,
          deviceKeyClient: this.remoteControlDeviceKeyClient,
          globalState: this.appState,
          requestRemoteControlEnrollmentStepUpToken: ({ accountId: e }) =>
            y5e({ accountId: e, desktopApiOptions: this.desktopApiOptions }),
        }),
        this.refreshRemoteControlConnections()
      );
    }
    async renameRemoteControlEnvironment({ envId: e, name: t }) {
      let n = t.trim();
      if (n.length === 0) throw Error(`Remote control display name cannot be empty.`);
      let r = this.sharedObjectRepository.get(`remote_control_connections`),
        i = r?.find((t) => t.envId === e);
      if (i == null) throw Error(`Remote control environment not found.`);
      let a = await renameRemoteControlEnvironment({
          appServerClient: this.desktopAuthAppServerClient,
          desktopApiOptions: this.desktopApiOptions,
          envId: e,
          name: n,
        }),
        o = this.sharedObjectRepository.get(`remote_control_connections`) ?? r ?? [],
        s = o.find((t) => t.envId === e) ?? i,
        c = { ...a, autoConnect: this.getAutoConnectForRemoteConnection(s) },
        l = o.map((t) => (t.envId === e ? c : t));
      return (
        this.sharedObjectRepository.set(`remote_control_connections`, l),
        this.reconcileAuthoritativeCatalogHosts?.(
          `remote-control`,
          new Set(l.map((e) => e.hostId)),
        ),
        { remoteControlConnection: c, remoteControlConnections: l }
      );
    }
    async renameRemoteControlEnvironmentIfDefault({ envId: e, name: t }) {
      let { remoteControlConnections: n } = await this.refreshRemoteControlConnections(),
        r = n.find((t) => t.envId === e);
      r?.hasReportedHostName === !0 &&
        r.displayName === r.hostName &&
        r.displayName !== t &&
        (await this.renameRemoteControlEnvironment({ envId: e, name: t }));
    }
    async deleteRemoteControlEnvironment({ envId: e }) {
      let t = this.sharedObjectRepository.get(`remote_control_connections`),
        n = t?.find((t) => t.envId === e);
      if (n == null) throw Error(`Remote control environment not found.`);
      if (n.online) throw Error(`Only offline remote control environments can be deleted.`);
      (await deleteRemoteControlEnvironment({
        appServerClient: this.desktopAuthAppServerClient,
        desktopApiOptions: this.desktopApiOptions,
        envId: e,
      }),
        this.clearRemoteConnectionAutoConnect(n.hostId));
      let r = (this.sharedObjectRepository.get(`remote_control_connections`) ?? t ?? []).filter(
        (t) => t.envId !== e,
      );
      return (
        this.sharedObjectRepository.set(`remote_control_connections`, r),
        this.reconcileAuthoritativeCatalogHosts?.(
          `remote-control`,
          new Set(r.map((e) => e.hostId)),
        ),
        { remoteControlConnections: r }
      );
    }
    async saveCodexManagedRemoteSshConnections(e) {
      let t = this.loadSavedRemoteConnections(),
        r = new Set(
          this.sharedObjectRepository.get(`remote_ssh_connections`)?.map((e) => e.hostId),
        ),
        i = new Set(e.map((e) => e.hostId)),
        a = this.addConnectionAnalyticsIds([
          ...e,
          ...t.filter((e) => !i.has(e.hostId) && !r.has(e.hostId)),
        ]);
      this.appState.set(n.iu.CODEX_MANAGED_REMOTE_CONNECTIONS, a);
      let o = new Set(a.map((e) => e.hostId));
      for (let e of t) o.has(e.hostId) || this.clearRemoteConnectionAutoConnect(e.hostId);
      return (await this.refreshRemoteConnections(), { remoteConnections: a });
    }
    async setRemoteConnectionAutoConnect(e, t) {
      let r = this.getRemoteConnectionAutoConnectByHostId();
      this.appState.set(n.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID, { ...r, [e]: t });
      let i = await this.refreshRemoteConnectionsForHostId(e);
      return t
        ? { remoteConnections: i, ...(await this.ensureRemoteConnectionConnected(e)) }
        : { remoteConnections: i, ...(await this.disconnectRemoteConnection(e)) };
    }
    async installRemoteCodex(e) {
      let t = getSshHostConfig(this.getHostConfigForHostId(e));
      if (t == null) throw Error(`Installing the Codex CLI requires an SSH connection.`);
      await new RemoteCodexInstaller(t).installCodex();
      let n = this.appServerConnectionRegistry.getMaybeConnection(e);
      return n?.getConnectionError()?.code === `update-required`
        ? (await n.restart({ intent: `restart`, killCodexProcess: !0 }),
          { state: n.getConnectionState(), error: n.getConnectionError() })
        : this.ensureRemoteConnectionConnected(e);
    }
    async startRemoteChatgptLoginPortForward(e, t) {
      if (this.getHostConfigForHostId(e).kind === `remote-control`)
        throw Error(`Remote control does not support ChatGPT login forwarding yet.`);
      let n = this.appServerConnectionRegistry.getMaybeConnection(e);
      if (n == null) throw Error(`Connection for host ID ${e} not found`);
      return { forwarded: await n.startRemoteChatgptLoginPortForward({ loginId: t }) };
    }
    async stopRemoteChatgptLoginPortForward(e, t) {
      if (this.getHostConfigForHostId(e).kind === `remote-control`)
        throw Error(`Remote control does not support ChatGPT login forwarding yet.`);
      let n = this.appServerConnectionRegistry.getMaybeConnection(e);
      return n == null ? { stopped: !1 } : { stopped: n.stopRemoteChatgptLoginPortForward(t) };
    }
    async appServerConnectionState(e) {
      let t = this.appServerConnectionRegistry.getMaybeConnection(e);
      return {
        state: t?.getConnectionState() ?? `disconnected`,
        progress: t?.getConnectionProgress() ?? null,
        error: t?.getConnectionError() ?? null,
      };
    }
    async remoteWorkspaceDirectoryEntries(e, t, r = !1) {
      let i = this.getHostConfigForHostId(e),
        a = this.getAppServerClientForHostId(e),
        o = n.zi(i),
        s = await this.getWorkspaceDirectoryPath(a, t),
        c = await this.getParentDirectoryPath(a, s),
        l = await n.Di.readdir(s, { withFileTypes: !0 }, a),
        u = await a.platformPath(),
        d = l
          .map((e) => {
            let t = u.join(s, e.name);
            return { name: e.name, path: zn(t, o), type: e.isDirectory() ? `directory` : `file` };
          })
          .filter((e) => !r || e.type === `directory`)
          .sort((e, t) => {
            if (e.type !== t.type) return e.type === `directory` ? -1 : 1;
            let n = e.name.startsWith(`.`);
            return n === t.name.startsWith(`.`) ? e.name.localeCompare(t.name) : n ? 1 : -1;
          });
      return { directoryPath: zn(s, o), parentPath: c == null ? null : zn(c, o), entries: d };
    }
    async getWorkspaceDirectoryPath(e, t) {
      let r = t?.trim() || (await this.getDefaultWorkspaceDirectoryPath(e));
      if (!(await n.Di.stat(r, e)).isDirectory()) throw Error(`Directory not found: ${r}`);
      return r;
    }
    async getDefaultWorkspaceDirectoryPath(e) {
      let t = e.hostConfig;
      if (!n.Es(t)) return (0, p.homedir)();
      let r = await e.platformPath(),
        i = await e.codexHome();
      return r.dirname(i);
    }
    async getParentDirectoryPath(e, t) {
      let n = (await e.platformPath()).dirname(t);
      return n === t ? null : n;
    }
    async connectRemoteConnectionsAndLogFailures(e) {
      let t = 0;
      await Promise.all(
        Array.from(new Set(e), (e) => {
          let n = this.isAutoConnectSshRemoteConnection(e) ? t++ * E5e : 0;
          return this.connectRemoteConnectionAndLogFailure(e, n);
        }),
      );
    }
    isAutoConnectSshRemoteConnection(e) {
      let t = this.remoteConnectionsByHostId.get(e);
      return t != null && t.autoConnect && !n.ws(t);
    }
    async connectRemoteConnectionAndLogFailure(e, t) {
      if (!(t > 0 && (await j5e(t), !this.isAutoConnectSshRemoteConnection(e))))
        try {
          await this.ensureRemoteConnectionConnected(e);
        } catch (t) {
          (l4().warning(`connect_from_config_apply_failed`, {
            safe: {},
            sensitive: { error: t, hostId: e },
          }),
            this.sharedObjectRepository
              .get(`remote_control_connections`)
              ?.some((t) => t.hostId === e) === !0 &&
              (await this.refreshRemoteControlClientAuthorizationState()));
        }
    }
    async ensureRemoteConnectionConnected(e) {
      let t = this.appServerConnectionRegistry.getMaybeConnection(e);
      return t == null
        ? this.connectRemoteConnection(e)
        : (t.getConnectionState() !== `connected` && (await t.connect()),
          { state: t.getConnectionState(), error: t.getConnectionError() });
    }
    async connectRemoteConnection(e) {
      let t = this.remoteConnectionsByHostId.get(e);
      if (t == null) throw Error(`Remote connection for host ID ${e} not found`);
      (this.appServerConnectionRegistry.getMaybeConnection(e) != null &&
        this.disposeRemoteConnection(e),
        l4().info(`connect_requested`, { safe: {}, sensitive: { hostId: e } }));
      let n = null;
      try {
        ((n = this.createAndRegisterRemoteConnection(t)),
          this.appServerConnectionRegistry.addConnection(e, n),
          await n.connect());
      } catch (t) {
        throw (
          l4().warning(`connect_failed`, { safe: {}, sensitive: { error: t, hostId: e } }),
          Error(`Failed to connect remote connection.`)
        );
      }
      let r = n?.getConnectionState() ?? `disconnected`,
        i = n?.getConnectionError() ?? null;
      return (
        l4().info(`connect_completed`, {
          safe: { state: r, hasError: i != null },
          sensitive: { hostId: e, connectionError: i },
        }),
        { state: r, error: i }
      );
    }
    async disconnectRemoteConnection(e) {
      l4().info(`disconnect_requested`, { safe: {}, sensitive: { hostId: e } });
      let t = this.appServerConnectionRegistry.getMaybeConnection(e);
      if (t == null) return { state: `disconnected`, error: null };
      this.disposeRemoteConnection(e);
      let n = t.getConnectionError();
      return (
        l4().info(`disconnect_completed`, {
          safe: { hasError: n != null },
          sensitive: { hostId: e, connectionError: n },
        }),
        { state: `disconnected`, error: n }
      );
    }
    async loadRemoteConnections() {
      let e = this.restoreSavedAliasConnectionsForExistingRemoteProjects(
          this.loadSavedRemoteConnections(),
        ),
        t = await Promise.all(
          e.flatMap((e) => {
            let t = e.alias?.trim();
            return t
              ? [
                  $2({ entrypointPath: u4(), sshAlias: t }).then((t) =>
                    t == null
                      ? null
                      : {
                          ...t,
                          hostId: e.hostId,
                          connectionAnalyticsId: e.connectionAnalyticsId,
                          displayName: e.displayName,
                          autoConnect: !1,
                        },
                  ),
                ]
              : [];
          }),
        ),
        n = [
          ...e.flatMap((e) =>
            e.hostname == null
              ? []
              : [
                  {
                    hostId: e.hostId,
                    connectionAnalyticsId: e.connectionAnalyticsId,
                    displayName: e.displayName,
                    source: `codex-managed`,
                    autoConnect: !1,
                    sshAlias: null,
                    sshHost: e.hostname,
                    sshPort: e.sshPort,
                    identity: e.identity,
                  },
                ],
          ),
          ...t.filter((e) => e != null),
        ].map((e) => ({ ...e, autoConnect: this.getAutoConnectForRemoteConnection(e) })),
        r = this.addConnectionAnalyticsIds(n);
      return (
        l4().info(`load_completed`, {
          safe: { savedRemoteConnectionCount: e.length, totalConnectionCount: r.length },
          sensitive: {},
        }),
        r
      );
    }
    restoreSavedAliasConnectionsForExistingRemoteProjects(e) {
      if (this.appState.get(n.iu.REMOTE_PROJECT_CONNECTION_BACKFILL_COMPLETED) === !0) return e;
      let t = this.appState.get(n.iu.REMOTE_PROJECTS);
      if (t == null || t.length === 0)
        return (
          l4().info(`remote_project_connection_restore_skipped`, {
            safe: { reason: `no_remote_projects` },
            sensitive: {},
          }),
          this.appState.set(n.iu.REMOTE_PROJECT_CONNECTION_BACKFILL_COMPLETED, !0),
          e
        );
      try {
        let r = Q2(u4()),
          i = k5e({ sshAliases: r, remoteProjects: t, savedRemoteConnections: e }),
          a = i.length - e.length;
        return (
          deepEqual(e, i) || this.appState.set(n.iu.CODEX_MANAGED_REMOTE_CONNECTIONS, i),
          l4().info(`remote_project_connection_restore_completed`, {
            safe: {
              discoveredAliasCount: r.length,
              remoteProjectCount: t.length,
              restoredConnectionCount: a,
              savedRemoteConnectionCountAfter: i.length,
              savedRemoteConnectionCountBefore: e.length,
            },
            sensitive: {},
          }),
          this.appState.set(n.iu.REMOTE_PROJECT_CONNECTION_BACKFILL_COMPLETED, !0),
          i
        );
      } catch (n) {
        l4().warning(`remote_project_connection_restore_failed`, {
          safe: { remoteProjectCount: t.length, savedRemoteConnectionCount: e.length },
          sensitive: { error: n },
        });
      }
      return e;
    }
    loadSavedRemoteConnections() {
      let e = this.appState.get(n.iu.CODEX_MANAGED_REMOTE_CONNECTIONS) ?? [],
        t = e.map((e) => {
          if (`alias` in e && `hostname` in e)
            return e.alias == null
              ? {
                  hostId: e.hostId,
                  connectionAnalyticsId: e.connectionAnalyticsId,
                  displayName: e.displayName,
                  source: `codex-managed`,
                  alias: null,
                  hostname: e.hostname,
                  sshPort: e.sshPort,
                  identity: e.identity,
                }
              : {
                  hostId: e.hostId,
                  connectionAnalyticsId: e.connectionAnalyticsId,
                  displayName: e.displayName,
                  source: `discovered`,
                  alias: e.alias,
                  hostname: null,
                  sshPort: null,
                  identity: null,
                };
          let t = e,
            n = t.sshAlias?.trim() || null;
          return n == null
            ? {
                hostId: t.hostId,
                connectionAnalyticsId: t.connectionAnalyticsId,
                displayName: t.displayName,
                source: `codex-managed`,
                alias: null,
                hostname: t.sshHost,
                sshPort: t.sshPort,
                identity: t.identity,
              }
            : {
                hostId: t.hostId,
                connectionAnalyticsId: t.connectionAnalyticsId,
                displayName: t.displayName,
                source: `discovered`,
                alias: n,
                hostname: null,
                sshPort: null,
                identity: null,
              };
        });
      return (
        deepEqual(e, t) || this.appState.set(n.iu.CODEX_MANAGED_REMOTE_CONNECTIONS, t),
        t
      );
    }
    async refreshRemoteConnectionsForHostId(e) {
      return (
        this.sharedObjectRepository
          .get(`remote_control_connections`)
          ?.some((t) => t.hostId === e) === !0
          ? await this.refreshRemoteControlConnections()
          : this.sharedObjectRepository
                .get(`remote_wsl_connections`)
                ?.some((t) => t.hostId === e) === !0
            ? await this.refreshRemoteWslConnections()
            : await this.refreshRemoteConnections(),
        this.getSharedRemoteConnections()
      );
    }
    getSharedRemoteConnections() {
      return [
        ...(this.sharedObjectRepository.get(`remote_ssh_connections`) ?? []),
        ...(this.sharedObjectRepository.get(`remote_wsl_connections`) ?? []),
        ...(this.sharedObjectRepository.get(`remote_control_connections`) ?? []),
      ];
    }
    async loadRemoteWslConnections() {
      let e = await n.Ii();
      if (e.distro == null) return { authoritative: !0, connections: [] };
      let t = (await n.Pi()).filter((t) => t !== e.distro),
        r = e.available ? [e.distro, ...t] : t;
      return {
        authoritative: e.available,
        connections: this.addConnectionAnalyticsIds(
          r.map((t) => {
            let r = n.xs(t);
            return {
              hostId: r,
              displayName: `WSL: ${t}`,
              source: `wsl`,
              distro: t,
              autoConnect: this.getAutoConnectForRemoteConnection({ hostId: r }, t === e.distro),
            };
          }),
        ),
      };
    }
    getAutoConnectForRemoteConnection(e, t = !1) {
      return this.getRemoteConnectionAutoConnectByHostId()[e.hostId] ?? t;
    }
    getRemoteConnectionAutoConnectByHostId() {
      return this.appState.get(n.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID) ?? {};
    }
    addConnectionAnalyticsIds(e) {
      let t = this.appState.get(n.iu.REMOTE_CONNECTION_ANALYTICS_ID_BY_HOST_ID) ?? {},
        r = null,
        i = e.map((e) => {
          let n = t[e.hostId] ?? e.connectionAnalyticsId ?? randomUUID();
          return (
            t[e.hostId] !== n && ((r ??= { ...t }), (r[e.hostId] = n)),
            { ...e, connectionAnalyticsId: n }
          );
        });
      return (r != null && this.appState.set(n.iu.REMOTE_CONNECTION_ANALYTICS_ID_BY_HOST_ID, r), i);
    }
    clearRemoteConnectionAutoConnect(e) {
      let t = this.getRemoteConnectionAutoConnectByHostId();
      if (!(e in t)) return;
      let r = { ...t };
      (delete r[e], this.appState.set(n.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID, r));
    }
    async loadRemoteControlConnections(e) {
      try {
        let { clientAuthorized: t, clientId: n } =
            await this.getRemoteControlClientEnrollmentStatus(),
          r =
            n == null
              ? []
              : await listRemoteControlEnvironments({
                  appServerClient: this.desktopAuthAppServerClient,
                  clientId: n,
                  desktopApiOptions: this.desktopApiOptions,
                });
        return e === this.remoteControlRefreshGeneration
          ? (this.sharedObjectRepository.set(`local_remote_control_client_id`, n),
            this.sharedObjectRepository.set(`remote_control_connections_state`, {
              available: !0,
              accessRequired: !1,
              authRequired: !1,
              clientAuthorized: t,
            }),
            r)
          : r;
      } catch (t) {
        if (e !== this.remoteControlRefreshGeneration) return [];
        if (t instanceof RemoteControlFeatureUnavailableError)
          return (
            this.sharedObjectRepository.set(`local_remote_control_client_id`, null),
            this.sharedObjectRepository.set(`remote_control_connections_state`, {
              available: !1,
              accessRequired: !1,
              authRequired: !1,
              clientAuthorized: !1,
            }),
            []
          );
        if (t instanceof RemoteControlPermissionError)
          return (
            this.sharedObjectRepository.set(`remote_control_connections_state`, {
              available: !1,
              accessRequired: !0,
              authRequired: !1,
              clientAuthorized: !1,
            }),
            []
          );
        if (t instanceof RemoteControlAuthError)
          return (
            this.sharedObjectRepository.set(`local_remote_control_client_id`, null),
            this.sharedObjectRepository.set(`remote_control_connections_state`, {
              available: !0,
              accessRequired: !1,
              authRequired: !0,
              clientAuthorized: !1,
            }),
            l4().warning(`load_remote_control_unauthed`, { safe: {}, sensitive: { error: t } }),
            []
          );
        throw (
          this.sharedObjectRepository.set(`remote_control_connections_state`, {
            available: !0,
            accessRequired: !1,
            authRequired: !1,
            clientAuthorized: !1,
          }),
          this.sharedObjectRepository.set(`local_remote_control_client_id`, null),
          t
        );
      }
    }
    removeLocalRemoteControlConnection() {
      let e = this.sharedObjectRepository.get(`remote_control_connections`);
      if (e == null) return;
      let t = this.filterLocalRemoteControlConnection(e);
      t.length !== e.length && this.sharedObjectRepository.set(`remote_control_connections`, t);
    }
    filterLocalRemoteControlConnection(e) {
      let t = this.sharedObjectRepository.get(`local_remote_control_environment_id`),
        n = this.sharedObjectRepository.get(`local_remote_control_installation_id`);
      return t == null && n == null
        ? e
        : e.filter((e) => e.envId !== t && (n == null || e.installationId !== n));
    }
    async refreshLocalRemoteControlClientId() {
      try {
        let { clientId: e } = await this.getRemoteControlClientEnrollmentStatus();
        this.sharedObjectRepository.set(`local_remote_control_client_id`, e);
      } catch (e) {
        l4().warning(`refresh_local_remote_control_client_id_failed`, {
          safe: {},
          sensitive: { error: e },
        });
      }
    }
    async refreshRemoteControlClientAuthorizationState() {
      try {
        let { clientAuthorized: e, clientId: t } =
          await this.getRemoteControlClientEnrollmentStatus();
        this.setRemoteControlClientAuthorizationState(e, t);
      } catch (e) {
        l4().warning(`refresh_remote_control_client_authorization_state_failed`, {
          safe: {},
          sensitive: { error: e },
        });
      }
    }
    async handleRemoteControlEnrollmentAuthorizationRequired() {
      ((this.remoteControlRefreshGeneration += 1),
        this.setRemoteControlClientAuthorizationState(!1, null),
        await Promise.all(
          (this.sharedObjectRepository.get(`remote_control_connections`) ?? []).map((e) =>
            this.disconnectRemoteConnection(e.hostId),
          ),
        ));
    }
    setRemoteControlClientAuthorizationState(e, t) {
      this.sharedObjectRepository.set(`local_remote_control_client_id`, t);
      let n = this.sharedObjectRepository.get(`remote_control_connections_state`);
      n != null &&
        this.sharedObjectRepository.set(`remote_control_connections_state`, {
          ...n,
          clientAuthorized: e,
        });
    }
    getRemoteControlClientEnrollmentStatus() {
      return checkRemoteControlAuthorization({
        appServerClient: this.desktopAuthAppServerClient,
        desktopApiOptions: this.desktopApiOptions,
        deviceKeyClient: this.remoteControlDeviceKeyClient,
        globalState: this.appState,
      });
    }
  };
function O5e(e) {
  return e.reduce(
    (e, t) => (t.source === `codex-managed` ? (e.codexManaged += 1) : (e.discovered += 1), e),
    { codexManaged: 0, discovered: 0 },
  );
}
function k5e({ sshAliases: e, remoteProjects: t, savedRemoteConnections: r }) {
  let i = new Set(
      r.flatMap((e) => {
        let t = e.alias?.trim();
        return t ? [t] : [];
      }),
    ),
    a = new Set(t.map((e) => e.hostId)),
    o = e.flatMap((e) => {
      let t = n.ys(e);
      return i.has(e) || !a.has(t)
        ? []
        : (i.add(e),
          [
            {
              hostId: t,
              displayName: e,
              source: `discovered`,
              alias: e,
              hostname: null,
              sshPort: null,
              identity: null,
            },
          ]);
    });
  return o.length === 0 ? r : [...r, ...o];
}
function A5e(e, t) {
  return e == null
    ? !1
    : deepEqual(e, t) ||
        (!e.autoConnect && t.autoConnect && deepEqual({ ...e, autoConnect: t.autoConnect }, t))
      ? !0
      : n.ws(e) && n.ws(t) && e.hostId === t.hostId && e.envId === t.envId;
}
async function j5e(e) {
  await new Promise((t) => {
    setTimer(t, e);
  });
}
function u4() {
  return pathJoin(homeDirectory(), `.ssh`, `config`);
}

return D5e;
}

if (typeof module !== "undefined") {
  module.exports = { createRemoteConnectionsHandlerClass };
}

