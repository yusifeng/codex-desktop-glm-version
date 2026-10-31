import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-lifecycle-debug-events.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false,
});
const { createBrowserLifecycleDebugEvents } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
const events = [];
const warnings = [];
const runtime = createBrowserLifecycleDebugEvents({
  createLogger: (name) => () => ({ warning: (message, fields) => warnings.push({ name, message, fields }) }),
  makePageKey: (ownerId, conversationId, browserTabId) => `${ownerId}:${conversationId}:${browserTabId}`,
});
const registry = { recordDebugEvent: (event) => events.push(event) };
const windowState = { owner: { id: 7 }, window: { id: 8 } };
const threadState = { browserStorageId: "storage", browserTabId: "tab", conversationId: "conversation", page: { view: { webContents: { id: 9 } } } };

runtime.recordMissingPageAttach(registry, windowState, threadState, 10);
equal(events[0].kind, "browser-runtime-attach-missing-page");
equal(events[0].guestWebContentsId, 10);
equal(events[0].pageKey, null);
equal(warnings[0].name, "browser-sidebar-manager");
equal(warnings[0].fields.safe.ownerWebContentsId, 7);

runtime.recordThreadDebugEvent(registry, windowState, threadState, "restore", "Restored", [{ label: "extra", value: "yes" }]);
equal(events[1].guestWebContentsId, 9);
equal(events[1].pageKey, "7:conversation:tab");
equal(events[1].details, [{ label: "browserStorageId", value: "storage" }, { label: "extra", value: "yes" }]);
threadState.page = null;
runtime.recordThreadDebugEvent(registry, windowState, threadState, "cold", "Cold");
equal(events[2].guestWebContentsId, null);
equal(events[2].pageKey, null);

runtime.recordAttachedPageDebugEvent(registry, windowState, threadState, 11, "attached", "Attached");
equal(events[3].guestWebContentsId, 11);
equal(events[3].pageKey, "7:conversation:tab", "attached events retain a page key before local page state exists");
equal(events[3].ownerWebContentsId, 7);
equal(events[3].windowId, 8);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-lifecycle-debug-events.js")'), true);
for (const oldOwner of ["function TXe(", "function NX(", "function EXe(", "function PX("]) equal(main.includes(oldOwner), false);
console.log(`${assertions} main browser lifecycle debug event assertions passed`);
