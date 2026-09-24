// GlobalState —— 主进程持久化键值状态存储（原版 22122-22516 区段）。
//
// 职责：
//   - 维护 `~/.codex/.codex-global-state.json`（构造时传入路径）的全部顶层
//     键（bE~XE 见下方 KEY_* 常量）与 zod schema 表（sD）；
//   - 读：内存 Map（getStored）/ 带原子默认值回退（get）；加载时逐键校验，
//     非法值丢弃，主文件不可读时回退 .bak；
//   - 写：按键分类节流——persisted-atom 走 500ms debounce，custom-runtime
//     走微任务排队，其余立即入串行队列；updateAndPersist 提供同步提交
//     （先写主文件再写 .bak，通知监听器）；
//   - 原子写：临时文件 + rename；win32 上 rename 遇 EPERM/EACCES/EBUSY
//     按 [100,200,400]ms 退避重试（QE）。
//
// 依赖约束：本模块是被 startup-context / settings-store / windows-runtime-
// framework / deeplinks 多方引用的共享底座，只允许依赖叶子模块（zod schema
// 来自 @chunk/shared 与本目录两个 schema 模块、debounce 来自 util/misc、
// logger 来自 @chunk/logger），不得反向引入任何上层模块。

import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { writeFile, rename, rm } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { join, dirname, basename } from "node:path";
import { randomUUID } from "node:crypto";
import { nativeTheme } from "electron";
import { memoizedTaggedLogger } from "@chunk/logger";
import {
  rf as z, // 完整 zod 命名空间（shared 字母导出，any 类型）
  au as getAtomStateDefault, // persisted-atom 键的内置默认值表（ene）
  $u as identity, // z.string().transform(identity)（shared 内为恒等函数）
} from "@chunk/shared";
import { debounce, type DebouncedFunction } from "../util/misc";
import {
  browserAuthOperationsSchema,
  CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY,
  conversationalOnboardingCompletionsSchema,
} from "./browser-auth-operations";
import { windowPlacementSchema } from "../window/placement-snapping";

// ---------------------------------------------------------------------------
// 顶层键名（值即持久化 JSON 的字段名）
// ---------------------------------------------------------------------------

/** 线程已读状态（v1 schema：按身份的未读线程集合 + legacy 迁移记录）。 */
export const THREAD_READ_STATE_KEY = `electron-thread-read-state-v1`;
/** （历史键名）按 host 的未读线程 id 集合。 */
export const UNREAD_THREAD_IDS_BY_HOST_KEY = `unread-thread-ids-by-host-v1`;
/** persisted-atom 状态包（renderer 原子态的落盘容器）。 */
export const PERSISTED_ATOM_STATE_KEY = `electron-persisted-atom-state`;
/** 浏览器表单填充操作账本。 */
export const BROWSER_AUTH_OPERATIONS_KEY = `electron-browser-auth-operations`;
/** 初始 follow-up 队列模式（queue/steer）。 */
export const INITIAL_FOLLOW_UP_QUEUE_MODE_KEY = `electron-initial-follow-up-queue-mode`;
/** custom runtime 状态（不透明）。 */
export const CUSTOM_RUNTIME_STATE_KEY = `electron-custom-runtime-state`;
/** custom runtime 出站消息缓冲。 */
export const CUSTOM_RUNTIME_OUTBOX_STATE_KEY = `electron-custom-runtime-outbox-state`;
/** worktree 清理缓冲起始时间戳。 */
export const WORKTREE_CLEANUP_BUFFER_START_MS_KEY = `electron-worktree-cleanup-buffer-start-ms`;
/** 头像浮层是否打开。 */
export const AVATAR_OVERLAY_OPEN_KEY = `electron-avatar-overlay-open`;
/** 头像浮层窗口几何。 */
export const AVATAR_OVERLAY_BOUNDS_KEY = `electron-avatar-overlay-bounds`;
/** 远程托管画中画内容最大显示尺寸。 */
export const REMOTE_HOSTED_PIP_CONTENT_MAX_DISPLAY_SIZE_KEY = `electron-remote-hosted-pip-content-max-display-size`;
/** 远程托管画中画任务可见性。 */
export const REMOTE_HOSTED_PIP_TASK_VISIBILITY_STATE_KEY = `electron-remote-hosted-pip-task-visibility-state`;
/** 远程控制客户端注册信息（按环境）。 */
export const REMOTE_CONTROL_CLIENT_ENROLLMENTS_KEY = `electron-remote-control-client-enrollments`;
/** 本地远程控制环境 id。 */
export const LOCAL_REMOTE_CONTROL_ENVIRONMENT_ID_KEY = `electron-local-remote-control-environment-id`;
/** 本地远程控制安装 id。 */
export const LOCAL_REMOTE_CONTROL_INSTALLATION_ID_KEY = `electron-local-remote-control-installation-id`;
/** automations 安装 id。 */
export const AUTOMATIONS_INSTALLATION_ID_KEY = `electron-automations-installation-id`;
/** automations habitat 迁移状态。 */
export const AUTOMATIONS_HABITAT_MIGRATION_STATE_KEY = `electron-automations-habitat-migration-state`;
/** chrome 扩展同步托管的插件 id 列表。 */
export const CHROME_EXTENSION_SYNC_MANAGED_PLUGIN_IDS_KEY = `electron-chrome-extension-sync-managed-plugin-ids`;
/** 浏览器扩展最近使用记录。 */
export const BROWSER_EXTENSION_RECENTLY_USED_KEY = `electron-browser-extension-recently-used`;
/** integrity state envelope。 */
export const INTEGRITY_STATE_ENVELOPE_KEY = `electron-integrity-state-envelope`;
/** mac 推送注销 token。 */
export const MAC_PUSH_DEREGISTRATION_TOKEN_KEY = `electron-mac-push-deregistration-token`;
/** 内部更新 CDN 开关。 */
export const INTERNAL_UPDATE_CDN_ENABLED_KEY = `electron-internal-update-cdn-enabled`;
/** Windows core runtime frameworks 开关。 */
export const WINDOWS_CORE_RUNTIME_FRAMEWORKS_ENABLED_KEY = `electron-windows-core-runtime-frameworks-enabled`;
/** Windows primary runtime frameworks 开关。 */
export const WINDOWS_PRIMARY_RUNTIME_FRAMEWORKS_ENABLED_KEY = `electron-windows-primary-runtime-frameworks-enabled`;
/** 桌面 OTrace 采样率。 */
export const DESKTOP_OTRACES_SAMPLE_RATE_KEY = `electron-desktop-otraces-sample-rate`;
/** 浏览器下载历史。 */
export const BROWSER_DOWNLOAD_HISTORY_KEY = `electron-browser-download-history`;
/** 已完成的本地数据迁移 id。 */
export const COMPLETED_LOCAL_DATA_MIGRATION_IDS_KEY = `electron-completed-local-data-migration-ids`;
/** 远程控制配置迁移完成标记。 */
export const REMOTE_CONTROL_CONFIG_MIGRATION_COMPLETED_KEY = `electron-remote-control-config-migration-completed`;
/** 已应用远程声明的 codex app config。 */
export const CODEX_APP_CONFIG_APPLIED_REMOTE_DECLARATIONS_KEY = `electron-codex-app-config-applied-remote-declarations`;

// ---------------------------------------------------------------------------
// 常量
// ---------------------------------------------------------------------------

/** persisted-atom 持久化 debounce 间隔（ms）。 */
const PERSIST_DEBOUNCE_MS = 500;
/** win32 rename 失败（EPERM/EACCES/EBUSY）重试退避（ms）。 */
const RENAME_RETRY_BACKOFF_MS = [100, 200, 400];
/** 模块级 memoized logger（与类内 logger 同 tag 共享实例）。 */
const logger = memoizedTaggedLogger(`global-state`);

// ---------------------------------------------------------------------------
// zod schema
// ---------------------------------------------------------------------------

/** 未读线程 id 集合。 */
export const unreadThreadIdsSchema = z.record(z.string(), z.array(z.string().min(1)));
/** 线程已读状态（v1）。 */
const threadReadStateSchema = z.object({
  version: z.literal(1),
  unreadByIdentity: z.record(z.string(), unreadThreadIdsSchema),
  legacyMigration: z
    .object({
      identityKey: z.string(),
      unreadThreadIdsByHostId: unreadThreadIdsSchema,
      adoptedHostIds: z.record(z.string(), z.string()),
      cleared: z.boolean().optional(),
    })
    .optional(),
});
/** 矩形（left/top 版，mascot 等）。 */
const boundsSchema = z.object({
  left: z.number(),
  top: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});
/** 矩形（x/y 版，anchor/displayBounds 等）。 */
const rectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});
/** 浮层停靠边。 */
const overlayPlacementSchema = z.enum([`top-start`, `top-end`, `bottom-start`, `bottom-end`]);
/** 任务可见性。 */
const visibilitySchema = z.enum([`shown`, `hidden`]);
/** 下载项列表（最多 200 条）。 */
const downloadEntriesSchema = z
  .array(
    z.object({
      canCancel: z.boolean(),
      canPause: z.boolean(),
      canResume: z.boolean(),
      conversationId: z.string().nullable(),
      exists: z.boolean(),
      filename: z.string(),
      id: z.string(),
      path: z.string(),
      receivedBytes: z.number(),
      source: z.enum([`agent`, `user`]),
      startedAtMs: z.number(),
      status: z.enum([`started`, `in_progress`, `paused`, `failed`, `canceled`, `complete`]),
      totalBytes: z.number(),
      updatedAtMs: z.number(),
      url: z.string(),
    }),
  )
  .max(200);
/** 下载历史：裸列表（legacy）或 {downloads, version:1} 包装。 */
const downloadHistorySchema = z.union([
  downloadEntriesSchema,
  z.object({ downloads: downloadEntriesSchema, version: z.literal(1) }),
]);
/** 浮层/窗口几何（可带锚点与停靠信息）。 */
const overlayBoundsSchema = z.object({
  isFreelyPositioned: z.boolean().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  anchor: rectSchema.optional(),
  displayBounds: rectSchema.optional(),
  displayId: z.number().optional(),
  mascot: boundsSchema.optional(),
  placement: overlayPlacementSchema.optional(),
  tray: boundsSchema.nullable().optional(),
});

/** 有 schema 的键 → 校验 schema（全部 optional：缺失/旧值不视为非法）。 */
const stateSchemas = makeSchemasOptional({
  "hotkey-window-home-placement": windowPlacementSchema,
  [CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY]: conversationalOnboardingCompletionsSchema,
  [THREAD_READ_STATE_KEY]: threadReadStateSchema,
  "electron-main-window-bounds": z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    isMaximized: z.boolean().optional(),
  }),
  [AVATAR_OVERLAY_OPEN_KEY]: z.boolean(),
  [AVATAR_OVERLAY_BOUNDS_KEY]: overlayBoundsSchema.extend({
    byDisplayId: z.record(z.string(), overlayBoundsSchema).optional(),
    byResolution: z.record(z.string(), overlayBoundsSchema).optional(),
  }),
  [REMOTE_HOSTED_PIP_CONTENT_MAX_DISPLAY_SIZE_KEY]: z.number().positive(),
  [REMOTE_HOSTED_PIP_TASK_VISIBILITY_STATE_KEY]: z.record(z.string(), visibilitySchema),
  [PERSISTED_ATOM_STATE_KEY]: z.record(z.string(), z.unknown()),
  [INITIAL_FOLLOW_UP_QUEUE_MODE_KEY]: z.enum([`queue`, `steer`]),
  [CUSTOM_RUNTIME_STATE_KEY]: z.unknown(),
  [CUSTOM_RUNTIME_OUTBOX_STATE_KEY]: z.array(
    z.object({
      callId: z.string(),
      conversationId: z.string().transform(identity),
      message: z.string(),
      sentAtMs: z.number(),
      turnId: z.string(),
    }),
  ),
  [REMOTE_CONTROL_CLIENT_ENROLLMENTS_KEY]: z.record(
    z.string(),
    z.object({
      accountUserId: z.string(),
      algorithm: z.literal(`ecdsa_p256_sha256`),
      clientId: z.string(),
      keyId: z.string(),
      protectionClass: z.enum([`hardware_secure_enclave`, `hardware_tpm`, `os_protected_nonextractable`]),
      publicKeySpkiDerBase64: z.string(),
    }),
  ),
  [LOCAL_REMOTE_CONTROL_ENVIRONMENT_ID_KEY]: z.string(),
  [LOCAL_REMOTE_CONTROL_INSTALLATION_ID_KEY]: z.string(),
  [AUTOMATIONS_INSTALLATION_ID_KEY]: z.uuid(),
  [AUTOMATIONS_HABITAT_MIGRATION_STATE_KEY]: z.record(z.string(), z.enum([`declined`, `in_progress`, `complete`])),
  [CHROME_EXTENSION_SYNC_MANAGED_PLUGIN_IDS_KEY]: z.array(z.string()),
  [BROWSER_EXTENSION_RECENTLY_USED_KEY]: z.record(z.string(), z.array(z.string())),
  [INTEGRITY_STATE_ENVELOPE_KEY]: z.string(),
  [MAC_PUSH_DEREGISTRATION_TOKEN_KEY]: z.union([
    z.string(),
    z.strictObject({ token: z.string(), isFedramp: z.literal(true) }),
    z.object({
      kind: z.literal(`workspace`),
      token: z.string(),
      isFedramp: z.boolean(),
      backendOrigin: z.string().refine((value: string) => {
        let parsed = URL.parse(value);
        return parsed?.protocol === `https:` && parsed.origin === value;
      }),
      accountRoutingOverride: z.enum([`NO_CONSTRAINT`, `us`, `us_cr`]),
    }),
  ]),
  [INTERNAL_UPDATE_CDN_ENABLED_KEY]: z.boolean(),
  [WINDOWS_CORE_RUNTIME_FRAMEWORKS_ENABLED_KEY]: z.boolean(),
  [WINDOWS_PRIMARY_RUNTIME_FRAMEWORKS_ENABLED_KEY]: z.boolean(),
  [DESKTOP_OTRACES_SAMPLE_RATE_KEY]: z.number().min(0).max(1),
  [BROWSER_DOWNLOAD_HISTORY_KEY]: downloadHistorySchema,
  [COMPLETED_LOCAL_DATA_MIGRATION_IDS_KEY]: z.array(z.string()),
  [REMOTE_CONTROL_CONFIG_MIGRATION_COMPLETED_KEY]: z.boolean(),
  [CODEX_APP_CONFIG_APPLIED_REMOTE_DECLARATIONS_KEY]: z.record(z.string(), z.array(z.string())),
  [WORKTREE_CLEANUP_BUFFER_START_MS_KEY]: z.number(),
  [BROWSER_AUTH_OPERATIONS_KEY]: browserAuthOperationsSchema,
});

/** 把 schema 表的所有字段变为 optional（缺失字段不算非法）。 */
function makeSchemasOptional(schemas: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(schemas).map(([key, schema]) => [key, schema.optional()]));
}

/** 有 schema 的键集合。 */
const schemaKeys = new Set(Object.keys(stateSchemas));

// ---------------------------------------------------------------------------
// GlobalState
// ---------------------------------------------------------------------------

/** util/misc debounce 的返回形状（trailing-edge，带 cancel）。 */
type Debounced = DebouncedFunction<[]>;

/**
 * 持久化键值状态存储。
 *
 * 写操作按键分三类节流：persisted-atom（500ms debounce）、custom-runtime
 * （微任务排队）、其余（立即排队）；所有持久化共用一条串行 promise 链
 * （persistQueued），失败不中断链条。updateAndPersist 额外做同步提交并写
 * .bak 备份。
 */
export class GlobalState {
  private logger = memoizedTaggedLogger(`global-state`);
  private state: Map<string, unknown>;
  private changeListeners = new Map<string, Set<() => void>>();
  private filePath: string;
  private persistDebounced: Debounced;
  private persistScheduledForAtoms = false;
  private persistScheduledForCustomRuntime = false;
  private persistScheduled = false;
  private persistQueued: Promise<void> = Promise.resolve();

  constructor(filePath: string) {
    this.filePath = filePath;
    this.state = loadGlobalState(filePath);
    this.persistDebounced = debounce(() => {
      if (this.persistScheduledForAtoms) {
        this.persistScheduledForAtoms = false;
        this.queueGlobalStatePersistence();
      }
    }, PERSIST_DEBOUNCE_MS);
  }

  getStateFilePath(): string {
    return this.filePath;
  }

  /** 监听某个键的变化（set/update/delete/提交后触发），返回反注册函数。 */
  onDidChange(key: string, listener: () => void): () => void {
    let listeners = this.changeListeners.get(key) ?? new Set();
    listeners.add(listener);
    this.changeListeners.set(key, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.changeListeners.delete(key);
    };
  }

  /**
   * 读取键值：无内存值时回退到 persisted-atom 内置默认值表（@chunk/shared
   * 的 ene），仍无则 null。
   */
  get(key: string): unknown {
    let value = this.state.get(key);
    return value !== undefined && value != null ? value : (getAtomStateDefault(key) ?? null);
  }

  /** 只读内存中的存储值（不走默认值回退）。 */
  getStored(key: string): unknown {
    return this.state.get(key);
  }

  /** 写入（undefined 表示删除）并按键节流持久化、通知监听器。 */
  set(key: string, value: unknown): void {
    if (value === undefined) this.state.delete(key);
    else this.state.set(key, value);
    this.persistForKey(key);
    this.changeListeners.get(key)?.forEach((listener) => listener());
  }

  /** 读改写（updater 接收当前存储值或 null，返回 undefined 表示删除）。 */
  update(key: string, updater: (current: unknown) => unknown): void {
    let value = updater(this.state.has(key) ? this.state.get(key) : null);
    if (value === undefined) this.state.delete(key);
    else this.state.set(key, value);
    this.persistForKey(key);
    this.changeListeners.get(key)?.forEach((listener) => listener());
  }

  /**
   * 读改写并同步提交：先在副本上算新值并序列化，原子写主文件，再应用到
   * 内存、写 .bak（失败仅告警）、逐个通知监听器（单个监听器抛错仅告警）。
   * 返回串行队列 promise（链上失败会被吞掉，由调用方决定是否检查）。
   */
  updateAndPersist(key: string, updater: (current: unknown) => unknown): Promise<void> {
    this.persistQueued = this.persistQueued
      .catch(() => void 0)
      .then(() => {
        let value = updater(this.getStored(key) ?? null);
        let next = new Map(this.state);
        if (value === undefined) next.delete(key);
        else next.set(key, value);
        let contents = serializeGlobalState(next);
        atomicWriteSync(this.filePath, contents);
        if (value === undefined) this.state.delete(key);
        else this.state.set(key, value);
        try {
          atomicWriteSync(`${this.filePath}.bak`, contents);
        } catch (error) {
          this.logger().warning(`Failed to back up committed global state`, {
            safe: { key },
            sensitive: { error },
          });
        }
        this.changeListeners.get(key)?.forEach((listener) => {
          try {
            listener();
          } catch (error) {
            this.logger().warning(`Failed to notify committed global state`, {
              safe: { key },
              sensitive: { error },
            });
          }
        });
      });
    return this.persistQueued;
  }

  /** 删除键。 */
  delete(key: string): void {
    this.state.delete(key);
    this.persistForKey(key);
    this.changeListeners.get(key)?.forEach((listener) => listener());
  }

  /** 尽力刷盘（失败仅告警）。 */
  flush(): Promise<void> {
    return this.flushWith(persistStateBestEffort);
  }

  /** 刷盘（失败抛出）。 */
  flushOrThrow(): Promise<void> {
    return this.flushWith(persistStateOrThrow);
  }

  private flushWith(persister: (filePath: string, state: Map<string, unknown>) => Promise<void>): Promise<void> {
    this.persistScheduledForCustomRuntime = false;
    if (this.persistScheduledForAtoms) {
      this.persistDebounced.cancel();
      this.persistScheduledForAtoms = false;
    }
    this.persistQueued = this.persistQueued
      .catch(() => void 0)
      .then(() => persister(this.filePath, this.state));
    return this.persistQueued;
  }

  /** 按键决定持久化策略。 */
  private persistForKey(key: string): void {
    if (key === PERSISTED_ATOM_STATE_KEY) {
      this.persistScheduledForAtoms = true;
      this.persistDebounced();
      return;
    }
    if (key === CUSTOM_RUNTIME_STATE_KEY || key === CUSTOM_RUNTIME_OUTBOX_STATE_KEY) {
      if (!this.persistScheduledForCustomRuntime) {
        this.persistScheduledForCustomRuntime = true;
        queueMicrotask(() => {
          if (this.persistScheduledForCustomRuntime) {
            this.persistScheduledForCustomRuntime = false;
            this.queueGlobalStatePersistence();
          }
        });
      }
      return;
    }
    this.queueGlobalStatePersistence();
  }

  /** 排一次尽力刷盘（已在队列中时跳过）。 */
  private queueGlobalStatePersistence(): void {
    if (this.persistScheduled) return;
    this.persistScheduled = true;
    this.persistQueued = this.persistQueued
      .catch(() => void 0)
      .then(() => {
        this.persistScheduled = false;
        return persistStateBestEffort(this.filePath, this.state);
      });
  }
}

// ---------------------------------------------------------------------------
// 加载 / 序列化 / 持久化
// ---------------------------------------------------------------------------

/** 键是否有注册 schema。 */
function hasSchema(key: string): boolean {
  return schemaKeys.has(key);
}

/** 加载全局状态：主文件优先，损坏时回退 .bak，都失败则空 Map。 */
function loadGlobalState(filePath: string): Map<string, unknown> {
  if (!existsSync(filePath)) return new Map();
  let parsed = parseGlobalStateFile(filePath);
  if (parsed != null) return parsed;
  let backup = parseGlobalStateFile(`${filePath}.bak`);
  if (backup == null) return new Map();
  logger().warning(`Loaded global state from backup`, { safe: {}, sensitive: {} });
  return backup;
}

/** 解析单个状态文件：非对象/解析失败返回 null；逐键校验丢弃非法值。 */
function parseGlobalStateFile(filePath: string): Map<string, unknown> | null {
  if (!existsSync(filePath)) return null;
  try {
    let contents = readFileSync(filePath, `utf8`);
    let parsed = JSON.parse(contents);
    if (!parsed || typeof parsed != `object`) throw Error(`Expected global state to be a JSON object`);
    let entries: [string, unknown][] = [];
    for (let [key, value] of Object.entries(parsed)) {
      if (hasSchema(key) && !stateSchemas[key].safeParse(value).success) {
        logger().warning(`Dropping invalid global state for key`, { safe: { key }, sensitive: {} });
        continue;
      }
      entries.push([key, value]);
    }
    return new Map(entries);
  } catch (error) {
    logger().warning(`Failed to load global state`, { safe: {}, sensitive: { error } });
    return null;
  }
}

/** Map → JSON 字符串（undefined 值跳过）。 */
function serializeGlobalState(state: Map<string, unknown>): string {
  let object: Record<string, unknown> = {};
  for (let [key, value] of state.entries()) if (value !== undefined) object[key] = value;
  return JSON.stringify(object);
}

/** 尽力持久化：主文件 + .bak，失败仅告警。 */
async function persistStateBestEffort(filePath: string, state: Map<string, unknown>): Promise<void> {
  try {
    await persistStateOrThrow(filePath, state);
  } catch (error) {
    logger().warning(`Failed to persist global state`, { safe: {}, sensitive: { error } });
  }
}

/** 持久化：主文件 + .bak（原子写），失败抛出。 */
async function persistStateOrThrow(filePath: string, state: Map<string, unknown>): Promise<void> {
  let contents = serializeGlobalState(state);
  await atomicWrite(filePath, contents);
  await atomicWrite(`${filePath}.bak`, contents);
}

// ---------------------------------------------------------------------------
// 原子写
// ---------------------------------------------------------------------------

/** 同目录隐藏临时文件名（带时间戳与随机后缀）。 */
function tempFilePathFor(filePath: string): string {
  return join(dirname(filePath), `.${basename(filePath)}.tmp-${Date.now()}-${randomUUID()}`);
}

/** 同步原子写：写临时文件后 rename；失败清理临时文件再抛出。 */
function atomicWriteSync(filePath: string, contents: string): void {
  let tempPath = tempFilePathFor(filePath);
  try {
    writeFileSync(tempPath, contents, `utf8`);
    renameSync(tempPath, filePath);
  } catch (error) {
    rmSync(tempPath, { force: true });
    throw error;
  }
}

/**
 * 异步原子写：写临时文件后 rename；win32 上 rename 遇 EPERM/EACCES/EBUSY
 * （杀软/索引器占用）按 [100,200,400]ms 退避重试，重试耗尽或非 win32 直接
 * 抛出；任何失败都会清理临时文件。
 */
async function atomicWrite(filePath: string, contents: string): Promise<void> {
  let tempPath = tempFilePathFor(filePath);
  try {
    await writeFile(tempPath, contents, `utf8`);
    for (let attempt = 0; ; attempt += 1) {
      try {
        await rename(tempPath, filePath);
        return;
      } catch (error) {
        let backoffMs = RENAME_RETRY_BACKOFF_MS[attempt];
        if (
          process.platform !== `win32` ||
          backoffMs == null ||
          !(error instanceof Error) ||
          !(`code` in error) ||
          (error.code !== `EPERM` && error.code !== `EACCES` && error.code !== `EBUSY`)
        ) {
          throw error;
        }
        await delay(backoffMs);
      }
    }
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// 主题
// ---------------------------------------------------------------------------

/** 应用主题偏好到 Electron nativeTheme（非 light/dark 一律回退 system）。 */
export function applyTheme(theme: unknown): void {
  if (theme === `light` || theme === `dark`) nativeTheme.themeSource = theme;
  else nativeTheme.themeSource = `system`;
}
