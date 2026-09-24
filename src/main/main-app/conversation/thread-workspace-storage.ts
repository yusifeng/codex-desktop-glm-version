// projectless 会话登记 + 线程 workspace 存储（原版 53,788-54,071 区段）。
//
// ProjectlessConversations（owe）：projectless 会话 id/输出目录/workspace
// 根提示的内存 + globalState 双层登记——load 合并读取、save/remove 串行
// 链（pendingConversationIdSave/pendingThreadPathHintSaves），storage 带
// updateProjectlessThread 时走新接口，否则回退 globalState 键
// （projectless-thread-ids / thread-projectless-output-directories /
// thread-workspace-root-hints）。
//
// ThreadWorkspaceStorage（swe）：thread workspace state（v1 键）、project
// assignment、可写根（thread-writable-roots）的读写门面。
//
// 原压缩名对照：tw→pathHintsSchema、owe→ProjectlessConversations、nw→
// resolveParentThreadId、swe→ThreadWorkspaceStorage、Lt→
// threadWorkspaceStateKey（765 行 R1 杂项带）、Ex→parseWritableRootsState、
// Dx→hasMissingRoots、Vye→withMergedWritableRoots（43,443-43,455 R3
// operations 带）。

import {
  $u as normalizeThreadId,
  Ef as zRecord,
  Of as zString,
  hf as zArray,
  ca as parseThreadProjectAssignments,
  vl as isValidPath,
} from "@chunk/shared";
// nx（42,208 Documents/Codex projectless 根提取）——R3 workspace/config。
import { extractProjectlessRoot } from "../workspace/config";
// H_（33,031 thread source 解析）——R3 threads/projection。
import { H_ as parseThreadSource } from "../threads/projection";
// Ex/Dx/Vye（43,443-43,455 可写根状态解析/缺根判定/合并）——R3
// threads/operations（导出名以 R3 侧落地为准，缺导出已记录）。
import {
  Ex as parseWritableRootsState,
  Dx as hasMissingRoots,
  Vye as withMergedWritableRoots,
} from "../threads/operations";
import { parseThreadWorkspaceState, applyWorkspaceRevision } from "./workspace-resolution";

/** 路径提示表 schema：record(threadId, path)。 */
const pathHintsSchema = zRecord(zString(), zString());

/** thread workspace state 的 globalState 键（原 Lt，765 行 R1 杂项带）。 */
function threadWorkspaceStateKey(conversationId: string) {
  return `thread-workspace-state-v1:${conversationId}`;
}

// ---------------------------------------------------------------------------
// ProjectlessConversations（owe）
// ---------------------------------------------------------------------------

/** ProjectlessConversations 依赖注入面。 */
export interface ProjectlessConversationsParams {
  hostId: string;
  storage: any;
  threadProjectAssignments: any;
  getConversation: (conversationId: string) => any;
  logger: any;
  getWorkspaceKindOverride: ((conversationId: string) => string | null | undefined) | undefined;
}

/**
 * projectless 会话登记（原 owe）。
 * 写路径全部串行化：会话 id 一条链（pendingConversationIdSave），两类
 * 路径提示各一条链（pendingThreadPathHintSaves）。
 */
export class ProjectlessConversations {
  hostId: string;
  storage: any;
  threadProjectAssignments: any;
  getConversation: (conversationId: string) => any;
  logger: any;
  getWorkspaceKindOverride: ((conversationId: string) => string | null | undefined) | undefined;
  conversationIds = new Set<string>();
  outputDirectoryHints = new Map<string, string>();
  pendingConversationIdSave: Promise<unknown> = Promise.resolve();
  removedConversationIds = new Set<string>();
  pendingThreadPathHintSaves = new Map<string, Promise<unknown>>();
  workspaceRootHints = new Map<string, string>();
  hasFetchedConversationIds = false;

  constructor(params: ProjectlessConversationsParams) {
    this.hostId = params.hostId;
    this.storage = params.storage;
    this.threadProjectAssignments = params.threadProjectAssignments;
    this.getConversation = params.getConversation;
    this.logger = params.logger;
    this.getWorkspaceKindOverride = params.getWorkspaceKindOverride;
  }

  /** 装载登记（force 时覆盖内存，否则合并）。 */
  async load(force = false) {
    if (this.hasFetchedConversationIds && !force) return true;
    let conversationIdsPromise = this.loadConversationIds();
    let hintsPromise = Promise.all([
      this.loadThreadPathHints(`thread-projectless-output-directories`),
      this.loadThreadPathHints(`thread-workspace-root-hints`),
    ]);
    let loaded = await conversationIdsPromise;
    if (loaded == null) return false;
    let [outputDirectoryHints, workspaceRootHints] = await hintsPromise;
    this.conversationIds = force ? loaded : new Set([...loaded, ...this.conversationIds]);
    outputDirectoryHints != null &&
      (this.outputDirectoryHints = force ? outputDirectoryHints : new Map([...outputDirectoryHints, ...this.outputDirectoryHints]));
    workspaceRootHints != null &&
      (this.workspaceRootHints = force ? workspaceRootHints : new Map([...workspaceRootHints, ...this.workspaceRootHints]));
    for (let removed of this.removedConversationIds) {
      this.conversationIds.delete(removed);
      this.outputDirectoryHints.delete(removed);
      this.workspaceRootHints.delete(removed);
    }
    this.hasFetchedConversationIds = true;
    return true;
  }

  /** 会话是否 projectless（override 优先，未装载时强制拉取）。 */
  async hasConversationId(conversationId: string) {
    let override = this.getWorkspaceKindOverride?.(conversationId);
    return override == null
      ? (await this.load(true))
        ? this.conversationIds.has(conversationId)
        : false
      : override === `projectless`;
  }

  /** 线程的 workspace kind：override → 登记 → cwd 在 Documents/Codex 下 → 父链。 */
  getThreadWorkspaceKind(threadId: string, thread: any) {
    let override = this.getWorkspaceKindOverride?.(threadId);
    if (override != null) return override;
    if (this.conversationIds.has(threadId) || (this.hostId === `local` && extractProjectlessRoot(thread.cwd) != null))
      return `projectless`;
    let parentThreadId = resolveParentThreadId(thread);
    return parentThreadId == null
      ? `project`
      : this.conversationIds.has(parentThreadId)
        ? `projectless`
        : (this.getConversation(parentThreadId)?.workspaceKind ?? `project`);
  }

  /** 线程的 workspace browser root：hint → cwd 的 projectless 根 → 父链。 */
  getThreadWorkspaceBrowserRoot(thread: any) {
    let conversationId = normalizeThreadId(thread.id);
    let override = this.getWorkspaceKindOverride?.(conversationId);
    if (override === `projectless` || (override == null && this.conversationIds.has(conversationId))) {
      let hint = this.workspaceRootHints.get(conversationId);
      if (hint != null) return hint;
    }
    if (this.hostId === `local`) {
      let projectlessRoot = extractProjectlessRoot(thread.cwd);
      if (projectlessRoot != null) return projectlessRoot;
    }
    let parentThreadId = resolveParentThreadId(thread);
    if (parentThreadId == null) return null;
    let parentConversation = this.getConversation(parentThreadId);
    return parentConversation == null
      ? this.conversationIds.has(parentThreadId)
        ? (this.workspaceRootHints.get(parentThreadId) ?? null)
        : null
      : (parentConversation.workspaceBrowserRoot ?? null);
  }

  /** 会话的 projectless 输出目录：hint → 父链。 */
  getThreadProjectlessOutputDirectory(conversationId: string, thread: any) {
    let hint = this.outputDirectoryHints.get(conversationId);
    if (hint != null) return hint;
    let parentThreadId = resolveParentThreadId(thread);
    if (parentThreadId == null) return null;
    let parentConversation = this.getConversation(parentThreadId);
    return parentConversation == null
      ? this.conversationIds.has(parentThreadId)
        ? (this.outputDirectoryHints.get(parentThreadId) ?? null)
        : null
      : (parentConversation.projectlessOutputDirectory ?? null);
  }

  /** 登记会话为 projectless（已登记且已装载时跳过落盘）。 */
  async saveConversationId(conversationId: string) {
    if (this.removedConversationIds.has(conversationId)) return;
    let alreadyKnown = this.conversationIds.has(conversationId);
    this.conversationIds.add(conversationId);
    if (alreadyKnown && this.hasFetchedConversationIds) return;
    let save = this.pendingConversationIdSave
      .catch(() => void 0)
      .then(async () => {
        if (!this.removedConversationIds.has(conversationId)) {
          if (this.storage.updateProjectlessThread != null) {
            await this.storage.updateProjectlessThread({ threadId: conversationId, projectless: true });
            return;
          }
          await this.threadProjectAssignments.setProjectless({ threadId: conversationId, projectless: true });
        }
      });
    this.pendingConversationIdSave = save;
    await save;
  }

  /** 仅移除内存登记（不落盘）。 */
  removeConversationId(conversationId: string) {
    this.conversationIds.delete(conversationId);
  }

  /** 删除会话：内存 + 持久化（新接口单写 / 旧接口三链）。 */
  async removeConversation(conversationId: string) {
    this.removedConversationIds.add(conversationId);
    this.conversationIds.delete(conversationId);
    this.outputDirectoryHints.delete(conversationId);
    this.workspaceRootHints.delete(conversationId);
    let pendingHintSaves = [...this.pendingThreadPathHintSaves.values()];
    let updateProjectlessThread = this.storage.updateProjectlessThread;
    if (updateProjectlessThread != null) {
      let save = Promise.all([
        this.pendingConversationIdSave.catch(() => void 0),
        ...pendingHintSaves.map((save) => save.catch(() => void 0)),
      ]).then(() =>
        updateProjectlessThread({ threadId: conversationId, projectless: false, outputDirectory: null }),
      );
      this.pendingConversationIdSave = save;
      this.pendingThreadPathHintSaves.set(`thread-projectless-output-directories`, save);
      this.pendingThreadPathHintSaves.set(`thread-workspace-root-hints`, save);
      await save;
      return;
    }
    let idSave = this.pendingConversationIdSave
      .catch(() => void 0)
      .then(async () => {
        await this.threadProjectAssignments.setProjectless({ threadId: conversationId, projectless: false });
      });
    this.pendingConversationIdSave = idSave;
    let hintSaves = [`thread-projectless-output-directories`, `thread-workspace-root-hints`].map((key) => {
      let save = (this.pendingThreadPathHintSaves.get(key) ?? Promise.resolve())
        .catch(() => void 0)
        .then(() => this.removeThreadPathHint(key, conversationId));
      this.pendingThreadPathHintSaves.set(key, save);
      return save;
    });
    await Promise.all([idSave, ...hintSaves]);
    this.conversationIds.delete(conversationId);
    this.outputDirectoryHints.delete(conversationId);
    this.workspaceRootHints.delete(conversationId);
  }

  /** 保存 workspace 根提示（null 或已删除的会话跳过）。 */
  async saveWorkspaceRootHint(conversationId: string, workspaceRoot: string | null) {
    if (workspaceRoot == null || this.removedConversationIds.has(conversationId)) return;
    this.workspaceRootHints.set(conversationId, workspaceRoot);
    await this.saveThreadPathHint(`thread-workspace-root-hints`, conversationId, workspaceRoot);
  }

  /** 保存输出目录提示（null 或已删除的会话跳过）。 */
  async saveOutputDirectoryHint(conversationId: string, outputDirectory: string | null) {
    if (outputDirectory == null || this.removedConversationIds.has(conversationId)) return;
    this.outputDirectoryHints.set(conversationId, outputDirectory);
    await this.saveThreadPathHint(`thread-projectless-output-directories`, conversationId, outputDirectory);
  }

  /** 保存路径提示（串行链 + 新旧接口分流；失败仅记日志）。 */
  async saveThreadPathHint(key: string, conversationId: string, value: string) {
    let save = (this.pendingThreadPathHintSaves.get(key) ?? Promise.resolve())
      .catch(() => void 0)
      .then(async () => {
        if (!this.removedConversationIds.has(conversationId)) {
          if (this.storage.updateProjectlessThread != null) {
            await this.storage.updateProjectlessThread(
              key === `thread-projectless-output-directories`
                ? { threadId: conversationId, outputDirectory: value }
                : { threadId: conversationId, workspaceRoot: value },
            );
            return;
          }
          await this.storage.updateGlobalState(key, (state: unknown) => {
            let parsed = pathHintsSchema.safeParse(state).data ?? {};
            return parsed[conversationId] === value ? state : { ...parsed, [conversationId]: value };
          });
        }
      });
    this.pendingThreadPathHintSaves.set(key, save);
    try {
      await save;
    } catch (error) {
      this.logger.error(`Error saving projectless thread path hint`, {
        safe: { conversationId, key },
        sensitive: { error },
      });
    }
  }

  /** 删除路径提示（globalState 键上移除该会话）。 */
  async removeThreadPathHint(key: string, conversationId: string) {
    await this.storage.updateGlobalState(key, (state: unknown) => {
      let parsed = pathHintsSchema.safeParse(state).data ?? {};
      return Object.hasOwn(parsed, conversationId) ? (delete parsed[conversationId], parsed) : state;
    });
  }

  /** 读 projectless 会话 id 集合（失败返回 null）。 */
  private async loadConversationIds() {
    try {
      let value = await this.storage.readGlobalState(`projectless-thread-ids`);
      let ids = zArray(zString()).parse(value ?? []);
      return new Set(ids.map((id) => normalizeThreadId(id)));
    } catch (error) {
      this.logger.warning(`Failed to load projectless thread ids`, {
        safe: {},
        sensitive: { error },
      });
      return null;
    }
  }

  /** 读路径提示表（失败返回 null）。 */
  private async loadThreadPathHints(key: string) {
    try {
      let value = await this.storage.readGlobalState(key);
      let parsed = pathHintsSchema.safeParse(value).data ?? {};
      return new Map(Object.entries(parsed).map(([id, path]) => [normalizeThreadId(id), path]));
    } catch (error) {
      this.logger.warning(`Failed to load projectless thread path hints`, {
        safe: { key },
        sensitive: { error },
      });
      return null;
    }
  }
}

/** 父线程 id 解析（原 nw）：显式 parentThreadId 优先，否则从 source 解析。 */
export function resolveParentThreadId(thread: any) {
  return thread.parentThreadId == null
    ? (parseThreadSource(thread.source)?.parentThreadId ?? null)
    : normalizeThreadId(thread.parentThreadId);
}

// ---------------------------------------------------------------------------
// ThreadWorkspaceStorage（swe）
// ---------------------------------------------------------------------------

/** ThreadWorkspaceStorage 依赖注入面。 */
export interface ThreadWorkspaceStorageParams {
  storage: any;
  threadProjectAssignments: any;
  createProjectlessWorkspace: (title: string | null) => Promise<{ cwd: string; workspaceRoot: string }>;
}

/**
 * 线程 workspace 存储门面（原 swe）：workspace state（v1 键）、project
 * assignment、可写根的读写。可写根写入在无变化时跳过（幂等）。
 */
export class ThreadWorkspaceStorage {
  storage: any;
  threadProjectAssignments: any;
  createProjectlessWorkspace: (title: string | null) => Promise<{ cwd: string; workspaceRoot: string }>;

  constructor(params: ThreadWorkspaceStorageParams) {
    this.storage = params.storage;
    this.threadProjectAssignments = params.threadProjectAssignments;
    this.createProjectlessWorkspace = params.createProjectlessWorkspace;
  }

  /** 读 thread workspace state（宽松解析）。 */
  getWorkspaceState(conversationId: string) {
    return parseThreadWorkspaceState(this.storage.readValue(threadWorkspaceStateKey(conversationId)));
  }

  /** 提交 workspace 过渡（revision 提升 + pending 清理）。 */
  commitWorkspaceTransition(conversationId: string, revision: string, applied: unknown) {
    this.storage.writeValue(
      threadWorkspaceStateKey(conversationId),
      applyWorkspaceRevision(this.getWorkspaceState(conversationId), revision, applied),
    );
  }

  /** 读 project assignment（thread-project-assignments 键）。 */
  async getProjectAssignment(conversationId: string) {
    let assignments = await this.storage.readGlobalState(`thread-project-assignments`);
    return parseThreadProjectAssignments(assignments)[conversationId] ?? null;
  }

  /** 读可写根（过滤非法路径）。 */
  async getWritableRoots(conversationId: string) {
    return (parseWritableRootsState(await this.storage.readGlobalState(`thread-writable-roots`))[conversationId] ?? []).filter(
      isValidPath,
    );
  }

  /** 写 project assignment。 */
  async setProjectAssignment(conversationId: string, assignment: unknown) {
    await this.threadProjectAssignments.setAssignment({ threadId: conversationId, assignment });
  }

  /** 生成 projectless 工作区。 */
  async createProjectlessThreadWorkspace(title: string | null) {
    return this.createProjectlessWorkspace(title);
  }

  /** 合并可写根（有新增才写；失败抛「Failed to merge retained workspace roots」）。 */
  async mergeWritableRoots(conversationId: string, writableRoots: string[]) {
    try {
      await this.storage.updateGlobalState(`thread-writable-roots`, (state: unknown) => {
        let rootsByThread = parseWritableRootsState(state);
        return hasMissingRoots(rootsByThread[conversationId] ?? [], writableRoots)
          ? withMergedWritableRoots({ writableRootsByThread: rootsByThread, conversationId, writableRoots })
          : state;
      });
    } catch {
      throw Error(`Failed to merge retained workspace roots`);
    }
  }

  /** 替换可写根（内容相同跳过；失败抛「Failed to replace retained workspace roots」）。 */
  async replaceWritableRoots(conversationId: string, writableRoots: string[]) {
    try {
      await this.storage.updateGlobalState(`thread-writable-roots`, (state: unknown) => {
        let rootsByThread = parseWritableRootsState(state);
        let current = rootsByThread[conversationId] ?? [];
        return current.length === writableRoots.length && current.every((root: string, index: number) => root === writableRoots[index])
          ? state
          : { ...rootsByThread, [conversationId]: writableRoots };
      });
    } catch {
      throw Error(`Failed to replace retained workspace roots`);
    }
  }
}
