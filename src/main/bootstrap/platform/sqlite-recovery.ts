// SQLite state 恢复流程（原 bootstrap-C4dRql4x.ts 24626-24839 行的
// `_A~CA` 常量与 `wA/TA/EA/DA/OA/kA/AA/jA/MA/NA/PA/FA/IA/LA/RA/zA/BA/VA/HA/UA/WA/GA`）。
//
// `EA`（recoverSqliteState）是 macOS/所有平台启动路径的关键 gate（主流程在
// Applications 安装 gate 之后调用）：打开 @chunk/shared 的 SQLite state
// runtime 并做就绪探测（PRAGMA user_version）。打开失败时进入恢复流程
// （原 `DA`）：
//   - backfill 超时类错误：自动重试（只等待一次 onBackfillWait）；
//   - SQLite 损坏（SQLITE_CORRUPT / SQLITE_NOTADB / 磁盘映像错误文案 /
//     db 路径被目录占用）：自动备份迁移（db/-wal/-shm 移入 db-backups/
//     sqlite-<秒级时间戳>-<序号>/），每个备份目录只自动尝试一次；
//   - 其余错误：弹 Retry / Back Up and Rebuild / Quit 对话框循环，
//     Quit 时 `app.quit()` 并返回 false（终止启动）。
// 备份成功后弹信息对话框告知用户已重建。

import { basename, dirname, join, posix, win32 } from "node:path";
import { mkdir, rename, stat } from "node:fs/promises";

import { app, dialog, type BrowserWindow } from "electron";
// @chunk/shared（src-DldfpmrL.js，尚未重写）的压缩名导出，按语义重命名导入：
//   oi → state 数据库文件路径解析（内部符号 GF：<codexHome>/sqlite/<db 文件名>）
//   si → 打开（记忆化）SQLite state runtime，非 Electron 进程返回 null（内部符号 KF）
//   ai → 关闭 SQLite state runtime 并清空记忆化缓存（内部符号 JF）
import {
  ai as closeStateSqliteRuntime,
  oi as getStateDatabasePath,
  si as openStateSqliteRuntime,
} from "@chunk/shared";

// ---- 常量（原 _A/vA/yA/bA/xA/SA/CA）-----------------------------------------

/** 恢复对话框的按钮文案（原 `_A`）。 */
const RECOVERY_DIALOG_ACTION_LABELS = {
  retry: `Retry`,
  recover: `Back Up and Rebuild`,
  quit: `Quit`,
} as const;

/** 备份目录名（原 `vA`）。 */
const DB_BACKUPS_DIRECTORY_NAME = `db-backups`;
/** app-server 侧 sqlite state runtime 初始化失败前缀（原 `yA`）。 */
const SQLITE_RUNTIME_INIT_FAILURE_PREFIX = `failed to initialize sqlite state runtime under `;
/** state runtime 初始化失败前缀（原 `bA`）。 */
const STATE_RUNTIME_INIT_FAILURE_PREFIX = `failed to initialize state runtime at `;
/** state db 回填等待超时前缀（原 `xA`）。 */
const STATE_DB_BACKFILL_TIMEOUT_PREFIX = `timed out waiting for state db backfill at `;
/** app-server 进程关闭错误前缀（原 `SA`，33 字符）。 */
const APP_SERVER_CLOSED_PREFIX = `Codex app-server process closed: `;
/** 「最近的错误」分隔符（原 `CA`，20 字符）。 */
const MOST_RECENT_ERROR_SEPARATOR = `
Most recent error: `;

// ---- 类型 -------------------------------------------------------------------

/** 恢复对话框的动作（原 `jA` 的返回值）。 */
type RecoveryAction = `retry` | `recover` | `quit`;

/** `EA` 的入参：迁移溯源信息（主流程的 Aj 快照，透传给 state runtime）。 */
export interface SqliteMigrationProvenance {
  appVersion: string;
  buildFlavor: string;
  buildCommit: unknown;
}

/** better-sqlite3 state runtime 的最小面（`AA` 的就绪探测用）。 */
interface SqliteStateRuntime {
  prepare(sql: string): { get(...params: unknown[]): { user_version?: unknown } | undefined };
}

/** 恢复失败包装（原 `{originalError, recoveryError}`，`WA` 的判定目标）。 */
interface RecoveryFailure {
  originalError: unknown;
  recoveryError: unknown;
}

/** `DA` 的入参。 */
interface OpenStateRuntimeWithRecoveryOptions {
  databasePath: string | null | undefined;
  /** 首次遇到 backfill 超时时等待一次（等 app-server 完成回填）。 */
  onBackfillWait?: () => void | Promise<void>;
  open: () => void | Promise<void>;
  /** 错误是否归本流程处理，默认全部处理（原 `DA` 的 shouldHandleError）。 */
  shouldHandleError?: (error: unknown) => boolean;
}

// ---- 入口 gate ---------------------------------------------------------------

/**
 * 打开 SQLite state runtime 并在失败时恢复（原 `EA`）。
 * 返回 false 表示用户选择了 Quit（app 已退出，主流程应终止启动）。
 */
export async function recoverSqliteState(
  migrationProvenance: SqliteMigrationProvenance,
): Promise<boolean> {
  return openStateRuntimeWithRecovery({
    databasePath: getStateDatabasePath(),
    open: () => {
      const runtime = openStateSqliteRuntime({ migrationProvenance }) as
        | SqliteStateRuntime
        | null;
      if (runtime == null) throw Error(`SQLite is only available in the Electron app.`);
      verifySqliteReadiness(runtime);
    },
  });
}

/**
 * 带恢复循环的打开流程（原 `DA`）。语义见文件头；同一备份目录的自动恢复
 * 只尝试一次（handledBackupDirs），之后交给对话框。
 */
export async function openStateRuntimeWithRecovery({
  databasePath,
  onBackfillWait,
  open,
  shouldHandleError = () => true,
}: OpenStateRuntimeWithRecoveryOptions): Promise<boolean> {
  const handledBackupDirs = new Set<string>();
  let waitedForBackfill = false;
  for (;;)
    try {
      return (await open(), true);
    } catch (error) {
      if (!shouldHandleError(error)) throw error;
      // 回填超时：自动重试（首次先等一次 onBackfillWait）。
      if (isStateDbBackfillTimeoutError(error)) {
        waitedForBackfill || ((waitedForBackfill = true), await onBackfillWait?.());
        continue;
      }
      const normalizedDbPath = absoluteDatabasePathOrNull(databasePath);
      let currentError: unknown = error;
      if (
        normalizedDbPath != null &&
        (isSqliteCorruptionError(error, normalizedDbPath) ||
          (await isRecoverableDatabaseLocation(normalizedDbPath))) &&
        !handledBackupDirs.has(normalizedDbPath)
      ) {
        handledBackupDirs.add(normalizedDbPath);
        try {
          await backUpAndRebuildStateDatabase(normalizedDbPath);
          continue;
        } catch (recoveryError) {
          currentError = { originalError: error, recoveryError };
        }
      }
      for (;;) {
        const action = await showStateRecoveryDialog(normalizedDbPath, currentError);
        if (action === `retry`) break;
        if (action === `recover` && normalizedDbPath != null)
          try {
            await backUpAndRebuildStateDatabase(normalizedDbPath);
            break;
          } catch (recoveryError) {
            currentError = { originalError: currentError, recoveryError };
            continue;
          }
        return (app.quit(), false);
      }
      continue;
    }
}

// ---- 错误分类 ----------------------------------------------------------------

/** 判断是否 state runtime 启动类错误（原 `wA`）。 */
export function isStateRuntimeStartupError(error: unknown): boolean {
  const message = extractMostRecentErrorMessage(error);
  return (
    message.startsWith(SQLITE_RUNTIME_INIT_FAILURE_PREFIX) ||
    message.startsWith(STATE_RUNTIME_INIT_FAILURE_PREFIX) ||
    message.startsWith(STATE_DB_BACKFILL_TIMEOUT_PREFIX)
  );
}

/**
 * 提取「最近的错误」消息（原 `TA`）：app-server 关闭包装去掉 33 字符前缀；
 * 含「Most recent error:」分隔符时只取分隔符之后（去掉历史噪声）。
 */
function extractMostRecentErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.startsWith(APP_SERVER_CLOSED_PREFIX)) return message.slice(APP_SERVER_CLOSED_PREFIX.length);
  const separatorIndex = message.indexOf(MOST_RECENT_ERROR_SEPARATOR);
  return separatorIndex === -1
    ? message
    : message.slice(separatorIndex + MOST_RECENT_ERROR_SEPARATOR.length);
}

/** 判断是否 backfill 等待超时（原 `kA`）。 */
function isStateDbBackfillTimeoutError(error: unknown): boolean {
  const message = extractMostRecentErrorMessage(error);
  return isStateRuntimeStartupError(error) && message.includes(STATE_DB_BACKFILL_TIMEOUT_PREFIX);
}

/** 就绪探测（原 `AA`）：PRAGMA user_version 必须返回数字。 */
function verifySqliteReadiness(runtime: SqliteStateRuntime): void {
  if (typeof runtime.prepare(`PRAGMA user_version`).get()?.user_version != `number`)
    throw Error(`SQLite readiness query returned an unexpected result.`);
}

/** 数据库路径归一（原 `OA`）：posix/win32 绝对路径才有效，否则 null。 */
function absoluteDatabasePathOrNull(path: string | null | undefined): string | null {
  return path != null && (posix.isAbsolute(path) || win32.isAbsolute(path)) ? path : null;
}

// ---- 对话框（原 jA/NA）-------------------------------------------------------

/**
 * 恢复对话框（原 `jA`）：错误弹窗，按钮按是否有数据库路径给出
 * Retry/Quit 或 Retry/Back Up and Rebuild/Quit；返回所选动作（越界按 quit）。
 */
async function showStateRecoveryDialog(
  databasePath: string | null,
  error: unknown,
): Promise<RecoveryAction> {
  const actions: RecoveryAction[] =
    databasePath == null ? [`retry`, `quit`] : [`retry`, `recover`, `quit`];
  return (
    actions[
      (
        await dialog.showMessageBox({
          type: `error`,
          buttons: actions.map((action) => RECOVERY_DIALOG_ACTION_LABELS[action]),
          defaultId: 0,
          cancelId: actions.length - 1,
          message: `${app.getName()} cannot access its local database.`,
          detail: [
            `The app cannot finish launching until its SQLite database is accessible.`,
            ``,
            `Database path: ${databasePath ?? `unavailable in app-server startup error`}`,
            ``,
            databasePath == null
              ? `Close other ${app.getName()} applications, then click Retry to check whether access has been restored.`
              : `Close other ${app.getName()} applications, then click Retry to check whether access has been restored. If the database cannot be opened, Back Up and Rebuild moves it aside so the app can create a fresh one.`,
            ``,
            `Error: ${formatStateRecoveryError(error)}`,
          ].join(`
`),
          noLink: true,
        })
      ).response
    ] ?? `quit`
  );
}

/** 备份迁移并弹「已重建」信息（原 `MA`）。 */
async function backUpAndRebuildStateDatabase(databasePath: string): Promise<void> {
  await showStateRebuiltDialog(databasePath, await backUpStateDatabaseFiles(databasePath));
}

/** 「数据库已重建」信息弹窗（原 `NA`）；给了父窗口则挂到其上。 */
export async function showStateRebuiltDialog(
  databasePath: string,
  backupDirectory: string,
  parentWindow?: BrowserWindow,
): Promise<void> {
  const messageBoxOptions = {
    type: `info` as const,
    buttons: [`OK`],
    defaultId: 0,
    cancelId: 0,
    message: `${app.getName()} rebuilt its local database.`,
    detail: [
      `${app.getName()} detected a damaged local database, moved it into a backup folder, and will continue startup with a fresh database.`,
      ``,
      `Database path: ${databasePath}`,
      ``,
      `Backup folder: ${backupDirectory}`,
    ].join(`
`),
    noLink: true,
  };
  if (parentWindow == null || parentWindow.isDestroyed()) {
    await dialog.showMessageBox(messageBoxOptions);
    return;
  }
  await dialog.showMessageBox(parentWindow, messageBoxOptions);
}

/**
 * 格式化恢复错误（原 `PA`）：恢复失败时把原始错误与恢复错误串联，
 * 空消息的 Error 退化为 String(error)。
 */
function formatStateRecoveryError(error: unknown): string {
  return isRecoveryFailure(error)
    ? [
        formatStateRecoveryError(error.originalError),
        ``,
        `Recovery failed: ${formatStateRecoveryError(error.recoveryError)}`,
      ].join(`
`)
    : error instanceof Error && error.message.length > 0
      ? error.message
      : String(error);
}

// ---- 备份迁移（原 FA/IA/LA/RA/zA/BA/VA/HA）----------------------------------

/**
 * 备份数据库文件（原 `FA`）：先关闭 state runtime（释放文件句柄）；
 * 父目录本身是文件（db 路径空间被文件占用）时整个目录级备份（`zA`），
 * 否则把 db/-wal/-shm 三个文件移入新的备份目录。
 */
async function backUpStateDatabaseFiles(databasePath: string): Promise<string> {
  closeStateSqliteRuntime();
  const parentDirectory = dirname(databasePath);
  if ((await statOrNull(parentDirectory))?.isFile()) return backUpDatabaseDirectory(parentDirectory);
  const dbFiles = stateDatabaseSiblingFiles(databasePath);
  const backupDirectory = await createBackupsDirectory(parentDirectory);
  for (const file of dbFiles)
    (await fileExists(file)) && (await rename(file, join(backupDirectory, basename(file))));
  return backupDirectory;
}

/** db 及其 WAL/SHM 兄弟文件（原 `IA`）。 */
function stateDatabaseSiblingFiles(databasePath: string): string[] {
  return [databasePath, `${databasePath}-wal`, `${databasePath}-shm`];
}

/** 在 parentDir 下创建 db-backups/<唯一目录>（原 `LA`）。 */
async function createBackupsDirectory(parentDirectory: string): Promise<string> {
  return createUniqueBackupDirectory(join(parentDirectory, DB_BACKUPS_DIRECTORY_NAME));
}

/**
 * 创建唯一备份目录（原 `RA`）：`sqlite-<秒级时间戳>-<序号>`，撞名（EEXIST）
 * 则序号递增重试。
 */
async function createUniqueBackupDirectory(baseDirectory: string): Promise<string> {
  await mkdir(baseDirectory, { recursive: true });
  for (let attempt = 0; ; attempt += 1) {
    const directory = join(
      baseDirectory,
      `sqlite-${Math.floor(Date.now() / 1e3)}-${attempt}`,
    );
    try {
      return (await mkdir(directory, { recursive: false }), directory);
    } catch (error) {
      if (!hasErrorCode(error, `EEXIST`)) throw error;
    }
  }
}

/**
 * 目录级备份（原 `zA`）：把整个目录移到 `<目录名>.db-backups/<唯一目录>/` 下，
 * 并重建空目录。
 */
async function backUpDatabaseDirectory(directory: string): Promise<string> {
  const backupDirectory = await createUniqueBackupDirectory(
    join(dirname(directory), `${basename(directory)}.${DB_BACKUPS_DIRECTORY_NAME}`),
  );
  return (
    await rename(directory, join(backupDirectory, basename(directory))),
    await mkdir(directory, { recursive: true }),
    backupDirectory
  );
}

/** 文件是否存在（原 `BA`；非 ENOENT 的 stat 错误向上抛）。 */
async function fileExists(path: string): Promise<boolean> {
  try {
    return (await stat(path), true);
  } catch (error) {
    if (hasErrorCode(error, `ENOENT`)) return false;
    throw error;
  }
}

/**
 * 数据库位置是否可恢复（原 `VA`）：父目录是文件（db 路径被同名文件占住）
 * 或路径本身是个目录时，备份迁移可以救。
 */
async function isRecoverableDatabaseLocation(databasePath: string): Promise<boolean> {
  return (await statOrNull(dirname(databasePath)))?.isFile()
    ? true
    : ((await statOrNull(databasePath))?.isDirectory() ?? false);
}

/** stat，ENOENT 返回 null（原 `HA`；其余错误向上抛）。 */
async function statOrNull(path: string): Promise<{ isFile(): boolean; isDirectory(): boolean } | null> {
  try {
    return await stat(path);
  } catch (error) {
    if (hasErrorCode(error, `ENOENT`)) return null;
    throw error;
  }
}

// ---- 损坏判定（原 UA/WA/GA）--------------------------------------------------

/**
 * 判断是否 SQLite 损坏类错误（原 `UA`）：错误码 SQLITE_CORRUPT/SQLITE_NOTADB，
 * 或（去掉数据库路径后的）消息包含磁盘映像损坏 / 非数据库文件 /
 * `sqlite_corrupt|sqlite_notadb` 字样。
 */
function isSqliteCorruptionError(error: unknown, databasePath: string): boolean {
  if (hasErrorCode(error, `SQLITE_CORRUPT`) || hasErrorCode(error, `SQLITE_NOTADB`)) return true;
  const message = formatStateRecoveryError(error)
    .replaceAll(databasePath, ``)
    .toLowerCase();
  return (
    message.includes(`database disk image is malformed`) ||
    message.includes(`file is not a database`) ||
    /\bsqlite_(?:corrupt|notadb)\b/.test(message)
  );
}

/** 判断是否恢复失败包装（原 `WA`）。 */
function isRecoveryFailure(error: unknown): error is RecoveryFailure {
  return (
    typeof error == `object` && !!error && `originalError` in error && `recoveryError` in error
  );
}

/** 判断错误对象的 code 是否等于给定值（原 `GA`）。 */
function hasErrorCode(error: unknown, code: string): boolean {
  return typeof error == `object` && !!error && `code` in error && error.code === code;
}
