// 本地线程 catalog（sidebar/最近会话列表）的 schema 与行映射。
//
// 原版 main-C-Mhak1n.ts 26,624-26,795。桌面侧不存 conversation 内容
// （turns/items 在 app-server 侧/rollout），只在本机 state db 的
// local_thread_catalog* 表里维护一份线程目录（display_title/cwd/来源/
// recency 等）供 sidebar 与最近列表查询。本模块提供：
//   - zod schema：catalog 行 / sync state / 扫描 checkpoint（chatgpt 云端
//     来源与本地来源是同一行的两种形态，mm 反解时分叉）；
//   - mhe：巨型 upsert SQL（ON CONFLICT(host_id,thread_id) + observation_
//     sequence 水位 + pending_observed_title 状态机），语义见 store.ts；
//   - um：线程 → catalog 行映射（过滤 ephemeral/隐藏/子线程/自动化来源）；
//   - dm：display_title 生成（名字 → 首条用户输入 → cwd → threadId 级联）。

import {
  Af as zUnion,
  Cf as zNumber,
  Of as zString,
  df as zEnum,
  hf as zArray,
  wf as zObject,
} from "@chunk/shared";
import { parseCodexDelegation } from "../misc/delegation";
import { plainTextFromMarkdown } from "../markdown/plain-text";
import { takeLastRequestSection } from "../prompts/section-markers";

/** display_title 最大长度（原版 she）。 */
export const MAX_TITLE_LEN = 80;
/** 本地 host 的 catalog hostId（原版 cm）。 */
export const LOCAL_HOST_ID = `local`;

/** catalog 行的来源类型（原版 che）。 */
export const sourceKindSchema = zEnum([
  `cli`,
  `vscode`,
  `exec`,
  `appServer`,
  `chatgpt`,
  `custom`,
  `unknown`,
]);

/** 扫描进度中的边界锚点集合（原版 lm）。 */
const anchorsSchema = zArray(zUnion([zString(), zNumber()]));

/** 扫描进度（原版 lhe）。 */
const scanProgressSchema = zObject({
  cursor: zString().regex(/^[1-9][0-9]*$/).nullable(),
  phase: zEnum([`scan`, `reconcile-head`]),
  headWatermark: zNumber().nullable(),
  headAnchors: anchorsSchema,
  lastAnchors: anchorsSchema,
  overlapAnchors: anchorsSchema,
});

/** 扫描 checkpoint（原版 uhe）：attempt（full/incremental + observation 水位）+ progress。 */
export const scanCheckpointSchema = zObject({
  attempt: zObject({
    mode: zEnum([`full`, `incremental`]),
    observationSequence: zNumber().int().nonnegative(),
  }),
  progress: scanProgressSchema,
});

/** local_thread_catalog 行（原版 dhe；snake_case 列名原样保留）。 */
export const catalogRowSchema = zObject({
  host_id: zString().min(1),
  thread_id: zString().min(1),
  display_title: zString().nullable(),
  source_created_at: zNumber(),
  source_updated_at: zNumber(),
  source_recency_at: zNumber(),
  cwd: zString().nullable().catch(null),
  source_kind: sourceKindSchema.catch(`unknown`),
  source_detail: zString().nullable().catch(null),
  thread_source: zString().nullable().catch(null),
  model_provider: zString().nullable().catch(null),
  git_branch: zString().nullable().catch(null),
  project_id: zString().nullable().catch(null),
  conversation_origin: zString().nullable().catch(null),
});

/** local_thread_catalog_sync_state 行（原版 fhe）。 */
export const syncStateRowSchema = zObject({
  watermark_updated_at: zNumber().nullable().catch(null),
  last_full_reconciled_at: zNumber().nullable().catch(null),
  initial_build_complete: zNumber().int().catch(0),
});

/** sync state 不可用时的默认进度（原版 phe）。 */
export const DEFAULT_SYNC_PROGRESS = {
  sourceUpdatedAtWatermark: null,
  lastFullReconciliationAt: null,
  isComplete: false,
  catalogRevision: 0,
};

/**
 * 巨型 upsert SQL（原版 mhe，26,659-26,758 逐字保留）。
 *
 * 语义：
 *   - 冲突键 (host_id, thread_id)；
 *   - `? = 1`（第 16/17/33 个参数位）是 pendingObservedTitle 标志位——
 *     观察式写入（applyObservedEntry/Title）置 1，扫描式写入置 0：
 *       * 置 1 时无条件采用新标题并把行标记为 pending_observed_title
 *         （本地 UI 改名优先于 app-server 来源标题）；
 *       * 置 0 时仅当来源 updated_at 更新或行不处于 pending 状态才采用；
 *   - observation_sequence 取 MAX：观察水位单调不回退；
 *   - WHERE 拒绝陈旧写入（observation_sequence 更老，或 updated_at 更老
 *     且无实质字段变化）；
 *   - RETURNING thread_id：返回 null 表示行未被更新（调用方走 UPDATE 旧
 *     observation_sequence 的兜底分支）。
 */
export const CATALOG_UPSERT_SQL = `
  INSERT INTO local_thread_catalog (
    host_id,
    thread_id,
    display_title,
    source_created_at,
    source_updated_at,
    source_recency_at,
    cwd,
    source_kind,
    source_detail,
    thread_source,
    model_provider,
    git_branch,
    project_id,
    conversation_origin,
    observation_sequence,
    pending_observed_title,
    missing_candidate
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  ON CONFLICT(host_id, thread_id) DO UPDATE SET
    display_title = CASE
      WHEN ? = 1
        OR excluded.source_updated_at > local_thread_catalog.source_updated_at
        OR local_thread_catalog.pending_observed_title = 0
      THEN excluded.display_title
      ELSE local_thread_catalog.display_title
    END,
    pending_observed_title = CASE
      WHEN ? = 1 THEN 1
      WHEN excluded.source_updated_at > local_thread_catalog.source_updated_at
        OR excluded.display_title = local_thread_catalog.display_title
      THEN 0
      ELSE local_thread_catalog.pending_observed_title
    END,
    source_created_at = excluded.source_created_at,
    source_updated_at = excluded.source_updated_at,
    source_recency_at = excluded.source_recency_at,
    cwd = excluded.cwd,
    source_kind = excluded.source_kind,
    source_detail = excluded.source_detail,
    thread_source = excluded.thread_source,
    model_provider = excluded.model_provider,
    git_branch = excluded.git_branch,
    project_id = excluded.project_id,
    conversation_origin = excluded.conversation_origin,
    observation_sequence = MAX(
      local_thread_catalog.observation_sequence,
      excluded.observation_sequence
    ),
    missing_candidate = 0
  WHERE
    excluded.observation_sequence >= local_thread_catalog.observation_sequence
    AND (
      excluded.source_updated_at > local_thread_catalog.source_updated_at
      OR (
        excluded.source_updated_at = local_thread_catalog.source_updated_at
        AND (
          (
            local_thread_catalog.display_title IS NOT excluded.display_title
            AND (
              ? = 1
              OR local_thread_catalog.pending_observed_title = 0
            )
          )
          OR (
            local_thread_catalog.pending_observed_title != 0
            AND local_thread_catalog.display_title = excluded.display_title
          )
          OR local_thread_catalog.source_created_at IS NOT excluded.source_created_at
          OR local_thread_catalog.source_recency_at IS NOT excluded.source_recency_at
          OR local_thread_catalog.cwd IS NOT excluded.cwd
          OR local_thread_catalog.source_kind IS NOT excluded.source_kind
          OR local_thread_catalog.source_detail IS NOT excluded.source_detail
          OR local_thread_catalog.thread_source IS NOT excluded.thread_source
          OR local_thread_catalog.model_provider IS NOT excluded.model_provider
          OR local_thread_catalog.git_branch IS NOT excluded.git_branch
          OR local_thread_catalog.project_id IS NOT excluded.project_id
          OR local_thread_catalog.conversation_origin
            IS NOT excluded.conversation_origin
          OR local_thread_catalog.missing_candidate != 0
        )
      )
    )
  RETURNING thread_id
`;

/** catalog 条目（um 的产出 / mm 的反解结果；chatgpt 与本地两种形态）。 */
export interface ThreadCatalogEntry {
  hostId: string;
  threadId: string;
  displayTitle: string;
  sourceCreatedAt: number;
  sourceUpdatedAt: number;
  sourceRecencyAt: number;
  cwd?: string;
  sourceKind?: string;
  sourceDetail?: string | null;
  threadSource?: string | null;
  modelProvider?: string;
  gitBranch?: string | null;
  projectId?: string | null;
  conversationOrigin?: string | null;
}

/** 线程摘要 → catalog 条目（原版 um）。
 *  过滤：ephemeral、chatgpt_hidden、子线程（parentThreadId）、
 *  ambient_suggestions、pull_request_fix_automation、exec 来源、
 *  非有限 updatedAt。 */
export function threadToCatalogEntry(
  thread: {
    ephemeral?: boolean;
    threadSource?: string | null;
    parentThreadId?: string | null;
    id: string;
    name?: string | null;
    preview?: string | null;
    createdAt?: number;
    updatedAt: number;
    recencyAt?: number | null;
    cwd?: string | null;
    source: string | { custom?: string } | null;
    modelProvider?: string | null;
    gitInfo?: { branch?: string | null } | null;
  },
  hostId: string = LOCAL_HOST_ID,
): ThreadCatalogEntry | null {
  if (
    thread.ephemeral ||
    thread.threadSource === `chatgpt_hidden` ||
    thread.parentThreadId != null ||
    thread.threadSource === `ambient_suggestions` ||
    thread.threadSource === `pull_request_fix_automation`
  )
    return null;
  let source = parseThreadSource(thread.source);
  if (source == null || source.kind === `exec` || !Number.isFinite(thread.updatedAt)) return null;
  let sourceCreatedAt = Number.isFinite(thread.createdAt) ? thread.createdAt : thread.updatedAt;
  let cwd = thread.cwd;
  return {
    hostId,
    threadId: thread.id,
    displayTitle: displayTitleForThread({
      cwd,
      name: thread.name,
      preview: thread.preview,
      threadId: thread.id,
    }),
    sourceCreatedAt,
    sourceUpdatedAt: thread.updatedAt,
    sourceRecencyAt:
      thread.recencyAt != null && Number.isFinite(thread.recencyAt)
        ? thread.recencyAt
        : thread.updatedAt,
    cwd,
    sourceKind: source.kind,
    sourceDetail: source.detail,
    threadSource: thread.threadSource,
    modelProvider: thread.modelProvider,
    gitBranch: thread.gitInfo?.branch ?? null,
  };
}

/**
 * display_title 生成（原版 dm）：按 名字 → 首条用户输入（preview，若是
 * delegation 块则取其 input；残缺 delegation 块取空串）→ cwd → threadId
 * 的级联取第一个非空项；markdown 纯文本化后折叠空白，超过 80 字符截断
 * 到 79 + 省略号。
 */
export function displayTitleForThread({
  cwd,
  name,
  preview,
  threadId,
}: {
  cwd?: string | null;
  name?: string | null;
  preview?: string | null;
  threadId: string;
}): string {
  let firstUserInput =
    parseCodexDelegation(preview ?? ``)?.input ??
    (preview?.trimStart().startsWith(`<codex_delegation>`) ? `` : preview);
  for (let candidate of [
    plainTextFromMarkdown(name ?? ``),
    plainTextFromMarkdown(takeLastRequestSection(firstUserInput ?? ``)),
    cwd,
    threadId,
  ]) {
    let collapsed = candidate.replace(/\s+/g, ` `).trim();
    if (collapsed.length > 0)
      return collapsed.length <= MAX_TITLE_LEN
        ? collapsed
        : `${collapsed.slice(0, 79).trimEnd()}…`;
  }
  return threadId;
}

/** 线程来源解析（原版 _he）：字符串 → {kind, detail:null}；{custom} →
 *  {kind:'custom', detail:custom}；其余 null。source 为 null/undefined 时
 *  与原版一致地由 `in` 抛 TypeError（调用方 um 的线程摘要恒有 source）。 */
export function parseThreadSource(
  source: string | { custom?: string } | null | undefined,
): { kind: string; detail: string | null } | null {
  if (typeof source == `string`) return { kind: source, detail: null };
  if (`custom` in (source as object) && typeof (source as { custom?: string }).custom == `string`)
    return { kind: `custom`, detail: (source as { custom: string }).custom };
  return null;
}
