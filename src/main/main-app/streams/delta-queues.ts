// 文本 delta 缓冲队列（rAF 帧分 flush）+ 输出截断。
//
// 原版 main-C-Mhak1n.ts 39,257-39,469（vy/yy/Mve/Nve/by/Pve/Fve/Ive/xy/Lve）。
//
// Fve（TextDeltaQueue）：流式文本 delta 按「目标」聚合，动画帧驱动 flush；
// 帧预算 targetCharsPerFrame=24 字符（reasoningSummary 整段直通），drain
// 模式（drainBefore）在 maxDrainFrames=8 帧内加速放空；rAF 不可用（窗口
// 隐藏/无帧回调）时回退定时器（16ms）并立即 flush。
// Ive（OutputDeltaQueue）：命令输出 delta，50ms 定时 flush，缓冲按
// maxBufferedChars 截断（保留尾部）。
// yy：定长缓冲追加（尾部保留 + `[output truncated]` 标记语义）。
// Lve：终端 stdin 的控制字符解析（\r/\n 换命令、\b/\x7f 退格、\x03 清行）。

import { findLast } from "../util/lodash-interop";

/** 缓冲上限默认 20k 字符（原版 Mve）。 */
const DEFAULT_MAX_BUFFERED_CHARS = 20_000;
/** rAF 不可用时的回退 flush 间隔（原版 Nve）。 */
const FALLBACK_FLUSH_INTERVAL_MS = 16;
/** 每帧目标字符数（原版 by）。 */
const TARGET_CHARS_PER_FRAME = 24;
/** drain 模式最大帧数（原版 Pve）。 */
const MAX_DRAIN_FRAMES = 8;

/** 定长缓冲追加（原版 yy）：保留尾部 maxChars；返回新缓冲与截断信息。 */
export function appendWithTruncation({
  current,
  delta,
  maxChars = DEFAULT_MAX_BUFFERED_CHARS,
}: {
  current: string;
  delta: string;
  maxChars?: number;
}): { next: string; didTruncate: boolean; retainedLength: number; appended: string } {
  if (maxChars <= 0)
    return { next: ``, didTruncate: current.length > 0 || delta.length > 0, retainedLength: 0, appended: `` };
  if (delta.length === 0)
    return { next: current, didTruncate: current.length > maxChars, retainedLength: current.length, appended: `` };
  if (delta.length >= maxChars) {
    let next = delta.slice(-maxChars);
    return { next, didTruncate: true, retainedLength: 0, appended: next };
  }
  if (current.length + delta.length <= maxChars)
    return { next: current + delta, didTruncate: false, retainedLength: current.length, appended: delta };
  let retainedFromCurrent = maxChars - delta.length;
  let retained = retainedFromCurrent > 0 ? current.slice(-retainedFromCurrent) : ``;
  return { next: retained + delta, didTruncate: true, retainedLength: retained.length, appended: delta };
}

/** 文本 delta 的目标（item 字段定位）。 */
export type TextDeltaTarget =
  | { type: `agentMessage` }
  | { type: `plan` }
  | { type: `reasoningSummary`; summaryIndex: number }
  | { type: `reasoningContent`; contentIndex: number };

/** 队列里的单条文本 delta。 */
export interface TextDeltaEntry {
  conversationId: string;
  turnId: string | null;
  itemId: string;
  target: TextDeltaTarget;
  delta: string;
}

/** rAF 调度面。 */
export interface FrameScheduler {
  schedule(callback: () => void, delayMs: number): () => void;
  scheduleAnimationFrame?: (callback: () => void) => (() => void) | null;
  canUseAnimationFrame?(): boolean;
  subscribeVisibilityChange?(callback: () => void): (() => void) | null;
}

/** 文本 delta 队列选项。 */
export interface TextDeltaQueueOptions {
  scheduler: FrameScheduler;
  onFlush(entries: TextDeltaEntry[]): void;
  targetCharsPerFrame?: number;
  maxDrainFrames?: number;
  fallbackIntervalMs?: number;
}

/**
 * 帧分文本 delta 队列（原版 Fve）。同目标 delta 串接；flush 按
 * conversationId 分组后整批回调。
 */
export class TextDeltaQueue {
  private options: TextDeltaQueueOptions;
  private buffers = new Map<string, TextDeltaEntry>();
  private cancelScheduledFlush: (() => void) | null = null;
  private stopWatchingVisibility: (() => void) | null = null;
  private drainCallbacks: (() => void)[] = [];
  private drainFramesRemaining: number | null = null;
  private flushIfHidden = () => {
    if (!this.canUseAnimationFrame()) this.flushNow();
  };

  constructor(options: TextDeltaQueueOptions) {
    this.options = options;
  }

  /** 入队（同目标串接），并调度下一帧 flush。 */
  enqueue(entry: TextDeltaEntry): void {
    let key = this.buildKey(entry);
    let buffered = this.buffers.get(key)?.delta ?? ``;
    this.buffers.set(key, {
      conversationId: entry.conversationId,
      turnId: entry.turnId,
      itemId: entry.itemId,
      target: entry.target,
      delta: `${buffered}${entry.delta}`,
    });
    this.scheduleFlush();
  }

  /** 立即全部 flush + 结束 drain。 */
  flushNow(): void {
    this.cancelScheduledFlush?.();
    this.cancelScheduledFlush = null;
    if (this.buffers.size > 0) {
      let entries = Array.from(this.buffers.values());
      this.buffers.clear();
      this.options.onFlush(entries);
    }
    this.finishDrainCallbacks();
  }

  /**
   * 在回调前放空队列（原版 drainBefore）：缓冲为空/无 rAF/总量小于单帧
   * 预算时立即 flush 返回 false；否则进入 drain 模式（最多 maxDrainFrames
   * 帧加速放空）并返回 true（回调延后到放空）。
   */
  drainBefore(callback: () => void): boolean {
    return this.buffers.size === 0 ||
      !this.canUseAnimationFrame() ||
      this.getBufferedDeltaLength() <= (this.options.targetCharsPerFrame ?? TARGET_CHARS_PER_FRAME)
      ? (this.flushNow(), false)
      : (this.drainCallbacks.push(callback),
        (this.drainFramesRemaining ??= this.options.maxDrainFrames ?? MAX_DRAIN_FRAMES),
        this.scheduleFlush(),
        true);
  }

  /** 一帧 flush：每目标放出一帧预算的字符（原版 flushFrame）。 */
  private flushFrame(): void {
    if (this.buffers.size === 0) {
      this.finishDrainCallbacks();
      return;
    }
    let entries: TextDeltaEntry[] = [];
    for (let [key, buffered] of this.buffers) {
      let frameDelta = buffered.delta.slice(0, this.getFrameDeltaLength(buffered));
      let remaining = buffered.delta.slice(frameDelta.length);
      entries.push({ ...buffered, delta: frameDelta });
      if (remaining.length === 0) this.buffers.delete(key);
      else this.buffers.set(key, { ...buffered, delta: remaining });
    }
    this.options.onFlush(entries);
    if (this.drainFramesRemaining != null) --this.drainFramesRemaining;
    if (this.buffers.size > 0) this.scheduleFlush();
    else this.finishDrainCallbacks();
  }

  /** 单目标本帧的字符预算：reasoningSummary 直通；drain 模式加速
   *  （按剩余帧数均分，不小于常规预算）。 */
  private getFrameDeltaLength(entry: TextDeltaEntry): number {
    if (entry.target.type === `reasoningSummary`) return entry.delta.length;
    let target = this.options.targetCharsPerFrame ?? TARGET_CHARS_PER_FRAME;
    return this.drainFramesRemaining == null
      ? target
      : Math.max(target, Math.ceil(entry.delta.length / this.drainFramesRemaining));
  }

  private getBufferedDeltaLength(): number {
    let length = 0;
    for (let buffered of this.buffers.values()) length += buffered.delta.length;
    return length;
  }

  private finishDrainCallbacks(): void {
    this.stopWatchingVisibility?.();
    this.stopWatchingVisibility = null;
    this.drainFramesRemaining = null;
    for (let callback of this.drainCallbacks.splice(0)) callback();
  }

  private scheduleFlush(): void {
    if (this.cancelScheduledFlush != null) return;
    let canUseFrames = this.canUseAnimationFrame();
    if (
      canUseFrames &&
      this.stopWatchingVisibility == null &&
      this.options.scheduler.subscribeVisibilityChange != null
    )
      this.stopWatchingVisibility =
        this.options.scheduler.subscribeVisibilityChange(this.flushIfHidden) ?? null;
    let flush = () => {
      this.cancelScheduledFlush = null;
      if (canUseFrames) this.flushFrame();
      else this.flushNow();
    };
    this.cancelScheduledFlush = canUseFrames
      ? (this.options.scheduler.scheduleAnimationFrame?.(flush) ?? null)
      : this.options.scheduler.schedule(flush, this.options.fallbackIntervalMs ?? FALLBACK_FLUSH_INTERVAL_MS);
  }

  private canUseAnimationFrame(): boolean {
    return (
      this.options.scheduler.scheduleAnimationFrame != null &&
      this.options.scheduler.canUseAnimationFrame?.() !== false
    );
  }

  private buildKey(entry: TextDeltaEntry): string {
    let targetKey = this.getTargetKey(entry.target);
    return `${entry.conversationId}:${entry.turnId ?? `null`}:${entry.itemId}:${targetKey}`;
  }

  private getTargetKey(target: TextDeltaTarget): string {
    switch (target.type) {
      case `agentMessage`:
      case `plan`:
        return target.type;
      case `reasoningSummary`:
        return `${target.type}:${target.summaryIndex}`;
      case `reasoningContent`:
        return `${target.type}:${target.contentIndex}`;
    }
  }
}

/** 队列里的单条输出 delta。 */
export interface OutputDeltaEntry {
  conversationId: string;
  turnId: string | null;
  itemId: string;
  delta: string;
}

/** 输出 delta 队列选项。 */
export interface OutputDeltaQueueOptions {
  schedule(callback: () => void, delayMs: number): () => void;
  flushIntervalMs: number;
  maxBufferedChars: number;
  onFlush(entries: OutputDeltaEntry[]): void;
}

/** 定时输出 delta 队列（原版 Ive）：缓冲按 maxBufferedChars 截断。 */
export class OutputDeltaQueue {
  private options: OutputDeltaQueueOptions;
  private buffers = new Map<string, OutputDeltaEntry>();
  private cancelScheduledFlush: (() => void) | null = null;

  constructor(options: OutputDeltaQueueOptions) {
    this.options = options;
  }

  enqueue(entry: OutputDeltaEntry): void {
    let key = `${entry.conversationId}:${entry.turnId ?? `null`}:${entry.itemId}`;
    let { next } = appendWithTruncation({
      current: this.buffers.get(key)?.delta ?? ``,
      delta: entry.delta,
      maxChars: this.options.maxBufferedChars,
    });
    this.buffers.set(key, { ...entry, delta: next });
    this.cancelScheduledFlush ??= this.options.schedule(() => {
      this.cancelScheduledFlush = null;
      this.flushNow();
    }, this.options.flushIntervalMs);
  }

  flushNow(): void {
    if (this.buffers.size === 0) return;
    let entries = Array.from(this.buffers.values());
    this.buffers.clear();
    this.options.onFlush(entries);
  }
}

/** 终端输入缓冲 key（原版 xy）。 */
export function terminalBufferKey(conversationId: string, itemId: string): string {
  return `${conversationId}:${itemId}`;
}

/**
 * 终端 stdin 控制字符解析（原版 Lve）：\r/\n 结束当前命令（非空段入列），
 * \x03（Ctrl-C）丢弃当前缓冲，\b/\x7f 退格。返回完整命令与剩余缓冲。
 */
export function feedTerminalInput(
  currentBuffer: string,
  stdin: string,
): { commands: string[]; inputBuffer: string } {
  let commands: string[] = [];
  let buffer = currentBuffer;
  let segmentStart = 0;
  for (let index = 0; index < stdin.length; index += 1) {
    let char = stdin[index];
    if (char === `\r` || char === `\n` || char === `\x03` || char === `\b` || char === `\x7f`) {
      buffer += stdin.slice(segmentStart, index);
      segmentStart = index + 1;
      if (char === `\r` || char === `\n`) {
        let command = buffer.trim();
        if (command.length > 0) commands.push(command);
        buffer = ``;
        continue;
      }
      if (char === `\x03`) {
        buffer = ``;
        continue;
      }
      if (char === `\b` || char === `\x7f`) {
        buffer = buffer.slice(0, -1);
        continue;
      }
    }
  }
  let tail = stdin.slice(segmentStart);
  // 与原版一致：segmentStart 超过 tail 长度时逐字符拼接（防御性分支）。
  buffer += segmentStart > tail.length ? tail.split(``).join(``) : tail;
  return { commands, inputBuffer: buffer };
}

/**
 * 在 turn items 里按 id 定位 item 并校验类型（原版 vy）：取最后一个匹配
 * id 的 item，类型不符或未找到时记 error 返回 null。
 */
export function findItemInTurn(
  turn: { items: any[] },
  itemId: string,
  expectedType: string,
  logger: any,
): any | null {
  let item = findLast(turn.items, (item: any) => item.id === itemId && item.type === expectedType);
  return item
    ? item.type === expectedType
      ? item
      : (logger.error(`Item has unexpected type`, {
          safe: { itemId, type: item.type, expectedType },
          sensitive: {},
        }),
        null)
    : (logger.error(`Item not found in turn state`, { safe: { itemId }, sensitive: {} }), null);
}
