// 启动环境装配（原版 22763-22832 区段）。
//
// createStartupContext({moduleDir}) 在 app ready 早期执行：
//   - 解析 codex home（~/.codex，WSL 场景为 WSL 侧路径）并清理上次崩溃
//     残留的 sqlite snapshot 数据库；
//   - 创建 GlobalState（首启时写入 desktop-first-seen-at-ms 与迁移公告
//     标记）、SettingsStore，检测 Windows WSL 偏好并注入 shared chunk 的
//     spawn 策略（setShouldSpawnInsideWsl）；
//   - 解析执行侧 codex home（preferWsl）、preload 路径、desktop/repo 根；
//   - 应用主题偏好。
//
// FD/recordWindowsHomeOwnership：Windows 上在用户主目录写 `.desktop-created`
// 标记（`wx` 独占创建），用于判断「桌面应用是否创建了这个 home」。

import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getLogger } from "@chunk/logger";
import {
  Oi as resolveCodexHomeSync, // codex home（同步版，preferWsl 不可用）
  Ni as resolveWslDistro, // WSL 默认发行版（非 win32 / 未安装返回 null）
  Li as setShouldSpawnInsideWsl, // 注入 shared 的 WSL spawn 策略（只允许设置一次）
  ki as resolveExecutionCodexHome, // 执行侧 codex home（异步，preferWsl）
  si as initSqliteState, // shared 的状态数据库初始化（sqlite，加载即连接）
  iu as STATE_KEYS, // persisted-atom / global-state 键名表
  Fa as SETTINGS, // 设置描述符分组（theme/runCodexInWsl/…）
  Ha as APPEARANCE_SETTINGS, // 外观设置分组（theme）
} from "@chunk/shared";
import {
  GlobalState,
  PERSISTED_ATOM_STATE_KEY,
  INTERNAL_UPDATE_CDN_ENABLED_KEY,
  WINDOWS_CORE_RUNTIME_FRAMEWORKS_ENABLED_KEY,
  WINDOWS_PRIMARY_RUNTIME_FRAMEWORKS_ENABLED_KEY,
  applyTheme,
} from "../state/global-state";
import { SettingsStore } from "../settings/settings-store";
import { MIGRATION_ANNOUNCEMENT_KEY } from "../util/misc";

/** 全局状态文件名（位于 codex home 下）。 */
export const GLOBAL_STATE_FILENAME = `.codex-global-state.json`;
/** 设置文件名（位于 codex home 下）。 */
export const CONFIG_TOML_FILENAME = `config.toml`;

/** 创建 StartupContext 的入参。 */
export interface StartupContextOptions {
  /** bootstrap 输出目录（preload.js 所在目录）。 */
  moduleDir: string;
}

/** createStartupContext 的产出：主进程启动所需的环境句柄集合。 */
export interface StartupContext {
  /** codex home（`~/.codex`，Windows 上为用户主目录的 .codex）。 */
  codexHome: string;
  /** 执行侧 codex home（WSL 运行时指向 WSL 侧路径）。 */
  executionCodexHome: string;
  /** preload 脚本绝对路径（moduleDir/preload.js）。 */
  preloadPath: string;
  /** desktop 仓库根（moduleDir/../..）。 */
  desktopRoot: string;
  /** 仓库根（desktopRoot/..）。 */
  repoRoot: string;
  /** 全局状态存储。 */
  globalState: GlobalState;
  /** 设置存储。 */
  settingsStore: SettingsStore;
}

/**
 * Windows：记录「桌面应用创建了该用户主目录」。目录已存在（mkdir 幂等）
 * 或标记文件已存在（`wx` → EEXIST）都视为成功；其余错误仅告警。
 */
export async function recordWindowsHomeOwnership(): Promise<void> {
  try {
    let home = resolveCodexHomeSync();
    if ((await mkdir(home, { recursive: true })) === undefined) return;
    await writeFile(join(home, `.desktop-created`), ``, { flag: `wx` });
  } catch (error) {
    if (error instanceof Error && `code` in error && (error as NodeJS.ErrnoException).code === `EEXIST`) return;
    getLogger().warning(`Failed to record Windows desktop home ownership`, {
      safe: {},
      sensitive: { error },
    });
  }
}

/** 创建全局状态存储（状态文件为 codex home 下的 GLOBAL_STATE_FILENAME）。 */
export function createGlobalState(codexHome: string): GlobalState {
  return new GlobalState(join(codexHome, GLOBAL_STATE_FILENAME));
}

/** 写入内部更新 CDN 开关并刷盘。 */
export async function setInternalUpdateCdnEnabled(
  globalState: GlobalState,
  enabled: boolean,
): Promise<void> {
  globalState.set(INTERNAL_UPDATE_CDN_ENABLED_KEY, enabled);
  await globalState.flush();
}

/** Windows runtime framework 开关读：enableAll 时直接全开。 */
export function readWindowsRuntimeFrameworksEnabled(
  globalState: GlobalState,
  enableAll = false,
): { core: boolean; primary: boolean } {
  return {
    core: enableAll || globalState.get(WINDOWS_CORE_RUNTIME_FRAMEWORKS_ENABLED_KEY) === true,
    primary: enableAll || globalState.get(WINDOWS_PRIMARY_RUNTIME_FRAMEWORKS_ENABLED_KEY) === true,
  };
}

/** Windows runtime framework 开关写并刷盘。 */
export async function writeWindowsRuntimeFrameworksEnabled(
  globalState: GlobalState,
  enabled: { core: boolean; primary: boolean },
): Promise<void> {
  globalState.set(WINDOWS_CORE_RUNTIME_FRAMEWORKS_ENABLED_KEY, enabled.core);
  globalState.set(WINDOWS_PRIMARY_RUNTIME_FRAMEWORKS_ENABLED_KEY, enabled.primary);
  await globalState.flush();
}

/**
 * 装配启动环境。
 *
 * 顺序敏感：sqlite 状态库初始化（n.si）先于删除 snapshot 残留（模块加载
 * 即建立连接后清理 `-wal`/`-shm`/`-journal`）；GlobalState 首启写入两个键
 * 后立即构造 SettingsStore（读取 config.toml + 迁移）；WSL 检测结果注入
 * shared 的 spawn 策略后才解析执行侧 codex home；最后应用主题。
 */
export async function createStartupContext({ moduleDir }: StartupContextOptions): Promise<StartupContext> {
  initSqliteState();
  let codexHome = resolveCodexHomeSync();
  let buildFlavor =
    process.env.BUILD_FLAVOR ?? (process.env.NODE_ENV === `production` ? `prod` : `dev`);
  let historySnapshotsDb = join(
    codexHome,
    `sqlite`,
    buildFlavor === `prod` ? `codex-history-snapshots.db` : `codex-history-snapshots-${buildFlavor}.db`,
  );
  await Promise.allSettled(
    [``, `-wal`, `-shm`, `-journal`].map((suffix) => rm(`${historySnapshotsDb}${suffix}`, { force: true })),
  );
  let preloadPath = join(moduleDir, `preload.js`);
  let desktopRoot = join(moduleDir, `..`, `..`);
  let repoRoot = join(desktopRoot, `..`);
  let globalState = createGlobalState(codexHome);
  let globalStatePath = globalState.getStateFilePath();
  if (!existsSync(globalStatePath) && !existsSync(`${globalStatePath}.bak`)) {
    globalState.set((STATE_KEYS as any).DESKTOP_FIRST_SEEN_AT_MS, Date.now());
    globalState.update(PERSISTED_ATOM_STATE_KEY, (current) => ({
      ...(current as Record<string, unknown> | null),
      [MIGRATION_ANNOUNCEMENT_KEY]: true,
    }));
  }
  let settingsStore = new SettingsStore(join(codexHome, CONFIG_TOML_FILENAME), globalState);
  let preferWsl =
    process.platform === `win32` &&
    settingsStore.getEffective((SETTINGS as any).runCodexInWsl.key) === true &&
    (await resolveWslDistro()) != null;
  setShouldSpawnInsideWsl(() => preferWsl);
  let executionCodexHome = await resolveExecutionCodexHome({ preferWsl });
  applyTheme(settingsStore.getEffective((APPEARANCE_SETTINGS as any).theme.key) ?? `system`);
  return {
    codexHome,
    executionCodexHome,
    preloadPath,
    desktopRoot,
    repoRoot,
    globalState,
    settingsStore,
  };
}
