// computer-use native pipe：选择计算 + 服务端 + Windows 客户端单例
// （原 main-C-Mhak1n.ts 7,181-7,278 的 `To/Eo/Do/Oo/Ore/kre`、
// 7,279-7,436 的工具 schema 与 analytics 族 `ko/Ao/Are/jre/Mre/jo/Nre/Pre/Mo/Fre/Ire/Lre/Rre`、
// 7,407-7,429 的 JSON-RPC schema `zre/No/Bre`、
// 7,430-7,778 的服务端 `Po/Fo/Vre/Io/Hre/Ure/Wre/Gre/Kre/qre/Jre/Yre/Xre/Zre/Qre/Lo/Ro/$re/eie/tie/nie`、
// 7,861-7,998 的客户端单例 `Uo/Wo/fie/pie`）。
//
// 三个部分：
//   1. 选择计算（computeBrowserUseSelection，原 `Do`）：综合特性开关、
//      marketplace 安装状态、runtime 路径，得出 browserBackends（chrome/iab）、
//      computerUse 开关、computerUsePaths（service app 路径）、cuaReplSurfaces
//      （browser/computer）。per-connection 的 marketplace 查询结果缓存在模块级
//      WeakMap（原 `Eo`，深析 §4）。
//   2. 服务端（startComputerUseNativePipeServer，原 `Wre`）：win32 上经
//      WindowsHelperTransport（动态 import）转发请求；请求/turn 生命周期带
//      analytics 事件；审批（elicitation）经 JSON-RPC 往返桥接（id 前缀
//      `computer-use-approval:`，5 分钟超时）；单 helper 串行（忙时拒绝）。
//   3. 客户端单例（createComputerUseNativePipeClient，原 `pie`）：仅 win32
//      启动；先确保 codex CLI 的 notify 配置（computer-use/notify-config），
//      再起服务端；helper 路径变化时重建；desktopFeatureAvailability 变更驱动
//      启停。模块级单例持有者（原 `Wo`）供 getComputerUseNativePipePath 查询。
//
// 本模块无模块加载期副作用（logger/WeakMap/常量构造）。

import { createServer, type Socket } from "node:net";
import { existsSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { pathToFileURL } from "node:url";
import { Buffer } from "node:buffer";

import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
import { createTaggedLogger, memoizedTaggedLogger } from "@chunk/logger";
// @chunk/bootstrap 的兼容导出（单字母名）：`in` → BuildFlavor 模型。
import { "in" as BuildFlavor } from "@chunk/bootstrap";
// @chunk/shared 的压缩名导出，按语义重命名导入：
//   Oi → resolveCodexHome、Ul → build flavor → marketplace 名
//   Rl → browser-use 插件名、Wu → appServer 版本特性门
//   Gl → codex CLI 路径环境键（helper env）
//   Nn/Pn → Windows computer-use helper 可执行/transport 模块路径解析
//   wf/Of/Mf/jf/Cf/bf/df/_f → zod 构造器（object/string/unknown/union/number/
//   literal/enum/custom）
import {
  Cf as numberSchema_,
  Gl as CODEX_CLI_PATH_ENV_KEY,
  Mf as unknownSchema_,
  Nn as resolveWindowsComputerUseHelperPath,
  Oi as resolveCodexHome,
  Of as stringSchema_,
  Pn as resolveWindowsComputerUseHelperTransportModulePath,
  Rl as BROWSER_USE_PLUGIN_NAME,
  Ul as marketplaceNameForFlavor,
  Wu as appServerVersionSupportsFeature,
  _f as customSchema_,
  bf as literalSchema_,
  df as enumSchema_,
  jf as unionSchema_,
  wf as objectSchema_,
} from "@chunk/shared";

// 压缩名导入后重绑为 any：d.ts 的 Schema 接口未声明 zod 的链式方法
//（.optional()/.loose()/.trim() 等），与 bootstrap applications-installer 的
// 处理方式一致。
const objectSchema: any = objectSchema_;
const stringSchema: any = stringSchema_;
const unknownSchema: any = unknownSchema_;
const unionSchema: any = unionSchema_;
const numberSchema: any = numberSchema_;
const literalSchema: any = literalSchema_;
const enumSchema: any = enumSchema_;
const customSchema: any = customSchema_;

// artifact-session 簇（并行重写中）的 runtime 路径解析（原 `fi`，4,442 行）。
import { resolveRuntimePaths } from "../artifact-session/runtime-paths";
// plugins/marketplace（3.3 簇，并行重写中）的 marketplace 查找（原 `Ai`）。
import { findBundledPlugin } from "../plugins/marketplace";
import {
  DEFAULT_COMPUTER_USE_PIPE_PATH,
  isComputerUsePluginEnabled,
  resolveComputerUsePaths,
  resolveComputerUsePathsForMarketplaces,
} from "./app-resolution";
import { ensureComputerUseNotifyConfig } from "./notify-config";
import { decodeFrames, encodeFrame } from "../native-pipe/protocol";

// ---- 模块级状态（深析 §4）---------------------------------------------------

/** 具名 logger（原 `To`，r.r → 直接 Logger 实例）。 */
const selectionLogger = createTaggedLogger(`BrowserUseSelection`);

/**
 * per-connection marketplace 查询缓存（原 `Eo`，7,182 行，模块级 WeakMap）：
 * appServerConnection → (codexHome → computer-use 插件路径 promise)。
 * 失败时从缓存摘除以便重试（写 `Ore`；显式失效 `Oo`）。
 */
const selectionCacheByConnection = new WeakMap<object, Map<string, Promise<{ enabled: boolean; paths: { serviceAppPath: string | null } }>>>();

/** computer-use native pipe 客户端单例持有者（原 `Wo`，7,862 行，模块级可变）。 */
let activeComputerUseNativePipeClient: ComputerUseNativePipeClient | null = null;

/** listPlugins 的本地 marketplace 查询（原 `Di`，4,707 行的常量副本）。 */
const LOCAL_MARKETPLACE_KINDS_QUERY = { marketplaceKinds: [`local`] };

// ---- 选择计算（原 Do/Oo/Ore/kre）--------------------------------------------

/** browser-use 选择结果（原 `Do` 的返回值）。 */
export interface BrowserUseSelection {
  codexHome: string;
  marketplaceName: string;
  desktopFeatureAvailability: Record<string, any>;
  runtimePaths: any;
  shouldUseWslPaths?: boolean;
  browserBackends: string[];
  computerUse: boolean;
  computerUsePaths: { serviceAppPath: string | null };
  cuaReplSurfaces: string[];
}

/**
 * 计算 browser-use / computer-use 选择（原 `Do`）。
 *
 * - marketplaces 为 null：走 app-server 的 listPlugins（带 WeakMap 缓存），
 *   且 tinysky 打开时预取（原 7,197 的 Oo(e) 前置调用语义）。
 * - marketplaces 非空：直接按 marketplace 状态判定。
 * - browserBackends：externalBrowserUse → chrome；inAppBrowserUse → iab。
 * - cuaReplSurfaces：browser（有 backends 且 tinysky REPL 可用）、computer
 *   （darwin + computerUse + 插件启用 + service app 路径就绪）。
 */
export async function computeBrowserUseSelection({
  appServerConnection,
  desktopFeatureAvailability,
  marketplaces,
  shouldUseWslPaths,
  ...runtimePathsOptions
}: {
  appServerConnection: any;
  desktopFeatureAvailability: Record<string, any>;
  marketplaces?: any[] | null;
  shouldUseWslPaths?: boolean;
} & Record<string, any>): Promise<BrowserUseSelection> {
  const codexHome = resolveCodexHome();
  const marketplaceName = marketplaceNameForFlavor(BuildFlavor.resolve());
  const runtimePaths = resolveRuntimePaths(runtimePathsOptions);
  let computerUse: { enabled: boolean; paths: { serviceAppPath: string | null } } = {
    enabled: false,
    paths: { serviceAppPath: null },
  };
  if (marketplaces == null) {
    if (desktopFeatureAvailability.computerUse && runtimePaths.platform === `darwin`) {
      if (desktopFeatureAvailability.browserUseTinysky) invalidateComputerUseSelectionCache(appServerConnection);
      computerUse = await fetchComputerUsePathsForConnection(appServerConnection, codexHome);
    }
  } else {
    computerUse = {
      enabled: isComputerUsePluginEnabled({ marketplaceName, marketplaces }),
      paths: resolveComputerUsePathsForMarketplaces({ codexHome, marketplaceName, marketplaces }),
    };
  }
  const browserBackends: string[] = [];
  if (desktopFeatureAvailability.externalBrowserUse) browserBackends.push(`chrome`);
  if (desktopFeatureAvailability.inAppBrowserUse) browserBackends.push(`iab`);
  const tinyskyReplAvailable = isTinyskyReplAvailable({
    appServerVersion: appServerConnection.appServerVersion,
    features: desktopFeatureAvailability,
    marketplaceName,
    marketplaces,
    runtimePaths,
    shouldUseWslPaths,
  });
  const computerSurface =
    tinyskyReplAvailable &&
    runtimePaths.platform === `darwin` &&
    desktopFeatureAvailability.computerUse &&
    computerUse.enabled &&
    computerUse.paths.serviceAppPath != null;
  const computerUseEnabled =
    desktopFeatureAvailability.computerUse &&
    (!desktopFeatureAvailability.browserUseTinysky ||
      runtimePaths.platform !== `darwin` ||
      computerUse.enabled);
  const cuaReplSurfaces: string[] = [];
  if (tinyskyReplAvailable && browserBackends.length > 0) cuaReplSurfaces.push(`browser`);
  if (computerSurface) cuaReplSurfaces.push(`computer`);
  return {
    codexHome,
    marketplaceName,
    desktopFeatureAvailability,
    runtimePaths,
    shouldUseWslPaths,
    browserBackends,
    computerUse: computerUseEnabled,
    computerUsePaths: computerUse.paths,
    cuaReplSurfaces,
  };
}

/** 显式失效某 connection 的 computer-use 选择缓存（原 `Oo`）。 */
export function invalidateComputerUseSelectionCache(appServerConnection: object): void {
  selectionCacheByConnection.delete(appServerConnection);
}

/** 经 app-server listPlugins 解析 computer-use 插件路径（带缓存，原 `Ore`）。 */
async function fetchComputerUsePathsForConnection(
  appServerConnection: any,
  codexHome: string,
): Promise<{ enabled: boolean; paths: { serviceAppPath: string | null } }> {
  const cached = selectionCacheByConnection.get(appServerConnection)?.get(codexHome);
  if (cached != null) return cached;
  const byCodexHome = selectionCacheByConnection.get(appServerConnection) ?? new Map();
  const promise: Promise<{ enabled: boolean; paths: { serviceAppPath: string | null } }> = appServerConnection
    .listPlugins(LOCAL_MARKETPLACE_KINDS_QUERY)
    .then(({ marketplaces }: { marketplaces: any[] }) => ({
      enabled: isComputerUsePluginEnabled({ marketplaces }),
      paths: resolveComputerUsePathsForMarketplaces({ codexHome, marketplaces }),
    }))
    .catch((error: unknown) => {
      const entry = selectionCacheByConnection.get(appServerConnection);
      if (entry?.get(codexHome) === promise) {
        entry.delete(codexHome);
        if (entry.size === 0) selectionCacheByConnection.delete(appServerConnection);
      }
      selectionLogger.warning(`computer_use_installed_plugin_path_resolve_failed`, {
        safe: {},
        sensitive: { error },
      });
      return { enabled: false, paths: resolveComputerUsePaths() };
    });
  byCodexHome.set(codexHome, promise);
  selectionCacheByConnection.set(appServerConnection, byCodexHome);
  return promise;
}

/** tinysky node-repl 是否可用（原 `kre`）：browser-use 插件安装且全部路径就绪。 */
export function isTinyskyReplAvailable({
  appServerVersion,
  features,
  marketplaceName,
  marketplaces,
  runtimePaths,
  shouldUseWslPaths,
}: {
  appServerVersion: unknown;
  features: Record<string, any>;
  marketplaceName: string;
  marketplaces?: any[] | null;
  runtimePaths: any;
  shouldUseWslPaths?: boolean;
}): boolean {
  if (marketplaces == null) return false;
  const found = findBundledPlugin({
    marketplaceName,
    marketplaces,
    pluginName: BROWSER_USE_PLUGIN_NAME,
  });
  return (
    features.browserUseTinysky &&
    !shouldUseWslPaths &&
    runtimePaths.nodePath != null &&
    runtimePaths.nodeReplPath != null &&
    appServerVersionSupportsFeature(appServerVersion, `mcpToolExposure`) &&
    found?.plugin.installed === true &&
    found.plugin.enabled &&
    found.plugin.availability === `AVAILABLE`
  );
}

// ---- 工具 schema 与 analytics（原 ko/Ao/Are/jre/Mre/jo/Nre/Pre/Mo/Fre/Ire/Lre/Rre）

/** native pipe 传输标识（原 `ko`）。 */
export const NATIVE_PIPE_TRANSPORT = `native_pipe`;

/** codex turn 元数据的宽松 schema（原 `Ao`）。 */
const codexTurnMetadataSchema: any = objectSchema({
  call_id: stringSchema().trim().min(1).optional(),
  item_id: stringSchema().trim().min(1).optional(),
  itemId: stringSchema().trim().min(1).optional(),
  model: stringSchema().trim().min(1).optional(),
  model_reasoning_effort: stringSchema().trim().min(1).optional(),
  reasoningEffort: stringSchema().trim().min(1).optional(),
  reasoning_effort: stringSchema().trim().min(1).optional(),
  session_id: stringSchema().trim().min(1).optional(),
  thread_id: stringSchema().trim().min(1).optional(),
  threadId: stringSchema().trim().min(1).optional(),
  thread_source: stringSchema().trim().min(1).optional(),
  turn_id: stringSchema().trim().min(1).optional(),
}).loose();

/** 工具参数 schema（bundle identifier 的多形态，原 `Are`）。 */
const toolParamsSchema: any = objectSchema({
  app: unionSchema([
    stringSchema().trim().min(1),
    objectSchema({
      bundleIdentifier: stringSchema().trim().min(1).optional(),
      bundle_identifier: stringSchema().trim().min(1).optional(),
    }).loose(),
  ]).optional(),
  bundleIdentifier: stringSchema().trim().min(1).optional(),
  bundle_identifier: stringSchema().trim().min(1).optional(),
  window: objectSchema({ app: stringSchema().trim().min(1).optional() }).loose().optional(),
}).loose();

/** elicitation（审批请求）参数的 meta schema（原 `jre`）。 */
const elicitationMetaSchema: any = objectSchema({
  meta: objectSchema({
    method: stringSchema().trim().min(1).optional(),
    params: unknownSchema().optional(),
    tool_params: unknownSchema().optional(),
  })
    .loose()
    .optional(),
}).loose();

/** 审批结果 schema（原 `Mre`）。 */
const approvalResultSchema: any = objectSchema({
  action: enumSchema([`accept`, `decline`, `cancel`]),
  _meta: objectSchema({ persist: enumSchema([`always`, `session`]).optional() })
    .loose()
    .optional(),
}).loose();

/** 工具调用 analytics 字段（原 `jo` 的返回值）。 */
export interface ToolCallAnalyticsFields {
  toolName: string;
  transport: string;
  bundleIdentifier?: string;
  model?: unknown;
  reasoningEffort?: unknown;
}

/** 解析工具调用的 analytics 字段（原 `jo`）。 */
export function toolCallAnalyticsFields(
  toolName: string,
  params: unknown,
  codexTurnMetadata?: unknown,
): ToolCallAnalyticsFields {
  const parsedParams = toolParamsSchema.safeParse(params);
  const bundleIdentifier = parsedParams.success ? extractBundleIdentifier(parsedParams.data) : undefined;
  const parsedMetadata = codexTurnMetadataSchema.safeParse(codexTurnMetadata);
  return {
    toolName,
    transport: NATIVE_PIPE_TRANSPORT,
    bundleIdentifier,
    model: parsedMetadata.success ? parsedMetadata.data.model : undefined,
    reasoningEffort: parsedMetadata.success ? extractReasoningEffort(parsedMetadata.data) : undefined,
  };
}

/** 工具调用的调用来源元数据（原 `Nre`）。 */
export function toolInvocationMetadata(codexTurnMetadata: unknown): Record<string, unknown> {
  const parsed = codexTurnMetadataSchema.safeParse(codexTurnMetadata);
  const data = parsed.success ? parsed.data : {};
  const threadId = data.thread_id ?? data.threadId ?? data.session_id;
  const itemId = data.item_id ?? data.itemId ?? data.call_id;
  return {
    pluginId: `computer-use@openai-bundled`,
    mcpServerName: `node_repl`,
    invocationSource: `code_mode`,
    threadId,
    turnId: data.turn_id,
    threadSource: data.thread_source,
    itemId,
  };
}

/** 解析审批（elicitation）请求参数的工具信息（原 `Pre`）。 */
export function approvalRequestAnalyticsFields(params: unknown): ToolCallAnalyticsFields {
  const parsed = elicitationMetaSchema.safeParse(params);
  return parsed.success
    ? toolCallAnalyticsFields(
        parsed.data.meta?.method ?? `unknown`,
        parsed.data.meta?.params ?? parsed.data.meta?.tool_params,
      )
    : { toolName: `unknown`, transport: NATIVE_PIPE_TRANSPORT };
}

/** 审批结果的 analytics 事件（原 `Mo`）。 */
export function approvalResolvedAnalytics(
  tool: ToolCallAnalyticsFields,
  result: unknown,
): Record<string, unknown> {
  const parsed = approvalResultSchema.safeParse(result);
  return parsed.success
    ? {
        type: `app-approval-resolved`,
        ...tool,
        approvalResult: normalizeApprovalAction(parsed.data.action),
        approvalPersistence: parsed.data._meta?.persist,
      }
    : { type: `app-approval-resolved`, ...tool, approvalResult: `unknown` };
}

/** turn 维度的 analytics 字段（原 `Fre`）。 */
function turnAnalyticsFields(fields: ToolCallAnalyticsFields): Record<string, unknown> {
  const out: Record<string, unknown> = { transport: fields.transport };
  if (fields.bundleIdentifier != null) out.bundleIdentifier = fields.bundleIdentifier;
  return out;
}

/** 从工具参数提取 bundle identifier（原 `Ire`）。 */
function extractBundleIdentifier(data: any): string | undefined {
  return (
    data.bundleIdentifier ??
    data.bundle_identifier ??
    (typeof data.app === `string` ? data.app : (data.app?.bundleIdentifier ?? data.app?.bundle_identifier)) ??
    data.window?.app
  );
}

/** reasoning effort 的多键回退链（原 `Lre`）。 */
function extractReasoningEffort(data: any): unknown {
  return data.reasoning_effort ?? data.reasoningEffort ?? data.model_reasoning_effort;
}

/** 审批动作 → 结果归一（原 `Rre`；未知动作返回 undefined）。 */
function normalizeApprovalAction(action: string): string | undefined {
  switch (action) {
    case `accept`:
      return `accepted`;
    case `decline`:
      return `declined`;
    case `cancel`:
      return `canceled`;
  }
}

// ---- JSON-RPC schema 与常量（原 zre/No/Bre/Po/Fo/Vre/Io/Hre/Ure）------------

/** native pipe JSON-RPC 消息 schema（原 `zre`）。 */
const jsonRpcMessageSchema: any = unionSchema([
  objectSchema({
    id: unionSchema([numberSchema(), stringSchema()]).optional(),
    jsonrpc: literalSchema(`2.0`),
    method: stringSchema(),
    params: unknownSchema().optional(),
  }).loose(),
  objectSchema({
    id: unionSchema([numberSchema(), stringSchema()]),
    jsonrpc: literalSchema(`2.0`),
    result: unknownSchema(),
  }).loose(),
  objectSchema({
    error: objectSchema({
      code: numberSchema(),
      data: unknownSchema().optional(),
      message: stringSchema(),
    }).loose(),
    id: unionSchema([numberSchema(), stringSchema()]),
    jsonrpc: literalSchema(`2.0`),
  }).loose(),
]);

/** request 消息的 params schema（原 `No`）。 */
const requestParamsSchema: any = objectSchema({
  codexTurnMetadata: unknownSchema().optional(),
  method: stringSchema().trim().min(1),
  params: unknownSchema().optional(),
});

/** turn 元数据 schema（session_id + turn_id，原 `Bre`）。 */
const turnMetadataSchema: any = objectSchema({
  session_id: stringSchema().trim().min(1),
  turn_id: stringSchema().trim().min(1),
});

/** 具名 logger（原 `Po`，r.i → 惰性）。 */
const pipeServerLogger = memoizedTaggedLogger(`computer-use-native-pipe-server`);

/** 入站帧上限（原 `Vre`；与 native-pipe/protocol 的 MAX_FRAME_BYTES 同值）。 */
const MAX_INCOMING_FRAME_BYTES = 8388608;
/** 审批请求 id 前缀（原 `Io`）。 */
const APPROVAL_ID_PREFIX = `computer-use-approval:`;
/** 审批请求的 JSON-RPC method（原 `Hre`）。 */
const APPROVAL_REQUEST_METHOD = `requestComputerUseApproval`;
/** 审批超时（原 `Ure`，5 分钟）。 */
const APPROVAL_TIMEOUT_MS = 3e5;

// ---- 服务端（原 Wre/Gre/Kre/qre/Jre/Yre/Xre/Zre/Qre/Lo/Ro/$re/eie/tie/nie）--

/** analytics 事件回调。 */
export type ComputerUseAnalyticsEventCallback = (event: Record<string, unknown>) => void;

/** 服务端句柄（原 `Wre` 的返回值）。 */
export interface ComputerUseNativePipeServerHandle {
  pipePath: string;
  closeActiveTurn(turn: { sessionId: string; turnId: string }): Promise<boolean>;
  hasActiveTurn(turn: { sessionId: string; turnId: string }): boolean;
  dispose(): Promise<void>;
}

/**
 * 启动 computer-use native pipe 服务端（原 `Wre`）。
 *
 * 仅 win32：经 WindowsHelperTransport（从 transport 模块动态 import）把
 * JSON-RPC request 转发给 computer-use helper 进程。helper 一次只接受一个
 * 在途请求（忙时直接回 -32000 错误）；close/end_turn 请求会关闭 helper。
 * 审批（elicitation）通过 sendResponse 通道往返（id 带 approval 前缀）。
 */
export async function startComputerUseNativePipeServer({
  codexCliPath,
  nativePipeDirectory = DEFAULT_COMPUTER_USE_PIPE_PATH,
  onAnalyticsEvent,
  windowsHelperPath,
  windowsHelperTransportModulePath,
}: {
  codexCliPath?: string;
  nativePipeDirectory?: string;
  onAnalyticsEvent?: ComputerUseAnalyticsEventCallback;
  windowsHelperPath: string;
  windowsHelperTransportModulePath: string;
}): Promise<ComputerUseNativePipeServerHandle> {
  if (windowsHelperPath == null || windowsHelperTransportModulePath == null)
    throw new Error(`Windows Computer Use helper paths are unavailable`);

  let helperTransport: any = null;
  let helperBusy = false;
  const activeTurnBySocket = new Map<Socket, string>();
  const activeTurnAnalyticsBySocket = new Map<Socket, Record<string, unknown>>();

  /** 结束某 socket 的 turn analytics（发 ended 事件并清理）。 */
  const endTurnAnalytics = (socket: Socket) => {
    const fields = activeTurnAnalyticsBySocket.get(socket);
    if (fields != null) {
      onAnalyticsEvent?.({ type: `ended`, ...fields });
      activeTurnAnalyticsBySocket.delete(socket);
    }
  };

  /** 惰性构造 helper transport（动态 import transport 模块）。 */
  const getHelperTransport = async () => {
    helperTransport ??= new (await import(pathToFileURL(windowsHelperTransportModulePath).href)).WindowsHelperTransport({
      helperArgs: [`--parent-pid`, String(process.pid)],
      helperCommand: windowsHelperPath,
      helperEnv: codexCliPath == null ? undefined : { [CODEX_CLI_PATH_ENV_KEY]: codexCliPath },
    });
    return helperTransport;
  };

  /** 关闭 helper transport（幂等）。 */
  const closeHelperTransport = async () => {
    const transport = helperTransport;
    if (transport != null) {
      helperTransport = null;
      await transport.close();
      pipeServerLogger().debug(`computer-use native pipe helper transport closed`, { safe: {}, sensitive: {} });
    }
  };

  const approvalBridge = createApprovalBridge(onAnalyticsEvent);
  const server = await startRawPipeServer({
    onListening: (pipePath) => {
      pipeServerLogger().debug(`computer-use native pipe listening`, {
        safe: {},
        sensitive: { pipePath },
      });
      onAnalyticsEvent?.({ type: `server-launched`, transport: NATIVE_PIPE_TRANSPORT });
    },
    onMessage: (message, sendResponse, socket) => {
      const parsed = jsonRpcMessageSchema.safeParse(message);
      if (!parsed.success || approvalBridge.handleApprovalResponse(parsed.data)) return;
      const isTerminal = isTerminalMessage(parsed.data);
      if (helperBusy && !isTerminal) {
        rejectBusyResponse(parsed.data, sendResponse);
        return;
      }
      if (!isTerminal) helperBusy = true;
      handlePipeRequest({
        activeTurnBySocket,
        activeTurnAnalyticsBySocket,
        closeHelperTransport,
        getHelperTransport,
        approvalBridge,
        message: parsed.data,
        onAnalyticsEvent,
        sendResponse,
        socket,
      }).finally(() => {
        if (!isTerminal) helperBusy = false;
      });
    },
    onLastSocketClosed: () => {
      pipeServerLogger().debug(`computer-use native pipe last socket closed`, { safe: {}, sensitive: {} });
      approvalBridge.rejectPendingApprovals(
        new Error(`Computer Use native pipe client disconnected`),
      );
      closeHelperTransport().catch((error) => {
        pipeServerLogger().warning(`computer-use native pipe helper close failed`, {
          safe: {},
          sensitive: { error },
        });
      });
    },
    onSocketClose: (socket) => {
      endTurnAnalytics(socket);
      activeTurnBySocket.delete(socket);
    },
    onSocketError: (error) => {
      pipeServerLogger().warning(`computer-use native pipe socket error`, {
        safe: {},
        sensitive: { error },
      });
    },
    pipePath: nativePipeDirectory,
  });
  return {
    pipePath: server.pipePath,
    closeActiveTurn: async (turn) => {
      const turnKey = turnKeyFor(turn);
      if (!hasActiveTurn(activeTurnBySocket, turn)) return false;
      for (const [socket, key] of activeTurnBySocket) if (key === turnKey) activeTurnBySocket.delete(socket);
      await closeHelperTransport();
      return true;
    },
    hasActiveTurn: (turn) => hasActiveTurn(activeTurnBySocket, turn),
    dispose: async () => {
      approvalBridge.rejectPendingApprovals(
        new Error(`Computer Use native pipe is shutting down`),
      );
      for (const socket of activeTurnAnalyticsBySocket.keys()) endTurnAnalytics(socket);
      try {
        await closeHelperTransport();
      } finally {
        helperTransport = null;
        helperBusy = false;
        await server.dispose();
        activeTurnBySocket.clear();
        activeTurnAnalyticsBySocket.clear();
      }
    },
  };
}

/** 判定终局消息：close 或 end_turn 请求（原 `Gre`）。 */
function isTerminalMessage(message: any): boolean {
  if (`method` in message && message.method === `close`) return true;
  if (!(`method` in message) || message.method !== `request`) return false;
  const parsed = requestParamsSchema.safeParse(message.params);
  return parsed.success && parsed.data.method === `end_turn`;
}

/** helper 忙时直接回错误响应（原 `Kre`）。 */
function rejectBusyResponse(message: any, sendResponse: (response: unknown) => void): void {
  if (message.id != null)
    sendResponse({
      error: { code: -32e3, message: `Computer Use helper already has an active request` },
      id: message.id,
      jsonrpc: `2.0`,
    });
}

/** 处理一条 helper 请求（原 `qre`）：ping/close 直答，request 转发 helper。 */
async function handlePipeRequest({
  activeTurnBySocket,
  activeTurnAnalyticsBySocket,
  closeHelperTransport,
  getHelperTransport,
  approvalBridge,
  message,
  onAnalyticsEvent,
  sendResponse,
  socket,
}: {
  activeTurnBySocket: Map<Socket, string>;
  activeTurnAnalyticsBySocket: Map<Socket, Record<string, unknown>>;
  closeHelperTransport: () => Promise<void>;
  getHelperTransport: () => Promise<any>;
  approvalBridge: ReturnType<typeof createApprovalBridge>;
  message: any;
  onAnalyticsEvent?: ComputerUseAnalyticsEventCallback;
  sendResponse: (response: unknown) => void;
  socket: Socket;
}): Promise<void> {
  const requestId = message.id;
  if (requestId == null || !(`method` in message)) return;
  let startedAt: number | null = null;
  let invocation: Record<string, unknown> | null = null;
  let analytics: ToolCallAnalyticsFields | null = null;
  let terminalStatus: string | null = null;
  try {
    if (message.method === `ping`) {
      sendResponse({ id: requestId, jsonrpc: `2.0`, result: `pong` });
      return;
    }
    if (message.method === `close`) {
      const fields = activeTurnAnalyticsBySocket.get(socket);
      if (fields != null) onAnalyticsEvent?.({ type: `ended`, ...fields });
      activeTurnAnalyticsBySocket.delete(socket);
      activeTurnBySocket.delete(socket);
      pipeServerLogger().debug(`computer-use native pipe close requested`, { safe: {}, sensitive: {} });
      await closeHelperTransport();
      sendResponse({ id: requestId, jsonrpc: `2.0`, result: null });
      return;
    }
    if (message.method !== `request`)
      throw new Error(`Unsupported Computer Use native pipe method`);
    const request = parseRequestParams(message.params);
    const tool = toolCallAnalyticsFields(request.method, request.params, request.codexTurnMetadata);
    invocation = toolInvocationMetadata(request.codexTurnMetadata);
    analytics = tool;
    trackTurnStart({
      activeTurnAnalyticsBySocket,
      activeTurnBySocket,
      analyticsFields: tool,
      onAnalyticsEvent,
      request,
      socket,
    });
    startedAt = performance.now();
    const result = await (await getHelperTransport()).request(request.method, request.params, {
      codexTurnMetadata: request.codexTurnMetadata,
      createElicitation: (elicitation: unknown) =>
        approvalBridge.requestApprovalForSender(sendResponse, elicitation),
    });
    terminalStatus = `completed`;
    sendResponse({ id: requestId, jsonrpc: `2.0`, result });
  } catch (error) {
    if (startedAt != null && terminalStatus == null) terminalStatus = `failed`;
    sendResponse({
      error: { code: -32e3, message: error instanceof Error ? error.message : String(error) },
      id: requestId,
      jsonrpc: `2.0`,
    });
  } finally {
    if (startedAt != null && invocation != null && analytics != null && terminalStatus != null) {
      onAnalyticsEvent?.({
        type: `tool-called`,
        ...analytics,
        ...invocation,
        terminalStatus,
        mcpErrorPresent: terminalStatus === `failed`,
        durationMs: Math.round(performance.now() - startedAt),
      });
    }
  }
}

/** 解析 request 的 params（原 `Jre`，schema.parse 失败抛错）。 */
function parseRequestParams(params: unknown): {
  codexTurnMetadata: unknown;
  method: string;
  params: unknown;
} {
  const parsed = requestParamsSchema.parse(params);
  return { codexTurnMetadata: parsed.codexTurnMetadata, method: parsed.method, params: parsed.params };
}

/**
 * 审批桥（原 `Yre`）：审批请求经 sendResponse 发给客户端，响应按 id 前缀
 * 匹配回 pending 表；5 分钟超时；关闭时全部拒绝。
 */
function createApprovalBridge(onAnalyticsEvent?: ComputerUseAnalyticsEventCallback) {
  interface PendingApproval {
    reject: (error: Error) => void;
    resolve: (value: unknown) => void;
    timeout: NodeJS.Timeout;
    tool: ToolCallAnalyticsFields;
  }
  const pendingApprovals = new Map<string, PendingApproval>();
  return {
    /** 处理审批响应（id 带 approval 前缀）；返回是否已消费。 */
    handleApprovalResponse(message: any): boolean {
      const id = message.id;
      if (typeof id !== `string` || !id.startsWith(APPROVAL_ID_PREFIX)) return false;
      const pending = pendingApprovals.get(id);
      if (pending == null) return true;
      pendingApprovals.delete(id);
      clearTimeout(pending.timeout);
      if (`error` in message && message.error != null) {
        onAnalyticsEvent?.(approvalResolvedAnalytics(pending.tool, undefined));
        pending.reject(new Error(message.error.message));
        return true;
      }
      const result = `result` in message ? message.result : undefined;
      onAnalyticsEvent?.(approvalResolvedAnalytics(pending.tool, result));
      pending.resolve(result);
      return true;
    },
    /** 拒绝全部 pending 审批。 */
    rejectPendingApprovals(error: Error): void {
      for (const pending of pendingApprovals.values()) {
        clearTimeout(pending.timeout);
        pending.reject(error);
      }
      pendingApprovals.clear();
    },
    /** 发起审批请求并等待响应（原 requestApprovalForSender）。 */
    requestApprovalForSender(
      sendResponse: (response: unknown) => void,
      elicitation: unknown,
    ): Promise<unknown> {
      return new Promise((resolve, reject) => {
        const approvalId = `${APPROVAL_ID_PREFIX}${randomUUID()}`;
        const tool = approvalRequestAnalyticsFields(elicitation);
        onAnalyticsEvent?.({ type: `app-approval-requested`, ...tool });
        const timeout = setTimeout(() => {
          pendingApprovals.delete(approvalId);
          onAnalyticsEvent?.({
            type: `app-approval-resolved`,
            ...tool,
            approvalResult: `timeout`,
          });
          reject(new Error(`Computer Use app approval timed out`));
        }, APPROVAL_TIMEOUT_MS);
        timeout.unref();
        pendingApprovals.set(approvalId, { reject, resolve, timeout, tool });
        sendResponse({ id: approvalId, jsonrpc: `2.0`, method: APPROVAL_REQUEST_METHOD, params: elicitation });
      });
    },
  };
}

/** turn 开始时更新活跃表并发 started 事件（原 `Xre`）。 */
function trackTurnStart({
  activeTurnAnalyticsBySocket,
  activeTurnBySocket,
  analyticsFields,
  onAnalyticsEvent,
  request,
  socket,
}: {
  activeTurnAnalyticsBySocket: Map<Socket, Record<string, unknown>>;
  activeTurnBySocket: Map<Socket, string>;
  analyticsFields: ToolCallAnalyticsFields;
  onAnalyticsEvent?: ComputerUseAnalyticsEventCallback;
  request: { codexTurnMetadata?: unknown };
  socket: Socket;
}): void {
  const turnKey = turnKeyFromRequest(request);
  if (turnKey == null || activeTurnBySocket.get(socket) === turnKey) return;
  const previous = activeTurnAnalyticsBySocket.get(socket);
  if (previous != null) onAnalyticsEvent?.({ type: `ended`, ...previous });
  activeTurnBySocket.set(socket, turnKey);
  const fields = turnAnalyticsFields(analyticsFields);
  activeTurnAnalyticsBySocket.set(socket, fields);
  onAnalyticsEvent?.({ type: `started`, ...fields });
}

/** 从请求的 codexTurnMetadata 提取 turn 键（原 `Zre`）。 */
function turnKeyFromRequest(request: { codexTurnMetadata?: unknown }): string | null {
  const parsed = turnMetadataSchema.safeParse(request.codexTurnMetadata);
  return parsed.success
    ? turnKeyFor({ sessionId: parsed.data.session_id, turnId: parsed.data.turn_id })
    : null;
}

/**
 * 原始管道服务端（原 `Qre`）：listen 前清理残留 socket 文件；帧协议为
 * 4 字节长度前缀（本机字节序）+ UTF-8 JSON，入站上限 8MB（超限销毁 socket）。
 */
async function startRawPipeServer({
  onListening,
  onLastSocketClosed,
  onMessage,
  onSocketClose,
  onSocketError,
  pipePath,
}: {
  onListening: (pipePath: string) => void;
  onLastSocketClosed: () => void;
  onMessage: (message: any, sendResponse: (response: unknown) => void, socket: Socket) => void;
  onSocketClose: (socket: Socket) => void;
  onSocketError: (error: Error) => void;
  pipePath: string;
}): Promise<{ pipePath: string; dispose: () => Promise<void> }> {
  removeStaleSocketFile(pipePath);
  const sockets = new Set<Socket>();
  const pendingDataBySocket = new Map<Socket, Buffer>();
  const server = createServer((socket) => {
    sockets.add(socket);
    pendingDataBySocket.set(socket, Buffer.alloc(0));
    const sendResponse = (response: unknown) => {
      if (!socket.destroyed) socket.write(encodeFrame(JSON.stringify(response)));
    };
    socket.on(`data`, (data) => {
      const incoming = Buffer.isBuffer(data) ? data : Buffer.from(data);
      const pending = pendingDataBySocket.get(socket) ?? Buffer.alloc(0);
      const parsed = decodeFrames(Buffer.concat([pending, incoming]), MAX_INCOMING_FRAME_BYTES);
      if (parsed == null) {
        pendingDataBySocket.delete(socket);
        socket.destroy();
        return;
      }
      pendingDataBySocket.set(socket, parsed.remainingData);
      for (const frame of parsed.messages) {
        try {
          onMessage(JSON.parse(frame), sendResponse, socket);
        } catch {
          continue;
        }
      }
    });
    socket.on(`error`, onSocketError);
    socket.on(`close`, () => {
      onSocketClose(socket);
      sockets.delete(socket);
      pendingDataBySocket.delete(socket);
      if (sockets.size === 0) onLastSocketClosed();
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once(`error`, reject);
    server.listen(pipePath, () => {
      server.off(`error`, reject);
      resolve();
    });
  });
  onListening(pipePath);
  return {
    pipePath,
    dispose: async () => {
      for (const socket of sockets) socket.destroy();
      sockets.clear();
      pendingDataBySocket.clear();
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
      removeStaleSocketFile(pipePath);
    },
  };
}

/** 是否有活跃 turn（原 `Lo`）。 */
function hasActiveTurn(activeTurnBySocket: Map<Socket, string>, turn: { sessionId: string; turnId: string }): boolean {
  const turnKey = turnKeyFor(turn);
  for (const key of activeTurnBySocket.values()) if (key === turnKey) return true;
  return false;
}

/** turn 键（原 `Ro`）：sessionId 与 turnId 以 NUL 连接。 */
function turnKeyFor({ sessionId, turnId }: { sessionId: string; turnId: string }): string {
  return `${sessionId}\0${turnId}`;
}

/** unix 下删除残留 socket 文件（原 `tie`/`nie`：listen 前 / dispose 后）。 */
function removeStaleSocketFile(pipePath: string): void {
  if (process.platform !== `win32` && existsSync(pipePath)) unlinkSync(pipePath);
}

// ---- 客户端单例（原 Uo/Wo/fie/pie）------------------------------------------

/** 具名 logger（原 `Uo`，r.i → 惰性）。 */
const pipeClientLogger = memoizedTaggedLogger(`computer-use-native-pipe`);

/** computer-use native pipe 客户端面。 */
export interface ComputerUseNativePipeClient {
  closeActiveTurn(turn: { sessionId: string; turnId: string }): Promise<boolean>;
  ensureReadyPipePath(): Promise<string | null>;
  hasActiveTurn(turn: { sessionId: string; turnId: string }): boolean;
  refresh(): void;
  setDesktopFeatureAvailability(availability: { computerUse?: boolean }): void;
  dispose(): void;
}

/** 查询当前客户端的管道路径（无客户端时 resolve null）（原 `fie`）。 */
export function getComputerUseNativePipePath(): Promise<string | null> {
  return activeComputerUseNativePipeClient?.ensureReadyPipePath() ?? Promise.resolve(null);
}

/**
 * 创建 computer-use native pipe 客户端并登记为模块单例（原 `pie`）。
 *
 * 仅 win32 生效。启动序列：ensure notify 配置 → 启动服务端；helper 路径
 * 变化时 dispose 旧服务端再起新的；desktopFeatureAvailability 的 computerUse
 * 开关驱动启停。所有转换经内存 promise 去重（startup/refresh 各一个）。
 */
export function createComputerUseNativePipeClient({
  codexHome = resolveCodexHome(),
  ensureNotifyConfig = ensureComputerUseNotifyConfig,
  codexCliPath,
  onAnalyticsEvent,
  platform: platformName = process.platform,
  resourcesPath = resolveElectronResourcesPath({ env: process.env, resourcesPath: process.resourcesPath }),
  startServer = startComputerUseNativePipeServer,
}: {
  codexHome?: string;
  ensureNotifyConfig?: (input: { codexHome: string; windowsHelperPath: string }) => Promise<{ status: string }>;
  codexCliPath?: string;
  onAnalyticsEvent?: ComputerUseAnalyticsEventCallback;
  platform?: string;
  resourcesPath?: string | null;
  startServer?: typeof startComputerUseNativePipeServer;
} = {}): ComputerUseNativePipeClient {
  let enabled = false;
  let server: ComputerUseNativePipeServerHandle | null = null;
  let helperPathsUsed: { windowsHelperPath: string; windowsHelperTransportModulePath: string } | null = null;
  let refreshPromise: Promise<void> | null = null;
  let startupPromise: Promise<void> | null = null;

  /** dispose 当前服务端（幂等）。 */
  const disposeServer = async () => {
    const current = server;
    server = null;
    helperPathsUsed = null;
    if (current != null) await current.dispose();
  };

  /** 从 resourcesPath 解析 helper 路径。 */
  const resolveHelperPaths = () => ({
    windowsHelperPath: resolveWindowsComputerUseHelperPath(resourcesPath),
    windowsHelperTransportModulePath: resolveWindowsComputerUseHelperTransportModulePath(resourcesPath),
  });

  /** 确保服务端已启动（可传入 helper 路径覆盖）。 */
  const ensureStarted = (pathsOverride?: { windowsHelperPath: string; windowsHelperTransportModulePath: string }) => {
    if (!enabled || platformName !== `win32` || server != null) return Promise.resolve();
    if (startupPromise != null) return startupPromise;
    const startup: Promise<void> = Promise.resolve()
      .then(async () => {
        try {
          const paths = pathsOverride ?? resolveHelperPaths();
          const { windowsHelperPath, windowsHelperTransportModulePath } = paths;
          if (!enabled || platformName !== `win32`) return;
          if (windowsHelperPath == null || windowsHelperTransportModulePath == null) {
            pipeClientLogger().info(`computer-use native pipe helper paths unavailable`, {
              safe: {
                missingHelperPath: windowsHelperPath == null,
                missingTransportModulePath: windowsHelperTransportModulePath == null,
                platform: platformName,
              },
            });
            return;
          }
          try {
            const result = await ensureNotifyConfig({ codexHome, windowsHelperPath });
            pipeClientLogger().info(`computer-use notify config ensure finished`, {
              safe: { platform: platformName, status: result.status },
            });
          } catch (error) {
            pipeClientLogger().warning(`computer-use notify config ensure failed`, {
              safe: { platform: platformName },
              sensitive: { error },
            });
            throw error;
          }
          const started = await startServer({
            codexCliPath,
            onAnalyticsEvent,
            windowsHelperPath,
            windowsHelperTransportModulePath,
          });
          if (!enabled || platformName !== `win32`) {
            await started.dispose();
            return;
          }
          server = started;
          helperPathsUsed = paths;
          pipeClientLogger().info(`computer-use native pipe startup ready`, {
            safe: { platform: platformName },
            sensitive: { pipePath: server.pipePath },
          });
        } catch (error) {
          pipeClientLogger().warning(`computer-use native pipe startup failed`, {
            safe: { platform: platformName },
            sensitive: { error },
          });
        }
      })
      .finally(() => {
        if (startupPromise === startup) startupPromise = null;
      });
    startupPromise = startup;
    return startup;
  };

  /** helper 路径变化时重建服务端（原 `_`）。 */
  const refresh = () => {
    if (refreshPromise != null) return refreshPromise;
    const refreshRun: Promise<void> = Promise.resolve()
      .then(async () => {
        try {
          if (
            !enabled ||
            platformName !== `win32` ||
            (startupPromise != null && (await startupPromise), !enabled || platformName !== `win32`)
          )
            return;
          if (server == null) {
            await ensureStarted();
            return;
          }
          const paths = resolveHelperPaths();
          if (
            helperPathsUsed?.windowsHelperPath === paths.windowsHelperPath &&
            helperPathsUsed?.windowsHelperTransportModulePath === paths.windowsHelperTransportModulePath
          )
            return;
          pipeClientLogger().info(`computer-use native pipe helper paths changed`, {
            safe: { platform: platformName },
          });
          await disposeServer();
          await ensureStarted(paths);
        } catch (error) {
          pipeClientLogger().warning(`computer-use native pipe refresh failed`, {
            safe: { platform: platformName },
            sensitive: { error },
          });
        }
      })
      .finally(() => {
        if (refreshPromise === refreshRun) refreshPromise = null;
      });
    refreshPromise = refreshRun;
    return refreshRun;
  };

  const client: ComputerUseNativePipeClient = {
    closeActiveTurn: (turn) => server?.closeActiveTurn(turn) ?? Promise.resolve(false),
    ensureReadyPipePath: async () => {
      await ensureStarted();
      return server?.pipePath ?? null;
    },
    hasActiveTurn: (turn) => server?.hasActiveTurn(turn) ?? false,
    refresh: () => {
      refresh();
    },
    setDesktopFeatureAvailability: (availability) => {
      if (availability.computerUse != null) {
        enabled = availability.computerUse;
        if (!enabled) {
          void disposeServer();
          return;
        }
        void ensureStarted();
      }
    },
    dispose: () => {
      enabled = false;
      void disposeServer();
      if (activeComputerUseNativePipeClient === client) activeComputerUseNativePipeClient = null;
    },
  };
  activeComputerUseNativePipeClient = client;
  return client;
}
