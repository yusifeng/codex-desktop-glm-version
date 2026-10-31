// @ts-nocheck

type ThreadReadStateRuntimeDependencies = {
  DisposableStore: new () => any;
  ThreadReadStateOwner: new (options: Record<string, any>) => any;
  ClientCoordination: new (client: string, errorReporter: unknown) => any;
  readAuthenticatedIdentity(read: () => unknown, subscribe: (listener: any) => () => void): Promise<any>;
  hostConfigKey(hostConfig: Record<string, any>, localWebsocketUrl: string | null): string;
  protocolVersion(message: string): number;
  deepEqual(left: unknown, right: unknown): boolean;
  prepareCronTurnReadState(options: Record<string, any>): unknown;
  logger: { warning(message: string, fields: Record<string, any>): void };
};

/**
 * Composes persisted thread read state with authenticated identity, execution-host identity,
 * cross-client broadcasts, and the cron-turn writer lifecycle.
 */
export function createThreadReadStateRuntime(dependencies: ThreadReadStateRuntimeDependencies) {
  return function createThreadReadState(options: Record<string, any>) {
    const {
      localConnection,
      connections,
      sharedObjects,
      globalState,
      errorReporter,
      getConfiguredHostIds,
      getHostConfig,
      getLocalWebsocketUrl,
    } = options;
    const disposables = new dependencies.DisposableStore();

    const onIdentityChanged = (listener: (event: Record<string, any>) => void) => {
      const identityDisposables = new dependencies.DisposableStore();
      identityDisposables.add(
        localConnection.registerInternalAuthenticatedPrincipalChangeHandler(
          ({ current }: Record<string, any>) =>
            listener(
              current == null
                ? { type: `refresh` }
                : { type: `identity`, identity: { kind: `chatgpt`, ...current } },
            ),
        ),
      );
      identityDisposables.add(
        localConnection.registerInternalNotificationHandler((notification: Record<string, any>) => {
          if (notification.method === `account/updated`) {
            listener(
              notification.params?.authMode === null
                ? { type: `logout` }
                : { type: `refresh` },
            );
          }
        }),
      );
      return () => identityDisposables.dispose();
    };

    const readIdentity = async () => {
      if (connections.getMaybeConnection(localConnection.hostId) !== localConnection) return null;
      const identity = await dependencies.readAuthenticatedIdentity(
        () =>
          localConnection.sendAppServerRequest(`getAuthStatus`, {
            includeToken: true,
            refreshToken: false,
          }),
        onIdentityChanged,
      );
      return connections.getMaybeConnection(localConnection.hostId) === localConnection
        ? identity
        : null;
    };

    const getHostKey = (hostId: string) => {
      const hostConfig =
        connections.getMaybeConnection(hostId)?.hostConfig ??
        (getConfiguredHostIds().includes(hostId) ? getHostConfig(hostId) : null);
      return hostConfig == null
        ? null
        : dependencies.hostConfigKey(
            hostConfig,
            hostConfig.kind === `local` ? getLocalWebsocketUrl(hostConfig) : null,
          );
    };

    const listHostKeys = () => {
      const hostIds = new Set([...connections.getAllHostIds(), ...getConfiguredHostIds()]);
      const entries: Array<[string, string]> = [];
      for (const hostId of hostIds) {
        const hostKey = getHostKey(hostId);
        if (hostKey != null) entries.push([hostId, hostKey]);
      }
      return Object.fromEntries(entries);
    };

    const coordination = options.localClientCoordinationEnabled
      ? new dependencies.ClientCoordination(`desktop`, errorReporter)
      : null;
    const owner = new dependencies.ThreadReadStateOwner({
      globalState,
      readIdentity,
      getHostKey,
      listHostKeys,
      onIdentityChanged,
      onHostsChanged: (listener: () => void) => {
        const hostDisposables = new dependencies.DisposableStore();
        let previousHostKeys = listHostKeys();
        const notifyIfChanged = () => {
          const nextHostKeys = listHostKeys();
          if (!dependencies.deepEqual(previousHostKeys, nextHostKeys)) {
            previousHostKeys = nextHostKeys;
            listener();
          }
        };
        hostDisposables.add(
          connections.subscribe((event: Record<string, any>) => {
            if (
              event.hostId === localConnection.hostId &&
              (event.type === `removed` || event.connection !== localConnection)
            ) {
              previousHostKeys = listHostKeys();
              listener();
            } else {
              notifyIfChanged();
            }
          }),
        );
        hostDisposables.add(
          sharedObjects.addSubscriber((name: string) => {
            if (
              name === `remote_ssh_connections` ||
              name === `remote_wsl_connections` ||
              name === `remote_control_connections`
            ) {
              notifyIfChanged();
            }
          }),
        );
        return () => hostDisposables.dispose();
      },
      onAcceptedChange: (change: Record<string, any>) => {
        coordination
          ?.waitUntilInitialized({ timeoutMs: 5000 })
          .then(() =>
            coordination.sendBroadcast(`thread-read-state-changed`, {
              conversationId: change.threadId,
              hostId: change.hostId,
              hasUnreadTurn: change.hasUnreadTurn,
              context: change.context,
            }),
          )
          .catch((error: unknown) =>
            dependencies.logger.warning(`Failed to broadcast thread read state`, {
              safe: {},
              sensitive: { error },
            }),
          );
      },
    });

    if (coordination != null) {
      disposables.add(
        coordination.addBroadcastHandler(
          `thread-read-state-changed`,
          async (message: Record<string, any>) => {
            if (
              message.version === dependencies.protocolVersion(`thread-read-state-changed`)
            ) {
              await owner.acceptBroadcast({
                hostId: message.params.hostId,
                threadId: message.params.conversationId,
                hasUnreadTurn: message.params.hasUnreadTurn,
                context: message.params.context,
              });
            }
          },
        ),
      );
      disposables.add(() => coordination.dispose());
    }
    disposables.add(() => owner.dispose());

    return {
      owner,
      prepareCronTurnReadState: (cronOptions: Record<string, any>) =>
        dependencies.prepareCronTurnReadState({ ...cronOptions, owner }),
      async getContext(hostId: string) {
        const captured = await owner.captureContext(hostId);
        return captured?.isCurrent() ? captured.context : null;
      },
      dispose: () => disposables.dispose(),
    };
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createThreadReadStateRuntime };
}
