export type WorkspacePolicyRuntimeDependencies = {
  createWorkspacePolicyChecker(options: Record<string, any>): Record<string, any>;
  showWorkspacePolicyRestartDialog(options: Record<string, any>): void;
  getIntl(): { formatMessage(descriptor: Record<string, any>): string };
  getAppName(): string;
  showMessageBoxSync(options: Record<string, any>): unknown;
  relaunchAndQuit(): unknown;
  onError(error: unknown): void;
};

type WorkspacePolicyConnection = {
  getUserSavedConfiguration(): Promise<unknown>;
  registerInternalNotificationHandler(listener: (notification: unknown) => void): () => void;
  registerInternalConfigRefreshHandler(listener: () => void): () => void;
  sendAppServerRequest(method: string, params: unknown): Promise<unknown>;
};

/** Composes workspace-policy detection with the restart dialog and quit-state ownership. */
export function createWorkspacePolicyRuntime(dependencies: WorkspacePolicyRuntimeDependencies) {
  return function createStartupWorkspacePolicyChecker({
    quitState,
    isAppQuitting,
    getAuthMethod,
    hasStartupPolicyChanges,
  }: {
    quitState: { markQuitApproved(): void };
    isAppQuitting(): boolean;
    getAuthMethod(): Promise<string>;
    hasStartupPolicyChanges(): Promise<boolean>;
  }) {
    const showRestartDialog = () =>
      dependencies.showWorkspacePolicyRestartDialog({
        getIntl: dependencies.getIntl,
        getAppName: dependencies.getAppName,
        showMessageBoxSync: dependencies.showMessageBoxSync,
        markQuitApproved: () => quitState.markQuitApproved(),
        quit: dependencies.relaunchAndQuit,
        onError: dependencies.onError,
      });
    const checker = dependencies.createWorkspacePolicyChecker({
      isAppQuitting,
      getAuthMethod,
      hasStartupPolicyChanges,
      onRestartRequired: showRestartDialog,
      onError: dependencies.onError,
    });
    return {
      checkForChanges: () => checker.checkForChanges(),
      handleNotification: (notification: unknown) => checker.handleNotification(notification),
      installConnectionObservers({
        connection,
        registerDispose,
      }: {
        connection: WorkspacePolicyConnection;
        registerDispose(dispose: () => void): void;
      }) {
        registerDispose(
          connection.registerInternalNotificationHandler((notification) => {
            checker.handleNotification(notification);
          }),
        );
        registerDispose(
          connection.registerInternalConfigRefreshHandler(() => {
            checker.checkForChanges();
          }),
        );
      },
      initializeDesktopSettings({
        connection,
        logger,
        settingsStore,
        startupConfig,
      }: {
        connection: WorkspacePolicyConnection;
        logger: { warning(message: string, fields: Record<string, unknown>): void };
        settingsStore: {
          initialize(options: {
            config: unknown;
            batchWriteConfigValues(values: unknown): Promise<unknown>;
          }): unknown;
        };
        startupConfig: { resolve(config: unknown): void; reject(error: unknown): void };
      }) {
        return connection
          .getUserSavedConfiguration()
          .then((config) => {
            startupConfig.resolve(config);
            checker.checkForChanges();
            return settingsStore.initialize({
              config,
              batchWriteConfigValues: (values) =>
                connection.sendAppServerRequest(`config/batchWrite`, values),
            });
          })
          .catch((error) => {
            startupConfig.reject(error);
            logger.warning(`Failed to initialize desktop settings`, {
              safe: {},
              sensitive: { error },
            });
          });
      },
    };
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createWorkspacePolicyRuntime };
}
