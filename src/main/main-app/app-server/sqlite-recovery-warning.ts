const RECOVERY_SUMMARY = "Codex rebuilt its local database.";
const DATABASE_PATH_PREFIX = "Database path: ";
const BACKUP_FOLDER_PREFIX = "Backup folder: ";

export type SqliteRecoveryWarning = { databasePath: string; backupFolder: string };

export function parseSqliteRecoveryText(text: string): SqliteRecoveryWarning | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  if (!lines.some((line) => line.includes(RECOVERY_SUMMARY))) return null;
  let databasePath: string | null = null;
  let backupFolder: string | null = null;
  for (const line of lines) {
    if (line.startsWith(DATABASE_PATH_PREFIX)) databasePath = line.slice(DATABASE_PATH_PREFIX.length).trim();
    else if (line.startsWith(BACKUP_FOLDER_PREFIX)) backupFolder = line.slice(BACKUP_FOLDER_PREFIX.length).trim();
  }
  return databasePath == null || databasePath.length === 0 || backupFolder == null ||
    backupFolder.length === 0 || backupFolder === "unavailable"
    ? null
    : { databasePath, backupFolder };
}

export function parseSqliteRecoveryNotification(notification: unknown): SqliteRecoveryWarning | null {
  if (typeof notification !== "object" || notification == null ||
      (notification as { method?: unknown }).method !== "configWarning") return null;
  const params = (notification as { params?: unknown }).params;
  if (typeof params !== "object" || params == null ||
      (params as { summary?: unknown }).summary !== RECOVERY_SUMMARY) return null;
  const details = (params as { details?: unknown }).details;
  return parseSqliteRecoveryText([RECOVERY_SUMMARY, typeof details === "string" ? details : ""].join("\n"));
}
