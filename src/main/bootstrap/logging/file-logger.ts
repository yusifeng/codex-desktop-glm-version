// 桌面文件日志（bootstrap 19254-19553 行重写）。
//
// installDesktopFileLogger（原始 YC）安装全局 logger（@chunk/logger 的 setLogger）：
// 每行日志同时写控制台（EPIPE/EBADF 容忍）和按「分日目录 + 分段轮转」组织的文件。
// 文件布局：<root>/<YYYY>/<MM>/<DD>/codex-desktop-<session>-<pid>-t<tid>-i<inst>-<HHMMSS>-<seg>.log
// 段写满 10 MiB 轮转（最多 5 段循环），写满一天换目录；写入背压时丢弃行并补记
// 一条 dropped 通知；15 天前的日志目录清理。stdout/stderr 的 EPIPE 类错误静默
// 容忍（installConsoleWriteErrorTolerance，原始 qC，在引导早期单独调用）。
import { createWriteStream, mkdirSync, readdirSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { threadId as workerThreadId } from "node:worker_threads";
import { formatLogTags, setLogger } from "@chunk/logger";
import type { LogLevel, Logger } from "@chunk/logger";
import { BuildFlavor, bundleIdentifier } from "../build-info/build-flavor";
import { isLogLevelEnabled } from "./log-level";

// ---- 常量（原始 NC/PC/FC/IC/LC）----
const MAX_SEGMENT_BYTES = 10485760;
const MAX_SEGMENTS = 5;
const PENDING_LINE_LIMIT = 1e4;
const HIGH_WATER_MARK_BYTES = 1048576;
const RETENTION_DAYS = 15;

/** 非正数日志配置的回退值（原始 BC）：报告 non-fatal 后用默认值。 */
function positiveOr(
  value: number | undefined,
  fallback: number,
  report: (error: Error, extra: Record<string, unknown>) => void,
  label: string,
): number {
  if (value != null && value > 0) return value;
  report(Error(`[file-logger] invalid ${label}`), { [label]: value });
  return fallback;
}

/** 两位数字补零（原始 RC）。 */
function padTwo(value: number): string {
  return value.toString().padStart(2, `0`);
}

/** 分日目录：<root>/<YYYY>/<MM>/<DD>（UTC）。 */
function dayDirectoryPath(rootDir: string, now: Date): string {
  const year = now.getUTCFullYear().toString();
  const month = padTwo(now.getUTCMonth() + 1);
  const day = padTwo(now.getUTCDate());
  return join(rootDir, year, month, day);
}

/** 段文件基础名（原始 VC）：codex-desktop-<session>-<pid>-t<tid>-i<inst>-<HHMMSS>。 */
function segmentBaseName(
  appSessionId: string,
  processId: number,
  threadId: number,
  instanceId: number,
  now: Date,
): string {
  return `codex-desktop-${appSessionId}-${processId}-t${threadId}-i${instanceId}-${padTwo(now.getUTCHours())}${padTwo(now.getUTCMinutes())}${padTwo(now.getUTCSeconds())}`;
}

// ---- 实例序号（原始 HC/UC）----
let fileLoggerInstanceCounter = 0;
function nextFileLoggerInstanceId(): number {
  fileLoggerInstanceCounter += 1;
  return fileLoggerInstanceCounter;
}

/** 删除保留期之外的日志目录（原始 WC），空目录一并清理；失败只报告不抛。 */
function pruneOldLogDirectories(
  rootDir: string,
  now: Date,
  retentionDays: number,
  report: (error: Error, extra: Record<string, unknown>) => void,
): void {
  try {
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const cutoff = new Date(today);
    cutoff.setUTCDate(cutoff.getUTCDate() - (retentionDays - 1));
    for (const yearEntry of readdirSync(rootDir)) {
      if (!/^\d{4}$/.test(yearEntry)) continue;
      const year = Number(yearEntry);
      if (!Number.isFinite(year)) continue;
      const yearDir = join(rootDir, yearEntry);
      for (const monthEntry of readdirSync(yearDir)) {
        if (!/^\d{2}$/.test(monthEntry)) continue;
        const month = Number(monthEntry);
        if (!Number.isFinite(month) || month < 1 || month > 12) continue;
        const monthDir = join(yearDir, monthEntry);
        for (const dayEntry of readdirSync(monthDir)) {
          if (!/^\d{2}$/.test(dayEntry)) continue;
          const day = Number(dayEntry);
          if (!Number.isFinite(day) || day < 1 || day > 31) continue;
          if (new Date(Date.UTC(year, month - 1, day)) < cutoff)
            rmSync(join(monthDir, dayEntry), { recursive: true, force: true });
        }
        if (readdirSync(monthDir).length === 0) rmSync(monthDir, { recursive: true, force: true });
      }
      if (readdirSync(yearDir).length === 0) rmSync(yearDir, { recursive: true, force: true });
    }
  } catch (error) {
    report(Error(`[file-logger] failed to prune old logs`), {
      rootDir,
      retentionDays,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** 文件日志需要的 non-fatal 上报器。 */
export interface NonFatalReporter {
  reportNonFatal(error: Error, options: unknown): unknown;
}

/** createFileLogger 的配置（来自安装方）。 */
export interface FileLoggerConfig {
  rootDir?: string;
  appSessionId: string;
  nonFatalReporter: NonFatalReporter;
  maxSegmentBytes?: number;
  maxSegments?: number;
  highWaterMarkBytes?: number;
}

/** createFileLogger 的可选项（测试注入点）。 */
export interface FileLoggerOptions {
  processId?: number;
  threadId?: number;
  instanceId?: number;
  now?: () => Date;
  pendingLineLimit?: number;
  createStream?: (path: string, highWaterMark: number) => WritableStreamLike;
}

/** 文件日志 sink。 */
export interface FileLoggerSink {
  logLine(line: string): void;
}

/** 可写流的最小接口（node fs.WriteStream 满足）。 */
export interface WritableStreamLike {
  write(chunk: string): boolean;
  end(): unknown;
  once(event: string, listener: () => void): unknown;
  on(event: `error`, listener: (error: unknown) => void): unknown;
}

/**
 * 创建文件日志 sink（原始 GC）。
 *
 * 初始化失败（目录建不出来等）返回 no-op sink 并上报。写入路径：行先进 pending
 * 队列，drain 时写入当前段；段超过 maxSegmentBytes 轮转到下一段（模 maxSegments
 * 循环覆盖）；跨天时换目录并重置段号。流写入返回 false（背压）时等 drain 事件再
 * 续写；pending 积压超过 pendingLineLimit 时丢弃并计数，drain 完成时补一条
 * dropped 通知。流出错后 sink 进入失败态：清空队列、静默丢弃后续行。
 */
export function createFileLogger(config: FileLoggerConfig, options: FileLoggerOptions = {}): FileLoggerSink {
  const report = (error: Error, extra: Record<string, unknown>) =>
    config.nonFatalReporter.reportNonFatal(error, { kind: `file-based-logger`, extra });
  const rootDir = config.rootDir ?? defaultLogRoot();
  const processId = options.processId ?? process.pid;
  const threadId = options.threadId ?? workerThreadId ?? 0;
  const instanceId = options.instanceId ?? nextFileLoggerInstanceId();
  const appSessionId = config.appSessionId;
  const now = options.now ?? (() => new Date());
  const maxSegmentBytes = config.maxSegmentBytes ?? MAX_SEGMENT_BYTES;
  const maxSegments = config.maxSegments ?? MAX_SEGMENTS;
  const pendingLineLimit = options.pendingLineLimit ?? PENDING_LINE_LIMIT;
  const highWaterMarkBytes = config.highWaterMarkBytes ?? HIGH_WATER_MARK_BYTES;
  const createStream =
    options.createStream ?? ((path, hwm) => createWriteStream(path, { flags: `w`, highWaterMark: hwm }));
  const effectiveMaxSegments = positiveOr(maxSegments, MAX_SEGMENTS, report, `maxSegments`);
  const effectiveMaxSegmentBytes = positiveOr(maxSegmentBytes, MAX_SEGMENT_BYTES, report, `maxSegmentBytes`);
  const effectivePendingLineLimit = positiveOr(pendingLineLimit, PENDING_LINE_LIMIT, report, `pendingLineLimit`);
  const fallbackSink: FileLoggerSink = { logLine: () => {} };
  try {
    const startTime = now();
    let currentDir = dayDirectoryPath(rootDir, startTime);
    mkdirSync(currentDir, { recursive: true });
    pruneOldLogDirectories(rootDir, startTime, RETENTION_DAYS, report);
    let baseName = segmentBaseName(appSessionId, processId, threadId, instanceId, startTime);
    const segmentPath = (index: number) => join(currentDir, `${baseName}-${index}.log`);
    let streamFailed = false;
    const onStreamError = (error: unknown) => {
      streamFailed = true;
      report(Error(`[file-logger] stream error`), {
        error: error instanceof Error ? error.message : String(error),
        rootDir,
        appSessionId,
        processId,
        threadId,
        instanceId,
      });
    };
    const watchStream = (stream: WritableStreamLike) => (
      stream.on(`error`, (error) => {
        onStreamError(error);
      }),
      stream
    );
    let segmentIndex = 0;
    let segmentBytes = 0;
    let stream = watchStream(createStream(segmentPath(segmentIndex), highWaterMarkBytes));
    let pendingLines: { text: string; bytes: number }[] = [];
    let pendingIndex = 0;
    let draining = false;
    let droppedLines = 0;
    const maybeRollDay = () => {
      const time = now();
      const dir = dayDirectoryPath(rootDir, time);
      if (dir === currentDir) return;
      currentDir = dir;
      mkdirSync(currentDir, { recursive: true });
      baseName = segmentBaseName(appSessionId, processId, threadId, instanceId, time);
      stream.end();
      segmentIndex = 0;
      segmentBytes = 0;
      droppedLines = 0;
      stream = watchStream(createStream(segmentPath(segmentIndex), highWaterMarkBytes));
    };
    const rollSegment = () => {
      stream.end();
      segmentIndex = (segmentIndex + 1) % effectiveMaxSegments;
      segmentBytes = 0;
      stream = watchStream(createStream(segmentPath(segmentIndex), highWaterMarkBytes));
    };
    const appendDroppedNotice = () => {
      if (droppedLines === 0) return;
      const text = `[file-logger] dropped ${droppedLines} lines due to backpressure\n`;
      pendingLines.push({ text, bytes: Buffer.byteLength(text) });
      droppedLines = 0;
    };
    const drain = () => {
      if (streamFailed) {
        pendingLines = [];
        pendingIndex = 0;
        droppedLines = 0;
        return;
      }
      if (draining) return;
      draining = true;
      let awaitingDrain = false;
      try {
        // 循环条件里先追加 dropped 通知再复查，保证通知本身也被写出。
        for (
          ;
          !(pendingIndex >= pendingLines.length && (appendDroppedNotice(), pendingIndex >= pendingLines.length));

        ) {
          const line = pendingLines[pendingIndex];
          segmentBytes + line.bytes > effectiveMaxSegmentBytes && rollSegment();
          const writable = stream.write(line.text);
          segmentBytes += line.bytes;
          pendingIndex += 1;
          if (!writable) {
            awaitingDrain = true;
            stream.once(`drain`, () => {
              draining = false;
              drain();
            });
            return;
          }
        }
        pendingLines = [];
        pendingIndex = 0;
      } catch (error) {
        report(Error(`[file-logger] write failed`), {
          error: error instanceof Error ? error.message : String(error),
          rootDir,
          appSessionId,
          processId,
          threadId,
          instanceId,
          maxSegments: effectiveMaxSegments,
          maxSegmentBytes: effectiveMaxSegmentBytes,
          pendingLineLimit: effectivePendingLineLimit,
        });
        pendingLines = [];
        pendingIndex = 0;
      } finally {
        draining && !awaitingDrain && (draining = false);
      }
    };
    return {
      logLine: (line: string) => {
        if (streamFailed) return;
        try {
          !draining && pendingLines.length === 0 && maybeRollDay();
          const text = `${line}\n`;
          if (pendingLines.length - pendingIndex >= effectivePendingLineLimit) {
            droppedLines += 1;
            return;
          }
          pendingLines.push({ text, bytes: Buffer.byteLength(text) });
          drain();
        } catch (error) {
          report(Error(`[file-logger] logLine threw`), {
            error: error instanceof Error ? error.message : String(error),
            rootDir,
            appSessionId,
            processId,
            threadId,
            instanceId,
          });
        }
      },
    };
  } catch {
    report(Error(`[file-logger] failed to initialize`), {
      rootDir,
      appSessionId,
      processId,
      threadId,
      instanceId,
    });
    return fallbackSink;
  }
}

/** 控制台写失败时可以容忍（吞掉）的错误码（原始 KC）。 */
function isTolerableWriteError(error: unknown): error is { code: string } {
  return (
    typeof error == `object` &&
    !!error &&
    `code` in error &&
    (error.code === `EPIPE` || error.code === `ERR_STREAM_DESTROYED` || error.code === `EBADF`)
  );
}

/** 打过容忍标记的流。 */
interface TolerantWriteStream {
  __codexIgnoreConsoleWriteErrors?: boolean;
  on(event: `error`, listener: (error: unknown) => void): unknown;
}

/**
 * 给 stdout/stderr 挂 EPIPE/EBADF 容忍的 error handler（原始 qC）。
 * 引导早期（命令行开关之后、whenReady 之前）调用；重复调用无操作。
 */
export function installConsoleWriteErrorTolerance(
  streams: TolerantWriteStream[] = [process.stdout, process.stderr],
): void {
  for (const stream of streams)
    stream.__codexIgnoreConsoleWriteErrors ||
      ((stream.__codexIgnoreConsoleWriteErrors = true),
      stream.on(`error`, (error) => {
        if (!isTolerableWriteError(error)) throw error;
      }));
}

/** 控制台输出 sink（原始 JC）：写失败且可容忍时永久停用。 */
function createConsoleLogSink(): (level: string, message: string) => void {
  let disabled = false;
  return (level, message) => {
    if (disabled) return;
    try {
      switch (level) {
        case `error`:
          console.error(message);
          break;
        case `warning`:
          console.warn(message);
          break;
        case `info`:
          console.info(message);
          break;
        case `debug`:
          console.debug(message);
          break;
        case `trace`:
          console.log(message);
          break;
      }
    } catch (error) {
      if (isTolerableWriteError(error)) {
        disabled = true;
        return;
      }
      throw error;
    }
  };
}

/** Datadog logger 的最小接口（shared chunk 的 n.ft 实例）。 */
interface DatadogLoggerLike {
  log(level: string, message: string, tags?: Record<string, unknown>): unknown;
}

/**
 * 安装桌面全局 logger（原始 YC）：控制台 + 文件 + Datadog 三路输出。
 *
 * errorReporter 用于文件日志的 non-fatal 上报；maxLogLevel 之外的级别全部丢弃。
 * 最后调 @chunk/logger 的 setLogger，成为整个主进程的日志后端。
 */
export function installDesktopFileLogger(
  errorReporter: NonFatalReporter & { reportNonFatal(error: Error, options: unknown): unknown },
  datadogLogger: DatadogLoggerLike,
  appSessionId: string,
  maxLogLevel: LogLevel | undefined,
): void {
  const normalizeTags = (tags: unknown) => tags ?? { safe: {}, sensitive: {} };
  const consoleSink = createConsoleLogSink();
  const fileSink = createFileLogger({ appSessionId, nonFatalReporter: errorReporter });
  const writeToFile = (line: string) => {
    const timestamp = new Date().toISOString();
    fileSink.logLine(`${timestamp} ${line}`);
  };
  const makeLogMethod =
    (level: LogLevel) =>
    (message: string, tags?: unknown): void => {
      // maxLogLevel 为 undefined（未知 flavor）时原始比较结果为 false，全部丢弃。
      if (maxLogLevel == null || !isLogLevelEnabled(level, maxLogLevel)) return;
      const logTags = normalizeTags(tags) as { safe: Record<string, unknown>; sensitive: Record<string, unknown> };
      const merged = { ...logTags.safe, ...logTags.sensitive };
      const formatted =
        Object.keys(merged).length === 0 ? message : `${message} ${formatLogTags(merged)}`;
      consoleSink(level, formatted);
      writeToFile(`${level} ${formatted}`);
      datadogLogger.log(level, message, logTags.safe);
    };
  const methods: Record<LogLevel, (message: string, tags?: unknown) => void> = {
    trace: makeLogMethod(`trace`),
    debug: makeLogMethod(`debug`),
    info: makeLogMethod(`info`),
    warning: makeLogMethod(`warning`),
    error: makeLogMethod(`error`),
  };
  setLogger({
    trace: methods.trace,
    debug: methods.debug,
    info: methods.info,
    warning: methods.warning,
    error: methods.error,
    log: (level, message, tags) => {
      methods[level](message, tags);
    },
    dispose: () => {},
  } satisfies Logger);
}

/**
 * 默认日志根目录（原始 MC，exports.Xt）。
 *
 * darwin：~/Library/Logs/<bundleId(flavor)>；win32：%LOCALAPPDATA%/Codex/Logs；
 * linux：$XDG_STATE_HOME/codex/logs；其他：~/.codex/logs。
 */
export function defaultLogRoot(buildFlavor?: string, platform: NodeJS.Platform = process.platform): string {
  const env = process.env;
  const home = homedir();
  if (platform === `darwin`)
    return join(home, `Library`, `Logs`, bundleIdentifier(buildFlavor ?? BuildFlavor.resolve()));
  if (platform === `win32`) {
    const localAppData = env.LOCALAPPDATA ?? join(home, `AppData`, `Local`);
    return join(localAppData, `Codex`, `Logs`);
  }
  if (platform === `linux`) {
    const xdgStateHome = env.XDG_STATE_HOME ?? join(home, `.local`, `state`);
    return join(xdgStateHome, `codex`, `logs`);
  }
  return join(home, `.codex`, `logs`);
}
