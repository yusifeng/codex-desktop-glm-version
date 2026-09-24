// 执行主机路径转换（原版 2,970-3,005 一带的 zn/Rn 等辅助）。
//
// 职责：在「逻辑 codex 路径」与「执行主机路径」之间转换——WSL host 上
// Windows 路径 ↔ WSL 路径（经 shared 的 Vi/ji），其余平台原样返回。
//
// 依赖约束：@chunk/shared 的 Vi/ji/Ri/zi；纯函数模块。

import {
  Vi as windowsToWslPath,
  ji as wslToWindowsPath,
  Ri as detectWslEnvironment,
  zi as shouldUseWslPaths,
} from "@chunk/shared";

/**
 * 逻辑路径 → 执行主机路径（原 zn，2,981-2,983）：WSL host 上转换，
 * 否则原样。
 */
export function convertPathForExecutionHost(path: string, useWslPaths: boolean): string {
  return useWslPaths ? windowsToWslPath(path) : path;
}

/** 以环境探测结果转换（原 Rn，2,978-2,980）。 */
export function convertPathForDetectedEnvironment(path: string): string {
  return convertPathForExecutionHost(path, detectWslEnvironment());
}

/**
 * 执行主机路径 → 逻辑路径（原 Vn，2,987-2,989）：WSL 环境下反向转换。
 * （Bn 的原始形态；保留以备 16 万区消费。）
 */
export function convertPathFromExecutionHost(path: string, isWsl: boolean): string {
  return isWsl ? wslToWindowsPath(path, detectWslEnvironment()) : path;
}

/** hostConfig → 是否需要 WSL 转换（透传 shared 的 zi）。 */
export { shouldUseWslPaths };
