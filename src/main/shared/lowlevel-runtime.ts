// lowlevel-export-shim: the remaining shared exports used by main-app.
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface AutomationInboxDatabase {
  prepare(sql: string): { all(...params: unknown[]): unknown[]; get(...params: unknown[]): unknown; run(...params: unknown[]): { changes?: number } };
}
let inboxDatabase: AutomationInboxDatabase | null = null;
export function registerAutomationInboxDatabase(database: AutomationInboxDatabase | null): void { inboxDatabase = database; }

/** Persist inbox entries. The SQL shape matches the automation_runs projection. */
export function persistInboxItems(items: unknown): number {
  if (!inboxDatabase || !Array.isArray(items)) return 0;
  const statement = inboxDatabase.prepare("INSERT INTO automation_runs (thread_id, inbox_title, inbox_summary, status, created_at, updated_at) VALUES (?, ?, ?, 'PENDING_REVIEW', ?, ?)");
  let count = 0;
  const now = Date.now();
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const value = item as Record<string, unknown>;
    const threadId = typeof value.threadId === "string" ? value.threadId : typeof value.id === "string" ? value.id : null;
    const title = typeof value.title === "string" ? value.title : null;
    const summary = typeof value.description === "string" ? value.description : null;
    if (!threadId || !title) continue;
    statement.run(threadId, title, summary, now, now); count++;
  }
  return count;
}
export function markInboxItemsReadState(items: unknown, readAt: unknown): boolean {
  if (!inboxDatabase || !Array.isArray(items)) return false;
  const statement = inboxDatabase.prepare("UPDATE automation_runs SET read_at = ? WHERE thread_id = ?");
  let changed = false;
  for (const item of items) {
    const id = item && typeof item === "object" && "threadId" in item ? (item as { threadId?: unknown }).threadId : item;
    if (typeof id === "string") changed = (statement.run(readAt, id).changes ?? 0) > 0 || changed;
  }
  return changed;
}
export function markAllAutomationRunsRead(accountId: unknown): number {
  if (!inboxDatabase) return 0;
  return inboxDatabase.prepare("UPDATE automation_runs SET read_at = ? WHERE read_at IS NULL").run(Date.now(), accountId).changes ?? 0;
}

/** Stop stale node-repl executions recorded under codexHome. */
export async function killNodeReplExecution({ codexHome, sessionId, turnId, signal, dependencies = {} }: { codexHome: string; sessionId: string; turnId: string; signal?: AbortSignal; dependencies?: { killProcess?: (pid: number) => void } }): Promise<{ failedCount: number; killedCount: number; scannedCount: number; staleCount: number }> {
  signal?.throwIfAborted();
  const root = join(codexHome, "node_repl", "active_execs");
  let entries: string[];
  try { entries = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => join(root, entry.name)); } catch (error) { if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return { failedCount: 0, killedCount: 0, scannedCount: 0, staleCount: 0 }; throw error; }
  const result = { failedCount: 0, killedCount: 0, scannedCount: 0, staleCount: 0 };
  for (const recordPath of entries) {
    signal?.throwIfAborted(); result.scannedCount++;
    try {
      const record = JSON.parse(await readFile(recordPath, "utf8")) as { sessionId?: string; turnId?: string; nodeReplPid?: number; kernelPid?: number };
      if (record.sessionId !== sessionId || record.turnId !== turnId) continue;
      result.staleCount++;
      for (const pid of [record.nodeReplPid, record.kernelPid]) if (typeof pid === "number" && pid > 0) { try { dependencies.killProcess?.(pid) ?? process.kill(pid, "SIGTERM"); result.killedCount++; } catch { result.failedCount++; } }
      await rm(recordPath, { force: true });
    } catch { result.failedCount++; }
  }
  return result;
}

export async function requestThreadUnsubscribe(service: { getThreadRole(input: { hostId: string; conversationId: string }): Promise<unknown> }, hostId: string, conversationId: string): Promise<boolean> {
  const role = await service.getThreadRole({ hostId, conversationId });
  return role === "owner";
}

export async function downloadPluginsAsset(config: { url: string; sha256?: string; version?: string }, options: { destination?: string; downloadFile?: (url: string, destination: string, headers?: Record<string, string>) => Promise<void> } = {}): Promise<boolean> {
  if (!config.url) throw new Error("Plugin archive URL is required");
  if (!options.destination) return false;
  await mkdir(join(options.destination, ".."), { recursive: true });
  if (options.downloadFile) await options.downloadFile(config.url, options.destination);
  else { const response = await fetch(config.url); if (!response.ok) throw new Error(`Plugin download failed: ${response.status}`); await writeFile(options.destination, Buffer.from(await response.arrayBuffer())); }
  if (config.sha256) { const digest = createHash("sha256").update(await readFile(options.destination)).digest("hex"); if (digest.toLowerCase() !== config.sha256.toLowerCase()) { await rm(options.destination, { force: true }); throw new Error("Plugin archive checksum mismatch"); } }
  return true;
}

export { persistInboxItems as w, markInboxItemsReadState as x, markAllAutomationRunsRead as b, killNodeReplExecution as k, requestThreadUnsubscribe as m, downloadPluginsAsset as Z };
