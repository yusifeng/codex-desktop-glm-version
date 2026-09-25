// shared chunk：大消息分块传输（chunked-message 分区）。
//
// 对应 src-DldfpmrL.ts 的 L36,082-36,196 + L56,315-56,667 区段：
//   - uC（L19,201）：帧标记 `codex-host-chunked-message-v1`
//   - KW：ConcatenatedValues——拼接值（chunks: 值数组的数组 + length），
//     由 qW 分块器产出；JW = instanceof 判定
//   - qW：ValueChunker——按 4MiB（UW）目标把流式追加的值分块，
//     finish() 单块返回原数组、多块返回 KW
//   - tG/nG：字节长度记录（WeakMap side-channel）
//   - QW：尺寸遍历（GW=16 每原始值开销、WW=32 每容器开销）；
//     XW = 精确字节数（展开 KW）；ZW = 超阈值判定（KW 记为 ∞）
//   - p6=64/m6=16：token 序列化开销（每 token 64B 起步 + 字符 2B）
//   - h6：传输 part 迭代器——start → chunk*（tokens 按批目标字节聚合）→
//     end，每 part 带 transferId + 递增 sequence
//   - g6：值树 token 化——数组/对象容器、字符串按块拆（_6）、
//     循环引用检测（WeakSet）、KW 展平（y6）
//   - v6：token 字节数估算
//   - S6（It）：ChunkedMessageSender——按目标的发送队列。
//     send/sendInline/sendCritical 三档；acknowledge 驱动 part 推进；
//     目标 loading/loaded 生命周期（subscribe）；发送失败退避
//     （retryDelayMs 定时器）；drain/drainCritical 双队列清空；
//     cleanup 取消订阅并清队列。
//
// 兼容导出：It=S6。

import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// 帧协议常量
// ---------------------------------------------------------------------------

/** 分块消息帧标记（原 `uC`）。 */
export const CHUNKED_MESSAGE_MARKER = "codex-host-chunked-message-v1";

/** 传输 part（原 `h6` 产出）。 */
export interface ChunkedTransferPart {
  marker: typeof CHUNKED_MESSAGE_MARKER;
  kind: "start" | "chunk" | "end";
  transferId: string;
  sequence: number;
  tokens?: ChunkToken[];
}

// ---------------------------------------------------------------------------
// 拼接值 + 分块器（原 `KW`/`qW`/`JW`）
// ---------------------------------------------------------------------------

/** 拼接值（原 `KW`）。 */
export class ConcatenatedValues {
  constructor(
    public readonly chunks: unknown[][],
    public readonly length: number,
  ) {}
}

/** 拼接值判定（原 `JW`）。 */
export function isConcatenatedValues(value: unknown): value is ConcatenatedValues {
  return value instanceof ConcatenatedValues;
}

/** 单块字节目标（原 `UW`）。 */
const VALUE_CHUNK_TARGET_BYTES = 4_194_304;

/** 值分块器（原 `qW`）。 */
export class ValueChunker {
  private readonly chunks: unknown[][] = [];
  private currentChunk: unknown[] = [];
  private currentChunkBytes = 0;
  length = 0;

  constructor(private readonly chunkTargetBytes: number = VALUE_CHUNK_TARGET_BYTES) {}

  add(value: unknown): void {
    const bytes = byteLengthOfValue(value, this.chunkTargetBytes);
    if (this.currentChunk.length > 0 && this.currentChunkBytes + bytes > this.chunkTargetBytes) {
      this.chunks.push(this.currentChunk);
      this.currentChunk = [];
      this.currentChunkBytes = 0;
    }
    this.currentChunk.push(value);
    this.currentChunkBytes += bytes;
    this.length += 1;
  }

  finish(): unknown[] | ConcatenatedValues {
    if (this.currentChunk.length > 0) this.chunks.push(this.currentChunk);
    return this.chunks.length <= 1 ? (this.chunks[0] ?? []) : new ConcatenatedValues(this.chunks, this.length);
  }
}

// ---------------------------------------------------------------------------
// 字节长度（原 `tG`/`nG`/`XW`/`ZW`/`QW`）
// ---------------------------------------------------------------------------

const recordedByteLengths = new WeakMap<object, number>();

/** 记录字节长度（原 `tG`）。 */
export function recordByteLength(value: object, bytes: number): void {
  recordedByteLengths.set(value, bytes);
}

/** 读取记录的字节长度（原 `nG`）。 */
export function recordedBytes(value: object): number | undefined {
  return recordedByteLengths.get(value);
}

/** 每原始值序列化开销（原 `GW`）。 */
const PRIMITIVE_OVERHEAD_BYTES = 16;

/** 每容器序列化开销（原 `WW`）。 */
const CONTAINER_OVERHEAD_BYTES = 32;

type SizeFrame =
  | { type: "value"; value: unknown }
  | { type: "values"; values: Iterator<unknown> }
  | { type: "object"; entries: [string, unknown][]; index: number }
  | { type: "leave"; value: unknown };

/** 尺寸遍历（原 `QW`；treatChunkedAsInfinite 时拼接值记 ∞）。 */
function walkSize(root: unknown, cap: number, treatChunkedAsInfinite: boolean): number {
  const visiting = new WeakSet();
  const stack: SizeFrame[] = [{ type: "value", value: root }];
  let total = 0;
  while (stack.length > 0 && total <= cap) {
    const frame = stack.pop();
    if (frame == null) break;
    if (frame.type === "values") {
      const next = frame.values.next();
      if (!next.done) stack.push(frame, { type: "value", value: next.value });
      continue;
    }
    if (frame.type === "leave") {
      visiting.delete(frame.value as object);
      continue;
    }
    if (frame.type === "object") {
      const entry = frame.entries[frame.index];
      if (entry != null) {
        frame.index += 1;
        total += entry[0].length * 2 + PRIMITIVE_OVERHEAD_BYTES;
        stack.push(frame, { type: "value", value: entry[1] });
      }
      continue;
    }
    const value = frame.value;
    if (typeof value === "string") {
      total += value.length * 2 + PRIMITIVE_OVERHEAD_BYTES;
      continue;
    }
    if (typeof value != "object" || !value) {
      total += PRIMITIVE_OVERHEAD_BYTES;
      continue;
    }
    if (!visiting.has(value)) {
      visiting.add(value);
      total += CONTAINER_OVERHEAD_BYTES;
      if (isConcatenatedValues(value)) {
        if (treatChunkedAsInfinite) return Number.POSITIVE_INFINITY;
        stack.push({ type: "leave", value }, { type: "values", values: flattenChunks(value) });
      } else if (Array.isArray(value))
        stack.push({ type: "leave", value }, { type: "values", values: value.values() });
      else
        stack.push({ type: "leave", value }, { type: "object", entries: Object.entries(value), index: 0 });
    }
  }
  return total;
}

/** 值的序列化字节数（原 `XW`，拼接值展开计数）。 */
export function byteLengthOfValue(value: unknown, cap = Number.MAX_SAFE_INTEGER): number {
  return walkSize(value, cap, false);
}

/** 是否超过内联阈值（原 `ZW`，拼接值视为必然超限）。 */
export function exceedsInlineThreshold(value: unknown, thresholdBytes: number): boolean {
  return walkSize(value, thresholdBytes, true) > thresholdBytes;
}

// ---------------------------------------------------------------------------
// token 化（原 `h6`/`g6`/`_6`/`v6`/`y6`）
// ---------------------------------------------------------------------------

/** token（原 `g6` 产出）。 */
export type ChunkToken =
  | { type: "array-start" }
  | { type: "object-start" }
  | { type: "container-end" }
  | { type: "key"; value: string }
  | { type: "value"; value: string | number | boolean | null | undefined }
  | { type: "string-start"; target: "key" | "value" }
  | { type: "string-chunk"; value: string }
  | { type: "string-end" };

/** 每 token 固定开销（原 `p6`）。 */
const TOKEN_OVERHEAD_BYTES = 64;

/** 非字符串值开销（原 `m6`）。 */
const NON_STRING_TOKEN_BYTES = 16;

/** token 字节数估算（原 `v6`）。 */
function tokenBytes(token: ChunkToken): number {
  const value = token.type === "key" || token.type === "value" || token.type === "string-chunk" ? token.value : null;
  return TOKEN_OVERHEAD_BYTES + (typeof value === "string" ? value.length * 2 : NON_STRING_TOKEN_BYTES);
}

/** 拼接值展平（原 `y6`）。 */
function* flattenChunks(concatenated: ConcatenatedValues): Generator<unknown> {
  for (const chunk of concatenated.chunks) yield* chunk;
}

/** 字符串 token（原 `_6`：短直出、长拆块）。 */
function* stringTokens(text: string, target: "key" | "value", maxChunkLength: number): Generator<ChunkToken> {
  if (text.length <= maxChunkLength) {
    yield target === "key" ? { type: "key", value: text } : { type: "value", value: text };
    return;
  }
  yield { type: "string-start", target };
  for (let offset = 0; offset < text.length; offset += maxChunkLength)
    yield { type: "string-chunk", value: text.slice(offset, offset + maxChunkLength) };
  yield { type: "string-end" };
}

type TokenFrame =
  | { type: "value"; value: unknown }
  | { type: "token"; token: ChunkToken }
  | { type: "leave"; value: unknown }
  | { type: "string"; value: string; target: "key" | "value" }
  | { type: "values"; values: Iterator<unknown> }
  | { type: "entries"; entries: Iterator<[string, unknown]> };

/** 值树 token 化（原 `g6`：循环引用抛错、拼接值展平）。 */
function* tokenizeValue(root: unknown, maxStringLength: number): Generator<ChunkToken> {
  const visiting = new WeakSet();
  const stack: TokenFrame[] = [{ type: "value", value: root }];
  while (stack.length > 0) {
    const frame = stack.pop();
    if (frame == null) return;
    if (frame.type === "token") {
      yield frame.token;
      continue;
    }
    if (frame.type === "leave") {
      visiting.delete(frame.value as object);
      continue;
    }
    if (frame.type === "string") {
      yield* stringTokens(frame.value, frame.target, maxStringLength);
      continue;
    }
    if (frame.type === "values") {
      const next = frame.values.next();
      if (!next.done) stack.push(frame, { type: "value", value: next.value });
      continue;
    }
    if (frame.type === "entries") {
      const next = frame.entries.next();
      if (!next.done)
        stack.push(
          frame,
          { type: "value", value: next.value[1] },
          { type: "string", value: next.value[0], target: "key" },
        );
      continue;
    }
    const value = frame.value;
    if (typeof value === "string") {
      yield* stringTokens(value, "value", maxStringLength);
      continue;
    }
    if (value == null || typeof value === "number" || typeof value === "boolean" || value === undefined) {
      yield { type: "value", value: value as string | number | boolean | null | undefined };
      continue;
    }
    if (typeof value != "object") throw new Error(`Unsupported chunked message value: ${typeof value}`);
    if (visiting.has(value)) throw new Error("Chunked messages cannot contain cyclic values");
    visiting.add(value);
    if (isConcatenatedValues(value) || Array.isArray(value)) {
      yield { type: "array-start" };
      stack.push(
        { type: "leave", value },
        { type: "token", token: { type: "container-end" } },
        { type: "values", values: isConcatenatedValues(value) ? flattenChunks(value) : value.values() },
      );
      continue;
    }
    yield { type: "object-start" };
    stack.push(
      { type: "leave", value },
      { type: "token", token: { type: "container-end" } },
      { type: "entries", entries: Object.entries(value).values() },
    );
  }
}

/** 传输 part 迭代器（原 `h6`：start → chunk* → end）。 */
function* transferParts(payload: unknown, options: { batchTargetBytes: number; transferId: string }): Generator<ChunkedTransferPart> {
  let sequence = 0;
  yield { marker: CHUNKED_MESSAGE_MARKER, kind: "start", transferId: options.transferId, sequence };
  const tokens = tokenizeValue(payload, Math.max(1, Math.floor(options.batchTargetBytes / 4)));
  let carried: ChunkToken | null = null;
  for (;;) {
    const batch: ChunkToken[] = [];
    let bytes = 0;
    for (;;) {
      const next = carried == null ? tokens.next() : { done: false as const, value: carried };
      carried = null;
      if (next.done) break;
      const size = tokenBytes(next.value);
      if (batch.length > 0 && bytes + size > options.batchTargetBytes) {
        carried = next.value;
        break;
      }
      batch.push(next.value);
      bytes += size;
    }
    if (batch.length === 0) break;
    sequence += 1;
    yield { marker: CHUNKED_MESSAGE_MARKER, kind: "chunk", transferId: options.transferId, sequence, tokens: batch };
  }
  sequence += 1;
  yield { marker: CHUNKED_MESSAGE_MARKER, kind: "end", transferId: options.transferId, sequence };
}

// ---------------------------------------------------------------------------
// 发送器（原 `S6`）
// ---------------------------------------------------------------------------

/** 非空对象判定（原 `C6`）。 */
function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && !!value;
}

/** 默认内联阈值（原 `b6` = 4MiB）。 */
const DEFAULT_INLINE_THRESHOLD_BYTES = 4_194_304;

/** 默认批目标字节（原 `x6` = 2MiB）。 */
const DEFAULT_BATCH_TARGET_BYTES = 2_097_152;

/** 目标生命周期订阅。 */
export interface ChunkedTargetSubscription {
  onDestroyed(): void;
  onLoaded(): void;
  onLoading(): void;
}

/** 发送器选项（原 `S6` 构造参数）。 */
export interface ChunkedMessageSenderOptions<Target> {
  deliver(target: Target, message: unknown, part: ChunkedTransferPart | null): void;
  getPayload(message: unknown): unknown;
  batchTargetBytes?: number;
  inlineThresholdBytes?: number;
  isAvailable?(target: Target): boolean | undefined;
  isLoading?(target: Target): boolean | undefined;
  onSendError(target: Target, error: unknown): void;
  retryDelayMs?: number;
  subscribe?(target: Target, handlers: ChunkedTargetSubscription): void;
}

interface TargetTransfer {
  critical: boolean;
  delivered: boolean;
  id: string;
  iterator: Generator<ChunkedTransferPart>;
  message: unknown;
  part: ChunkedTransferPart | null;
}

interface TargetState<Target> {
  criticalMessages: { chunked: boolean; message: unknown }[];
  draining: boolean;
  loading: boolean;
  messages: { chunked: boolean; message: unknown }[];
  retryTimer: ReturnType<typeof setTimeout> | null;
  sending: boolean;
  target: Target;
  transfer: TargetTransfer | null;
  unsubscribe: (() => void) | null;
}

/**
 * 分块消息发送器（原 `S6`，导出 `It`）。
 * 每目标独立队列；超阈值消息按 part 流发送，acknowledge 推进；
 * critical 消息插队但不抢占进行中的分块传输。
 */
export class ChunkedMessageSender<Target = unknown> {
  private readonly targets = new Map<Target, TargetState<Target>>();

  constructor(private readonly options: ChunkedMessageSenderOptions<Target>) {
    this.batchTargetBytes = options.batchTargetBytes ?? DEFAULT_BATCH_TARGET_BYTES;
    this.inlineThresholdBytes = options.inlineThresholdBytes ?? DEFAULT_INLINE_THRESHOLD_BYTES;
  }

  private readonly batchTargetBytes: number;
  private readonly inlineThresholdBytes: number;

  /** 普通发送（原 `send`）。 */
  send(target: Target, message: unknown): void {
    const chunked = this.shouldChunk(message);
    let state = this.targets.get(target);
    if (state == null && !chunked) {
      this.options.deliver(target, message, null);
      return;
    }
    state = state ?? this.createTarget(target);
    state.messages.push({ chunked, message });
    this.drain(state);
  }

  /** 内联发送（原 `sendInline`：目标无队列时直投）。 */
  sendInline(target: Target, message: unknown): void {
    const state = this.targets.get(target);
    if (state == null) {
      this.options.deliver(target, message, null);
      return;
    }
    state.messages.push({ chunked: false, message });
    this.drain(state);
  }

  /** 关键发送（原 `sendCritical`：投递失败也入队保序）。 */
  sendCritical(target: Target, message: unknown): void {
    const chunked = this.shouldChunk(message);
    const state = this.targets.get(target);
    if (!chunked && state == null) {
      try {
        this.options.deliver(target, message, null);
        return;
      } catch (error) {
        const created = this.createTarget(target);
        created.criticalMessages.push({ chunked: false, message });
        this.handleSendError(created, error);
        return;
      }
    }
    const effective = state ?? this.createTarget(target);
    effective.criticalMessages.push({ chunked, message });
    if (!chunked) this.drainCritical(effective);
    this.drain(effective);
  }

  /** 确认推进（原 `acknowledge`：part 序号匹配才发下一 part）。 */
  acknowledge(target: Target, transferId: string, sequence: number): void {
    const state = this.targets.get(target);
    const transfer = state?.transfer;
    if (
      state != null &&
      !state.sending &&
      transfer != null &&
      transfer.delivered &&
      transfer.id === transferId &&
      transfer.part?.sequence === sequence
    ) {
      if (transfer.part.kind === "end") {
        state.transfer = null;
        this.drain(state);
        return;
      }
      this.sendNextPart(state, transfer);
    }
  }

  /** 目标销毁（原 `dispose`）。 */
  dispose(target: Target): void {
    const state = this.targets.get(target);
    if (state != null) this.cleanup(state);
  }

  /** 是否需要分块（原 `shouldChunk`：payload 记录尺寸优先）。 */
  private shouldChunk(message: unknown): boolean {
    const payload = this.options.getPayload(message);
    if ("message" in (payload as object) && isNonNullObject((payload as { message: unknown }).message)) {
      const inner = (payload as { message: unknown }).message as Record<string, unknown>;
      const recorded = recordedBytes(inner);
      const bytes =
        recorded ??
        ("result" in inner && isNonNullObject(inner.result) ? recordedBytes(inner.result as object) : undefined);
      if (bytes != null) return bytes > this.inlineThresholdBytes;
    }
    if ("params" in (payload as object) && isNonNullObject((payload as { params?: unknown }).params)) {
      const bytes = recordedBytes((payload as { params: unknown }).params as object);
      if (bytes != null) return bytes > this.inlineThresholdBytes;
    }
    return exceedsInlineThreshold(payload, this.inlineThresholdBytes);
  }

  /** 建目标态（原 `createTarget`：订阅生命周期）。 */
  private createTarget(target: Target): TargetState<Target> {
    const state: TargetState<Target> = {
      criticalMessages: [],
      draining: false,
      loading: this.options.isLoading?.(target) === true,
      messages: [],
      retryTimer: null,
      sending: false,
      target,
      transfer: null,
      unsubscribe: null,
    };
    this.targets.set(target, state);
    state.unsubscribe =
      (this.options.subscribe?.(target, {
        onDestroyed: () => this.cleanup(state),
        onLoaded: () => this.handleLoaded(state),
        onLoading: () => this.handleLoading(state),
      }) as unknown as (() => void) | null | undefined) ?? null;
    return state;
  }

  /** 主排空（原 `drain`：critical 优先 → 非分块直投 → 起传输）。 */
  private drain(state: TargetState<Target>): void {
    if (
      state.draining ||
      state.loading ||
      state.sending ||
      state.transfer != null ||
      this.targets.get(state.target) !== state
    )
      return;
    state.draining = true;
    try {
      this.drainCritical(state);
      if (state.retryTimer != null) return;
      while (state.transfer == null) {
        const criticalMessage = state.criticalMessages.shift();
        const next = criticalMessage ?? state.messages.shift();
        if (next == null) break;
        if (!next.chunked) {
          try {
            this.options.deliver(state.target, next.message, null);
          } catch (error) {
            state.messages.unshift(next);
            this.handleSendError(state, error);
            break;
          }
          continue;
        }
        const transferId = randomUUID();
        const transfer: TargetTransfer = {
          critical: criticalMessage != null,
          delivered: false,
          id: transferId,
          iterator: transferParts(this.options.getPayload(next.message), {
            batchTargetBytes: this.batchTargetBytes,
            transferId,
          }),
          message: next.message,
          part: null,
        };
        state.transfer = transfer;
        this.sendNextPart(state, transfer);
      }
    } finally {
      state.draining = false;
    }
    if (
      state.transfer == null &&
      state.messages.length === 0 &&
      state.criticalMessages.length === 0
    )
      this.cleanup(state);
  }

  /** 关键队列排空（原 `drainCritical`：仅非分块 critical）。 */
  private drainCritical(state: TargetState<Target>): void {
    if (
      state.loading ||
      state.sending ||
      state.transfer?.critical === true ||
      state.retryTimer != null ||
      this.targets.get(state.target) !== state
    )
      return;
    while (state.criticalMessages.length > 0) {
      const message = state.criticalMessages[0];
      if (message == null || message.chunked) return;
      state.criticalMessages.shift();
      state.sending = true;
      try {
        this.options.deliver(state.target, message.message, null);
      } catch (error) {
        state.criticalMessages.unshift(message);
        this.handleSendError(state, error);
        return;
      } finally {
        state.sending = false;
      }
    }
  }

  /** 发下一 part（原 `sendNextPart`）。 */
  private sendNextPart(state: TargetState<Target>, transfer: TargetTransfer): void {
    let result: IteratorResult<ChunkedTransferPart>;
    try {
      result = transfer.iterator.next();
    } catch (error) {
      state.transfer = null;
      this.requeueTransfer(state, transfer);
      this.handleSendError(state, error);
      return;
    }
    if (result.done) {
      state.transfer = null;
      this.requeueTransfer(state, transfer);
      this.handleSendError(state, new Error("Chunked message transfer ended without an end part"));
      return;
    }
    transfer.part = result.value;
    transfer.delivered = false;
    this.sendCurrentPart(state, transfer);
  }

  /** 投递当前 part（原 `sendCurrentPart`）。 */
  private sendCurrentPart(state: TargetState<Target>, transfer: TargetTransfer): void {
    const part = transfer.part;
    if (part != null && state.transfer === transfer && this.targets.get(state.target) === state) {
      if (this.options.isAvailable?.(state.target) === false) {
        this.cleanup(state);
        return;
      }
      state.sending = true;
      try {
        this.options.deliver(state.target, transfer.message, part);
        transfer.delivered = true;
      } catch (error) {
        this.handleSendError(state, error);
      } finally {
        state.sending = false;
      }
    }
  }

  /** 发送失败处理（原 `handleSendError`：退避重试或清理）。 */
  private handleSendError(state: TargetState<Target>, error: unknown): void {
    this.options.onSendError(state.target, error);
    const retryDelayMs = this.options.retryDelayMs;
    if (retryDelayMs == null) {
      this.cleanup(state);
      return;
    }
    state.retryTimer ??= setTimeout(() => {
      state.retryTimer = null;
      this.drainCritical(state);
      if (state.retryTimer == null) {
        if (state.transfer != null && !state.transfer.delivered) this.sendCurrentPart(state, state.transfer);
        if (state.transfer == null) this.drain(state);
      }
    }, retryDelayMs);
  }

  /** 目标转入加载（原 `handleLoading`：撤回进行中传输）。 */
  private handleLoading(state: TargetState<Target>): void {
    if (this.targets.get(state.target) !== state) return;
    state.loading = true;
    if (state.retryTimer != null) {
      clearTimeout(state.retryTimer);
      state.retryTimer = null;
    }
    const transfer = state.transfer;
    if (transfer != null) {
      state.transfer = null;
      this.requeueTransfer(state, transfer);
    }
  }

  /** 目标完成加载（原 `handleLoaded`）。 */
  private handleLoaded(state: TargetState<Target>): void {
    if (this.targets.get(state.target) === state) {
      state.loading = false;
      this.drainCritical(state);
      this.drain(state);
    }
  }

  /** 清理目标（原 `cleanup`）。 */
  private cleanup(state: TargetState<Target>): void {
    if (this.targets.delete(state.target)) {
      if (state.retryTimer != null) clearTimeout(state.retryTimer);
      state.messages.length = 0;
      state.criticalMessages.length = 0;
      state.transfer = null;
      state.unsubscribe?.();
      state.unsubscribe = null;
    }
  }

  /** 传输回队（原 `requeueTransfer`）。 */
  private requeueTransfer(state: TargetState<Target>, transfer: TargetTransfer): void {
    const requeued = { chunked: true, message: transfer.message };
    if (transfer.critical) state.criticalMessages.unshift(requeued);
    else state.messages.unshift(requeued);
  }
}

// ---------------------------------------------------------------------------
// 兼容导出（chunked-message 分区 1 个压缩名）
// ---------------------------------------------------------------------------

export { ChunkedMessageSender as It };
