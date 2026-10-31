// @ts-nocheck

type RequirementsAuthRecoveryDependencies = Record<string, any>;

const messages = {
  title: {
    messageId: `desktop.requirementsAuthRecovery.title`,
    defaultMessage: `Sign in to continue`,
  },
  detail: {
    messageId: `desktop.requirementsAuthRecovery.detail`,
    defaultMessage: `Your session is no longer valid. Sign in again to open {appName}`,
  },
  retryDetail: {
    messageId: `desktop.requirementsAuthRecovery.retryDetail`,
    defaultMessage: `{appName} couldn't sign you out. Try again to return to sign-in`,
  },
  signIn: {
    messageId: `desktop.requirementsAuthRecovery.signIn`,
    defaultMessage: `Sign in again`,
  },
  quit: {
    messageId: `desktop.requirementsAuthRecovery.quit`,
    defaultMessage: `Quit`,
  },
};

const legacyRefreshFailures = new Set(
  [
    `Your access token could not be refreshed because your refresh token has expired. Please log out and sign in again.`,
    `Your access token could not be refreshed because your refresh token was already used. Please log out and sign in again.`,
    `Your access token could not be refreshed because your refresh token was revoked. Please log out and sign in again.`,
    `Your access token could not be refreshed. Please log out and sign in again.`,
    `Your access token could not be refreshed because you have since logged out or signed in to another account. Please sign in again.`,
  ].map((message) => `failed to read configuration layers: ${message}`),
);

/** Creates the single-flight dialog/logout recovery controller for startup requirement auth failures. */
export function createRequirementsAuthRecoveryRuntime(
  dependencies: RequirementsAuthRecoveryDependencies,
) {
  return function createRequirementsAuthRecovery(
    appServerConnection: Record<string, any>,
    quitState: Record<string, any>,
  ) {
    let activeRecovery: Promise<`retry` | `stop`> | null = null;
    return async (error: unknown, isActive: () => boolean) => {
      if (
        !dependencies.isCloudRequirementsAuthError(error) &&
        !(error instanceof Error && legacyRefreshFailures.has(error.message))
      ) {
        throw error;
      }
      while (activeRecovery != null) await activeRecovery;
      if (!isActive()) return `stop`;
      activeRecovery = recover(appServerConnection, quitState, isActive);
      try {
        return await activeRecovery;
      } finally {
        activeRecovery = null;
      }
    };
  };

  async function recover(
    appServerConnection: Record<string, any>,
    quitState: Record<string, any>,
    isActive: () => boolean,
  ): Promise<`retry` | `stop`> {
    const nativeIntl = dependencies.getNativeIntl();
    let logoutFailed = false;
    while (isActive()) {
      const { response } = await dependencies.dialog.showMessageBox({
        type: `warning`,
        message: nativeIntl.formatMessage(messages.title),
        detail: nativeIntl.formatMessage({
          ...(logoutFailed ? messages.retryDetail : messages.detail),
          values: { appName: dependencies.app.getName() },
        }),
        buttons: [
          nativeIntl.formatMessage(messages.signIn),
          nativeIntl.formatMessage(messages.quit),
        ],
        defaultId: 0,
        cancelId: 1,
        noLink: true,
      });
      if (!isActive()) return `stop`;
      if (response !== 0) {
        quitState.markQuitApproved();
        dependencies.app.quit();
        return `stop`;
      }
      try {
        await appServerConnection.sendAppServerRequest(`account/logout`, undefined);
        return `retry`;
      } catch (error) {
        dependencies.logger.warning(`Failed to sign out for requirements recovery`, {
          safe: {},
          sensitive: { error },
        });
        logoutFailed = true;
      }
    }
    return `stop`;
  }
}

if (typeof module !== `undefined`) {
  module.exports = { createRequirementsAuthRecoveryRuntime };
}
