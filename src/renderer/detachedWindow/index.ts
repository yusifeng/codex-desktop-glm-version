// detachedWindow 入口 —— 分离窗口的第二 HTML 入口。
//
// 原版：app/webview/assets/detachedWindow-1eedcac94c8e.js（1.1KB）。
// modulepreload polyfill → app-shared 初始化 → 动态 import entry →
// initializeDetachedWindow() → pagehide Symbol.dispose；失败 window.close()。

import { H3 as preloadHelper, V3 as preloadDeps, W3 as appSharedInit } from "@rchunk/app-shared";
import { t as modulePreload } from "@rchunk/modulepreload-polyfill";
import { n as rolldownInit } from "@rchunk/rolldown-runtime";
import { initializeDetachedWindow } from "@rchunk/detached-entry";

void preloadHelper; void preloadDeps; void appSharedInit;
void modulePreload; void rolldownInit;

async function startDetachedWindow(): Promise<void> {
  appSharedInit();
  preloadHelper();
  try {
    const dispose = await initializeDetachedWindow();
    window.addEventListener("pagehide", () => dispose[Symbol.dispose](), { once: true });
  } catch {
    window.close();
  }
}

void startDetachedWindow();
