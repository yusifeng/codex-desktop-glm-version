// subagent 后代线程拓扑发现（原版 50,244-50,566 区段）。
//
// SubagentTopology（ySe）：发现某线程的全部后代 subagent 线程——
//   - discover：thread/list（sourceKinds: subAgentThreadSpawn）逐层 BFS；
//     app-server 版本 ≥ 0.143.0-alpha.16 时改用 ancestorThreadId 服务端过滤；
//   - 扫描父线程历史（thread/items/list 或分页 thread/turns/list）找
//     spawnAgent/collabAgentToolCall 的 receiverThreadIds；
//   - reconcile：与 threadStore 已知快照合并（raw → reconciled 两级缓存）。
//
// 版本 gate：`0.143.0-alpha.16`（原 _Se）是钉死的兼容分界——服务端
// ancestorThreadId 过滤自该版本起可用，逐字保留。
//
// 原压缩名对照：_Se→SUBAGENT_TOPOLOGY_MIN_APP_SERVER_VERSION、vSe→
// SEMVER_PATTERN、ySe→SubagentTopology、bSe→supportsAncestorThreadFilter。

import { $u as normalizeThreadId, Cs as isDurableHost } from "@chunk/shared";
import { kg as mergedConversationTurns } from "../turns/canonical-history";
// uv（33,447）= 父线程 id 解析（thread_spawn/subAgent source）——R3 threads/projection。
import { uv as resolveParentThreadId } from "../threads/projection";

/**
 * subagent 拓扑发现的 app-server 版本门（原 _Se）。
 * ≥ 此版本时 thread/list 支持 ancestorThreadId 服务端过滤。
 * 钉死常量，勿「规范化」。
 */
export const SUBAGENT_TOPOLOGY_MIN_APP_SERVER_VERSION = `0.143.0-alpha.16`;

/** 语义化版本串正则（major.minor.patch[-prerelease][+build]）。 */
const SEMVER_PATTERN =
  /^(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

/** app-server 版本是否支持 ancestorThreadId 过滤（0.0.0 视为开发版恒真）。 */
function supportsAncestorThreadFilter(appServerVersion: string | null, compareSemanticVersions: (a: string, b: string) => number) {
  return (
    appServerVersion === `0.0.0` ||
    (appServerVersion != null && SEMVER_PATTERN.test(appServerVersion) && compareSemanticVersions(appServerVersion, SUBAGENT_TOPOLOGY_MIN_APP_SERVER_VERSION) >= 0)
  );
}

/** 后代发现结果。 */
interface DescendantDiscovery {
  descendantThreads: any[];
  isComplete: boolean;
  isLoading?: boolean;
}

/** 发现缓存条目（raw 与 reconciled 两级）。 */
interface DiscoveryEntry {
  runtimeStatusAtDiscoveryStart: unknown;
  raw: Promise<DescendantDiscovery & { isLoading: boolean }>;
  reconciled?: Promise<DescendantDiscovery>;
}

/** SubagentTopology 依赖注入面。 */
export interface SubagentTopologyParams {
  requestClient: any;
  compareSemanticVersions: (a: string, b: string) => number;
  threadStore: any;
}

/**
 * subagent 后代线程拓扑（原 ySe）。
 * in-flight 去重：同一会话的发现（含/不含 spawn 扫描两表）共享同一 promise；
 * raw 完成后自动出表，reconciled 在 raw 出表后仍保留至自身落定。
 */
export class SubagentTopology {
  params: SubagentTopologyParams;
  inFlightDiscoveries = new Map<string, DiscoveryEntry>();
  inFlightDiscoveriesWithSpawnScan = new Map<string, DiscoveryEntry>();

  constructor(params: SubagentTopologyParams) {
    this.params = params;
  }

  /** 只读快照（已知后代 + 是否发现中）。 */
  getSnapshot(conversationId: string) {
    return {
      descendantThreads: this.params.threadStore.getKnownSubagentDescendantThreads(conversationId),
      isComplete: false,
      isLoading:
        this.inFlightDiscoveries.has(conversationId) || this.inFlightDiscoveriesWithSpawnScan.has(conversationId),
    };
  }

  /**
   * 发现后代线程。reconcile（默认）把结果与 threadStore 已知快照合并；
   * scanParentHistoryForSubagentSpawns 时额外扫父线程云端历史（仅本地
   * host），并使用独立的 in-flight 表。
   */
  discover(
    conversationId: string,
    { reconcile = true, scanParentHistoryForSubagentSpawns = false } = {},
  ): Promise<DescendantDiscovery> {
    let withSpawnScan = scanParentHistoryForSubagentSpawns && isDurableHost(this.params.requestClient.hostId);
    let inFlight = withSpawnScan ? this.inFlightDiscoveriesWithSpawnScan : this.inFlightDiscoveries;
    let entry = inFlight.get(conversationId);
    if (entry == null) {
      entry = {
        runtimeStatusAtDiscoveryStart: this.params.threadStore.captureSubagentDescendantDiscoveryState(),
        raw: this.listDescendantThreads(conversationId, withSpawnScan).then((result) => ({
          ...result,
          isLoading: false,
        })),
      };
      let created = entry;
      let removeIfCurrent = () => {
        created.reconciled == null && inFlight.get(conversationId) === created && inFlight.delete(conversationId);
      };
      inFlight.set(conversationId, entry);
      entry.raw.then(removeIfCurrent, removeIfCurrent);
    }
    if (!reconcile) return entry.raw;
    if (entry.reconciled == null) {
      let { runtimeStatusAtDiscoveryStart } = entry;
      entry.reconciled = entry.raw.then((raw) => ({
        ...raw,
        descendantThreads: this.params.threadStore.reconcileSubagentDescendantSnapshot(
          conversationId,
          raw.descendantThreads,
          runtimeStatusAtDiscoveryStart,
          { isComplete: raw.isComplete },
        ),
      }));
      let created = entry;
      let remove = () => {
        inFlight.get(conversationId) === created && inFlight.delete(conversationId);
      };
      entry.reconciled.then(remove, remove);
    }
    return entry.reconciled;
  }

  /** spawn 事件触发的定向发现：单 receiver 且父归属匹配时刷新该子树。 */
  discoverForSpawn(conversationId: string, event: any) {
    if (event.type !== `collabAgentToolCall` && event.type !== `subAgentActivity`) return;
    let receiverThreadIds =
      event.type === `collabAgentToolCall` ? event.receiverThreadIds : [event.agentThreadId];
    let firstReceiver = receiverThreadIds[0];
    if (
      receiverThreadIds.length !== 1 ||
      firstReceiver == null ||
      resolveParentThreadId(this.params.threadStore.threadsById.get(normalizeThreadId(firstReceiver))) !== conversationId
    ) {
      this.discover(conversationId).catch(() => void 0);
      return;
    }
    this.refreshAndDiscoverSubtree(normalizeThreadId(firstReceiver)).catch(() => void 0);
  }

  /** 刷新单个子线程的 thread model（含分页拓扑），再发现其后代。 */
  async refreshAndDiscoverSubtree(conversationId: string) {
    try {
      let capturedSettings = this.params.threadStore.captureThreadModelSettings(conversationId);
      let response = await this.params.threadStore.readThread(conversationId, {
        includeTurns: false,
        requestOptions: { priority: `background`, source: `collab_hydration` },
      });
      this.params.threadStore.upsertConversationFromThread(response.thread, `stored`, capturedSettings);
    } catch {}
    await this.discover(conversationId);
  }

  /**
   * 逐层列举后代（原 listDescendantThreads）：
   *   - 本地 host 从根会话 BFS（thread/list, parentThreadId 逐层）；
   *     版本支持时用 ancestorThreadId 一次过滤；
   *   - stateDb 首页缺已知观测后代时回退全量 DB；
   *   - spawn 扫描：thread/items/list 扫根会话历史收集 spawn 的
   *     receiverThreadIds；未知子线程 thread/read（并发 ≤2）+ 分页拓扑。
   */
  async listDescendantThreads(conversationId: string, scanParentHistory: boolean): Promise<DescendantDiscovery> {
    let descendantThreads: any[] = [];
    let isLocal = !isDurableHost(this.params.requestClient.hostId);
    let roots = isLocal ? [conversationId] : [];
    let frontier = [conversationId];
    let visited = new Set<string>([conversationId]);
    let spawnedIdsByThread = new Map<string, string[]>();
    let createdAtMs = this.params.threadStore.getThreadCreatedAtMs(conversationId);
    let createdAtSeconds = createdAtMs == null ? null : Math.floor(createdAtMs / 1e3);
    let useAncestorFilter = supportsAncestorThreadFilter(
      this.params.requestClient.getAppServerVersion(),
      this.params.compareSemanticVersions,
    );
    for (let root of roots) {
      let cursor: string | null = null;
      let seenCursors = new Set<string>();
      for (;;) {
        let listRequest = {
          limit: 200,
          cursor,
          modelProviders: null,
          archived: false,
          ...(useAncestorFilter ? { ancestorThreadId: conversationId } : { parentThreadId: root }),
          sourceKinds: [`subAgentThreadSpawn`],
          sortDirection: `desc`,
          sortKey: `created_at`,
          useStateDbOnly: true,
        };
        let response = await this.params.requestClient.sendRequest(`thread/list`, listRequest, {
          priority: `background`,
          source: `collab_hydration`,
        });
        if (
          cursor == null &&
          response.nextCursor == null &&
          this.hasMissingObservedDescendant(
            useAncestorFilter ? [root, ...response.data.map((thread: any) => normalizeThreadId(thread.id))] : [root],
            response.data,
          )
        ) {
          response = await this.params.requestClient.sendRequest(
            `thread/list`,
            { ...listRequest, useStateDbOnly: false },
            { priority: `background`, source: `collab_hydration` },
          );
        }
        for (let thread of response.data) {
          let threadId = normalizeThreadId(thread.id);
          if (!visited.has(threadId)) {
            if (!useAncestorFilter) {
              if (resolveParentThreadId(thread) !== root) continue;
              roots.push(threadId);
            }
            descendantThreads.push(thread);
            visited.add(threadId);
            frontier.push(threadId);
          }
        }
        let nextCursor = response.nextCursor;
        if (nextCursor == null || (createdAtSeconds != null && response.data.some((thread: any) => thread.createdAt < createdAtSeconds)))
          break;
        if (seenCursors.has(nextCursor)) return { descendantThreads, isComplete: false };
        seenCursors.add(nextCursor);
        cursor = nextCursor;
      }
    }
    let isComplete = isLocal;
    if (scanParentHistory) {
      try {
        spawnedIdsByThread.set(conversationId, await this.readSpawnedThreadIdsFromCloudHistory(conversationId));
      } catch {
        isComplete = false;
      }
    }
    // 原版 for-of 直接遍历 frontier 并在处理中向其追加——每个元素恰访问一次。
    for (let threadId of frontier) {
      let candidateIds = new Set([...this.getObservedSpawnedThreadIds(threadId), ...(spawnedIdsByThread.get(threadId) ?? [])]);
      let unknownIds = Array.from(candidateIds).filter((id) => !visited.has(normalizeThreadId(id)));
      let results = Array(unknownIds.length);
      let nextIndex = 0;
      await Promise.all(
        Array.from({ length: Math.min(2, unknownIds.length) }, async () => {
          for (; nextIndex < unknownIds.length; ) {
            let index = nextIndex;
            nextIndex += 1;
            let candidateId = unknownIds[index];
            let candidateConversationId = normalizeThreadId(candidateId);
            let thread: any;
            try {
              thread = (
                await this.params.requestClient.sendRequest(
                  `thread/read`,
                  { threadId: candidateId, includeTurns: false },
                  { priority: `background`, source: `collab_hydration` },
                )
              ).thread;
            } catch {
              results[index] = null;
              continue;
            }
            if (thread.id !== candidateId || resolveParentThreadId(thread) !== threadId) {
              results[index] = null;
              continue;
            }
            let childIsComplete = true;
            let childSpawnedThreadIds: string[] = [];
            if (thread.historyMode === `paginated` && this.params.threadStore.getConversation(candidateConversationId) == null) {
              try {
                let paginated = await this.readPaginatedDescendantTopology(thread);
                thread = paginated.thread;
                childSpawnedThreadIds = paginated.spawnedThreadIds;
              } catch {
                childIsComplete = false;
              }
            }
            results[index] = {
              conversationId: candidateConversationId,
              isComplete: childIsComplete,
              spawnedThreadIds: childSpawnedThreadIds,
              thread,
            };
          }
        }),
      );
      for (let result of results) {
        if (result == null) {
          isComplete = false;
          continue;
        }
        result.isComplete || (isComplete = false);
        result.spawnedThreadIds.length > 0 && spawnedIdsByThread.set(result.conversationId, result.spawnedThreadIds);
        descendantThreads.push(result.thread);
        visited.add(result.conversationId);
        frontier.push(result.conversationId);
      }
    }
    return { descendantThreads, isComplete };
  }

  /**
   * 分页后代拓扑：thread/turns/list（limit 5、asc、full items）扫全部 turn，
   * 收集 spawn 的 receiverThreadIds；返回仅含末 turn 骨架的 thread。
   */
  async readPaginatedDescendantTopology(thread: any) {
    let spawnedThreadIds = new Set<string>();
    let seenCursors = new Set<string>();
    let cursor: string | null = null;
    let lastTurn: any = null;
    do {
      if (cursor != null && seenCursors.has(cursor))
        throw Error(`thread/turns/list returned a repeated cursor for thread ${thread.id}`);
      cursor != null && seenCursors.add(cursor);
      let response = await this.params.requestClient.sendRequest(
        `thread/turns/list`,
        { threadId: thread.id, cursor, limit: 5, sortDirection: `asc`, itemsView: `full` },
        { priority: `background`, source: `collab_hydration` },
      );
      for (let turn of response.data) {
        lastTurn = { ...turn, items: [], itemsView: `notLoaded` };
        for (let item of turn.items)
          if (
            item.type === `subAgentActivity` &&
            `kind` in item &&
            `agentThreadId` in item &&
            item.kind === `started` &&
            typeof item.agentThreadId == `string`
          )
            spawnedThreadIds.add(item.agentThreadId);
          else if (
            item.type === `collabAgentToolCall` &&
            `tool` in item &&
            `receiverThreadIds` in item &&
            Array.isArray(item.receiverThreadIds) &&
            item.tool === `spawnAgent`
          )
            for (let receiverThreadId of item.receiverThreadIds) spawnedThreadIds.add(receiverThreadId);
      }
      cursor = response.nextCursor;
    } while (cursor != null);
    return { thread: { ...thread, turns: lastTurn == null ? [] : [lastTurn] }, spawnedThreadIds: Array.from(spawnedThreadIds) };
  }

  /** 云端历史扫根会话的 spawn 事件（thread/items/list，limit 500、asc）。 */
  async readSpawnedThreadIdsFromCloudHistory(conversationId: string) {
    let spawnedThreadIds = new Set<string>();
    let seenCursors = new Set<string>();
    let cursor: string | null = null;
    do {
      if (cursor != null) {
        if (seenCursors.has(cursor))
          throw Error(`thread/items/list returned a repeated cursor for thread ${conversationId}`);
        seenCursors.add(cursor);
      }
      let response = await this.params.requestClient.sendRequest(
        `thread/items/list`,
        { threadId: conversationId, cursor, limit: 500, sortDirection: `asc` },
        { priority: `background`, source: `collab_hydration` },
      );
      for (let { item } of response.data)
        if (
          item.type === `subAgentActivity` &&
          `kind` in item &&
          `agentThreadId` in item &&
          item.kind === `started` &&
          typeof item.agentThreadId == `string`
        )
          spawnedThreadIds.add(item.agentThreadId);
        else if (
          item.type === `collabAgentToolCall` &&
          `tool` in item &&
          `receiverThreadIds` in item &&
          Array.isArray(item.receiverThreadIds) &&
          item.tool === `spawnAgent`
        )
          for (let receiverThreadId of item.receiverThreadIds) spawnedThreadIds.add(receiverThreadId);
      cursor = response.nextCursor;
    } while (cursor != null);
    return Array.from(spawnedThreadIds);
  }

  /** 服务端首页是否缺了本地已观测到的后代（需要回退全量 DB）。 */
  hasMissingObservedDescendant(parentIds: string[], listedThreads: any[]) {
    let listedIds = new Set(listedThreads.map((thread: any) => thread.id));
    for (let parentId of parentIds)
      if (this.getObservedSpawnedThreadIds(parentId).some((id) => !listedIds.has(id))) return true;
    return false;
  }

  /** 本地已观测的 spawn 事件（会话历史里 subAgentActivity/collabAgentToolCall）。 */
  getObservedSpawnedThreadIds(conversationId: string) {
    let conversation = this.params.threadStore.getConversation(conversationId);
    if (conversation == null) return [];
    let spawnedIds = new Set<string>();
    for (let turn of mergedConversationTurns(conversation, undefined))
      for (let item of turn.items)
        if (
          item.type === `subAgentActivity` &&
          `kind` in item &&
          `agentThreadId` in item &&
          item.kind === `started` &&
          typeof item.agentThreadId == `string`
        )
          spawnedIds.add(item.agentThreadId);
        else if (
          item.type === `collabAgentToolCall` &&
          `tool` in item &&
          `receiverThreadIds` in item &&
          Array.isArray(item.receiverThreadIds) &&
          item.tool === `spawnAgent`
        )
          for (let receiverThreadId of item.receiverThreadIds) spawnedIds.add(receiverThreadId);
    return Array.from(spawnedIds);
  }
}
