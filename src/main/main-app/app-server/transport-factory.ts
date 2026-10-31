// @ts-nocheck

type AppServerTransportDependencies = Record<string, any>;

/** Selects and assembles the concrete app-server transport for a host configuration. */
export function createAppServerTransportFactory(dependencies: AppServerTransportDependencies) {
  function hostKindForConfig(hostConfig: Record<string, any>) {
    return dependencies.isRemoteControlHostConfig(hostConfig)
      ? `remote-control`
      : dependencies.isWslHostConfig(hostConfig)
        ? `wsl`
        : `ssh`;
  }

  function createAppServerTransport(options: Record<string, any>) {
    const sshWebsocketConfig = dependencies.resolveSshWebsocketConfig(options.hostConfig);
    if (sshWebsocketConfig) {
      dependencies.logger.info(`[ssh-websocket-v0] selected app-server transport`, {
        safe: { hostId: options.hostConfig.id },
      });
      return new dependencies.SshWebsocketTransport({
        ...sshWebsocketConfig,
        getConnectTimeoutSeconds: options.getSshConnectTimeoutSeconds,
      });
    }

    if (options.transportKind === `remote-control`) {
      return new dependencies.RemoteControlTransport({
        hostConfig: options.hostConfig,
        appServerClient: options.desktopAuthAppServerClient,
        deviceKeyClient: options.remoteControlDeviceKeyClient,
        desktopApiOptions: options.desktopApiOptions,
        globalState: options.globalState,
        onEnrollmentAuthorizationRequired: options.onEnrollmentAuthorizationRequired,
      });
    }

    if (dependencies.isRemoteStdioHostConfig(options.hostConfig)) {
      return new dependencies.RemoteStdioTransport({
        hostConfig: options.hostConfig,
        repoRoot: options.repoRoot,
        resourcesPath: options.resourcesPath,
        defaultOriginator: options.defaultOriginator,
      });
    }

    const websocketUrl = dependencies.resolveWebsocketUrl(options.hostConfig);
    if (websocketUrl) {
      const desktopAuthClient = options.desktopAuthAppServerClient;
      const getWebsocketHandshake =
        dependencies.isCloudHostId(options.hostConfig.id) && desktopAuthClient != null
          ? async () => {
              const token = await desktopAuthClient.getAuthToken({ refreshToken: false });
              if (!token) throw Error(`Sign in to ChatGPT to start a durable thread.`);
              const accountId = dependencies.accountIdFromToken(token);
              return {
                authenticatedPrincipal: dependencies.authenticatedPrincipalFromToken(token),
                headers: accountId == null ? undefined : { "ChatGPT-Account-Id": accountId },
                protocols: dependencies.protocolsForToken(token),
              };
            }
          : undefined;
      const socksProxyUrl = dependencies.resolveSocksProxyUrl(
        options.hostConfig,
        websocketUrl,
      );
      let ca;
      if (dependencies.isCloudHostId(options.hostConfig.id)) {
        try {
          ca = [
            ...dependencies.getCACertificates(`default`),
            ...dependencies.getCACertificates(`system`),
          ];
        } catch (error) {
          dependencies.logger.warning(`Failed to load CA certificates for cloud WebSocket`, {
            safe: {},
            sensitive: { error },
          });
        }
      }
      const transport = new dependencies.WebsocketTransport({
        hostConfig: options.hostConfig,
        websocketUrl,
        ca,
        getWebsocketHandshake,
        ...(socksProxyUrl == null ? {} : { socksProxyUrl }),
      });
      return dependencies.isCloudHostId(options.hostConfig.id) && desktopAuthClient != null
        ? new dependencies.AuthenticatedTransport(
            transport,
            new dependencies.DesktopApiTokenClient(
              () => desktopAuthClient.getAuthToken({ refreshToken: false }),
              options.desktopApiOptions,
            ),
          )
        : transport;
    }

    return new dependencies.LocalStdioTransport({
      hostConfig: options.hostConfig,
      repoRoot: options.repoRoot,
      resourcesPath: options.resourcesPath,
      defaultOriginator: options.defaultOriginator,
      getConfigOverrides: async () => [...(await dependencies.getConfigOverrides(options))],
    });
  }

  return { hostKindForConfig, createAppServerTransport };
}

if (typeof module !== `undefined`) {
  module.exports = { createAppServerTransportFactory };
}
