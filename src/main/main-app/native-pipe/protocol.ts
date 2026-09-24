// native-pipe 帧协议（原 main-C-Mhak1n.ts 13,139-13,351 行的
// `Bl/Vl/lse/use/Hl/dse/Ul/fse`）。
//
// 这是被四个服务复用的共享帧协议底层：
//   - computer-use native pipe（computer-use/native-pipe-service.ts）
//   - dynamic-app-tools（`$l/Hse`，13,847-13,981）
//   - node-repl host services（`Nu/Hce`，14,792-14,871）
//   - browser-use（`Go/mie`，7,999）与 Chrome tab mention（native-pipe/server.ts）
//
// 帧格式：4 字节长度前缀（本机字节序）+ UTF-8 JSON 载荷。
// 上限 MAX_FRAME_BYTES = 8,388,608（8MB，原 `fse`；computer-use 侧 7,432 的
// `Vre` 与此处为同一语义的独立副本，见深析 §7.9——本模块是统一定义点）。
//
// 本模块无模块加载期副作用（纯类/函数定义）。

import { Buffer } from "node:buffer";
import { endianness } from "node:os";

/** 单帧载荷上限（8MB，原 `fse`）。超过即抛 PipeFrameLimitError / 解码错误。 */
export const MAX_FRAME_BYTES = 8388608;

/** 帧长度前缀的字节数。 */
export const FRAME_PREFIX_BYTES = 4;

/**
 * 帧超限错误（原 `Bl`）。
 * encodeFrame 在消息超过 maxFrameBytes 时抛出。
 */
export class PipeFrameLimitError extends Error {
  /** 实际消息字节数。 */
  messageBytes: number;
  /** 帧上限字节数。 */
  maxFrameBytes: number;

  constructor(messageBytes: number, maxFrameBytes: number) {
    super(`native pipe message exceeds frame limit`);
    this.messageBytes = messageBytes;
    this.maxFrameBytes = maxFrameBytes;
  }
}

/**
 * 编码一帧（原 `Vl`）：4 字节本机字节序长度前缀 + UTF-8 载荷。
 * 载荷超过 maxFrameBytes 时抛 PipeFrameLimitError。
 */
export function encodeFrame(message: string, maxFrameBytes: number = 4294967295): Buffer {
  const payload = Buffer.from(message, `utf8`);
  if (payload.length > maxFrameBytes) throw new PipeFrameLimitError(payload.length, maxFrameBytes);
  const frame = Buffer.alloc(FRAME_PREFIX_BYTES + payload.length);
  writeFrameLength(frame, payload.length, 0);
  payload.copy(frame, FRAME_PREFIX_BYTES);
  return frame;
}

/**
 * 流式帧解码器（原 `lse`）。
 *
 * 跨 chunk 缓冲已收字节，push() 增量解析出完整帧的字符串载荷。
 * singleResponse 模式（客户端等待单个响应）：收到一帧后拒绝任何后续
 * 非空数据，且要求帧后无残留字节。
 */
export class FrameDecoder {
  maxFrameBytes: number;
  singleResponse: boolean;
  private chunks: Buffer[] = [];
  private byteLength = 0;
  private chunkStart = 0;
  private responseReceived = false;

  constructor(maxFrameBytes: number = 4294967295, singleResponse: boolean = false) {
    this.maxFrameBytes = maxFrameBytes;
    this.singleResponse = singleResponse;
  }

  /** 喂入新数据，返回本次解析出的完整帧载荷（UTF-8 字符串）。 */
  push(data: Buffer | Uint8Array): string[] {
    if (this.singleResponse && this.responseReceived && data.byteLength !== 0)
      throw new Error(`native pipe expected one response frame`);
    this.append(data);
    const messages: string[] = [];
    while (this.byteLength >= FRAME_PREFIX_BYTES) {
      const frameLength = readFrameLength(this.peekBytes(FRAME_PREFIX_BYTES));
      if (frameLength > this.maxFrameBytes) throw new Error(`native pipe frame exceeds limit`);
      const totalLength = FRAME_PREFIX_BYTES + frameLength;
      if (this.byteLength < totalLength) break;
      const frame = this.consumeBytes(totalLength);
      messages.push(frame.subarray(FRAME_PREFIX_BYTES).toString(`utf8`));
    }
    if (this.singleResponse && messages.length > 0) {
      if (messages.length !== 1 || this.byteLength !== 0)
        throw new Error(`native pipe expected one response frame`);
      this.responseReceived = true;
    }
    return messages;
  }

  private append(data: Buffer | Uint8Array): void {
    if (data.byteLength === 0) return;
    const chunk = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    this.chunks.push(chunk);
    this.byteLength += chunk.byteLength;
  }

  /** 从已缓冲字节中窥取前 count 字节（不消费）。 */
  private peekBytes(count: number): Buffer {
    const first = this.chunks[this.chunkStart];
    if (first && first.byteLength >= count) return first.subarray(0, count);
    const out = Buffer.allocUnsafe(count);
    let copied = 0;
    for (let i = this.chunkStart; i < this.chunks.length; i += 1) {
      const chunk = this.chunks[i];
      if (!chunk) throw new Error(`native pipe frame decoder underflow`);
      const n = chunk.copy(out, copied, 0, count - copied);
      copied += n;
      if (copied === count) break;
    }
    return out;
  }

  /** 消费前 count 字节并返回其拷贝。 */
  private consumeBytes(count: number): Buffer {
    const first = this.chunks[this.chunkStart];
    if (first && first.byteLength >= count) {
      const consumed = first.subarray(0, count);
      if (first.byteLength === count) this.discardFirstChunk();
      else this.chunks[this.chunkStart] = first.subarray(count);
      this.byteLength -= count;
      return consumed;
    }
    const out = Buffer.allocUnsafe(count);
    let copied = 0;
    while (copied < count) {
      const chunk = this.chunks[this.chunkStart];
      if (!chunk) throw new Error(`native pipe frame decoder underflow`);
      const n = chunk.copy(out, copied, 0, count - copied);
      copied += n;
      this.byteLength -= n;
      if (n === chunk.byteLength) this.discardFirstChunk();
      else this.chunks[this.chunkStart] = chunk.subarray(n);
    }
    return out;
  }

  /** 丢弃首个 chunk；chunkStart 超过 1024 且两倍大于总长时整体压缩。 */
  private discardFirstChunk(): void {
    this.chunkStart += 1;
    if (this.chunkStart === this.chunks.length) {
      this.chunks.length = 0;
      this.chunkStart = 0;
      return;
    }
    if (this.chunkStart > 1024 && this.chunkStart * 2 > this.chunks.length) {
      this.chunks.splice(0, this.chunkStart);
      this.chunkStart = 0;
    }
  }
}

/**
 * 一次性解码缓冲区中的全部完整帧（原 `use`）。
 * 任一帧长度超过 maxFrameBytes 时返回 null（调用方应销毁连接）；
 * 否则返回 { messages, remainingData }（remainingData 为尾部不完整帧）。
 */
export function decodeFrames(
  data: Buffer,
  maxFrameBytes: number = 4294967295,
): { messages: string[]; remainingData: Buffer } | null {
  const messages: string[] = [];
  let offset = 0;
  while (data.length - offset >= FRAME_PREFIX_BYTES) {
    const frameLength = readFrameLength(data, offset);
    if (frameLength > maxFrameBytes) return null;
    const totalLength = FRAME_PREFIX_BYTES + frameLength;
    if (data.length - offset < totalLength) break;
    messages.push(data.subarray(offset + FRAME_PREFIX_BYTES, offset + totalLength).toString(`utf8`));
    offset += totalLength;
  }
  return { messages, remainingData: data.subarray(offset) };
}

/** 按本机字节序读取 4 字节帧长度（原 `Hl`）。 */
export function readFrameLength(buffer: Buffer, offset: number = 0): number {
  return endianness() === `LE` ? buffer.readUInt32LE(offset) : buffer.readUInt32BE(offset);
}

/** 按本机字节序写入 4 字节帧长度（原 `dse`）。 */
export function writeFrameLength(buffer: Buffer, value: number, offset: number): void {
  if (endianness() === `LE`) buffer.writeUInt32LE(value, offset);
  else buffer.writeUInt32BE(value, offset);
}

/** 把任意抛出值归一为 Error（原 `Ul`）。 */
export function ensureError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
