// @ts-nocheck

/** Owns renderer-driven SSH alias registration, persistence, refresh, and removal. */
export function createSshConnectionRegistrationClass(dependencies: Record<string, any>) {
  const { runtime, RpcHandlerBase, resolveSshAlias, createLogger, pathJoin, homeDirectory } =
    dependencies;
  const addSchema = runtime.wf({
    sshAlias: runtime
      .Of()
      .min(1)
      .max(255)
      .regex(/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/),
    autoConnect: runtime.gf().optional(),
    waitForMetadata: runtime.gf().optional(),
  });
  const removeSchema = addSchema.extend({ hostId: runtime.Of() });

  return class SshConnectionRegistration extends RpcHandlerBase {
    globalState;
    connections;
    logger = createLogger(`ssh-connection-registration`);
    constructor(globalState, connections) {
      (super(), (this.globalState = globalState), (this.connections = connections));
    }
    async add(request) {
      let { sshAlias, autoConnect = !0, waitForMetadata = !0 } = addSchema.parse(request),
        resolved = waitForMetadata
          ? await resolveSshAlias({
              entrypointPath: pathJoin(homeDirectory(), `.ssh`, `config`),
              sshAlias,
            })
          : {
              hostId: runtime.ys(sshAlias),
              displayName: sshAlias,
              source: `discovered`,
              sshAlias,
              sshHost: sshAlias,
              sshPort: null,
              identity: null,
              autoConnect,
            };
      if (resolved == null) throw Error(`SSH alias is unavailable`);
      let saved = this.globalState.get(runtime.iu.CODEX_MANAGED_REMOTE_CONNECTIONS) ?? [],
        existing = saved.find((entry) => entry.alias === sshAlias),
        hostId = existing?.hostId ?? resolved.hostId;
      existing ??
        this.globalState.set(runtime.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID, {
          ...this.globalState.get(runtime.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID),
          [hostId]: autoConnect,
        });
      let refresh =
        existing == null
          ? this.connections.saveCodexManagedRemoteSshConnections([
              ...saved,
              {
                hostId,
                displayName: sshAlias,
                source: `discovered`,
                alias: sshAlias,
                hostname: null,
                sshPort: null,
                identity: null,
              },
            ])
          : this.connections.refreshRemoteConnections();
      return (
        waitForMetadata
          ? await refresh
          : refresh.catch((error) => {
              this.logger().warning(`background_refresh_failed`, {
                safe: {},
                sensitive: { error },
              });
            }),
        {
          ...resolved,
          hostId,
          displayName: existing?.displayName ?? sshAlias,
          autoConnect:
            this.globalState.get(runtime.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID)?.[hostId] ??
            !1,
        }
      );
    }
    async remove(request) {
      let { hostId, sshAlias } = removeSchema.parse(request),
        saved = this.globalState.get(runtime.iu.CODEX_MANAGED_REMOTE_CONNECTIONS) ?? [];
      if (!saved.some((entry) => entry.hostId === hostId && entry.alias === sshAlias)) return !1;
      this.globalState.set(
        runtime.iu.CODEX_MANAGED_REMOTE_CONNECTIONS,
        saved.filter((entry) => entry.hostId !== hostId),
      );
      let autoConnect = {
        ...this.globalState.get(runtime.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID),
      };
      return (
        delete autoConnect[hostId],
        this.globalState.set(runtime.iu.REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID, autoConnect),
        await this.connections.refreshRemoteConnections(),
        !0
      );
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createSshConnectionRegistrationClass };
}
