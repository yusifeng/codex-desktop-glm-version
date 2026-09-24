// 主进程日志模块。
//
// 通过 setLogger 注入真正的日志后端（结构化输出/Sentry/控制台），注入前由
// BufferLogger 缓冲。createTaggedLogger("tag") 创建带 `[tag]` 前缀的命名
// logger，是各模块获取日志句柄的常规方式。
//
// 兼容导出：未还原的 chunk 仍以单字母名引用本 chunk（require(...).r 等），
// 待全部消费方迁移后可移除。
import type { Logger } from "./types";
import { normalizeTags } from "./types";
import { BufferLogger } from "./buffer-logger";
import { formatLogTags } from "./format";

export type { LogTags, LogLevel, LogRecord, Logger } from "./types";
export { formatLogTags };

let currentLogger: Logger = new BufferLogger();
let loggerSet = false;

/** 注入日志后端。重复注入是程序错误（测试环境除外），缓冲记录会先转储进去。 */
export function setLogger(logger: Logger): void {
  if (loggerSet && (typeof process > "u" || process.env.NODE_ENV !== "test")) {
    throw new Error("Logger already set");
  }
  loggerSet = true;
  if (currentLogger instanceof BufferLogger) currentLogger.flushTo(logger);
  currentLogger = logger;
}

export function getLogger(): Logger {
  return currentLogger;
}

/** 创建带 `[tag]` 消息前缀的 logger。 */
export function createTaggedLogger(tag: string): Logger {
  const prefix = `[${tag}] `;
  const logAtLevel = (level: string, message: string, tags?: Parameters<Logger["log"]>[2]) => {
    getLogger().log(level as never, `${prefix}${message}`, normalizeTags(tags));
  };
  const levelMethod =
    (level: string) => (message: string, tags?: Parameters<Logger["log"]>[2]) => {
      logAtLevel(level, message, tags);
    };
  return {
    trace: levelMethod("trace"),
    debug: levelMethod("debug"),
    info: levelMethod("info"),
    warning: levelMethod("warning"),
    error: levelMethod("error"),
    log: (level, message, tags) => {
      logAtLevel(level, message, tags);
    },
    dispose: () => {
      getLogger().dispose?.();
    },
  };
}

/** createTaggedLogger 的记忆化版本：同 tag 重复调用返回同一实例。 */
export function memoizedTaggedLogger(tag: string): () => Logger {
  let cached: Logger | null = null;
  return () => (cached ??= createTaggedLogger(tag));
}

/** 创建带启动以来经过秒数前缀（如 `[0.123]`）的 logger，用于启动性能追踪。 */
export function createElapsedTimestampLogger(tag: string): Logger {
  const startedAt = Date.now();
  const tagged = createTaggedLogger(tag);
  const withElapsed = (message: string, tags?: Parameters<Logger["log"]>[2]) =>
    [`[${((Date.now() - startedAt) / 1e3).toFixed(3)}] ${message}`, normalizeTags(tags)] as const;
  return {
    trace: (message, tags) => {
      const [m, t] = withElapsed(message, tags);
      tagged.trace(m, t);
    },
    debug: (message, tags) => {
      const [m, t] = withElapsed(message, tags);
      tagged.debug(m, t);
    },
    info: (message, tags) => {
      const [m, t] = withElapsed(message, tags);
      tagged.info(m, t);
    },
    warning: (message, tags) => {
      const [m, t] = withElapsed(message, tags);
      tagged.warning(m, t);
    },
    error: (message, tags) => {
      const [m, t] = withElapsed(message, tags);
      tagged.error(m, t);
    },
    log: (level, message, tags) => {
      const [m, t] = withElapsed(message, tags);
      tagged.log(level, m, t);
    },
    dispose: () => {
      tagged.dispose?.();
    },
  };
}

// ---- 兼容导出（发布版的单字母导出名，未还原 chunk 在使用）----
export { createElapsedTimestampLogger as a };
export { memoizedTaggedLogger as i };
export { getLogger as n };
export { setLogger as o };
export { createTaggedLogger as r };
export { formatLogTags as t };
