interface Logger {
  info(message: string): void;
  warning(message: string, details: unknown): void;
}

export const LEGACY_REMOTE_CONTROL_CONFIG_MIGRATION_KEY =
  `electron-remote-control-config-migration-completed`;

/** Remove obsolete app-server remote_control keys once per profile (original `Zce`). */
export async function removeLegacyRemoteControlConfig({
  appServerConnection,
  globalState,
  completedStateKey,
  logger,
}: {
  appServerConnection: { sendAppServerRequest(method: string, params: unknown): Promise<unknown> };
  globalState: { getStored(key: unknown): unknown; set(key: unknown, value: unknown): void };
  completedStateKey: unknown;
  logger: Logger;
}): Promise<void> {
  if (globalState.getStored(LEGACY_REMOTE_CONTROL_CONFIG_MIGRATION_KEY) === true) return;
  try {
    await appServerConnection.sendAppServerRequest(`config/batchWrite`, {
      edits: [
        { keyPath: `remote_control`, mergeStrategy: `replace`, value: null },
        { keyPath: `features.remote_control`, mergeStrategy: `replace`, value: null },
      ],
      expectedVersion: null,
      filePath: null,
      reloadUserConfig: true,
    });
    globalState.set(completedStateKey, true);
    logger.info(`Completed legacy remote_control config migration`);
  } catch (error) {
    logger.warning(`Failed to remove legacy remote_control config`, {
      safe: {},
      sensitive: { error },
    });
  }
}
