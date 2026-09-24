// 把日志标签格式化成单行文本（用于写文件等非结构化输出场景）。
//
// 格式：按 key 排序后的 `key=value` 序列，空格分隔。value 中的 Error 会被
// 展开成 errorName/errorMessage/errorStack/errorCode 四个字段。
import { inspect } from "node:util";

function stringifyTagValue(value: unknown): string {
  if (typeof value === "string")
    return value.length === 0 || /\s/.test(value) ? JSON.stringify(value) : value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint")
    return String(value);
  if (value == null) return value === undefined ? "undefined" : "null";
  try {
    const json = JSON.stringify(value);
    if (json != null) return json;
  } catch {
    // 序列化失败（循环引用等），回退到 util.inspect。
  }
  return inspect(value);
}

function isLeveledError(level: string, value: unknown): value is Error {
  return level === "error" && value instanceof Error;
}

/** 把 key 为 "error" 且值为 Error 的条目展开成平铺字段。 */
function flattenErrorFields(record: Record<string, unknown>): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (isLeveledError(key, value)) {
      const error = value as Error & { code?: string | number };
      flattened.errorName = error.name;
      flattened.errorMessage = error.message;
      flattened.errorStack = error.stack;
      if (error.code != null) flattened.errorCode = error.code;
      continue;
    }
    flattened[key] = value;
  }
  return flattened;
}

export function formatLogTags(record: Record<string, unknown>): string {
  const flattened = flattenErrorFields(record);
  return Object.keys(flattened)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${stringifyTagValue(flattened[key])}`)
    .join(" ");
}
