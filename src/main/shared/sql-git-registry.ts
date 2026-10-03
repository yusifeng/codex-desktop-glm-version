import { mkdirSync } from "node:fs";
import { dirname, posix, win32 } from "node:path";

type SqlStatement = { get(...params: unknown[]): Record<string, unknown> | undefined };
export interface SqliteDatabase {
  close(): void;
  exec(sql: string): void;
  prepare(sql: string): SqlStatement;
}
type SqliteConstructor = new (path: string) => SqliteDatabase;

function sqliteConstructor(): SqliteConstructor {
  try {
    return require("better-sqlite3") as SqliteConstructor;
  } catch {
    throw Error("better-sqlite3 is only bundled with the Electron app");
  }
}

/** 原 qF：以 WAL + 对应 synchronous 策略打开 SQLite，并原子执行初始化器。 */
export function openSqlite(path: string, initialize: (database: SqliteDatabase) => void): SqliteDatabase {
  mkdirSync(dirname(path), { recursive: true });
  const database = new (sqliteConstructor())(path);
  try {
    const mode = database.prepare("PRAGMA journal_mode = WAL").get()?.journal_mode;
    database.exec(mode === "wal" ? "PRAGMA synchronous = NORMAL" : "PRAGMA synchronous = FULL");
    initialize(database);
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

function jwtPayload(token: string | null | undefined): Record<string, unknown> | null {
  const encoded = token?.split(".", 3)[1];
  if (!encoded) return null;
  try {
    const value: unknown = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return typeof value === "object" && value != null ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

/** 原 HN：读取 ChatGPT account / FedRAMP claims；非法 FedRAMP 类型保持抛错。 */
export function chatGptAccountOfToken(token: string) {
  const auth = jwtPayload(token)?.["https://api.openai.com/auth"];
  if (typeof auth !== "object" || auth == null) return null;
  const claims = auth as Record<string, unknown>;
  if (claims.chatgpt_account_is_fedramp != null && typeof claims.chatgpt_account_is_fedramp !== "boolean")
    throw Error("Invalid ChatGPT FedRAMP account claim");
  return {
    accountId: typeof claims.chatgpt_account_id === "string" ? claims.chatgpt_account_id : undefined,
    isFedramp: typeof claims.chatgpt_account_is_fedramp === "boolean" ? claims.chatgpt_account_is_fedramp : undefined,
  };
}

/** 原 UN：从 JWT 解析当前 account/user principal 与过期时间。 */
export function principalOfToken(token: string | null | undefined) {
  const payload = jwtPayload(token);
  const auth = payload?.["https://api.openai.com/auth"];
  const expires = payload?.exp;
  if (typeof auth !== "object" || auth == null || typeof expires !== "number" || expires <= 0) return null;
  const claims = auth as Record<string, unknown>;
  const accountId = claims.chatgpt_account_id ?? claims.account_id;
  const userId = claims.user_id ?? claims.chatgpt_user_id;
  return typeof accountId === "string" && accountId && typeof userId === "string" && userId
    ? { accountId, userId, expiresAtMs: expires * 1000 }
    : null;
}

/** 原 II：接收 disposer 或 disposable 对象的轻量资源袋。 */
export class DisposableBag {
  private readonly disposables: Array<{ dispose(): void }> = [];
  add(disposable: { dispose(): void } | (() => void)): void {
    this.disposables.push(typeof disposable === "function" ? { dispose: disposable } : disposable);
  }
  dispose(): void {
    for (const disposable of this.disposables) disposable.dispose();
    this.disposables.length = 0;
  }
}

/** 原 LI：选择远端平台对应的 path API。 */
export function pathApiForPlatform(platform: string) {
  return platform === "windows" ? win32 : posix;
}

/** 原 RI：Windows 主机展示非 Windows execution-host 路径时转换 /mnt/<drive>。 */
export function localPathForHost(value: { platformFamily: string; localPath: string }): string {
  if (process.platform !== "win32" || value.platformFamily === "windows") return value.localPath;
  return value.localPath
    .replace(/^\/mnt\/([a-z])(?:\/|$)/i, (_match, drive: string) => `${drive.toUpperCase()}:\\`)
    .replaceAll("/", "\\");
}

export {
  principalOfToken as _i,
  chatGptAccountOfToken as vi,
  openSqlite as ci,
  DisposableBag as Wr,
  pathApiForPlatform as Hr,
  localPathForHost as Ur,
};
