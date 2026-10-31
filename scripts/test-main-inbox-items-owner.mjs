import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/automations/inbox-items.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
const calls = [];
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)((specifier) => {
  if (specifier === "@chunk/shared") return {
    Zr: (_id, _identity, isCurrent) => ({ isCurrent, apply: (...args) => (calls.push(["apply", ...args]), true) }),
    w: (items) => items,
    x: (...args) => (calls.push(["read", ...args]), true),
    b: () => 2,
    fu: { CHANGED: "inbox-items-changed" },
  };
  if (specifier === "../markdown/marked-extensions") return {
    extractInboxItems: () => [{ id: "item-1", title: "Title", description: "Summary" }],
  };
  throw new Error(`unexpected require ${specifier}`);
}, module, module.exports);

const events = [];
const facade = new module.exports.InboxItemsFacade({ inboxItemsChanged: (event) => events.push(event) });
equal(facade.persistAndNotify([{ id: "one" }]), 1);
facade.markRead("one", 123);
facade.markUnread("one");
facade.markAllAutomationRunsRead("thread-1");
equal(events, ["inbox-items-changed", "inbox-items-changed", "inbox-items-changed", "inbox-items-changed"]);
equal(calls.filter(([kind]) => kind === "read"), [["read", "one", 123], ["read", "one", null]]);

let listener;
const manager = {
  getHostId: () => "local",
  constructor: { addTurnStartRequestedListener: (_manager, value) => (listener = value, () => {}) },
};
const globalState = { get: () => "installation-1" };
const dispose = facade.bindTurnCompletions({
  manager, connection: { isLocal: true, hostId: "local" },
  context: { identity: { kind: "chatgpt", accountId: "account", userId: "user" } },
  globalState, assertCurrent() {},
});
equal(typeof dispose, "function");
const observer = listener({ conversationId: "thread-1", hostId: "local", isCurrent: () => true });
equal(observer.onAccepted(), true);
observer.onCompleted({ conversationId: "thread-1", lastAgentMessage: "message" });
equal(calls.at(-1), ["apply", "Title", "Summary"]);
equal(events.at(-1), "inbox-items-changed");

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("new InboxItemsFacade({"), true);
equal(main.includes("registerPushNotifications({ appServerClient: le, desktopApiOptions: de })"), true);
equal(main.includes("deregisterPushNotifications({ deregistrationToken: e, desktopApiOptions: de })"), true);
for (const generatedName of ["cwe", "lwe", "fwe", "ow", "pwe", "mwe", "sw", "gwe", "cw", "_we", "lw", "ywe", "uw", "bwe", "Cwe", "wwe"])
  equal(main.includes(`function ${generatedName}(`), false);
equal(main.includes("var xwe = class"), false);

console.log(`${assertions} main inbox items owner assertions passed`);
