// Codex Micro / Creator Micro V2 设备发现与过滤。
//
// 发现路径按平台分流：
//   - linux：无 hid-topology-watcher 原生插件，改用 wl-device-kit 内嵌的
//     node-hid 按 (vendorId, productId) 逐个枚举，再补上 productId 字段；
//   - 其他平台：调用 hid-topology-watcher.node 的 findCodexMicroInterfaces。
// 之后把原始 HID 条目过滤成 WLDevice 形状（vendor usagePage 0xFF00 + 已知 PID），
// 并按「USB 连接优先、Codex Micro 优先」排序——首个元素即首选连接目标。

import {
  ConnectionType,
  DeviceLayoutType,
  DeviceType,
  WORK_LOUDER_VENDOR_ID,
  requireNodeHid,
} from "./device-kit";
import { findCodexMicroInterfaces } from "./native-binding";
import type { DiscoveredDevice, RawHidDevice } from "./types";

/** Work Louder Codex Micro 的 USB productId。 */
const CODEX_MICRO_PRODUCT_ID = 33632;
/** Work Louder Creator Micro V2 的 USB productId（两个批次）。 */
const CREATOR_MICRO_V2_PRODUCT_IDS = [33431, 33432];
/** 全部受支持的 productId（排序优先级：Codex Micro 在前）。 */
const SUPPORTED_PRODUCT_IDS = [CODEX_MICRO_PRODUCT_ID, ...CREATOR_MICRO_V2_PRODUCT_IDS];

/** 厂商自定义 HID usage page（0xFF00，Work Louder 设备的厂商接口）。 */
const VENDOR_USAGE_PAGE = 65280;

/** linux 蓝牙 HID 设备 releaseNumber 对 4 取余非 0 视为非 USB。 */
const BLUETOOTH_RELEASE_MODULUS = 4;

/** 枚举全部受支持的设备（平台分流后的统一入口）。 */
export async function findDevices(): Promise<DiscoveredDevice[]> {
  return filterDiscoveredDevices(
    process.platform === "linux"
      ? (
          await Promise.all(
            SUPPORTED_PRODUCT_IDS.map(async (productId) =>
              (await requireNodeHid().devicesAsync(WORK_LOUDER_VENDOR_ID, productId)).map(
                (device) => ({ ...device, productId }),
              ),
            ),
          )
        ).flat()
      : await findCodexMicroInterfaces(),
  );
}

/** 过滤 + 排序：vendor usagePage、已知 PID；USB 在前、Codex Micro 在前。 */
function filterDiscoveredDevices(devices: RawHidDevice[]): DiscoveredDevice[] {
  return devices
    .flatMap((device): DiscoveredDevice[] => {
      const deviceType = deviceTypeForProductId(device.productId);
      // 没有 OS 路径、不是厂商 usagePage、不认识的 PID 一律丢弃。
      if (
        device.path == null ||
        device.usagePage !== VENDOR_USAGE_PAGE ||
        deviceType == null
      ) {
        return [];
      }
      return [
        {
          portPath: device.path,
          devicePid: String(device.productId),
          connectionType: ConnectionType.hid,
          deviceType,
          layoutType: DeviceLayoutType.universal,
          isUsbConnection:
            device.transport === "usb" ||
            // transport 缺省/未知时：releaseNumber 能被 4 整除视为 USB
            // （蓝牙 HID 的 release 编号按惯例落在非 0 余数区间；
            // release 缺省时 NaN % 4 === 0 为 false，即视为非 USB）。
            ((device.transport == null || device.transport === "unknown") &&
              device.release % BLUETOOTH_RELEASE_MODULUS === 0),
        },
      ];
    })
    .toSorted((a, b) => {
      // USB 连接优先于无线；同传输类型时 Codex Micro 优先于 Creator Micro V2。
      const transportDiff = Number(b.isUsbConnection) - Number(a.isUsbConnection);
      return transportDiff === 0
        ? productIdRank(Number(a.devicePid)) - productIdRank(Number(b.devicePid))
        : transportDiff;
    });
}

/** productId 在优先级表中的序号（不在表中返回 -1；过滤后均为已知 PID，实际不会发生）。 */
function productIdRank(productId: number): number {
  return SUPPORTED_PRODUCT_IDS.findIndex((id) => id === productId);
}

/** productId → DeviceType（不认识返回 null）。 */
function deviceTypeForProductId(productId: number): string | null {
  return productId === CODEX_MICRO_PRODUCT_ID
    ? DeviceType.CodexMicro
    : CREATOR_MICRO_V2_PRODUCT_IDS.some((id) => id === productId)
      ? DeviceType.CreatorMicroV2
      : null;
}

/** 发现条目 → 传输类型（isUsbConnection 缺省视为 unknown）。 */
export function transportForDevice(device: DiscoveredDevice): "usb" | "bluetooth" | "unknown" {
  return device.isUsbConnection == null ? "unknown" : device.isUsbConnection ? "usb" : "bluetooth";
}

/** 发现条目 → 型号（Creator Micro V2 之外统一按 codex-micro）。 */
export function modelForDevice(device: DiscoveredDevice): "codex-micro" | "creator-micro-v2" {
  return device.deviceType === DeviceType.CreatorMicroV2 ? "creator-micro-v2" : "codex-micro";
}
