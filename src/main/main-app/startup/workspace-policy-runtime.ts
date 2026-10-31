export type WorkspacePolicyRuntimeDependencies = {
  createWorkspacePolicyChecker(options: Record<string, any>): Record<string, any>;
  showWorkspacePolicyRestartDialog(options: Record<string, any>): void;
  getIntl(): { formatMessage(descriptor: Record<string, any>): string };
  getAppName(): string;
  showMessageBoxSync(options: Record<string, any>): unknown;
  relaunchAndQuit(): unknown;
  onError(error: unknown): void;
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
    return dependencies.createWorkspacePolicyChecker({
      isAppQuitting,
      getAuthMethod,
      hasStartupPolicyChanges,
      onRestartRequired: showRestartDialog,
      onError: dependencies.onError,
    });
  };
}

if (typeof module !== `undefined`) {
  module.exports = { createWorkspacePolicyRuntime };
}
