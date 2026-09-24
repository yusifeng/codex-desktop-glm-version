// 日志模块的公共类型。

/** 日志标签：safe 中的键值可以原样进入日志/上报，sensitive 中的会被脱敏处理。 */
export interface LogTags {
  safe: Record<string, unknown>;
  sensitive: Record<string, unknown>;
}

export type LogLevel = "trace" | "debug" | "info" | "warning" | "error";

export interface LogRecord {
  level: LogLevel;
  message: string;
  tags: LogTags;
}

export interface Logger {
  trace(message: string, tags?: LogTags): void;
  debug(message: string, tags?: LogTags): void;
  info(message: string, tags?: LogTags): void;
  warning(message: string, tags?: LogTags): void;
  error(message: string, tags?: LogTags): void;
  log(level: LogLevel, message: string, tags?: LogTags): void;
  dispose?(): void;
}

/** 规范化可选的 tags 参数：null/undefined 视为空标签，缺省 sensitive 补空对象。 */
export function normalizeTags(tags: LogTags | undefined | null): LogTags {
  if (tags == null) return { safe: {}, sensitive: {} };
  return { safe: tags.safe, sensitive: tags.sensitive ?? {} };
}
