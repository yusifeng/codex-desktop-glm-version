// 渲染进程侧的「共享对象快照」。
//
// 主进程在 preload 阶段同步下发一份键值快照；渲染进程对快照的写入
// （shared-object-set）和主进程的更新（shared-object-updated）都会同步到
// 这份本地副本。
import { ipcRenderer } from "electron";

export const GET_SHARED_OBJECT_SNAPSHOT = "codex_desktop:get-shared-object-snapshot";

let snapshot: Record<string, unknown> = {};

/** 从主进程同步拉取初始快照（在 preload 顶层调用一次）。 */
export function initSharedObjectSnapshot() {
  snapshot = ipcRenderer.sendSync(GET_SHARED_OBJECT_SNAPSHOT) ?? {};
}

export function getSharedObjectSnapshotValue(key: string): unknown {
  return snapshot[key];
}

export function setSharedObjectValue(key: string, value: unknown) {
  if (value === undefined) {
    delete snapshot[key];
    return;
  }
  snapshot[key] = value;
}
