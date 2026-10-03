import { mkdirSync } from "node:fs";
import { dirname, posix, win32 } from "node:path";

type SqlStatement = { get(...params: unknown[]): Record<string, unknown> | undefined; all(...params: unknown[]): unknown[]; run(...params: unknown[]): { changes?: number } };
export interface SqliteDatabase {
  close(): void;
  exec(sql: string): void;
  prepare(sql: string): SqlStatement;
}
let activeDatabase: SqliteDatabase | null = null;
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
    activeDatabase = database;
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

/** 原 RI：Windows 主机向非 Windows execution host 传路径时转换为 POSIX/WSL 形式。 */
export function localPathForHost(value: { platformFamily: string; localPath: string }): string {
  if (process.platform !== "win32" || value.platformFamily === "windows") return value.localPath;
  const extendedUnc = value.localPath.match(/^(?:\\\\|\/\/)\?[\\/](wsl\$|wsl\.localhost)[\\/](.*)$/i);
  const path = extendedUnc ? `\\\\${extendedUnc[1]}\\${extendedUnc[2]}` : value.localPath;
  const extendedDrive = path.match(/^(?:\\\\|\/\/)\?[\\/]([a-z]):[\\/](.*)$/i);
  if (extendedDrive) return `/mnt/${extendedDrive[1].toLowerCase()}/${extendedDrive[2].replaceAll("\\", "/")}`;
  if (/^(?:\\\\|\/\/)(?:wsl\$|wsl\.localhost)/i.test(path)) {
    const parts = path.replace(/^((?:\\\\|\/\/)(?:wsl\$|wsl\.localhost)[\\/]+)/i, "").split(/[\\/]/);
    parts.shift();
    const result = parts.join("/").replaceAll("\\", "/");
    return result.length === 0 ? "/" : result.startsWith("/") ? result : `/${result}`;
  }
  if (path.startsWith("\\\\") || path.startsWith("//")) return path.replaceAll("/", "\\");
  if (path.startsWith("/")) return path;
  const drive = path.match(/^([a-z]):[\\/](.*)$/i);
  return drive ? `/mnt/${drive[1].toLowerCase()}/${drive[2].replaceAll("\\", "/")}` : path.replaceAll("\\", "/");
}

function db(): SqliteDatabase | null { return activeDatabase; }
function changed(statement: SqlStatement, ...params: unknown[]): boolean { return (statement.run(...params).changes ?? 0) > 0; }

export function recordAutomationRunStart(automationId: string, threadId: string, title: string | null, cwd: string | null): boolean {
  const database = db(); if (!database) return false; const now = Date.now();
  return changed(database.prepare("INSERT OR IGNORE INTO automation_runs (thread_id, automation_id, status, thread_title, source_cwd, created_at, updated_at) VALUES (?, ?, 'IN_PROGRESS', ?, ?, ?, ?)"), threadId, automationId, title, cwd, now, now);
}
export function recordAutomationRunPending(threadId: string, readAt?: number | null): boolean {
  const database = db(); if (!database) return false;
  return changed(database.prepare("UPDATE automation_runs SET status = 'PENDING_REVIEW', read_at = CASE WHEN ? THEN NULL ELSE COALESCE(read_at, ?) END, updated_at = ? WHERE thread_id = ? AND (status = 'IN_PROGRESS' OR (? AND status = 'PENDING_REVIEW'))"), readAt === null, readAt ?? null, Date.now(), threadId, readAt !== undefined);
}
export function archivePendingRuns(): boolean {
  const database = db(); if (!database) return false; const now = Date.now();
  const a = changed(database.prepare("UPDATE automation_runs SET status = 'ARCHIVED', updated_at = ?, archived_reason = COALESCE(archived_reason, 'auto') WHERE status = 'IN_PROGRESS' AND thread_id LIKE 'pending:%'"), now);
  const b = changed(database.prepare("UPDATE automation_runs SET status = 'PENDING_REVIEW', updated_at = ? WHERE status = 'IN_PROGRESS'"), now); return a || b;
}
export function archiveAutomationRun(threadId: string, reason?: string | null): boolean { const database = db(); return database ? changed(database.prepare("UPDATE automation_runs SET status = 'ARCHIVED', updated_at = ?, archived_reason = COALESCE(archived_reason, ?) WHERE thread_id = ?"), Date.now(), reason ?? null, threadId) : false; }
export function updateArchivedMessages(threadId: string, userMessage: string | null, assistantMessage: string | null): boolean { const database = db(); return database ? changed(database.prepare("UPDATE automation_runs SET archived_user_message = ?, archived_assistant_message = ?, updated_at = ? WHERE thread_id = ?"), userMessage, assistantMessage, Date.now(), threadId) : false; }
export function renameAutomationThread(threadId: string, title: string): boolean { const database = db(); return database ? changed(database.prepare("UPDATE automation_runs SET thread_title = ?, updated_at = ? WHERE thread_id = ?"), title, Date.now(), threadId) : false; }
export function updateInboxItem(threadId: string, title: string, summary: string): boolean { const database = db(); return database ? changed(database.prepare("UPDATE automation_runs SET inbox_title = ?, inbox_summary = ?, status = CASE WHEN status = 'IN_PROGRESS' THEN 'PENDING_REVIEW' ELSE status END, updated_at = ? WHERE thread_id = ?"), title, summary, Date.now(), threadId) : false; }
export function reassignAutomationRun(oldThreadId: string, newThreadId: string): boolean { const database = db(); return database ? changed(database.prepare("UPDATE automation_runs SET thread_id = ?, updated_at = ? WHERE thread_id = ?"), newThreadId, Date.now(), oldThreadId) : false; }
export function deleteRunsForThread(threadId: string): boolean { const database = db(); return database ? changed(database.prepare("DELETE FROM automation_runs WHERE thread_id = ?"), threadId) : false; }
export function deleteRunsForAutomation(automationId: string): boolean { const database = db(); return database ? changed(database.prepare("DELETE FROM automation_runs WHERE automation_id = ?"), automationId) : false; }
export function acceptArchivedRun(threadId: string): boolean { const database = db(); return database ? changed(database.prepare("UPDATE automation_runs SET status = 'ACCEPTED', read_at = COALESCE(read_at, ?), updated_at = ?, archived_reason = NULL WHERE thread_id = ? AND status = 'ARCHIVED'"), Date.now(), Date.now(), threadId) : false; }
export function parseToml(text: string, options: { integersAsBigInt?: boolean } = {}): Record<string, unknown> {
  const root: Record<string, unknown> = {}; let target = root;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim(); if (!line) continue;
    const table = line.match(/^\[([^\]]+)\]$/); if (table) { target = root; for (const key of table[1].split(".")) target = (target[key] ??= {}) as Record<string, unknown>; continue; }
    const match = line.match(/^([A-Za-z0-9_-]+)\s*=\s*(.*)$/); if (!match) continue;
    const value = match[2].trim(); let parsed: unknown;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) parsed = value.slice(1, -1);
    else if (value === "true" || value === "false") parsed = value === "true";
    else if (/^-?\d+$/.test(value)) parsed = options.integersAsBigInt ? BigInt(value) : Number(value);
    else if (value.startsWith("[") && value.endsWith("]")) parsed = value.slice(1, -1).split(",").map((item) => item.trim()).filter(Boolean).map((item) => item.replace(/^['"]|['"]$/g, ""));
    else parsed = value;
    target[match[1]] = parsed;
  }
  return root;
}
const generationStatuses = new Map<string, { projectRoot: string; domain?: string; [key: string]: unknown }>();
export function getGenerationStatuses(): Array<{ projectRoot: string; domain?: string; [key: string]: unknown }> { return [...generationStatuses.values()].sort((a, b) => a.projectRoot.localeCompare(b.projectRoot) || (a.domain ?? "").localeCompare(b.domain ?? "")); }

export function closeSqlite(): void { activeDatabase?.close(); activeDatabase = null; }
export function createAutomationGuard(threadId: string, owner: { accountId?: string; userId?: string; installationId?: string }, isCurrent: () => boolean) {
  const database = db(); if (!database) return null;
  const row = database.prepare("SELECT automation_id as automationId FROM automation_runs WHERE thread_id = ?").get(threadId);
  if (!row || typeof row.automationId !== "string") return null;
  const current = () => isCurrent() && db() === database && database.prepare("SELECT 1 FROM automation_runs WHERE thread_id = ? AND automation_id = ?").get(threadId, row.automationId) != null;
  return { isCurrent: current, apply: (title: string, summary: string) => current() && changed(database.prepare("UPDATE automation_runs SET inbox_title = ?, inbox_summary = ?, status = CASE WHEN status = 'IN_PROGRESS' THEN 'PENDING_REVIEW' ELSE status END, updated_at = ? WHERE thread_id = ? AND automation_id = ?"), title, summary, Date.now(), threadId, row.automationId) };
}
export async function getAccessibleApps(connection: { sendAppServerRequest(method: string, params: unknown): Promise<{ apps: Array<{ id: string; callable?: boolean; enabled?: boolean; runtimeName?: string }> }> }) { return (await connection.sendAppServerRequest("app/installed", {})).apps ?? []; }
export function isEnabledApp(app: { callable?: boolean; enabled?: boolean }): boolean { return app.callable === true && app.enabled === true; }
export async function getChatGptComposerItems(connection: { getAuthToken?: (options: { refreshToken: boolean }) => Promise<string | null> }, entrypoint: string): Promise<unknown[]> {
  const token = await connection.getAuthToken?.({ refreshToken: false }); if (!token) return [];
  const base = (process.env.CODEX_API_BASE_URL ?? process.env.CODEX_API_ENDPOINT ?? "https://chatgpt.com").replace(/\/$/, "");
  const response = await fetch(`${base}/composer/items?${new URLSearchParams({ entrypoint, limit: "50" })}`, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  if (!response.ok) throw Error(`ChatGPT request failed with ${response.status}`);
  const body = await response.json() as { items?: unknown[] }; return Array.isArray(body.items) ? body.items : [];
}
export async function recordComposerItemInteraction(connection: { getAuthToken?: (options: { refreshToken: boolean }) => Promise<string | null> }, item: Record<string, unknown>, interaction: string, entrypoint: string): Promise<void> {
  const token = await connection.getAuthToken?.({ refreshToken: false }); if (!token) throw Error("ChatGPT authentication is unavailable");
  const base = (process.env.CODEX_API_BASE_URL ?? process.env.CODEX_API_ENDPOINT ?? "https://chatgpt.com").replace(/\/$/, "");
  const response = await fetch(`${base}/composer/items/interactions`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, producer: item.producer, item_type: item.item_type, interaction_type: interaction, entrypoint }) });
  if (!response.ok) throw Error(`ChatGPT request failed with ${response.status}`);
}
export function stateDatabasePath(options?: { databaseFileName?: string }): string { const root = process.env.CODEX_HOME ?? process.env.HOME ?? ".codex"; return `${root}/sqlite/${options?.databaseFileName ?? "state_5.sqlite"}`; }
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> { return await Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Operation timed out")), timeoutMs))]); }
export async function removeRuntimeDirectory(path: string): Promise<void> { const { chmod, rm } = await import("node:fs/promises"); await chmod(path, 0o700).catch(() => undefined); await rm(path, { recursive: true, force: true }); }

export { recordAutomationRunStart as Qr, createAutomationGuard as Zr, closeSqlite as ai, getAccessibleApps as di, removeRuntimeDirectory as ei, deleteRunsForAutomation as ii, getChatGptComposerItems as li, recordComposerItemInteraction as mi, removeRuntimeDirectory as ni, withTimeout as oi, stateDatabasePath as si, archiveAutomationRun as ti, isEnabledApp as ui, parseToml as wi, getGenerationStatuses as fi };

export {
  principalOfToken as _i,
  chatGptAccountOfToken as vi,
  openSqlite as ci,
  DisposableBag as Wr,
  pathApiForPlatform as Hr,
  localPathForHost as Ur,
};
