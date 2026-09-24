// browser-use 执行宿主包装 —— 原 main-C-Mhak1n.ts 2,774-2,957 行
// （`ute/dte` 常量、`fte`→按 hostId 的执行宿主注册表、`pte`→单宿主包装、
// `mte`→子进程包装、`hte`→文件监听会话包装、`gte`→变更批处理器），
// 以及 2,958-2,969 行的 stat 快照 helper `_te`（该 helper 位于未指派的
// 「stat 快照」带，仅被 `pte.stat` 消费，就近内联）。
//
// 职责：把（可能位于远端 SSH 主机的）app-server 执行宿主适配成本地风格的
// spawn / 文件系统 / 文件监听面：
//   - ExecutionHostRegistry（fte）：按 hostId 缓存每宿主包装实例；另提供本地
//     git ignore 环境探测（XDG_CONFIG_HOME / GIT_CONFIG_GLOBAL）。
//   - RemoteExecutionHostAdapter（pte）：spawn 经 shared 侧 spawn tracing 包装；
//     stat 结果规约为纯数据快照；startFileWatch 挂 16ms 批处理器。
//   - ChildProcessHandle（mte）/ FileWatchSessionHandle（hte）：统一
//     `Symbol.dispose` 语义（kill / dispose 幂等）。
//   - FileChangeBatcher（gte）：聚合变更路径，256 条或 16ms 定时冲刷；
//     空变更列表（changedPaths.length===0）语义为「全部失效」（pending=null）。

import { Uf as SharedEventEmitter, ia as withSpawnTracing } from "@chunk/shared";

// ---- 类型（按消费面宽松声明）-------------------------------------------------

/** 执行宿主 spawn 返回的原始进程句柄。 */
export interface RawExecutionHostProcess {
  stdin: any;
  stdout: any;
  stderr: any;
  kill(): void;
  resize(size: unknown): unknown;
  wait(): Promise<unknown>;
}

/** app-server 连接暴露的（可能位于远端的）执行宿主。 */
export interface ExecutionHost {
  spawn(options: any): Promise<RawExecutionHostProcess>;
  readFile(path: string): Promise<unknown>;
  writeFile(path: string, contents: unknown): Promise<unknown>;
  createDirectory(path: string, options?: unknown): Promise<unknown>;
  stat(path: string, options?: unknown): Promise<RawStatResult>;
  readDirectory(path: string): Promise<DirentLike[]>;
  remove(path: string, options?: unknown): Promise<unknown>;
  copyFile(source: string, destination: string, options?: unknown): Promise<unknown>;
  copy(source: string, destination: string, options?: unknown): Promise<unknown>;
  workspacesRoot(): unknown;
  codexHome(): unknown;
  platformFamily(): unknown;
  platformOs(): unknown;
  startFileWatch(options: any): Promise<RawFileWatchSession>;
}

/** 目录项（app-server 序列化后的 withFileTypes 结果）。 */
export interface DirentLike {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
  isSymbolicLink(): boolean;
}

/** 执行宿主 stat 的原始返回（各字段为 fs.Stats 上的取值）。 */
export interface RawStatResult {
  birthtimeMs: number;
  ctimeMs: number;
  ino: number;
  mtimeMs: number;
  size: number;
  isDirectory(): boolean;
  isFile(): boolean;
  isSymbolicLink(): boolean;
}

/** stat 规约后的纯数据快照（原 `_te`，2,958-2,969）。 */
export interface StatSnapshot {
  birthtimeMs: number;
  ctimeMs: number;
  ino: number;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
  mtimeMs: number;
  size: number;
}

/** 原始文件监听会话。 */
export interface RawFileWatchSession {
  path: string;
  coverage: unknown;
  closed: Promise<unknown>;
  dispose(): Promise<unknown>;
}

/** 文件监听回调句柄（可 dup 复制、可 dispose 释放监听；返回可释放的 promise）。 */
export interface FileWatchOnChangeHandle {
  (event: { changedPaths: string[] }): Promise<unknown> & { [Symbol.dispose](): void };
  dup(): FileWatchOnChangeHandle;
  [Symbol.dispose](): void;
}

/** 规约后的目录项。 */
export interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymbolicLink: boolean;
}

// ---- 常量（原 ute/dte，2,772-2,773）-----------------------------------------

/** 文件变更批处理冲刷延迟（原 `ute`）。 */
const FILE_WATCH_BATCH_DELAY_MS = 16;
/** 批处理器挂起路径上限（达到即立即冲刷；原 `dte`）。 */
const FILE_WATCH_BATCH_MAX_PATHS = 256;

// ---- stat 快照（原 _te，2,958-2,969）----------------------------------------

/** 把执行宿主 stat 结果规约为纯数据快照（原 `_te`；位于未指派的 stat 快照带）。 */
function toStatSnapshot(stat: RawStatResult): StatSnapshot {
  return {
    birthtimeMs: stat.birthtimeMs,
    ctimeMs: stat.ctimeMs,
    ino: stat.ino,
    isDirectory: stat.isDirectory(),
    isFile: stat.isFile(),
    isSymbolicLink: stat.isSymbolicLink(),
    mtimeMs: stat.mtimeMs,
    size: stat.size,
  };
}

// ---- fte：执行宿主注册表（2,774-2,801）--------------------------------------

/**
 * 按 hostId 的执行宿主包装注册表（原 `fte`）。
 * 启动装配区（原 176,055 行）以 `new fte(hostId => ...)` 实例化。
 */
export class ExecutionHostRegistry extends SharedEventEmitter {
  getExecutionHost: (hostId: string) => ExecutionHost;
  targetsByHostId = new Map<string, RemoteExecutionHostAdapter>();

  constructor(getExecutionHost: (hostId: string) => ExecutionHost) {
    super();
    this.getExecutionHost = getExecutionHost;
  }

  getHost(hostId: string): RemoteExecutionHostAdapter {
    let existing = this.targetsByHostId.get(hostId);
    return (
      existing ??
      ((existing = new RemoteExecutionHostAdapter(() => this.getExecutionHost(hostId))),
      this.targetsByHostId.set(hostId, existing),
      existing)
    );
  }

  /** 本地 git ignore 环境（default excludes 文件 + 全局配置文件列表）。 */
  getLocalGitIgnoreEnvironment() {
    let configHome: string | null = null;
    process.env.XDG_CONFIG_HOME
      ? (configHome = `${process.env.XDG_CONFIG_HOME}/git`)
      : process.env.HOME != null && (configHome = `${process.env.HOME}/.config/git`);
    let globalConfigFiles: string[] = [];
    return (
      process.env.GIT_CONFIG_GLOBAL == null
        ? (configHome != null && globalConfigFiles.push(`${configHome}/config`),
          process.env.HOME != null && globalConfigFiles.push(`${process.env.HOME}/.gitconfig`))
        : process.env.GIT_CONFIG_GLOBAL !== `` && globalConfigFiles.push(process.env.GIT_CONFIG_GLOBAL),
      {
        defaultExcludesFile: configHome == null ? null : `${configHome}/ignore`,
        globalConfigFiles,
      }
    );
  }
}

// ---- pte：单宿主包装（2,802-2,863）-------------------------------------------

/** 把执行宿主适配为本地风格 API 的包装（原 `pte`）。 */
export class RemoteExecutionHostAdapter extends SharedEventEmitter {
  getExecutionHost: () => ExecutionHost;

  constructor(getExecutionHost: () => ExecutionHost) {
    super();
    this.getExecutionHost = getExecutionHost;
  }

  async spawn(options: any): Promise<{
    stdin: any;
    stdout: any;
    stderr: any;
    process: ChildProcessHandle;
  }> {
    let { trace, ...rest } = options;
    let spawned = await withSpawnTracing(trace, () => this.getExecutionHost().spawn(rest));
    return {
      stdin: spawned.stdin,
      stdout: spawned.stdout,
      stderr: spawned.stderr,
      process: new ChildProcessHandle(spawned),
    };
  }

  readFile(path: string) {
    return this.getExecutionHost().readFile(path);
  }

  writeFile(path: string, contents: unknown) {
    return this.getExecutionHost().writeFile(path, contents);
  }

  createDirectory(path: string, options?: unknown) {
    return this.getExecutionHost().createDirectory(path, options);
  }

  async stat(path: string, options?: unknown): Promise<StatSnapshot> {
    return toStatSnapshot(await this.getExecutionHost().stat(path, options));
  }

  async readDirectory(path: string): Promise<DirectoryEntry[]> {
    return (await this.getExecutionHost().readDirectory(path)).map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
      isSymbolicLink: entry.isSymbolicLink(),
    }));
  }

  remove(path: string, options?: unknown) {
    return this.getExecutionHost().remove(path, options);
  }

  copyFile(source: string, destination: string, options?: unknown) {
    return this.getExecutionHost().copyFile(source, destination, options);
  }

  copy(source: string, destination: string, options?: unknown) {
    return this.getExecutionHost().copy(source, destination, options);
  }

  workspacesRoot() {
    return this.getExecutionHost().workspacesRoot();
  }

  codexHome() {
    return this.getExecutionHost().codexHome();
  }

  platformFamily() {
    return this.getExecutionHost().platformFamily();
  }

  platformOs() {
    return this.getExecutionHost().platformOs();
  }

  async startFileWatch(
    options: any,
    onChange: FileWatchOnChangeHandle,
  ): Promise<FileWatchSessionHandle> {
    let batcher = new FileChangeBatcher(onChange.dup()),
      session: RawFileWatchSession;
    try {
      session = await this.getExecutionHost().startFileWatch({
        ...options,
        onChange: (event: { changedPaths: string[] }) => batcher.enqueue(event),
      });
    } catch (error) {
      throw (batcher[Symbol.dispose](), error);
    }
    return new FileWatchSessionHandle(session, batcher);
  }
}

// ---- mte：子进程包装（2,864-2,887）-------------------------------------------

/** 执行宿主子进程句柄：wait 结果缓存 + dispose 时 kill（原 `mte`）。 */
export class ChildProcessHandle extends SharedEventEmitter {
  process: RawExecutionHostProcess;
  exited = !1;
  result: Promise<unknown>;

  constructor(process: RawExecutionHostProcess) {
    super();
    this.process = process;
    this.result = process.wait().finally(() => {
      this.exited = !0;
    });
  }

  kill() {
    this.process.kill();
  }

  resize(size: unknown) {
    return this.process.resize(size);
  }

  wait() {
    return this.result;
  }

  [Symbol.dispose]() {
    this.exited || this.process.kill();
  }
}

// ---- hte：文件监听会话包装（2,888-2,921）--------------------------------------

/** 文件监听会话句柄：dispose 幂等，关闭时级联释放批处理器（原 `hte`）。 */
export class FileWatchSessionHandle extends SharedEventEmitter {
  session: RawFileWatchSession;
  changeBatcher: FileChangeBatcher;
  disposed = !1;
  closedResult: Promise<unknown>;

  constructor(session: RawFileWatchSession, changeBatcher: FileChangeBatcher) {
    super();
    this.session = session;
    this.changeBatcher = changeBatcher;
    this.closedResult = session.closed.finally(() => this.changeBatcher[Symbol.dispose]());
  }

  get path() {
    return this.session.path;
  }

  get coverage() {
    return this.session.coverage;
  }

  closed() {
    return this.closedResult;
  }

  async dispose() {
    if (!this.disposed) {
      this.disposed = !0;
      try {
        await this.session.dispose();
      } finally {
        this.changeBatcher[Symbol.dispose]();
      }
    }
  }

  [Symbol.dispose]() {
    this.dispose().catch(() => {});
  }
}

// ---- gte：文件变更批处理器（2,922-2,957）--------------------------------------

/**
 * 文件变更批处理器（原 `gte`）：
 *   - 空变更列表 → pending 置 null（「全部失效」），下次冲刷发空列表；
 *   - 路径去重累计，达到 256 条立即冲刷；
 *   - 16ms 定时冲刷（仅在有内容或全部失效态时启动定时器）。
 */
export class FileChangeBatcher {
  onChange: FileWatchOnChangeHandle;
  batchTimer: ReturnType<typeof setTimeout> | null = null;
  pendingChangedPaths: Set<string> | null = new Set();
  disposed = !1;

  constructor(onChange: FileWatchOnChangeHandle) {
    this.onChange = onChange;
  }

  enqueue(event: { changedPaths: string[] }) {
    if (!this.disposed) {
      if (event.changedPaths.length === 0) this.pendingChangedPaths = null;
      else if (this.pendingChangedPaths != null)
        for (let path of event.changedPaths)
          (this.pendingChangedPaths.add(path),
            this.pendingChangedPaths.size >= FILE_WATCH_BATCH_MAX_PATHS && this.flush());
      this.batchTimer == null &&
        (this.pendingChangedPaths == null || this.pendingChangedPaths.size > 0) &&
        (this.batchTimer = setTimeout(() => this.flush(), FILE_WATCH_BATCH_DELAY_MS));
    }
  }

  [Symbol.dispose]() {
    this.disposed ||
      ((this.disposed = !0),
      this.batchTimer != null && (clearTimeout(this.batchTimer), (this.batchTimer = null)),
      this.onChange[Symbol.dispose]());
  }

  flush() {
    this.batchTimer != null && (clearTimeout(this.batchTimer), (this.batchTimer = null));
    let pending = this.pendingChangedPaths;
    if (((this.pendingChangedPaths = new Set()), this.disposed || pending?.size === 0)) return;
    let result = this.onChange({ changedPaths: pending == null ? [] : [...pending] });
    result.then(
      () => result[Symbol.dispose](),
      () => result[Symbol.dispose](),
    );
  }
}
