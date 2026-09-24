// @worklouder/device-kit-oai 的加载与类型面。
//
// 原版通过两跳 createRequire 加载：
//   b = createRequire(__filename)                       —— 本 chunk 文件位置
//   x = createRequire(b.resolve("@worklouder/device-kit-oai"))
//   x.resolve("@worklouder/wl-device-kit")              —— device-kit 的依赖位置
//   x("@worklouder/wl-device-kit")("node-hid")          —— linux 枚举用 node-hid
//   b("@worklouder/device-kit-oai")                     —— 主入口（comm/api/枚举）
// 打包后 __filename 是 app/.vite/build/service-CtZiLFyH.js，与 app/node_modules
// 同一棵运行时依赖树，直接用本文件的 createRequire 即可解析。

import { createRequire } from "node:module";
import type {
  DeviceApi,
  DeviceComm,
  DeviceKitLogger,
  DeviceKitModule,
  DiscoveredDevice,
  HidTopologyWatcher,
  RawHidDevice,
} from "./types";

const requireFromFile = createRequire(__filename);
const requireFromDeviceKitOai = createRequire(
  requireFromFile.resolve("@worklouder/device-kit-oai"),
);

const deviceKit = requireFromFile("@worklouder/device-kit-oai") as DeviceKitModule;

/** linux 上的 node-hid 枚举入口（按 usagePage+productId 扫描）。 */
function requireNodeHid(): NodeHidModule {
  return requireFromDeviceKitOai("@worklouder/wl-device-kit")("node-hid");
}

export const {
  ConnectionEventType,
  ConnectionType,
  DeviceType,
  DeviceLayoutType,
  OAILightingEffect,
  WLDeviceError,
  WLDeviceErrorCode,
  WLDeviceCommImpl,
  RPCApiOAI,
} = deviceKit;

export { requireNodeHid };

// ---------------------------------------------------------------------------
// node-hid（仅 linux 枚举路径使用）
// ---------------------------------------------------------------------------

/** node-hid 的 devicesAsync 扫描面。 */
interface NodeHidModule {
  devicesAsync(vendorId: number, productId: number): Promise<RawHidDevice[]>;
}

/** Work Louder 厂商 ID。 */
export const WORK_LOUDER_VENDOR_ID = 12346;

export type { DeviceApi, DeviceComm, DeviceKitLogger, DiscoveredDevice, HidTopologyWatcher };
