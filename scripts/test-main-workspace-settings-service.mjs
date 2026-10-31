import assert from "node:assert/strict";
import fs from "node:fs";
import { createThirdPartyNoticesReader, createWorkspaceSettingsServiceClass, resolveSystemBackdropSupport } from "../src/main/main-app/settings/workspace-settings-service.ts";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const rejects = async (promise, pattern) => { await assert.rejects(promise, pattern); assertions += 1; };
class DisposableBase {}
const definitions = [
  { key: "detail", agentAccess: "read-only" },
  { key: "link", agentAccess: "read-only" },
  { key: "writable", agentAccess: "read-write" },
];
const WorkspaceSettingsService = createWorkspaceSettingsServiceClass({
  DisposableBase,
  agentReadableSettings: definitions,
  conversationDetailModeKey: "detail",
  createUsingScope: () => ({ u: (value) => value, d() {} }),
  getDefaultLinkTarget: (store) => store.get("link") ?? "feature-default",
  normalizeSettingValue: (key, value) => `${key}:${value}`,
  openLinkTargetPreferenceKey: "link",
  parseWorkModeAccess: (value) => {
    if (value?.policy == null) throw new Error("invalid access");
    return value;
  },
  settingDefinitionFor: (name) => definitions.find(({ key }) => key === name),
  settingKeys: definitions,
});

const values = new Map([["writable", "initial"]]);
const listeners = new Map();
let flushes = 0;
const store = {
  get: (key) => values.get(key),
  getEffective: (key) => `effective:${key}`,
  getStateFilePath: () => "/settings.json",
  set: (key, value) => values.set(key, value),
  flush: async () => { flushes += 1; },
  onDidChange(key, listener) {
    listeners.set(key, listener);
    return () => listeners.delete(key);
  },
};
const statsigListeners = new Set();
const statsig = {
  identity: { accountId: "account", userId: "user" },
  readExecutionAssignments: async function () { return { identity: this.identity }; },
  onDidChange(listener) { statsigListeners.add(listener); return () => statsigListeners.delete(listener); },
};
const writes = [];
const settings = new WorkspaceSettingsService(store, (key, value) => writes.push([key, value]), statsig);
equal(settings.keys(), ["detail", "link", "writable"]);
equal(settings.settingsFilePath(), "/settings.json");
equal(await settings.getEffective("link"), "link:feature-default");
await settings.publish({ accountId: "account", userId: "user", authMethod: null, stableId: null, policy: "coding" });
equal(await settings.getEffective("detail"), "detail:STEPS_COMMANDS");
equal(await settings.getEffective("detail", { accountId: "other", userId: "user" }), undefined);
await settings.publish({ accountId: "account", userId: "user", authMethod: null, stableId: null, policy: "everyday" });
equal(settings.workModeAccessByAccount.length, 1);
equal(await settings.getEffective("detail"), "detail:STEPS_PROSE");
await rejects(settings.publish({}), /invalid access/);

equal(await settings.readAll(), {
  values: { detail: "detail:STEPS_PROSE", link: "link:feature-default", writable: "effective:writable" },
  configuredValues: { detail: undefined, link: undefined, writable: "initial" },
});
equal(await settings.writeForAgent({ writable: "next" }), {
  settings: { writable: "writable:next" },
  effectiveSettings: { detail: "detail:STEPS_PROSE", link: "link:feature-default", writable: "effective:writable" },
});
equal(writes, [["writable", "writable:next"]]);
equal(flushes, 1);
await rejects(settings.writeForAgent({ detail: "x" }), /cannot be written by Codex/);
await rejects(settings.writeForAgent({ missing: "x" }), /Unknown setting/);

const streamPayloads = [];
let streamDisposed = 0;
const stream = Object.assign(
  (value) => { streamPayloads.push(value); return Promise.resolve(); },
  { dup() { return this; }, onRpcBroken(handler) { this.broken = handler; }, [Symbol.dispose]() { streamDisposed += 1; } },
);
const subscription = await settings.subscribe("writable", stream);
equal(streamPayloads.at(-1), { configured: "writable:next", effective: "effective:writable" });
values.set("writable", "changed");
listeners.get("writable")();
await new Promise((resolve) => setImmediate(resolve));
equal(streamPayloads.at(-1), { configured: "changed", effective: "effective:writable" });
subscription.unsubscribe();
equal(streamDisposed, 1);

const confirmationPayloads = [];
const confirmationStream = Object.assign(
  (value) => { confirmationPayloads.push(value); return Promise.resolve(); },
  { dup() { return this; }, onRpcBroken(handler) { this.broken = handler; }, [Symbol.dispose]() {} },
);
await settings.configWriteConfirmations.subscribe({ hostId: "h", threadId: "t" }, confirmationStream);
equal(confirmationPayloads, [null]);
const controller = new AbortController();
const request = { key: { hostId: "h", threadId: "t", turnId: "turn", callId: "call" } };
const pending = settings.configWriteConfirmations.request(request, controller.signal);
equal(confirmationPayloads.at(-1), request);
equal(await settings.configWriteConfirmations.request(request, controller.signal), false);
equal(await settings.configWriteConfirmations.answer({ hostId: "h", threadId: "t", turnId: "wrong", callId: "call" }, true), false);
equal(await settings.configWriteConfirmations.answer({ hostId: "h", threadId: "t", turnId: "turn", callId: "call" }, true), true);
equal(await pending, true);
equal(confirmationPayloads.at(-1), null);

const files = new Map([["/resources/THIRD_PARTY_NOTICES.txt", "notice"]]);
const readThirdPartyNotices = createThirdPartyNoticesReader({
  cwd: () => "/repo/app",
  dirname: (value) => value.slice(0, value.lastIndexOf("/")) || "/",
  execFile: async () => assert.fail("unexpected regeneration"),
  existsSync: (value) => files.has(value),
  join: (...parts) => parts.join("/").replaceAll("//", "/"),
  mkdir: async () => {},
  nodeEnv: "production",
  readFile: async (value) => files.get(value),
  resolveNodeExecutable: () => null,
  resourcesPath: "/resources",
  sanitizeEnvironment: (env) => env,
});
equal(await readThirdPartyNotices(), "notice");
equal(resolveSystemBackdropSupport({ platform: "win32", gpuFeatureStatus: () => ({ gpu_compositing: "disabled" }), isSupported: () => assert.fail("must short circuit") }), false);
equal(resolveSystemBackdropSupport({ platform: "darwin", gpuFeatureStatus: () => ({}), isSupported: () => true }), true);

settings.dispose();
equal(settings.workModeAccessByAccount, []);
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const text of ["createWorkspaceSettingsServiceClass({", "createThirdPartyNoticesReader({", "resolveSystemBackdropSupport({"]) equal(main.includes(text), true);
for (const text of ["var CBe = class", "var xBe = class", "sBe = class", "function DBe()", "function zH("]) equal(main.includes(text), false);

console.log(`${assertions} main workspace settings service assertions passed`);
