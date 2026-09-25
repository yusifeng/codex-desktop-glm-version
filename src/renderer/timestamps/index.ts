// timestamps —— 会话分组时间戳计算。
//
// 原版：app/webview/assets/timestamps-85bd12c0e1b2.js（1.7KB / 32 行）。
//
// 五个导出（压缩名 → 语义）：
//   - i（t）：每 turn 的展示时间戳选择——breaksPreviousAdjacency 重置；
//     首个用户 turn 超 1h → 取该值；assistant→当前间隔（user 1h / 其他
//     10min）超阈值 → 取当前值；否则 null
//   - n：单条目时间戳判定（阈值 o=36e5 / s=6e5）
//   - t（r）：日历日差（UTC 天）
//   - r（a）：分组时间戳格式化——≤1 天 formatRelativeTime（en 首字母大写）/
//     ≤7 天 weekday long / ≤365 天 weekday short + 月日 / 更早 月日+年；
//     附 time 与 includeAt（>7 天）
//   - a（c）：常量初始化器（1h/10min）

/** turn 条目（时间戳计算面）。 */
export interface TimestampEntry {
  breaksPreviousAdjacency?: boolean;
  role: "user" | "assistant";
  sentAtMs: number | null;
}

/** 阈值常量（原 `o`/`s`）。 */
const USER_TURN_GAP_MS = 36e5;
const NON_USER_GAP_MS = 6e5;

/**
 * 每 turn 的展示时间戳（原 `t`，导出 i）：
 * null 条目重置相邻性；每 turn 取首个命中的条目时间。
 */
function timestampsForTurns(turns: Array<Array<TimestampEntry | null>>, nowMs: number = Date.now()): Array<number | null> {
  let previous: TimestampEntry | null = null;
  let sawUser = false;
  return turns.map((turn) => {
    if (turn == null) {
      previous = null;
      sawUser = true;
      return null;
    }
    let selected: number | null = null;
    for (const entry of turn) {
      if (entry.breaksPreviousAdjacency) previous = null;
      if (
        selected == null &&
        shouldShowTimestamp({ current: entry, previous, isFirstUserTurn: entry.role === "user" && !sawUser, nowMs })
      ) {
        selected = entry.sentAtMs;
      }
      if (entry.role === "user") sawUser = true;
      previous = entry;
    }
    return selected;
  });
}

/** 单条时间戳判定（原 `n`）。 */
function shouldShowTimestamp({ current, previous, isFirstUserTurn, nowMs }: { current: TimestampEntry; previous: TimestampEntry | null; isFirstUserTurn: boolean; nowMs: number }): boolean {
  if (current.sentAtMs == null || !Number.isFinite(current.sentAtMs)) return false;
  if (isFirstUserTurn && nowMs - current.sentAtMs > USER_TURN_GAP_MS) return true;
  return (
    previous?.role === "assistant" &&
    previous.sentAtMs != null &&
    Number.isFinite(previous.sentAtMs) &&
    current.sentAtMs - previous.sentAtMs > (current.role === "user" ? USER_TURN_GAP_MS : NON_USER_GAP_MS)
  );
}

/** 日历日差（原 `r`，导出 t）。 */
function calendarDayDiff(a: Date, b: Date): number {
  return (Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) - Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) / 864e5;
}

/** 相对时间（原 `i`，导出 n）：en 首字母大写。 */
function formatRelativeDay(intl: IntlLike, days: number): string {
  const formatted = intl.formatRelativeTime(days, "day", { numeric: "auto" });
  return intl.locale.startsWith("en") ? formatted.charAt(0).toUpperCase() + formatted.slice(1) : formatted;
}

/** intl 面（结构化子集）。 */
export interface IntlLike {
  locale: string;
  formatRelativeTime(value: number, unit: string, options: { numeric: string }): string;
  formatDate(value: Date, options: Record<string, unknown>): string;
  formatTime(value: Date, options: Record<string, unknown>): string;
}

/** 分组时间戳（原 `a`，导出 r）。 */
function groupedTimestamp(intl: IntlLike, date: Date, now: Date): { date: string; time: string; includeAt: boolean } {
  const days = Math.max(calendarDayDiff(now, date), 0);
  const formatted =
    days <= 1
      ? formatRelativeDay(intl, -days)
      : days <= 7
        ? intl.formatDate(date, { weekday: "long" })
        : days <= 365
          ? intl.formatDate(date, { weekday: "short", month: "short", day: "numeric" })
          : intl.formatDate(date, { month: "short", day: "numeric", year: "numeric" });
  return { date: formatted, time: intl.formatTime(date, { hour: "numeric", minute: "2-digit" }), includeAt: days > 7 };
}

/** 常量初始化器（原 `c`，导出 a）。 */
function initializeTimestampConstants(): void {}

export { initializeTimestampConstants as a, timestampsForTurns as i, formatRelativeDay as n, groupedTimestamp as r, calendarDayDiff as t };
