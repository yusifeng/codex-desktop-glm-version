export interface SqliteRecoveryNotification {
  databasePath: string;
  backupFolder: string;
}

interface Logger {
  info(message: string, details: unknown): void;
  warning(message: string, details: unknown): void;
}

/**
 * Queue app-server recovery notifications until the primary window is ready. Duplicate
 * database/backup pairs are admitted once, and notifications remain serialized (original `due/fue`).
 */
export function createSqliteRecoveryConfirmationQueue<Window>({
  ensureWindow,
  showPrimaryWindow,
  showRecoveryConfirmation,
  logger,
}: {
  ensureWindow(): Promise<Window>;
  showPrimaryWindow(options: { stealFocus: true }): void;
  showRecoveryConfirmation(databasePath: string, backupFolder: string, window: Window): Promise<unknown>;
  logger: () => Logger;
}): {
  onRecovery(notification: SqliteRecoveryNotification): void;
  enable(): Promise<void>;
} {
  let pending: SqliteRecoveryNotification[] = [];
  let seen = new Set<string>();
  let enabled = false;
  let draining: Promise<void> | null = null;

  let show = async (notification: SqliteRecoveryNotification) => {
    logger().info(`Showing app-server SQLite recovery confirmation`, {
      safe: {},
      sensitive: notification,
    });
    let window = await ensureWindow();
    showPrimaryWindow({ stealFocus: true });
    await showRecoveryConfirmation(notification.databasePath, notification.backupFolder, window).catch(
      (error) => {
        logger().warning(`Failed to show app-server SQLite recovery confirmation`, {
          safe: {},
          sensitive: { error },
        });
      },
    );
  };

  let drain = (): Promise<void> => {
    if (!enabled) return Promise.resolve();
    if (draining != null) return draining;
    let batch = pending.splice(0);
    draining = (async () => {
      for (let notification of batch) await show(notification);
    })().finally(() => {
      draining = null;
      if (pending.length > 0) void drain();
    });
    return draining;
  };

  return {
    onRecovery(notification) {
      let key = `${notification.databasePath}\0${notification.backupFolder}`;
      if (seen.has(key)) return;
      seen.add(key);
      pending.push(notification);
      logger().info(`Queued app-server SQLite recovery confirmation`, {
        safe: { pendingNotifications: pending.length },
        sensitive: notification,
      });
      void drain();
    },
    async enable() {
      enabled = true;
      await drain();
    },
  };
}
