// window-all-closed 处理（原 bootstrap-C4dRql4x.ts 24840-24851 行的
// `KA/qA/JA`）。
//
// `qA`（installWindowAllClosedHandler）在主流程 app ready 之前安装：
//   - win32：不做任何事（Windows 惯例是留在后台）；
//   - darwin + packaged：不退出（macOS 惯例，等 app.on('activate') 或显式退出）；
//   - darwin 未打包 / 其他平台：调用 `app.quit()`；
//   - linux：仅当主 chunk 通过 `JA` 注入的自定义检查返回 true 时不退出。
//
// `KA` 是模块级可变状态（默认 `() => false`），`JA` 由 main chunk 在
// 装配时覆盖。

import { app } from "electron";

/** linux 下的自定义「保持运行」检查（原 `KA`，模块级可变，默认恒 false）。 */
let customKeepRunningCheck: () => boolean = () => false;

/**
 * 安装 window-all-closed 处理器（原 `qA`）。幂等性依赖 Electron 的
 * 事件去重语义之外无保证——主流程只调用一次。
 */
export function installWindowAllClosedHandler(): void {
  app.on(`window-all-closed`, () => {
    process.platform !== `win32` &&
      ((process.platform === `darwin` && app.isPackaged) ||
        (process.platform === `linux` && customKeepRunningCheck()) ||
        app.quit());
  });
}

/** 覆盖 linux 下的自定义检查（原 `JA`）。 */
export function setWindowAllClosedCustomCheck(check: () => boolean): void {
  customKeepRunningCheck = check;
}
