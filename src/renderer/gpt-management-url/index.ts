// gpt-management-url —— 将 GPT 管理相对路径规范化为 chatgpt.com 绝对地址。
// 原版：app/webview/assets/gpt-management-url-e06e14b9dc20.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;
function toGptManagementUrl(path: string): string {
  return new URL(path, "https://chatgpt.com").href;
}
function initializeGptManagementUrl(): void {}
export { initializeGptManagementUrl as n, toGptManagementUrl as t };
