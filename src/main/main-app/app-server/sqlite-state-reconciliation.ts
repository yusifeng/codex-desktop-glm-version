import { access, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { createRequire } from "node:module";

const requireFromMain = createRequire(
  import.meta.url.startsWith("file:") ? import.meta.url : `${process.cwd()}/package.json`,
);

export const APP_SERVER_SQLITE_FILENAME = `state_5.sqlite`;
export const APP_SERVER_SQLITE_RECONCILIATION_MARKER = `.app-server-state-reconciled-v1`;
export const MISSING_CWD_REPAIR_LIMIT = 200;

interface Statement {
  all(...params: any[]): any[];
  get(...params: any[]): any;
  run(...params: any[]): { changes: number | bigint };
}

export interface SqliteDatabase {
  prepare(sql: string): Statement;
  exec(sql: string): void;
  close(): void;
  backup(path: string): Promise<unknown>;
}

export type SqliteDatabaseConstructor = new (
  path: string,
  options?: { fileMustExist?: boolean; readonly?: boolean },
) => SqliteDatabase;

export interface SqliteReconciliationSummary {
  dynamicToolsInserted: number;
  inserted: number;
  repaired: number;
  spawnEdgesInserted: number;
}

interface Logger {
  info(message: string, details: unknown): void;
  warning(message: string, details: unknown): void;
}

export function quoteSqliteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll(`"`, `""`)}"`;
}

export function sqliteTableColumns(database: SqliteDatabase, table: string): string[] {
  return database
    .prepare(`PRAGMA table_info(${quoteSqliteIdentifier(table)})`)
    .all()
    .flatMap((row) => (typeof row.name === `string` ? [row.name] : []));
}

function commonTableColumns(
  destination: SqliteDatabase,
  source: SqliteDatabase,
  table: string,
): string[] {
  let sourceColumns = new Set(sqliteTableColumns(source, table));
  return sqliteTableColumns(destination, table).filter((column) => sourceColumns.has(column));
}

function isEmptySqliteValue(value: unknown): boolean {
  return value == null || value === ``;
}

function sqliteTimestamp(value: unknown): number | bigint {
  return typeof value === `bigint` || typeof value === `number` ? value : -1;
}

/** Merge temporary app-server tables into the durable database in one transaction (original `Sue`). */
export function mergeAppServerSqliteState(
  destination: SqliteDatabase,
  source: SqliteDatabase,
): SqliteReconciliationSummary {
  let threadColumns = commonTableColumns(destination, source, `threads`);
  let updatedColumn = threadColumns.includes(`updated_at_ms`) ? `updated_at_ms` : `updated_at`;
  let projection = threadColumns.map(quoteSqliteIdentifier).join(`, `);
  let placeholders = threadColumns.map(() => `?`).join(`, `);
  let existingThread = destination.prepare(`SELECT ${projection} FROM threads WHERE id = ?`);
  let insertThread = destination.prepare(`INSERT INTO threads (${projection}) VALUES (${placeholders})`);
  let inserted = 0;
  let repaired = 0;
  let changedThreadIds = new Set<string>();

  destination.exec(`BEGIN IMMEDIATE`);
  try {
    for (let sourceThread of source.prepare(`SELECT ${projection} FROM threads`).all()) {
      let threadId = sourceThread.id;
      if (typeof threadId !== `string`) continue;
      let currentThread = existingThread.get(threadId);
      if (currentThread == null) {
        insertThread.run(...threadColumns.map((column) => sourceThread[column] ?? null));
        inserted += 1;
        changedThreadIds.add(threadId);
        continue;
      }
      let sourceIsNewer = sqliteTimestamp(sourceThread[updatedColumn]) > sqliteTimestamp(currentThread[updatedColumn]);
      let repairColumns = threadColumns.filter(
        (column) =>
          column !== `id` &&
          !isEmptySqliteValue(sourceThread[column]) &&
          (isEmptySqliteValue(currentThread[column]) ||
            (sourceIsNewer && sourceThread[column] !== currentThread[column])),
      );
      if (repairColumns.length > 0) {
        destination
          .prepare(
            `UPDATE threads SET ${repairColumns.map((column) => `${quoteSqliteIdentifier(column)} = ?`).join(`, `)} WHERE id = ?`,
          )
          .run(...repairColumns.map((column) => sourceThread[column] ?? null), threadId);
        repaired += 1;
        changedThreadIds.add(threadId);
      }
    }

    let spawnEdgeColumns = commonTableColumns(destination, source, `thread_spawn_edges`);
    let spawnEdgesInserted = 0;
    if (spawnEdgeColumns.length > 0) {
      let edgeProjection = spawnEdgeColumns.map(quoteSqliteIdentifier).join(`, `);
      let insertEdge = destination.prepare(
        `INSERT OR IGNORE INTO thread_spawn_edges (${edgeProjection}) VALUES (${spawnEdgeColumns.map(() => `?`).join(`, `)})`,
      );
      for (let edge of source.prepare(`SELECT ${edgeProjection} FROM thread_spawn_edges`).all())
        spawnEdgesInserted += Number(
          insertEdge.run(...spawnEdgeColumns.map((column) => edge[column] ?? null)).changes,
        );
    }

    let dynamicToolColumns = commonTableColumns(destination, source, `thread_dynamic_tools`);
    let dynamicToolsInserted = 0;
    if (dynamicToolColumns.length > 0) {
      let toolProjection = dynamicToolColumns.map(quoteSqliteIdentifier).join(`, `);
      let sourceTools = source.prepare(
        `SELECT ${toolProjection} FROM thread_dynamic_tools WHERE thread_id = ?`,
      );
      let insertTool = destination.prepare(
        `INSERT OR IGNORE INTO thread_dynamic_tools (${toolProjection}) VALUES (${dynamicToolColumns.map(() => `?`).join(`, `)})`,
      );
      for (let threadId of changedThreadIds)
        for (let tool of sourceTools.all(threadId))
          dynamicToolsInserted += Number(
            insertTool.run(...dynamicToolColumns.map((column) => tool[column] ?? null)).changes,
          );
    }

    destination.exec(`COMMIT`);
    return { dynamicToolsInserted, inserted, repaired, spawnEdgesInserted };
  } catch (error) {
    destination.exec(`ROLLBACK`);
    throw error;
  }
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function loadSqliteDatabase(): SqliteDatabaseConstructor {
  try {
    return requireFromMain("better-sqlite3") as SqliteDatabaseConstructor;
  } catch {
    throw Error(`better-sqlite3 is only bundled with the Electron app`);
  }
}

/** Reconcile the one-time temporary sqlite database and write the marker after success (original `xue`). */
export async function reconcileTemporaryAppServerState(
  codexHome: string,
  Database: SqliteDatabaseConstructor = loadSqliteDatabase(),
): Promise<SqliteReconciliationSummary | null> {
  let temporaryPath = join(codexHome, `sqlite`, APP_SERVER_SQLITE_FILENAME);
  let destinationPath = join(codexHome, APP_SERVER_SQLITE_FILENAME);
  let markerPath = join(codexHome, APP_SERVER_SQLITE_RECONCILIATION_MARKER);
  if ((await pathExists(markerPath)) || !(await pathExists(temporaryPath))) return null;

  if (!(await pathExists(destinationPath))) {
    let temporary = new Database(temporaryPath, { fileMustExist: true, readonly: true });
    try {
      await temporary.backup(destinationPath);
      await writeFile(markerPath, ``);
      return { dynamicToolsInserted: 0, inserted: 0, repaired: 0, spawnEdgesInserted: 0 };
    } finally {
      temporary.close();
    }
  }

  let destination = new Database(destinationPath, { fileMustExist: true });
  let temporary = new Database(temporaryPath, { fileMustExist: true, readonly: true });
  try {
    let summary = mergeAppServerSqliteState(destination, temporary);
    await writeFile(markerPath, ``);
    return summary;
  } finally {
    temporary.close();
    destination.close();
  }
}

/** Read the first rollout record only and accept matching session_meta payloads (original `bue`). */
export async function readRolloutSessionCwd(rolloutPath: string, threadId: string): Promise<string | null> {
  let input = createReadStream(rolloutPath, { encoding: `utf8` });
  let lines = createInterface({ crlfDelay: Infinity, input });
  try {
    for await (let line of lines) {
      let value: any;
      try {
        value = JSON.parse(line);
      } catch {
        return null;
      }
      return value?.type === `session_meta` &&
        value?.payload?.id === threadId &&
        typeof value.payload.cwd === `string` &&
        value.payload.cwd.trim().length > 0
        ? value.payload.cwd
        : null;
    }
    return null;
  } catch {
    return null;
  } finally {
    lines.close();
    input.destroy();
  }
}

export async function repairMissingThreadCwdMetadata(
  database: SqliteDatabase,
  readCwd: (rolloutPath: string, threadId: string) => Promise<string | null> = readRolloutSessionCwd,
): Promise<number> {
  let updatedColumn = sqliteTableColumns(database, `threads`).includes(`updated_at_ms`)
    ? `updated_at_ms`
    : `updated_at`;
  let candidates = database
    .prepare(
      `SELECT id, rollout_path FROM threads
       WHERE (cwd = '' OR cwd IS NULL)
         AND rollout_path IS NOT NULL
         AND rollout_path <> ''
       ORDER BY ${quoteSqliteIdentifier(updatedColumn)} DESC
       LIMIT ?`,
    )
    .all(MISSING_CWD_REPAIR_LIMIT);
  let repairs = (
    await Promise.all(
      candidates.map(async (row) => {
        if (typeof row.id !== `string` || typeof row.rollout_path !== `string`) return null;
        let cwd = await readCwd(row.rollout_path, row.id);
        return cwd == null || cwd.trim().length === 0 ? null : { cwd, id: row.id };
      }),
    )
  ).filter((repair): repair is { cwd: string; id: string } => repair != null);
  if (repairs.length === 0) return 0;

  let update = database.prepare(
    `UPDATE threads SET cwd = ? WHERE id = ? AND (cwd = '' OR cwd IS NULL)`,
  );
  let repaired = 0;
  database.exec(`BEGIN IMMEDIATE`);
  try {
    for (let repair of repairs) repaired += Number(update.run(repair.cwd, repair.id).changes);
    database.exec(`COMMIT`);
  } catch (error) {
    database.exec(`ROLLBACK`);
    throw error;
  }
  return repaired;
}

export async function repairAppServerThreadCwds(
  codexHome: string,
  Database: SqliteDatabaseConstructor = loadSqliteDatabase(),
): Promise<number> {
  let databasePath = join(codexHome, APP_SERVER_SQLITE_FILENAME);
  if (!(await pathExists(databasePath))) return 0;
  let database = new Database(databasePath, { fileMustExist: true });
  try {
    return await repairMissingThreadCwdMetadata(database);
  } finally {
    database.close();
  }
}

/** Startup owner for temporary-state merge followed by missing-cwd repair (original `_ue`). */
export async function reconcileAppServerSqliteState({
  codexHome,
  isTestMode,
  logger,
  Database,
}: {
  codexHome: string;
  isTestMode(): boolean;
  logger: () => Logger;
  Database?: SqliteDatabaseConstructor;
}): Promise<void> {
  if (process.env.CODEX_SQLITE_HOME != null || isTestMode()) return;
  try {
    let summary = await reconcileTemporaryAppServerState(codexHome, Database);
    if (summary != null) logger().info(`Reconciled temporary app-server state`, { safe: summary });
  } catch (error) {
    logger().warning(`Failed to reconcile temporary app-server state`, {
      safe: { errorName: error instanceof Error ? error.name : `UnknownError` },
    });
  }
  try {
    let repaired = await repairAppServerThreadCwds(codexHome, Database);
    if (repaired > 0)
      logger().info(`Repaired missing thread cwd metadata`, { safe: { repaired } });
  } catch (error) {
    logger().warning(`Failed to repair missing thread cwd metadata`, {
      safe: { errorName: error instanceof Error ? error.name : `UnknownError` },
    });
  }
}
