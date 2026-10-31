import assert from "node:assert/strict";
import fs from "node:fs";
import { createPetHotkeyManager } from "../src/main/main-app/hotkey/pet-hotkey-manager.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const flush = () => new Promise((resolve) => setImmediate(resolve));

function createHarness(overrides = {}) {
  const events = [];
  const logs = [];
  const registrations = [];
  let accessListener;
  let accessState = {
    status: "ready",
    codexLocalAccess: true,
    workCloudAccess: false,
    workLocalAccess: false,
  };
  const options = {
    toggleAvatarOverlay: async () => events.push("toggle"),
    resolveCommandKeybinding: (request) => {
      events.push(["resolve", request]);
      return "Command+Shift+P";
    },
    isMacOS: true,
    registerGlobalHotkey: (keybinding, handlers) => {
      const registration = {
        keybinding,
        handlers,
        unregister: () => events.push(["unregister", keybinding]),
      };
      registrations.push(registration);
      events.push(["register", keybinding]);
      return registration;
    },
    subscribeAccessState: (listener) => {
      accessListener = listener;
      return () => events.push("unsubscribe");
    },
    getAccessState: () => accessState,
    releaseCommandKeybinding: (keybinding) => events.push(["release", keybinding]),
    logger: { warning: (...args) => logs.push(args) },
    ...overrides,
  };
  const manager = createPetHotkeyManager(options);
  return {
    events,
    logs,
    manager,
    registrations,
    setAccessState(value) { accessState = value; },
    syncAccess() { accessListener(); },
  };
}

{
  const harness = createHarness();
  equal(harness.events, [
    ["resolve", { commandId: "openAvatarOverlay", isMacOS: true }],
    ["register", "Command+Shift+P"],
  ]);
  harness.syncAccess();
  equal(harness.registrations.length, 1);
  harness.registrations[0].handlers.onPressed();
  await flush();
  equal(harness.events.at(-1), "toggle");
  harness.manager.dispose();
  equal(harness.events.slice(-2), ["unsubscribe", ["unregister", "Command+Shift+P"]]);
}

{
  const harness = createHarness();
  harness.manager.syncCommandKeybinding("Alt+P");
  equal(harness.events.slice(-3), [
    ["release", "Alt+P"],
    ["register", "Alt+P"],
    ["unregister", "Command+Shift+P"],
  ]);
  equal(harness.registrations.at(-1).keybinding, "Alt+P");
  harness.manager.syncCommandKeybinding("Alt+P");
  equal(harness.registrations.length, 2);
  harness.manager.syncCommandKeybinding(null);
  equal(harness.events.at(-1), ["unregister", "Alt+P"]);
}

for (const accessState of [
  { status: "loading", codexLocalAccess: true, workCloudAccess: true, workLocalAccess: true },
  { status: "ready", codexLocalAccess: false, workCloudAccess: false, workLocalAccess: false },
]) {
  const harness = createHarness({
    getAccessState: () => accessState,
  });
  equal(harness.registrations, []);
}

{
  const harness = createHarness();
  harness.setAccessState({
    status: "ready",
    codexLocalAccess: false,
    workCloudAccess: false,
    workLocalAccess: false,
  });
  harness.syncAccess();
  equal(harness.events.at(-1), ["unregister", "Command+Shift+P"]);
  harness.registrations[0].handlers.onPressed();
  equal(harness.events.filter((event) => event === "toggle"), []);
}

{
  const failure = new Error("toggle failed");
  const harness = createHarness({ toggleAvatarOverlay: async () => { throw failure; } });
  harness.registrations[0].handlers.onPressed();
  await flush();
  equal(harness.logs, [[
    "Failed to toggle pet from global hotkey",
    { safe: {}, sensitive: { error: failure } },
  ]]);
}

{
  const harness = createHarness({ registerGlobalHotkey: () => null });
  equal(harness.logs[0][0], "Failed to register pet hotkey");
  equal(harness.logs[0][1].sensitive.error.message, "Unable to register pet hotkey: Command+Shift+P");
  harness.syncAccess();
  equal(harness.logs[1][0], "Failed to sync pet hotkey access");
  harness.manager.syncCommandKeybinding("Alt+P");
  equal(harness.logs[2][0], "Failed to sync pet hotkey");
}

{
  const harness = createHarness({ resolveCommandKeybinding: () => null });
  equal(harness.registrations, []);
  harness.manager.dispose();
  equal(harness.events, ["unsubscribe"]);
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("createPetHotkeyManager"), true);
equal(main.includes("createPetHotkeyManager({"), true);
equal(main.includes("function Fit("), false);
equal(main.includes("function C7("), false);

console.log(`${assertions} main pet-hotkey manager assertions passed`);
