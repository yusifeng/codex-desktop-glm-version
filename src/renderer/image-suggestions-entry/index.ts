// image-suggestions-entry —— 图像建议公开入口。
//
// 原版：app/webview/assets/suggestions-c9112ed2bf9b.js（152B）。
// app-shared 的副作用初始化完成后，把 image-suggestions-core 的压缩导出 `t`
// 以公开名 `ImageSuggestions` 转发。

import "@rchunk/app-shared";
import { t as ImageSuggestions } from "@rchunk/image-suggestions-core";

export { ImageSuggestions };
