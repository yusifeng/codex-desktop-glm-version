import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { z } from "zod";
import { createNotificationsServiceClass } from "../src/main/main-app/notifications/notifications-service.ts";

const processes = [];
const managerCalls = [];
const origin = new EventEmitter();
origin.webContents = origin;
const window = { webContents: { id: 1 }, isDestroyed: () => false, isMinimized: () => false, show: () => managerCalls.push("show-window"), focus: () => managerCalls.push("focus"), setAlwaysOnTop: () => {} };
const Service = createNotificationsServiceClass({
  runtime: { Uf: class {}, df: (values) => z.enum(values), if: () => z.coerce.number(), wf: (shape) => z.object(shape), Na: { sound: { schema: { safeParse: (value) => ({ success: ["none", "default", "classic"].includes(value), data: value }) } } } },
  promisify: (fn) => fn, execFile: async () => ({ stdout: "" }),
  spawnProcess: (command, args) => { const child = new EventEmitter(); child.kill = () => child.emit("close", null, "SIGTERM"); processes.push([command, args, child]); queueMicrotask(() => child.emit("close", 0, null)); return child; },
  platform: "linux", resolveSoundCommand: (sound) => ({ command: "play", args: [sound] }), resolveMacBuiltinSound: () => "", getCustomSoundDirectory: () => "",
  path: {}, homeDirectory: () => "/home", fs: {}, createHash: () => {},
  electron: { BrowserWindow: { fromWebContents: () => window }, dialog: {} },
  createLogger: () => () => ({ info: () => {}, warning: () => {} }),
  createUsingScope: () => ({ u: (value) => value, d: () => {} }),
});
let action;
let dismissed = 0;
const desktop = {
  showNotification: (notification, source, onAction, onClose) => { managerCalls.push([notification, source]); action = onAction; desktop.onClose = onClose; },
  dismissByConversationId: () => { dismissed += 1; }, dismissByNavigationPath: () => { dismissed += 1; }, dismissByNotificationId: () => { dismissed += 1; },
};
const service = new Service({ getPrimaryWindow: () => window }, origin, desktop);
assert.equal(await service.previewSound("none"), true);
assert.equal(await service.previewSound("invalid"), false);
assert.equal(await service.previewSound("default"), true);
assert.deepEqual(processes[0].slice(0, 2), ["play", ["default"]]);
assert.deepEqual(await service.importSound({ title: "Import" }), { status: "error" });
const actions = [];
const callback = (event) => actions.push(event); callback.dup = () => callback; callback[Symbol.dispose] = () => actions.push("disposed");
service.show({ id: "notification", kind: "turn" }, { dup: () => callback });
assert.equal(managerCalls.length >= 1, true);
assert.equal(action({ actionType: "open", actionId: "view", notificationId: "notification" }), window.webContents);
assert.deepEqual(actions[0], { id: "view", type: "open", reply: null });
service.hide({ notificationId: null, conversationId: "thread", navigationPath: "/tasks" });
service.hide({ notificationId: "notification" });
assert.equal(dismissed, 3);
desktop.onClose();
assert.equal(actions.at(-1), "disposed");
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.match(main, /Xet = createNotificationsServiceClass\(\{/); assert.doesNotMatch(main, /Xet = class/); assert.match(main, /notifications: new Xet\(/);
console.log("notifications service assertions: 16");
