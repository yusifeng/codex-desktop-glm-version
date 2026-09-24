// hid-topology-watcher.node 原生插件加载。
//
// 插件按以下候选路径顺序查找（第一个存在的胜出）：
//   1. <resourcesPath>/native/hid-topology-watcher.node
//      （resourcesPath 支持 CODEX_ELECTRON_RESOURCES_PATH 环境变量覆盖）
//   2. <appPath>/native/hid-topology-watcher-addon/build/Release-<arch>/
//      hid_topology_watcher.node（开发树内的本地构建）
// 官方发布 asar 中两个位置都不存在该文件，watch() 会抛
// "HID topology watcher addon not found"，服务退化为 30s 轮询扫描
// （CodexMicroService.scheduleTopologyFallbackScan）。

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { app } from "electron";
import { resolveElectronResourcesPath } from "@chunk/electron-resources-path";
import type { HidTopologyWatcher, RawHidDevice } from "./types";

/** resources 树中的插件文件名（发布形态）。 */
const ADDON_RESOURCE_FILE_NAME = "hid-topology-watcher.node";
/** 开发构建树中的插件文件名（下划线形态）。 */
const ADDON_BUILD_FILE_NAME = "hid_topology_watcher.node";

const requireFromFile = createRequire(__filename);

/** 插件的运行时面：HID 拓扑订阅 + Codex Micro 接口枚举。 */
interface HidTopologyWatcherAddon {
  /** 订阅系统级 HID 拓扑变化（插拔/传输切换），返回可销毁的监听句柄。 */
  watch(onChanged: () => void): HidTopologyWatcher;
  /**
   * 枚举当前所有 Codex Micro 原始 HID 接口（非 linux 平台的发现路径）。
   * 返回原始条目（path/productId/usagePage/transport/release），
   * 由 discovery.ts 的 filterDiscoveredDevices 过滤成 WLDevice 形状。
   */
  findCodexMicroInterfaces(): RawHidDevice[];
}

/** 生成插件的候选路径列表（resources 优先，本地构建兜底）。 */
function addonCandidatePaths(): string[] {
  const localBuildPath = join(
    app.getAppPath(),
    "native",
    "hid-topology-watcher-addon",
    "build",
    `Release-${process.arch}`,
    ADDON_BUILD_FILE_NAME,
  );
  const resourcesPath = resolveElectronResourcesPath({
    env: process.env,
    resourcesPath: process.resourcesPath,
  });
  return resourcesPath == null
    ? [localBuildPath]
    : [join(resourcesPath, "native", ADDON_RESOURCE_FILE_NAME), localBuildPath];
}

/** 加载 HID 拓扑监听原生插件（不存在时抛错）。 */
function loadHidTopologyWatcherAddon(): HidTopologyWatcherAddon {
  const addonPath = addonCandidatePaths().find(existsSync);
  if (addonPath == null) throw Error(`HID topology watcher addon not found`);
  return requireFromFile(addonPath) as HidTopologyWatcherAddon;
}

/** 订阅 HID 拓扑变化（CodexMicroService 的 watchHidTopology 默认实现）。 */
export function watchHidTopology(onChanged: () => void): HidTopologyWatcher {
  return loadHidTopologyWatcherAddon().watch(onChanged);
}

/** 枚举 Codex Micro 原始 HID 接口（CodexMicroService 的 findDevices 默认实现，非 linux）。 */
export function findCodexMicroInterfaces(): RawHidDevice[] {
  return loadHidTopologyWatcherAddon().findCodexMicroInterfaces();
}

export type { RawHidDevice };
