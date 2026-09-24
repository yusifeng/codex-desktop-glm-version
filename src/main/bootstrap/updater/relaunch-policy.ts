// Owl 托管 relaunch 策略：从 Owl Electron shell 的
// `process._linkedBinding("electron_browser_owl_update_policies")` 读取托管
// 更新策略，并计算「relaunch 通知窗口」的最后期限。
//
// 对应 bootstrap-C4dRql4x.ts 19634-19738 行：
//   - `iw/aw/ow/sw/cw` 常量（通知周期上限/快速通道阈值等）
//   - `lw` 整数可空 schema、`uw` 通知策略 schema、`dw` 时间窗口 schema、
//     `fw` owl 绑定形状 schema
//   - `pw()`（getOwlUpdatePolicies）、`mw()`（getRelaunchNotificationPolicyFrom）、
//     `gw`（parseRelaunchNotificationPolicy）、`_w`（isOwlUpdatePoliciesShape）
//   - `hw()`（computeRelaunchDeadline）、`vw`（computeNotificationPeriod）、
//     `yw`（isOutdatedBeyondDays）、`bw/xw/Sw/Cw/ww` 窗口对齐与抖动

import { app } from "electron";
import {
  Cf as ofNumberSchema,
  Mf as unknownSchema,
  zu as parseAppVersionAsDate,
  Tf as pipeSchema,
  _f as customSchema,
  hf as arraySchema,
  wf as objectSchema,
} from "@chunk/shared";

// @chunk/shared 尚未重写，zod 构造器的链式方法（int/nullable 等）类型不完整——
// 数字构造器按 any 使用。
const numberSchema = ofNumberSchema as any;

// ---- 常量（原 iw/aw/ow/sw/cw）----------------------------------------------

/** 默认通知周期上限（原 `iw`，7 天）。 */
const DEFAULT_RELAUNCH_NOTIFICATION_PERIOD_MS = 604_800_000;
/** 快速通道通知周期上限（原 `aw`，2 小时）。 */
const FAST_RELAUNCH_NOTIFICATION_PERIOD_MS = 7_200_000;
/** 通知周期的最小有效值（原 `ow`，1 小时；低于此按默认值处理）。 */
const MIN_RELAUNCH_NOTIFICATION_PERIOD_MS = 3_600_000;
/** 版本过旧判定的最小天数（原 `sw`）。 */
const MIN_OUTDATED_DAYS = 7;
/** 一天的毫秒数（原 `cw`）。 */
const DAY_MS = 86_400_000;

// ---- schema（原 lw/uw/dw/fw）------------------------------------------------

/** 整数或 null 的宽松解析（原 `lw`：先取整数值，否则 null）。 */
const nullableIntegerSchema: any = pipeSchema(
  (value: unknown) => (typeof value === "number" && Number.isInteger(value) ? value : null),
  numberSchema().int().nullable(),
);

/** relaunch 通知策略 schema（原 `uw`；relaunchWindow 缺省归一为 null）。 */
const relaunchNotificationPolicySchema: any = objectSchema({
  relaunchNotification: nullableIntegerSchema,
  relaunchNotificationPeriodMs: nullableIntegerSchema,
  relaunchWindow: unknownSchema()
    .optional()
    .transform((value: unknown) => value ?? null),
  relaunchFastIfOutdatedDays: nullableIntegerSchema,
});

/** relaunch 时间窗口 schema（原 `dw`；仅取第一条 entry）。 */
const relaunchWindowSchema: any = objectSchema({
  entries: arraySchema(
    objectSchema({
      duration_mins: nullableIntegerSchema,
      start: objectSchema({ hour: nullableIntegerSchema, minute: nullableIntegerSchema }),
    }),
  ),
});

/** Owl 更新策略绑定对象的形状 schema（原 `fw`）。 */
const owlUpdatePoliciesShapeSchema: any = objectSchema({
  owlUpdatePolicies: objectSchema({
    getRelaunchNotificationPolicy: customSchema((value: unknown) => typeof value === "function"),
    on: customSchema((value: unknown) => typeof value === "function"),
  }),
});

// ---- 类型 -------------------------------------------------------------------

/** 托管 relaunch 通知策略（SparkleManager 的 RelaunchNotificationPolicy 同形）。 */
export interface RelaunchNotificationPolicy {
  relaunchNotification: number | null;
  relaunchNotificationPeriodMs: number | null;
  relaunchWindow: unknown;
  relaunchFastIfOutdatedDays: number | null;
}

/** Owl 更新策略绑定（`electron_browser_owl_update_policies` 的返回形状）。 */
export interface OwlUpdatePolicies {
  getRelaunchNotificationPolicy(): unknown;
  on(event: string, listener: () => void): unknown;
}

/** 归一化后的 relaunch 窗口（原 `xw` 的返回值）。 */
interface RelaunchWindow {
  durationMs: number;
  hour: number;
  minute: number;
}

// ---- Owl 绑定读取（原 pw/_w/mw/gw）------------------------------------------

/**
 * 读取 Owl 更新策略绑定（原 `pw`）。
 * Owl shell 不存在（普通 Electron）或绑定读取失败时返回 null。
 */
export function getOwlUpdatePolicies(): OwlUpdatePolicies | null {
  const linkedBinding = (process as { _linkedBinding?: (name: string) => unknown })._linkedBinding;
  if (typeof linkedBinding !== "function") return null;
  let binding: unknown;
  try {
    binding = linkedBinding.call(process, "electron_browser_owl_update_policies");
  } catch {
    return null;
  }
  return isOwlUpdatePoliciesShape(binding) ? binding.owlUpdatePolicies : null;
}

/** 绑定对象形状校验（原 `_w`）。 */
function isOwlUpdatePoliciesShape(value: unknown): value is { owlUpdatePolicies: OwlUpdatePolicies } {
  return owlUpdatePoliciesShapeSchema.safeParse(value).success;
}

/** 从 Owl 绑定读取并解析通知策略（原 `mw`）。 */
export function getRelaunchNotificationPolicyFrom(
  policies: OwlUpdatePolicies,
): RelaunchNotificationPolicy | null {
  return parseRelaunchNotificationPolicy(policies.getRelaunchNotificationPolicy());
}

/** 解析通知策略（原 `gw`）：schema 不过返回 null。 */
function parseRelaunchNotificationPolicy(value: unknown): RelaunchNotificationPolicy | null {
  const parsed = relaunchNotificationPolicySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// ---- relaunch 通知窗口计算（原 hw/vw/yw/bw/xw/Sw/Cw/ww）---------------------

/**
 * 计算 relaunch 截止时间（原 `hw`）：下载时刻 + 通知周期，并对齐到托管时间窗口。
 */
export function computeRelaunchDeadline(
  updateDownloadedAtMs: number,
  policy: RelaunchNotificationPolicy,
): number {
  return snapDeadlineToWindow(
    updateDownloadedAtMs + computeNotificationPeriod(policy),
    policy.relaunchWindow,
  );
}

/** 计算通知周期（原 `vw`）：周期缺失或 <1h 按默认 7 天；版本过旧走 2h 快速通道。 */
function computeNotificationPeriod(policy: RelaunchNotificationPolicy): number {
  const { relaunchNotificationPeriodMs } = policy;
  let periodMs: number;
  periodMs =
    relaunchNotificationPeriodMs == null || relaunchNotificationPeriodMs < MIN_RELAUNCH_NOTIFICATION_PERIOD_MS
      ? DEFAULT_RELAUNCH_NOTIFICATION_PERIOD_MS
      : relaunchNotificationPeriodMs;
  return isRunningVersionOutdatedBeyond(policy.relaunchFastIfOutdatedDays)
    ? Math.min(periodMs, FAST_RELAUNCH_NOTIFICATION_PERIOD_MS)
    : periodMs;
}

/** 当前运行版本是否早于 N 天前发布（原 `yw`：app 版本内嵌 Calver 风格日期）。 */
function isRunningVersionOutdatedBeyond(days: number | null): boolean {
  if (days == null || days < MIN_OUTDATED_DAYS) return false;
  const versionPublishedAt = parseAppVersionAsDate(app.getVersion());
  return versionPublishedAt ? Date.now() - versionPublishedAt.getTime() > days * DAY_MS : false;
}

/**
 * 把截止时间对齐到托管时间窗口（原 `bw`）。
 * - 窗口无效或 ≥24h：原样返回。
 * - 已落在今天的窗口内：原样返回。
 * - 已过今天的窗口：明天窗口起点 + 随机抖动。
 * - 早于昨天窗口结束：原样返回（跳过整个窗口）。
 * - 否则：今天窗口起点 + 随机抖动。
 */
function snapDeadlineToWindow(deadlineAtMs: number, relaunchWindow: unknown): number {
  const window = parseRelaunchWindow(relaunchWindow);
  if (window == null || window.durationMs >= DAY_MS) return deadlineAtMs;
  const windowStartTodayMs = startOfWindowOnDay(deadlineAtMs, window);
  const windowEndTodayMs = windowStartTodayMs + window.durationMs;
  if (deadlineAtMs >= windowStartTodayMs && deadlineAtMs < windowEndTodayMs) return deadlineAtMs;
  if (deadlineAtMs >= windowEndTodayMs)
    return addJitter(startOfWindowOnDay(addDays(windowStartTodayMs, 1), window), window);
  if (deadlineAtMs < startOfWindowOnDay(addDays(windowStartTodayMs, -1), window) + window.durationMs)
    return deadlineAtMs;
  return addJitter(windowStartTodayMs, window);
}

/** 归一化时间窗口（原 `xw`）：只取第一条 entry，字段范围校验。 */
function parseRelaunchWindow(relaunchWindow: unknown): RelaunchWindow | null {
  const parsed = relaunchWindowSchema.safeParse(relaunchWindow);
  if (!parsed.success) return null;
  const entry = parsed.data.entries[0];
  if (entry == null) return null;
  const { hour, minute } = entry.start;
  const durationMins = entry.duration_mins;
  if (
    hour == null ||
    minute == null ||
    durationMins == null ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    durationMins < 1 ||
    durationMins > 1440
  )
    return null;
  return { durationMs: durationMins * 60 * 1000, hour, minute };
}

/** 某天里窗口的起点（原 `Sw`）。 */
function startOfWindowOnDay(timestampMs: number, window: RelaunchWindow): number {
  const date = new Date(timestampMs);
  date.setHours(window.hour, window.minute, 0, 0);
  return date.getTime();
}

/** 日期平移（原 `Cw`）。 */
function addDays(timestampMs: number, days: number): number {
  const date = new Date(timestampMs);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

/** 窗口内随机抖动（原 `ww`）。 */
function addJitter(windowStartMs: number, window: RelaunchWindow): number {
  return windowStartMs + Math.floor(Math.random() * window.durationMs);
}
