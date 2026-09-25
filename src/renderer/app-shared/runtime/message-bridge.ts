// app-shared：host 消息桥（renderer ↔ main 的通信地基）。
//
// 对应 app-shared-7b9edc1bfb7f.js 的 300-660 行区段（压缩名 → 语义）：
//   - l/u（328 起）：分块消息与 token 的运行时校验
//     （`codex-host-chunked-message-v1` marker；token：array-start/object-start/
//     container-end/key/value/string-start{target:key|value}/string-chunk/
//     string-end）
//   - m/h（g() 内，360-460）：ChunkedMessageReceiver（transferId → 序号递增
//     校验 + ChunkedValueAssembler 栈式重组，多根值/容器不闭合/嵌套字符串
//     均抛错）+ passthrough/pending/complete 三态结果与回执（f）
//   - y/_/v/b/x/S（460-530）：view 侧 logger——log-message 消息上报 +
//     setViewLogger 装配（sensitive 兜底空对象）
//   - E/T/D（470-500）：出站 VS Code API 兼容层——
//     window.electronBridge.sendMessageFromView IPC 优先 +
//     `codex-message-from-view` CustomEvent（__codexForwardedViaBridge 防双发；
//     log-message 发送失败静默）+ getState/setState
//   - N/P/F/O/k/A/j/M（500-555）：入站 window message 处理——来源校验 +
//     分块重组（WeakMap 缓存每 event 的解析结果）+ acknowledgeChunkedMessage
//     回执 + type:string 消息形状判定
//   - R/L/re/z（555-640）：VscodeHostMessageBridge 单例——
//     handlers Map、缓冲消息三类（mcp-request-delivery / mcp-response /
//     personal-workspace-access-blocked，末者不缓冲只标记）、订阅回放、
//     测试监听器仅测试环境
//   - ee（545）：useElectronMessageHandler React hook——
//     React Compiler memo-cache（te.c = useMemoCache）+ useEffectEvent 稳定
//     handler + subscribe 生命周期
//
// 与 src/main/preload/electron-bridge.ts 的桥面逐字对齐：
//   sendMessageFromView(message: {type: string; …}): Promise<void>
//   acknowledgeChunkedMessage(transferId, sequence)
//
// 本模块是 app-shared 重写的第一块；app-shared 本体仍是发布版 chunk
//（transform-only），待整块重写完成前，此处源码先沉淀语义版本，
// 由 scripts/renderer-chunk-manifest.mjs 的登记节奏接管输出。

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** view → host 的消息形状。 */
export interface ViewMessage {
  type: string;
  [key: string]: unknown;
}

/** host → view 的消息形状。 */
export interface HostMessage {
  type: string;
  [key: string]: unknown;
}

/** 出站 VS Code API 兼容层（原 `E`）。 */
export interface VsCodeApiLike {
  postMessage(message: ViewMessage): void;
  getState(): unknown;
  setState(state: unknown): void;
}

/** preload 注入的桥面（与 src/main/preload/electron-bridge.ts 对齐）。 */
export interface ElectronBridgeLike {
  sendMessageFromView?(message: ViewMessage): Promise<void>;
  acknowledgeChunkedMessage?(transferId: string, sequence: number): void;
}

// ---------------------------------------------------------------------------
// 分块消息校验与重组（原 `l`/`u`/`m`/`h`/`f`）
// ---------------------------------------------------------------------------

const CHUNKED_MESSAGE_MARKER = "codex-host-chunked-message-v1";

/** 分块传输的 token。 */
export type ChunkToken =
  | { type: "array-start" }
  | { type: "object-start" }
  | { type: "container-end" }
  | { type: "key"; value: string }
  | { type: "value"; value: unknown }
  | { type: "string-start"; target: "key" | "value" }
  | { type: "string-chunk"; value: string }
  | { type: "string-end" };

/** 分块消息信封。 */
export type ChunkedEnvelope =
  | { marker: typeof CHUNKED_MESSAGE_MARKER; transferId: string; sequence: number; kind: "start" | "end" }
  | { marker: typeof CHUNKED_MESSAGE_MARKER; transferId: string; sequence: number; kind: "chunk"; tokens: ChunkToken[] };

/** 回执（原 `f`）。 */
interface Acknowledgement {
  transferId: string;
  sequence: number;
}

/** 重组结果三态。 */
type ReceiveResult =
  | { type: "passthrough"; message: unknown }
  | { type: "pending"; acknowledgement: Acknowledgement | null }
  | { type: "complete"; message: unknown; acknowledgement: Acknowledgement };

/** token 校验（原 `u`）。 */
function isValidToken(token: unknown): token is ChunkToken {
  if (typeof token != "object" || !token || !("type" in token)) return false;
  const type = (token as { type: string }).type;
  if (type === "array-start" || type === "object-start" || type === "container-end" || type === "string-end") return true;
  if (type === "string-start") return "target" in token && ((token as { target: unknown }).target === "key" || (token as { target: unknown }).target === "value");
  if (type === "key" || type === "string-chunk") return "value" in token && typeof (token as { value: unknown }).value == "string";
  if (type === "value")
    return "value" in token
      ? (token as { value: unknown }).value == null ||
          typeof (token as { value: unknown }).value == "boolean" ||
          typeof (token as { value: unknown }).value == "number" ||
          typeof (token as { value: unknown }).value == "string"
      : true;
  return false;
}

/** 信封校验（原 `l`）。 */
function isChunkedEnvelope(value: unknown): value is ChunkedEnvelope {
  return (
    typeof value != "object" ||
    !value ||
    !("marker" in value) ||
    (value as { marker: unknown }).marker !== CHUNKED_MESSAGE_MARKER ||
    !("transferId" in value) ||
    typeof (value as { transferId: unknown }).transferId != "string" ||
    !("sequence" in value) ||
    typeof (value as { sequence: unknown }).sequence != "number" ||
    !Number.isSafeInteger((value as { sequence: unknown }).sequence) ||
    !("kind" in value)
      ? false
      : (value as { kind: unknown }).kind === "chunk"
        ? "tokens" in value && Array.isArray((value as { tokens: unknown[] }).tokens) && (value as { tokens: unknown[] }).tokens.every(isValidToken)
        : (value as { kind: unknown }).kind === "start" || (value as { kind: unknown }).kind === "end"
  );
}

const UNSET = Symbol("unset");

interface ObjectFrame {
  type: "object";
  value: Record<string, unknown>;
  key: string | null;
}
interface ArrayFrame {
  type: "array";
  value: unknown[];
}
type ContainerFrame = ObjectFrame | ArrayFrame;

/**
 * 分块值重组器（原 `h`）：栈式 JSON 重组，长字符串按 key/value 目标拼接。
 * 多根值、容器不闭合、嵌套字符串、无 key 的对象值均抛错。
 */
export class ChunkedValueAssembler {
  private stack: ContainerFrame[] = [];
  private root: unknown = UNSET;
  private stringChunks: string[] | null = null;
  private stringTarget: "key" | "value" | null = null;

  consume(tokens: ChunkToken[]): void {
    for (const token of tokens) {
      switch (token.type) {
        case "array-start": {
          const value: unknown[] = [];
          this.saveValue(value);
          this.stack.push({ type: "array", value });
          break;
        }
        case "object-start": {
          const value: Record<string, unknown> = {};
          this.saveValue(value);
          this.stack.push({ type: "object", value, key: null });
          break;
        }
        case "container-end":
          if (this.stack.pop() == null) throw new Error("Chunked message contained an unmatched container end");
          break;
        case "key":
          this.setKey(token.value);
          break;
        case "value":
          this.saveValue(token.value);
          break;
        case "string-start":
          if (this.stringChunks != null) throw new Error("Chunked message contained nested string chunks");
          this.stringChunks = [];
          this.stringTarget = token.target;
          break;
        case "string-chunk":
          if (this.stringChunks == null) throw new Error("Chunked message string chunk had no start token");
          this.stringChunks.push(token.value);
          break;
        case "string-end": {
          if (this.stringChunks == null || this.stringTarget == null) throw new Error("Chunked message string end had no start token");
          const value = this.stringChunks.join("");
          const target = this.stringTarget;
          this.stringChunks = null;
          this.stringTarget = null;
          if (target === "key") this.setKey(value);
          else this.saveValue(value);
          break;
        }
      }
    }
  }

  finish(): unknown {
    if (this.root === UNSET || this.stack.length > 0 || this.stringChunks != null)
      throw new Error("Chunked message ended before its value was complete");
    return this.root;
  }

  private setKey(key: string): void {
    const frame = this.stack.at(-1);
    if (frame?.type !== "object" || frame.key != null) throw new Error("Chunked message key was outside an object");
    frame.key = key;
  }

  private saveValue(value: unknown): void {
    const frame = this.stack.at(-1);
    if (frame == null) {
      if (this.root !== UNSET) throw new Error("Chunked message contained multiple root values");
      this.root = value;
      return;
    }
    if (frame.type === "array") {
      frame.value.push(value);
      return;
    }
    if (frame.key == null) throw new Error("Chunked message object value had no key");
    Object.defineProperty(frame.value, frame.key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true,
    });
    frame.key = null;
  }
}

/**
 * 分块消息接收器（原 `m`）：按 transferId 跟踪传输；序号必须严格递增，
 * 失序即丢弃整个传输；start 重置全部传输。
 */
export class ChunkedMessageReceiver {
  private transfers = new Map<string, { assembler: ChunkedValueAssembler; nextSequence: number }>();

  receive(message: unknown): ReceiveResult {
    if (!isChunkedEnvelope(message)) return { type: "passthrough", message };
    if (message.kind === "start") {
      this.transfers.clear();
      this.transfers.set(message.transferId, { assembler: new ChunkedValueAssembler(), nextSequence: message.sequence + 1 });
      return { type: "pending", acknowledgement: { transferId: message.transferId, sequence: message.sequence } };
    }
    const transfer = this.transfers.get(message.transferId);
    return transfer == null || message.sequence !== transfer.nextSequence
      ? (this.transfers.delete(message.transferId), { type: "pending", acknowledgement: null })
      : (transfer.nextSequence += 1,
        message.kind === "chunk"
          ? (transfer.assembler.consume(message.tokens), { type: "pending", acknowledgement: { transferId: message.transferId, sequence: message.sequence } })
          : (this.transfers.delete(message.transferId),
            {
              type: "complete",
              message: transfer.assembler.finish(),
              acknowledgement: { transferId: message.transferId, sequence: message.sequence },
            }));
  }
}

// ---------------------------------------------------------------------------
// view 侧 logger（原 `y`/`_`/`v`/`b`/`x`/`S`/`C`/`w`）
// ---------------------------------------------------------------------------

/** logger 标签（safe 必填，sensitive 兜底空对象，原 `S`）。 */
export interface LogTags {
  safe: Record<string, unknown>;
  sensitive?: Record<string, unknown>;
}

type ViewLoggerDispatch = (type: "log-message", payload: { level: string; message: string; tags: LogTags }) => void;

let viewLoggerDispatch: ViewLoggerDispatch | null = null;

/** 装配 logger 分发器（原 `_`）。 */
export function setViewLogger(dispatch: ViewLoggerDispatch): void {
  viewLoggerDispatch = dispatch;
}

/** 单条日志消息（原 `v`）。 */
function dispatchLogMessage(level: string, message: string, tags?: LogTags): void {
  viewLoggerDispatch?.("log-message", { level, message, tags: tags == null ? tags : { ...tags, sensitive: tags.sensitive ?? {} } });
}

/** 桥默认 logger（原 `C`/`w`）：未装配时静默。 */
export const bridgeLogger = {
  trace: (message: string, tags?: LogTags) => dispatchLogMessage("trace", message, tags),
  debug: (message: string, tags?: LogTags) => dispatchLogMessage("debug", message, tags),
  info: (message: string, tags?: LogTags) => dispatchLogMessage("info", message, tags),
  warning: (message: string, tags?: LogTags) => dispatchLogMessage("warning", message, tags),
  error: (message: string, tags?: LogTags) => dispatchLogMessage("error", message, tags),
};

// ---------------------------------------------------------------------------
// 出站 VS Code API 兼容层（原 `E`/`T`/`D`）
// ---------------------------------------------------------------------------

let vscodeApi: VsCodeApiLike | null = null;
let vscodeState: unknown;

/** 懒初始化出站桥（原 `D`）。 */
function ensureVsCodeApi(): VsCodeApiLike {
  if (vscodeApi == null) {
    vscodeApi = {
      postMessage: (message: ViewMessage) => {
        let forwardedViaBridge = false;
        const electronBridge = (window as { electronBridge?: ElectronBridgeLike }).electronBridge;
        if (electronBridge?.sendMessageFromView) {
          const outgoing = message;
          electronBridge.sendMessageFromView(outgoing).catch((error) => {
            // log-message 的发送失败静默（避免日志风暴）。
            if (outgoing.type !== "log-message") {
              bridgeLogger.warning("Failed to send message from view", {
                safe: { type: outgoing.type },
                sensitive: { message, error },
              });
            }
          });
          forwardedViaBridge = true;
        }
        const event = new CustomEvent("codex-message-from-view", { detail: message });
        if (forwardedViaBridge) (event as CustomEvent & { __codexForwardedViaBridge?: boolean }).__codexForwardedViaBridge = true;
        window.dispatchEvent(event);
      },
      getState: () => vscodeState,
      setState: (state: unknown) => {
        vscodeState = state;
      },
    };
  }
  return vscodeApi;
}

// ---------------------------------------------------------------------------
// 入站 window message 处理（原 `N`/`P`/`F`/`O`/`k`/`A`/`j`/`M`/`I`）
// ---------------------------------------------------------------------------

let nullOriginLiteral: string;
const receiversByWindow = new WeakMap<Window, ChunkedMessageReceiver>();
const parsedByEvent = new WeakMap<MessageEvent, HostMessage | null>();

/** 消息形状判定（原 `j`）。 */
function isHostMessage(value: unknown): value is HostMessage {
  return typeof (value as { type?: unknown })?.type == "string";
}

/** 信封探测（原 `M`）。 */
function isChunkedMessage(value: unknown): boolean {
  return typeof value == "object" && !!value && "marker" in value && (value as { marker: unknown }).marker === CHUNKED_MESSAGE_MARKER;
}

/** 窗口级接收器（原 `A`）。 */
function receiverFor(target: Window): ChunkedMessageReceiver {
  let receiver = receiversByWindow.get(target);
  if (receiver == null) {
    receiver = new ChunkedMessageReceiver();
    receiversByWindow.set(target, receiver);
  }
  return receiver;
}

/**
 * 单事件解析（原 `k`）：来源校验 → 分块重组（含回执）→ 消息形状判定。
 * 非本窗口来源、跨源不匹配、非消息形状均返回 null。
 */
function parseWindowMessage(event: MessageEvent, target: Window): HostMessage | null {
  const source = event.source;
  const origin = source === target ? target.location.origin : undefined;
  if (source != null && source !== target) return null;
  if (source === target && origin !== "" && origin !== nullOriginLiteral && event.origin !== origin) return null;
  let data: unknown = event.data;
  if (isChunkedMessage(data)) {
    const result = receiverFor(target).receive(data);
    if (result.type !== "passthrough" && result.acknowledgement != null) {
      (target as Window & { electronBridge?: ElectronBridgeLike }).electronBridge?.acknowledgeChunkedMessage?.(
        result.acknowledgement.transferId,
        result.acknowledgement.sequence,
      );
    }
    if (result.type === "pending") return null;
    data = result.message;
  }
  return typeof data != "object" || !data || !isHostMessage(data) ? null : data;
}

/** 事件级缓存解析（原 `O`）：同一事件只解析一次。 */
function parseWindowMessageCached(event: MessageEvent): HostMessage | null {
  if (!isChunkedMessage(event.data)) return parseWindowMessage(event, window);
  if (parsedByEvent.has(event)) return parsedByEvent.get(event) ?? null;
  const parsed = parseWindowMessage(event, window);
  parsedByEvent.set(event, parsed);
  return parsed;
}

// ---------------------------------------------------------------------------
// VscodeHostMessageBridge 单例（原 `R`/`L`/`re`/`z`）
// ---------------------------------------------------------------------------

/** 无订阅者时先缓冲的消息类型（原 `L`）。 */
const BUFFERED_MESSAGE_TYPES = new Set<string>(["mcp-request-delivery", "mcp-response", "personal-workspace-access-blocked"]);

/** 回复回调：向 host 发回消息。 */
export type ReplyDispatch = (type: string, payload: Record<string, unknown>) => void;

/** 消息处理器。 */
export type HostMessageHandler = (message: HostMessage, reply: ReplyDispatch) => void;

/**
 * host → view 消息桥单例（原 `R`）：
 * - subscribe(type, handler) 返回退订函数；订阅时回放该类型的缓冲消息；
 * - mcp-request-delivery / mcp-response 无订阅者时缓冲；
 *   personal-workspace-access-blocked 只标记已处理不缓冲（每次都送达后来的
 *   订阅者语义由 handledBufferedMessages 控制）；
 * - dispatchMessage(type, payload) 为出站便捷方法；
 * - 测试专用监听器在非测试环境抛错（原样保留）。
 */
export class VscodeHostMessageBridge {
  static instance: VscodeHostMessageBridge | null = null;

  static getInstance(): VscodeHostMessageBridge {
    return (this.instance ??= new VscodeHostMessageBridge());
  }

  private handlers = new Map<string, Set<HostMessageHandler>>();
  private bufferedMessages = new Map<string, HostMessage[]>();
  private handledBufferedMessages = new WeakSet<HostMessage>();
  private isListeningToWindow = false;
  private windowMessageListener = (event: MessageEvent) => {
    this.handleMessage(event);
  };

  private constructor() {
    this.dispatchMessage = this.dispatchMessage.bind(this);
    this.startWindowMessageListener();
  }

  /** 出站（view → host）。 */
  dispatchMessage(type: string, payload: Record<string, unknown>): void {
    const api = ensureVsCodeApi();
    if (api == null) throw new Error("VS Code API is unavailable");
    api.postMessage({ ...payload, type });
  }

  private deliverMessage(type: string, message: HostMessage): void {
    const handlers = this.handlers.get(type);
    if (!handlers) return;
    const reply: ReplyDispatch = (replyType, replyPayload) => {
      this.dispatchMessage(replyType, replyPayload);
    };
    for (const handler of handlers) handler(message, reply);
  }

  /** 入站分发入口（供测试/host 模拟层直接调用）。 */
  dispatchHostMessage(message: HostMessage): void {
    this.deliverOrBufferMessage(message);
  }

  hasHandledBufferedMessage(message: HostMessage): boolean {
    return this.handledBufferedMessages.has(message);
  }

  /** 测试监听器（原样保留：仅测试环境可用）。 */
  startTestWindowMessageListener(): never {
    throw new Error("Test message listeners are only available in tests");
  }

  private deliverOrBufferMessage(message: HostMessage): void {
    if (BUFFERED_MESSAGE_TYPES.has(message.type) && this.handledBufferedMessages.add(message), BUFFERED_MESSAGE_TYPES.has(message.type) && !this.handlers.has(message.type)) {
      const buffer = message.type === "personal-workspace-access-blocked" ? [] : this.bufferedMessages.get(message.type) ?? [];
      buffer.push(message);
      this.bufferedMessages.set(message.type, buffer);
      return;
    }
    this.deliverMessage(message.type, message);
  }

  private handleMessage(event: MessageEvent): void {
    const message = parseWindowMessageCached(event);
    if (message != null) this.deliverOrBufferMessage(message);
  }

  private startWindowMessageListener(): void {
    this.isListeningToWindow ||= (window.addEventListener("message", this.windowMessageListener), true);
  }

  stopWindowMessageListener(): void {
    this.isListeningToWindow &&= (window.removeEventListener("message", this.windowMessageListener), false);
  }

  reset(): void {
    this.handlers.clear();
    this.bufferedMessages.clear();
    this.handledBufferedMessages = new WeakSet();
  }

  /** 订阅 host 消息；订阅时回放缓冲。 */
  subscribe(type: string, handler: HostMessageHandler): () => void {
    const handlers = this.handlers.get(type) ?? new Set<HostMessageHandler>();
    handlers.add(handler);
    this.handlers.set(type, handlers);
    const buffered = this.bufferedMessages.get(type);
    if (buffered != null) {
      this.bufferedMessages.delete(type);
      for (const message of buffered) this.deliverMessage(type, message);
    }
    return () => {
      const current = this.handlers.get(type);
      if (current) {
        current.delete(handler);
        if (current.size === 0) this.handlers.delete(type);
      }
    };
  }
}

// ---------------------------------------------------------------------------
// useElectronMessageHandler React hook（原 `ee`）
// ---------------------------------------------------------------------------

/**
 * 订阅 host 消息的 React hook（原 `ee`）：
 * handler 经 useEffectEvent 稳定化；依赖 [type, ...deps] 变化时重订阅。
 * （原版经 React Compiler 的 useMemoCache 优化 memo 槽位；语义等价的非
 * 编译形态在此保留——handler 每渲染可换，订阅随 type/deps 重排。）
 */
export function useElectronMessageHandler(
  type: string,
  handler: HostMessageHandler,
  deps: readonly unknown[] = [],
): void {
  const React = (globalThis as { __RENDERER_REACT__?: typeof import("react") }).__RENDERER_REACT__ ?? require("react") as typeof import("react");
  // useEffectEvent 语义：handler 引用总是最新，但不触发 effect 重跑。
  const handlerRef = React.useRef(handler);
  handlerRef.current = handler;
  const stableHandler: HostMessageHandler = React.useCallback(
    (message, reply) => handlerRef.current(message, reply),
    [],
  );
  React.useEffect(() => {
    const unsubscribe = VscodeHostMessageBridge.getInstance().subscribe(type, stableHandler);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, stableHandler, ...deps]);
}

// ---------------------------------------------------------------------------
// 模块装配（原 `I`/`z` 的顶层初始化，惰性触发由消费方按需调用）
// ---------------------------------------------------------------------------

/** 初始化入站解析（原 `I`）：null origin 字面量与 WeakMap 就绪。 */
export function initializeMessageBridgeInternals(): void {
  nullOriginLiteral = "null";
}

/**
 * 完整装配（原 `z`）：初始化基础设施 + 把 view logger 接到桥单例的
 * dispatchMessage。app-shared 消费方在懒初始化器里调用。
 */
export function initializeHostMessageBridge(): void {
  initializeMessageBridgeInternals();
  const bridge = VscodeHostMessageBridge.getInstance();
  setViewLogger((type, payload) => {
    bridge.dispatchMessage(type, payload as unknown as Record<string, unknown>);
  });
}
