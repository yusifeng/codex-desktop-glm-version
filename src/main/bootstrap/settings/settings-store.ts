// SettingsStore —— TOML（config.toml 的 desktop 段）+ app-server configClient
// 双通道设置存储（原版 22517-22762 区段）。
//
// 职责：
//   - 读取 `~/.codex/config.toml` 的 [desktop] 段（未知键/不合法 TOML 值丢弃）；
//   - 从旧存储位置（global-state 的 configuration 键 / persisted-atom）迁移
//     设置（DD），迁移成功后待写入 config.toml 并清理旧值（MD）；
//   - initialize(configClient) 接入 app-server 后：以 server 下发的 desktop
//     配置为准刷新内存态，设置写入走 batchWriteConfigValues（keyPath =
//     desktop.<key>，mergeStrategy=replace），失败仅告警并保序重试（写入
//     队列逐次合并，值未变才出队）。

import { existsSync, readFileSync } from "node:fs";
import { memoizedTaggedLogger } from "@chunk/logger";
import {
  rf as z, // 完整 zod 命名空间（shared 字母导出）
  wi as parseToml, // TOML 文本 → JSON 对象（shared 内嵌解析器）
  ka as SETTING_DESCRIPTORS, // 全部设置描述符（含 key/default/hostStorage）
  Ea as findSettingDescriptor, // 按 key 查设置描述符
  Da as schemaForSetting, // 按 key 取设置的 zod schema
  Fa as SETTINGS, // 设置描述符分组（followUpQueueMode/composerEnterBehavior/…）
  Ma as LOCAL_SETTINGS, // 本地（hidden）设置分组（defaultServiceTier/…）
  Ga as defaultServiceTierFromAtomState, // persisted-atom 值 → defaultServiceTier
  iu as STATE_KEYS, // persisted-atom / global-state 键名表
} from "@chunk/shared";
import { GlobalState, INITIAL_FOLLOW_UP_QUEUE_MODE_KEY, PERSISTED_ATOM_STATE_KEY } from "../state/global-state";
import { encodeSettingsForToml as tomlToJson, decodeSettingsFromToml as jsonToToml } from "./toml-codec";

const logger = memoizedTaggedLogger(`settings-store`);

/** （legacy）persisted-atom 里 composer Enter 行为的旧键名。 */
const LEGACY_ENTER_BEHAVIOR_KEY = `enter-behavior`;
/** （legacy）persisted-atom 里「无项目 onboarding 已完成」标记键名。 */
const LEGACY_ONBOARDING_PROJECTLESS_COMPLETED_KEY = `electron:onboarding-projectless-completed`;

/** app-server 配置客户端（configClient）的最小接口。 */
export interface DesktopConfigClient {
  config: { desktop?: Record<string, unknown> | null };
  batchWriteConfigValues(input: {
    edits: Array<{ keyPath: string; mergeStrategy: string; value: unknown }>;
  }): Promise<unknown>;
}

/** 设置描述符（shared 的 n.ka 元素形状，按需取字段）。 */
interface SettingDescriptor {
  key: string;
  default?: unknown;
  hostStorage: { kind: `configuration` | `global-state` | `persisted-atom`; key: string };
}

/** TOML 可表达的值（递归：标量/数组/同质 record）。 */
const tomlValueSchema: any = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(tomlValueSchema),
    z.record(z.string(), tomlValueSchema),
  ]),
);
/** config.toml 顶层 schema（只关心 desktop 段，其余字段放行）。 */
const configTomlSchema = z
  .object({ desktop: z.record(z.string(), z.unknown()).optional() })
  .loose();

/**
 * desktop 段设置存储。
 *
 * 内存态 state: key → 已解析设置值；desktopConfig: key → TOML 侧值；
 * pendingWrites/pendingLegacyMigrations 分别是待通过 configClient 写出的
 * 用户修改与迁移值（仅当值未被后续修改覆盖时才出队）。
 */
export class SettingsStore {
  private filePath: string;
  private globalState: GlobalState;
  private state = new Map<string, unknown>();
  private changeListeners = new Map<string, Set<() => void>>();
  private pendingLegacyMigrations = new Map<string, unknown>();
  private pendingWrites = new Map<string, unknown>();
  private desktopConfig: Record<string, unknown>;
  private configClient: DesktopConfigClient | null = null;
  private persistQueued: Promise<unknown> = Promise.resolve();

  constructor(filePath: string, globalState: GlobalState) {
    this.filePath = filePath;
    this.globalState = globalState;
    this.desktopConfig = readDesktopConfig(this.filePath);
    this.state = parseSettingsFromDesktopConfig(this.desktopConfig);
    migrateLegacySettings(this.state, this.pendingLegacyMigrations, this.globalState);
  }

  getStateFilePath(): string {
    return this.filePath;
  }

  /** 当前内存中的 desktop 段原始（TOML 侧）值。 */
  getDesktopConfig(): Record<string, unknown> {
    return this.desktopConfig;
  }

  /**
   * 首次捕获初始 follow-up 队列模式：已记录则沿用；否则按「完成过无项目
   * onboarding 或存在本地项目」判定 queue，否则 steer，并写入 global-state。
   */
  async captureInitialFollowUpQueueMode(): Promise<`queue` | `steer`> {
    let stored = this.globalState.getStored(INITIAL_FOLLOW_UP_QUEUE_MODE_KEY);
    if (stored != null) return stored as `queue` | `steer`;
    let atoms = this.globalState.getStored(PERSISTED_ATOM_STATE_KEY) as Record<string, unknown> | undefined;
    let onboardingCompleted = atoms?.[LEGACY_ONBOARDING_PROJECTLESS_COMPLETED_KEY] === true;
    let hasLocalProjects =
      Object.keys((this.globalState.getStored((STATE_KEYS as any).LOCAL_PROJECTS) ?? {}) as object).length > 0;
    let mode: `queue` | `steer` = onboardingCompleted || hasLocalProjects ? `queue` : `steer`;
    this.globalState.set(INITIAL_FOLLOW_UP_QUEUE_MODE_KEY, mode);
    await this.globalState.flush();
    return mode;
  }

  /** 接入 app-server 配置客户端：以 server 配置刷新内存态并触发迁移收尾。 */
  async initialize(configClient: DesktopConfigClient): Promise<void> {
    let initialQueueMode = await this.captureInitialFollowUpQueueMode();
    let previousValues = new Map(
      [...this.changeListeners.keys()].map((key) => [key, this.get(key)]),
    );
    this.configClient = configClient;
    this.desktopConfig = configClient.config.desktop ?? {};
    let fromServer = parseSettingsFromDesktopConfig(this.desktopConfig);
    let migratedKeys = new Set<string>();
    for (let descriptor of SETTING_DESCRIPTORS as SettingDescriptor[]) {
      if (this.pendingWrites.has(descriptor.key)) continue;
      if (fromServer.has(descriptor.key)) {
        this.state.set(descriptor.key, fromServer.get(descriptor.key));
        if (this.pendingLegacyMigrations.delete(descriptor.key)) migratedKeys.add(descriptor.key);
        continue;
      }
      if (!this.pendingLegacyMigrations.has(descriptor.key)) this.state.delete(descriptor.key);
    }
    this.initializeFollowUpQueueMode(initialQueueMode);
    for (let [key, previous] of previousValues) {
      if (!Object.is(previous, this.get(key))) this.notifyChangeListeners(key);
    }
    clearLegacySettings(migratedKeys, this.globalState);
    await this.persistPendingSettings();
  }

  /** 监听设置变化，返回反注册函数。 */
  onDidChange(key: string, listener: () => void): () => void {
    let listeners = this.changeListeners.get(key) ?? new Set();
    listeners.add(listener);
    this.changeListeners.set(key, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.changeListeners.delete(key);
    };
  }

  /** 已存储的设置值（未设置时 undefined）。 */
  get(key: string): unknown {
    return this.state.get(key);
  }

  /** 生效值：未设置时回退到设置描述符的 default。 */
  getEffective(key: string): unknown {
    return this.get(key) ?? (findSettingDescriptor(key) as SettingDescriptor | undefined)?.default;
  }

  /** 写入设置：解析校验 → 更新内存态 / TOML 侧值 / 待写队列 → 持久化。 */
  set(key: string, value: unknown): void {
    let previous = this.get(key);
    let parsed = schemaForSetting(key).parse(value);
    this.state.set(key, parsed);
    this.desktopConfig[key] = tomlToJson(schemaForSetting(key), parsed);
    this.pendingWrites.set(key, parsed);
    if (!Object.is(previous, parsed)) this.notifyChangeListeners(key);
    this.persistPendingSettings();
  }

  /** 等待在途持久化完成后再排一次（确保挂起的合并写入被冲刷）。 */
  flush(): Promise<unknown> {
    return this.persistQueued.then(() => this.persistPendingSettings());
  }

  private notifyChangeListeners(key: string): void {
    for (let listener of this.changeListeners.get(key) ?? []) listener();
  }

  /** 首次写入 follow-up 队列模式（state 中已有值时跳过）。 */
  private initializeFollowUpQueueMode(mode: `queue` | `steer`): void {
    let key = (SETTINGS as any).followUpQueueMode.key as string;
    if (this.state.has(key)) return;
    this.state.set(key, mode);
    this.desktopConfig[key] = tomlToJson(schemaForSetting(key), mode);
    this.pendingWrites.set(key, mode);
  }

  /**
   * 把待写（用户修改 + 迁移）合并后经 configClient.batchWriteConfigValues
   * 写出；仅当键的值自快照以来未被再次修改时才出队。失败仅告警（值留在
   * 队列里，下次写入时重试）。无 configClient 时为 no-op。
   */
  private persistPendingSettings(): Promise<unknown> {
    let configClient = this.configClient;
    if (configClient != null) {
      this.persistQueued = this.persistQueued
        .catch(() => void 0)
        .then(async () => {
          let legacySnapshot = new Map(this.pendingLegacyMigrations);
          let writesSnapshot = new Map(this.pendingWrites);
          let merged = new Map(legacySnapshot);
          for (let [key, value] of writesSnapshot) merged.set(key, value);
          if (merged.size !== 0) {
            try {
              await configClient.batchWriteConfigValues({
                edits: [...merged.entries()].map(([key, value]) => ({
                  keyPath: `desktop.${key}`,
                  mergeStrategy: `replace`,
                  value: tomlToJson(schemaForSetting(key), value),
                })),
              });
              for (let [key, value] of legacySnapshot) {
                if (this.pendingLegacyMigrations.get(key) === value) this.pendingLegacyMigrations.delete(key);
              }
              for (let [key, value] of writesSnapshot) {
                if (this.pendingWrites.get(key) === value) this.pendingWrites.delete(key);
              }
              clearLegacySettings(new Set(legacySnapshot.keys()), this.globalState);
            } catch (error) {
              logger().warning(`Failed to persist desktop settings`, {
                safe: {},
                sensitive: { error },
              });
            }
          }
        });
    }
    return this.persistQueued;
  }
}

// ---------------------------------------------------------------------------
// 读取 / 解析 / 迁移
// ---------------------------------------------------------------------------

/**
 * 把旧存储位置的设置迁移进 state（不清理旧值——清理发生在写入 config.toml
 * 成功后，由 MD/clearLegacySettings 负责）。
 */
function migrateLegacySettings(
  state: Map<string, unknown>,
  pendingLegacyMigrations: Map<string, unknown>,
  globalState: GlobalState,
): void {
  let atoms = globalState.getStored(PERSISTED_ATOM_STATE_KEY) as Record<string, unknown> | null | undefined;
  for (let descriptor of SETTING_DESCRIPTORS as SettingDescriptor[]) {
    if (state.has(descriptor.key)) continue;
    let legacyValue = readLegacySettingValue(descriptor, globalState, atoms);
    if (legacyValue === undefined) continue;
    let parsed = schemaForSetting(descriptor.key).safeParse(legacyValue);
    if (!parsed.success) {
      logger().warning(`Dropping invalid migrated setting`, { safe: { key: descriptor.key }, sensitive: {} });
      continue;
    }
    state.set(descriptor.key, parsed.data);
    pendingLegacyMigrations.set(descriptor.key, parsed.data);
  }
}

/** 读取 config.toml 的 desktop 段（文件缺失/解析失败返回空对象）。 */
function readDesktopConfig(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) return {};
  try {
    let parsed = configTomlSchema.parse(parseToml(readFileSync(filePath, `utf8`)));
    return sanitizeDesktopConfig(parsed.desktop ?? {});
  } catch (error) {
    logger().warning(`Failed to load desktop settings from config.toml`, {
      safe: {},
      sensitive: { error },
    });
    return {};
  }
}

/** 丢弃 desktop 段里 TOML 值不合法（含 null 等无法落盘的值）的键。 */
function sanitizeDesktopConfig(desktop: Record<string, unknown>): Record<string, unknown> {
  let result: Record<string, unknown> = {};
  for (let [key, value] of Object.entries(desktop)) {
    let parsed = tomlValueSchema.safeParse(value);
    if (!parsed.success) {
      logger().warning(`Dropping unsupported desktop config value`, { safe: { key }, sensitive: {} });
      continue;
    }
    result[key] = parsed.data;
  }
  return result;
}

/** TOML 侧值 → 已解析设置值（丢弃非法值与未注册键）。 */
function parseSettingsFromDesktopConfig(desktop: Record<string, unknown>): Map<string, unknown> {
  let result = new Map<string, unknown>();
  for (let [key, value] of Object.entries(desktop)) {
    let descriptor = findSettingDescriptor(key) as SettingDescriptor | undefined;
    if (descriptor == null) continue;
    let schema = schemaForSetting(descriptor.key);
    let parsed = schema.safeParse(jsonToToml(schema, value));
    if (!parsed.success) {
      logger().warning(`Dropping invalid desktop setting`, { safe: { key }, sensitive: {} });
      continue;
    }
    result.set(descriptor.key, parsed.data);
  }
  return result;
}

/**
 * 读取设置在旧存储位置的值：
 *   - configuration：global-state 同名键；缺失时 composerEnterBehavior 回退
 *     persisted-atom 的 enter-behavior，keepRemoteControlAwakeWhilePluggedIn
 *     回退 preventSleepWhileRunning；
 *   - global-state：直接读；
 *   - persisted-atom：读原子值，defaultServiceTier 走专用解析。
 */
function readLegacySettingValue(
  descriptor: SettingDescriptor,
  globalState: GlobalState,
  atoms: Record<string, unknown> | null | undefined,
): unknown {
  let { hostStorage } = descriptor;
  switch (hostStorage.kind) {
    case `configuration`: {
      let stored = globalState.getStored(hostStorage.key);
      if (stored !== undefined) return stored;
      if (
        descriptor.key === (SETTINGS as any).composerEnterBehavior.key &&
        atoms != null &&
        Object.prototype.hasOwnProperty.call(atoms, LEGACY_ENTER_BEHAVIOR_KEY)
      ) {
        return atoms[LEGACY_ENTER_BEHAVIOR_KEY];
      }
      if (descriptor.key === (SETTINGS as any).keepRemoteControlAwakeWhilePluggedIn.key) {
        return globalState.getStored((SETTINGS as any).preventSleepWhileRunning.key);
      }
      return undefined;
    }
    case `global-state`:
      return globalState.getStored(hostStorage.key);
    case `persisted-atom`: {
      if (atoms == null || !Object.prototype.hasOwnProperty.call(atoms, hostStorage.key)) return undefined;
      return descriptor.key === (LOCAL_SETTINGS as any).defaultServiceTier.key
        ? defaultServiceTierFromAtomState(atoms)
        : atoms[hostStorage.key];
    }
  }
}

/**
 * 清理已写入 config.toml 的迁移键的旧存储：configuration/global-state 直接
 * 删键；persisted-atom 从原子状态包中删除字段（包为空时整键删除）。同时
 * 清掉 composerEnterBehavior 的 legacy enter-behavior 字段。
 */
function clearLegacySettings(migratedKeys: Set<string>, globalState: GlobalState): void {
  if (migratedKeys.size === 0) return;
  let atoms = globalState.getStored(PERSISTED_ATOM_STATE_KEY) as Record<string, unknown> | null | undefined;
  let nextAtoms = atoms ? { ...atoms } : null;
  let atomsChanged = false;
  for (let key of migratedKeys) {
    let descriptor = findSettingDescriptor(key) as SettingDescriptor | undefined;
    if (
      key === (SETTINGS as any).composerEnterBehavior.key &&
      nextAtoms != null &&
      Object.prototype.hasOwnProperty.call(nextAtoms, LEGACY_ENTER_BEHAVIOR_KEY)
    ) {
      delete nextAtoms[LEGACY_ENTER_BEHAVIOR_KEY];
      atomsChanged = true;
    }
    switch (descriptor?.hostStorage.kind) {
      case `configuration`:
      case `global-state`:
        globalState.delete((descriptor as SettingDescriptor).hostStorage.key);
        break;
      case `persisted-atom`:
        if (nextAtoms != null && Object.prototype.hasOwnProperty.call(nextAtoms, descriptor.hostStorage.key)) {
          delete nextAtoms[descriptor.hostStorage.key];
          atomsChanged = true;
        }
        break;
    }
  }
  if (atomsChanged) {
    globalState.set(PERSISTED_ATOM_STATE_KEY, Object.keys(nextAtoms ?? {}).length === 0 ? undefined : (nextAtoms ?? undefined));
  }
}
