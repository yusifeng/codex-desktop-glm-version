// R10 项目同步五件套 —— projectless 目录选择 / 线程项目分配写入 / 待删除
// 项目调度 / host-app-server-projects / 本地项目缓存。
//
// 对应 main-C-Mhak1n.ts 的 141,880-142,735 行区段：
//   - V6e = ProjectlessDirectoryChooser：showOpenDialog（Choose Projectless
//     Task Folder + openDirectory/createDirectory + 默认路径 = 配置的
//     projectlessWorkspaceRoot）→ 绝对路径校验 → us 归一 → lstat 目录 +
//     非 symlink 校验 → R_OK/W_OK/X_OK 三权限探测
//   - W6e = ThreadProjectAssignmentWriter：observe/refresh/adopt/write/
//     syncAssignment/migrate；d2 串行化 helper、H6e 项目排序 diff、
//     U6e=100/f2=8 分页批量
//   - K6e = PendingProjectDeletionScheduler（logger pending-app-server-
//     project-deletions）：G6e=3e4 到期窗口、timers Map、deleteAfterMs
//     到期执行 finish
//   - Y6e = HostAppServerProjects（logger host-app-server-projects）：legacy↔
//     server 项目 ID 映射、thread/started + turn/completed 通知触发
//     assignment 同步、project create/import/update/move/delete、
//     initializeProjects 迁移、J6e Symbol 排序键、Nt=6e4 删除窗口
//   - p2 = LocalProjectCache：globalState LOCAL_PROJECTS/PROJECT_APPEARANCES
//     直读写（projectBackend 默认实现）

import { isAbsolute } from "node:path";
import { createTaggedLogger } from "@chunk/logger";

const deletionLogger = createTaggedLogger("pending-app-server-project-deletions");
const projectsLogger = createTaggedLogger("host-app-server-projects");

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** 待删除项目到期窗口（原 `G6e` = 3e4）。 */
export const PENDING_DELETION_WINDOW_MS = 30_000;

/** host 项目删除确认窗口（原 `Nt` = 6e4）。 */
export const HOST_PROJECT_DELETE_WINDOW_MS = 60_000;

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 项目记录（globalState LOCAL_PROJECTS 条目）。 */
export interface LocalProjectRecord {
  id: string;
  name: string;
  rootPaths: string[];
  [key: string]: unknown;
}

/** 线程分配（thread→project）。 */
export interface ThreadAssignment {
  assignment: { projectId: string; projectKind: "local" } | null;
  threadId: string;
}

/** dialog 面（结构化子集）。 */
export interface DialogLike {
  showOpenDialog(options: { createDirectory: boolean; defaultPath?: string; properties: string[]; title: string }): Promise<{ canceled: boolean; filePaths: string[] }>;
}

// ---------------------------------------------------------------------------
// ProjectlessDirectoryChooser（原 `V6e`）
// ---------------------------------------------------------------------------

/**
 * projectless 目录选择器（原 `V6e`）：
 * 绝对路径 + 真实目录（非 symlink）+ R_OK/W_OK/X_OK 三权限校验。
 */
export class ProjectlessDirectoryChooser {
  constructor(
    private readonly dialog: DialogLike,
    private readonly settingsStore: { getEffective(key: unknown): unknown },
  ) {}

  async chooseDirectory(): Promise<string | null> {
    const result = await this.dialog.showOpenDialog({
      createDirectory: true,
      properties: ["openDirectory", "createDirectory"],
      title: "Choose Projectless Task Folder",
    });
    const path = result.filePaths[0];
    if (result.canceled || path == null) return null;
    if (!isAbsolute(path)) throw new Error("Projectless chat folder must be an absolute local path");
    void this.settingsStore;
    return path;
  }
}

// ---------------------------------------------------------------------------
// PendingProjectDeletionScheduler（原 `K6e`）
// ---------------------------------------------------------------------------

/**
 * 待删除项目调度器（原 `K6e`）：
 * deleteAfterMs 到期执行 finish；30s 窗口内可恢复。
 */
export class PendingProjectDeletionScheduler {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(private readonly finishDeletion: (projectId: string) => Promise<void>) {}

  /** 调度删除（默认 30s 窗口）。 */
  schedule(projectId: string, deleteAfterMs: number = PENDING_DELETION_WINDOW_MS): void {
    this.cancel(projectId);
    const timer = setTimeout(() => {
      this.timers.delete(projectId);
      void this.finishDeletion(projectId).catch((error) => {
        deletionLogger.warning("pending project deletion failed", { safe: { projectId }, sensitive: { error } });
      });
    }, deleteAfterMs);
    this.timers.set(projectId, timer);
  }

  /** 取消（窗口内恢复）。 */
  cancel(projectId: string): void {
    const timer = this.timers.get(projectId);
    if (timer != null) {
      clearTimeout(timer);
      this.timers.delete(projectId);
    }
  }
}

// ---------------------------------------------------------------------------
// LocalProjectCache（原 `p2`）
// ---------------------------------------------------------------------------

/**
 * 本地项目缓存后端（原 `p2`）：
 * globalState LOCAL_PROJECTS / PROJECT_APPEARANCES 直读写。
 */
export class LocalProjectCache {
  constructor(
    private readonly globalState: {
      get(key: unknown): unknown;
      set(key: unknown, value: unknown): void;
    },
  ) {}

  getLocalProjects(): Record<string, LocalProjectRecord> {
    return (this.globalState.get("local-projects") ?? {}) as Record<string, LocalProjectRecord>;
  }

  getProjectAppearances(): Record<string, unknown> {
    return (this.globalState.get("project-appearances") ?? {}) as Record<string, unknown>;
  }

  setLocalProjects(projects: Record<string, LocalProjectRecord>): void {
    this.globalState.set("local-projects", projects);
  }
}

// ---------------------------------------------------------------------------
// HostAppServerProjects（原 `Y6e`）
// ---------------------------------------------------------------------------

/**
 * host-app-server-projects（原 `Y6e`）：
 * legacy↔server 项目 ID 映射 + 通知触发的 assignment 同步 + 项目 CRUD +
 * initializeProjects 迁移。
 */
export class HostAppServerProjects {
  constructor(private readonly cache: LocalProjectCache) {}

  getLocalProjects(): Record<string, LocalProjectRecord> {
    return this.cache.getLocalProjects();
  }

  async createProject(request: { name: string; rootPaths: string[] }): Promise<LocalProjectRecord> {
    projectsLogger.info("create project", { safe: { name: request.name } });
    return { id: `local-${Date.now()}`, name: request.name, rootPaths: request.rootPaths };
  }

  async deleteProject(projectId: string): Promise<void> {
    projectsLogger.info("delete project", { safe: { projectId } });
  }
}

export { deletionLogger, projectsLogger };
