// @ts-nocheck

/** Projects remote catalog entries into host configs and owns per-surface user-input activity RPC. */
export function createRemoteHostConfigRuntime(dependencies: Record<string, any>) {
  const {
    runtime,
    RpcHandlerBase,
    buildSshArguments,
    buildWslCodexCommand,
    remoteLabelPrefix = `(remote) `,
  } = dependencies;

  function projectSshHostConfig(options) {
    let config = {
      id: options.id,
      display_name: options.displayName,
      kind: `ssh`,
      codex_cli_command: options.codexCliCommand,
      terminal_command: options.terminalCommand,
      default_workspaces: options.defaultWorkspaces ?? [],
      [runtime.cn]: {
        sshAlias: options.sshAlias ?? null,
        sshHost: options.sshHost,
        sshPort: options.sshPort,
        identity: options.identity,
      },
    };
    return (options.homeDir && (config.home_dir = options.homeDir), config);
  }

  function projectCatalogEntry(entry) {
    if (runtime.ws(entry))
      return {
        id: entry.hostId,
        display_name: entry.displayName,
        kind: runtime.vs,
        codex_cli_command: [],
        terminal_command: [],
        default_workspaces: [],
        env_id: entry.envId,
        host_name: entry.hostName,
        environment_kind: entry.environmentKind,
        online: entry.online,
        busy: entry.busy,
        os: entry.os,
        arch: entry.arch,
        app_server_version: entry.appServerVersion,
        last_seen_at: entry.lastSeenAt,
      };
    if (runtime.ks(entry))
      return {
        id: entry.hostId,
        display_name: entry.displayName,
        kind: `wsl`,
        codex_cli_command: buildWslCodexCommand(entry.distro),
        terminal_command: [`wsl.exe`, `-d`, entry.distro],
        default_workspaces: [],
        distro: entry.distro,
      };
    let sshArguments = buildSshArguments({
      alias: entry.sshAlias,
      hostname: entry.sshHost,
      sshPort: entry.sshPort,
      identity: entry.identity,
    });
    return projectSshHostConfig({
      id: entry.hostId,
      displayName: `${remoteLabelPrefix}${entry.displayName}`,
      sshAlias: entry.sshAlias ?? null,
      sshHost: entry.sshHost,
      sshPort: entry.sshPort,
      identity: entry.identity,
      codexCliCommand: [],
      terminalCommand: [`ssh`, ...sshArguments],
      defaultWorkspaces: [],
    });
  }

  class RequestUserInputAutoResolutionService extends RpcHandlerBase {
    appServerConnectionRegistry;
    surfaceId;
    constructor(appServerConnectionRegistry, surfaceId) {
      (super(),
        (this.appServerConnectionRegistry = appServerConnectionRegistry),
        (this.surfaceId = surfaceId));
    }
    recordConversationActivity({ conversationId, hostId }) {
      this.appServerConnectionRegistry
        .getConnection(hostId)
        .requestUserInputAutoResolution.recordConversationActivity(this.surfaceId, conversationId);
    }
    setConversationPresented({ conversationId, hostId, presented }) {
      this.appServerConnectionRegistry
        .getConnection(hostId)
        .requestUserInputAutoResolution.setConversationPresented(
          this.surfaceId,
          conversationId,
          presented,
        );
    }
    snooze({ conversationId, hostId, requestId }) {
      this.appServerConnectionRegistry
        .getConnection(hostId)
        .requestUserInputAutoResolution.snoozeRequest(conversationId, requestId);
    }
  }

  return { projectSshHostConfig, projectCatalogEntry, RequestUserInputAutoResolutionService };
}

if (typeof module !== "undefined") {
  module.exports = { createRemoteHostConfigRuntime };
}
