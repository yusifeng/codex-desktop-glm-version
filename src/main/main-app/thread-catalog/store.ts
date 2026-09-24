// LocalThreadCatalogStore —— 本地线程 catalog 的 SQLite DAO。
//
// 原版 main-C-Mhak1n.ts 26,796-27,590（hhe 类 + fm/pm/ghe/mm helper）。
// 6 张表：local_thread_catalog（目录行）、_sync_state（观察水位/初始构建
// 标记）、_hosts（host 注册）、_scan_checkpoints（扫描断点）、_scan_entries
//（full 扫描已见线程集合，含 removed 标记）、_metadata（全局 catalog_revision
// 计数器）。建表 DDL 在 shared chunk / bootstrap 迁移侧，不在本模块。
//
// 关键语义：
//   - db 句柄由构造函数注入（R10 装配区 161,212-161,213：`oe = n.si()` 为
//     null 时整个 catalog 工厂为 null、功能禁用而非崩溃——本类自身不承担
//     null 检查，构造时 db 必须可用）；
//   - observation_sequence 水位：所有写入先 `nextObservationSequence()`
//     自增，upsert 拒绝比行内水位更老的写入，保证乱序到达的观察不回退；
//   - pending_observed_title：本地改名观察置 1，优先于来源标题（见
//     schema.ts 的 upsert SQL 注释）；
//   - full 扫描：beginScan → applyScanPage（记 scan_entries + checkpoint）
//     → completeScan（missing_candidate 复活/标记/删除 + sync_state 推进）；
//     中断可从 checkpoint 续扫（attempt.mode 相同则复用 attempt 与水位）；
//   - 事务：runInTransaction 用 BEGIN IMMEDIATE（写写互斥）。
//
// 本模块为纯定义区：实例化在 R4/R10 装配区（54,078-54,436 / 161,190+）。

import {
  CATALOG_UPSERT_SQL,
  catalogRowSchema,
  DEFAULT_SYNC_PROGRESS,
  displayTitleForThread,
  LOCAL_HOST_ID,
  scanCheckpointSchema,
  syncStateRowSchema,
  type ThreadCatalogEntry,
} from "./schema";

/** 注入的 state db 句柄（better-sqlite3 形态的结构类型；实际由 n.si() 提供）。 */
export interface SqliteStatement {
  run(...params: unknown[]): { changes?: number | null };
  get(...params: unknown[]): any;
  all(...params: unknown[]): any[];
}

export interface SqliteDatabase {
  prepare(sql: string): SqliteStatement;
}

/** 分页过滤条件（readPage/readManualPage 的 filter 参数）。 */
export interface ThreadCatalogPageFilter {
  projectId?: string | null;
  conversationOrigin?: 'tpp' | 'non-tpp' | null;
  includeAll?: boolean;
  cwdValues?: string[];
  cwdPrefixes?: string[];
  includeThreadIds?: string[];
  excludeThreadIds?: string[];
}

/** 游标分页的排序键。 */
export type ThreadCatalogSortKey = 'created_at' | 'updated_at';

/** 游标分页游标（上一页最后一行的排序键值 + threadId 决胜）。 */
export interface ThreadCatalogPageCursor {
  sortKey: ThreadCatalogSortKey;
  sourceUpdatedAt: number;
  sourceRecencyAt: number;
  sourceCreatedAt: number;
  threadId: string;
}

/** 手动排序分页（sidebar 自定义分区的线程顺序）。 */
export interface ThreadCatalogManualOrder {
  threadIds: string[];
  startIndex: number;
}

/** readPage 结果。 */
export interface ThreadCatalogPage {
  entries: ThreadCatalogEntry[];
  nextCursor: ThreadCatalogPageCursor | null;
  nextManualIndex?: number | null;
}

/** 扫描 attempt（checkpoint 的可续扫部分）。 */
export interface ThreadCatalogScanAttempt {
  mode: 'full' | 'incremental';
  observationSequence: number;
}

/** 持久化的扫描 checkpoint（readScanCheckpoint 的返回，含失败时间）。 */
export interface ThreadCatalogScanCheckpoint {
  attempt: ThreadCatalogScanAttempt;
  progress: any;
  failedAt?: number | null;
}

/** 扫描进度（applyScanPage 的 progress 参数，透传持久化）。 */
export interface ThreadCatalogScanProgress {
  cursor: string | null;
  phase: 'scan' | 'reconcile-head';
  headWatermark: number | null;
  headAnchors: (string | number)[];
  lastAnchors: (string | number)[];
  overlapAnchors: (string | number)[];
}

/** host 同步状态。 */
export interface ThreadCatalogSyncState {
  sourceUpdatedAtWatermark: number | null;
  lastFullReconciliationAt: number | null;
  isComplete: boolean;
  catalogRevision: number;
}

/** 写操作的统一结果（revision + 变更/删除的线程 id）。 */
export interface ThreadCatalogWriteResult {
  catalogRevision: number;
  changedThreadIds: string[];
  removedThreadIds: string[];
}

/** catalog 行反解（原版 mm）：zod 校验失败返回 null；chatgpt 与本地两种形态。 */
export function rowToCatalogEntry(row: unknown): ThreadCatalogEntry | null {
  let parsed = catalogRowSchema.safeParse(row);
  if (!parsed.success) return null;
  let data = parsed.data;
  let displayTitle = typeof data.display_title == `string` ? data.display_title.trim() : ``;
  let base = {
    hostId: data.host_id,
    threadId: data.thread_id,
    displayTitle: displayTitle || data.thread_id,
    sourceCreatedAt: data.source_created_at,
    sourceUpdatedAt: data.source_updated_at,
    sourceRecencyAt: data.source_recency_at,
  };
  return data.source_kind === `chatgpt`
    ? {
        ...base,
        sourceKind: `chatgpt`,
        projectId: data.project_id,
        conversationOrigin: data.conversation_origin,
      }
    : {
        ...base,
        cwd: data.cwd ?? ``,
        sourceKind: data.source_kind,
        sourceDetail: data.source_detail,
        threadSource: data.thread_source,
        modelProvider: data.model_provider ?? ``,
        gitBranch: data.git_branch,
      };
}

/** project/origin 过滤子句（原版 fm）：两者都缺省返回 null（不过滤）。 */
function projectOriginFilterClause(
  filter: ThreadCatalogPageFilter | null | undefined,
  columnPrefix = ``,
): { clause: string; params: unknown[] } | null {
  if (filter?.projectId === void 0 && filter?.conversationOrigin === void 0) return null;
  let clauses: string[] = [];
  let params: unknown[] = [];
  if (filter.projectId !== void 0) {
    clauses.push(`AND ${columnPrefix}project_id IS ?`);
    params.push(filter.projectId);
  }
  if (filter.conversationOrigin === `tpp`)
    clauses.push(`AND ${columnPrefix}conversation_origin = 'tpp'`);
  else if (filter.conversationOrigin === `non-tpp`)
    clauses.push(`AND ${columnPrefix}conversation_origin IS NOT 'tpp'`);
  return {
    clause: clauses.join(`
               `),
    params,
  };
}

/** cwd 前缀去重（原版 pm）：补尾分隔符 → 去重排序 → 剔除被更短前缀覆盖者。 */
export function dedupeCwdPrefixes(prefixes: string[]): string[] {
  if (prefixes.some((prefix) => prefix.length === 0))
    throw Error(`Thread catalog CWD prefixes must not be empty`);
  let normalized = Array.from(new Set(prefixes.map(withTrailingSeparator))).sort((a, b) =>
    a.localeCompare(b),
  );
  return normalized.filter(
    (prefix, index) => !normalized.slice(0, index).some((other) => prefix.startsWith(other)),
  );
}

/** 路径缺失尾分隔符时补上（`\` 路径补 `\`，其余补 `/`，原版 ghe）。 */
function withTrailingSeparator(path: string): string {
  return path.endsWith(`/`) || path.endsWith(`\\`)
    ? path
    : `${path}${path.includes(`\\`) ? `\\` : `/`}`;
}

/**
 * 本地线程 catalog 存储。见文件头注释；除 readThreadCount/readEntries/
 * readPage 的显式上限外不做额外防护，参数校验错误原样抛出。
 */
export class LocalThreadCatalogStore {
  private db: SqliteDatabase;
  private hostId: string;
  private hostKind: string;
  /** 当前活跃的扫描 attempt（单扫描互斥）。 */
  private activeScan: ThreadCatalogScanAttempt | null = null;

  constructor(
    db: SqliteDatabase,
    hostId: string = LOCAL_HOST_ID,
    hostKind: string = hostId === LOCAL_HOST_ID ? `local` : `ssh`,
  ) {
    this.db = db;
    this.hostId = hostId;
    this.hostKind = hostKind;
    if (hostId.length === 0) throw Error(`Thread catalog host ID must not be empty`);
    // 首次使用时注册 host 行（sync_state 幂等；hosts 以 host_kind 覆盖更新）。
    this.db
      .prepare(
        `INSERT OR IGNORE INTO local_thread_catalog_sync_state (host_id)
         VALUES (?)`,
      )
      .run(hostId);
    this.db
      .prepare(
        `INSERT INTO local_thread_catalog_hosts (host_id, host_kind)
         VALUES (?, ?)
         ON CONFLICT (host_id) DO UPDATE SET host_kind = excluded.host_kind`,
      )
      .run(hostId, hostKind);
  }

  /** 列出某类别的全部 hostId（升序）。 */
  listHostIds(hostKind: string): string[] {
    return this.db
      .prepare(
        `SELECT host_id FROM local_thread_catalog_hosts
         WHERE host_kind = ?
         ORDER BY host_id`,
      )
      .all(hostKind)
      .map((row: any) => row.host_id);
  }

  /**
   * 查询线程归属的 host（原版 readThreadHostId）：排除 missing 候选与
   * chatgpt 来源，SQL 取前 100 后客户端按 recency/created/hostId 字典序
   * 再排序取最优（跨 host 冲突时确定性裁决）。
   */
  readThreadHostId(threadId: string): string | null {
    return this.db
      .prepare(
        `SELECT host_id, source_recency_at, source_created_at
         FROM local_thread_catalog
         WHERE thread_id = ?
           AND missing_candidate = 0
           AND source_kind != 'chatgpt'
         ORDER BY source_recency_at DESC, source_created_at DESC
         LIMIT 100`,
      )
      .all(threadId)
      .sort(
        (a: any, b: any) =>
          b.source_recency_at - a.source_recency_at ||
          b.source_created_at - a.source_created_at ||
          a.host_id.localeCompare(b.host_id),
      )[0]?.host_id;
  }

  /** 读 host 同步状态（行缺失/非法时回退默认进度；revision 恒实时读取）。 */
  readSyncState(): ThreadCatalogSyncState {
    let row = this.db
      .prepare(
        `SELECT
          watermark_updated_at,
          last_full_reconciled_at,
          initial_build_complete
        FROM local_thread_catalog_sync_state
        WHERE host_id = ?`,
      )
      .get(this.hostId);
    let parsed = syncStateRowSchema.safeParse(row);
    return parsed.success
      ? {
          sourceUpdatedAtWatermark: parsed.data.watermark_updated_at,
          lastFullReconciliationAt: parsed.data.last_full_reconciled_at,
          isComplete: parsed.data.initial_build_complete !== 0,
          catalogRevision: this.readCatalogRevision(),
        }
      : { ...DEFAULT_SYNC_PROGRESS, catalogRevision: this.readCatalogRevision() };
  }

  /** 读单条目录项（仅本 host，排除 missing 候选）。 */
  readEntry(threadId: string): ThreadCatalogEntry | null {
    let row = this.db
      .prepare(
        `SELECT * FROM local_thread_catalog
         WHERE host_id = ? AND thread_id = ? AND missing_candidate = 0`,
      )
      .get(this.hostId, threadId);
    return row == null ? null : rowToCatalogEntry(row);
  }

  /** 批量读目录项（≤100，保持请求顺序；缺失项跳过）。 */
  readEntries(threadIds: string[]): ThreadCatalogEntry[] {
    if (threadIds.length > 100) throw Error(`Thread catalog entry request exceeds 100`);
    if (threadIds.length === 0) return [];
    let placeholders = threadIds.map(() => `?`).join(`, `);
    let rows = this.db
      .prepare(
        `SELECT * FROM local_thread_catalog
         WHERE host_id = ?
           AND thread_id IN (${placeholders})
           AND missing_candidate = 0`,
      )
      .all(this.hostId, ...threadIds);
    let entriesByThreadId = new Map(
      rows.flatMap((row: any) => {
        let entry = rowToCatalogEntry(row);
        return entry == null ? [] : ([[entry.threadId, entry]] as [string, ThreadCatalogEntry][]);
      }),
    );
    return threadIds.flatMap((threadId) => {
      let entry = entriesByThreadId.get(threadId);
      return entry == null ? [] : [entry];
    });
  }

  /**
   * 读某 host 的线程计数（原版 readThreadCount）：initial_build_complete
   * 未置位（初始扫描未完成）时返回 null；计数封顶 501（>500 即「500+」）。
   */
  readThreadCount(hostId: string): number | null {
    return (
      this.db
        .prepare(
          `SELECT (
             SELECT COUNT(*) FROM (
               SELECT 1 FROM local_thread_catalog
               WHERE host_id = ? AND missing_candidate = 0
               LIMIT ?
             )
           ) AS count
           FROM local_thread_catalog_sync_state
           WHERE host_id = ? AND initial_build_complete != 0`,
        )
        .get(hostId, 501, hostId)?.count ?? null
    );
  }

  /**
   * 游标/手动排序分页（原版 readPage）。limit ∈ [1,100]。三分支：
   *   1. filter 带 projectId/conversationOrigin → 单表 + 索引提示；
   *   2. 无 filter 或 includeAll → 单表全量（排除 excludeThreadIds）；
   *   3. cwd 范围 filter → exact_cwd + prefixed_cwd + included_thread 三段
   *      CTE 合并（exact/prefixed 走 cwd 索引，included 显式包含）。
   * manualOrder 优先（无游标，按 JSON 数组位置分页）。
   */
  readPage({
    limit,
    cursor,
    filter,
    manualOrder,
    sortKey,
  }: {
    limit: number;
    cursor?: ThreadCatalogPageCursor | null;
    filter?: ThreadCatalogPageFilter | null;
    manualOrder?: ThreadCatalogManualOrder | null;
    sortKey: ThreadCatalogSortKey;
  }): ThreadCatalogPage {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw Error(`Thread catalog page limit must be between 1 and 100`);
    if (manualOrder != null) {
      if (manualOrder.threadIds.length > 100)
        throw Error(`Thread catalog manual order exceeds 100`);
      if (cursor != null) throw Error(`Manual thread catalog pages do not use a cursor`);
      return this.readManualPage(manualOrder, filter, limit);
    }
    if (cursor != null && cursor.sortKey !== sortKey)
      throw Error(`Thread catalog cursor uses a different sort order`);
    // 多取一行判断是否还有下一页。
    let fetchLimit = limit + 1;
    let primarySortColumn = sortKey === `created_at` ? `source_created_at` : `source_recency_at`;
    let secondarySortColumn = sortKey === `created_at` ? `source_updated_at` : `source_created_at`;
    let primaryCursorValue =
      sortKey === `created_at` ? cursor?.sourceCreatedAt : cursor?.sourceRecencyAt;
    let secondaryCursorValue =
      sortKey === `created_at` ? cursor?.sourceUpdatedAt : cursor?.sourceCreatedAt;
    let cwdIndex =
      sortKey === `created_at`
        ? `local_thread_catalog_cwd_created_idx`
        : `local_thread_catalog_cwd_updated_idx`;
    let cursorClause =
      cursor == null
        ? ``
        : `AND (
             ${primarySortColumn} < ?
             OR (
               ${primarySortColumn} = ?
               AND ${secondarySortColumn} < ?
             )
             OR (
               ${primarySortColumn} = ?
               AND ${secondarySortColumn} = ?
               AND thread_id > ?
             )
           )`;
    let cursorParams: unknown[] =
      cursor == null
        ? []
        : [
            primaryCursorValue,
            primaryCursorValue,
            secondaryCursorValue,
            primaryCursorValue,
            secondaryCursorValue,
            cursor.threadId,
          ];
    let rows = (() => {
      let originFilter = projectOriginFilterClause(filter);
      if (originFilter != null) {
        // 分支 1：project/origin 过滤。updated_at 排序时按过滤维度选索引，
        // 避免 sqlite 优化器选错 plan。
        let indexHint = ``;
        if (sortKey === `updated_at`) {
          if (filter?.projectId === void 0) {
            if (filter?.conversationOrigin === `tpp`)
              indexHint = `INDEXED BY local_thread_catalog_origin_updated_idx`;
          } else indexHint = `INDEXED BY local_thread_catalog_project_updated_idx`;
        }
        return this.db
          .prepare(
            `SELECT * FROM local_thread_catalog ${indexHint}
             WHERE host_id = ?
               AND missing_candidate = 0
               ${originFilter.clause}
               AND thread_id NOT IN (SELECT value FROM json_each(?))
               ${cursorClause}
             ORDER BY ${primarySortColumn} DESC, ${secondarySortColumn} DESC, thread_id
             LIMIT ?`,
          )
          .all(
            this.hostId,
            ...originFilter.params,
            JSON.stringify(filter?.excludeThreadIds ?? []),
            ...cursorParams,
            fetchLimit,
          );
      }
      if (filter == null || filter.includeAll === true) {
        // 分支 2：全量。
        let excludeThreadIds = JSON.stringify(filter?.excludeThreadIds ?? []);
        return this.db
          .prepare(
            `SELECT * FROM local_thread_catalog
             WHERE host_id = ?
               AND missing_candidate = 0
               AND thread_id NOT IN (SELECT value FROM json_each(?))
               ${cursorClause}
             ORDER BY ${primarySortColumn} DESC, ${secondarySortColumn} DESC, thread_id
             LIMIT ?`,
          )
          .all(this.hostId, excludeThreadIds, ...cursorParams, fetchLimit);
      }
      // 分支 3：cwd 范围（精确值 + 前缀 + 显式包含）三段 CTE。
      let cwdValues = JSON.stringify(filter.cwdValues);
      let cwdPrefixes = JSON.stringify(dedupeCwdPrefixes(filter.cwdPrefixes ?? []));
      let excludeThreadIds = JSON.stringify(filter.excludeThreadIds);
      return this.db
        .prepare(
          `WITH exact_cwd AS (
             SELECT * FROM local_thread_catalog
               INDEXED BY ${cwdIndex}
             WHERE host_id = ?
               AND missing_candidate = 0
               AND cwd IN (SELECT value FROM json_each(?))
               AND thread_id NOT IN (SELECT value FROM json_each(?))
               ${cursorClause}
             ORDER BY ${primarySortColumn} DESC, ${secondarySortColumn} DESC, thread_id
             LIMIT ?
           ), prefixed_cwd AS (
             SELECT catalog.* FROM json_each(?) AS prefix
               CROSS JOIN local_thread_catalog AS catalog
               INDEXED BY ${cwdIndex}
             WHERE catalog.host_id = ?
               AND catalog.missing_candidate = 0
               AND catalog.cwd >= prefix.value
               AND catalog.cwd < prefix.value || char(1114111)
               AND catalog.cwd NOT IN (SELECT value FROM json_each(?))
               AND catalog.thread_id NOT IN (SELECT value FROM json_each(?))
               ${cursorClause}
             ORDER BY ${primarySortColumn} DESC, ${secondarySortColumn} DESC, thread_id
             LIMIT ?
           ), included_thread AS (
             SELECT * FROM local_thread_catalog
             WHERE host_id = ?
               AND missing_candidate = 0
               AND thread_id IN (SELECT value FROM json_each(?))
               AND cwd NOT IN (SELECT value FROM json_each(?))
               AND NOT EXISTS (
                 SELECT 1 FROM json_each(?) AS prefix
                 WHERE cwd >= prefix.value
                   AND cwd < prefix.value || char(1114111)
               )
               AND thread_id NOT IN (SELECT value FROM json_each(?))
               ${cursorClause}
             ORDER BY ${primarySortColumn} DESC, ${secondarySortColumn} DESC, thread_id
             LIMIT ?
           ), scoped AS (
             SELECT * FROM exact_cwd
             UNION ALL
             SELECT * FROM prefixed_cwd
             UNION ALL
             SELECT * FROM included_thread
           )
           SELECT * FROM scoped
           ORDER BY ${primarySortColumn} DESC, ${secondarySortColumn} DESC, thread_id
           LIMIT ?`,
        )
        .all(
          this.hostId,
          cwdValues,
          excludeThreadIds,
          ...cursorParams,
          fetchLimit,
          cwdPrefixes,
          this.hostId,
          cwdValues,
          excludeThreadIds,
          ...cursorParams,
          fetchLimit,
          this.hostId,
          JSON.stringify(filter.includeThreadIds),
          cwdValues,
          cwdPrefixes,
          excludeThreadIds,
          ...cursorParams,
          fetchLimit,
          fetchLimit,
        );
    })().flatMap((row: any) => {
      let entry = rowToCatalogEntry(row);
      return entry == null ? [] : [entry];
    });
    let pageEntries = rows.slice(0, limit);
    let lastEntry = pageEntries.at(-1);
    return {
      entries: pageEntries,
      nextCursor:
        rows.length > limit && lastEntry != null
          ? {
              sortKey,
              sourceUpdatedAt: lastEntry.sourceUpdatedAt,
              sourceRecencyAt: lastEntry.sourceRecencyAt,
              sourceCreatedAt: lastEntry.sourceCreatedAt,
              threadId: lastEntry.threadId,
            }
          : null,
    };
  }

  /** 手动排序分页（原版 readManualPage）：按 threadIds JSON 数组的位置分页。 */
  private readManualPage(
    manualOrder: ThreadCatalogManualOrder,
    filter: ThreadCatalogPageFilter | null | undefined,
    limit: number,
  ): ThreadCatalogPage {
    let originFilter = projectOriginFilterClause(filter, `catalog.`);
    let includeClause =
      filter == null || filter.includeAll === true
        ? ``
        : `AND (
             catalog.cwd IN (SELECT value FROM json_each(?))
             OR EXISTS (
               SELECT 1 FROM json_each(?) AS prefix
               WHERE catalog.cwd >= prefix.value
                 AND catalog.cwd < prefix.value || char(1114111)
             )
             OR catalog.thread_id IN (SELECT value FROM json_each(?))
           )`;
    let excludeClause =
      filter == null
        ? ``
        : `AND catalog.thread_id NOT IN (SELECT value FROM json_each(?))
           ${includeClause}`;
    let filterParams =
      filter == null
        ? []
        : [
            JSON.stringify(filter.excludeThreadIds),
            ...(filter.includeAll === true
              ? []
              : [
                  JSON.stringify(filter.cwdValues),
                  JSON.stringify(dedupeCwdPrefixes(filter.cwdPrefixes ?? [])),
                  JSON.stringify(filter.includeThreadIds),
                ]),
          ];
    let rows = this.db
      .prepare(
        `WITH manual AS (
           SELECT CAST(key AS INTEGER) AS position, value AS thread_id
           FROM json_each(?)
           WHERE CAST(key AS INTEGER) >= ?
         )
         SELECT catalog.*, manual.position AS manual_position
         FROM manual
         JOIN local_thread_catalog AS catalog
           ON catalog.host_id = ?
          AND catalog.thread_id = manual.thread_id
         WHERE catalog.missing_candidate = 0
           ${excludeClause}
           ${originFilter?.clause ?? ``}
         ORDER BY manual.position
         LIMIT ?`,
      )
      .all(
        JSON.stringify(manualOrder.threadIds),
        manualOrder.startIndex,
        this.hostId,
        ...filterParams,
        ...(originFilter?.params ?? []),
        limit + 1,
      );
    let pageEntries = rows.slice(0, limit).flatMap((row: any) => {
      let entry = rowToCatalogEntry(row);
      return entry == null ? [] : [entry];
    });
    let rowAfterPage = rows.at(limit);
    return {
      entries: pageEntries,
      nextManualIndex: rowAfterPage == null ? null : Number(rowAfterPage.manual_position),
      nextCursor: null,
    };
  }

  /**
   * 读扫描 checkpoint（原版 readScanCheckpoint）：无 checkpoint 返回 null；
   * 损坏（JSON 解析失败或 schema 不符）时清掉 checkpoint 与已见集合后
   * 返回 null（下次扫描从头开始）。
   */
  readScanCheckpoint(): ThreadCatalogScanCheckpoint | null {
    let row = this.db
      .prepare(
        `SELECT checkpoint, failed_at FROM local_thread_catalog_scan_checkpoints WHERE host_id = ?`,
      )
      .get(this.hostId);
    if (row == null) return null;
    try {
      let parsed = scanCheckpointSchema.safeParse(JSON.parse(row.checkpoint));
      if (parsed.success) return { ...parsed.data, failedAt: row.failed_at };
    } catch {}
    this.clearScanCheckpoint();
    this.clearSeenEntries();
    return null;
  }

  /**
   * 开始扫描（原版 beginScan）：单活跃扫描互斥。传入上次 checkpoint 且其
   * attempt.mode 与本次一致时直接复用（含 observation_sequence 水位，
   * 保证续扫的写入不回退）；否则清 checkpoint/已见集合并取新水位。
   */
  beginScan(mode: 'full' | 'incremental', checkpoint: ThreadCatalogScanCheckpoint | null = null): ThreadCatalogScanAttempt {
    if (this.activeScan != null) throw Error(`A local thread catalog scan is already active`);
    let attempt =
      checkpoint?.attempt.mode === mode
        ? checkpoint.attempt
        : this.runInTransaction(
            () => (
              this.clearScanCheckpoint(),
              this.clearSeenEntries(),
              { mode, observationSequence: this.nextObservationSequence() }
            ),
          );
    this.activeScan = attempt;
    return attempt;
  }

  /**
   * 应用一页扫描结果（原版 applyScanPage）：full 模式先把本页线程记入
   * scan_entries（已见集合），再 upsert 本页条目（扫描式，不覆盖本地改名），
   * 最后持久化 checkpoint（progress 可为 null 表示不更新）。
   */
  applyScanPage(
    attempt: ThreadCatalogScanAttempt,
    entries: ThreadCatalogEntry[],
    progress: ThreadCatalogScanProgress | null,
  ): ThreadCatalogWriteResult {
    this.assertActiveScan(attempt);
    return this.runInTransaction(() => {
      if (attempt.mode === `full`) {
        let insertSeen = this.db.prepare(
          `INSERT OR IGNORE INTO local_thread_catalog_scan_entries (host_id, thread_id)
           VALUES (?, ?)`,
        );
        for (let entry of entries) {
          this.assertEntryHost(entry);
          insertSeen.run(this.hostId, entry.threadId);
        }
      }
      let result = this.upsertEntries(entries, attempt.observationSequence, false);
      if (progress != null)
        this.db
          .prepare(
            `
          INSERT INTO local_thread_catalog_scan_checkpoints (host_id, checkpoint, failed_at)
          VALUES (?, ?, NULL)
          ON CONFLICT(host_id) DO UPDATE SET checkpoint = excluded.checkpoint, failed_at = NULL
        `,
          )
          .run(this.hostId, JSON.stringify({ attempt, progress }));
      return result;
    });
  }

  /**
   * 完成扫描（原版 completeScan）。full 模式：
   *   1. 已见集合中此前被标记 missing 的线程复活（missing_candidate=0）；
   *   2. 本地/chatgpt host：full 扫描未见的线程标记 missing_candidate=1
   *      （updatedSince 非 null 时仅标记不早于该时间的行——避免误杀扫描
   *      期间刚更新的线程）；
   *   3. 删除比本次水位更老且未见的 missing 行（物理回收）；
   *   4. sync_state 推进水位 + initial_build_complete=1 + full 对账时间。
   * incremental 模式只推水位。最后清 checkpoint 与已见集合。
   */
  completeScan(
    attempt: ThreadCatalogScanAttempt,
    watermark: number | null,
    now: number = Date.now(),
    updatedSince: number | null = null,
  ): void {
    this.assertActiveScan(attempt);
    this.runInTransaction(() => {
      if (attempt.mode === `full`) {
        let revivedCount = this.mutateThreadCount(
          `UPDATE local_thread_catalog AS catalog
           SET missing_candidate = 0,
               observation_sequence = ?
           WHERE catalog.host_id = ?
             AND missing_candidate != 0
             AND observation_sequence <= ?
             AND EXISTS (
               SELECT 1 FROM local_thread_catalog_scan_entries AS seen
               WHERE seen.host_id = catalog.host_id
                 AND seen.thread_id = catalog.thread_id
                 AND seen.removed = 0
             )`,
          attempt.observationSequence,
          this.hostId,
          attempt.observationSequence,
        );
        let missingCount =
          this.hostKind === `local` || this.hostKind === `chatgpt`
            ? this.mutateThreadCount(
                `UPDATE local_thread_catalog AS catalog
                 SET missing_candidate = 1,
                     observation_sequence = ?
                 WHERE catalog.host_id = ?
                   AND missing_candidate = 0
                   AND observation_sequence <= ?
                   AND (? IS NULL OR source_updated_at >= ?)
                   AND NOT EXISTS (
                     SELECT 1 FROM local_thread_catalog_scan_entries AS seen
                     WHERE seen.host_id = catalog.host_id
                       AND seen.thread_id = catalog.thread_id
                   )`,
                attempt.observationSequence,
                this.hostId,
                attempt.observationSequence,
                updatedSince,
                updatedSince,
              )
            : 0;
        this.db
          .prepare(
            `DELETE FROM local_thread_catalog AS catalog
             WHERE catalog.host_id = ?
               AND missing_candidate != 0
               AND observation_sequence < ?
               AND (? IS NULL OR source_updated_at >= ?)
               AND NOT EXISTS (
                 SELECT 1 FROM local_thread_catalog_scan_entries AS seen
                 WHERE seen.host_id = catalog.host_id
                   AND seen.thread_id = catalog.thread_id
               )`,
          )
          .run(this.hostId, attempt.observationSequence, updatedSince, updatedSince);
        if (revivedCount > 0 || missingCount > 0) this.bumpCatalogRevision();
        this.db
          .prepare(
            `UPDATE local_thread_catalog_sync_state
             SET watermark_updated_at = ?,
                 initial_build_complete = 1,
                 last_full_reconciled_at = ?
             WHERE host_id = ?`,
          )
          .run(watermark, now, this.hostId);
      } else
        this.db
          .prepare(
            `UPDATE local_thread_catalog_sync_state
             SET watermark_updated_at = ?
             WHERE host_id = ?`,
          )
          .run(watermark, this.hostId);
      this.clearScanCheckpoint();
      this.clearSeenEntries();
    });
    this.activeScan = null;
  }

  /** 中止扫描（原版 abortScan）：丢弃 checkpoint 与已见集合。 */
  abortScan(attempt: ThreadCatalogScanAttempt): void {
    this.assertActiveScan(attempt);
    this.clearScanCheckpoint();
    this.clearSeenEntries();
    this.activeScan = null;
  }

  /**
   * 暂停扫描（原版 pauseScan）：保留 checkpoint（含 failed_at，COALESCE
   * 只在传值时覆盖）供续扫，清掉活跃 attempt。
   */
  pauseScan(attempt: ThreadCatalogScanAttempt, failedAt: number | null): void {
    this.assertActiveScan(attempt);
    this.db
      .prepare(
        `
      UPDATE local_thread_catalog_scan_checkpoints
      SET failed_at = COALESCE(?, failed_at) WHERE host_id = ?
    `,
      )
      .run(failedAt, this.hostId);
    this.activeScan = null;
  }

  /**
   * 应用单条观察（原版 applyObservedEntry）：清掉该线程的 scan_entries
   * removed 标记（复活优先于待删除），再以观察式 upsert（覆盖标题）。
   */
  applyObservedEntry(entry: ThreadCatalogEntry): ThreadCatalogWriteResult {
    this.assertEntryHost(entry);
    return this.runInTransaction(() => {
      let observationSequence = this.nextObservationSequence();
      this.db
        .prepare(
          `DELETE FROM local_thread_catalog_scan_entries WHERE host_id = ? AND thread_id = ? AND removed = 1`,
        )
        .run(this.hostId, entry.threadId);
      return this.upsertEntries([entry], observationSequence, true);
    });
  }

  /**
   * 应用本地改名观察（原版 applyObservedTitle）：线程不在 catalog 时为
   * no-op；空标题保持原标题（仅推水位），非空标题按 dm 规则生成新标题
   * 并置 pending_observed_title。
   */
  applyObservedTitle(threadId: string, title: string): ThreadCatalogWriteResult {
    let trimmedTitle = title.trim();
    return this.runInTransaction(() => {
      let observationSequence = this.nextObservationSequence();
      let storedEntry = this.readStoredEntry(threadId);
      return storedEntry == null
        ? {
            catalogRevision: this.readCatalogRevision(),
            changedThreadIds: [],
            removedThreadIds: [],
          }
        : this.upsertEntries(
            [
              {
                ...storedEntry,
                displayTitle:
                  trimmedTitle.length === 0
                    ? storedEntry.displayTitle
                    : displayTitleForThread({ cwd: ``, name: trimmedTitle, threadId }),
              },
            ],
            observationSequence,
            true,
            trimmedTitle.length > 0,
          );
    });
  }

  /**
   * 权威删除（原版 applyAuthoritativeRemoval）：推水位；扫描进行中（或
   * 有 checkpoint）时把该线程记入 scan_entries.removed（防止后续扫描页
   * 复活），随后物理删除该行；行此前非 missing 时计数 revision 并报告
   * removedThreadIds。
   */
  applyAuthoritativeRemoval(threadId: string): ThreadCatalogWriteResult {
    return this.runInTransaction(() => {
      this.nextObservationSequence();
      if (
        this.activeScan != null ||
        this.db
          .prepare(`SELECT 1 FROM local_thread_catalog_scan_checkpoints WHERE host_id = ?`)
          .get(this.hostId) != null
      )
        this.db
          .prepare(
            `
          INSERT INTO local_thread_catalog_scan_entries (host_id, thread_id, removed)
          VALUES (?, ?, 1)
          ON CONFLICT(host_id, thread_id) DO UPDATE SET removed = 1
        `,
          )
          .run(this.hostId, threadId);
      let removedThreadIds =
        this.db
          .prepare(
            `DELETE FROM local_thread_catalog
           WHERE host_id = ? AND thread_id = ?
           RETURNING missing_candidate`,
          )
          .get(this.hostId, threadId)?.missing_candidate === 0
          ? [threadId]
          : [];
      if (removedThreadIds.length > 0) this.bumpCatalogRevision();
      return {
        catalogRevision: this.readCatalogRevision(),
        changedThreadIds: [],
        removedThreadIds,
      };
    });
  }

  /** 删除早于 cutoff 的行（原版 pruneEntriesOlderThan）；有删除时推 revision。 */
  pruneEntriesOlderThan(cutoff: number): boolean {
    return this.runInTransaction(
      () =>
        this.db
          .prepare(
            `DELETE FROM local_thread_catalog
           WHERE host_id = ? AND source_updated_at < ?`,
          )
          .run(this.hostId, cutoff).changes !== 0 && (this.bumpCatalogRevision(), true),
    );
  }

  /**
   * 整体删除本 host 的 catalog 数据（原版 pruneHost）：活跃扫描中禁止；
   * 清 checkpoint/已见集合后删行/删 sync_state/删 host 注册；删前若有
   * 可见行则推 revision（让观察侧感知列表变化）。
   */
  pruneHost(): void {
    if (this.activeScan != null)
      throw Error(`Cannot prune a thread catalog host during an active scan`);
    this.runInTransaction(() => {
      this.clearScanCheckpoint();
      this.clearSeenEntries();
      let hasVisibleEntries = this.db
        .prepare(
          `SELECT EXISTS (
             SELECT 1 FROM local_thread_catalog
             WHERE host_id = ? AND missing_candidate = 0
           ) AS has_visible_entries`,
        )
        .get(this.hostId)?.has_visible_entries;
      this.db.prepare(`DELETE FROM local_thread_catalog WHERE host_id = ?`).run(this.hostId);
      this.db
        .prepare(`DELETE FROM local_thread_catalog_sync_state WHERE host_id = ?`)
        .run(this.hostId);
      this.db.prepare(`DELETE FROM local_thread_catalog_hosts WHERE host_id = ?`).run(this.hostId);
      if (hasVisibleEntries === 1) this.bumpCatalogRevision();
    });
  }

  /**
   * 批量 upsert（原版 upsertEntries）。
   *
   * @param observationSequence 本次写入水位（调用方先 nextObservationSequence）
   * @param observed 观察式写入（本地 UI 侧）：跳过 scan_entries.removed 的
   *   线程检查（观察永远生效）；扫描式（false）则跳过被标记 removed 的线程
   * @param pendingObservedTitle 本地改名标志：置 1 时 upsert 无条件采用新
   *   标题并保持 pending 状态（见 schema.ts SQL 注释）
   *
   * upsert 的 RETURNING 为空（行未变化或被水位拒绝）时走兜底 UPDATE：
   * 只把行内 observation_sequence 推到本次水位（并按标志置 pending），
   * 不改其余字段、不计入 changedThreadIds。
   */
  upsertEntries(
    entries: ThreadCatalogEntry[],
    observationSequence: number,
    observed: boolean,
    pendingObservedTitle: boolean = false,
  ): ThreadCatalogWriteResult {
    let changedThreadIds: string[] = [];
    let upsert = this.db.prepare(CATALOG_UPSERT_SQL);
    let removedEntryCheck = this.db.prepare(
      `SELECT 1 FROM local_thread_catalog_scan_entries WHERE host_id = ? AND thread_id = ? AND removed = 1`,
    );
    let pendingFlag = +!!pendingObservedTitle;
    let observationOnlyUpdate = observed
      ? this.db.prepare(
          `UPDATE local_thread_catalog
           SET observation_sequence = ?,
               pending_observed_title = CASE
                 WHEN ? = 1 THEN 1
                 ELSE pending_observed_title
               END
           WHERE host_id = ?
             AND thread_id = ?
             AND observation_sequence < ?`,
        )
      : null;
    for (let entry of entries) {
      this.assertEntryHost(entry);
      if (observed || removedEntryCheck.get(this.hostId, entry.threadId) == null) {
        let upsertedThreadId = upsert.get(
          this.hostId,
          entry.threadId,
          entry.displayTitle,
          entry.sourceCreatedAt,
          entry.sourceUpdatedAt,
          entry.sourceRecencyAt,
          entry.sourceKind === `chatgpt` ? null : entry.cwd,
          entry.sourceKind,
          entry.sourceKind === `chatgpt` ? null : entry.sourceDetail,
          entry.sourceKind === `chatgpt` ? null : entry.threadSource,
          entry.sourceKind === `chatgpt` ? null : entry.modelProvider,
          entry.sourceKind === `chatgpt` ? null : entry.gitBranch,
          entry.sourceKind === `chatgpt` ? entry.projectId : null,
          entry.sourceKind === `chatgpt` ? entry.conversationOrigin : null,
          observationSequence,
          pendingFlag,
          pendingFlag,
          pendingFlag,
          pendingFlag,
        )?.thread_id;
        if (upsertedThreadId == null)
          observationOnlyUpdate?.run(
            observationSequence,
            pendingFlag,
            this.hostId,
            entry.threadId,
            observationSequence,
          );
        else changedThreadIds.push(entry.threadId);
      }
    }
    if (changedThreadIds.length > 0) this.bumpCatalogRevision();
    return {
      catalogRevision: this.readCatalogRevision(),
      changedThreadIds,
      removedThreadIds: [],
    };
  }

  /** 读原始存储行（含 missing 候选，原版 readStoredEntry）。 */
  readStoredEntry(threadId: string): ThreadCatalogEntry | null {
    let row = this.db
      .prepare(
        `SELECT * FROM local_thread_catalog
         WHERE host_id = ? AND thread_id = ?`,
      )
      .get(this.hostId, threadId);
    return row == null ? null : rowToCatalogEntry(row);
  }

  /** 自增并返回观察水位（sync_state 行缺失时抛错——host 未注册）。 */
  nextObservationSequence(): number {
    let row = this.db
      .prepare(
        `UPDATE local_thread_catalog_sync_state
         SET observation_sequence = observation_sequence + 1
         WHERE host_id = ?
         RETURNING observation_sequence`,
      )
      .get(this.hostId);
    if (row == null || !Number.isInteger(row.observation_sequence))
      throw Error(`Local thread catalog sync state is unavailable`);
    return row.observation_sequence;
  }

  /** 全局 catalog revision +1（metadata 表单行计数器）。 */
  bumpCatalogRevision(): void {
    this.db
      .prepare(
        `UPDATE local_thread_catalog_metadata
         SET catalog_revision = catalog_revision + 1
         WHERE id = 1`,
      )
      .run();
  }

  /** 读全局 catalog revision（缺失/非数值时 0）。 */
  readCatalogRevision(): number {
    let row = this.db
      .prepare(
        `SELECT catalog_revision FROM local_thread_catalog_metadata
         WHERE id = 1`,
      )
      .get();
    return typeof row?.catalog_revision == `number` ? row.catalog_revision : 0;
  }

  /** 执行写语句并返回受影响行数（changes 缺失按 0）。 */
  private mutateThreadCount(sql: string, ...params: unknown[]): number {
    return this.db.prepare(sql).run(...params).changes ?? 0;
  }

  /** 校验扫描 attempt 是当前活跃的那个（对象同一性比较）。 */
  private assertActiveScan(attempt: ThreadCatalogScanAttempt): void {
    if (this.activeScan !== attempt) throw Error(`Local thread catalog scan is not active`);
  }

  /** 校验条目属于本 host。 */
  private assertEntryHost(entry: ThreadCatalogEntry): void {
    if (entry.hostId !== this.hostId)
      throw Error(
        `Thread catalog entry belongs to ${entry.hostId}, expected ${this.hostId}`,
      );
  }

  private clearScanCheckpoint(): void {
    this.db
      .prepare(`DELETE FROM local_thread_catalog_scan_checkpoints WHERE host_id = ?`)
      .run(this.hostId);
  }

  private clearSeenEntries(): void {
    this.db.prepare(`DELETE FROM local_thread_catalog_scan_entries WHERE host_id = ?`).run(this.hostId);
  }

  /** BEGIN IMMEDIATE 事务（写写互斥；异常回滚后原样抛出）。 */
  runInTransaction<T>(operation: () => T): T {
    this.db.prepare(`BEGIN IMMEDIATE`).run();
    try {
      let result = operation();
      this.db.prepare(`COMMIT`).run();
      return result;
    } catch (error) {
      this.db.prepare(`ROLLBACK`).run();
      throw error;
    }
  }
}
