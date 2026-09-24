// computer-use 应用路径解析与 canonical 刷新（原 main-C-Mhak1n.ts 4,729-4,790 +
// 12,368-12,376 + 12,524-12,548 行的
// `ji/hne/Mi/gne/Ni/Pi/Fi/_ne/vne/Ii/yne/bne/Li/Ri/zi/Coe/woe/Toe/Ooe/koe/Aoe/bl`）。
//
// 职责：
//   - 解析 `Codex Computer Use.app` 的各候选路径：codexHome 下的 canonical 副本
//     （<codexHome>/computer-use/…）、resources 内的捆绑副本
//     （<resources>/cua_node/lib/node_modules/@oai/sky/…）、以及
//     CODEX_ELECTRON_COMPUTER_USE_APP_PATH 环境覆盖。
//   - canonical 刷新（原 `Toe`）：macOS 上把捆绑 app 用 /usr/bin/ditto 复制到
//     codexHome（先删旧副本）；可用 CODEX_ELECTRON_SKIP_COMPUTER_USE_CANONICAL_REFRESH=1
//     跳过。
//   - marketplace 安装状态 → computer-use 插件 enabled/paths 判定（原 `Ri/zi`，
//     marketplace 查找辅助 ki/Ai 属 plugins/marketplace 模块）。
//   - SkyComputerUseService 的环境键组装（原 `yne`：SKY_CUA_* 环境变量）。
//
// 本模块唯一的模块级求值是 DEFAULT_COMPUTER_USE_PIPE_PATH 的 randomUUID()
// （纯随机数计算，无 I/O、无监听，与原 4,742 行一致）。

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, realpathSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

// @chunk/bootstrap 的兼容导出（单字母名）：`in` → BuildFlavor 模型。
import { "in" as BuildFlavor } from "@chunk/bootstrap";
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
// @chunk/shared 的压缩名导出，按语义重命名导入：
//   Fl → computer-use 插件名（"computer-use"）
//   Rl → browser-use 插件名
//   Ul → build flavor → marketplace 名
//   Vl → 默认 marketplace 名
import { Fl as COMPUTER_USE_PLUGIN_NAME, Rl as BROWSER_USE_PLUGIN_NAME, Ul as marketplaceNameForFlavor, Vl as DEFAULT_MARKETPLACE_NAME } from "@chunk/shared";
// plugins/marketplace（3.3 簇）的 marketplace 查找辅助（原 ki/Ai）。
import {
  selectBundledMarketplaces,
  findBundledPlugin,
} from "../plugins/marketplace";

/** CUA 服务 app 的显示名（原 `ji`）。 */
export const COMPUTER_USE_APP_NAME = `Codex Computer Use.app`;

/** resources 内捆绑 app 的路径段（原 `hne`）。 */
const BUNDLED_SERVICE_APP_SEGMENTS = [`cua_node`, `lib`, `node_modules`, `@oai`, `sky`, COMPUTER_USE_APP_NAME];

/** codexHome 下 canonical app 副本路径（原 `Mi`）。 */
export function canonicalServiceAppPath(codexHome: string): string {
  return join(codexHome, `computer-use`, COMPUTER_USE_APP_NAME);
}

/** resources 内捆绑 app 路径（原 `gne`）。 */
export function bundledServiceAppPath(resourcesPath: string): string {
  return join(resourcesPath, ...BUNDLED_SERVICE_APP_SEGMENTS);
}

// ---- SkyComputerUseService 环境键（原 Ni/Pi/Fi/_ne/vne）--------------------

/** node-repl 指令注入用例标记（computer-use，原 `Ni`）。 */
export const NODE_REPL_INSTRUCTIONS_USE_CASE_COMPUTER_USE = `NODE_REPL_INSTRUCTIONS_USE_CASE_COMPUTER_USE`;
/** CUA 服务 app 路径环境键（原 `Pi`）。 */
export const SKY_CUA_SERVICE_PATH = `SKY_CUA_SERVICE_PATH`;
/** CUA 服务 native pipe 路径环境键（原 `Fi`）。 */
export const SKY_CUA_SERVICE_NATIVE_PIPE_PATH = `SKY_CUA_SERVICE_NATIVE_PIPE_PATH`;
/** CUA native pipe 启用标记环境键（原 `_ne`）。 */
export const SKY_CUA_NATIVE_PIPE = `SKY_CUA_NATIVE_PIPE`;
/** CUA native pipe 目录环境键（原 `vne`）。 */
export const SKY_CUA_NATIVE_PIPE_DIRECTORY = `SKY_CUA_NATIVE_PIPE_DIRECTORY`;

/**
 * win32 下 computer-use native pipe 的默认命名管道名（原 `Ii`）。
 * 模块级 randomUUID：每个进程一个固定随机名（纯计算，无副作用）。
 */
export const DEFAULT_COMPUTER_USE_PIPE_PATH = `\\\\.\\pipe\\codex-computer-use-${randomUUID()}`;

/**
 * 组装 CUA 服务的环境变量片段（原 `yne`）：
 * serviceAppPath → SKY_CUA_SERVICE_PATH；serviceNativePipePath →
 * SKY_CUA_SERVICE_NATIVE_PIPE_PATH；nativePipeEnabled 时附 SKY_CUA_NATIVE_PIPE=1
 * 与管道目录（缺省用 win32 默认随机名）。
 */
export function computerUseServiceEnv({
  nativePipeDirectory,
  nativePipeEnabled = false,
  serviceAppPath,
  serviceNativePipePath,
}: {
  nativePipeDirectory?: string;
  nativePipeEnabled?: boolean;
  serviceAppPath?: string | null;
  serviceNativePipePath?: string | null;
} = {}): Record<string, string> {
  return {
    ...(serviceAppPath == null ? {} : { [SKY_CUA_SERVICE_PATH]: serviceAppPath }),
    ...(serviceNativePipePath == null ? {} : { [SKY_CUA_SERVICE_NATIVE_PIPE_PATH]: serviceNativePipePath }),
    ...(nativePipeEnabled
      ? { [SKY_CUA_NATIVE_PIPE]: `1`, [SKY_CUA_NATIVE_PIPE_DIRECTORY]: nativePipeDirectory ?? DEFAULT_COMPUTER_USE_PIPE_PATH }
      : {}),
  };
}

/**
 * 解析 service app 路径（原 `bne`）：SKY_CUA_SERVICE_PATH 环境覆盖优先，
 * 否则 canonical 副本存在才采用。
 */
function resolveServiceAppPath({
  canonicalServiceAppPath,
  env = process.env,
  pathExists = existsSync,
}: {
  canonicalServiceAppPath?: string | null;
  env?: Record<string, string | undefined>;
  pathExists?: (path: string) => boolean;
}): string | null {
  const fromEnv = env[SKY_CUA_SERVICE_PATH]?.trim();
  if (fromEnv) return fromEnv;
  const canonical = canonicalServiceAppPath?.trim();
  return canonical && pathExists(canonical) ? canonical : null;
}

/**
 * 解析 computer-use 的服务路径（原 `Li`）：
 * 有 codexHome 时以 canonical 副本为候选，无则仅环境覆盖。
 */
export function resolveComputerUsePaths({
  codexHome,
  env = process.env,
  pathExists = existsSync,
}: {
  codexHome?: string;
  env?: Record<string, string | undefined>;
  pathExists?: (path: string) => boolean;
} = {}): { serviceAppPath: string | null } {
  return {
    serviceAppPath: resolveServiceAppPath({
      canonicalServiceAppPath: codexHome == null ? null : canonicalServiceAppPath(codexHome),
      env,
      pathExists,
    }),
  };
}

/**
 * computer-use 插件是否在任一相关 marketplace 中安装且可用（原 `Ri`）。
 */
export function isComputerUsePluginEnabled({
  marketplaceName = marketplaceNameForFlavor(BuildFlavor.resolve()),
  marketplaces,
}: {
  marketplaceName?: string;
  marketplaces: any[];
}): boolean {
  const found = findBundledPlugin({
    marketplaceName,
    marketplaces,
    pluginName: COMPUTER_USE_PLUGIN_NAME,
  });
  return found?.plugin.installed === true && found.plugin.enabled && found.plugin.availability === `AVAILABLE`;
}

/**
 * 按 marketplace 安装状态解析 computer-use 服务路径（原 `zi`）：
 * 任一 marketplace 有本地安装源的 computer-use 插件时以 codexHome canonical
 * 副本为候选，否则仅环境覆盖。
 */
export function resolveComputerUsePathsForMarketplaces({
  codexHome,
  env = process.env,
  marketplaceName = marketplaceNameForFlavor(BuildFlavor.resolve()),
  marketplaces,
  pathExists = existsSync,
}: {
  codexHome?: string;
  env?: Record<string, string | undefined>;
  marketplaceName?: string;
  marketplaces: any[];
  pathExists?: (path: string) => boolean;
}): { serviceAppPath: string | null } {
  for (const marketplace of selectBundledMarketplaces({ marketplaceName, marketplaces })) {
    if (
      marketplace.plugins.find(
        (plugin: any) =>
          plugin.name === `computer-use` &&
          plugin.installed &&
          plugin.enabled &&
          plugin.source.type === `local`,
      )?.source.type === `local`
    )
      return resolveComputerUsePaths({ codexHome, env, pathExists });
  }
  return resolveComputerUsePaths({ env, pathExists });
}

// ---- canonical 刷新（原 Coe/woe/Toe，12,368-12,376）------------------------

/** 跳过 canonical 刷新的环境变量（原 `Coe`）。 */
const SKIP_CANONICAL_REFRESH_ENV = `CODEX_ELECTRON_SKIP_COMPUTER_USE_CANONICAL_REFRESH`;

/** promisify 的 execFile（原 `woe`）。 */
const execFileAsync = promisify(execFile);

/**
 * 刷新 codexHome 下的 canonical app 副本（原 `Toe`）。
 *
 * 仅 darwin 且未设置跳过开关且源路径非空时执行：mkdir -p 父目录 → 删除旧副本 →
 * /usr/bin/ditto --noqtn 复制。任何失败向上抛出（调用方决定是否吞掉）。
 */
export async function refreshCanonicalServiceAppCopy({
  sourceServiceAppPath,
  codexHome,
}: {
  sourceServiceAppPath?: string | null;
  codexHome: string;
}): Promise<void> {
  if (process.platform !== `darwin` || process.env[SKIP_CANONICAL_REFRESH_ENV]?.trim() === `1` || sourceServiceAppPath == null)
    return;
  const destination = canonicalServiceAppPath(codexHome);
  await mkdir(dirname(destination), { recursive: true });
  await rm(destination, { force: true, recursive: true });
  await execFileAsync(`/usr/bin/ditto`, [`--noqtn`, sourceServiceAppPath, destination]);
}

// ---- computer-use app 路径解析（原 Ooe/Aoe/bl/koe，12,524-12,548）----------

/** app 路径环境覆盖键（原 `Ooe`）。 */
const COMPUTER_USE_APP_PATH_ENV = `CODEX_ELECTRON_COMPUTER_USE_APP_PATH`;

/** realpath 失败时回退原路径（原 `bl`）。 */
function realpathOrSelf(path: string): string {
  try {
    return realpathSync.native(path);
  } catch {
    return path;
  }
}

/** 读环境覆盖并归一（原 `Aoe`）。 */
function serviceAppPathFromEnv(env: Record<string, string | undefined>): string | null {
  const fromEnv = env[COMPUTER_USE_APP_PATH_ENV]?.trim();
  return fromEnv ? realpathOrSelf(fromEnv) : null;
}

/**
 * 解析 computer-use app 的实际路径（原 `koe`）：
 * 环境覆盖 → resources 捆绑副本（两个候选位置）→ null。
 * 供启动期 canonical 刷新（Toe）取源路径用。
 */
export function resolveComputerUseAppPath(input?: {
  env?: Record<string, string | undefined>;
  resourcesPath?: string | null;
}): string | null {
  const env = input?.env ?? process.env;
  const fromEnv = serviceAppPathFromEnv(env);
  if (fromEnv != null) return fromEnv;
  const resourcesPath =
    input?.resourcesPath ?? resolveElectronResourcesPath({ env, resourcesPath: process.resourcesPath });
  if (resourcesPath == null) return null;
  for (const candidate of [
    bundledServiceAppPath(resourcesPath),
    join(resourcesPath, `cua_node`, `lib`, `node_modules`, `@oai`, `sky`, `bin`, `mac`, `normal`, COMPUTER_USE_APP_NAME),
  ])
    if (existsSync(candidate)) return realpathOrSelf(candidate);
  return null;
}

// 供 native-pipe-service 的选择计算复用（browser-use 插件名判定属 marketplace 语义）。
export { BROWSER_USE_PLUGIN_NAME };
