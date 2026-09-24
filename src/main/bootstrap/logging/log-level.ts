// 日志级别：级别权重比较、按 build flavor 决定默认最大级别
// （CODEX_MAX_LOG_LEVEL 环境变量优先）、级别字符串解析。
// 对应 bootstrap-C4dRql4x.ts 269-300 行（ke/Ae/je/Me）。
import type { LogLevel } from "@chunk/logger";

/** 级别权重：数值越大越啰嗦（原 ke）。 */
const LOG_LEVEL_RANKS: Record<LogLevel, number> = {
  error: 0,
  warning: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

/** 消息级别是否在最大级别内（原 Ae：rank(level) <= rank(maxLevel)）。 */
export function isLogLevelEnabled(level: LogLevel, maxLevel: LogLevel): boolean {
  return LOG_LEVEL_RANKS[level] <= LOG_LEVEL_RANKS[maxLevel];
}

/**
 * 按 build flavor 决定默认最大日志级别（原 je）：
 * CODEX_MAX_LOG_LEVEL 环境变量优先；prod=info，nightly/internal-alpha/public-beta=
 * debug，agent/dev=trace；未知 flavor 返回 undefined。
 */
export function defaultMaxLogLevelForFlavor(flavor: string): LogLevel | undefined {
  const fromEnv = parseLogLevel(process.env.CODEX_MAX_LOG_LEVEL);
  if (fromEnv != null) return fromEnv;
  switch (flavor) {
    case "prod":
      return "info";
    case "nightly":
    case "internal-alpha":
    case "public-beta":
      return "debug";
    case "agent":
    case "dev":
      return "trace";
  }
}

/** 解析日志级别字符串（大小写 / 首尾空白不敏感），非法值返回 null（原 Me）。 */
export function parseLogLevel(value: string | undefined): LogLevel | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  switch (normalized) {
    case "error":
    case "warning":
    case "info":
    case "debug":
    case "trace":
      return normalized;
    default:
      return null;
  }
}
