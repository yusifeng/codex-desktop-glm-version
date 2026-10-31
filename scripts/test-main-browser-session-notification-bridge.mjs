import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({ entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-session-notification-bridge.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "node", target: "node22", write: false });
const { installBrowserSessionNotificationBridge } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
let handler;
const calls = [];
installBrowserSessionNotificationBridge({
  source: { registerInternalNotificationHandler(value) { handler = value; } },
  onMcpToolCallCompleted: (...args) => calls.push(["completed", ...args]),
  browserSessionRegistry: {
    disposeConversation: (...args) => calls.push(["dispose", ...args]),
    endSessionActivity: (...args) => calls.push(["idle", ...args]),
  },
});
equal(typeof handler, "function");
handler({ method: "item/completed", params: { threadId: "thread-1", item: { type: "mcpToolCall", id: "call-1", extra: true } } });
equal(calls.at(-1), ["completed", "thread-1", "call-1"]);
handler({ method: "item/completed", params: { threadId: "thread-1", item: { type: "message", id: "call-1" } } });
equal(calls.length, 1);
handler({ method: "item/completed", params: { threadId: 4, item: { type: "mcpToolCall", id: "call-1" } } });
equal(calls.length, 1);
handler({ method: "thread/archived", params: { threadId: "thread-2" } });
equal(calls.at(-1), ["dispose", "thread-2"]);
handler({ method: "thread/archived", params: { threadId: null } });
equal(calls.length, 2);
handler({ method: "thread/status/changed", params: { threadId: "thread-3", status: { type: "idle" } } });
equal(calls.at(-1), ["idle", { conversationId: "thread-3" }]);
handler({ method: "thread/status/changed", params: { threadId: "thread-3", status: { type: "active" } } });
handler({ method: "unknown", params: {} });
equal(calls.length, 3);
installBrowserSessionNotificationBridge({ source: null, browserSessionRegistry: {}, onMcpToolCallCompleted() {} });
equal(calls.length, 3);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-session-notification-bridge.js")'), true);
for (const oldOwner of ["function wZe(", "function TZe(", "function EZe(", "function DZe("]) equal(main.includes(oldOwner), false);
equal(main.includes("wZe({"), true);
console.log(`${assertions} main browser session notification bridge assertions passed`);
