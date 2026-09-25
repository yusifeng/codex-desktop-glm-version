// workspace 设置服务：agent 写确认 broker + 设置服务基类/门面 + 三方声明读取 +
// 远程 workspace 目录枚举。
//
// 对应 main-C-Mhak1n.ts 95,507-96,194：
//   - oBe：work-mode 访问 schema（userId/accountId/authMethod/stableId + policy）
//   - sBe：SettingsServiceBase（readAll/readForAgent/subscribe，RPC 流 + dup +
//     Symbol.dispose + onRpcBroken）
//   - cBe/SBe：退订句柄
//   - xBe：AgentWriteConfirmationBroker（pending/listeners/subscriptions +
//     AbortSignal 取消；`Settings service unavailable.`）
//   - CBe：WorkspaceSettingsService（store + afterWrite + statsig；conversation
//     detail mode 的 statsig 执行分配合并、openLink 偏好回退、agent 白名单写、
//     桌面可用性/work-mode 变更监听分发）
//   - zH：账号匹配；BH：系统 backdrop 探测（win32 GPU 合成检查）
//   - VH/HH/TBe/EBe/DBe：THIRD_PARTY_NOTICES.txt 候选路径 + dev 重新生成
//     （pnpm workspace 根探测 + scripts/generate-third-party-notices.mjs）
//   - OBe/kBe/ABe/jBe/UH/MBe/WH：remote-workspace-directory-entries（app-server
//     fs 代理 stat/readdir + 符号链接展开 + workspaceRoot 越界校验）
//   - GH：WSL_DISTRO_NAME 探测
//
// 依赖约束：shared 的设置定义表（ka/ja/Oa/Ea/Aa）、fs 代理（Di）、远程判定（Es）、
// node 解析（qn）与环境清洗（Bi）按压缩名导入并注释内部符号名。

import { execFile } from "node:child_process";
import { existsSync, promises as fs } from "node:fs";
import { promisify } from "node:util";
import nodePath from "node:path";
import { app, BrowserWindow } from "electron";
import {
  wf as objectSchema,
  Of as stringSchema,
  df as enumSchema,
  Uf as EventEmitterBase,
  ka as settingKeyList,
  ja as conversationSettings,
  Oa as effectiveSettingValue,
  Ea as settingDefinitionFor,
  Aa as agentReadableSettings,
  Ia as openLinkTargetPreference,
  Di as appServerFileSystem,
  Es as isRemoteHostConfig,
  qn as executableResolver,
  Bi as sanitizedProcessEnv,
} from "@chunk/shared";

// ---------------------------------------------------------------------------
// 退订句柄（原 `cBe`/`SBe`）
// ---------------------------------------------------------------------------

/** 退订句柄（原 `cBe`/`SBe`）：幂等清理 + Symbol.dispose。 */
export class UnsubscribeHandle extends (EventEmitterBase as new () => {}) {
  constructor(private cleanup: (() => void) | null) {
    super();
  }
  unsubscribe(): void {
    const cleanup = this.cleanup;
    this.cleanup = null;
    cleanup?.();
  }
  [Symbol.dispose](): void {
    this.unsubscribe();
  }
}

// ---------------------------------------------------------------------------
// work-mode 访问 schema 与账号匹配（原 `oBe`/`zH`）
// ---------------------------------------------------------------------------

const workModeAccessSchema = objectSchema({
  userId: stringSchema().nullable(),
  accountId: stringSchema().nullable(),
  authMethod: stringSchema().nullable(),
  stableId: stringSchema().nullable(),
  policy: enumSchema(["preference", "coding", "everyday"]),
});

export interface AccountIdentity {
  accountId: string | null;
  authMethod: string | null;
  stableId?: string | null;
  userId?: string | null;
}

/** 账号匹配（原 `zH`）：accountId 路径或 authMethod/stableId 路径。 */
export function accountMatches(a: AccountIdentity, b: AccountIdentity): boolean {
  return a.accountId == null
    ? b.accountId == null &&
        a.authMethod === b.authMethod &&
        (a.authMethod != null || (a.stableId != null && a.stableId === b.stableId))
    : a.accountId === b.accountId && a.userId === b.userId;
}

/** 系统 backdrop 探测（原 `BH`）：win32 GPU 合成未启用时禁用。 */
export function isSystemBackdropSupported(): boolean {
  return process.platform === "win32" && app.getGPUFeatureStatus().gpu_compositing !== "enabled"
    ? false
    : BrowserWindow_isSystemBackdropSupported();
}

function BrowserWindow_isSystemBackdropSupported(): boolean {
  return (BrowserWindow as unknown as { isSystemBackdropSupported(): boolean }).isSystemBackdropSupported();
}

// ---------------------------------------------------------------------------
// agent 写确认 broker（原 `xBe`）
// ---------------------------------------------------------------------------

interface PendingWriteConfirmation {
  request: { hostId: string; threadId: string; key: { turnId: string; callId: string } };
  settle(value: boolean): void;
  cancel(): void;
}

/** RPC 订阅流面（结构化子集：dup/onRpcBroken/Symbol.dispose + 发送）。 */
export interface SettingsRpcStreamLike {
  dup(): SettingsRpcStreamLike;
  onRpcBroken(handler: () => void): void;
  send(value: never): Promise<unknown>;
  [Symbol.dispose](): void;
}

/**
 * agent 设置写确认 broker（原 `xBe`）：pending 按 hostId+threadId 键控；
 * 同键请求去重（返回 false）；abort 取消；answer 按 turnId+callId 精确结算。
 */
export class AgentWriteConfirmationBroker extends (EventEmitterBase as new () => {}) {
  pending = new Map<string, PendingWriteConfirmation>();
  listeners = new Map<string, Set<() => void>>();
  subscriptions = new Set<UnsubscribeHandle>();
  disposed = false;

  request = (request: PendingWriteConfirmation["request"], signal: AbortSignal): Promise<boolean> => {
    signal.throwIfAborted();
    if (this.disposed) throw new Error("Settings service unavailable.");
    const key = pendingKey(request);
    if (this.pending.has(key)) return Promise.resolve(false);
    return new Promise<boolean>((resolve, reject) => {
      const cleanup = () => {
        signal.removeEventListener("abort", onAbort);
        this.pending.delete(key);
        this.#notify(key);
      };
      const onAbort = () => {
        cleanup();
        reject(
          signal.reason instanceof Error
            ? signal.reason
            : new Error(signal.aborted ? "The operation was aborted" : "Settings service unavailable."),
        );
      };
      this.pending.set(key, {
        request,
        settle: (value) => {
          cleanup();
          resolve(value);
        },
        cancel: onAbort,
      });
      signal.addEventListener("abort", onAbort, { once: true });
      this.#notify(key);
    });
  };

  async subscribe(request: { hostId: string; threadId: string }, stream: SettingsRpcStreamLike): Promise<UnsubscribeHandle> {
    if (this.disposed) throw new Error("Settings service unavailable.");
    const key = pendingKey(request);
    const duplicated = stream.dup();
    const notify = () => {
      try {
        duplicated.send(
          (
            this.pending.get(key)?.request ?? null
          ) as never,
        ).catch(() => handle.unsubscribe());
      } catch {
        // 发送失败由 onRpcBroken 兜底。
      }
    };
    const listeners = this.listeners.get(key) ?? new Set<() => void>();
    listeners.add(notify);
    this.listeners.set(key, listeners);
    const handle = new UnsubscribeHandle(() => {
      listeners.delete(notify);
      if (listeners.size === 0) this.listeners.delete(key);
      duplicated[Symbol.dispose]();
      this.subscriptions.delete(handle);
    });
    this.subscriptions.add(handle);
    duplicated.onRpcBroken(() => handle.unsubscribe());
    notify();
    return handle;
  }

  async answer(
    request: { hostId: string; threadId: string; turnId: string; callId: string },
    approved: boolean,
  ): Promise<boolean> {
    const pending = this.pending.get(pendingKey(request));
    return pending == null || pending.request.key.turnId !== request.turnId || pending.request.key.callId !== request.callId
      ? false
      : (pending.settle(approved), true);
  }

  dispose = (): void => {
    this.disposed = true;
    for (const pending of this.pending.values()) pending.cancel();
    for (const handle of this.subscriptions) handle.unsubscribe();
  };

  #notify(key: string): void {
    this.listeners.get(key)?.forEach((listener) => listener());
  }
}

function pendingKey(request: { hostId: string; threadId: string }): string {
  return JSON.stringify([request.hostId, request.threadId]);
}

// ---------------------------------------------------------------------------
// 设置服务基类与门面（原 `sBe`/`CBe`）
// ---------------------------------------------------------------------------

/** 单键读取结果。 */
export interface SettingReadResult {
  configured: unknown;
  effective: unknown;
}

/** 设置存储面（结构化子集）。 */
export interface SettingsStoreLike {
  get(key: unknown): unknown;
  getEffective(key: unknown): unknown;
  set(key: unknown, value: unknown): void;
  flush(): Promise<void>;
  onDidChange(key: unknown, listener: () => void): () => void;
  getStateFilePath(): string;
}

/** statsig 面面（结构化子集）。 */
export interface StatsigLike {
  readExecutionAssignments(): Promise<{ identity: AccountIdentity } | null>;
  onDidChange(listener: () => void): () => void;
}

/** 设置服务基类（原 `sBe`）：readAll/readForAgent/subscribe。 */
export abstract class SettingsServiceBase extends (EventEmitterBase as new () => {}) {
  abstract keys(): unknown[];
  abstract settingsFilePath(): string;
  abstract read(key: unknown, identity?: AccountIdentity | null): Promise<SettingReadResult>;
  abstract onDidChange(key: unknown, listener: () => void): () => void;

  async readAll(): Promise<{ values: Record<string, unknown>; configuredValues: Record<string, unknown> }> {
    const entries = await Promise.all(this.keys().map(async (key) => [key, await this.read(key)] as const));
    const values: Record<string, unknown> = {};
    const configuredValues: Record<string, unknown> = {};
    for (const [key, result] of entries) {
      Object.assign(values, { [key as string]: result.effective });
      Object.assign(configuredValues, { [key as string]: result.configured });
    }
    return { values, configuredValues };
  }

  async readForAgent(identity?: AccountIdentity | null): Promise<{
    filePath: string;
    settings: Record<string, unknown>;
    effectiveSettings: Record<string, unknown>;
    definitions: unknown[];
  }> {
    const keys = new Set(this.keys());
    const definitions = (agentReadableSettings as Array<{ key: unknown }>).filter(({ key }) => keys.has(key));
    const entries = await Promise.all(definitions.map(async ({ key }) => [key, await this.read(key, identity)] as const));
    return {
      filePath: this.settingsFilePath(),
      settings: Object.fromEntries(entries.flatMap(([key, result]) => (result.configured === undefined ? [] : [[key as string, result.configured]]))),
      effectiveSettings: Object.fromEntries(entries.flatMap(([key, result]) => (result.effective === undefined ? [] : [[key as string, result.effective]]))),
      definitions,
    };
  }

  async subscribe(key: unknown, stream: SettingsRpcStreamLike): Promise<UnsubscribeHandle> {
    const duplicated = stream.dup();
    let generation = 0;
    let active = true;
    const push = async (): Promise<void> => {
      const current = ++generation;
      const result = await this.read(key);
      if (active && current === generation) {
        try {
          duplicated.send(result as never);
        } catch {
          // 发送失败由 onRpcBroken 兜底。
        }
      }
    };
    const unsubscribeKey = this.onDidChange(key, () => {
      push().catch(() => handle.unsubscribe());
    });
    const handle = new UnsubscribeHandle(() => {
      active = false;
      unsubscribeKey();
      duplicated[Symbol.dispose]();
    });
    duplicated.onRpcBroken(() => handle.unsubscribe());
    try {
      await push();
      return handle;
    } catch (error) {
      handle.unsubscribe();
      throw error;
    }
  }
}

/**
 * workspace 设置服务门面（原 `CBe`）：
 * - conversationDetailMode：statsig 执行分配 + work-mode 访问表合并（policy
 *   preference → 用户偏好；coding/everyday → STEPS_PROSE/STEPS_COMMANDS）；
 * - openLinkInTargetPreference：设置覆盖或可用性默认；
 * - writeForAgent：agent 白名单（agentAccess === read-write）校验 + 写后 flush。
 */
export class WorkspaceSettingsService extends SettingsServiceBase {
  store: SettingsStoreLike;
  afterWrite: (key: unknown, value: unknown) => void;
  statsig: StatsigLike | undefined;
  configWriteConfirmations = new AgentWriteConfirmationBroker();
  desktopFeatureAvailabilityListeners = new Set<() => void>();
  workModeAccessListeners = new Set<() => void>();
  workModeAccessByAccount: Array<AccountIdentity & { policy: string }> = [];

  constructor(store: SettingsStoreLike, afterWrite: (key: unknown, value: unknown) => void, statsig: StatsigLike | undefined) {
    super();
    this.store = store;
    this.afterWrite = afterWrite;
    this.statsig = statsig;
  }

  settingsFilePath(): string {
    return this.store.getStateFilePath();
  }

  keys(): unknown[] {
    return (settingKeyList as Array<{ key: unknown }>).map(({ key }) => key);
  }

  async read(key: unknown, identity?: AccountIdentity | null): Promise<SettingReadResult> {
    return { configured: this.store.get(key), effective: await this.getEffective(key, identity) };
  }

  async getEffective(key: unknown, identity?: AccountIdentity | null): Promise<unknown> {
    if (key === (conversationSettings as { conversationDetailMode: { key: unknown } }).conversationDetailMode.key) {
      const assignments = await this.statsig?.readExecutionAssignments();
      const access = assignments == null ? undefined : this.workModeAccessByAccount.find((entry) => accountMatches(assignments.identity, entry));
      return assignments == null || access == null || (identity != null && !accountMatches(assignments.identity, identity))
        ? undefined
        : access.policy === "preference"
          ? this.store.getEffective(key)
          : effectiveSettingValue(key, access.policy === "everyday" ? "STEPS_PROSE" : "STEPS_COMMANDS");
    }
    return key === openLinkTargetPreference.openLinkInTargetPreference.key
      ? effectiveSettingValue(key, this.store.get(openLinkTargetPreference.openLinkInTargetPreference.key))
      : this.store.getEffective(key);
  }

  async write(key: unknown, value: unknown): Promise<void> {
    this.store.set(key, value);
    this.afterWrite(key, this.store.get(key));
  }

  async writeForAgent(values: Record<string, unknown>, identity?: AccountIdentity | null): Promise<{ settings: Record<string, unknown>; effectiveSettings: Record<string, unknown> }> {
    const entries = Object.entries(values).map(([name, value]) => {
      const definition = settingDefinitionFor(name) as { key: unknown; agentAccess?: string } | null;
      if (definition == null) throw new Error(`Unknown setting: ${name}`);
      if (definition.agentAccess !== "read-write") throw new Error(`Setting cannot be written by Codex: ${name}`);
      return { key: definition.key, value: effectiveSettingValue(definition.key, value) };
    });
    await Promise.all(entries.map(({ key, value }) => this.write(key, value)));
    await this.store.flush();
    const { settings, effectiveSettings } = await this.readForAgent(identity);
    return { settings, effectiveSettings };
  }

  async publish(workModeAccess: unknown): Promise<void> {
    const parsed = (workModeAccessSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: AccountIdentity & { policy: string } } }).safeParse(workModeAccess);
    if (!parsed.success || parsed.data == null) return;
    const access = parsed.data;
    this.workModeAccessByAccount = [...this.workModeAccessByAccount.filter((entry) => !accountMatches(entry, access)), access];
    this.workModeAccessListeners.forEach((listener) => listener());
  }

  onDidChange(key: unknown, listener: () => void): () => void {
    const unsubscribe = this.store.onDidChange(key, listener);
    if (key === openLinkTargetPreference.openLinkInTargetPreference.key) this.desktopFeatureAvailabilityListeners.add(listener);
    if (key === (conversationSettings as { conversationDetailMode: { key: unknown } }).conversationDetailMode.key) this.workModeAccessListeners.add(listener);
    const unsubscribeStatsig =
      key === (conversationSettings as { conversationDetailMode: { key: unknown } }).conversationDetailMode.key ? this.statsig?.onDidChange(listener) : undefined;
    return () => {
      unsubscribe();
      this.desktopFeatureAvailabilityListeners.delete(listener);
      this.workModeAccessListeners.delete(listener);
      unsubscribeStatsig?.();
    };
  }

  notifyDesktopFeatureAvailabilityChanged(): void {
    this.desktopFeatureAvailabilityListeners.forEach((listener) => listener());
  }

  dispose(): void {
    this.configWriteConfirmations.dispose();
    this.workModeAccessByAccount = [];
    this.desktopFeatureAvailabilityListeners.clear();
    this.workModeAccessListeners.clear();
  }
}

// ---------------------------------------------------------------------------
// 三方声明（原 `VH`/`HH`/`TBe`/`EBe`/`DBe`）
// ---------------------------------------------------------------------------

const THIRD_PARTY_NOTICES_FILENAME = "THIRD_PARTY_NOTICES.txt";
const execFileAsync = promisify(execFile);

/** 候选路径（原 `HH`）：resourcesPath + cwd 的 assets 两处。 */
function thirdPartyNoticesCandidates(): string[] {
  const cwd = process.cwd();
  const candidates: string[] = [];
  if (process.resourcesPath) candidates.push(nodePath.join(process.resourcesPath, THIRD_PARTY_NOTICES_FILENAME));
  candidates.push(nodePath.join(cwd, "assets", THIRD_PARTY_NOTICES_FILENAME));
  candidates.push(nodePath.join(cwd, "electron", "assets", THIRD_PARTY_NOTICES_FILENAME));
  return candidates;
}

/** pnpm workspace 根探测（原 `TBe`）：向上找 pnpm-workspace.yaml。 */
function findPnpmWorkspaceRoot(): string | null {
  let directory = process.cwd();
  for (;;) {
    if (existsSync(nodePath.join(directory, "pnpm-workspace.yaml"))) return directory;
    const parent = nodePath.dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
}

/** dev 重新生成（原 `EBe`）：scripts/generate-third-party-notices.mjs，120s 超时。 */
async function regenerateThirdPartyNotices(): Promise<void> {
  const root = findPnpmWorkspaceRoot();
  if (!root) return;
  const output = nodePath.join(root, "electron", "assets", THIRD_PARTY_NOTICES_FILENAME);
  await fs.mkdir(nodePath.dirname(output), { recursive: true });
  await execFileAsync(
    executableResolver.resolve("node", { cwd: root }) ?? "node",
    ["./scripts/generate-third-party-notices.mjs", "--output-file", output],
    { cwd: root, env: sanitizedProcessEnv(process.env), timeout: 12e4 },
  );
}

/** 读取三方声明（原 `DBe`）：候选路径 → dev 时重新生成再试。 */
export async function readThirdPartyNotices(): Promise<string | null> {
  for (const candidate of thirdPartyNoticesCandidates()) if (existsSync(candidate)) return fs.readFile(candidate, "utf8");
  if (process.env.NODE_ENV !== "production") {
    try {
      await regenerateThirdPartyNotices();
    } catch {
      return null;
    }
    for (const candidate of thirdPartyNoticesCandidates()) if (existsSync(candidate)) return fs.readFile(candidate, "utf8");
  }
  return null;
}

// ---------------------------------------------------------------------------
// 远程 workspace 目录枚举（原 `OBe`/`kBe`/`ABe`/`jBe`/`UH`/`MBe`/`WH`）
// ---------------------------------------------------------------------------

/** app-server 客户端面（结构化子集）。 */
export interface DirectoryEntriesClientLike {
  hostConfig: unknown;
  platformPath(): Promise<{
    join(...parts: string[]): string;
    resolve(...parts: string[]): string;
    relative(from: string, to: string): string;
    isAbsolute(p: string): boolean;
    sep: string;
  }>;
}

interface PathPlatform {
  join(...parts: string[]): string;
  resolve(...parts: string[]): string;
  relative(from: string, to: string): string;
  isAbsolute(p: string): boolean;
  sep: string;
}

/** 目录条目（原 `ABe` 输出）。 */
export interface WorkspaceDirectoryEntry {
  isSymlink: boolean;
  name: string;
  path: string;
  type: "file" | "directory";
}

/** 路径段规范化（原 `UH`）：反斜杠 → 斜杠，剥 ./ 前缀与尾斜杠。 */
function normalizeRelativeSegment(segment: string): string {
  return segment
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/\/+$/, "");
}

/** 目录路径输入归一（原 `jBe`）：空/`.` → 空串。 */
function normalizeDirectoryInput(directoryPath: string | undefined): string {
  const trimmed = directoryPath?.trim() ?? "";
  return trimmed.length === 0 || trimmed === "." ? "" : normalizeRelativeSegment(trimmed);
}

/** 父目录（原 `MBe`）：根目录返回 null。 */
function parentDirectoryPath(directoryPath: string): string | null {
  const normalized = normalizeRelativeSegment(directoryPath);
  if (normalized.length === 0) return null;
  const segments = normalized.split("/").filter(Boolean);
  return segments.length === 1 ? "" : segments.slice(0, -1).join("/");
}

/** 越界判定（原 `WH`）。 */
function isWithinWorkspaceRoot(path: PathPlatform, targetPath: string, workspaceRoot: string): boolean {
  const relative = path.relative(workspaceRoot, targetPath);
  return !(relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative));
}

/** 解析与越界校验（原 `kBe`）：本地额外走 realpath 双重校验。 */
async function resolveDirectoryWithinRoot({
  appServerClient,
  directoryPath,
  path,
  workspaceRoot,
}: {
  appServerClient: DirectoryEntriesClientLike;
  directoryPath: string;
  path: PathPlatform;
  workspaceRoot: string;
}): Promise<{ canonicalDirectoryPath: string; realWorkspaceRoot: string; resolvedDirectoryPath: string; resolvedWorkspaceRoot: string }> {
  const resolvedWorkspaceRoot = path.resolve(workspaceRoot);
  const resolvedDirectoryPath = path.resolve(resolvedWorkspaceRoot, directoryPath);
  if (!isWithinWorkspaceRoot(path, resolvedDirectoryPath, resolvedWorkspaceRoot))
    throw new Error("directoryPath must stay within workspaceRoot");
  if (isRemoteHostConfig(appServerClient.hostConfig)) {
    return {
      canonicalDirectoryPath: normalizeRelativeSegment(path.relative(resolvedWorkspaceRoot, resolvedDirectoryPath)),
      realWorkspaceRoot: resolvedWorkspaceRoot,
      resolvedDirectoryPath,
      resolvedWorkspaceRoot,
    };
  }
  const realWorkspaceRoot = await fs.realpath(resolvedWorkspaceRoot);
  if (!isWithinWorkspaceRoot(path, await fs.realpath(resolvedDirectoryPath), realWorkspaceRoot))
    throw new Error("directoryPath must stay within workspaceRoot");
  return {
    canonicalDirectoryPath: normalizeRelativeSegment(path.relative(resolvedWorkspaceRoot, resolvedDirectoryPath)),
    realWorkspaceRoot,
    resolvedDirectoryPath,
    resolvedWorkspaceRoot,
  };
}

/** 单条目（原 `ABe`）：符号链接指向目录时展开校验，越界丢弃。 */
async function resolveDirectoryEntry({
  appServerClient,
  entry,
  path,
  realWorkspaceRoot,
  resolvedDirectoryPath,
  resolvedWorkspaceRoot,
}: {
  appServerClient: DirectoryEntriesClientLike;
  entry: { name: string; isDirectory(): boolean; isSymbolicLink?(): boolean };
  path: PathPlatform;
  realWorkspaceRoot: string;
  resolvedDirectoryPath: string;
  resolvedWorkspaceRoot: string;
}): Promise<WorkspaceDirectoryEntry | null> {
  const entryPath = path.join(resolvedDirectoryPath, entry.name);
  const isSymlink = typeof entry.isSymbolicLink === "function" && entry.isSymbolicLink();
  let type: "file" | "directory" = entry.isDirectory() ? "directory" : "file";
  if (isSymlink) {
    try {
      if ((await appServerFileSystem.stat(entryPath, appServerClient)).isDirectory()) {
        if (isRemoteHostConfig(appServerClient.hostConfig) || !isWithinWorkspaceRoot(path, await fs.realpath(entryPath), realWorkspaceRoot))
          return null;
        type = "directory";
      }
    } catch {}
  }
  return { isSymlink, name: entry.name, path: normalizeRelativeSegment(path.relative(resolvedWorkspaceRoot, entryPath)), type };
}

/**
 * 远程 workspace 目录枚举（原 `OBe`）：
 * workspaceRoot 必须存在且为目录；directoryPath 越界拒绝；符号链接展开后仍需
 * 在真实根内；目录排前 + 名称排序。
 */
export async function readWorkspaceDirectoryEntries({
  appServerClient,
  directoryPath,
  directoriesOnly,
  includeHidden,
  workspaceRoot,
}: {
  appServerClient: DirectoryEntriesClientLike;
  directoryPath: string | undefined;
  directoriesOnly?: boolean;
  includeHidden?: boolean;
  workspaceRoot: string;
}): Promise<{ directoryPath: string; entries: WorkspaceDirectoryEntry[]; parentPath: string | null }> {
  if (workspaceRoot.trim().length === 0) throw new Error("workspaceRoot is required");
  if (!(await appServerFileSystem.stat(workspaceRoot, appServerClient)).isDirectory()) throw new Error("workspaceRoot must be a directory");
  const path: PathPlatform = isRemoteHostConfig(appServerClient.hostConfig) ? await appServerClient.platformPath() : nodePath;
  const { canonicalDirectoryPath, realWorkspaceRoot, resolvedDirectoryPath, resolvedWorkspaceRoot } = await resolveDirectoryWithinRoot({
    appServerClient,
    directoryPath: normalizeDirectoryInput(directoryPath),
    path,
    workspaceRoot,
  });
  if (!(await appServerFileSystem.stat(resolvedDirectoryPath, appServerClient)).isDirectory())
    throw new Error("directoryPath must point to a directory");
  const rawEntries = await appServerFileSystem.readdir(resolvedDirectoryPath, { withFileTypes: true }, appServerClient);
  return {
    directoryPath: canonicalDirectoryPath,
    entries: (
      await Promise.all(
        rawEntries
          .filter((entry: { name: string }) => includeHidden || !entry.name.startsWith("."))
          .map((entry: { name: string; isDirectory(): boolean; isSymbolicLink?(): boolean }) =>
            resolveDirectoryEntry({ appServerClient, entry, path, realWorkspaceRoot, resolvedDirectoryPath, resolvedWorkspaceRoot }),
          ),
      )
    )
      .filter((entry): entry is WorkspaceDirectoryEntry => entry != null)
      .filter((entry) => !directoriesOnly || entry.type === "directory")
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "directory" ? -1 : 1)),
    parentPath: canonicalDirectoryPath.length === 0 ? null : parentDirectoryPath(canonicalDirectoryPath),
  };
}

/** WSL 探测（原 `GH`，模块级常量）。 */
export const IS_WSL_DISTRO = !!process.env.WSL_DISTRO_NAME;
