// 外部 Agent（Claude Code / Claude Cowork / Cursor）历史导入：provider 适配器 +
// detect/import 编排 + app-server 请求 + 完成通知等待 + 遥测 + 导入后项目收尾。
//
// 对应 main-C-Mhak1n.ts 86,196-87,722：
//   - YFe/XFe/ZFe/QFe：cowork provider 适配器（detect = 全量检测 + 市场修复；
//     import = 迁移准备 + 编排 + 历史记录）
//   - kI：迁移上下文（远程主机跳过；codexHome/options/WSL 判定）
//   - nIe/rIe：导入回调装配（forkThread/命名/projectless 目录创建/失败上报）
//   - iIe~jIe：桌面路径 → 迁移选项（Documents/userData 目录按平台推导）
//   - lIe：适配器包装（导入成功后回调 onImportedSessionThreadIds）
//   - _Ie/vIe/yIe：服务处理器（detect / import / status）
//   - bIe/xIe/RI/zI：app-server detect（claude-code/cursor）+ 项目级补查 + 分 provider 阶段遥测
//   - SIe/CIe：app-server import（externalAgentConfig/import）+ 完成通知注册表
//     （externalAgentConfig/import/completed，超时 120s）
//   - NI/mIe/PI/FI + MI/uIe/dIe：完成通知解析（失败摘要 errorType/failureStage/subErrorType 白名单）
//   - UI/DIe/OIe/WI/GI/kIe：item 归一（cursor projectless 路径识别）/迁移 item/去重
//   - AIe~LIe：导入状态文件（external_agent_session_imports.json + cowork 账本）
//   - RIe/zIe/BIe：connector 候选映射
//   - VIe：finalizeImportedProjects（canonical 归并 + 建项目 + 线程指派）
//
// 依赖约束：app-server 连接/客户端以结构化接口注入（XxxLike 惯例）；
// @chunk/shared 的 WSL/主机工具与全局状态键按压缩名导入并注释内部符号名。

import { randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { posix, win32 } from "node:path";
import {
  wf as objectSchema,
  Of as stringSchema,
  Cf as numberSchema,
  hf as arraySchema,
  Mf as jsonSchema,
  xf as looseObjectSchema,
  Es as isRemoteHostConfig,
  zi as shouldUseWslPathsForHostConfig,
  Vi as pathForAgentEnvironmentShared,
  ji as wslHostPathShared,
  Mi as wslDistroNameShared,
  $u as threadIdFromUuid,
  uu as coworkMarketplaceName,
  ta as errorAttributes,
  Lt as resolveCanonicalHostIdentities,
  Ko as compareProjectsShared,
  ca as parseStoredJson,
  iu as globalStateKeys,
  Di as appServerFileSystem,
} from "@chunk/shared";
import { createTaggedLogger } from "@chunk/logger";
import { COWORK_PROVIDER_ID, importHistoryStats, mapSpaceConfig, readImportHistory } from "./cowork-history";
import {
  type PlanItem,
  type SkippedProject,
  type DiscoveryOptions,
} from "./cowork-discovery";
import {
  type ImportCallbacks,
  type PreparedRollout,
  registerPluginMarketplace,
} from "./cowork-mcp-plugins";
import { queueCoworkDetection, runCoworkImport, itemCwds, type ImportLimits } from "./cowork-transcripts";
import { createProjectlessThreadPathsViaAppServer } from "../misc/projectless-workspace";

const logger = createTaggedLogger("external-agent-import");

// ---------------------------------------------------------------------------
// 结构化接口（AppServerConnectionLike / AppServerClientLike 惯例）
// ---------------------------------------------------------------------------

/** app-server 连接（宿主注入；方法子集）。 */
export interface AppServerConnectionLike {
  addMarketplace(request: { source: string }): Promise<unknown>;
  forkThread(request: {
    cwd: string;
    ephemeral: boolean;
    excludeTurns: boolean;
    path: string;
    threadId: string;
  }): Promise<{ thread: { ephemeral: boolean; id: string } }>;
  setThreadName(threadId: string, name: string): Promise<unknown>;
  sendAppServerRequest(method: string, params: unknown): Promise<any>;
  sendAppServerExtensionRequest(method: string, params: unknown): Promise<unknown>;
  registerInternalNotificationHandler(handler: (notification: { method: string; params?: unknown }) => void): () => void;
}

/** app-server 客户端（宿主注入；方法子集）。 */
export interface AppServerClientLike {
  hostConfig: unknown;
  codexHome(): Promise<string>;
  platformPath(): Promise<{
    join(...parts: string[]): string;
    isAbsolute(p: string): boolean;
    basename(p: string): string;
    dirname(p: string): string;
  }>;
}

/** 路径适配器：agent 环境（WSL）与桌面宿主之间的双向映射。 */
export interface PathAdapters {
  pathForAgentEnvironment(path: string, wsl: boolean): string;
  pathForDesktopHost(path: string, wsl: boolean): string;
}

/** 迁移选项解析器（宿主注入；对应桌面路径推导 iIe）。 */
export type MigrationOptionsResolver = () => DiscoveryOptions;

/** 会话限额（透传给 provider）。 */
export interface SessionLimits {
  maxSessionAgeMs?: number;
  maxSessionsPerSpace?: number;
}

/** projectless 线程登记记录（app-server import 完成通知产出）。 */
export interface ProjectlessSessionThread {
  cwd: string;
  outputDirectory: string;
  threadId: string;
  workspaceRoot: string;
}

/** provider 适配器（cowork 内建 + claude-code/cursor 走 app-server）。 */
export interface ProviderAdapter {
  detect(request: {
    hostId: string;
    includeHome: boolean;
    sessionLimits?: SessionLimits;
    workspaceRoots?: string[] | null;
  }): Promise<{ cloudSessionCount?: number; items: PlanItem[]; unsupportedProjects: Array<SkippedProject & { providerId: string }> }>;
  import(request: {
    hostId: string;
    importAttemptId: string;
    items: PlanItem[];
    sessionLimits?: SessionLimits;
  }): Promise<CoworkImportOutcome>;
}

/** cowork 导入结果（原 `QFe` 返回值）。 */
export interface CoworkImportOutcome {
  importedSessionProjectRoots: Array<{ projectRoot: string; threadId: string }>;
  importedSessionThreadIds: string[];
  projectRoots: string[];
}

/** 适配器装配依赖（原 `XFe`/`lIe` 的 e）。 */
export interface CoworkAdapterDependencies {
  getAppServerConnection(hostId: string): AppServerConnectionLike;
  getMigrationOptions: MigrationOptionsResolver;
  getRequestAppServerClient(hostId: string): AppServerClientLike;
  getConfiguredProjectlessWorkspaceRoot?(): string | null;
  pathAdapters: PathAdapters;
  recordProjectlessThread?(request: { hostId: string; outputDirectory: string; threadId: string; workspaceRoot: string }): Promise<void>;
}

// ---------------------------------------------------------------------------
// 迁移上下文（原 `kI`）
// ---------------------------------------------------------------------------

/** 迁移上下文（原 `kI`）：远程主机返回 null；codexHome 映射到桌面宿主路径。 */
async function resolveMigrationContext({
  getMigrationOptions,
  getRequestAppServerClient,
  hostId,
  pathAdapters,
  sessionLimits,
}: {
  getMigrationOptions: MigrationOptionsResolver;
  getRequestAppServerClient(hostId: string): AppServerClientLike;
  hostId: string;
  pathAdapters: PathAdapters;
  sessionLimits?: SessionLimits;
}): Promise<{ codexHome: string; options: DiscoveryOptions & ImportLimits; shouldUseWslPaths: boolean } | null> {
  const client = getRequestAppServerClient(hostId);
  if (isRemoteHostConfig(client.hostConfig)) return null;
  const wsl = shouldUseWslPathsForHostConfig(client.hostConfig);
  const defaults = getMigrationOptions();
  return {
    codexHome: pathAdapters.pathForDesktopHost(await client.codexHome(), wsl),
    options:
      sessionLimits == null
        ? defaults
        : {
            ...defaults,
            maxSessionAgeMs: sessionLimits.maxSessionAgeMs ?? (defaults as { maxSessionAgeMs?: number }).maxSessionAgeMs,
            maxSessions: sessionLimits.maxSessionsPerSpace ?? (defaults as { maxSessions?: number }).maxSessions,
          },
    shouldUseWslPaths: wsl,
  };
}

// ---------------------------------------------------------------------------
// 桌面路径适配器 + 迁移选项（原 `YFe`/`iIe`~`jIe`）
// ---------------------------------------------------------------------------

/** 桌面路径适配器（原 `YFe`）：WSL 时映射，否则原样。 */
export function createDesktopPathAdapters(): PathAdapters {
  return {
    pathForAgentEnvironment: (path, wsl) => (wsl ? pathForAgentEnvironmentShared(path) : path),
    pathForDesktopHost: (path, wsl) => (wsl ? wslHostPathShared(path, wslDistroNameShared()) : path),
  };
}

/** Electron app 路径面（注入以便测试）。 */
export interface DesktopPaths {
  getPath(name: "home" | "documents"): string;
}

/** 桌面迁移选项（原 `iIe`）：Documents + Claude userData 目录按平台推导。 */
export function desktopMigrationOptions({
  desktopPaths,
  env = process.env,
  homeDir = homedir(),
  platform = process.platform,
}: {
  desktopPaths: DesktopPaths;
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  platform?: NodeJS.Platform;
}): DiscoveryOptions & { fallbackUserDataDirs?: string[] } {
  const documentsDir = resolveDocumentsDir({ desktopPaths, homeDir, platform });
  const userDataDir = claudeUserDataDir({ env, homeDir, platform });
  return platform === "win32"
    ? {
        documentsDir,
        fallbackUserDataDirs: [userDataDir],
        homeDir,
        userDataDir: windowsAppUserDataDir({ env, homeDir }),
      }
    : { documentsDir, homeDir, userDataDir };
}

/** Documents 目录（原 `aIe`/`cIe`/`jIe`）：app.getPath 一致时才信任。 */
function resolveDocumentsDir({ desktopPaths, homeDir, platform }: { desktopPaths: DesktopPaths; homeDir: string; platform: NodeJS.Platform }): string {
  if (sameResolvedPath(homeDir, desktopPaths.getPath("home"), platform)) return desktopPaths.getPath("documents");
  return pathFor(platform).join(homeDir, "Documents");
}

/** Claude userData 目录（原 `oIe`）。 */
function claudeUserDataDir({ env, homeDir, platform }: { env: NodeJS.ProcessEnv; homeDir: string; platform: NodeJS.Platform }): string {
  if (platform === "darwin") return posix.join(homeDir, "Library", "Application Support", "Claude");
  if (platform === "win32") {
    const appData = env.APPDATA?.trim();
    return appData != null && win32.isAbsolute(appData)
      ? win32.join(appData, "Claude")
      : win32.join(windowsUserProfile({ env, homeDir }), "AppData", "Roaming", "Claude");
  }
  return posix.join(homeDir, ".config", "Claude");
}

/** Windows Store 打包形态的 userData 目录（原 `sIe`）。 */
function windowsAppUserDataDir({ env, homeDir }: { env: NodeJS.ProcessEnv; homeDir: string }): string {
  const localAppData = env.LOCALAPPDATA?.trim();
  const localRoot =
    localAppData != null && win32.isAbsolute(localAppData)
      ? localAppData
      : win32.join(windowsUserProfile({ env, homeDir }), "AppData", "Local");
  return win32.join(localRoot, "Packages", "Claude_pzs8sxrjxfjjc", "LocalCache", "Roaming", "Claude");
}

function windowsUserProfile({ env, homeDir }: { env: NodeJS.ProcessEnv; homeDir: string }): string {
  const profile = env.USERPROFILE?.trim();
  return profile != null && win32.isAbsolute(profile) ? profile : homeDir;
}

function sameResolvedPath(a: string, b: string, platform: NodeJS.Platform): boolean {
  const pathPlatform = pathFor(platform);
  const resolvedA = pathPlatform.resolve(a);
  const resolvedB = pathPlatform.resolve(b);
  return platform === "win32" ? resolvedA.toLowerCase() === resolvedB.toLowerCase() : resolvedA === resolvedB;
}

function pathFor(platform: NodeJS.Platform) {
  return platform === "win32" ? win32 : posix;
}

// ---------------------------------------------------------------------------
// cowork provider 适配器（原 `XFe`/`ZFe`/`QFe`/`$Fe`/`eIe`/`tIe`）
// ---------------------------------------------------------------------------

/** cowork provider 适配器工厂（原 `XFe`）。 */
export function createCoworkProviderAdapter(dependencies: CoworkAdapterDependencies): ProviderAdapter {
  return {
    detect: ({ hostId, includeHome, sessionLimits, workspaceRoots }) =>
      detectCoworkImports({
        getAppServerConnection: dependencies.getAppServerConnection,
        getMigrationOptions: dependencies.getMigrationOptions,
        getRequestAppServerClient: dependencies.getRequestAppServerClient,
        hostId,
        includeHome,
        pathAdapters: dependencies.pathAdapters,
        sessionLimits,
        workspaceRoots,
      }),
    import: ({ hostId, importAttemptId, items, sessionLimits }) =>
      importCoworkItems({ ...dependencies, hostId, importAttemptId, items, sessionLimits }),
  };
}

/** cowork detect（原 `ZFe`）：市场修复 + 全量检测 + 路径映射。 */
async function detectCoworkImports({
  getAppServerConnection,
  getMigrationOptions,
  getRequestAppServerClient,
  hostId,
  includeHome = true,
  pathAdapters,
  sessionLimits,
  workspaceRoots,
}: {
  getAppServerConnection(hostId: string): AppServerConnectionLike;
  getMigrationOptions: MigrationOptionsResolver;
  getRequestAppServerClient(hostId: string): AppServerClientLike;
  hostId: string;
  includeHome?: boolean;
  pathAdapters: PathAdapters;
  sessionLimits?: SessionLimits;
  workspaceRoots?: string[] | null;
}): Promise<{ cloudSessionCount?: number; items: PlanItem[]; unsupportedProjects: Array<SkippedProject & { providerId: string }> }> {
  const context = await resolveMigrationContext({
    getMigrationOptions,
    getRequestAppServerClient,
    hostId,
    pathAdapters,
    sessionLimits,
  });
  if (context == null) return { items: [], unsupportedProjects: [] };
  try {
    await registerPluginMarketplace({
      callbacks: {
        addMarketplace: (request) => getAppServerConnection(hostId).addMarketplace(request),
        pathForCodexHost: (path) => pathAdapters.pathForAgentEnvironment(path, context.shouldUseWslPaths),
      },
      codexHome: context.codexHome,
    });
  } catch (error) {
    logger.warning("external_agent_import_cowork_marketplace_repair_failed", {
      safe: { providerId: COWORK_PROVIDER_ID },
      sensitive: { error },
    });
  }
  const desktopWorkspaceRoots = workspaceRoots == null ? null : workspaceRoots.map((root) => pathAdapters.pathForDesktopHost(root, context.shouldUseWslPaths));
  const detection = await queueCoworkDetection({
    codexHome: context.codexHome,
    includeHome,
    options: context.options,
    workspaceRoots: desktopWorkspaceRoots,
  });
  return {
    cloudSessionCount: detection.cloudSessionCount,
    items: detection.items.map((item) => planItemForDetection(mapItemPaths(item, (path) => pathAdapters.pathForAgentEnvironment(path, context.shouldUseWslPaths)))),
    unsupportedProjects: detection.unsupportedProjects.map((project) => ({
      ...mapSpaceConfig(project, (path) => pathAdapters.pathForAgentEnvironment(path, context.shouldUseWslPaths)),
      providerId: COWORK_PROVIDER_ID,
    })),
  };
}

/** cowork import（原 `QFe`）：迁移编排 + 历史记录 + 结果路径映射。 */
async function importCoworkItems({
  getAppServerConnection,
  getMigrationOptions,
  getRequestAppServerClient,
  getConfiguredProjectlessWorkspaceRoot,
  hostId,
  importAttemptId,
  items,
  pathAdapters,
  recordProjectlessThread,
  sessionLimits,
}: CoworkAdapterDependencies & {
  hostId: string;
  importAttemptId: string;
  items: PlanItem[];
  pathAdapters: PathAdapters;
  sessionLimits?: SessionLimits;
}): Promise<CoworkImportOutcome> {
  const context = await resolveMigrationContext({
    getMigrationOptions,
    getRequestAppServerClient,
    hostId,
    pathAdapters,
    sessionLimits,
  });
  if (context == null) return { importedSessionProjectRoots: [], importedSessionThreadIds: [], projectRoots: [] };
  const desktopItems = items.map((item) => mapItemPaths(planItemForImport(item), (path) => pathAdapters.pathForDesktopHost(path, context.shouldUseWslPaths)));
  const connection = getAppServerConnection(hostId);
  const result = await runCoworkImport({
    callbacks: createCoworkImportCallbacks({
      appServerConnection: connection,
      appServerClient: getRequestAppServerClient(hostId),
      configuredWorkspaceRoot: getConfiguredProjectlessWorkspaceRoot?.() ?? null,
      homeDirectory: context.options.homeDir,
      hostId,
      importAttemptId,
      pathAdapters,
      recordProjectlessThread,
      shouldUseWslPaths: context.shouldUseWslPaths,
    }),
    codexHome: context.codexHome,
    items: desktopItems,
    options: context.options,
  });
  await recordCoworkImportHistory({
    appServerConnection: connection,
    importAttemptId,
    importedAgentInstructionPaths: result.importedAgentInstructionPaths,
    importedConfigSourcePaths: result.importedConfigSourcePaths,
    importedMcpServerNames: result.importedMcpServerNames,
    importedPluginNames: result.importedPluginNames,
    importedRollouts: result.importedRollouts,
    items,
    pathAdapters,
    shouldUseWslPaths: context.shouldUseWslPaths,
  });
  return {
    importedSessionProjectRoots: result.importedRollouts.flatMap(
      ({ importedThreadId, rollout }) =>
        rollout.workspaceKind === "project" && rollout.projectRoot != null
          ? [{ projectRoot: pathAdapters.pathForAgentEnvironment(rollout.projectRoot, context.shouldUseWslPaths), threadId: threadIdFromUuid(importedThreadId) }]
          : [],
    ),
    importedSessionThreadIds: result.importedRollouts.map(({ importedThreadId }) => importedThreadId),
    projectRoots: result.importedProjectRoots.map((root) => pathAdapters.pathForAgentEnvironment(root, context.shouldUseWslPaths)),
  };
}

/** item 路径映射（原 `EF`）：cwd/sourcePath/details.sessions。 */
function mapItemPaths(item: PlanItem, mapPath: (path: string) => string): PlanItem {
  return {
    ...item,
    cwd: item.cwd == null || item.cwd === "" ? item.cwd : mapPath(item.cwd),
    sourcePath: item.sourcePath == null ? undefined : mapPath(item.sourcePath),
    details:
      item.details == null
        ? null
        : {
            ...item.details,
            sessions: item.details.sessions.map((session) => ({ ...session, cwd: mapPath(session.cwd), path: mapPath(session.path) })),
          },
  };
}

/** detect 输出 item（原 `eIe`）：plugins → marketplace 形态。 */
function planItemForDetection(item: PlanItem): PlanItem {
  return {
    ...item,
    details:
      item.details == null
        ? null
        : {
            ...item.details,
            skills: [],
            plugins:
              item.details.plugins.length === 0
                ? []
                : [{ marketplaceName: coworkMarketplaceName, pluginNames: item.details.plugins.map((plugin) => (plugin as { name: string }).name) }],
          },
  };
}

/** import 输入 item（原 `tIe`）：marketplace 形态 → 扁平 plugin 名。 */
function planItemForImport(item: PlanItem): PlanItem {
  if (item.details == null) return { ...item, details: null };
  const { skills: _skills, ...rest } = item.details;
  return {
    ...item,
    details: {
      ...rest,
      plugins: item.details.plugins.flatMap((plugin) =>
        ((plugin as { pluginNames?: string[] }).pluginNames ?? []).map((name) => ({ name })),
      ),
    },
  };
}

/** 导入历史条目类型（原 `$Fe`：PlanItem 类型 + MCP_SERVER_CONFIG）。 */
type HistoryItemType = PlanItem["itemType"] | "MCP_SERVER_CONFIG";

/** 导入历史条目（原 `$Fe` 的 d 数组元素）。 */
type HistoryEntry = { cwd: string | null; itemType: HistoryItemType; source: string | null; target: string | null; title: string | null };

/** 导入历史记录（原 `$Fe`）：externalAgentConfig/import/recordHistory（失败仅告警）。 */
async function recordCoworkImportHistory({
  appServerConnection,
  importAttemptId,
  importedAgentInstructionPaths,
  importedConfigSourcePaths,
  importedMcpServerNames,
  importedPluginNames,
  importedRollouts,
  items,
  pathAdapters,
  shouldUseWslPaths,
}: {
  appServerConnection: AppServerConnectionLike;
  importAttemptId: string;
  importedAgentInstructionPaths: Array<{ cwd: string; target: string }>;
  importedConfigSourcePaths: string[];
  importedMcpServerNames: string[];
  importedPluginNames: string[];
  importedRollouts: Array<{ importedThreadId: string; rollout: PreparedRollout }>;
  items: PlanItem[];
  pathAdapters: PathAdapters;
  shouldUseWslPaths: boolean;
}): Promise<void> {
  const sessionEntries: HistoryEntry[] = importedRollouts.map(({ importedThreadId, rollout }): HistoryEntry => ({
    cwd: pathAdapters.pathForAgentEnvironment(rollout.cwd, shouldUseWslPaths),
    itemType: "SESSIONS",
    source: pathAdapters.pathForAgentEnvironment(rollout.sourceJsonlPath, shouldUseWslPaths),
    target: importedThreadId,
    title: rollout.title ?? null,
  }));
  const entries: HistoryEntry[] = [
    ...importedAgentInstructionPaths.map(({ cwd, target }): HistoryEntry => ({
      cwd: pathAdapters.pathForAgentEnvironment(cwd, shouldUseWslPaths),
      itemType: "AGENTS_MD",
      source: pathAdapters.pathForAgentEnvironment(cwd, shouldUseWslPaths),
      target: pathAdapters.pathForAgentEnvironment(target, shouldUseWslPaths),
      title: null,
    })),
    ...importedConfigSourcePaths.map((path): HistoryEntry => ({
      cwd: null,
      itemType: "CONFIG",
      source: pathAdapters.pathForAgentEnvironment(path, shouldUseWslPaths),
      target: null,
      title: null,
    })),
    ...importedMcpServerNames.map((name): HistoryEntry => ({ cwd: null, itemType: "MCP_SERVER_CONFIG", source: name, target: name, title: null })),
    ...importedPluginNames.map((name): HistoryEntry => ({ cwd: null, itemType: "PLUGINS", source: name, target: name, title: null })),
    ...sessionEntries,
  ];
  const itemTypes = new Set<HistoryItemType>(items.map((item) => item.itemType));
  for (const entry of entries) itemTypes.add(entry.itemType);
  const itemTypeResults = [...itemTypes].map((itemType) => ({
    failures: [] as unknown[],
    itemType,
    successes: entries.filter((entry) => entry.itemType === itemType),
  }));
  if (itemTypeResults.length !== 0) {
    try {
      await appServerConnection.sendAppServerExtensionRequest("externalAgentConfig/import/recordHistory", {
        itemTypeResults,
        providerId: COWORK_PROVIDER_ID,
      });
    } catch (error) {
      logger.warning("external_agent_import_history_record_failed", {
        safe: { importAttemptId, providerId: COWORK_PROVIDER_ID },
        sensitive: { error },
      });
    }
  }
}

// ---------------------------------------------------------------------------
// 导入回调装配（原 `nIe`/`rIe`）
// ---------------------------------------------------------------------------

/** cowork 导入回调装配（原 `nIe`）：慢操作（≥1s）遥测 + 各宿主桥接。 */
function createCoworkImportCallbacks({
  appServerConnection,
  appServerClient,
  configuredWorkspaceRoot,
  homeDirectory,
  hostId,
  importAttemptId,
  pathAdapters,
  recordProjectlessThread,
  shouldUseWslPaths,
}: {
  appServerConnection: AppServerConnectionLike;
  appServerClient: AppServerClientLike;
  configuredWorkspaceRoot: string | null;
  homeDirectory: string | null;
  hostId: string;
  importAttemptId: string;
  pathAdapters: PathAdapters;
  recordProjectlessThread?: CoworkAdapterDependencies["recordProjectlessThread"];
  shouldUseWslPaths: boolean;
}): ImportCallbacks {
  async function timedOperation<T>(operation: string, run: () => Promise<T>): Promise<T> {
    const startedAt = Date.now();
    try {
      const result = await run();
      const durationMs = Date.now() - startedAt;
      if (durationMs >= 1_000) {
        logger.info("external_agent_import_cowork_operation_finished", {
          safe: { durationMs, importAttemptId, operation, providerId: COWORK_PROVIDER_ID, status: "success" },
        });
      }
      return result;
    } catch (error) {
      const attributes = errorAttributes(error) as Record<string, unknown>;
      logger.warning("external_agent_import_cowork_operation_finished", {
        safe: {
          durationMs: Date.now() - startedAt,
          failureCategory: attributes["codex.outcome"] === "canceled" ? "canceled" : attributes["error.category"],
          importAttemptId,
          operation,
          providerId: COWORK_PROVIDER_ID,
          status: "failure",
        },
        sensitive: { error },
      });
      throw error;
    }
  }
  return {
    addMarketplace: (request) => appServerConnection.addMarketplace(request),
    createProjectlessThreadPaths: async (candidate) => {
      const paths = await createProjectlessThreadPathsViaAppServer({
        appServerClient,
        configuredWorkspaceRoot,
        createSplitDirectories: true,
        homeDirectory: resolveHomeDirectory({ appServerClient, homeDirectory, pathAdapters, shouldUseWslPaths }),
        prompt: candidate.title ?? "",
      });
      return {
        cwd: pathAdapters.pathForDesktopHost(paths.cwd, shouldUseWslPaths),
        outputDirectory: pathAdapters.pathForDesktopHost(paths.outputDirectory, shouldUseWslPaths),
        workspaceRoot: pathAdapters.pathForDesktopHost(paths.workspaceRoot, shouldUseWslPaths),
      };
    },
    forkThread: async (request) => {
      const forked = await timedOperation("thread/fork", () => appServerConnection.forkThread({ ...request, excludeTurns: true }));
      return { ephemeral: forked.thread.ephemeral, threadId: forked.thread.id };
    },
    pathForCodexHost: (path) => pathAdapters.pathForAgentEnvironment(path, shouldUseWslPaths),
    reportSessionImportError: ({ error, session }) => {
      logger.warning("external_agent_import_cowork_session_failed", {
        safe: { importAttemptId, providerId: COWORK_PROVIDER_ID },
        sensitive: { error, sourceId: session.sourceId, sourceJsonlPath: session.sourceJsonlPath },
      });
    },
    recordProjectlessThread:
      recordProjectlessThread == null
        ? undefined
        : async ({ outputDirectory, threadId, workspaceRoot }) => {
            await recordProjectlessThread({ hostId, outputDirectory, threadId, workspaceRoot });
          },
    setThreadName: async ({ name, threadId }) => {
      await timedOperation("thread/name/set", () => appServerConnection.setThreadName(threadId, name));
    },
  };
}

/** projectless 主目录解析（原 `rIe`）：迁移选项优先，回退 hostConfig.home_dir。 */
function resolveHomeDirectory({
  appServerClient,
  homeDirectory,
  pathAdapters,
  shouldUseWslPaths,
}: {
  appServerClient: AppServerClientLike;
  homeDirectory: string | null;
  pathAdapters: PathAdapters;
  shouldUseWslPaths: boolean;
}): string {
  if (homeDirectory != null && homeDirectory !== "") return pathAdapters.pathForAgentEnvironment(homeDirectory, shouldUseWslPaths);
  const hostHome = (appServerClient.hostConfig as { home_dir?: string } | null)?.home_dir;
  if (hostHome == null || hostHome === "") throw new Error("Projectless Cowork import requires a home directory");
  return hostHome;
}

// ---------------------------------------------------------------------------
// 适配器包装（原 `lIe`）
// ---------------------------------------------------------------------------

/** 适配器包装（原 `lIe`）：注入桌面路径推导 + 导入线程回调。 */
export function createExternalAgentImportAdapter(
  dependencies: CoworkAdapterDependencies & {
    desktopPaths: DesktopPaths;
    onImportedSessionThreadIds?(threadIds: string[]): void;
  },
): ProviderAdapter {
  const { onImportedSessionThreadIds, ...rest } = dependencies;
  const adapter = createCoworkProviderAdapter({
    ...rest,
    getMigrationOptions: () => desktopMigrationOptions({ desktopPaths: dependencies.desktopPaths }),
  });
  return {
    ...adapter,
    import: async (request) => {
      const result = await adapter.import(request);
      if (result.importedSessionThreadIds.length > 0) onImportedSessionThreadIds?.(result.importedSessionThreadIds);
      return result;
    },
  };
}

// ---------------------------------------------------------------------------
// 完成通知解析（原 `MI`/`uIe`/`dIe`/`fIe`/`pIe`/`NI`/`mIe`/`PI`/`FI`）
// ---------------------------------------------------------------------------

const FAILURE_STAGES = wordSet(
  "import import_request_failed plugin_import",
  "session_missing session_permit session_persist session_prepare",
);
const FAILURE_ERROR_TYPES = new Set([
  ...FAILURE_STAGES,
  ...wordSet(
    "config external_agent_config_import_error invalid_existing_config",
    "invalid_marketplace_file invalid_plugin join marketplace_add_internal",
    "marketplace_add_invalid_request marketplace_config_reload marketplace_io",
    "marketplace_manifest_missing marketplace_not_found marketplace_source_missing",
    "plugin_not_available plugin_not_found plugins_disabled",
    "remote_mutation_unexpected_status store_invalid store_io",
  ),
]);
const FAILURE_SUB_ERROR_TYPES = new Set([
  ...wordSet(
    "disabled_by_admin failed_to_copy_plugin_file failed_to_enable_plugin",
    "failed_to_load_session_config failed_to_read_marketplace_file",
    "install_policy_not_available plugin_install_task_failed session_not_detected",
  ),
  ...["401", "403", "404", "409", "429", "5xx", "other"].map((code) => `http_${code}`),
  ..."already_exists file_too_large invalid_data invalid_input is_a_directory not_a_directory not_found other permission_denied quota_exceeded read_only_filesystem storage_full timed_out unexpected_eof write_zero"
    .split(" ")
    .flatMap((kind) => [`failed_to_load_session_config_${kind}`]),
]);

function wordSet(...groups: string[]): Set<string> {
  return new Set(groups.flatMap((group) => group.split(" ")));
}

const importCompletionSchema = (looseObjectSchema({
  importId: stringSchema(),
  itemTypeResults: arraySchema(
    (looseObjectSchema({
      itemType: stringSchema(),
      successes: arraySchema(
        (looseObjectSchema({
          itemType: stringSchema(),
          cwd: stringSchema().nullable(),
          source: stringSchema().nullable(),
          target: stringSchema().nullable(),
        }) as unknown as { loose(): unknown }).loose(),
      ),
      failures: arraySchema(jsonSchema()),
    }) as unknown as { loose(): unknown }).loose(),
  ),
}) as unknown as { loose(): unknown }).loose();

const failureSummarySchema = (looseObjectSchema({
  errorType: stringSchema().nullish(),
  failureStage: stringSchema().nullish(),
  subErrorType: stringSchema().nullish(),
}) as unknown as { loose(): unknown }).loose();

interface ImportCompletion {
  importId: string;
  itemTypeResults: Array<{
    itemType: string;
    successes: Array<{ itemType: string; cwd: string | null; source: string | null; target: string | null } & Record<string, unknown>>;
    failures: unknown[];
  }>;
}

/** 完成通知解析（原 `NI`）：失败摘要 + SESSIONS target 收集。 */
function parseImportCompletion(params: unknown): (ImportCompletion & {
  failureSummary: { errorType: string; failureStage: string; subErrorType: string } | null;
  importedSessionThreadIds: string[];
}) | null {
  const parsed = (importCompletionSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: ImportCompletion } }).safeParse(params);
  if (!parsed.success) return null;
  const completion = parsed.data!;
  const failing = completion.itemTypeResults.find((result) => result.failures.length > 0);
  return {
    ...completion,
    failureSummary: failing && parseFailureSummary(failing.failures[0]),
    importedSessionThreadIds: [
      ...new Set(
        completion.itemTypeResults.flatMap((result) =>
          result.successes.flatMap((success) =>
            result.itemType !== "SESSIONS" || success.itemType !== "SESSIONS" || success.target == null || success.target === ""
              ? []
              : [success.target],
          ),
        ),
      ),
    ],
  };
}

/** 失败摘要（原 `mIe`）：白名单外的错误码归 unknown。 */
function parseFailureSummary(failure: unknown): { errorType: string; failureStage: string; subErrorType: string } {
  const parsed = (failureSummarySchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { errorType?: string; failureStage?: string; subErrorType?: string } } }).safeParse(failure);
  const { errorType, failureStage, subErrorType } = parsed.success && parsed.data ? parsed.data : ({} as { errorType?: string; failureStage?: string; subErrorType?: string });
  return {
    errorType: classifyEnum(errorType ?? failureStage, FAILURE_ERROR_TYPES),
    failureStage: classifyEnum(failureStage, FAILURE_STAGES),
    subErrorType: classifyEnum(subErrorType, FAILURE_SUB_ERROR_TYPES),
  };
}

function classifyEnum(value: string | undefined, allowed: Set<string>): string {
  return value != null && allowed.has(value) ? value : "unknown";
}

// ---------------------------------------------------------------------------
// 服务处理器（原 `_Ie`/`vIe`/`yIe`）
// ---------------------------------------------------------------------------

/** 服务依赖（原 `_Ie` 的 e）。 */
export interface ExternalAgentImportService {
  getAppServerConnection(hostId: string): AppServerConnectionLike;
  getRequestAppServerClient(hostId: string): AppServerClientLike;
  providerAdapters?: Record<string, ProviderAdapter | undefined>;
  finalizeImportedProjects(result: ImportResultSummary, projectId: string | null): Promise<string[]>;
  getStatus(request: { hostId: string; providers: string[] }): Promise<unknown>;
}

/** import 结果摘要（原 `yIe` 返回值）。 */
export interface ImportResultSummary {
  allImportedSessionThreadIds: string[];
  importedSessionProjectRoots: Array<{ projectRoot: string; threadId: string }>;
  importedSessionThreadIds: string[];
  projectRoots: string[];
}

/** 服务处理器工厂（原 `_Ie`）。 */
export function createExternalAgentImportHandlers(service: ExternalAgentImportService) {
  return {
    "external-agent-import-detect": ({
      detectionId,
      hostId,
      includeHome,
      providers,
      sessionLimits,
      workspaceRoots,
    }: {
      detectionId?: string;
      hostId: string;
      includeHome?: boolean;
      providers: string[];
      sessionLimits?: SessionLimits;
      workspaceRoots?: string[] | null;
    }) =>
      runExternalAgentDetection({
        detectionId,
        getAppServerConnection: service.getAppServerConnection,
        hostId,
        includeHome,
        providerAdapters: service.providerAdapters,
        providers,
        sessionLimits,
        workspaceRoots,
      }),
    "external-agent-import-import": async (request: {
      hostId: string;
      importAttemptId?: string;
      items: PlanItem[];
      projectId: string | null;
      createProjectlessThreadPaths?: ImportCallbacks["createProjectlessThreadPaths"];
      providerAdapters?: Record<string, ProviderAdapter | undefined>;
      recordProjectlessThread?: (thread: ProjectlessSessionThread) => Promise<void>;
      sessionLimits?: SessionLimits;
    }) => {
      const importAttemptId = request.importAttemptId ?? randomUUID();
      const result = await runExternalAgentImport({
        createProjectlessThreadPaths: request.createProjectlessThreadPaths,
        getAppServerConnection: service.getAppServerConnection,
        hostId: request.hostId,
        importAttemptId,
        items: request.items,
        providerAdapters: request.providerAdapters ?? service.providerAdapters,
        recordProjectlessThread: request.recordProjectlessThread,
        sessionLimits: request.sessionLimits,
      });
      let importedProjectIds: string[] = [];
      try {
        importedProjectIds = await service.finalizeImportedProjects(result, request.projectId);
      } catch (error) {
        logger.warning("external_agent_import_project_finalization_failed", {
          safe: { importAttemptId },
          sensitive: { error },
        });
      }
      return {
        importedProjectIds,
        importedSessionThreadIds: result.importedSessionThreadIds,
        projectRoots: result.projectRoots,
      };
    },
    "external-agent-import-status": (request: { hostId: string; providers: string[] }) => service.getStatus(request),
  } as Record<string, unknown>;
}

/** 全 provider detect（原 `vIe`）：仅本地主机；claude-cowork 走适配器，其余走 app-server。 */
async function runExternalAgentDetection({
  detectionId,
  getAppServerConnection,
  hostId,
  includeHome = true,
  providerAdapters,
  providers,
  sessionLimits,
  workspaceRoots,
}: {
  detectionId?: string;
  getAppServerConnection(hostId: string): AppServerConnectionLike;
  hostId: string;
  includeHome?: boolean;
  providerAdapters?: Record<string, ProviderAdapter | undefined>;
  providers: string[];
  sessionLimits?: SessionLimits;
  workspaceRoots?: string[] | null;
}): Promise<{ items: PlanItem[]; unsupportedProjects: Array<SkippedProject & { providerId: string }> }> {
  if (hostId !== "local") throw new Error("External agent import is only supported on the local host");
  const startedAt = Date.now();
  try {
    const providerIds = [...new Set(providers)];
    const coworkAdapter = providerAdapters?.[COWORK_PROVIDER_ID];
    const stageResults = await Promise.all(
      providerIds.map(async (providerId) =>
        providerId === COWORK_PROVIDER_ID
          ? coworkAdapter == null || (!includeHome && workspaceRoots == null)
            ? { providerId, status: "unavailable" as const }
            : runDetectStage({
                detect: () => coworkAdapter.detect({ hostId, includeHome, sessionLimits, workspaceRoots }),
                providerId,
                stage: "detect",
              })
          : runDetectStage({
              detect: () =>
                detectViaAppServer({
                  getAppServerConnection,
                  hostId,
                  includeHome,
                  providerId,
                  workspaceRoots,
                }),
              providerId,
              stage: "detect",
            }),
      ),
    );
    const rootItems = stageResults.flatMap((result) => (result.status === "success" ? result.detection.items : []));
    const enrichedResults =
      includeHome && workspaceRoots == null && itemCwds(rootItems).length > 0
        ? await Promise.all(
            stageResults.map(async (result) => {
              const { providerId } = result;
              if (result.status !== "success" || !usesProjectDetection(providerId)) return result;
              const projectDetection = await runDetectStage({
                detect: async () => ({
                  items: await detectProjectItems({
                    getAppServerConnection,
                    hostId,
                    items: result.detection.items,
                    providerId,
                    rootItems,
                  }),
                }),
                providerId,
                stage: "detect_project_items",
              });
              return projectDetection.status === "failure" ? result : projectDetection;
            }),
          )
        : stageResults;
    const items = enrichedResults.flatMap((result) => (result.status === "success" ? result.detection.items : []));
    const unsupportedProjects = enrichedResults.flatMap((result) => (result.status === "success" ? result.detection.unsupportedProjects : []));
    if (items.length === 0 && unsupportedProjects.length === 0) {
      const failure = enrichedResults.find((result) => result.status === "failure");
      if (failure?.status === "failure") throw failure.error;
    }
    const detection = { items, unsupportedProjects };
    const telemetry = itemTelemetry(detection.items);
    logger.info("external_agent_import_detect_finished", {
      safe: {
        status: "success",
        durationMs: Date.now() - startedAt,
        includeHome,
        requestedProviderIds: providers.join(","),
        unsupportedProjectCount: detection.unsupportedProjects.length,
        workspaceRootCount: workspaceRoots?.length ?? 0,
        ...telemetry,
      },
    });
    if (detectionId != null) {
      logger.info("tmp_external_agent_detect_host_finished", {
        safe: {
          detectionId,
          detectedProviderIds: telemetry.providerIds,
          durationMs: Date.now() - startedAt,
          itemCount: telemetry.itemCount,
          source: "onboarding_prefetch",
          status: "success",
          unsupportedProjectCount: detection.unsupportedProjects.length,
          workspaceRootCount: workspaceRoots?.length ?? 0,
          claudeCodeItemCount: telemetry.claudeCodeItemCount,
          claudeCoworkItemCount: telemetry.claudeCoworkItemCount,
        },
      });
    }
    return detection;
  } catch (error) {
    logger.warning("external_agent_import_detect_finished", {
      safe: {
        status: "failure",
        durationMs: Date.now() - startedAt,
        failureKind: "detect_failed",
        includeHome,
        requestedProviderIds: providers.join(","),
        workspaceRootCount: workspaceRoots?.length ?? 0,
      },
      sensitive: { error },
    });
    if (detectionId != null) {
      logger.warning("tmp_external_agent_detect_host_finished", {
        safe: {
          detectionId,
          durationMs: Date.now() - startedAt,
          source: "onboarding_prefetch",
          status: "failure",
          workspaceRootCount: workspaceRoots?.length ?? 0,
        },
        sensitive: { error },
      });
    }
    throw error;
  }
}

/** 全 provider import（原 `yIe`）：claude-code/cursor 走 app-server，cowork 走适配器。 */
async function runExternalAgentImport({
  createProjectlessThreadPaths,
  getAppServerConnection,
  hostId,
  importAttemptId = randomUUID(),
  items,
  providerAdapters,
  recordProjectlessThread,
  sessionLimits,
}: {
  createProjectlessThreadPaths?: ImportCallbacks["createProjectlessThreadPaths"];
  getAppServerConnection(hostId: string): AppServerConnectionLike;
  hostId: string;
  importAttemptId?: string;
  items: PlanItem[];
  providerAdapters?: Record<string, ProviderAdapter | undefined>;
  recordProjectlessThread?: (thread: ProjectlessSessionThread) => Promise<void>;
  sessionLimits?: SessionLimits;
}): Promise<ImportResultSummary> {
  if (hostId !== "local") throw new Error("External agent import is only supported on the local host");
  if (items.length === 0)
    return { allImportedSessionThreadIds: [], importedSessionProjectRoots: [], importedSessionThreadIds: [], projectRoots: [] };
  const startedAt = Date.now();
  const coworkItems = items.filter(isCoworkItem);
  const coworkAdapter = providerAdapters?.[COWORK_PROVIDER_ID];
  const selectedSessionCount = itemTelemetry(items, "import").sessionCount;
  let failedProviderId: string | null = null;
  const projectRoots = new Set<string>();
  const threadProjectRoots = new Map<string, string>();
  const importedThreadIds = new Set<string>();
  let failedItemCount: number | undefined;
  let failedPluginCount: number | undefined;
  let failedSessionCount: number | undefined;
  let successfulItemCount: number | undefined;
  let successfulSessionCount: number | undefined;
  try {
    for (const providerId of APP_SERVER_PROVIDERS) {
      const providerItems = items.filter((item) => item.providerId === providerId);
      if (providerItems.length === 0) continue;
      failedProviderId = providerId;
      await runImportStage({
        importItems: async () => {
          const result = await importViaAppServer({
            appServerConnection: getAppServerConnection(hostId),
            createProjectlessThreadPaths,
            importAttemptId,
            items: providerItems,
            providerId,
            recordProjectlessThread,
          });
          for (const root of result.projectRoots) projectRoots.add(root);
          for (const { projectRoot, threadId } of result.importedSessionProjectRoots) threadProjectRoots.set(threadId, projectRoot);
          for (const threadId of result.importedSessionThreadIds) importedThreadIds.add(threadId);
          failedItemCount = (failedItemCount ?? 0) + result.failedItemCount;
          failedPluginCount = (failedPluginCount ?? 0) + result.failedPluginCount;
          failedSessionCount = (failedSessionCount ?? 0) + result.failedSessionCount;
          successfulItemCount = (successfulItemCount ?? 0) + result.successfulItemCount;
          successfulSessionCount = (successfulSessionCount ?? 0) + result.successfulSessionCount;
          return result;
        },
        importAttemptId,
        items: providerItems,
        providerId,
      });
    }
    let coworkResult: CoworkImportOutcome | undefined;
    if (coworkItems.length > 0 && coworkAdapter != null) {
      failedProviderId = COWORK_PROVIDER_ID;
      coworkResult = await runImportStage({
        importItems: () => coworkAdapter.import({ hostId, importAttemptId, items: coworkItems, sessionLimits }),
        importAttemptId,
        items: coworkItems,
        providerId: COWORK_PROVIDER_ID,
      });
    }
    for (const threadId of coworkResult?.importedSessionThreadIds ?? []) importedThreadIds.add(threadId);
    for (const { projectRoot, threadId } of coworkResult?.importedSessionProjectRoots ?? []) threadProjectRoots.set(threadId, projectRoot);
    const summary: ImportResultSummary = {
      allImportedSessionThreadIds: [...importedThreadIds],
      importedSessionProjectRoots: Array.from(threadProjectRoots, ([threadId, projectRoot]) => ({ projectRoot, threadId })),
      importedSessionThreadIds: [...importedThreadIds],
      projectRoots: [...new Set([...projectRoots, ...(coworkResult?.projectRoots ?? [])])],
    };
    let terminalOutcome: "success" | "partial" | "failure" | undefined;
    if (failedItemCount != null && failedItemCount > 0) {
      if ((successfulItemCount ?? 0) > 0 || importedThreadIds.size > 0) terminalOutcome = "partial";
      else if (coworkItems.length === 0) terminalOutcome = "failure";
    } else if (failedItemCount === 0 && (successfulItemCount ?? 0) > 0 && coworkItems.length === 0 && (selectedSessionCount === 0 || importedThreadIds.size > 0)) {
      terminalOutcome = "success";
    }
    const status = failedItemCount != null && failedItemCount > 0 ? "failure" : "success";
    const telemetryPayload = {
      safe: {
        status,
        durationMs: Date.now() - startedAt,
        durableImportedSessionCount: importedThreadIds.size,
        failedItemCount,
        failedPluginCount,
        failedSessionCount,
        importAttemptId,
        importedSessionCount: summary.importedSessionThreadIds.length,
        projectRootsReturnedCount: summary.projectRoots.length,
        selectedSessionCount,
        successfulSessionCount: coworkItems.length === 0 && successfulSessionCount != null && successfulSessionCount <= selectedSessionCount ? successfulSessionCount : undefined,
        terminalOutcome,
        ...itemTelemetry(items, "import"),
      },
    };
    if (status === "failure") logger.warning("external_agent_import_finished", telemetryPayload);
    else logger.info("external_agent_import_finished", telemetryPayload);
    return summary;
  } catch (error) {
    logger.warning("external_agent_import_finished", {
      safe: {
        status: "failure",
        durationMs: Date.now() - startedAt,
        durableImportedSessionCount: importedThreadIds.size || undefined,
        failedProviderId,
        failureKind: providerFailureKind(failedProviderId),
        importAttemptId,
        selectedSessionCount,
        successfulSessionCount: coworkItems.length === 0 && successfulSessionCount != null && successfulSessionCount <= selectedSessionCount ? successfulSessionCount : undefined,
        terminalOutcome: (successfulItemCount ?? 0) > 0 || importedThreadIds.size > 0 ? "partial" : undefined,
        ...itemTelemetry(items, "import"),
      },
      sensitive: { error },
    });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// app-server detect / import（原 `bIe`/`xIe`/`SIe`/`CIe`）
// ---------------------------------------------------------------------------

const COMPLETION_TIMEOUT_MS = 120_000;
const CURSOR_MIGRATION_SOURCE = "cursor";
const APP_SERVER_PROVIDERS = ["claude-code", "cursor"];

/** app-server detect（原 `bIe`）：externalAgentConfig/detect。 */
async function detectViaAppServer({
  getAppServerConnection,
  hostId,
  includeHome,
  providerId,
  workspaceRoots,
}: {
  getAppServerConnection(hostId: string): AppServerConnectionLike;
  hostId: string;
  includeHome: boolean;
  providerId: string;
  workspaceRoots?: string[] | null;
}): Promise<{ items: PlanItem[]; unsupportedProjects: [] }> {
  if (!includeHome && workspaceRoots == null) return { items: [], unsupportedProjects: [] };
  const connection = getAppServerConnection(hostId);
  const params = {
    includeHome,
    ...(workspaceRoots == null ? {} : { cwds: workspaceRoots }),
    ...(providerId === "cursor" ? { migrationSource: CURSOR_MIGRATION_SOURCE } : {}),
  };
  const response = (await connection.sendAppServerRequest("externalAgentConfig/detect", params)) as { items: Array<Record<string, unknown>> };
  return {
    items: response.items.map((item) => normalizeDetectedItem(item, providerId)),
    unsupportedProjects: [],
  };
}

/** 项目级补查（原 `xIe`）：root items 的 cwd 再次 detect（includeHome=false）。 */
async function detectProjectItems({
  getAppServerConnection,
  hostId,
  items,
  providerId,
  rootItems,
}: {
  getAppServerConnection(hostId: string): AppServerConnectionLike;
  hostId: string;
  items: PlanItem[];
  providerId: string;
  rootItems: PlanItem[];
}): Promise<PlanItem[]> {
  const cwds = itemCwds(rootItems);
  if (cwds.length === 0) return items;
  const params = { includeHome: false, cwds, ...(providerId === "cursor" ? { migrationSource: CURSOR_MIGRATION_SOURCE } : {}) };
  const response = (await getAppServerConnection(hostId).sendAppServerRequest("externalAgentConfig/detect", params)) as { items: Array<Record<string, unknown>> };
  return dedupeItems([...items, ...response.items.map((item) => normalizeDetectedItem(item, providerId))]);
}

/** app-server import（原 `SIe`）：externalAgentConfig/import + 完成通知等待。 */
async function importViaAppServer({
  appServerConnection,
  createProjectlessThreadPaths,
  importAttemptId,
  items,
  providerId,
  recordProjectlessThread,
}: {
  appServerConnection: AppServerConnectionLike;
  createProjectlessThreadPaths?: ImportCallbacks["createProjectlessThreadPaths"];
  importAttemptId: string;
  items: PlanItem[];
  providerId: string;
  recordProjectlessThread?: (thread: ProjectlessSessionThread) => Promise<void>;
}): Promise<{
  failedItemCount: number;
  failedPluginCount: number;
  failedSessionCount: number;
  failureSummary: { errorType: string; failureStage: string; subErrorType: string } | null;
  importedSessionProjectRoots: Array<{ projectRoot: string; threadId: string }>;
  importedSessionThreadIds: string[];
  projectlessSessionThreads: Array<{ cwd: string; outputDirectory: string; threadId: string; workspaceRoot: string }>;
  projectRoots: string[];
  successfulItemCount: number;
  successfulSessionCount: number;
}> {
  const projectlessThreadBySessionKey = new Map<string, { cwd: string; outputDirectory: string; workspaceRoot: string }>();
  const preparedItems = await Promise.all(
    items.map(async (item) => {
      if (providerId !== "cursor" || item.details == null) return item;
      const sessions = await Promise.all(
        item.details.sessions.map(async (session) => {
          if (session.workspaceKind !== "projectless") return session;
          const paths = await createProjectlessThreadPaths?.({ title: session.title });
          if (paths == null) throw new Error("Cursor projectless session import requires projectless thread paths");
          const sessionKey = cursorProjectlessSessionKey(session.path);
          if (sessionKey == null) throw new Error("Invalid Cursor projectless session path");
          projectlessThreadBySessionKey.set(sessionKey, paths);
          return { ...session, cwd: paths.cwd };
        }),
      );
      return { ...item, details: { ...item.details, sessions } };
    }),
  );
  const projectlessThreadByCwd = new Map<string, { cwd: string; outputDirectory: string; workspaceRoot: string }>();
  for (const paths of projectlessThreadBySessionKey.values()) projectlessThreadByCwd.set(paths.cwd, paths);
  const migrationItems = preparedItems.map(toMigrationItem);
  const sessionCwdByPath = new Map(
    preparedItems.flatMap((item) =>
      (item.details?.sessions ?? []).filter((session) => session.workspaceKind !== "projectless").map((session) => [session.path, session.cwd] as const),
    ),
  );
  const allSessions = preparedItems.flatMap((item) => item.details?.sessions ?? []);
  const projectSessionCwds = [...new Set(allSessions.filter((session) => session.workspaceKind !== "projectless").map((session) => session.cwd))];
  const registry = createImportCompletionRegistry(appServerConnection, projectlessThreadByCwd, projectlessThreadBySessionKey, sessionCwdByPath);
  try {
    const request = {
      migrationItems,
      migrationSource: providerId === "cursor" ? CURSOR_MIGRATION_SOURCE : undefined,
      providerId,
      source: "app",
    };
    const requestStartedAt = Date.now();
    let importId: string;
    try {
      ({ importId } = (await appServerConnection.sendAppServerRequest("externalAgentConfig/import", request)) as { importId: string });
    } catch (error) {
      logger.warning("external_agent_import_app_server_request_finished", {
        safe: {
          status: "failure",
          durationMs: Date.now() - requestStartedAt,
          failureCategory: failureCategory(error),
          failurePhase: "app_server_request",
          importAttemptId,
          providerId,
          ...itemTelemetry(items, "import"),
        },
        sensitive: { error },
      });
      throw error;
    }
    const requestDurationMs = Date.now() - requestStartedAt;
    const completionStartedAt = Date.now();
    const sessionCount = migrationItems.reduce(
      (sum, item) => sum + (item.itemType === "SESSIONS" ? (item.details?.sessions.length ?? 0) : 0),
      0,
    );
    let failurePhase = "completion_wait";
    try {
      const completion = await registry.waitFor(importId);
      failurePhase = "record_projectless_thread";
      await Promise.all(completion.projectlessSessionThreads.map((thread) => recordProjectlessThread?.(thread)));
      let itemOutcome: "success" | "partial" | "all_failed" | undefined;
      if (completion.failedItemCount > 0) itemOutcome = completion.successfulItemCount === 0 ? "all_failed" : "partial";
      else if (completion.successfulItemCount > 0) itemOutcome = "success";
      logger.info("external_agent_import_session_completion_finished", {
        safe: {
          status: "success",
          durationMs: Date.now() - completionStartedAt,
          failedItemCount: completion.failedItemCount,
          failedPluginCount: completion.failedPluginCount,
          failedSessionCount: completion.failedSessionCount,
          failureErrorType: completion.failureSummary?.errorType,
          failureStage: completion.failureSummary?.failureStage,
          failureSubErrorType: completion.failureSummary?.subErrorType,
          importAttemptId,
          importId,
          itemOutcome,
          providerId,
          requestDurationMs,
          sessionCount,
          successfulItemCount: completion.successfulItemCount,
          successfulSessionCount: completion.successfulSessionCount,
        },
      });
      return {
        ...completion,
        projectRoots:
          completion.successfulSessionCount === allSessions.length
            ? [...new Set([...completion.projectRoots, ...projectSessionCwds])]
            : completion.projectRoots,
      };
    } catch (error) {
      logger.warning("external_agent_import_session_completion_finished", {
        safe: {
          status: "failure",
          durationMs: Date.now() - completionStartedAt,
          failureCategory: failureCategory(error),
          failureKind: "session_completion_failed",
          failurePhase,
          importAttemptId,
          importId,
          providerId,
          requestDurationMs,
          sessionCount,
        },
        sensitive: { error },
      });
      throw error;
    }
  } catch (error) {
    registry.cancel();
    throw error;
  }
}

/** 完成通知注册表（原 `CIe`）：先到先缓存，waitFor 设定期望 importId + 120s 超时。 */
function createImportCompletionRegistry(
  appServerConnection: AppServerConnectionLike,
  projectlessThreadByCwd: Map<string, { cwd: string; outputDirectory: string; workspaceRoot: string }>,
  projectlessThreadBySessionKey: Map<string, { cwd: string; outputDirectory: string; workspaceRoot: string }>,
  sessionCwdByPath: Map<string, string>,
) {
  const completions = new Map<string, ReturnType<typeof toCompletionSummary>>();
  let expectedImportId: string | null = null;
  let resolve: ((value: ReturnType<typeof toCompletionSummary>) => void) | null = null;
  let reject: ((error: Error) => void) | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let unsubscribe: (() => void) | null = null;
  const cleanup = () => {
    if (timeout != null) {
      clearTimeout(timeout);
      timeout = null;
    }
    unsubscribe?.();
    unsubscribe = null;
  };
  const settle = (completion: ReturnType<typeof toCompletionSummary>) => {
    cleanup();
    resolve?.(completion);
    resolve = null;
    reject = null;
  };
  const pending = new Promise<ReturnType<typeof toCompletionSummary>>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
    unsubscribe = appServerConnection.registerInternalNotificationHandler((notification) => {
      if (notification.method !== "externalAgentConfig/import/completed") return;
      const parsed = parseImportCompletion(notification.params);
      if (parsed == null) return;
      const completion = toCompletionSummary(parsed, projectlessThreadByCwd, projectlessThreadBySessionKey, sessionCwdByPath);
      if (expectedImportId == null) {
        completions.set(parsed.importId, completion);
        return;
      }
      if (parsed.importId === expectedImportId) settle(completion);
    });
  });
  return {
    cancel: cleanup,
    waitFor(importId: string) {
      expectedImportId = importId;
      const cached = completions.get(importId);
      if (cached == null) {
        timeout = setTimeout(() => {
          cleanup();
          reject?.(new Error("Timed out waiting for external agent import completion"));
          reject = null;
        }, COMPLETION_TIMEOUT_MS);
      } else {
        settle(cached);
      }
      completions.clear();
      return pending;
    },
  };
}

/** 完成通知 → 汇总（原 `CIe` 内的 c 构造）。 */
function toCompletionSummary(
  completion: NonNullable<ReturnType<typeof parseImportCompletion>>,
  projectlessThreadByCwd: Map<string, { cwd: string; outputDirectory: string; workspaceRoot: string }>,
  projectlessThreadBySessionKey: Map<string, { cwd: string; outputDirectory: string; workspaceRoot: string }>,
  sessionCwdByPath: Map<string, string>,
) {
  return {
    failedItemCount: completion.itemTypeResults.reduce((sum, result) => sum + result.failures.length, 0),
    failedPluginCount: completion.itemTypeResults.reduce((sum, result) => sum + (result.itemType === "PLUGINS" ? result.failures.length : 0), 0),
    failedSessionCount: completion.itemTypeResults.reduce((sum, result) => sum + (result.itemType === "SESSIONS" ? result.failures.length : 0), 0),
    failureSummary: completion.failureSummary,
    importedSessionProjectRoots: completion.itemTypeResults.flatMap((result) =>
      result.itemType === "SESSIONS"
        ? result.successes.flatMap((success) => {
            const projectRoot = success.source == null ? undefined : sessionCwdByPath.get(success.source);
            return success.itemType !== "SESSIONS" || success.target == null || success.target === "" || projectRoot == null
              ? []
              : [{ projectRoot, threadId: threadIdFromUuid(success.target) }];
          })
        : [],
    ),
    importedSessionThreadIds: completion.importedSessionThreadIds,
    projectlessSessionThreads: completion.itemTypeResults.flatMap((result) =>
      result.itemType === "SESSIONS"
        ? result.successes.flatMap((success) => {
            const thread = projectlessThreadInfoFor(success, projectlessThreadByCwd, projectlessThreadBySessionKey);
            return success.itemType !== "SESSIONS" || success.target == null || success.target === "" || thread == null
              ? []
              : [{ ...thread, threadId: success.target }];
          })
        : [],
    ),
    projectRoots: [
      ...new Set(
        completion.itemTypeResults.flatMap((result) =>
          result.successes.flatMap((success) => {
            if (projectlessThreadInfoFor(success, projectlessThreadByCwd, projectlessThreadBySessionKey) != null) return [];
            const root = success.cwd ?? (result.itemType === "SESSIONS" && success.source != null ? sessionCwdByPath.get(success.source) : undefined);
            return root == null || root === "" ? [] : [root];
          }),
        ),
      ),
    ],
    successfulItemCount: completion.itemTypeResults.reduce((sum, result) => sum + result.successes.length, 0),
    successfulSessionCount: completion.itemTypeResults.reduce(
      (sum, result) =>
        sum +
        (result.itemType === "SESSIONS"
          ? result.successes.filter((success) => success.itemType === "SESSIONS" && success.target != null && success.target !== "").length
          : 0),
      0,
    ),
  };
}

// ---------------------------------------------------------------------------
// provider 阶段遥测（原 `RI`/`zI`/`BI`/`VI`/`HI`）
// ---------------------------------------------------------------------------

type DetectStageResult =
  | { detection: { items: PlanItem[]; unsupportedProjects: Array<SkippedProject & { providerId: string }>; cloudSessionCount?: number }; providerId: string; status: "success" }
  | { error: unknown; providerId: string; status: "failure" }
  | { providerId: string; status: "unavailable" };

/** detect 阶段（原 `RI`）：异常吞掉并转为 failure 结果。 */
async function runDetectStage({ detect, providerId, stage }: { detect: () => Promise<{ items: PlanItem[]; unsupportedProjects?: Array<SkippedProject & { providerId: string }>; cloudSessionCount?: number }>; providerId: string; stage: string }): Promise<DetectStageResult> {
  const startedAt = Date.now();
  try {
    const detection = await detect();
    logger.info("external_agent_import_provider_stage_finished", {
      safe: {
        status: "success",
        stage,
        providerId,
        durationMs: Date.now() - startedAt,
        ...(providerId === COWORK_PROVIDER_ID && stage === "detect" && detection.cloudSessionCount != null
          ? { cowork_cloud_detected: detection.cloudSessionCount > 0, cowork_cloud_session_count: detection.cloudSessionCount }
          : {}),
        unsupportedProjectCount: (detection.unsupportedProjects as unknown[] | undefined)?.length ?? 0,
        ...itemTelemetry(detection.items),
      },
    });
    return {
      detection: { items: detection.items, unsupportedProjects: (detection.unsupportedProjects ?? []) as Array<SkippedProject & { providerId: string }> },
      providerId,
      status: "success",
    };
  } catch (error) {
    logger.warning("external_agent_import_provider_stage_finished", {
      safe: { status: "failure", stage, providerId, durationMs: Date.now() - startedAt, failureKind: "detect_failed" },
      sensitive: { error },
    });
    return { error, providerId, status: "failure" };
  }
}

/** import 阶段（原 `zI`）：异常遥测后上抛。 */
async function runImportStage<T extends { importedSessionThreadIds: string[]; projectRoots: string[] }>({
  importItems,
  importAttemptId,
  items,
  providerId,
}: {
  importItems: () => Promise<T>;
  importAttemptId: string;
  items: PlanItem[];
  providerId: string;
}): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await importItems();
    logger.info("external_agent_import_provider_stage_finished", {
      safe: {
        status: "success",
        stage: "import",
        providerId,
        durationMs: Date.now() - startedAt,
        failedItemCount: (result as { failedItemCount?: number }).failedItemCount,
        failedPluginCount: (result as { failedPluginCount?: number }).failedPluginCount,
        failedSessionCount: (result as { failedSessionCount?: number }).failedSessionCount,
        importAttemptId,
        importedSessionCount: result.importedSessionThreadIds.length,
        projectRootsReturnedCount: result.projectRoots.length,
        ...itemTelemetry(items, "import"),
      },
    });
    return result;
  } catch (error) {
    logger.warning("external_agent_import_provider_stage_finished", {
      safe: {
        status: "failure",
        stage: "import",
        providerId,
        durationMs: Date.now() - startedAt,
        failureCategory: failureCategory(error),
        failureKind: providerFailureKind(providerId),
        importAttemptId,
        ...itemTelemetry(items, "import"),
      },
      sensitive: { error },
    });
    throw error;
  }
}

/** provider 失败类别（原 `BI`）。 */
function providerFailureKind(providerId: string | null): string {
  switch (providerId) {
    case "claude-code":
      return "claude_code_import_failed";
    case COWORK_PROVIDER_ID:
      return "cowork_import_failed";
    case "cursor":
      return "cursor_import_failed";
    case null:
      return "unknown";
  }
  return "unknown";
}

/** 失败类别（原 `VI`）：canceled / timeout / error.category。 */
function failureCategory(error: unknown): string {
  const attributes = errorAttributes(error) as Record<string, unknown>;
  return attributes["codex.outcome"] === "canceled"
    ? "canceled"
    : error instanceof Error && error.message === "Timed out waiting for external agent import completion"
      ? "timeout"
      : (attributes["error.category"] as string);
}

/** item 遥测（原 `HI`）。 */
function itemTelemetry(items: PlanItem[], phase?: "import") {
  let claudeCodeItemCount = 0;
  let claudeCoworkItemCount = 0;
  let cursorItemCount = 0;
  let homeItemCount = 0;
  let projectItemCount = 0;
  let sessionCount = 0;
  let pluginCount = 0;
  const providerIds = new Set<string>();
  for (const item of items) {
    providerIds.add(item.providerId);
    if (item.providerId === "claude-code") claudeCodeItemCount += 1;
    if (item.providerId === COWORK_PROVIDER_ID) claudeCoworkItemCount += 1;
    if (item.providerId === "cursor") cursorItemCount += 1;
    if (item.cwd == null || item.cwd === "") homeItemCount += 1;
    else projectItemCount += 1;
    if (item.itemType === "SESSIONS") sessionCount += item.details?.sessions.length ?? 0;
    if (phase === "import" && item.itemType === "PLUGINS")
      pluginCount += item.details?.plugins.reduce((sum, plugin) => sum + (plugin as { pluginNames: string[] }).pluginNames.length, 0) ?? 0;
  }
  return {
    claudeCodeItemCount,
    claudeCoworkItemCount,
    cursorItemCount,
    homeItemCount,
    itemCount: items.length,
    ...(phase === "import" ? { pluginCount } : {}),
    projectItemCount,
    providerIds: [...providerIds].sort().join(","),
    sessionCount,
  };
}

// ---------------------------------------------------------------------------
// item 工具（原 `UI`/`DIe`/`OIe`/`WI`/`GI`/`kIe`/`wIe`/`TIe`/`EIe`）
// ---------------------------------------------------------------------------

function usesProjectDetection(providerId: string): boolean {
  return providerId === "claude-code" || providerId === "cursor";
}

function isCoworkItem(item: PlanItem): boolean {
  return item.providerId === COWORK_PROVIDER_ID;
}

/** app-server detect item 归一（原 `UI`）：cursor 的 empty-window 路径标记 projectless。 */
function normalizeDetectedItem(item: Record<string, unknown>, providerId: string): PlanItem {
  const details = item.details as PlanItem["details"] & { sessions: Array<Record<string, unknown>> } | null;
  return {
    cwd: (item.cwd as string | null) ?? null,
    description: item.description as string,
    details:
      details == null
        ? null
        : {
            ...details,
            sessions: details.sessions.map((session) =>
              providerId === "cursor" && isCursorProjectlessPath((session as { path: string }).path) ? { ...session, workspaceKind: "projectless" } : session,
            ),
          },
    itemType: item.itemType as PlanItem["itemType"],
    providerId,
    sourcePath: undefined,
  };
}

/** 迁移 item（原 `DIe`）：剥离 providerId/sourcePath，details 仅保留 sessions 的 cwd/path/title。 */
function toMigrationItem(item: PlanItem): Omit<PlanItem, "providerId" | "sourcePath"> {
  return {
    cwd: item.cwd,
    description: item.description,
    details:
      item.details == null
        ? null
        : {
            commands: item.details.commands,
            hooks: item.details.hooks,
            mcpServers: item.details.mcpServers,
            plugins: [],
            sessions: item.details.sessions.map((session) => ({ cwd: session.cwd, path: session.path, title: session.title })),
            subagents: item.details.subagents,
          },
    itemType: item.itemType,
  };
}

const CURSOR_PROJECTLESS_SESSION_PATTERN = /(?:^|[\\/])projects[\\/]empty-window[\\/]agent-transcripts[\\/](.+)$/u;

function isCursorProjectlessPath(path: string): boolean {
  return cursorProjectlessSessionKey(path) != null;
}

/** cursor projectless 会话键（原 `WI`）：agent-transcripts 之后的相对路径。 */
function cursorProjectlessSessionKey(path: string): string | null {
  return CURSOR_PROJECTLESS_SESSION_PATTERN.exec(path)?.[1]?.replaceAll("\\", "/") ?? null;
}

/** 会话成功条目 → projectless 线程目录（原 `GI`）。 */
function projectlessThreadInfoFor(
  success: { source?: string | null; cwd?: string | null },
  projectlessThreadByCwd: Map<string, { cwd: string; outputDirectory: string; workspaceRoot: string }>,
  projectlessThreadBySessionKey: Map<string, { cwd: string; outputDirectory: string; workspaceRoot: string }>,
): { cwd: string; outputDirectory: string; workspaceRoot: string } | undefined {
  const sessionKey = success.source == null ? null : cursorProjectlessSessionKey(success.source);
  return (sessionKey != null ? projectlessThreadBySessionKey.get(sessionKey) : undefined) ?? (success.cwd == null ? undefined : projectlessThreadByCwd.get(success.cwd));
}

/** item 去重（原 `kIe`）：cwd/description/details/itemType/providerId 全等。 */
function dedupeItems(items: PlanItem[]): PlanItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = JSON.stringify({
      cwd: item.cwd ?? "",
      description: item.description,
      details: item.details,
      itemType: item.itemType,
      providerId: item.providerId,
    });
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// 导入状态（原 `AIe`~`LIe`）
// ---------------------------------------------------------------------------

const SESSION_IMPORTS_FILENAME = "external_agent_session_imports.json";
const sessionImportsSchema = (objectSchema({
  records: arraySchema((looseObjectSchema({ imported_at: numberSchema().optional() }) as unknown as { loose(): unknown }).loose()).default([]),
}) as unknown as { loose(): unknown }).loose();

export interface ImportStatus {
  importedSessionCount: number;
  latestImportedAtMs: number | null;
}

const EMPTY_IMPORT_STATUS: ImportStatus = { importedSessionCount: 0, latestImportedAtMs: null };

/** claude-code 导入状态（原 `MIe`）：codexHome 下的 external_agent_session_imports.json。 */
async function readClaudeCodeImportStatus({ appServerClient }: { appServerClient: AppServerClientLike }): Promise<ImportStatus> {
  if (isRemoteHostConfig(appServerClient.hostConfig)) return EMPTY_IMPORT_STATUS;
  const codexHome = await appServerClient.codexHome();
  const statusPath = (await appServerClient.platformPath()).join(codexHome, SESSION_IMPORTS_FILENAME);
  const content = await (appServerFileSystem.readFile(statusPath, appServerClient) as Promise<string>).catch(() => null);
  return content == null ? EMPTY_IMPORT_STATUS : parseSessionImports(content);
}

function parseSessionImports(content: string): ImportStatus {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return EMPTY_IMPORT_STATUS;
  }
  const validated = (sessionImportsSchema as unknown as { safeParse(input: unknown): { success: boolean; data?: { records: Array<{ imported_at?: number }> } } }).safeParse(parsed);
  if (!validated.success) return EMPTY_IMPORT_STATUS;
  let latestImportedAtMs: number | null = null;
  for (const record of validated.data!.records) {
    if (record.imported_at == null) continue;
    const importedAtMs = record.imported_at * 1e3;
    latestImportedAtMs = latestImportedAtMs == null ? importedAtMs : Math.max(latestImportedAtMs, importedAtMs);
  }
  return { importedSessionCount: validated.data!.records.length, latestImportedAtMs };
}

/** cowork 导入状态（原 `IIe`/`LIe`）：cowork 账本统计。 */
async function readCoworkImportStatus({ appServerClient, codexHomeForLocalFs }: { appServerClient: AppServerClientLike; codexHomeForLocalFs?: string }): Promise<ImportStatus> {
  if (isRemoteHostConfig(appServerClient.hostConfig)) return EMPTY_IMPORT_STATUS;
  const codexHome = codexHomeForLocalFs ?? (await codexHomeForLocalFsOf(appServerClient));
  return importHistoryStats(codexHome);
}

async function codexHomeForLocalFsOf(appServerClient: AppServerClientLike): Promise<string> {
  const codexHome = await appServerClient.codexHome();
  return shouldUseWslPathsForHostConfig(appServerClient.hostConfig) ? wslHostPathShared(codexHome, wslDistroNameShared()) : codexHome;
}

/** 按 provider 汇总导入状态（原 `PIe`/`JI`/`FIe`）。 */
export async function readImportStatus({
  appServerClient,
  codexHomeForLocalFs,
  providers,
}: {
  appServerClient: AppServerClientLike;
  codexHomeForLocalFs?: string;
  providers: string[];
}): Promise<ImportStatus> {
  const providerSet = new Set(providers);
  const [claudeCode, cowork] = await Promise.all([
    providerSet.has("claude-code") ? readClaudeCodeImportStatus({ appServerClient }) : EMPTY_IMPORT_STATUS,
    providerSet.has(COWORK_PROVIDER_ID) ? readCoworkImportStatus({ appServerClient, codexHomeForLocalFs }) : EMPTY_IMPORT_STATUS,
  ]);
  return mergeImportStatuses([claudeCode, cowork]);
}

function mergeImportStatuses(statuses: ImportStatus[]): ImportStatus {
  return {
    importedSessionCount: statuses.reduce((sum, status) => sum + status.importedSessionCount, 0),
    latestImportedAtMs: statuses.reduce<number | null>(
      (latest, status) => (status.latestImportedAtMs == null ? latest : Math.max(latest ?? status.latestImportedAtMs, status.latestImportedAtMs)),
      null,
    ),
  };
}

// ---------------------------------------------------------------------------
// connector 候选（原 `RIe`/`zIe`/`BIe`）
// ---------------------------------------------------------------------------

const CONNECTOR_APP_IDS = new Map([
  ["figma", "connector_figma"],
  ["github", "connector_github"],
  ["gmail", "connector_gmail"],
  ["google calendar", "connector_google_calendar"],
  ["google drive", "connector_google_drive"],
  ["linear", "connector_linear"],
  ["notion", "connector_notion"],
  ["slack", "connector_slack"],
]);

/** connector 候选（原 `zIe`）：仅 cowork provider；账本候选 → 应用映射。 */
export async function readConnectorCandidates({ codexHome, providers }: { codexHome: string; providers: string[] }): Promise<{
  connectors: Array<{ codexAppId: string | null; importedAtMs: number; name: string; sessionCount: number; source: string }>;
}> {
  if (!providers.includes(COWORK_PROVIDER_ID)) return { connectors: [] };
  const history = await readImportHistory(codexHome);
  return { connectors: history.connectorCandidates.map(connectorCandidateFor) };
}

function connectorCandidateFor(candidate: { importedAtMs: number; name: string; sessionCount: number; source: string }): {
  codexAppId: string | null;
  importedAtMs: number;
  name: string;
  sessionCount: number;
  source: string;
} {
  return {
    codexAppId: CONNECTOR_APP_IDS.get(candidate.name.trim().toLowerCase()) ?? null,
    importedAtMs: candidate.importedAtMs,
    name: candidate.name,
    sessionCount: candidate.sessionCount,
    source: candidate.source,
  };
}

// ---------------------------------------------------------------------------
// 导入后项目收尾（原 `VIe`）
// ---------------------------------------------------------------------------

/** 本地项目记录（结构化子集）。 */
export interface LocalProjectRecord {
  id: string;
  rootPaths: string[];
}

/** 全局状态面（结构化子集）。 */
export interface GlobalStateLike {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
}

/** 项目管理器面（结构化子集）。 */
export interface ProjectsManagerLike {
  getLocalProjects(): Record<string, LocalProjectRecord>;
  createProjectsForRoots(
    roots: string[],
    options: { excludedThreadIds: Set<string>; matchRootsByCanonicalHostIdentity: boolean },
  ): Promise<LocalProjectRecord[]>;
  setProjectOrder(order: string[]): Promise<void>;
}

/** 窗口管理器面（结构化子集）。 */
export interface WindowManagerLike {
  sendMessageToAllWindows(message: { type: string; keys: string[] }): void;
}

/** 线程指派回调（结构化子集）。 */
export type AssignThreadsCallback = (
  assignments: Array<{ threadId: string; assignment: { projectId: string; projectKind: "local" }; projectless: boolean }>,
) => Promise<void>;

/** 已有项目按根路径择优（原 `Mr`）。 */
function findBestProjectByRootPath(projects: Record<string, LocalProjectRecord>, rootPath: string): LocalProjectRecord | null {
  let best: LocalProjectRecord | null = null;
  for (const project of Object.values(projects)) {
    const matches = project.rootPaths.some((root) => posix.relative(root, rootPath) === `` || win32.relative(root, rootPath) === ``);
    if (matches && (best == null || compareProjectsShared({ ...project, projectId: project.id, rootPath }, { ...best, projectId: best.id, rootPath }))) {
      best = project;
    }
  }
  return best;
}

/** 导入后项目收尾（原 `VIe`）：canonical 归并 → 缺失项目创建 → 线程指派。 */
export async function finalizeImportedProjects({
  allImportedSessionThreadIds,
  appServerClient,
  globalState,
  importedSessionProjectRoots,
  projectsManager,
  projectId,
  projectRoots,
  assignIfUnassigned,
  shouldUseWslPaths,
  windowManager,
}: {
  allImportedSessionThreadIds: string[];
  appServerClient: AppServerClientLike;
  globalState: GlobalStateLike;
  importedSessionProjectRoots: Array<{ projectRoot: string; threadId: string }>;
  projectsManager: ProjectsManagerLike;
  projectId: string | null;
  projectRoots: string[];
  assignIfUnassigned: AssignThreadsCallback;
  shouldUseWslPaths: boolean;
  windowManager: WindowManagerLike;
}): Promise<string[]> {
  const roots = [...new Set([...projectRoots, ...importedSessionProjectRoots.map(({ projectRoot }) => projectRoot)])];
  if (roots.length === 0) return [];
  const existingProjects = projectsManager.getLocalProjects();
  const selectedProject = projectId == null ? undefined : existingProjects[projectId];
  if (projectId != null && selectedProject == null) return [];
  const projectByRoot = new Map<string, LocalProjectRecord>();
  for (const project of Object.values(existingProjects)) {
    const [root] = project.rootPaths;
    if (project.rootPaths.length !== 1 || root == null) continue;
    const canonicalRoot = canonicalForHost(root, shouldUseWslPaths);
    if (!projectByRoot.has(canonicalRoot)) projectByRoot.set(canonicalRoot, findBestProjectByRootPath(globalStateProjects(globalState), root) ?? project);
  }
  const identityByRoot = (await resolveCanonicalHostIdentities(
    [...new Set([...roots, ...projectByRoot.keys(), ...(selectedProject?.rootPaths.map((root) => canonicalForHost(root, shouldUseWslPaths)) ?? [])])],
    appServerClient,
  )) as Record<string, string>;
  if (
    selectedProject != null &&
    !roots.some((root) =>
      selectedProject.rootPaths.some((projectRoot) => {
        const identity = identityByRoot[canonicalForHost(projectRoot, shouldUseWslPaths)];
        return identity != null && identity === identityByRoot[root];
      }),
    )
  )
    return [];
  const projectByIdentity = new Map<string, LocalProjectRecord>();
  for (const [root, project] of projectByRoot) {
    const identity = identityByRoot[root];
    if (identity != null) {
      const incumbent = projectByIdentity.get(identity);
      if (
        incumbent == null ||
        compareProjectsShared(
          { ...project, projectId: project.id, rootPath: project.rootPaths[0] ?? root },
          { ...incumbent, projectId: incumbent.id, rootPath: incumbent.rootPaths[0] ?? root },
        )
      )
        projectByIdentity.set(identity, project);
    }
  }
  if (selectedProject != null) {
    for (const root of selectedProject.rootPaths) {
      const identity = identityByRoot[canonicalForHost(root, shouldUseWslPaths)];
      if (identity != null) projectByIdentity.set(identity, selectedProject);
    }
  }
  const rootByIdentity = new Map<string, string>();
  for (const root of roots) {
    const identity = identityByRoot[root];
    if (identity != null && !rootByIdentity.has(identity)) rootByIdentity.set(identity, root);
  }
  if (rootByIdentity.size === 0) return [];
  const existingIds = new Set(Object.keys(existingProjects));
  const threadAssignments = parseStoredJson(globalState.get(globalStateKeys.THREAD_PROJECT_ASSIGNMENTS)) as Record<string, unknown>;
  const projectlessOutputDirs = new Set(Object.keys((globalState.get(globalStateKeys.PROJECTLESS_THREAD_IDS) ?? {}) as Record<string, unknown>));
  const projectlessThreadDirs = new Set(Object.keys((globalState.get(globalStateKeys.THREAD_PROJECTLESS_OUTPUT_DIRECTORIES) ?? {}) as Record<string, unknown>));
  const missingRoots = new Map<string, string>();
  for (const [identity, root] of rootByIdentity) {
    if (!projectByIdentity.has(identity)) missingRoots.set(identity, desktopPathForHost(root, shouldUseWslPaths));
  }
  if (missingRoots.size > 0) {
    const created = await projectsManager.createProjectsForRoots([...missingRoots.values()], {
      excludedThreadIds: new Set(allImportedSessionThreadIds),
      matchRootsByCanonicalHostIdentity: true,
    });
    if (created.length === 0) return [];
    const projectByCreatedRoot = new Map(created.map((project) => [project.rootPaths[0], project]));
    for (const [identity, root] of missingRoots) {
      const project = projectByCreatedRoot.get(root);
      if (project != null) projectByIdentity.set(identity, project);
    }
  }
  const projectByImportedRoot = new Map<string, LocalProjectRecord>();
  for (const root of roots) {
    const identity = identityByRoot[root];
    const project = identity == null ? undefined : projectByIdentity.get(identity);
    if (project != null) projectByImportedRoot.set(root, project);
  }
  const createdIds = new Set(
    Array.from(projectByImportedRoot.values())
      .map((project) => project.id)
      .filter((id) => !existingIds.has(id)),
  );
  if (createdIds.size > 0) {
    globalState.set(
      globalStateKeys.LOCAL_PROJECTS,
      Object.fromEntries(
        Object.entries(projectsManager.getLocalProjects()).map(([id, project]) => [
          id,
          createdIds.has(project.id) ? { ...project, createdAt: 0, updatedAt: 0 } : project,
        ]),
      ),
    );
    const order = (globalState.get(globalStateKeys.PROJECT_ORDER) ?? []) as string[];
    await projectsManager.setProjectOrder([...order.filter((id) => !createdIds.has(id)), ...createdIds]);
    try {
      windowManager.sendMessageToAllWindows({
        type: "global-state-updated",
        keys: [globalStateKeys.LOCAL_PROJECTS, globalStateKeys.PROJECT_ORDER],
      });
    } catch (error) {
      logger.warning("external_agent_import_project_notification_failed", {
        safe: {},
        sensitive: { error },
      });
    }
  }
  const importedProjectIds = [...new Set(Array.from(projectByImportedRoot.values(), (project) => project.id))];
  const projectlessThreadIds = new Set((globalState.get(globalStateKeys.PROJECTLESS_THREAD_IDS) ?? []) as string[]);
  const assignments = Array.from(new Map(importedSessionProjectRoots.map(({ projectRoot, threadId }) => [threadId, projectRoot] as const))).flatMap(
    ([threadId, projectRoot]) => {
      if (threadAssignments[threadId] != null || projectlessThreadIds.has(threadId) || projectlessThreadDirs.has(threadId)) return [];
      const project = projectByImportedRoot.get(projectRoot);
      return project == null ? [] : [{ projectId: project.id, threadId }];
    },
  );
  const results = await Promise.allSettled(
    assignments.map(async ({ projectId: targetProjectId, threadId }) => {
      await assignIfUnassigned([
        {
          threadId: threadIdFromUuid(threadId),
          assignment: { projectId: targetProjectId, projectKind: "local" },
          projectless: false,
        },
      ]);
    }),
  );
  const failures = results.flatMap((result) => (result.status === "rejected" ? [result.reason] : []));
  if (failures.length > 0) {
    logger.warning("external_agent_import_project_assignment_failed", {
      safe: { failedAssignmentCount: failures.length, totalAssignmentCount: results.length },
      sensitive: { errors: failures },
    });
  }
  return importedProjectIds;
}

function canonicalForHost(path: string, wsl: boolean): string {
  return wsl ? pathForAgentEnvironmentShared(path) : path;
}

function desktopPathForHost(path: string, wsl: boolean): string {
  return wsl ? wslHostPathShared(path, wslDistroNameShared()) : path;
}

function globalStateProjects(globalState: GlobalStateLike): Record<string, LocalProjectRecord> {
  return (globalState.get(globalStateKeys.LOCAL_PROJECTS) ?? {}) as Record<string, LocalProjectRecord>;
}
