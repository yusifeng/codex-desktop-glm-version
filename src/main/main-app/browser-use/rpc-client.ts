// browser-use RPC 客户端 —— 原 main-C-Mhak1n.ts 2,555-2,773 行
// （`Dn/Jee/Yee/On/Xee/Zee/Qee/$ee/ete/tte/nte/rte` 环境变量与配置键常量、
// `kn`→RpcChannel、`ite`→BrowserUseClient、`ate/ote/An/ste/jn/Mn/Nn/Pn/cte/lte/Fn`、
// `In`→管道路径）。
//
// 职责：
//   - 定义 browser-use 子系统向宿主进程暴露的全部环境变量键（BROWSER_USE_*）
//     与 `browser/config.toml` 配置键（full_cdp_access_enabled / webmcp_enabled；
//     实际写 TOML 的消费方在 R6 区 ~68,862 行）。
//   - RpcChannel：JSON-RPC 2.0 风格的请求/事件多路复用基类（请求 id 自增、
//     pendingRequests 表、事件监听器、请求处理器注册；transport 关闭时拒绝全部
//     挂起请求）。
//   - BrowserUseClient：RpcChannel 的 browser-use 特化（注册 handler 对象方法、
//     moveMouse / webMcpToolInvoked 事件、ping / onCDPEvent / onCDPDetach /
//     onDownloadChange / onPageEvent / onBrowserTabMentionsInvalidated 通知）。
//   - 消息与 tab id 的严格解析/校验（供 native-pipe 服务端复用）。
//   - 命令分派（dispatchBrowserCommand）与命名管道路径（win32 命名管道 / unix /tmp）。

import { Kc as isSharedBrowserTabId } from "@chunk/shared";

// ---- 常量（原 Dn..rte，2,555-2,566）---------------------------------------

/** browser-use 会话内配置文件相对路径（原 `Dn`）。 */
export const BROWSER_CONFIG_TOML_PATH = `browser/config.toml`;
/** browser/config.toml 键：完整 CDP 访问开关（原 `Jee`）。 */
export const FULL_CDP_ACCESS_ENABLED_KEY = `full_cdp_access_enabled`;
/** browser/config.toml 键：WebMCP 开关（原 `Yee`）。 */
export const WEBMCP_ENABLED_KEY = `webmcp_enabled`;
/** 环境变量键：可用 browser-use 后端列表（原 `On`）。 */
export const BROWSER_USE_AVAILABLE_BACKENDS = `BROWSER_USE_AVAILABLE_BACKENDS`;
/** 环境变量键：宿主 app build flavor（原 `Xee`）。 */
export const BROWSER_USE_CODEX_APP_BUILD_FLAVOR = `BROWSER_USE_CODEX_APP_BUILD_FLAVOR`;
/** 环境变量键：宿主 app 版本（原 `Zee`）。 */
export const BROWSER_USE_CODEX_APP_VERSION = `BROWSER_USE_CODEX_APP_VERSION`;
/** 环境变量键：禁用 ambient 网络（原 `Qee`）。 */
export const BROWSER_USE_DISABLE_AMBIENT_NETWORK = `BROWSER_USE_DISABLE_AMBIENT_NETWORK`;
/** 环境变量键：禁用 API 成员（原 `$ee`）。 */
export const BROWSER_USE_DISABLE_API_MEMBERS = `BROWSER_USE_DISABLE_API_MEMBERS`;
/** 环境变量键：禁用浏览器能力（原 `ete`）。 */
export const BROWSER_USE_DISABLE_BROWSER_CAPABILITIES = `BROWSER_USE_DISABLE_BROWSER_CAPABILITIES`;
/** 环境变量键：禁用标签页能力（原 `tte`）。 */
export const BROWSER_USE_DISABLE_TAB_CAPABILITIES = `BROWSER_USE_DISABLE_TAB_CAPABILITIES`;
/** 环境变量键：安全模式（原 `nte`）。 */
export const BROWSER_USE_SECURITY_MODE = `BROWSER_USE_SECURITY_MODE`;
/** 环境变量键：tinysky 开关（原 `rte`）。 */
export const BROWSER_USE_TINYSKY_ENABLED = `BROWSER_USE_TINYSKY_ENABLED`;

// ---- 类型 -------------------------------------------------------------------

/** JSON-RPC 2.0 请求/通知（browser-use 管道消息）。 */
export interface JsonRpcRequest {
  jsonrpc: `2.0`;
  method?: string;
  params?: unknown;
  id?: number;
}

/** JSON-RPC 2.0 响应（成功或失败）。 */
export interface JsonRpcResponse {
  jsonrpc: `2.0`;
  id?: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/** 任意 JSON-RPC 消息。 */
export type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse;

/** RpcChannel 底层传输。 */
export interface RpcTransport {
  /** 注册入站消息回调（transport 实现负责反序列化）。 */
  setMessageCallback(callback: (message: JsonRpcMessage) => void): void;
  /** 发送一条出站消息（实现负责序列化；发送失败应抛错）。 */
  sendMessage(message: JsonRpcMessage): void;
  /** 可选：注册传输关闭监听（错误对象给出关闭原因）。 */
  addCloseListener?(listener: (error?: Error) => void): void;
}

// ---- RpcChannel（原 kn，2,567-2,661）----------------------------------------

/** JSON-RPC 风格请求/事件多路复用通道。 */
export class RpcChannel {
  transport: RpcTransport;
  nextId = 1;
  pendingRequests = new Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }>();
  requestHandlers = new Map<string, (params: any) => any>();
  eventHandlers = new Map<string, ((params: any) => void)[]>();

  constructor(transport: RpcTransport) {
    this.transport = transport;
    this.transport.setMessageCallback((message) => {
      this.handleIncomingMessage(message);
    });
    this.transport.addCloseListener?.((error) => {
      this.rejectPendingRequests(error?.message ?? `transport closed before response`);
    });
  }

  /** 把一个对象（含原型链）上的全部方法注册为请求处理器。 */
  registerRequestHandlerObject(handlerObject: Record<string | symbol, any>) {
    [
      ...Object.getOwnPropertyNames(handlerObject),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(handlerObject)),
    ]
      .filter((name) => name !== `constructor` && typeof handlerObject[name] == `function`)
      .forEach((name) => {
        let method = handlerObject[name];
        method && this.registerRequestHandler(name, method.bind(handlerObject));
      });
  }

  registerRequestHandler(method: string, handler: (params: any) => any) {
    this.requestHandlers.set(method, handler);
  }

  addEventListener(method: string, listener: (params: any) => void) {
    let key = method.toString(),
      listeners = this.eventHandlers.get(key) ?? [];
    listeners.push(listener);
    this.eventHandlers.set(key, listeners);
  }

  removeEventListener(method: string, listener: (params: any) => void) {
    let key = method.toString(),
      listeners = this.eventHandlers.get(key) ?? [];
    this.eventHandlers.set(
      key,
      listeners.filter((existing) => existing !== listener),
    );
  }

  sendNotification(method: string, params?: unknown) {
    this.transport.sendMessage({ jsonrpc: `2.0`, method, params });
  }

  sendRequest(method: string, params?: unknown): Promise<any> {
    let id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      try {
        this.transport.sendMessage({ jsonrpc: `2.0`, method: method.toString(), params, id });
      } catch (error) {
        this.pendingRequests.delete(id);
        reject(error);
      }
    });
  }

  async handleIncomingMessage(message: JsonRpcMessage) {
    if (`method` in message) return this.handleIncomingRequest(message as JsonRpcRequest);
    if ((message as JsonRpcResponse).id === void 0) return;
    let pending = this.pendingRequests.get((message as JsonRpcResponse).id!);
    if (pending) {
      this.pendingRequests.delete((message as JsonRpcResponse).id!);
      if (`error` in message) {
        pending.reject((message as JsonRpcResponse).error?.message || `Something went wrong`);
        return;
      }
      pending.resolve((message as JsonRpcResponse).result);
    }
  }

  rejectPendingRequests(reason: string) {
    for (let pending of this.pendingRequests.values()) pending.reject(reason);
    this.pendingRequests.clear();
  }

  async handleIncomingRequest(message: JsonRpcRequest) {
    if (message.id === void 0) {
      (this.eventHandlers.get(message.method ?? ``) ?? []).forEach((listener) =>
        listener(message.params),
      );
      return;
    }
    let handler = this.requestHandlers.get(message.method ?? ``);
    if (!handler) {
      this.transport.sendMessage({
        jsonrpc: `2.0`,
        id: message.id,
        error: { code: -1, message: `No handler registered for method: ${message.method}` },
      });
      return;
    }
    try {
      let result = await handler(message.params);
      this.transport.sendMessage({ jsonrpc: `2.0`, id: message.id, result });
    } catch (error) {
      this.transport.sendMessage({
        jsonrpc: `2.0`,
        id: message.id,
        error: { code: 1, message: error instanceof Error ? error.message : String(error) },
      });
    }
  }
}

// ---- BrowserUseClient（原 ite，2,662-2,699）---------------------------------

/** browser-use 侧事件处理器（由宿主进程实现）。 */
export interface BrowserUseClientHandler {
  moveMouse(params: any): unknown;
  [key: string]: any;
}

export interface BrowserUseClientOptions {
  onMoveMouseError?(error: unknown, params: any): void;
  onWebMcpToolInvoked?(params: any): void;
}

/** browser-use 客户端（moveMouse / webMcpToolInvoked 事件 + CDP/下载/页面通知）。 */
export class BrowserUseClient extends RpcChannel {
  handler: BrowserUseClientHandler;
  options: BrowserUseClientOptions;

  constructor(
    transport: RpcTransport,
    handler: BrowserUseClientHandler,
    options: BrowserUseClientOptions = {},
  ) {
    super(transport);
    this.handler = handler;
    this.options = options;
    this.registerRequestHandlerObject(handler);
    this.addEventListener(`moveMouse`, (params) => {
      Promise.resolve(this.handler.moveMouse(params)).catch((error) => {
        this.options.onMoveMouseError?.(error, params);
      });
    });
    this.addEventListener(`webMcpToolInvoked`, (params) => {
      this.options.onWebMcpToolInvoked?.(params);
    });
  }

  ping(): Promise<any> {
    return this.sendRequest(`ping`);
  }

  sendCdpEvent(params: unknown) {
    this.sendNotification(`onCDPEvent`, params);
  }

  sendCdpDetach(params: unknown) {
    this.sendNotification(`onCDPDetach`, params);
  }

  sendDownloadChange(params: unknown) {
    this.sendNotification(`onDownloadChange`, params);
  }

  sendPageEvent(params: unknown) {
    this.sendNotification(`onPageEvent`, params);
  }

  sendBrowserTabMentionsInvalidated() {
    try {
      this.sendNotification(`onBrowserTabMentionsInvalidated`);
    } catch {}
  }
}

// ---- tab id / 消息校验（原 ate/ote/An/ste/jn/Mn/Nn/Pn，2,700-2,761）----------

/** browser tab id 最大长度（原 `ate`）。 */
export const MAX_BROWSER_TAB_ID_LENGTH = 128;
/** tab 失效通知方法名（原 `ote`）。 */
export const ON_BROWSER_TAB_MENTIONS_INVALIDATED = `onBrowserTabMentionsInvalidated`;

/**
 * 校验 browser tab id：非空、长度 ≤ 128、trim 后非空且通过 shared 侧校验
 * （原 `An`；`n.Kc` 为 @chunk/shared 导出）。合法返回原字符串，否则 null。
 */
export function parseBrowserTabId(value: unknown): string | null {
  return typeof value == `string` &&
    value.length > 0 &&
    value.length <= MAX_BROWSER_TAB_ID_LENGTH &&
    value.trim().length > 0 &&
    isSharedBrowserTabId(value)
    ? value
    : null;
}

/**
 * 严格解析 browser-use 管道上的 JSON-RPC 消息（原 `ste`）。
 * 仅接受形状精确匹配的消息，其余返回 null。
 */
export function parseBrowserUseJsonRpcMessage(input: unknown): JsonRpcMessage | null {
  let message = asPlainObject(input);
  if (message == null || message.jsonrpc !== `2.0`) return null;
  if (message.method === ON_BROWSER_TAB_MENTIONS_INVALIDATED)
    return !hasOnlyKeys(message, [`jsonrpc`, `method`, `params`]) ||
      (message.params !== void 0 && message.params !== null)
      ? null
      : message.params === null
        ? { jsonrpc: `2.0`, method: message.method, params: null }
        : { jsonrpc: `2.0`, method: message.method };
  if (!isSafeJsonRpcId(message.id)) return null;
  if (Object.hasOwn(message, `result`))
    return hasOnlyKeys(message, [`jsonrpc`, `id`, `result`]) && isJsonValue(message.result)
      ? { jsonrpc: `2.0`, id: message.id, result: message.result }
      : null;
  let error = asPlainObject(message.error);
  return !hasOnlyKeys(message, [`jsonrpc`, `id`, `error`]) ||
    error == null ||
    !hasOnlyKeys(error, [`code`, `message`, `data`]) ||
    typeof error.code != `number` ||
    !Number.isInteger(error.code) ||
    typeof error.message != `string` ||
    (Object.hasOwn(error, `data`) && !isJsonValue(error.data))
    ? null
    : Object.hasOwn(error, `data`)
      ? {
          jsonrpc: `2.0`,
          id: message.id,
          error: { code: error.code, message: error.message, data: error.data },
        }
      : { jsonrpc: `2.0`, id: message.id, error: { code: error.code, message: error.message } };
}

/** 对象浅拷贝为 plain object（非对象/数组返回 undefined；原 `jn`）。 */
function asPlainObject(value: unknown): Record<string, any> | undefined {
  return typeof value == `object` && value && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value as Record<string, any>))
    : void 0;
}

/** 对象的键集合是否为给定键列表的子集（原 `Mn`）。 */
function hasOnlyKeys(value: Record<string, any>, keys: string[]): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

/** JSON-RPC id 是否为安全整数（原 `Nn`）。 */
function isSafeJsonRpcId(value: unknown): value is number {
  return typeof value == `number` && Number.isSafeInteger(value);
}

/** 递归判定 JSON 值（null/string/boolean/有限数/数组/plain object；原 `Pn`）。 */
function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value == `string` || typeof value == `boolean`) return !0;
  if (typeof value == `number`) return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  let object = asPlainObject(value);
  return object != null && Object.values(object).every(isJsonValue);
}

/** 判定是否为 browser-use 命令信封（version===1 且 type 为 string；原 `cte`）。 */
export function isBrowserUseCommandEnvelope(value: unknown): value is { version: 1; type: string } {
  return (
    typeof value == `object` &&
    !!value &&
    `version` in value &&
    (value as any).version === 1 &&
    `type` in value &&
    typeof (value as any).type == `string`
  );
}

// ---- 命令分派（原 lte/Fn，2,762-2,770）--------------------------------------

/**
 * 按命令集分派 browser-use 命令：命令必须被某个命令集声明且在 handlers 表中有
 * 处理器，否则抛「不支持命令」错误（原 `lte`）。
 */
export async function dispatchBrowserCommand({
  backendName,
  commandSets,
  handlers,
  payload,
}: {
  backendName: string;
  commandSets: { commands: Record<string, unknown> }[];
  handlers: Record<string, (payload: any) => any>;
  payload: { type: string };
}) {
  if (!commandSets.some((set) => Object.prototype.hasOwnProperty.call(set.commands, payload.type)))
    throw unsupportedCommandError(backendName, payload);
  let handler = handlers[payload.type];
  if (handler == null) throw unsupportedCommandError(backendName, payload);
  return handler(payload);
}

function unsupportedCommandError(backendName: string, payload: { type: string }): Error {
  return Error(`${backendName} does not support command "${payload.type}".`);
}

// ---- 管道路径（原 In，2,771）--------------------------------------------------

/**
 * browser-use 命名管道路径：win32 命名管道 `\\.\pipe\codex-browser-use`，
 * 其余平台 unix 套接字 `/tmp/codex-browser-use`（原 `In`）。
 */
export function getBrowserUsePipePath(platform: NodeJS.Platform): string {
  return platform === `win32` ? `\\\\.\\pipe\\codex-browser-use` : `/tmp/codex-browser-use`;
}
