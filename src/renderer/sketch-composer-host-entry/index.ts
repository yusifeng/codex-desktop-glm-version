// sketch-composer-host-entry —— Sketch composer host 公开入口。
//
// 原版：app/webview/assets/composer-host-f4bf944e323d.js（195B）。

import "@rchunk/app-shared";
import {
  n as SketchDiscardDialog,
  r as initializeSketchComposerHost,
  t as SketchComposerHost,
} from "@rchunk/sketch-composer-host-core";

initializeSketchComposerHost();

export { SketchDiscardDialog, SketchComposerHost };
