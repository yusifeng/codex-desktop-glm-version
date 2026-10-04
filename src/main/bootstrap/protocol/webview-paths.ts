import { join } from "node:path";

const INDEX_ENTRY = "index.html";

export function getWebviewDir(root: string): string {
  return join(root, "..", "..", "webview");
}

export function getWebviewEntryPath(moduleDir: string): string {
  return join(getWebviewDir(moduleDir), INDEX_ENTRY);
}

if (typeof module !== "undefined") module.exports = { getWebviewDir, getWebviewEntryPath };
