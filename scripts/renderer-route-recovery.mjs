import fs from "node:fs/promises";
import path from "node:path";

export const CONVERSATION_ROUTE_ROOTS = [
  "local-conversation-page-bcc7eca0b3ab.js",
  "local-conversation-thread-c6e40fdd6d59.js",
  "local-conversation-turn-14bf296d5217.js",
  "conversation-blocks-3f59e850f9fb.js",
  "agent-activity-item-792873f87aad.js",
  "agent-activity-units-9397783428a4.js",
  "user-message-e36f9e2dfe24.js",
];

export const RECONSTRUCTED_ROUTE_CORE = new Set([
  "app-initial-51da50e6c6e3.js",
  "app-primary-d66705000d76.js",
  "app-shared-7b9edc1bfb7f.js",
  "rolldown-runtime-2d059c5e81f4.js",
]);

const STATIC_IMPORT_RE = /(?:from\s*|import\s*)(?:\(\s*)?["']\.\/([^"']+\.js)["']/g;

export async function collectConversationRouteClosure(assetDirectory) {
  const recovered = new Set();
  const pending = [...CONVERSATION_ROUTE_ROOTS];
  while (pending.length > 0) {
    const name = pending.pop();
    if (recovered.has(name) || RECONSTRUCTED_ROUTE_CORE.has(name)) continue;
    const code = await fs.readFile(path.join(assetDirectory, name), "utf8");
    recovered.add(name);
    for (const match of code.matchAll(STATIC_IMPORT_RE)) pending.push(match[1]);
  }
  return recovered;
}
