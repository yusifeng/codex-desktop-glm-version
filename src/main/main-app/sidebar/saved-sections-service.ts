// 已保存自定义分区：undo/redo 栈 + 管理器 + 对账 + PinnedThreadsService。
//
// 对应 main-C-Mhak1n.ts 94,535-95,506：
//   - yH SectionUndoRedoStack：undo/redo（scope 差分写回 + 结构序重建 +
//     snapshot 一致性校验 + 撤销方向翻转）+ transition 签发（#y：saveReplica
//     / completeMigration 的回调实现）+ 迁移态的 legacy-only scope
//   - rBe SectionReconciliation：readList/readMembers → commitList/commitMembers
//     （host 对账合并 → replica 写回）
//   - iBe SavedCustomSectionsManager：applySavedCustomSectionCommand /
//     beginSavedCustomSectionReconciliation / beginSavedCustomSectionMigration /
//     importLegacySavedCustomSections；状态源装配（#u：principal + 连接绑定 +
//     reserveCreation 预留账本）；persisted-atom 写入（#d/#f：保留原引用 + 广播）
//   - jH PinnedThreadsService：list/set/setOrder + 段 CRUD 转发 + pinned
//     globalState 同步 + 窗口广播 + worktree 清理保护
import { randomUUID } from "node:crypto";
import {
  wf as objectSchema,
  Of as stringSchema,
  hf as arraySchema,
  Mf as jsonSchema,
  Ef as recordSchema,
  df as enumSchema,
  hu as isValidThreadId,
  $u as threadIdOf,
  iu as STATE_KEYS,
  Uf as EventEmitterBase,
} from "@chunk/shared";
import { memoizedTaggedLogger } from "@chunk/logger";
import { deepEqual } from "../util/lodash-interop";
import {
  type SectionStateSource,
  type SectionOperationContext,
  type SavedSectionsState,
  type SavedSection,
  type SectionScope,
  PINNED_SECTION_UUID,
  diffSectionScope,
  snapshotMatches,
  snapshotFor,
  clampToScope,
  applyScopeToState,
  applyReplicaState,
  applySectionCommand,
  reconcileHostSections,
  reconcileSectionMembers,
  readPinnedThreadIds,
  ThreadSectionServer,
} from "./saved-sections-state";
import { SectionTransition } from "./saved-sections-transactions";

/** 移动命令（undo/redo 栈的 moveCommand 参数）。 */
export interface MoveSectionCommand {
  type: "move";
  sectionId: string;
  itemKey: string;
  beforeItemKey: string | null;
}

/** 身份上下文提供方（manager 构造参数）。 */
export interface IdentityProvider {
  captureContext(hostId: string): Promise<IdentityContext | null>;
}

interface GlobalStateLikeForSections {
  get(key: unknown): unknown;
  set(key: unknown, value: unknown): void;
  flush(): Promise<void>;
  flushOrThrow(): Promise<void>;
}

interface HostRegistryLike {
  getAllHostIds(): string[];
  getMaybeConnection(hostId: string): { captureRequestLifetime(): () => void; getConnectionState(): string } | null;
}

// ---------------------------------------------------------------------------
// SectionUndoRedoStack（原 `yH`）
// ---------------------------------------------------------------------------

export interface UndoRedoResult {
  status: "applied" | "conflict" | "unavailable";
  affectedBefore?: SavedSectionsState;
  affectedAfter?: SavedSectionsState;
  transition?: SectionTransition;
}

/** undo/redo 栈（原 `yH`）：单步翻转 + transition 签发。 */
export class SectionUndoRedoStack extends (EventEmitterBase as new () => {}) {
  #source: SectionStateSource;
  #affectedBefore: SavedSectionsState;
  #affectedAfter: SavedSectionsState;
  #scope: SectionScope;
  #threadHostIds: Record<string, string>;
  #beforeOrder: string[] | undefined;
  #afterOrder: string[] | undefined;
  #snapshot: ReturnType<typeof snapshotFor>;
  #direction: "undo" | "redo" = "undo";
  #disposed = false;
  #generation: Record<string, never> = {};
  #mutationQueue = Promise.resolve();
  #writeQueue = Promise.resolve();
  #moveCommand: MoveSectionCommand | undefined;
  #migrationHostId: string | undefined;

  constructor(
    source: SectionStateSource,
    before: SavedSectionsState,
    after: SavedSectionsState,
    moveCommand: MoveSectionCommand | undefined,
    migrationHostId: string | undefined,
  ) {
    super();
    this.#source = source;
    this.#moveCommand = moveCommand;
    this.#migrationHostId = migrationHostId;
    this.#scope =
      migrationHostId == null
        ? diffSectionScope(before, after)
        : {
            sections: before.sections
              .filter(({ id }) => before.appServerLegacySectionIds?.includes(id))
              .map((section) => ({ id: section.id, before: section, after: section })),
            collections: ["threadHostIds", "appServerLegacySectionIds", "appServerMigratedHostIds"],
            structure: false,
          };
    if (moveCommand?.type === "move") {
      const moved = after.sections.find(({ id }) => id === moveCommand.sectionId);
      if (moved != null) this.#scope.sections.push({ id: moved.id, before: moved, after: moved });
    }
    const affectedItemKeys = new Set([
      ...this.#scope.sections.flatMap(({ before: section, after }) => [
        ...(section?.itemKeys ?? []),
        ...(after?.itemKeys ?? []),
      ]),
      ...(moveCommand == null ? [] : [moveCommand.itemKey]),
    ]);
    this.#threadHostIds = Object.fromEntries(
      Object.entries({ ...before.threadHostIds, ...after.threadHostIds }).filter(([threadId]) =>
        affectedItemKeys.has(`codex:thread:local:${threadId}`),
      ),
    );
    this.#affectedBefore = clampToScope(before, this.#scope);
    this.#affectedAfter = clampToScope(after, this.#scope);
    this.#beforeOrder = this.#scope.structure ? before.sections.map(({ id }) => id) : undefined;
    this.#afterOrder = this.#scope.structure ? after.sections.map(({ id }) => id) : undefined;
    this.#snapshot = snapshotFor(after, this.#scope);
  }

  static affectedState(stack: SectionUndoRedoStack) {
    return { affectedBefore: stack.#affectedBefore, affectedAfter: stack.#affectedAfter };
  }

  static initialTransition(stack: SectionUndoRedoStack) {
    return stack.#issueTransition();
  }

  static migrationTransition(source: SectionStateSource, hostId: string) {
    const current = source.read();
    return new SectionUndoRedoStack(source, current, current, undefined, hostId).#issueTransition();
  }

  async undo(operationId: string): Promise<UndoRedoResult> {
    return this.#enqueue(() => this.#source.enqueueWrite(() => this.#apply("undo", operationId)));
  }

  async redo(operationId: string): Promise<UndoRedoResult> {
    return this.#enqueue(() => this.#source.enqueueWrite(() => this.#apply("redo", operationId)));
  }

  [Symbol.dispose]() {
    this.#disposed = true;
    this.#generation = {};
  }

  #enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const chained = this.#mutationQueue.then(operation);
    this.#mutationQueue = chained.then(
      () => undefined,
      () => undefined,
    );
    this.#writeQueue = this.#mutationQueue;
    return chained;
  }

  #afterWrite<T>(operation: () => Promise<T>): Promise<T> {
    const chained = this.#writeQueue.then(operation);
    this.#mutationQueue = Promise.allSettled([this.#mutationQueue, chained]).then(() => undefined);
    return chained;
  }

  #isConsistent(): boolean {
    return (
      !this.#disposed &&
      this.#source.isSourceCurrent() &&
      (this.#moveCommand == null || deepEqual(applySectionCommand(this.#source.read(), this.#moveCommand), this.#source.read())) &&
      snapshotMatches(this.#source.read(), this.#snapshot)
    );
  }

  async #apply(direction: "undo" | "redo", operationId: string): Promise<UndoRedoResult> {
    if (this.#disposed || !this.#source.isSourceCurrent()) return { status: "unavailable" };
    if (this.#direction !== direction || !this.#isConsistent()) return (this[Symbol.dispose](), { status: "conflict" });
    const current = this.#source.read();
    const target = direction === "undo" ? this.#affectedBefore : this.#affectedAfter;
    const targetOrder = direction === "undo" ? this.#beforeOrder : this.#afterOrder;
    const next = applyScopeToState(current, target, this.#scope, targetOrder);
    this.#generation = {};
    this.#source.write(next, operationId);
    this.#snapshot = snapshotFor(this.#source.read(), this.#scope);
    this.#direction = direction === "undo" ? "redo" : "undo";
    return {
      status: "applied",
      affectedBefore: clampToScope(current, this.#scope),
      affectedAfter: clampToScope(next, this.#scope),
      transition: this.#issueTransition(this.#moveCommand == null ? diffSectionScope(current, next) : this.#scope),
    };
  }

  #issueTransition(scope: SectionScope = this.#scope): SectionTransition {
    const generation = this.#generation;
    return new SectionTransition(
      this.#source,
      (operation) => this.#afterWrite(operation),
      (operation) => this.#enqueue(operation),
      scope,
      this.#threadHostIds,
      this.#moveCommand?.itemKey,
      () => {
        if (generation !== this.#generation || !this.#isConsistent())
          throw new DOMException("Saved section transition retired", "AbortError");
      },
      async (sectionId, hostId, replicaId) => {
        if (generation !== this.#generation || !this.#isConsistent()) return "conflict";
        const current = this.#source.read();
        const section = current.sections.find(({ id }) => id === sectionId);
        if (section == null) return "conflict";
        this.#source.getConnection(hostId);
        if (section.hostSectionIds?.[hostId] === replicaId) return "unchanged";
        this.#source.write(
          {
            ...current,
            sections: current.sections.map((entry) =>
              entry === section ? { ...entry, hostSectionIds: { ...entry.hostSectionIds, [hostId]: replicaId } } : entry,
            ),
          },
          "",
        );
        for (const affected of [this.#affectedBefore, this.#affectedAfter])
          affected.sections = affected.sections.map((entry) =>
            entry.id === sectionId ? { ...entry, hostSectionIds: { ...entry.hostSectionIds, [hostId]: replicaId } } : entry,
          );
        for (const entry of this.#scope.sections) {
          entry.before = this.#affectedBefore.sections.find(({ id }) => id === entry.id);
          entry.after = this.#affectedAfter.sections.find(({ id }) => id === entry.id);
        }
        this.#snapshot = snapshotFor(this.#source.read(), this.#scope);
        return "applied";
      },
      this.#migrationHostId,
      async (hostId, operationId) => {
        if (generation !== this.#generation || !this.#isConsistent() || hostId !== this.#migrationHostId) return "conflict";
        const current = this.#source.read();
        this.#source.getConnection(hostId);
        if (current.appServerMigratedHostIds?.includes(hostId)) return "unchanged";
        this.#source.write(
          { ...current, appServerMigratedHostIds: [...(current.appServerMigratedHostIds ?? []), hostId] },
          operationId,
        );
        this.#generation = {};
        return "applied";
      },
    );
  }
}

// ---------------------------------------------------------------------------
// SectionReconciliation（原 `rBe`）
// ---------------------------------------------------------------------------

interface ReconciliationCommit {
  threadHostIds: Record<string, string>;
  boundThreadIds: Record<string, string>;
  operationId: string;
}

/** host 对账查询（原 `rBe`）：list/members 二选一 + commit。 */
export class SectionReconciliation extends (EventEmitterBase as new () => {}) {
  #source: SectionStateSource;
  #hostId: string;
  #sectionId: string | undefined;
  #isCurrent: () => boolean;
  #initialState: SavedSectionsState | undefined;
  #listing: { hostIds: string[]; sections: Array<{ hostId: string; id: string; name: string }> } | undefined;
  #memberThreadIds: string[] | undefined;
  #hasRead = false;
  #committed = false;

  constructor(
    source: SectionStateSource,
    hostId: string,
    sectionId: string | undefined,
    isCurrent: () => boolean,
  ) {
    super();
    this.#source = source;
    this.#hostId = hostId;
    this.#sectionId = sectionId;
    this.#isCurrent = isCurrent;
    this.#initialState = source.read();
  }

  async readList() {
    this.#assertFirstRead();
    if (this.#sectionId != null) throw new Error("Member query cannot read a section list");
    const listing = await this.#source.server.listSections({ hostId: this.#hostId }, this.#operationContext());
    this.#assertActive();
    this.#listing = listing;
    return listing;
  }

  async readMembers() {
    this.#assertFirstRead();
    if (this.#sectionId == null) throw new Error("List query cannot read section members");
    if (!this.#initialState?.sections.some((section) => section.hostSectionIds?.[this.#hostId] === this.#sectionId)) {
      this.#listing = await this.#source.server.listSections({ hostId: this.#hostId }, this.#operationContext());
      this.#assertActive();
    }
    const threadIds = await this.#source.server.listSectionThreadIds(
      { hostId: this.#hostId, sectionId: this.#sectionId },
      this.#operationContext(),
    );
    this.#assertActive();
    this.#memberThreadIds = threadIds;
    return threadIds;
  }

  /** 提交段列表（原 `commitList`）：新段成员拉取 → host 合并 → replica 写回。 */
  async commitList(commit: ReconciliationCommit): Promise<"applied" | "unchanged" | "conflict" | "unavailable"> {
    if (this.#initialState == null || this.#listing == null || this.#committed || !this.#source.isSourceCurrent())
      return "unavailable";
    this.#committed = true;
    const before = this.#initialState;
    const listing = this.#listing;
    const memberIdsBySectionId = new Map<string, string[]>();
    await Promise.all(
      listing.sections
        .filter(
          (section) =>
            section.hostId === this.#hostId &&
            !before.sections.some((entry) => entry.hostSectionIds?.[this.#hostId] === section.id),
        )
        .map(async (section) => {
          memberIdsBySectionId.set(
            section.id,
            await this.#source.server.listSectionThreadIds({ hostId: this.#hostId, sectionId: section.id }, this.#operationContext()),
          );
        }),
    );
    if (this.#initialState == null) return "unavailable";
    if (!this.#isCurrent()) return "conflict";
    let merged = reconcileHostSections(before, this.#hostId, listing as never, commit.threadHostIds, commit.boundThreadIds, randomUUID, memberIdsBySectionId);
    for (const [sectionId, memberIds] of memberIdsBySectionId)
      merged = reconcileSectionMembers(merged, this.#hostId, sectionId, memberIds, commit.threadHostIds, commit.boundThreadIds);
    return applyReplicaState(this.#source, before, merged, commit.operationId, this.#hostId);
  }

  /** 提交段成员（原 `commitMembers`）。 */
  async commitMembers(commit: ReconciliationCommit): Promise<"applied" | "unchanged" | "conflict" | "unavailable"> {
    if (this.#initialState == null || this.#memberThreadIds == null || this.#sectionId == null || this.#committed)
      return "unavailable";
    this.#committed = true;
    if (!this.#isCurrent()) return "conflict";
    const before = this.#initialState;
    const boundSection = before.sections.find((section) => section.hostSectionIds?.[this.#hostId] === this.#sectionId);
    if (
      (boundSection != null && this.#source.read().sections.find(({ id }) => id === boundSection.id) !== boundSection) ||
      (boundSection == null && this.#listing == null)
    )
      return "conflict";
    const withListing =
      this.#listing == null
        ? before
        : reconcileHostSections(
            before,
            this.#hostId,
            this.#listing as never,
            commit.threadHostIds,
            commit.boundThreadIds,
            randomUUID,
            new Map([[this.#sectionId, this.#memberThreadIds]]),
          );
    return applyReplicaState(
      this.#source,
      before,
      reconcileSectionMembers(withListing, this.#hostId, this.#sectionId, this.#memberThreadIds, commit.threadHostIds, commit.boundThreadIds),
      commit.operationId,
      this.#hostId,
    );
  }

  [Symbol.dispose]() {
    this.#initialState = undefined;
    this.#listing = undefined;
    this.#memberThreadIds = undefined;
  }

  #assertFirstRead() {
    this.#assertActive();
    if (this.#hasRead) throw new Error("Saved section query was already read");
    this.#hasRead = true;
  }

  #assertActive() {
    if (this.#initialState == null || !this.#source.isSourceCurrent())
      throw new DOMException("Saved section query retired", "AbortError");
    this.#source.getConnection(this.#hostId);
  }

  #operationContext(): SectionOperationContext {
    return {
      getConnection: (hostId) => {
        if (hostId !== this.#hostId) throw new Error("Host is outside this query");
        return this.#source.getConnection(hostId);
      },
      assertCurrent: () => this.#assertActive(),
      assertSourceCurrent: () => this.#assertActive(),
      canDeleteCreatedReplica: () => false,
    };
  }
}

// ---------------------------------------------------------------------------
// SavedCustomSectionsManager（原 `iBe`）
// ---------------------------------------------------------------------------

const savedSectionsLogger = memoizedTaggedLogger("saved-custom-sections");

/** persisted-atom 里的分区键（原 `Hb`）。 */
const SAVED_SECTIONS_KEY = "sidebar-custom-sections-v3";

const savedSectionsValueSchema = recordSchema(stringSchema(), jsonSchema());

const savedSectionsStateSchema = objectSchema({
  sections: arraySchema(
    objectSchema({
      id: stringSchema(),
      name: stringSchema(),
      itemKeys: arraySchema(stringSchema()),
    }),
  ),
  collapsedSectionIds: arraySchema(stringSchema()),
  sectionOrder: arraySchema(stringSchema()),
});

interface WindowBroadcaster {
  sendMessageToAllRegisteredWindows(message: unknown): void;
}

interface IdentityContext {
  isCurrent(): boolean;
  context: { identity: { kind: string; accountId?: string } };
}

/** 分区管理器（原 `iBe`）。 */
export class SavedCustomSectionsManager extends (EventEmitterBase as new () => {}) {
  #globalState: GlobalStateLikeForSections;
  #registry: HostRegistryLike;
  #windows: WindowBroadcaster;
  #identityProvider?: IdentityProvider;
  #server: ThreadSectionServer;
  #onServerChanged: SectionStateSource["onServerChanged"];
  #creationReservations = new WeakMap<object, Map<string, Map<string, object>>>();
  #operationQueue = Promise.resolve();
  #reconciliationGeneration: Record<string, never> = {};

  constructor(
    globalState: GlobalStateLikeForSections,
    registry: HostRegistryLike,
    windows: WindowBroadcaster,
    identityProvider: IdentityProvider,
    server: ThreadSectionServer,
    onServerChanged: SectionStateSource["onServerChanged"],
  ) {
    super();
    this.#globalState = globalState;
    this.#registry = registry;
    this.#windows = windows;
    this.#identityProvider = identityProvider;
    this.#server = server;
    this.#onServerChanged = onServerChanged;
  }

  /** 应用分区命令（原 `applySavedCustomSectionCommand`）。 */
  applySavedCustomSectionCommand(request: {
    accountId: string | null;
    command: { type: string; itemKey?: string; sectionId?: string } & Record<string, unknown>;
    operationId?: string;
  }) {
    const sourcePromise = this.#createSource(request.accountId);
    return this.#enqueue(async () => {
      const source = await sourcePromise;
      if (source == null || !source.isSourceCurrent()) return { status: "unavailable" };
      const current = this.#readState(request.accountId);
      if (current == null) return { status: "unavailable" };
      const command = request.command as never as Parameters<typeof applySectionCommand>[1];
      const next = applySectionCommand(current, command);
      const unchanged = deepEqual(current, next);
      const removalCommand =
        unchanged &&
        "itemKey" in command &&
        (command as { itemKey?: string }).itemKey!.startsWith("codex:thread:local:") &&
        !(isValidThreadId as (value: string) => boolean)((command as { itemKey: string }).itemKey.slice(19)) &&
        ((command as { type: string }).type === "remove" ||
          ((command as { type: string }).type === "move" &&
            next.sections.some((section) => section.id === (command as { sectionId: string }).sectionId && section.itemKeys.includes((command as { itemKey: string }).itemKey))))
          ? (command as { type: "remove" | "move"; itemKey: string; sectionId?: string })
          : undefined;
      if (unchanged && (this.#invalidateReconciliations(request.operationId), removalCommand == null))
        return { status: "unchanged" };
      if (removalCommand != null) this.#reconciliationGeneration = {};
      const stack = new SectionUndoRedoStack(
        source,
        current,
        unchanged ? current : this.#writeState(request.accountId, next, request.operationId),
        removalCommand as MoveSectionCommand | undefined,
        undefined,
      );
      return {
        status: "applied",
        ...SectionUndoRedoStack.affectedState(stack),
        receipt: stack,
        transition: SectionUndoRedoStack.initialTransition(stack),
      };
    });
  }

  /** 开始对账（原 `beginSavedCustomSectionReconciliation`）。 */
  beginSavedCustomSectionReconciliation(request: { accountId: string | null; hostId: string; sectionId?: string }) {
    const sourcePromise = this.#createSource(request.accountId);
    const chained = this.#operationQueue.then(async () => {
      const source = await sourcePromise;
      if (source == null || !source.isSourceCurrent()) return { status: "unavailable" };
      const generation = this.#reconciliationGeneration;
      return {
        status: "ready",
        reconciliation: new SectionReconciliation(source, request.hostId, request.sectionId, () => generation === this.#reconciliationGeneration),
      };
    });
    this.#operationQueue = chained.then(
      () => undefined,
      () => undefined,
    );
    return chained;
  }

  /** 开始迁移（原 `beginSavedCustomSectionMigration`）。 */
  beginSavedCustomSectionMigration(request: { accountId: string | null; hostId: string }) {
    const sourcePromise = this.#createSource(request.accountId);
    return this.#enqueue(async () => {
      const source = await sourcePromise;
      if (source == null || !source.isSourceCurrent()) return { status: "unavailable" };
      const current = source.read();
      if (current.appServerMigratedHostIds?.includes(request.hostId)) return { status: "unavailable" };
      if (!current.appServerLegacySectionIds)
        source.write({ ...current, appServerLegacySectionIds: current.sections.map(({ id }) => id) }, "");
      return {
        status: "ready",
        state: source.read(),
        transition: SectionUndoRedoStack.migrationTransition(source, request.hostId),
      };
    });
  }

  /** 导入 legacy 分区（原 `importLegacySavedCustomSections`）。 */
  importLegacySavedCustomSections(imported: Record<string, unknown>) {
    const sourcePromise = this.#createSource(undefined);
    return this.#enqueue(async () => {
      const source = await sourcePromise;
      if (source == null || !source.isSourceCurrent()) return "unavailable";
      const parsed = (savedSectionsValueSchema as unknown as {
        safeParse(input: unknown): { success: boolean; data?: Record<string, unknown> };
      }).safeParse((this.#globalState.get("electron-persisted-atom-state") as Record<string, unknown> | undefined)?.[SAVED_SECTIONS_KEY] ?? {});
      if (!parsed.success) return "unavailable";
      if (Object.hasOwn(parsed.data!, source.accountId)) return "unchanged";
      const state = (savedSectionsStateSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: SavedSectionsState } }).safeParse(imported[source.accountId]);
      return state.success ? (source.write(state.data as SavedSectionsState, ""), "applied") : "unchanged";
    });
  }

  #enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const chained = this.#operationQueue.then(operation);
    this.#operationQueue = chained.then(
      () => undefined,
      () => undefined,
    );
    return chained;
  }

  /** 状态源装配（原 `#u`）：principal + 连接绑定 + 预留账本。 */
  async #createStateSource(accountId: string | null): Promise<SectionStateSource | null> {
    const identity = await this.#identityProvider?.captureContext("local");
    const connections = new Map(
      this.#registry.getAllHostIds().flatMap((hostId) => {
        const connection = this.#registry.getMaybeConnection(hostId);
        return connection == null ? [] : [[hostId, { connection, assertCurrent: connection.captureRequestLifetime() }] as const];
      }),
    );
    if (identity == null || !identity.isCurrent() || identity.context.identity.kind !== "chatgpt") return null;
    const resolvedAccountId = identity.context.identity.accountId as string;
    if ((accountId != null && accountId !== resolvedAccountId) || this.#readState(resolvedAccountId) == null) return null;
    const emptyState: SavedSectionsState = { sections: [], collapsedSectionIds: [], sectionOrder: [] };
    const touchedHosts = new Set<string>();
    const getConnection = (hostId: string) => {
      const entry = connections.get(hostId);
      if (entry == null || this.#registry.getMaybeConnection(hostId) !== entry.connection)
        throw new DOMException("Section source connection retired", "AbortError");
      connections.get("local")?.assertCurrent();
      entry.assertCurrent();
      touchedHosts.add(hostId);
      return entry.connection;
    };
    return {
      enqueueWrite: (operation) => this.#enqueue(operation),
      accountId: resolvedAccountId,
      read: () => {
        const state = this.#readState(resolvedAccountId, emptyState);
        if (state == null) throw new Error("Saved sections are unavailable");
        return state;
      },
      write: (state, operationId) => this.#writeState(resolvedAccountId, state, operationId),
      isSourceCurrent: () => {
        try {
          connections.get("local")?.assertCurrent();
          for (const hostId of touchedHosts) getConnection(hostId);
          return (
            identity.isCurrent() &&
            this.#registry.getMaybeConnection("local") === (connections.get("local")?.connection ?? null) &&
            this.#readState(resolvedAccountId) != null
          );
        } catch {
          return false;
        }
      },
      getConnection,
      reserveCreation: (hostId, logicalSectionId) => {
        const connection = getConnection(hostId);
        const byAccount = this.#creationReservations.get(connection) ?? new Map();
        const bySection = byAccount.get(resolvedAccountId) ?? new Map();
        if (bySection.has(logicalSectionId)) return null;
        const reservation = {};
        bySection.set(logicalSectionId, reservation);
        byAccount.set(resolvedAccountId, bySection);
        this.#creationReservations.set(connection, byAccount);
        return () => {
          if (bySection.get(logicalSectionId) === reservation) {
            bySection.delete(logicalSectionId);
            if (bySection.size === 0) byAccount.delete(resolvedAccountId);
            if (byAccount.size === 0) this.#creationReservations.delete(connection);
          }
        };
      },
      server: this.#server,
      onServerChanged: (hostId, refresh, context) => (
        (this.#reconciliationGeneration = {}),
        this.#onServerChanged(
          hostId,
          () => {
            refresh();
            getConnection(hostId);
          },
          context,
        )
      ),
    };
  }

  async #createSource(accountId: string | null): Promise<SectionStateSource | null> {
    return this.#createStateSource(accountId);
  }

  /** persisted-atom 读（原 `#d`）：损坏返回 null。 */
  #readState(accountId: string | null, fallback?: SavedSectionsState): SavedSectionsState | null {
    const stored = (this.#globalState.get("electron-persisted-atom-state") as Record<string, unknown> | undefined)?.[SAVED_SECTIONS_KEY];
    if (stored == null) return fallback ?? { sections: [], collapsedSectionIds: [], sectionOrder: [] };
    const parsed = (savedSectionsValueSchema as unknown as {
      safeParse(input: unknown): { success: boolean; data?: Record<string, unknown> };
    }).safeParse(stored);
    if (!parsed.success) return null;
    const state = parsed.data![accountId as string];
    return state == null
      ? (fallback ?? { sections: [], collapsedSectionIds: [], sectionOrder: [] })
      : (savedSectionsStateSchema as unknown as { safeParse(input: unknown): { success: boolean } }).safeParse(state).success
        ? (state as SavedSectionsState)
        : null;
  }

  /** persisted-atom 写（原 `#f`）：保留原引用 + 窗口广播。 */
  #writeState(accountId: string, state: SavedSectionsState, operationId?: string): SavedSectionsState {
    const persisted = (this.#globalState.get("electron-persisted-atom-state") ?? {}) as Record<string, unknown>;
    const allStates = (savedSectionsValueSchema as unknown as { parse(input: unknown): Record<string, unknown> }).parse(persisted[SAVED_SECTIONS_KEY] ?? {});
    const previous = this.#readState(accountId);
    const normalized = normalizeStateForWrite(state);
    const sections = normalized.sections.map((section) => {
      const previousSection = previous?.sections.find(({ id }) => id === section.id);
      return previousSection != null && deepEqual({ ...previousSection, hostSectionIds: undefined, pendingDeletionHostIdsByItemKey: undefined }, section)
        ? previousSection
        : section;
    });
    const merged: SavedSectionsState = {
      ...normalized,
      sections:
        previous != null && sections.length === previous.sections.length && sections.every((section, index) => section === previous.sections[index])
          ? previous.sections
          : sections,
      collapsedSectionIds: previous != null && deepEqual(previous.collapsedSectionIds, state.collapsedSectionIds) ? previous.collapsedSectionIds : state.collapsedSectionIds,
      sectionOrder: previous != null && deepEqual(previous.sectionOrder, state.sectionOrder) ? previous.sectionOrder : state.sectionOrder,
      appServerLegacySectionIds: deepEqual(previous?.appServerLegacySectionIds, state.appServerLegacySectionIds)
        ? previous?.appServerLegacySectionIds
        : state.appServerLegacySectionIds,
      appServerMigratedHostIds: deepEqual(previous?.appServerMigratedHostIds, state.appServerMigratedHostIds)
        ? previous?.appServerMigratedHostIds
        : state.appServerMigratedHostIds,
    };
    this.#globalState.set("electron-persisted-atom-state", { ...persisted, [SAVED_SECTIONS_KEY]: { ...allStates, [accountId]: merged } });
    this.#broadcast(operationId);
    return merged;
  }

  #broadcast(operationId?: string) {
    this.#windows.sendMessageToAllRegisteredWindows({
      type: "persisted-atom-updated",
      key: SAVED_SECTIONS_KEY,
      value: (this.#globalState.get("electron-persisted-atom-state") as Record<string, unknown> | undefined)?.[SAVED_SECTIONS_KEY],
      savedCustomSectionOperationId: operationId || undefined,
    });
  }

  #invalidateReconciliations(_operationId?: string) {
    this.#reconciliationGeneration = {};
  }
}

/** 写入前的形状规整（原 `Wb`：剥 hostSectionIds/pendingDeletion）。 */
function normalizeStateForWrite(state: SavedSectionsState): SavedSectionsState {
  return {
    ...state,
    sections: state.sections.map((section) => ({
      id: section.id,
      name: section.name,
      itemKeys: [...section.itemKeys],
    })),
  };
}

// ---------------------------------------------------------------------------
// PinnedThreadsService（原 `jH`）
// ---------------------------------------------------------------------------

/** 置顶线程服务（原 `jH`）。 */
export class PinnedThreadsService extends (EventEmitterBase as new () => {}) {
  #globalState: GlobalStateLikeForSections;
  #registry: HostRegistryLike;
  #windows: WindowBroadcaster;
  #server: ThreadSectionServer;
  savedCustomSections: SavedCustomSectionsManager;
  #sectionUpdateInFlight = new Map<string, Promise<void>>();
  #useAppServerPins: boolean | null = null;

  constructor(
    globalState: GlobalStateLikeForSections,
    registry: HostRegistryLike,
    windows: WindowBroadcaster,
    identityProvider: IdentityProvider,
  ) {
    super();
    this.#globalState = globalState;
    this.#registry = registry;
    this.#windows = windows;
    this.#server = new ThreadSectionServer(globalState, registry as never, {} as never);
    this.savedCustomSections = new SavedCustomSectionsManager(globalState, registry as never, windows, identityProvider, this.#server, async (hostId, refresh, context) => {
      refresh();
      if (context != null) {
        const isPinnedSection = context.sectionId === PINNED_SECTION_UUID;
        const changed =
          isPinnedSection && context.beforeThreadId !== undefined
            ? this.#writePinnedOrder(
                reorderPinnedIds({
                  threadIds: readPinnedThreadIds(this.#globalState),
                  threadId: context.threadId,
                  beforeThreadId: context.beforeThreadId,
                }),
              )
            : this.#writePinnedToggle(context.threadId, isPinnedSection);
        if (changed) await this.#globalState.flush();
        refresh();
        this.#broadcastPinned(
          hostId,
          [context.sectionId, context.previousSectionId].filter(
            (sectionId) => sectionId != null && sectionId !== PINNED_SECTION_UUID,
          ),
        );
      } else {
        this.#broadcastPinned(hostId);
      }
    });
  }

  /** 列表（原 `list`）：app-server pins 或 legacy globalState。 */
  async list(options?: { useAppServerPins?: boolean; cloudThreadIds?: string[]; hostId?: string }) {
    const useAppServerPins = options?.useAppServerPins === true;
    this.#useAppServerPins = useAppServerPins;
    if (!useAppServerPins) return { threadIds: readPinnedThreadIds(this.#globalState) };
    const { threadIds, serverOrderedThreadIds } = await this.#server.listPinnedThreads({
      cloudThreadIds: options?.cloudThreadIds,
      hostId: options?.hostId,
    });
    const cloudIds = new Set(options?.cloudThreadIds);
    const serverIds = new Set(threadIds);
    return {
      threadIds: [...threadIds, ...readPinnedThreadIds(this.#globalState).filter((threadId) => cloudIds.has(threadId) && !serverIds.has(threadId))],
      serverOrderedThreadIds,
    };
  }

  /** 置顶/取消（原 `set`）。 */
  async set({ threadId, pinned, beforeThreadId, useAppServerPins, hostId }: { threadId: string; pinned: boolean; beforeThreadId?: string; useAppServerPins?: boolean; hostId?: string }) {
    if (useAppServerPins) {
      this.#useAppServerPins = true;
      const changedSectionIds: string[] = [];
      let changedHostId = hostId;
      const changed = await this.#server.setThreadPinned({
        beforeThreadId: beforeThreadId ?? null,
        threadId,
        pinned,
        hostId,
        onThreadSectionChange: (sectionId, sectionHostId) => {
          changedHostId = sectionHostId;
          if (sectionId != null && sectionId !== PINNED_SECTION_UUID) changedSectionIds.push(sectionId);
        },
      });
      if (changed != null) {
        const localChanged =
          pinned && beforeThreadId !== undefined
            ? this.#writePinnedOrder(
                reorderPinnedIds({
                  threadIds: readPinnedThreadIds(this.#globalState),
                  threadId,
                  beforeThreadId,
                }),
              )
            : this.#writePinnedToggle(threadId, pinned);
        if (localChanged) await this.#globalState.flush();
        this.#broadcastPinned(changed ? (changedHostId ?? null) : undefined, changed ? changedSectionIds : undefined);
        return { success: changed };
      }
      if (!(await this.#server.isLegacyThread({ threadId, hostId })))
        throw new Error("App server does not support pinning this thread");
    }
    const localChanged =
      pinned && beforeThreadId !== undefined
        ? this.#writePinnedOrder(
            reorderPinnedIds({
              threadIds: readPinnedThreadIds(this.#globalState),
              threadId,
              beforeThreadId,
            }),
          )
        : this.#writePinnedToggle(threadId, pinned);
    this.#broadcastPinned();
    await this.#globalState.flush();
    return { success: localChanged };
  }

  /** 排序（原 `setOrder`）。 */
  async setOrder({
    threadIds,
    useAppServerPins,
    movedThreadId,
    beforeThreadId,
    hostId,
  }: {
    threadIds: string[];
    useAppServerPins?: boolean;
    movedThreadId?: string;
    beforeThreadId?: string;
    hostId?: string;
  }) {
    let serverMoved = false;
    if (useAppServerPins) {
      this.#useAppServerPins = true;
      if (movedThreadId != null) {
        const moved = await this.#server.movePinnedThread({
          threadId: movedThreadId,
          beforeThreadId: beforeThreadId ?? null,
          hostId,
        });
        if (moved != null) {
          if (!moved) return (this.#broadcastPinned(), { success: false });
          serverMoved = true;
        } else if (!(await this.#server.isLegacyThread({ threadId: movedThreadId, hostId })))
          throw new Error("App server does not support reordering this thread");
      } else {
        serverMoved = true;
      }
    }
    const serverPinnedIds = serverMoved ? new Set(readPinnedThreadIds(this.#globalState)) : null;
    const localChanged = this.#writePinnedOrder(serverPinnedIds == null ? threadIds : threadIds.filter((threadId) => serverPinnedIds.has(threadId)));
    this.#broadcastPinned();
    if (localChanged || !serverMoved) await this.#globalState.flush();
    return { success: serverMoved || localChanged };
  }

  async listSections(options: { hostId?: string }) {
    return this.#server.listSections(options);
  }

  async listSectionThreadIds(request: { hostId: string; sectionId: string }) {
    return this.#server.listSectionThreadIds(request);
  }

  /** 建段（原 `createSection`）：pinned 段时同步 legacy 列表。 */
  async createSection(request: { hostId: string; logicalSectionId: string; name: string; threadIdToMove: string | null; previousSectionId: string | null }) {
    const section = await this.#server.createSection(request);
    if (request.threadIdToMove != null && this.#writePinnedToggle(request.threadIdToMove, false))
      await this.#globalState.flush();
    if (request.threadIdToMove != null)
      this.#broadcastPinned(
        request.hostId,
        [section.id, request.previousSectionId].filter((sectionId) => sectionId != null && sectionId !== PINNED_SECTION_UUID),
      );
    this.#broadcastPinned(request.hostId);
    return section;
  }

  /** 改名去重（原 `updateSection`）：同名请求合并。 */
  async updateSection(request: { hostId: string; sectionId: string; name: string }) {
    const key = `${request.hostId}\0${request.sectionId}\0${request.name}`;
    const inFlight = this.#sectionUpdateInFlight.get(key);
    if (inFlight != null) return inFlight;
    const update = this.#server.updateSection(request).then(() => {
      this.#broadcastPinned(request.hostId);
    });
    this.#sectionUpdateInFlight.set(key, update);
    try {
      await update;
    } finally {
      if (this.#sectionUpdateInFlight.get(key) === update) this.#sectionUpdateInFlight.delete(key);
    }
  }

  async deleteSection(request: { hostId: string; sectionId: string }) {
    await this.#server.deleteSection(request);
    this.#broadcastPinned(request.hostId);
  }

  /** 线程入段（原 `setThreadSection`）：pinned 段即置顶。 */
  async setThreadSection(request: { hostId: string; threadId: string; sectionId: string | null; beforeThreadId?: string | null; previousSectionId?: string }) {
    const changed = await this.#server.setThreadSection({ ...request, beforeThreadId: request.beforeThreadId ?? null });
    if (changed) {
      if (this.#writePinnedToggle(request.threadId, request.sectionId === PINNED_SECTION_UUID))
        await this.#globalState.flush();
      this.#broadcastPinned(
        request.hostId,
        [request.sectionId, request.previousSectionId].filter((sectionId) => sectionId != null && sectionId !== PINNED_SECTION_UUID),
      );
    }
    return { success: changed };
  }

  /** worktree 清理保护（原 `getPinnedThreadIdsForWorktreeCleanup`）。 */
  static async getPinnedThreadIdsForWorktreeCleanup(service: PinnedThreadsService, hostId: string): Promise<string[]> {
    if (service.#useAppServerPins == null)
      throw new Error("Pinned thread source has not been initialized");
    if (!service.#useAppServerPins) return readPinnedThreadIds(service.#globalState);
    if (service.#registry.getMaybeConnection(hostId)?.getConnectionState() !== "connected")
      throw new Error("App server unavailable for pinned worktree protection");
    return service.#server.listPinnedThreadIds({ hostId });
  }

  #broadcastPinned(customSectionHostId?: string, customSectionIds?: string[]) {
    this.#windows.sendMessageToAllRegisteredWindows(
      customSectionHostId === undefined
        ? { type: "pinned-threads-updated" }
        : { type: "pinned-threads-updated", customSectionHostId, customSectionIds },
    );
  }

  #writePinnedToggle(threadId: string, pinned: boolean): boolean {
    const current = readPinnedThreadIds(this.#globalState);
    return this.#writePinnedOrder(pinned ? [...current.filter((id) => id !== threadId), threadId] : current.filter((id) => id !== threadId));
  }

  #writePinnedOrder(threadIds: string[]): boolean {
    const current = (this.#globalState.get(STATE_KEYS.PINNED_THREAD_IDS) ?? []) as string[];
    const next = [...new Set(threadIds)];
    return current.length === next.length && current.every((id, index) => id === next[index])
      ? false
      : (this.#globalState.set(STATE_KEYS.PINNED_THREAD_IDS, next), true);
  }
}

/** 置顶列表重排（原 `_t`）。 */
function reorderPinnedIds({ threadIds, threadId, beforeThreadId }: { threadIds: string[]; threadId: string; beforeThreadId: string }): string[] {
  const without = threadIds.filter((id) => id !== threadId);
  const insertAt = beforeThreadId == null ? without.length : Math.max(0, without.indexOf(beforeThreadId));
  const next = [...without];
  next.splice(insertAt, 0, threadId);
  return next;
}
