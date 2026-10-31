import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: [
    new URL("../src/main/main-app/app-server/web-contents-host-client.ts", import.meta.url).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  logLevel: "silent",
  write: false,
});
const { WebContentsHostClient } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

const webContents = new EventEmitter();
webContents.id = 17;
webContents.backgroundThrottling = true;
webContents.destroyed = false;
webContents.getBackgroundThrottling = () => webContents.backgroundThrottling;
webContents.isDestroyed = () => webContents.destroyed;
const browserWindow = new EventEmitter();
browserWindow.focused = true;
browserWindow.isFocused = () => browserWindow.focused;
const sent = [];
const sender = {
  send: (...args) => sent.push(["send", ...args]),
  sendCritical: (...args) => sent.push(["critical", ...args]),
};
const client = new WebContentsHostClient(
  webContents,
  sender,
  browserWindow,
  (hostId, threadId) => hostId === "local" && threadId === "owned",
);

assert.equal(client.id, 17);
assert.equal(client.isDestroyed(), false);
assert.equal(client.isFocused(), true);
client.send("channel", { type: "unrelated" });
assert.equal(sent.length, 0);
client.send("channel", { type: "mcp-notification", hostId: "local", params: { threadId: "other" } });
assert.equal(sent.length, 0);
client.send("channel", { type: "mcp-notification", hostId: "local", params: { threadId: "owned" } });
assert.equal(sent.length, 1);
client.send("channel", { type: "mcp-request", hostId: "local", request: { params: { threadId: "owned" } } });
assert.equal(sent.length, 2);
client.send("channel", { type: "mcp-request", hostId: "local", request: {} });
assert.equal(sent.length, 2);
for (const type of [
  "mcp-response",
  "codex-app-server-initialized",
  "codex-app-server-connection-changed",
]) client.send("channel", { type });
assert.equal(sent.length, 5);
webContents.backgroundThrottling = false;
client.send("channel", { type: "unrelated" });
assert.equal(sent.length, 6);
client.sendCritical("critical-channel", { value: 1 });
assert.equal(sent.at(-1)[0], "critical");

const destroyed = [];
const firstDestroyed = client.onDestroyed(() => destroyed.push("first"));
client.onDestroyed(() => destroyed.push("second"));
assert.equal(webContents.listenerCount("destroyed"), 1);
firstDestroyed.dispose();
webContents.emit("destroyed");
assert.deepEqual(destroyed, ["second"]);
assert.equal(client.destroyedListeners.size, 0);

const focusChanges = [];
const firstFocus = client.onFocusChanged((focused) => focusChanges.push(["first", focused]));
const secondFocus = client.onFocusChanged((focused) => focusChanges.push(["second", focused]));
assert.equal(browserWindow.listenerCount("focus"), 1);
assert.equal(browserWindow.listenerCount("blur"), 1);
browserWindow.emit("blur");
firstFocus.dispose();
browserWindow.emit("focus");
assert.deepEqual(focusChanges, [
  ["first", false],
  ["second", false],
  ["second", true],
]);
secondFocus.dispose();
assert.equal(browserWindow.listenerCount("focus"), 0);
assert.equal(browserWindow.listenerCount("blur"), 0);

const windowless = new WebContentsHostClient(webContents, sender);
assert.equal(windowless.isFocused(), false);
windowless.onFocusChanged(() => {}).dispose();

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
assert.match(
  main,
  /const \{ WebContentsHostClient \} = require\("\.\/main-app\/app-server\/web-contents-host-client\.js"\)/,
);
assert.match(main, /kZ = WebContentsHostClient/);
assert.doesNotMatch(main, /kZ = class/);

console.log("web contents host client assertions: 26");
