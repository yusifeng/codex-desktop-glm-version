import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import * as acorn from "acorn";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL("../src/main/main-app/notifications/native-notification-manager.ts", import.meta.url),
  "utf8",
);
const runtimeOutput = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const runtimeModule = { exports: {} };
Function("module", "exports", runtimeOutput.code)(runtimeModule, runtimeModule.exports);
const { createNativeNotificationManagerClass, createNotificationSoundHelpers } = runtimeModule.exports;

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
let classNode;
const visit = (node) => {
  if (node == null || typeof node !== "object") return;
  if (node.type === "ClassExpression" && node.id?.name === "NativeNotificationManager") classNode = node;
  for (const value of Object.values(node)) Array.isArray(value) ? value.forEach(visit) : visit(value);
};
visit(ast);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 17);

const logs = [];
const created = [];
const completedSnapshots = [];
const entrySources = [];
const dependencies = {
  createLogger: () => ({
    info: (...args) => logs.push(["info", ...args]),
    warning: (...args) => logs.push(["warning", ...args]),
  }),
  electron: { app: { getAppPath: () => "/app" }, Notification: { isSupported: () => true } },
  fs: { existsSync: () => false, constants: { COPYFILE_EXCL: 1 } },
  fsPromises: {},
  os: { homedir: () => "/home/test" },
  path,
  process: {},
  sanitizeText: (value) => value.trim(),
  spawn: () => new EventEmitter(),
};
const NativeNotificationManager = createNativeNotificationManagerClass(dependencies);
const createNotification = (options) => {
  const native = new EventEmitter();
  native.options = options;
  native.shown = 0;
  native.closed = 0;
  native.show = () => { native.shown += 1; };
  native.close = () => { native.closed += 1; };
  created.push(native);
  return native;
};
const manager = new NativeNotificationManager({
  platform: "darwin",
  createNotification,
  getSound: () => "none",
  onCompletedThreadsChanged: (threads) => completedSnapshots.push(threads),
  onAppEntrySource: (...args) => entrySources.push(args),
});
const actions = [];
let removed = 0;
const target = { isDestroyed: () => false };
manager.showNotification(
  {
    id: "notification-1",
    kind: "turn-complete",
    title: "Done",
    body: " body ",
    navigationPath: "/thread/1",
    replyPlaceholder: "Reply",
    deduplicate: true,
    actions: [
      { id: "open", title: "Open", actionType: "open" },
      { id: "archive", title: "Archive", actionType: "archive" },
    ],
  },
  target,
  (action) => {
    actions.push(action);
    return "/destination";
  },
  () => { removed += 1; },
);
equal(created[0].options.body, "body");
equal(created[0].options.hasReply, true);
equal(created[0].options.actions.length, 2);
equal(created[0].shown, 1);
equal(completedSnapshots.at(-1), [
  { title: "Done", path: "/thread/1", projectLabel: "", isProjectless: false },
]);
created[0].emit("click");
created[0].emit("action", {}, 1);
created[0].emit("reply", {}, { text: "structured" });
equal(actions, [
  { notificationId: "notification-1", actionId: null, actionType: "open" },
  { notificationId: "notification-1", actionId: "archive", actionType: "archive" },
  { notificationId: "notification-1", actionId: null, actionType: "reply", reply: '{"text":"structured"}' },
]);
equal(entrySources, [
  [{ channel: "push_notification", source: "native_notification" }, "/destination"],
]);

manager.showNotification(
  { id: "notification-1", kind: "turn-complete", title: "Duplicate", body: "ignored", deduplicate: true },
  target,
  () => {},
  () => { removed += 1; },
);
equal(created.length, 1);
equal(removed, 1);
manager.dismissByNavigationPath("/thread/1");
equal(created[0].closed, 1);
equal(removed, 2);
equal(manager.notifications.size, 0);
equal(completedSnapshots.at(-1), []);

const unsupported = new NativeNotificationManager({
  platform: "linux",
  isSupported: () => false,
  createNotification,
});
unsupported.showNotification({ id: "nope" }, target, () => {}, () => { removed += 1; });
equal(removed, 3);
equal(logs.some((entry) => entry[1] === "Notification API not supported on this host"), true);

const helpers = createNotificationSoundHelpers({
  electron: dependencies.electron,
  fs: dependencies.fs,
  os: dependencies.os,
  path,
  process: {},
});
equal(helpers.resolveMacBuiltinSound("classic"), "/app/assets/sounds/codex-classic.wav");
equal(helpers.resolveSoundCommand("default", "linux"), {
  command: "/usr/bin/canberra-gtk-play",
  args: ["-f", "/app/assets/sounds/codex-notification.wav"],
});
equal(
  helpers.getCustomSoundDirectory("/home/test"),
  "/home/test/Library/Group Containers/2DC432GLL2.com.openai.codex.notifications/Library/Sounds",
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("bhe = createNativeNotificationManagerClass({"), true);
equal(main.includes("createNotificationSoundHelpers({"), true);
equal(main.includes("var bhe = class"), false);

console.log(`${assertions} main native notification manager owner assertions passed`);
