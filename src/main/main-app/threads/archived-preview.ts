// ArchivedThreadPreviewRead —— 归档线程的受限预览读取。
//
// 原版 main-C-Mhak1n.ts 38,301-38,478（vve zod + yve 类）。`extends n.Uf`。
//
// 归档线程不 resume，直接按限额读预览（sidebar 预览/tooltip 用）：
//   - 限额：maxTurns ≤ 100、maxItemsPerTurn ≤ 500（zod 校验，非法 →
//     unavailable/invalid_limits）；
//   - 已装载且历史完整的会话直接本地截取；
//   - 否则 readThread 元数据 + turns/list（maxTurns, desc, notLoaded）+
//     每 turn items/list（maxItemsPerTurn, desc）；
//   - 截断原因：history_limit（还有更老 turn）/ items_limit（单 turn 超
//     额或 items 未装载全）→ incomplete + reason；完整 → ready；
//   - thread_not_found → missing；其余读失败 → unavailable/read_failed。

import {
  $i as errorCode,
  $u as normalizeThreadId,
  Cf as zNumber,
  kd as defaultPermissions,
  Uf as EventEmitter,
  wf as zObject,
} from "@chunk/shared";
import { exhaustedTailIsland, hasCompleteHistory, mergedConversationTurns, type AnyTurn } from "../turns/canonical-history";
import { THREAD_HISTORY_REQUEST_TIMEOUT_MS, type HistoryPolicy } from "../turns/history-requests";
import { subAgentMetadata } from "./projection";

function unarchivedTurns(
  conversation: any,
  policy: { mergeTurns(left: AnyTurn[], right: AnyTurn[]): AnyTurn[] },
): AnyTurn[] {
  if (conversation == null) return [];
  if (conversation.turnHistory?.kind !== "canonical") return conversation.turns ?? [];
  const history = conversation.turnHistory.history;
  const tail = exhaustedTailIsland(history);
  const turns = tail?.entries
    .map((entry) => entry.value == null ? undefined : history.entitiesByKey[entry.value])
    .filter((turn: AnyTurn | undefined): turn is AnyTurn => turn != null) ?? [];
  return policy.mergeTurns(turns, conversation.turns ?? []);
}

/** 预览限额 schema（原版 vve）。 */
const previewLimitsSchema = zObject({
  maxTurns: zNumber().int().min(1).max(100),
  maxItemsPerTurn: zNumber().int().min(1).max(500),
});

/** 预览读取的连接面（app-server 连接）。 */
export interface ArchivedPreviewConnection {
  getHostId(): string;
  getConversation(threadId: string): any;
  readThread(threadId: string, options: any): Promise<any>;
  listThreadTurns(threadId: string, options: any): Promise<any>;
  sendRequest(method: string, params: any, options?: any): Promise<any>;
  supportsPaginatedThreadHistory(): boolean;
}

/** 预览结果。 */
export type ArchivedThreadPreviewResult =
  | { status: `ready`; hostId: string; threadId: string; context: any }
  | { status: `incomplete`; hostId: string; threadId: string; reason: string; context: any }
  | { status: `missing`; hostId: string; threadId: string }
  | { status: `unavailable`; hostId: string; threadId: string; reason?: string }
  | { status: `cancelled`; hostId: string; threadId: string };

/**
 * 归档线程预览读取（原版 yve）。构造即开始（微任务），getResult() 取
 * 结果 promise；cancel/dispose 幂等。
 */
export class ArchivedThreadPreviewRead extends EventEmitter {
  #cancelled = false;
  #resolveResult: ((result: ArchivedThreadPreviewResult) => void) | null;
  #result: Promise<ArchivedThreadPreviewResult>;
  #key: { hostId: string; threadId: string };

  constructor(
    connection: ArchivedPreviewConnection,
    threadId: string,
    rawLimits: unknown,
    policy: HistoryPolicy & { mergeTurns: (existing: AnyTurn[], incoming: AnyTurn[]) => AnyTurn[] },
  ) {
    super();
    this.#key = { hostId: connection.getHostId(), threadId };
    this.#result = new Promise((resolve) => {
      this.#resolveResult = resolve;
    });
    Promise.resolve().then(async () => {
      let limits = previewLimitsSchema.safeParse(rawLimits);
      try {
        let result: ArchivedThreadPreviewResult = limits.success
          ? await this.#read(connection, limits.data as any, policy)
          : { ...this.#key, status: `unavailable`, reason: `invalid_limits` };
        this.#resolveResult?.(result);
      } catch (error) {
        this.#resolveResult?.(
          errorCode(error) === `thread_not_found`
            ? { ...this.#key, status: `missing` }
            : { ...this.#key, status: `unavailable`, reason: `read_failed` },
        );
      } finally {
        this.#resolveResult = void 0;
      }
    });
  }

  getResult(): Promise<ArchivedThreadPreviewResult> {
    return this.#result;
  }

  cancel(): void {
    this.#cancelled = true;
    this.#resolveResult?.({ ...this.#key, status: `cancelled` });
    this.#resolveResult = void 0;
  }

  [Symbol.dispose](): void {
    this.cancel();
  }

  async #read(
    connection: ArchivedPreviewConnection,
    limits: { maxTurns: number; maxItemsPerTurn: number },
    policy: HistoryPolicy & { mergeTurns: (existing: AnyTurn[], incoming: AnyTurn[]) => AnyTurn[] },
  ): Promise<ArchivedThreadPreviewResult> {
    if (this.#cancelled) return { ...this.#key, status: `cancelled` };
    let conversation = connection.getConversation(this.#key.threadId);
    // 已装载且历史完整：本地截取。
    if (conversation != null && hasCompleteHistory(conversation))
      return this.#truncate(
        {
          title: conversation.title,
          cwd: conversation.cwd ?? null,
          threadSource: conversation.threadSource ?? null,
          threadStartKind: conversation.threadStartKind ?? null,
          modelProvider: conversation.modelProvider ?? null,
          parentThreadId:
            conversation.parentThreadId ?? subAgentMetadata(conversation.source)?.parentThreadId ?? null,
          projectlessOutputDirectory: conversation.projectlessOutputDirectory ?? null,
          requests: conversation.requests,
          turns: mergedConversationTurns(conversation, policy.turnMergePolicy),
        },
        limits,
      );
    let localUnarchived = unarchivedTurns(conversation, policy);
    let localActiveTurnIds = new Set(
      localUnarchived
        .filter((turn: AnyTurn) => turn.turnId == null || turn.status === `inProgress`)
        .map((turn: AnyTurn) => turn.turnId),
    );
    let metadata = await connection.readThread(this.#key.threadId, {
      includeTurns: false,
      requestOptions: { timeoutMs: THREAD_HISTORY_REQUEST_TIMEOUT_MS },
    });
    if (this.#cancelled) return { ...this.#key, status: `cancelled` };
    if (metadata.thread.id !== this.#key.threadId)
      return { ...this.#key, status: `unavailable`, reason: `read_failed` };
    let context: any = {
      title: metadata.thread.name,
      cwd: metadata.thread.cwd,
      threadSource: metadata.thread.threadSource,
      threadStartKind: conversation?.threadStartKind ?? null,
      modelProvider: metadata.thread.modelProvider,
      parentThreadId:
        metadata.thread.parentThreadId == null
          ? (subAgentMetadata(metadata.thread.source)?.parentThreadId ?? null)
          : normalizeThreadId(metadata.thread.parentThreadId),
      projectlessOutputDirectory: conversation?.projectlessOutputDirectory ?? null,
      requests: conversation?.requests ?? [],
      turns: conversation == null ? [] : mergedConversationTurns(conversation, policy.turnMergePolicy),
    };
    if (this.#key.hostId !== `durable` && !connection.supportsPaginatedThreadHistory())
      return this.#truncate(context, limits, `unsupported`);
    let { response } = await connection.listThreadTurns(this.#key.threadId, {
      limit: limits.maxTurns,
      sortDirection: `desc`,
      itemsView: `notLoaded`,
      requestOptions: { timeoutMs: THREAD_HISTORY_REQUEST_TIMEOUT_MS },
    });
    let turnsAsc: any[] = [];
    let hitItemsLimit = false;
    let itemsPaginationByTurnId: Record<string, any> = {};
    for (let turn of response.data.slice(0, limits.maxTurns)) {
      if (this.#cancelled) return { ...this.#key, status: `cancelled` };
      let itemsResponse = await connection.sendRequest(
        `thread/items/list`,
        {
          threadId: this.#key.threadId,
          turnId: turn.id,
          cursor: null,
          limit: limits.maxItemsPerTurn,
          sortDirection: `desc`,
        },
        { timeoutMs: THREAD_HISTORY_REQUEST_TIMEOUT_MS },
      );
      hitItemsLimit ||= itemsResponse.nextCursor != null;
      itemsPaginationByTurnId[turn.id] = {
        olderCursor: itemsResponse.nextCursor,
        hasLoadedOldest: itemsResponse.nextCursor == null,
        isLoadingOlder: false,
      };
      let page = itemsResponse.data;
      if (page.some((entry: any) => `item` in entry && entry.turnId !== turn.id))
        return { ...this.#key, status: `unavailable`, reason: `read_failed` };
      turnsAsc.unshift({
        ...turn,
        items: page.map((entry: any) => (`item` in entry ? entry.item : entry)).reverse(),
        itemsView: itemsResponse.nextCursor == null ? `full` : `summary`,
      });
    }
    if (this.#cancelled) return { ...this.#key, status: `cancelled` };
    let mappedTurns = policy.mapThreadTurns({
      threadId: this.#key.threadId,
      turns: turnsAsc,
      model: conversation?.latestModel ?? ``,
      reasoningEffort: conversation?.latestReasoningEffort ?? null,
      cwd: metadata.thread.cwd,
      permissions: defaultPermissions([]),
      itemsPaginationByTurnId,
    });
    let currentConversation = connection.getConversation(this.#key.threadId);
    context.requests = currentConversation?.requests ?? [];
    let mappedTurnIds = new Set(mappedTurns.map((turn: AnyTurn) => turn.turnId));
    let currentUnarchived = unarchivedTurns(currentConversation, policy);
    let lastLocalTurn = localUnarchived.at(-1);
    let boundaryIndex =
      lastLocalTurn == null ? -1 : currentUnarchived.findIndex((turn: AnyTurn) => turn.turnId === lastLocalTurn.turnId);
    let turnsAfterBoundary = new Set(currentUnarchived.slice(boundaryIndex + 1));
    context.turns = [
      ...policy.mergeTurns(
        currentConversation == null
          ? []
          : mergedConversationTurns(currentConversation, policy.turnMergePolicy).filter(
              (turn: AnyTurn) => mappedTurnIds.has(turn.turnId),
            ),
        mappedTurns,
      ),
      ...currentUnarchived.filter(
        (turn: AnyTurn) =>
          !mappedTurnIds.has(turn.turnId) &&
          (turnsAfterBoundary.has(turn) ||
            localActiveTurnIds.has(turn.turnId) ||
            turn.turnId == null ||
            turn.status === `inProgress`),
      ),
    ];
    return hitItemsLimit
      ? this.#truncate(context, limits, `items_limit`)
      : this.#truncate(context, limits, response.nextCursor == null ? void 0 : `history_limit`);
  }

  /** 限额截断（原版 #a）：reason 缺省时按实际截断情况补全。 */
  #truncate(
    context: any,
    limits: { maxTurns: number; maxItemsPerTurn: number },
    reason?: string,
  ): ArchivedThreadPreviewResult {
    let turns = context.turns.slice(-limits.maxTurns);
    let itemsIncomplete = turns.some(
      (turn: AnyTurn) =>
        turn.items.length > limits.maxItemsPerTurn || turn.itemsPagination?.hasLoadedOldest === false,
    );
    let effectiveReason = reason;
    if (turns.length < context.turns.length) effectiveReason ??= `history_limit`;
    if (itemsIncomplete) effectiveReason ??= `items_limit`;
    let turnIds = new Set(turns.map((turn: AnyTurn) => turn.turnId));
    let requests = context.requests.filter(
      (request: any) => `turnId` in request.params && turnIds.has(request.params.turnId),
    );
    if (requests.length > limits.maxItemsPerTurn) effectiveReason ??= `items_limit`;
    let truncated = {
      ...context,
      requests: requests.slice(-limits.maxItemsPerTurn),
      turns: turns.map((turn: AnyTurn) => ({
        ...turn,
        items: turn.items.slice(-limits.maxItemsPerTurn),
      })),
    };
    return effectiveReason == null
      ? { ...this.#key, status: `ready`, context: truncated }
      : { ...this.#key, status: `incomplete`, reason: effectiveReason, context: truncated };
  }
}
