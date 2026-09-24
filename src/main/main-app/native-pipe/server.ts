// native-pipe 服务端 + 管道客户端（原 main-C-Mhak1n.ts 13,351-13,797 行的
// `pse/mse/hse/Wl/gse/_se/vse/yse/bse/xse/Gl/Sse/Cse/wse/ql/Tse/Ese/Dse/Ose/kse/Jl/Ase/Yl/jse/Mse/Nse/Pse/Xl`）。
//
// 三个消费面：
//   1. `NativePipeServer`（原 `Tse`）+ `createNativePipeServer`（原 `ql`）：
//      通用多客户端 native pipe 服务端。帧协议（4 字节本机字节序长度前缀 +
//      UTF-8 JSON，上限 MAX_FRAME_BYTES）被 computer-use / dynamic-app-tools /
//      node-repl host services / browser-use 四方复用（深析 §3.1）。
//      客户端 id 通过 `__native_pipe_request_<clientId>:<原始 id>` 前缀编码在
//      JSON-RPC id 中，sendMessage 按前缀路由回对应 socket。
//   2. `PipeClientConnection`（原 `cse`）：单 socket 客户端连接（带
//      singleResponse / closeListener / decodeMessage 钩子）。
//   3. Chrome tab mention 客户端（原 `gse/_se/vse/yse/bse`）：发现并连接
//      管道目录下的 Chrome 扩展 provider，供 browser-use 的 tab mention 功能使用。
//
// 管道目录管理（原 `jse/Mse/Nse/Pse/Xl`）：win32 用命名管道随机名；unix 在
// 共享目录下创建 `<uuid>.sock`，启动前清理残留 socket 文件，并探测目录是否
// 被占用（200ms 探测连接超时）。
//
// 本模块无模块加载期副作用（类/函数定义 + 空容器/常量构造）。

import { createConnection, createServer, type Socket } from "node:net";
import { existsSync, unlinkSync } from "node:fs";
import { mkdir, readdir, lstat, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { join, win32 } from "node:path";
import { platform } from "node:process";
import { Buffer } from "node:buffer";

// @chunk/shared 的压缩名导出，按语义重命名导入：
//   Bc → isKnownBrowserFamily（浏览器家族注册表判定）
import { Bc as isKnownBrowserFamily } from "@chunk/shared";

import { RpcChannel } from "../browser-use/rpc-client";
import {
  MAX_FRAME_BYTES,
  FrameDecoder,
  decodeFrames,
  encodeFrame,
  ensureError,
} from "./protocol";
import type { SocketPeerAuthorizer } from "./peer-socket-authorizer";

// ---- 常量（原 pse/mse/hse/Wl/wse/Kl）---------------------------------------

/** Chrome tab mention 客户端连接超时（原 `pse`）。 */
const CONNECT_TIMEOUT_MS = 1e3;
/** Chrome tab mention 客户端请求超时（原 `mse`）。 */
const REQUEST_TIMEOUT_MS = 3e3;
/** 管道发现的最大并发连接数（原 `hse`）。 */
const MAX_DISCOVERY_CONCURRENCY = 8;
/** Windows 命名管道根（原 `Wl`）。 */
const WINDOWS_PIPE_ROOT = `\\\\.\\pipe\\`;
/** 管道占用探测超时（原 `wse`）。 */
const PIPE_IN_USE_PROBE_TIMEOUT_MS = 200;
/** 客户端 id 路由前缀（原 `Kl`）。 */
const CLIENT_ID_REQUEST_PREFIX = `__native_pipe_request_`;

/** browser-use 管道目录（原 `In`，2,771 行：按平台返回共享管道路径/目录）。 */
export function browserUsePipePathForPlatform(platformName: string): string {
  return platformName === `win32` ? `\\\\.\\pipe\\codex-browser-use` : `/tmp/codex-browser-use`;
}

// ---- PipeClientConnection（原 cse）-----------------------------------------

/** 单连接客户端的选项（原 `cse` 构造第二参）。 */
export interface PipeClientConnectionOptions {
  /** 帧上限。 */
  maxFrameBytes: number;
  /** singleResponse 模式：缓存第一帧响应，close 时回放给回调。 */
  singleResponse?: boolean;
  /** 关闭 socket 的自定义实现（默认 socket.end()）。 */
  closeSocket?: () => void;
  /** close 早于响应时的错误文案。 */
  closedBeforeResponseMessage?: string;
  /** 解码后的消息再加工（如 Chrome tab mention 的 schema 校验）。 */
  decodeMessage: (message: any) => any | undefined;
}

/**
 * native pipe 单连接客户端（原 `cse`）。
 *
 * - data → FrameDecoder → decodeMessage → 回调（或 singleResponse 缓存）。
 * - close/error 后 markClosed，一次性触发 closeListeners。
 * - singleResponse 模式下若 socket 在响应前关闭，close 时把缓存响应投递给
 *   回调（Chrome tab mention 的「响应可能先于 close 到达」语义）。
 */
export class PipeClientConnection {
  private socket: Socket | null;
  private options: PipeClientConnectionOptions;
  private closeListeners = new Set<(error?: Error) => void>();
  private frameDecoder: FrameDecoder;
  private messageCallback: ((message: any) => void) | null = null;
  private closePromise: Promise<void> | null = null;
  private terminalClose: { error?: Error } | null = null;
  private pendingResponse: { message: any } | null = null;

  constructor(socket: Socket | null, options: PipeClientConnectionOptions) {
    this.socket = socket;
    this.options = options;
    this.frameDecoder = new FrameDecoder(options.maxFrameBytes, options.singleResponse);
    const connectedSocket = this.socket;
    if (connectedSocket != null) {
      connectedSocket.on(`data`, (data: Buffer) => {
        // socket 已被替换/关闭则忽略（this.socket === n 守卫）
        if (this.socket === connectedSocket) this.handleData(data);
      });
      connectedSocket.on(`error`, (error) => {
        if (this.socket === connectedSocket) void this.close(error);
      });
      connectedSocket.on(`close`, () => {
        if (this.socket !== connectedSocket) return;
        if (this.pendingResponse != null) {
          // singleResponse：把已收到的响应回放给回调再标记关闭
          try {
            this.messageCallback?.(this.pendingResponse.message);
            void this.markClosed();
          } catch (error) {
            void this.markClosed(ensureError(error));
          }
          return;
        }
        void this.markClosed(
          new Error(
            this.options.closedBeforeResponseMessage ?? `native pipe closed before response`,
          ),
        );
      });
    }
  }

  /** 发送一条 JSON 消息（编码为帧并写出）。 */
  sendMessage(message: unknown): void {
    if (this.socket == null) throw new Error(`native pipe is closed`);
    this.socket.write(encodeFrame(JSON.stringify(message), this.options.maxFrameBytes));
  }

  /** 设置消息回调。 */
  setMessageCallback(callback: (message: any) => void): void {
    this.messageCallback = callback;
  }

  /**
   * 注册关闭监听。若已关闭，异步以 terminalClose.error 回调。
   * 返回反注册函数。
   */
  addCloseListener(listener: (error?: Error) => void): () => void {
    this.closeListeners.add(listener);
    if (this.terminalClose != null) {
      Promise.resolve()
        .then(() => listener(this.terminalClose?.error))
        .catch(() => void 0);
    }
    return () => {
      this.closeListeners.delete(listener);
    };
  }

  /** 是否已终止关闭。 */
  isClosed(): boolean {
    return this.terminalClose != null;
  }

  /** 关闭连接（幂等，复用同一次 close promise）。 */
  async close(error?: Error): Promise<void> {
    this.closePromise ??= (async () => {
      const socket = this.socket;
      await this.markClosed(error);
      if (socket != null) {
        try {
          if (this.options.closeSocket == null) socket.end();
          else this.options.closeSocket();
        } catch {
          // 关闭失败静默（原样吞掉）
        }
      }
    })();
    await this.closePromise;
  }

  /** data → 帧解码 → decodeMessage → 回调/缓存；异常则关闭连接。 */
  private handleData(data: Buffer): void {
    try {
      for (const frame of this.frameDecoder.push(data)) {
        const message = this.options.decodeMessage(JSON.parse(frame));
        if (message !== undefined) {
          if (this.options.singleResponse) this.pendingResponse = { message };
          else this.messageCallback?.(message);
        }
      }
    } catch (error) {
      void this.close(ensureError(error));
    }
  }

  /** 标记终止关闭（一次性），并等待全部 close listener 结束。 */
  private async markClosed(error?: Error): Promise<void> {
    if (this.terminalClose != null) return;
    this.terminalClose = { error };
    this.socket = null;
    this.pendingResponse = null;
    await Promise.allSettled([...this.closeListeners].map(async (listener) => listener(error)));
  }
}

// ---- Chrome tab mention 客户端（原 gse/_se/vse/yse/bse/Sse/Cse/xse/Gl）----

/** Chrome tab mention provider 信息（原 `bse` 的返回形状）。 */
export interface ChromeTabMentionProviderInfo {
  protocolVersion: number;
  browserFamily: string;
  buildChannel: string;
  extensionId: string;
  profileInstanceId: string;
  generation: string;
}

/** 发现/连接选项（原 `_se` 的参数）。 */
export interface DiscoverPipeClientsOptions {
  /** 指定 socket 路径（跳过目录发现）。 */
  socketPath?: string;
  /** 管道目录（默认 browser-use 共享管道路径）。 */
  nativePipeDirectory?: string;
  connectTimeoutMs?: number;
  requestTimeoutMs?: number;
  /** 期望的 build channel（不匹配则丢弃）。 */
  expectedBuildChannel?: string;
  /** 期望的扩展 id 列表（不包含则丢弃）。 */
  expectedExtensionIds?: string[];
}

/** 已连接的 provider 客户端。 */
export interface DiscoveredPipeClient {
  client: ChromeTabMentionClient;
  providerInfo: ChromeTabMentionProviderInfo;
}

/**
 * Chrome tab mention 客户端（原 `gse`，继承 browser-use RPC 基类 `kn`）。
 *
 * 请求带超时（超时销毁连接）；`onBrowserTabMentionsInvalidated` 通知经
 * addEventListener 派发给 invalidationListeners。
 */
export class ChromeTabMentionClient extends RpcChannel {
  private apiTransport: PipeClientConnection;
  private requestTimeoutMs: number;
  private invalidationListeners = new Set<() => void>();

  constructor(apiTransport: PipeClientConnection, requestTimeoutMs: number) {
    super(apiTransport);
    this.apiTransport = apiTransport;
    this.requestTimeoutMs = requestTimeoutMs;
    this.addEventListener(`onBrowserTabMentionsInvalidated`, () => {
      for (const listener of this.invalidationListeners) listener();
    });
    apiTransport.addCloseListener(() => {
      this.invalidationListeners.clear();
    });
  }

  /** 连接指定管道并构造客户端（原 `gse.connect`）。 */
  static async connect(
    pipePath: string,
    {
      connectTimeoutMs = CONNECT_TIMEOUT_MS,
      requestTimeoutMs = REQUEST_TIMEOUT_MS,
    }: { connectTimeoutMs?: number; requestTimeoutMs?: number } = {},
  ): Promise<ChromeTabMentionClient> {
    assertPositiveSafeInteger(connectTimeoutMs, `connect timeout`);
    assertPositiveSafeInteger(requestTimeoutMs, `request timeout`);
    const socket = createConnection(pipePath);
    try {
      await waitForConnection(socket, connectTimeoutMs);
      socket.setNoDelay(true);
      return new ChromeTabMentionClient(
        new PipeClientConnection(socket, {
          closeSocket: () => socket.destroy(),
          closedBeforeResponseMessage: `Chrome tab mention native connection closed before response`,
          decodeMessage: decodeChromeTabMentionMessage,
          maxFrameBytes: MAX_FRAME_BYTES,
        }),
        requestTimeoutMs,
      );
    } catch (error) {
      socket.destroy();
      throw error;
    }
  }

  /** 请求 provider 的 getInfo。 */
  async getInfo(): Promise<any> {
    return await this.request(`getInfo`);
  }

  /** 请求聚焦指定标签页。 */
  async focusTab(tabId: number): Promise<void> {
    await this.request(`focusTab`, { tabId });
  }

  /** 请求用户标签页列表（含 favicon）。 */
  async getUserTabs(params: Record<string, unknown>): Promise<any> {
    return await this.request(`getUserTabs`, { includeFavicons: true, ...params });
  }

  /** 注册失效通知监听（连接已关闭则抛错）。 */
  addInvalidationListener(listener: () => void): () => void {
    if (this.apiTransport.isClosed())
      throw new Error(`Chrome tab mention native client is closed`);
    this.invalidationListeners.add(listener);
    return () => {
      this.invalidationListeners.delete(listener);
    };
  }

  /** 注册关闭监听（无 error 参数转发）。 */
  addCloseListener(listener: () => void): () => void {
    return this.apiTransport.addCloseListener(() => listener());
  }

  /** 是否已关闭。 */
  isClosed(): boolean {
    return this.apiTransport.isClosed();
  }

  /** 关闭客户端。 */
  async close(): Promise<void> {
    await this.apiTransport.close(new Error(`Chrome tab mention native client is closed`));
  }

  /** 发送带超时的 JSON-RPC 请求（超时销毁连接并拒绝）。 */
  async request(method: string, params?: unknown): Promise<any> {
    if (this.apiTransport.isClosed())
      throw new Error(`Chrome tab mention native client is closed`);
    let timeout: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timeout = setTimeout(() => {
        const error = new Error(
          `Timed out waiting for Chrome tab mention response to ${method.toString()}`,
        );
        reject(error);
        void this.apiTransport.close(error);
      }, this.requestTimeoutMs);
      timeout.unref();
    });
    try {
      return await Promise.race([this.sendRequest(method, params), timeoutPromise]);
    } catch (error) {
      throw ensureError(error);
    } finally {
      if (timeout != null) clearTimeout(timeout);
    }
  }
}

/**
 * 发现并连接管道目录下的全部 Chrome tab mention provider（原 `_se`）。
 *
 * 无 socketPath 时先枚举目录（win32 列 `\\.\pipe\` 下前缀匹配；unix 过滤
* 当前 uid 的 .sock），再以最多 8 个并发 worker 逐个连接 + getInfo 校验。
 * 返回通过校验的客户端列表（保持目录枚举的排序）。
 */
export async function discoverPipeClients(
  options: DiscoverPipeClientsOptions = {},
): Promise<DiscoveredPipeClient[]> {
  const pipePaths =
    options.socketPath == null
      ? await listPipeDirectory(options.nativePipeDirectory ?? browserUsePipePathForPlatform(platform))
      : [options.socketPath];
  const results: Array<DiscoveredPipeClient | null> = Array(pipePaths.length);
  let nextIndex = 0;
  await Promise.all(
    Array.from({ length: Math.min(pipePaths.length, MAX_DISCOVERY_CONCURRENCY) }, async () => {
      for (; nextIndex < pipePaths.length; ) {
        const index = nextIndex;
        nextIndex += 1;
        const pipePath = pipePaths[index];
        if (pipePath != null) results[index] = await connectPipeClient(pipePath, options);
      }
    }),
  );
  return results.filter((result): result is DiscoveredPipeClient => result != null);
}

/** 枚举管道目录下的候选路径（原 `vse`；失败返回空数组）。 */
async function listPipeDirectory(directory: string): Promise<string[]> {
  try {
    if (platform === `win32`) {
      // Windows：列出全部命名管道，保留以目标目录名开头的（排序）
      return (await readdir(WINDOWS_PIPE_ROOT))
        .map((name) => win32.resolve(WINDOWS_PIPE_ROOT, name))
        .filter((pipePath) => pipePath.startsWith(directory))
        .sort();
    }
    const uid = (process as any).getuid?.();
    if (uid == null) return [];
    const entries = await readdir(directory, { withFileTypes: true });
    const socketPaths: string[] = [];
    for (const entry of entries) {
      if (!entry.name.endsWith(`.sock`)) continue;
      const socketPath = join(directory, entry.name);
      try {
        const stats = await lstat(socketPath);
        if (stats.isSocket() && stats.uid === uid) socketPaths.push(socketPath);
      } catch {
        // 单个 lstat 失败跳过（原样吞掉）
      }
    }
    return socketPaths.sort();
  } catch {
    return [];
  }
}

/** 连接单个候选管道并校验 provider 信息（原 `yse`）。 */
async function connectPipeClient(
  pipePath: string,
  options: DiscoverPipeClientsOptions,
): Promise<DiscoveredPipeClient | null> {
  let client: ChromeTabMentionClient | null = null;
  try {
    client = await ChromeTabMentionClient.connect(pipePath, {
      connectTimeoutMs: options.connectTimeoutMs,
      requestTimeoutMs: options.requestTimeoutMs,
    });
    const providerInfo = parseProviderInfo(await client.getInfo());
    if (
      providerInfo == null ||
      (options.expectedBuildChannel != null &&
        providerInfo.buildChannel !== options.expectedBuildChannel) ||
      (options.expectedExtensionIds != null &&
        !options.expectedExtensionIds.includes(providerInfo.extensionId))
    ) {
      await client.close();
      return null;
    }
    return { client, providerInfo };
  } catch {
    await client?.close();
    return null;
  }
}

/** 校验 getInfo 结果为 tab mention provider 信息（原 `bse`）。 */
function parseProviderInfo(info: any): ChromeTabMentionProviderInfo | null {
  const tabMentions = info.browserTabMentions;
  if (info.type !== `extension` || tabMentions?.protocolVersion !== 1) return null;
  const buildChannel = sanitizeNonEmptyString(tabMentions.buildChannel);
  const browserFamily = info.family ?? `chrome`;
  const extensionId = sanitizeNonEmptyString(info.metadata?.extensionId);
  const extensionInstanceId = sanitizeNonEmptyString(info.metadata?.extensionInstanceId);
  const generation = sanitizeNonEmptyString(tabMentions.generation);
  if (
    !isKnownBrowserFamily(browserFamily) ||
    buildChannel == null ||
    extensionId == null ||
    extensionInstanceId == null ||
    generation == null
  )
    return null;
  return {
    protocolVersion: 1,
    browserFamily,
    buildChannel,
    extensionId,
    profileInstanceId: extensionInstanceId,
    generation,
  };
}

/** 校验超时参数为正安全整数（原 `Gl`）。 */
function assertPositiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`Invalid ${name}`);
}

/**
 * Chrome tab mention 传输消息解码（原 `Sse`）：
 * - 失效通知（无 id/result/error 的 2.0 通知）→ 返回 undefined（仅触发 close
 *   listener 侧的派发路径由 handleIncomingMessage 处理，此处吞掉）。
 * - 其余消息经 JSON-RPC schema 校验（原 `ste`，2,707 行），失败抛错。
 */
function decodeChromeTabMentionMessage(message: any): any | undefined {
  if (
    typeof message === `object` &&
    message &&
    `jsonrpc` in message &&
    message.jsonrpc === `2.0` &&
    `method` in message &&
    typeof message.method === `string` &&
    message.method !== `onBrowserTabMentionsInvalidated` &&
    !(`id` in message) &&
    !(`result` in message) &&
    !(`error` in message)
  ) {
    // 未知通知：原样吞掉（原 Sse 返回 undefined）
    return;
  }
  const parsed = parseJsonRpcResponseMessage(message);
  if (parsed == null)
    throw new Error(`Invalid Chrome tab mention native transport message`);
  return parsed;
}

/**
 * JSON-RPC 响应消息校验（原 `ste`，2,707-2,733 行）。
 * 严格白名单键；result/error 的载荷递归校验为 JSON 值。
 */
function parseJsonRpcResponseMessage(message: any): any | null {
  const obj = shallowPlainObject(message);
  if (obj == null || obj.jsonrpc !== `2.0`) return null;
  if (obj.method === `onBrowserTabMentionsInvalidated`) {
    // 严格形态的失效通知（params 必须缺省）——原样返回两种规范化形态
    if (!hasOnlyKeys(obj, [`jsonrpc`, `method`, `params`]) || (obj.params !== undefined && obj.params !== null))
      return null;
    return obj.params === null
      ? { jsonrpc: `2.0`, method: obj.method, params: null }
      : { jsonrpc: `2.0`, method: obj.method };
  }
  if (!isSafeInteger(obj.id)) return null;
  if (Object.hasOwn(obj, `result`)) {
    return hasOnlyKeys(obj, [`jsonrpc`, `id`, `result`]) && isJsonValue(obj.result)
      ? { jsonrpc: `2.0`, id: obj.id, result: obj.result }
      : null;
  }
  const error = shallowPlainObject(obj.error);
  if (
    !hasOnlyKeys(obj, [`jsonrpc`, `id`, `error`]) ||
    error == null ||
    !hasOnlyKeys(error, [`code`, `message`, `data`]) ||
    typeof error.code !== `number` ||
    !Number.isInteger(error.code) ||
    typeof error.message !== `string` ||
    (Object.hasOwn(error, `data`) && !isJsonValue(error.data))
  )
    return null;
  return Object.hasOwn(error, `data`)
    ? { jsonrpc: `2.0`, id: obj.id, error: { code: error.code, message: error.message, data: error.data } }
    : { jsonrpc: `2.0`, id: obj.id, error: { code: error.code, message: error.message } };
}

/** 浅拷贝的普通对象（非 null/数组）（原 `jn`）。 */
function shallowPlainObject(value: any): Record<string, any> | undefined {
  return typeof value === `object` && value && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : undefined;
}

/** 对象键是否全部在白名单内（原 `Mn`）。 */
function hasOnlyKeys(obj: Record<string, any>, keys: string[]): boolean {
  return Object.keys(obj).every((key) => keys.includes(key));
}

/** 安全整数判定（原 `Nn`）。 */
function isSafeInteger(value: unknown): value is number {
  return typeof value === `number` && Number.isSafeInteger(value);
}

/** 递归校验 JSON 可表达值（原 `Pn`）。 */
function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === `string` || typeof value === `boolean`) return true;
  if (typeof value === `number`) return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  const obj = shallowPlainObject(value);
  return obj != null && Object.values(obj).every(isJsonValue);
}

/** 非空短字符串（≤128、trim 后非空且通过 shared 校验）（原 `An`，2,702 行）。 */
function sanitizeNonEmptyString(value: any): string | null {
  const MAX_LENGTH = 128; // 原 `ate`
  return typeof value === `string` &&
    value.length > 0 &&
    value.length <= MAX_LENGTH &&
    value.trim().length > 0 &&
    isPrintableString(value)
    ? value
    : null;
}

/**
 * shared 的 n.Kc（可打印字符串校验）内联等价：按 JSON.stringify 转义结果
 * 判定无控制字符。shared 重写后应切回真实导出。
 */
function isPrintableString(value: string): boolean {
  const escaped = JSON.stringify(value);
  return !/\\u[0-9a-fA-F]{4}/.test(escaped.slice(1, -1));
}

/** 等 socket connect 或超时（原 `xse`）。 */
function waitForConnection(socket: Socket, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out connecting to Chrome tab mention provider`));
    }, timeoutMs);
    timer.unref();
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      clearTimeout(timer);
      socket.off(`connect`, onConnect);
      socket.off(`error`, onError);
    };
    socket.on(`connect`, onConnect);
    socket.on(`error`, onError);
  });
}

// ---- NativePipeServer（原 ql/Tse）------------------------------------------

/** 服务端事件钩子（原 `ql` 的 events 参数）。 */
export interface NativePipeServerEvents {
  onListening?: (pipePath: string) => void;
  onRejectedSocket?: (result: { authorized: boolean; reason?: string }) => void;
  onAuthorizationError?: (error: unknown) => void;
  onSocketError?: (error: Error) => void;
  onInvalidFrame?: () => void;
}

/** createNativePipeServer 的参数（原 `ql`）。 */
export interface CreateNativePipeServerOptions {
  /** 管道路径；缺省时在管道目录下生成随机名。 */
  pipePath?: string;
  /** 管道目录（pipePath 缺省时使用）。 */
  nativePipeDirectory?: string;
  /** 入站帧上限。 */
  maxIncomingFrameBytes?: number;
  /** 出站帧上限。 */
  maxOutgoingFrameBytes?: number;
  /** socket 对端鉴权器（缺省全放行）。 */
  socketPeerAuthorizer?: SocketPeerAuthorizer;
  events?: NativePipeServerEvents;
}

/**
 * 创建并启动 native pipe 服务端（原 `ql`）。
 * 启动失败时先 close 再抛出。
 */
export async function createNativePipeServer(
  options: CreateNativePipeServerOptions,
): Promise<NativePipeServer> {
  const server = new NativePipeServer(
    options.pipePath ?? (await generatePipePath(options.nativePipeDirectory)),
    options.maxIncomingFrameBytes,
    options.maxOutgoingFrameBytes,
    options.socketPeerAuthorizer ?? (() => ({ authorized: true })),
    options.events ?? {},
  );
  try {
    await server.start();
    return server;
  } catch (error) {
    await server.close();
    throw error;
  }
}

/** 服务端消息（JSON-RPC 请求/响应；id 可被客户端路由前缀改写）。 */
export type NativePipeMessage = Record<string, any>;

/**
 * 多客户端 native pipe 服务端（原 `Tse`）。
 *
 * - start()：unix 下先清理残留 socket 文件再 listen；win32 直接 listen 命名管道。
 * - 每个 socket 分配单调递增的 clientId；入站请求的 id 改写为
 *   `__native_pipe_request_<clientId>:<原始 id>`，sendMessage 按前缀路由。
 * - 广播：无路由前缀的 method 消息（通知）发给全部 socket。
 * - close()：销毁全部 socket、关 server、unix 下删除 socket 文件。
 */
export class NativePipeServer {
  pipePath: string;
  maxIncomingFrameBytes: number | undefined;
  maxOutgoingFrameBytes: number | undefined;
  private socketPeerAuthorizer: SocketPeerAuthorizer;
  private events: NativePipeServerEvents;
  private sockets = new Set<Socket>();
  private pendingDataBySocket = new Map<Socket, Buffer>();
  private socketsByClientId = new Map<string, Socket>();
  private clientIdsBySocket = new Map<Socket, string>();
  private server = createServer((socket) => {
    this.handleSocketConnection(socket);
  });
  private messageCallback: ((message: NativePipeMessage) => void) | null = null;
  private nextClientId = 1;
  private started = false;
  private ownsPipePath = false;

  constructor(
    pipePath: string,
    maxIncomingFrameBytes: number | undefined,
    maxOutgoingFrameBytes: number | undefined,
    socketPeerAuthorizer: SocketPeerAuthorizer,
    events: NativePipeServerEvents,
  ) {
    this.pipePath = pipePath;
    this.maxIncomingFrameBytes = maxIncomingFrameBytes;
    this.maxOutgoingFrameBytes = maxOutgoingFrameBytes;
    this.socketPeerAuthorizer = socketPeerAuthorizer;
    this.events = events;
  }

  /** 启动监听（unix 先清理残留 socket 文件）。 */
  async start(): Promise<void> {
    await removeStalePipePath(this.pipePath);
    await new Promise<void>((resolve, reject) => {
      this.server.once(`error`, reject);
      this.server.listen(this.pipePath, () => {
        this.server.off(`error`, reject);
        resolve();
      });
    });
    this.started = true;
    this.ownsPipePath = true;
    this.events.onListening?.(this.pipePath);
  }

  /**
   * 发送消息：带客户端路由前缀 id 的响应只发给对应 socket；
   * 通知（method 消息）广播给全部存活 socket。
   */
  sendMessage(message: NativePipeMessage): void {
    if (isNotificationMessage(message)) {
      // 广播通知：帧上限未配置时用 encodeFrame 默认（4294967295，与原 Vl 一致）
      const frame = encodeFrame(JSON.stringify(message), this.maxOutgoingFrameBytes);
      for (const socket of this.sockets) if (!socket.destroyed) socket.write(frame);
      return;
    }
    const route = parseClientRoute(message);
    if (route == null) return;
    const socket = this.socketsByClientId.get(route.clientId);
    if (socket == null) return;
    message.id = route.messageId;
    const frame = encodeFrame(JSON.stringify(message), this.maxOutgoingFrameBytes);
    if (!socket.destroyed) socket.write(frame);
  }

  /** 设置入站消息回调。 */
  setMessageCallback(callback: (message: NativePipeMessage) => void): void {
    this.messageCallback = callback;
  }

  /** 关闭服务端（幂等；unix 下删除 socket 文件）。 */
  async close(): Promise<void> {
    const ownedPipePath = this.ownsPipePath;
    for (const socket of this.sockets) socket.destroy();
    this.sockets.clear();
    this.pendingDataBySocket.clear();
    this.clientIdsBySocket.clear();
    this.socketsByClientId.clear();
    if (this.started) {
      await new Promise<void>((resolve) => {
        this.server.close(() => {
          resolve();
        });
      });
      this.started = false;
    }
    this.ownsPipePath = false;
    if (ownedPipePath) deletePipePath(this.pipePath);
  }

  /** 新连接：鉴权 → 登记 → data/error/close 接线。 */
  private handleSocketConnection(socket: Socket): void {
    let authorization: { authorized: boolean; reason?: string };
    try {
      authorization = this.socketPeerAuthorizer(socket);
    } catch (error) {
      this.events.onAuthorizationError?.(error);
      socket.destroy();
      return;
    }
    if (!authorization.authorized) {
      this.events.onRejectedSocket?.(authorization);
      socket.destroy();
      return;
    }
    this.sockets.add(socket);
    this.pendingDataBySocket.set(socket, Buffer.alloc(0));
    const clientId = String(this.nextClientId);
    this.nextClientId += 1;
    this.clientIdsBySocket.set(socket, clientId);
    this.socketsByClientId.set(clientId, socket);
    socket.on(`data`, (data) => {
      this.handleSocketData(socket, data);
    });
    socket.on(`error`, (error) => {
      this.events.onSocketError?.(error);
    });
    socket.on(`close`, () => {
      this.sockets.delete(socket);
      this.pendingDataBySocket.delete(socket);
      const registeredId = this.clientIdsBySocket.get(socket);
      if (registeredId != null) {
        this.clientIdsBySocket.delete(socket);
        this.socketsByClientId.delete(registeredId);
      }
    });
  }

  /** 入站数据：拼接待留数据 → 帧解析（超限销毁）→ 逐帧处理。 */
  private handleSocketData(socket: Socket, data: Buffer | string): void {
    const incoming = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const pending = this.pendingDataBySocket.get(socket) ?? Buffer.alloc(0);
    // 帧上限未配置时用 decodeFrames 默认（4294967295，与原 use 一致）
    const parsed = decodeFrames(Buffer.concat([pending, incoming]), this.maxIncomingFrameBytes);
    if (parsed == null) {
      this.events.onInvalidFrame?.();
      this.pendingDataBySocket.delete(socket);
      socket.destroy();
      return;
    }
    this.pendingDataBySocket.set(socket, parsed.remainingData);
    for (const frame of parsed.messages) this.handleIncomingMessage(socket, frame);
  }

  /** 单帧：JSON 解析 + 对象校验 → 请求 id 加客户端前缀 → 回调。 */
  private handleIncomingMessage(socket: Socket, frame: string): void {
    let message: NativePipeMessage;
    try {
      message = parseTransportMessage(frame);
    } catch {
      return;
    }
    if (isClientRoutedRequest(message)) {
      const clientId = this.clientIdsBySocket.get(socket);
      if (clientId == null) return;
      message.id = buildRoutedId(clientId, message.id);
    }
    this.messageCallback?.(message);
  }
}

/** 构造带客户端路由前缀的 id（原 `Ese`）。 */
function buildRoutedId(clientId: string, messageId: string | number): string {
  return `${CLIENT_ID_REQUEST_PREFIX}${clientId}:${JSON.stringify(messageId)}`;
}

/** 解析消息 id 中的客户端路由（原 `Dse`）。 */
function parseClientRoute(
  message: NativePipeMessage,
): { clientId: string; messageId: string | number } | undefined {
  if (typeof message.id !== `string`) return;
  const id = message.id;
  if (!id.startsWith(CLIENT_ID_REQUEST_PREFIX)) return;
  const rest = id.slice(22); // 前缀长度 22（`__native_pipe_request_`）
  const colonIndex = rest.indexOf(`:`);
  if (colonIndex < 1) return;
  const clientId = rest.slice(0, colonIndex);
  let messageId: unknown;
  try {
    messageId = JSON.parse(rest.slice(colonIndex + 1));
  } catch {
    return;
  }
  if (isStringOrNumber(messageId)) return { clientId, messageId };
}

/** JSON 解析 + 普通对象校验（原 `Ose`）。 */
function parseTransportMessage(frame: string): NativePipeMessage {
  const parsed = JSON.parse(frame);
  if (!isPlainObject(parsed)) throw new Error(`invalid transport message`);
  return parsed;
}

/** 是否为带可路由 id 的请求（原 `kse`）。 */
function isClientRoutedRequest(message: NativePipeMessage): boolean {
  return isNotificationMessage(message) && isStringOrNumber(message.id);
}

/** 是否为 method 消息（请求/通知）（原 `Jl`）。 */
function isNotificationMessage(message: NativePipeMessage): boolean {
  return `method` in message && typeof message.method === `string`;
}

/** 普通对象判定（原 `Ase`）。 */
function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === `object` && !!value && !Array.isArray(value);
}

/** string/number 判定（原 `Yl`）。 */
function isStringOrNumber(value: unknown): value is string | number {
  return typeof value === `string` || typeof value === `number`;
}

// ---- 管道目录管理（原 jse/Mse/Nse/Pse/Xl）----------------------------------

/**
 * 生成新的管道路径（原 `jse`）：
 * win32 → `<目录>-<uuid>` 命名管道；unix → 确保目录存在后 `<目录>/<uuid>.sock`。
 */
export async function generatePipePath(directory?: string): Promise<string> {
  directory ??= browserUsePipePathForPlatform(platform);
  if (platform === `win32`) return `${directory}-${randomUUID()}`;
  await ensurePipeDirectory(directory);
  return join(directory, `${randomUUID()}.sock`);
}

/**
 * 确保管道目录可用（原 `Mse`）：
 * 目录已存在且为 socket 文件时，若管道未被占用则删除后重建；
 * 被占用则抛错（Browser-use native pipe directory path is already in use）。
 */
async function ensurePipeDirectory(directory: string): Promise<void> {
  try {
    await mkdir(directory, { recursive: true });
    return;
  } catch (error) {
    if (!(error instanceof Error && `code` in error && (error as any).code === `EEXIST`)) throw error;
  }
  const stats = await lstat(directory);
  if (!stats.isDirectory()) {
    if (!stats.isSocket())
      throw new Error(`Browser-use native pipe directory path exists and is not a directory`);
    if (await isPipeInUse(directory))
      throw new Error(`Browser-use native pipe directory path is already in use`);
    await unlink(directory);
    await mkdir(directory, { recursive: true });
  }
}

/** listen 前清理残留 socket 文件（原 `Nse`）。 */
async function removeStalePipePath(pipePath: string): Promise<void> {
  if (platform !== `win32` && existsSync(pipePath)) {
    if (await isPipeInUse(pipePath))
      throw new Error(`Browser-use native pipe is already in use`);
    unlinkSync(pipePath);
  }
}

/** close 后删除 socket 文件（原 `Pse`）。 */
function deletePipePath(pipePath: string): void {
  if (platform !== `win32` && existsSync(pipePath)) unlinkSync(pipePath);
}

/**
 * 探测管道路径是否被占用（原 `Xl`）：
 * 尝试连接，200ms 内连上 → 占用；ECONNREFUSED/ENOENT → 未占用；
 * 其他错误 → 抛出。
 */
function isPipeInUse(pipePath: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const socket = createConnection(pipePath);
    let settled = false;
    const timer = setTimeout(() => {
      finish(true);
    }, PIPE_IN_USE_PROBE_TIMEOUT_MS);
    timer.unref();
    const finish = (inUse: boolean | Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      if (inUse instanceof Error) {
        reject(inUse);
        return;
      }
      resolve(inUse);
    };
    socket.once(`connect`, () => {
      finish(true);
    });
    socket.once(`error`, (error: Error & { code?: string }) => {
      if (error.code === `ECONNREFUSED` || error.code === `ENOENT`) {
        finish(false);
        return;
      }
      finish(error);
    });
  });
}
