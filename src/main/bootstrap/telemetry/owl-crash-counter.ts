// Owl 浏览器崩溃计数 + minidump beforeSend 钩子（bootstrap 18977-19123 行重写）。
//
// 两块职责：
//  1. OwlCrashCounter：订阅 Owl shell 的浏览器进程句柄，浏览器崩溃（capture_kind=crash
//     且 ptype=browser 的 minidump）时累加计数，并通过当前注册的 delivery 回调把计数
//     上报出去。delivery 期间崩溃可能继续发生，计数作为参数聚合传递。
//  2. makeMinidumpBeforeSend：构造 Sentry beforeSend 钩子。读取 minidump 旁边的
//     `_sidecar.json`（Owl shell 写入的 capture_kind/ptype/osarch），据此给事件打
//     minidump.* / event.process / exit.reason 标签；没有 ptype 信息的事件直接丢弃
//     （返回 null）。可选的 maxMinidumpAttachments 是跨事件共享的附件预算（只减不补）。
import { existsSync, readFileSync } from "node:fs";
import { join, posix, win32 } from "node:path";
import { memoizedTaggedLogger } from "@chunk/logger";
import { Uf as SharedEventEmitter } from "@chunk/shared";
import { tC as createUsingStack } from "../vendor";

const getCrashCounterLogger = memoizedTaggedLogger(`owl-browser-crash-counter`);

// ---- 模块级可变状态（对应原始顶层 rC/iC/aC）----
/** 当前注册的崩溃计数 delivery 回调（null 表示没有监听者）。 */
let crashCountDelivery: ((crashCount: number) => Promise<void>) | null = null;
/** delivery 是否正在进行中（防止重入）。 */
let deliveryInFlight = false;
/** 尚未成功上报的累计崩溃数。 */
let pendingCrashCount = 0;

/** 可调用且可释放的崩溃上报句柄（Owl shell RPC dup 出来的 listener）。 */
export interface CrashCounterListener {
  dup(): CrashCounterListener;
  onRpcBroken(listener: () => void): void;
  /** 用崩溃计数发起一次上报，返回值（若有）注册进 using 栈随调用结束释放。 */
  (crashCount: number): unknown;
}

/** 崩溃计数订阅源（Owl shell 的浏览器进程句柄，destroyed 时自动退订）。 */
export interface CrashCounterSource {
  once(event: "destroyed", listener: () => void): unknown;
}

/**
 * Owl 浏览器崩溃计数器。
 *
 * subscribe 后把 listener dup 出来的句柄注册为全局 delivery；unsubscribe（或源
 * destroyed）时注销。重复 subscribe 会先退订上一个。
 */
export class OwlCrashCounter extends SharedEventEmitter {
  delivery: ((crashCount: number) => Promise<void>) | null = null;
  listener: CrashCounterListener | null = null;

  constructor(source: CrashCounterSource) {
    super();
    source.once(`destroyed`, () => this[Symbol.dispose]());
  }

  subscribe(source: CrashCounterListener): void {
    this.unsubscribe();
    this.listener = source.dup();
    this.listener.onRpcBroken(() => this.unsubscribe());
    // 捕获当前 listener：delivery 闭包固定使用订阅时的句柄，而非 this.listener。
    const target = this.listener;
    this.delivery = async (crashCount: number) => {
      // `using` 降级形式（vendored tC helper）：调用 target(count) 的返回值随本调用释放。
      const stack = createUsingStack();
      try {
        await stack.u(target(crashCount));
      } catch (error) {
        stack.e = error;
      } finally {
        stack.d();
      }
    };
    setCrashCountDelivery(this.delivery);
  }

  unsubscribe(): void {
    if (crashCountDelivery === this.delivery) setCrashCountDelivery(null);
    this.delivery = null;
    this.listener?.[Symbol.dispose]();
    this.listener = null;
  }

  [Symbol.dispose](): void {
    this.unsubscribe();
  }
}

/** 浏览器崩溃计数 +1，并尝试投递（对应原始 sC）。 */
function countOwlBrowserCrash(): void {
  pendingCrashCount += 1;
  flushCrashCount();
}

/** 注册/注销当前 delivery 回调（对应原始 cC）。 */
function setCrashCountDelivery(delivery: ((crashCount: number) => Promise<void>) | null): void {
  crashCountDelivery = delivery;
  flushCrashCount();
}

/** 尝试把累计崩溃数交给当前 delivery；失败保留计数，成功后若仍有剩余则重试。 */
async function flushCrashCount(): Promise<void> {
  if (crashCountDelivery == null || pendingCrashCount === 0 || deliveryInFlight) return;
  deliveryInFlight = true;
  const delivery = crashCountDelivery;
  const count = pendingCrashCount;
  let delivered = false;
  try {
    await delivery(count);
    pendingCrashCount -= count;
    delivered = true;
  } catch {
    getCrashCounterLogger().info(`Failed to deliver Owl browser crash counter`);
  } finally {
    deliveryInFlight = false;
  }
  // 仍有积压且（上次投递成功，或 delivery 回调已更换）时再试一轮。
  pendingCrashCount > 0 && (delivered || crashCountDelivery !== delivery) && flushCrashCount();
}

// ---- minidump sidecar 读取 ----

const MINIDUMP_ATTACHMENT_TYPE = `event.minidump`;
const MINIDUMP_EXTENSION = `.dmp`;
const MINIDUMP_SIDECAR_SUFFIX = `_sidecar.json`;

/** crashDumps 目录下可能存放 minidump 的子目录（按平台）。 */
function minidumpSearchDirs(platform: string, crashDumpsPath: string): string[] {
  if (platform === `win32`) return [win32.join(crashDumpsPath, `reports`)];
  const dirs = [posix.join(crashDumpsPath, `completed`)];
  (platform === `darwin` || platform === `linux`) && dirs.push(posix.join(crashDumpsPath, `pending`));
  return dirs;
}

/** sidecar 描述的 minidump 元信息。 */
interface MinidumpSidecarInfo {
  capture_kind?: string;
  osarch?: string;
  ptype?: string;
}

/** makeMinidumpBeforeSend 的选项。 */
export interface MinidumpBeforeSendOptions {
  /** Electron app（读取 crashDumps 路径用）。 */
  app?: { getPath(name: string): string } | undefined;
  crashDumpsPath?: string;
  platform?: string;
  /** 跨事件共享的 minidump 附件预算；undefined 表示不限制，0 表示全部丢弃。 */
  maxMinidumpAttachments?: number;
}

/** Sentry beforeSend 的 hint（只用到 attachments）。 */
interface BeforeSendHint {
  attachments?: { attachmentType?: string; filename: string }[] | undefined;
}

/**
 * 构造 Sentry beforeSend 钩子（对应原始 mC）。
 *
 * 只处理带 minidump 附件的事件：读取 sidecar 元信息补全 ptype；ptype 未知的事件返回
 * null 丢弃。ptype=browser 且 capture_kind=crash 时累加 Owl 浏览器崩溃计数。
 * maxMinidumpAttachments 是闭包内跨事件递减的预算。
 */
export function makeMinidumpBeforeSend(options: MinidumpBeforeSendOptions = {}) {
  let remainingAttachmentBudget = options.maxMinidumpAttachments;
  return (event: any, hint: BeforeSendHint) => {
    if (!hint.attachments?.some(({ attachmentType }) => attachmentType === MINIDUMP_ATTACHMENT_TYPE))
      return event;
    const sidecar = readMinidumpSidecar(hint, options);
    const fallbackPtype = event.contexts?.electron?.[`crashpad.ptype`];
    const ptype = sidecar?.ptype ?? (typeof fallbackPtype == `string` ? fallbackPtype : void 0);
    if (ptype == null) return null;
    applyMinidumpTags(event, sidecar, ptype);
    if (sidecar?.ptype === `browser` && sidecar.capture_kind === `crash`) countOwlBrowserCrash();
    if (remainingAttachmentBudget != null) {
      let budget = remainingAttachmentBudget;
      hint.attachments = hint.attachments?.filter(
        (attachment) =>
          attachment.attachmentType !== MINIDUMP_ATTACHMENT_TYPE ||
          (budget !== 0 && (--budget, true)),
      );
      remainingAttachmentBudget = budget;
    }
    return event;
  };
}

/** 从 hint 的 minidump 附件里读第一个能解析出 sidecar 的元信息（对应原始 hC）。 */
function readMinidumpSidecar(hint: BeforeSendHint, options: MinidumpBeforeSendOptions): MinidumpSidecarInfo | null {
  const searchDirs = resolveCrashDumpDirs(options);
  for (const attachment of hint.attachments ?? []) {
    if (attachment.attachmentType !== MINIDUMP_ATTACHMENT_TYPE) continue;
    const info = findSidecarInfo(attachment.filename, searchDirs);
    if (info != null) return info;
  }
  return null;
}

/** crashDumps 搜索目录（显式路径优先，否则从 app 读，读不到返回空数组）。 */
function resolveCrashDumpDirs(options: MinidumpBeforeSendOptions): string[] {
  const crashDumpsPath = options.crashDumpsPath ?? getCrashDumpsPathSafe(options.app);
  return crashDumpsPath == null ? [] : minidumpSearchDirs(options.platform ?? process.platform, crashDumpsPath);
}

/** app.getPath('crashDumps')，app 缺失或抛错时返回 undefined。 */
function getCrashDumpsPathSafe(app: MinidumpBeforeSendOptions["app"]): string | undefined {
  try {
    return app?.getPath(`crashDumps`);
  } catch {
    return;
  }
}

/** 在各搜索目录中查找并解析 `<dump>_sidecar.json`（对应原始 vC）。 */
function findSidecarInfo(minidumpFilename: string, searchDirs: string[]): MinidumpSidecarInfo | null {
  const sidecarName = minidumpSidecarName(minidumpFilename);
  if (sidecarName == null) return null;
  const candidates = [...new Set(searchDirs.map((dir) => join(dir, sidecarName)))].sort();
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    try {
      const parsed = JSON.parse(readFileSync(candidate, `utf8`));
      if (typeof parsed != `object` || !parsed || Array.isArray(parsed)) continue;
      const captureKind = `capture_kind` in parsed ? parsed.capture_kind : void 0;
      const ptype = `ptype` in parsed ? parsed.ptype : void 0;
      const osarch = `osarch` in parsed ? parsed.osarch : void 0;
      return {
        capture_kind: typeof captureKind == `string` ? captureKind : void 0,
        osarch: typeof osarch == `string` ? osarch : void 0,
        ptype: typeof ptype == `string` ? ptype : void 0,
      };
    } catch {
      continue;
    }
  }
  return null;
}

/** `xxx.dmp` → `xxx_sidecar.json`；非 .dmp 文件返回 null。 */
function minidumpSidecarName(filename: string): string | null {
  return filename.toLowerCase().endsWith(MINIDUMP_EXTENSION)
    ? `${filename.slice(0, -MINIDUMP_EXTENSION.length)}${MINIDUMP_SIDECAR_SUFFIX}`
    : null;
}

/** 用 sidecar 元信息补全事件的 tags/contexts/level（对应原始 bC）。 */
function applyMinidumpTags(event: any, sidecar: MinidumpSidecarInfo | null, ptype: string): void {
  const tags = event.tags ?? {};
  event.tags = tags;
  tags[`minidump.source`] = `owl`;
  const isCapture = sidecar?.capture_kind === `crash` || sidecar?.capture_kind === `dump_without_crashing`;
  isCapture && (tags[`minidump.capture_kind`] = sidecar.capture_kind);
  const eventProcess = tags[`event.process`];
  (eventProcess == null || eventProcess === `unknown`) && (tags[`event.process`] = ptype);
  if (sidecar?.capture_kind === `dump_without_crashing`) {
    event.level = `error`;
    tags[`exit.reason`] = `dump_without_crashing`;
  } else {
    tags[`exit.reason`] ??= `crashed`;
  }
  const contexts = event.contexts ?? {};
  event.contexts = contexts;
  const electronContext = contexts.electron ?? {};
  contexts.electron = electronContext;
  sidecar?.ptype != null && electronContext[`crashpad.ptype`] == null && (electronContext[`crashpad.ptype`] = sidecar.ptype);
  sidecar?.osarch != null && electronContext[`crashpad.osarch`] == null && (electronContext[`crashpad.osarch`] = sidecar.osarch);
  isCapture && (electronContext[`crashpad.capture_kind`] = sidecar.capture_kind);
}
