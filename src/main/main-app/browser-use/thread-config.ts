// browser-use 线程配置 —— 原 main-C-Mhak1n.ts 7,999-8,321 行
// （`Go/mie/Ko/hie/gie/_ie/vie/yie/qo/bie/Jo/xie/Sie/Yo/Xo/Zo/Cie/wie/Qo/Tie/Eie`），
// 另收编 4,433-4,441 行的 NODE_REPL_* / CHROME_* 环境变量键常量
// （`Zte/Qte/$te/ene/si/ci/li/ui/di`，该带属未指派的 runtime-paths 簇，
// 但 hie/gie/Vie/bie 在此消费，见重写报告）。
//
// 职责：为 browser-use / computer-use 线程装配 node_repl MCP 配置：
//   - `qo`：按 selection（computerUse 开关、平台、后端）计算配置，win32 上
//     先确保 computer-use 原生管道路径；
//   - `bie`：装配 node_repl 的 extraEnv（后端、tinysky、指令用例、音频、
//     CUA service、宿主服务管道）与 NODE_MODULE_PATH；
//   - `Tie`（Qo 的实现）：本地宿主上写 cua_repl .mcp.json（Sne）、同步 CUA
//     技能目录（wo）、经 config/batchWrite 写 node_repl / computer-use 的
//     mcp_servers 与 shell_environment_policy 条目。
//
// 本模块是 marketplace 状态的 fan-in 点（深析 §3.3）：读 marketplace 的
// 已装插件状态，间接经 Do（computer-use 选择）与 Sne/wo。

import process from "node:process";
import { randomUUID } from "node:crypto";

import {
  $l as CODEX_PLUGIN_SERVICES_KEY,
  Bo as getBundledPluginCachePath,
  Kl as COMPUTER_USE_MCP_SERVER_NAME,
  Uf as SharedEventEmitter,
  Vi as toWslPath,
  Xl as NODE_REPL_MCP_SERVER_NAME,
  Yl as NODE_REPL_REQUEST_META_ENV_KEY,
  eu as buildNodeReplMcpConfig,
  kl as BROWSER_PLUGIN_NAME,
  nu as isNodeReplSandboxPlatform,
  zi as shouldUseWslPathsForHostConfig,
} from "@chunk/shared";
import { in as BuildFlavor } from "@chunk/bootstrap";
import { createTaggedLogger } from "@chunk/logger";
import {
  BROWSER_USE_AVAILABLE_BACKENDS,
  BROWSER_USE_CODEX_APP_BUILD_FLAVOR,
  BROWSER_USE_CODEX_APP_VERSION,
  BROWSER_USE_DISABLE_AMBIENT_NETWORK,
  BROWSER_USE_DISABLE_API_MEMBERS,
  BROWSER_USE_DISABLE_BROWSER_CAPABILITIES,
  BROWSER_USE_DISABLE_TAB_CAPABILITIES,
  BROWSER_USE_SECURITY_MODE,
  BROWSER_USE_TINYSKY_ENABLED,
} from "./rpc-client";
import {
  CUA_REPL_DISABLED_MCP_SERVER_ENTRY,
  applyCuaReplSurfaceEnv,
  syncCuaReplMcpConfig,
} from "../plugins/cua-repl-config";
import { syncCuaSkillsForPlugins } from "../plugins/chrome-native-host-sync";
import { getBundledPluginsResourcesPath } from "../plugins/browser-runtime-resolution";
import { LOCAL_MARKETPLACE_LIST_FILTER } from "../plugins/marketplace";
// 并行重写中的模块（按深析压缩名导入；tsc 缺导出先忽略，见重写报告）：
import {
  NODE_REPL_INSTRUCTIONS_USE_CASE_COMPUTER_USE,
  SKY_CUA_SERVICE_NATIVE_PIPE_PATH as SKY_CUA_SERVICE_NATIVE_PIPE_PATH_ENV,
  computerUseServiceEnv as buildComputerUseServiceEnv,
} from "../computer-use/app-resolution";
import {
  computeBrowserUseSelection,
  getComputerUseNativePipePath as ensureComputerUseNativePipePath,
  invalidateComputerUseSelectionCache as dropComputerUseSelectionCache,
} from "../computer-use/native-pipe-service";
import { getDesktopFeatureAvailability } from "../misc/availability";

// ---- 4,433-4,441 的环境变量键（原 Zte/Qte/$te/ene/si/ci/li/ui/di）-------------

/** 环境变量键：Chrome 用户数据目录（原 `Zte`）。 */
export const CODEX_CHROME_USER_DATA_DIR = `CODEX_CHROME_USER_DATA_DIR`;
/** 环境变量键：浏览器认证 broker 套接字路径（原 `Qte`）。 */
export const BROWSER_AUTH_BROKER_SOCKET_PATH = `BROWSER_AUTH_BROKER_SOCKET_PATH`;
/** 环境变量键：node-repl 禁用分析（原 `$te`）。 */
export const NODE_REPL_DISABLE_ANALYTICS = `NODE_REPL_DISABLE_ANALYTICS`;
/** 环境变量键：node-repl 强制严格自动评审（原 `ene`）。 */
export const NODE_REPL_FORCE_STRICT_AUTO_REVIEW = `NODE_REPL_FORCE_STRICT_AUTO_REVIEW`;
/** 环境变量键：node-repl JS banner（原 `si`）。 */
export const NODE_REPL_JS_BANNER = `NODE_REPL_JS_BANNER`;
/** 环境变量键：node-repl 工具覆盖（原 `ci`）。 */
export const NODE_REPL_TOOL_OVERRIDES = `NODE_REPL_TOOL_OVERRIDES`;
/** 环境变量键：node-repl 浏览器指令用例（原 `li`）。 */
export const NODE_REPL_INSTRUCTIONS_USE_CASE_BROWSER = `NODE_REPL_INSTRUCTIONS_USE_CASE_BROWSER`;
/** 环境变量键：node-repl Chrome 指令用例（原 `ui`）。 */
export const NODE_REPL_INSTRUCTIONS_USE_CASE_CHROME = `NODE_REPL_INSTRUCTIONS_USE_CASE_CHROME`;
/** 环境变量键：node-repl 非受信环境允许清单（原 `di`）。 */
export const NODE_REPL_UNTRUSTED_ENV_ALLOWLIST = `NODE_REPL_UNTRUSTED_ENV_ALLOWLIST`;

// ---- 7,999-8,008：常量与 logger ----------------------------------------------

/** 环境变量键：node-repl 宿主服务管道路径（原 `Go`）。 */
export const NODE_REPL_HOST_SERVICES_PIPE_PATH = `NODE_REPL_HOST_SERVICES_PIPE_PATH`;

/** 新建宿主服务管道路径（原 `mie`）。 */
export function makeHostServicesPipePath(): string {
  return `/tmp/codex-host-services-${randomUUID()}.sock`;
}

const logger = createTaggedLogger(`BrowserUseThreadConfig`);

/** 透传给 browser-use 宿主的 broker 环境键（原 `hie`）。 */
const BROKER_ENV_KEYS = [
  CODEX_CHROME_USER_DATA_DIR,
  BROWSER_USE_DISABLE_AMBIENT_NETWORK,
  BROWSER_USE_DISABLE_API_MEMBERS,
  BROWSER_USE_DISABLE_BROWSER_CAPABILITIES,
  BROWSER_USE_DISABLE_TAB_CAPABILITIES,
];
/** dev flavor 下额外透传的环境键（原 `gie`）。 */
const DEV_ENV_KEYS = [
  BROWSER_AUTH_BROKER_SOCKET_PATH,
  BROWSER_USE_SECURITY_MODE,
  NODE_REPL_DISABLE_ANALYTICS,
  NODE_REPL_FORCE_STRICT_AUTO_REVIEW,
  NODE_REPL_JS_BANNER,
  NODE_REPL_TOOL_OVERRIDES,
];
/** IAB 指令用例文案（原 `_ie`）。 */
const INSTRUCTIONS_USE_CASE_BROWSER = `Control the in-app browser in conjunction with the Browser Plugin.`;
/** Chrome 指令用例文案（原 `vie`）。 */
const INSTRUCTIONS_USE_CASE_CHROME = `Control the Chrome browser in conjunction with the Chrome Plugin. Prefer this method of controlling Chrome over alternatives (such as Computer Use) unless the user explicitly mentions an alternative.`;
/** computer-use 指令用例文案（原 `yie`）。 */
const INSTRUCTIONS_USE_CASE_COMPUTER_USE = `Control desktop apps on macOS through Computer Use.`;

// ---- 8,009-8,069：qo ---------------------------------------------------------

/** browser-use 线程的 node_repl MCP 配置（n.eu 的产物）。 */
export type BrowserUseNodeReplMcpConfig = Record<string, any>;

/**
 * 按 selection 计算 browser-use 线程配置（原 `qo`）。
 * 无后端且无 computerUse 时返回 null。
 */
export async function computeBrowserUseThreadConfig({
  appServerConnection,
  appVersion,
  selection,
  includePrivateProcessEnv = !0,
  hostServicesPipePath = process.env.NODE_REPL_HOST_SERVICES_PIPE_PATH?.trim() || null,
}: {
  appServerConnection: any;
  appVersion: string;
  selection: any;
  includePrivateProcessEnv?: boolean;
  hostServicesPipePath?: string | null;
}): Promise<BrowserUseNodeReplMcpConfig | null> {
  let {
      codexHome,
      marketplaceName,
      desktopFeatureAvailability,
      runtimePaths,
      shouldUseWslPaths,
      browserBackends,
      computerUse,
      computerUsePaths,
    } = selection,
    { platform } = runtimePaths;
  if (browserBackends.length === 0 && !computerUse) return null;
  let computerUseNativePipePath =
      computerUse && platform === `win32` ? await ensureComputerUseNativePipePath() : null,
    computerUseReady = computerUse && (platform === `darwin` || computerUseNativePipePath != null);
  computerUse &&
    platform === `win32` &&
    !computerUseReady &&
    logger.info(`computer_use_native_pipe_thread_config_skipped`, {
      safe: { platform, reason: `not-ready` },
      sensitive: {},
    });
  let sentryUserId = includePrivateProcessEnv
      ? (appServerConnection.getCachedAuthenticatedPrincipal?.()?.userId ?? null)
      : null,
    config = buildBrowserUseNodeReplConfig({
      appVersion,
      browserUseTinysky: desktopFeatureAvailability.browserUseTinysky,
      computerUse,
      enforceModelCheck: desktopFeatureAvailability.nodeReplEnforceModelCheck,
      computerUsePaths,
      codexHome,
      marketplaceName,
      runtimePaths,
      sentryUserId,
      shouldUseWslPaths,
      availableBrowserUseBackends: browserBackends,
      computerUseNativePipePath,
      hostServicesPipePath,
      includePrivateProcessEnv,
    });
  return config == null
    ? null
    : (logger.info(`browser_use_runtime_paths_selected`, {
        safe: {
          codexCliPathSource: runtimePaths.codexCliPathSource,
          nodePathSource: runtimePaths.nodePathSource,
          nodeReplPathSource: runtimePaths.nodeReplPathSource,
          platform,
        },
        sensitive: {
          codexCliPath: runtimePaths.codexCliPath,
          nodePath: runtimePaths.nodePath,
          nodeReplPath: runtimePaths.nodeReplPath,
        },
      }),
      config);
}

// ---- 8,070-8,192：bie/Jo/xie --------------------------------------------------

/** 装配 node_repl 的 extraEnv 与路径（原 `bie`）。 */
function buildBrowserUseNodeReplConfig({
  appVersion,
  codexHome,
  marketplaceName,
  availableBrowserUseBackends,
  browserUseTinysky,
  computerUse,
  enforceModelCheck,
  computerUseNativePipePath,
  computerUsePaths,
  hostServicesPipePath,
  includePrivateProcessEnv,
  runtimePaths,
  sentryUserId,
  shouldUseWslPaths,
}: {
  appVersion: string;
  codexHome: string;
  marketplaceName?: string;
  availableBrowserUseBackends: string[];
  browserUseTinysky: boolean;
  computerUse: boolean;
  enforceModelCheck: boolean;
  computerUseNativePipePath: string | null;
  computerUsePaths: { serviceAppPath: string | null };
  hostServicesPipePath: string | null;
  includePrivateProcessEnv: boolean;
  runtimePaths: any;
  sentryUserId: unknown;
  shouldUseWslPaths: boolean;
}): BrowserUseNodeReplMcpConfig | null {
  let { platform } = runtimePaths;
  if (runtimePaths.nodeReplPath == null)
    return (
      logger.info(`browser_use_setup_failed`, {
        safe: {
          backend: `node_repl`,
          phase: `runtime-paths`,
          platform,
          reason: `node-repl-missing`,
        },
        sensitive: {},
      }),
      null
    );
  if (runtimePaths.nodePath == null)
    return (
      logger.info(`browser_use_setup_failed`, {
        safe: {
          backend: `node_repl`,
          phase: `runtime-paths`,
          platform,
          reason: `node-missing`,
        },
        sensitive: {},
      }),
      null
    );
  isNodeReplSandboxPlatform(platform) &&
    runtimePaths.codexCliPath == null &&
    logger.warning(`browser_use_codex_cli_missing_for_node_repl_sandbox`, {
      safe: {},
      sensitive: {},
    });
  let nodeModuleDirs = joinNodeModuleDirs(runtimePaths.nodeModuleDirs, platform),
    buildFlavor = BuildFlavor.resolve(),
    browserServicePath =
      availableBrowserUseBackends.length === 0
        ? void 0
        : `${getBundledPluginCachePath({
            codexHome,
            localVersion: appVersion,
            marketplaceName,
            pluginName: BROWSER_PLUGIN_NAME,
          })}/scripts/browser-service.mjs`,
    requestMeta = buildFlavor === BuildFlavor.Dev ? process.env[NODE_REPL_REQUEST_META_ENV_KEY] : void 0,
    traceMeta = BuildFlavor.isInternal(buildFlavor) || process.env.NODE_REPL_TRACE_META === `1`,
    untrustedEnvAllowlist = process.env[NODE_REPL_UNTRUSTED_ENV_ALLOWLIST]?.trim(),
    extraEnv: Record<string, string | undefined> = {
      [BROWSER_USE_AVAILABLE_BACKENDS]: availableBrowserUseBackends.join(`,`),
      [BROWSER_USE_TINYSKY_ENABLED]: browserUseTinysky ? `1` : `0`,
      ...(enforceModelCheck ? { NODE_REPL_ENFORCE_MODEL_CHECK: `1` } : {}),
      ...(availableBrowserUseBackends.includes(`iab`)
        ? { [NODE_REPL_INSTRUCTIONS_USE_CASE_BROWSER]: INSTRUCTIONS_USE_CASE_BROWSER }
        : {}),
      ...(availableBrowserUseBackends.includes(`chrome`)
        ? { [NODE_REPL_INSTRUCTIONS_USE_CASE_CHROME]: INSTRUCTIONS_USE_CASE_CHROME }
        : {}),
      ...(computerUse && platform === `darwin`
        ? { [NODE_REPL_INSTRUCTIONS_USE_CASE_COMPUTER_USE]: INSTRUCTIONS_USE_CASE_COMPUTER_USE }
        : {}),
      [BROWSER_USE_CODEX_APP_BUILD_FLAVOR]: buildFlavor,
      [BROWSER_USE_CODEX_APP_VERSION]: appVersion,
      [CODEX_PLUGIN_SERVICES_KEY]:
        browserServicePath == null && !computerUse
          ? void 0
          : JSON.stringify({
              ...(browserServicePath == null ? {} : { browser: browserServicePath }),
              ...(computerUse ? { sky: `@oai/sky/service` } : {}),
            }),
      ...pickEnv(BROKER_ENV_KEYS),
      ...(buildFlavor === BuildFlavor.Dev ? pickEnv(DEV_ENV_KEYS) : {}),
      ...(untrustedEnvAllowlist
        ? { [NODE_REPL_UNTRUSTED_ENV_ALLOWLIST]: untrustedEnvAllowlist }
        : {}),
      ...(computerUse &&
      process.env.NODE_REPL_ENABLE_AUDIO === `1` &&
      process.env.SKY_ENABLE_AUDIO === `1`
        ? { NODE_REPL_ENABLE_AUDIO: `1`, SKY_ENABLE_AUDIO: `1` }
        : {}),
      ...(computerUse
        ? buildComputerUseServiceEnv({
            nativePipeDirectory: computerUseNativePipePath,
            nativePipeEnabled: platform === `win32`,
            serviceAppPath: platform === `darwin` ? computerUsePaths.serviceAppPath : null,
            serviceNativePipePath:
              platform === `darwin` && computerUsePaths
                ? process.env[SKY_CUA_SERVICE_NATIVE_PIPE_PATH_ENV]
                : null,
          })
        : {}),
      ...(computerUse && platform === `darwin` && hostServicesPipePath != null
        ? { [NODE_REPL_HOST_SERVICES_PIPE_PATH]: hostServicesPipePath }
        : {}),
    },
    envVarsToRemove =
      computerUse && platform === `darwin` && !computerUsePaths
        ? [
            ...(process.env.NODE_REPL_HOST_SERVICES_PIPE_PATH?.trim()
              ? [NODE_REPL_HOST_SERVICES_PIPE_PATH]
              : []),
            ...(buildFlavor === BuildFlavor.Dev &&
            process.env.SKY_CUA_SERVICE_NATIVE_PIPE_PATH?.trim()
              ? [SKY_CUA_SERVICE_NATIVE_PIPE_PATH_ENV]
              : []),
          ]
        : [];
  return buildNodeReplMcpConfig({
    codexCliPath: runtimePaths.codexCliPath,
    codexHome,
    envVars: envVarsToRemove,
    extraEnv,
    nodeModuleDirs,
    nodePath: runtimePaths.nodePath,
    nodeReplPath: shouldUseWslPaths ? toWslPath(runtimePaths.nodeReplPath) : runtimePaths.nodeReplPath,
    platform,
    requestMeta,
    sentryUserId,
    traceMeta,
    shouldUseWslPaths,
  });
}

/** 从 process.env 挑出存在的键（原 `Jo`）。 */
function pickEnv(keys: string[]): Record<string, string> {
  let picked: Record<string, string> = {};
  for (let key of keys) {
    let value = process.env[key];
    value != null && (picked[key] = value);
  }
  return picked;
}

/** NODE_MODULE_PATH 段连接（win32 用分号；原 `xie`）。 */
function joinNodeModuleDirs(dirs: string[], platform: NodeJS.Platform): string {
  return dirs.join(platform === `win32` ? `;` : `:`);
}

// ---- 8,193-8,218：pending reconcile 注册（Sie/Yo/Xo/Zo/Cie/wie）----------------

/** 需要从 shell_environment_policy 中清除的键（原 `Sie`）。 */
const SHELL_ENV_POLICY_KEYS = [BROWSER_USE_AVAILABLE_BACKENDS, `NODE_REPL_TRUSTED_CODE_PATHS`];
/** connection → 最近一次 reconcile promise（原 `Yo`）。 */
const pendingReconcileByConnection = new WeakMap<object, Promise<unknown>>();
/** connection → 最近注册的 reconcile promise（原 `Xo`）。 */
const registeredReconcileByConnection = new WeakMap<object, Promise<unknown>>();

/** 注册 connection 的 pending reconcile（供等待方读到最新一次；原 `Zo`）。 */
export function registerPendingReconcile(
  connection: object,
  reconcile: Promise<unknown>,
): void {
  registeredReconcileByConnection.set(connection, reconcile);
}

/** 等待 connection 当前注册的 reconcile 完成（代数一致才返回；原 `Cie`）。 */
export async function waitForPendingReconcile(connection: object): Promise<unknown> {
  for (;;) {
    let registered = registeredReconcileByConnection.get(connection),
      pending = pendingReconcileByConnection.get(connection),
      result = await Promise.all([registered, pending]).then(
        ([, value]) => value ?? null,
        () => null,
      );
    if (
      registered === registeredReconcileByConnection.get(connection) &&
      pending === pendingReconcileByConnection.get(connection)
    )
      return result;
  }
}

/** 插件变更后重同步 browser-use 线程配置（原 `wie`；160,103 行消费）。 */
export class BrowserUsePluginConfigSyncer extends SharedEventEmitter {
  options: Parameters<typeof syncBrowserUseThreadConfig>[0];

  constructor(options: Parameters<typeof syncBrowserUseThreadConfig>[0]) {
    super();
    this.options = options;
  }

  async syncAfterPluginChange() {
    getDesktopFeatureAvailability().browserUseTinysky &&
      (await syncBrowserUseThreadConfig({ ...this.options, reloadUserConfig: !1 }));
  }
}

// ---- 8,219-8,307：Qo/Tie -------------------------------------------------------

/**
 * 同步 browser-use 线程配置（原 `Qo`）：同一 app-server 连接上的同步串行
 * 排队（Yo WeakMap）。
 */
export function syncBrowserUseThreadConfig(
  options: Parameters<typeof syncBrowserUseThreadConfigImpl>[0],
): Promise<{ selection: any; cuaReplEnabled: boolean }> {
  let pending = (pendingReconcileByConnection.get(options.appServerConnection) ?? Promise.resolve())
    .catch(() => {})
    .then(() => syncBrowserUseThreadConfigImpl(options));
  return (pendingReconcileByConnection.set(options.appServerConnection, pending), pending);
}

/** 同步实现（原 `Tie`）。 */
async function syncBrowserUseThreadConfigImpl({
  appServerConnection,
  appVersion,
  getDesktopFeatureAvailability: readAvailability = getDesktopFeatureAvailability,
  isPackaged,
  platform,
  repoRoot,
  reloadUserConfig = !0,
  resolveCodexPath,
  resolveNodePath,
  resolveNodeReplPath,
  resolvePrimaryRuntimeNodePath,
  resourcesPath,
}: {
  appServerConnection: any;
  appVersion: string;
  getDesktopFeatureAvailability?: () => any;
  isPackaged?: boolean;
  platform?: NodeJS.Platform;
  repoRoot?: string;
  reloadUserConfig?: boolean;
  resolveCodexPath?: any;
  resolveNodePath?: any;
  resolveNodeReplPath?: any;
  resolvePrimaryRuntimeNodePath?: any;
  resourcesPath?: string;
}): Promise<{ selection: any; cuaReplEnabled: boolean }> {
  let availability = readAvailability();
  dropComputerUseSelectionCache(appServerConnection);
  let useWslPaths = shouldUseWslPathsForHostConfig(appServerConnection.hostConfig),
    marketplaces =
      appServerConnection.hostConfig.kind === `local`
        ? (await appServerConnection.listPlugins(LOCAL_MARKETPLACE_LIST_FILTER)).marketplaces
        : [],
    selection = await computeBrowserUseSelection({
      appServerConnection,
      desktopFeatureAvailability: availability,
      marketplaces,
      shouldUseWslPaths: useWslPaths,
      isPackaged,
      platform,
      repoRoot,
      resolveCodexPath,
      resolveNodePath,
      resolveNodeReplPath,
      resolvePrimaryRuntimeNodePath,
      resourcesPath,
    }),
    { codexHome, marketplaceName, runtimePaths, browserBackends, cuaReplSurfaces } = selection,
    nodeReplConfig = await computeBrowserUseThreadConfig({
      appServerConnection,
      appVersion,
      selection,
      hostServicesPipePath: null,
      includePrivateProcessEnv: !1,
    }),
    cuaReplEnabled = !1;
  if (appServerConnection.hostConfig.kind === `local`) {
    let nodeReplEntry = nodeReplConfig?.[`mcp_servers.node_repl`];
    cuaReplEnabled = await syncCuaReplMcpConfig({
        browserBackends,
        surfaces: cuaReplSurfaces,
        codexHome,
        marketplaceName,
        marketplaces,
        nodeRepl: useWslPaths ? void 0 : nodeReplEntry,
      }),
      await syncCuaSkillsForPlugins({
        cuaReplSurfaces: cuaReplEnabled ? cuaReplSurfaces : [],
        codexHome,
        marketplaceName,
        marketplaces,
        platform: runtimePaths.platform,
        resourcesPath: getBundledPluginsResourcesPath({ resourcesPath }),
      }),
      nodeReplEntry != null && cuaReplEnabled && applyCuaReplSurfaceEnv(nodeReplEntry, cuaReplSurfaces);
  }
  let edits = [
    ...buildNodeReplConfigEdits(nodeReplConfig),
    {
      keyPath: `mcp_servers.${COMPUTER_USE_MCP_SERVER_NAME}`,
      mergeStrategy: `replace`,
      value: cuaReplEnabled
        ? null
        : CUA_REPL_DISABLED_MCP_SERVER_ENTRY[`mcp_servers.${COMPUTER_USE_MCP_SERVER_NAME}`],
    },
  ];
  return (
    await appServerConnection.sendAppServerRequest(`config/batchWrite`, {
      edits,
      expectedVersion: null,
      filePath: null,
      reloadUserConfig,
    }),
    { selection, cuaReplEnabled }
  );
}

/** node_repl / shell_environment_policy 的 batchWrite 编辑列表（原 `Eie`）。 */
function buildNodeReplConfigEdits(config: BrowserUseNodeReplMcpConfig | null) {
  return [
    {
      keyPath: `mcp_servers.${NODE_REPL_MCP_SERVER_NAME}`,
      mergeStrategy: `replace`,
      value: config?.[`mcp_servers.node_repl`] ?? null,
    },
    ...SHELL_ENV_POLICY_KEYS.map((key) => ({
      keyPath: `shell_environment_policy.set.${key}`,
      mergeStrategy: `replace`,
      value: null,
    })),
  ];
}
