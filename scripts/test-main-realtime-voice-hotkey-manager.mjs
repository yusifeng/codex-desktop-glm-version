import assert from "node:assert/strict";
import fs from "node:fs";
import { createRealtimeVoiceHotkeyManager } from "../src/main/main-app/realtime/voice-hotkey-manager.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function createHarness({ initialHotkey = "Ctrl+V", registrationFails = false, toggleRejects = false } = {}) {
  const cleared = [];
  const intervals = [];
  const logs = [];
  const permissions = [];
  const registrations = [];
  let idleState = "active";
  let reservationCallback;
  let unsubscribeCalls = 0;
  let toggleCalls = 0;
  const initialize = createRealtimeVoiceHotkeyManager({
    getCommandBinding: () => ({ hotkey: initialHotkey }),
    registerGlobalHotkey(hotkey, handlers) {
      if (registrationFails) return null;
      const registration = {
        hotkey,
        handlers,
        unregisterCalls: 0,
        unregister() { this.unregisterCalls += 1; },
      };
      registrations.push(registration);
      return registration;
    },
    ensureHotkeyPermissions: (hotkey) => permissions.push(hotkey),
    powerMonitor: { getSystemIdleState: () => idleState },
    logger: { n: () => ({ warning: (message, details) => logs.push({ message, details }) }) },
    setIntervalImpl(callback, delay) {
      const timer = { callback, delay, unrefCalls: 0, unref() { this.unrefCalls += 1; } };
      intervals.push(timer);
      return timer;
    },
    clearIntervalImpl: (timer) => cleared.push(timer),
  });
  const manager = initialize({
    requestRealtimeToggle() {
      toggleCalls += 1;
      return toggleRejects ? Promise.reject(new Error("toggle failed")) : Promise.resolve();
    },
    subscribeRealtimeVoiceSessionReservation(callback) {
      reservationCallback = callback;
      return () => { unsubscribeCalls += 1; };
    },
  });
  return {
    cleared,
    intervals,
    logs,
    manager,
    permissions,
    registrations,
    reserve: (active) => reservationCallback(active),
    setIdleState: (state) => { idleState = state; },
    get toggleCalls() { return toggleCalls; },
    get unsubscribeCalls() { return unsubscribeCalls; },
  };
}

{
  const harness = createHarness();
  equal(harness.registrations.length, 1);
  equal(harness.registrations[0].hotkey, "Ctrl+V");
  harness.registrations[0].handlers.onPressed();
  equal(harness.toggleCalls, 1);
  harness.setIdleState("locked");
  harness.registrations[0].handlers.onPressed();
  equal(harness.toggleCalls, 1);

  harness.reserve(true);
  equal(harness.intervals.length, 1);
  equal(harness.intervals[0].delay, 250);
  equal(harness.intervals[0].unrefCalls, 1);
  harness.reserve(true);
  equal(harness.intervals.length, 1);
  harness.intervals[0].callback();
  equal(harness.toggleCalls, 2);
  harness.setIdleState("active");
  harness.intervals[0].callback();
  equal(harness.toggleCalls, 2);

  harness.manager.syncCommandKeybinding("Ctrl+V");
  equal(harness.permissions, []);
  equal(harness.registrations.length, 1);
  harness.manager.syncCommandKeybinding("Ctrl+Shift+V");
  equal(harness.permissions, ["Ctrl+Shift+V"]);
  equal(harness.registrations.length, 2);
  equal(harness.registrations[0].unregisterCalls, 1);
  equal(harness.registrations[1].hotkey, "Ctrl+Shift+V");
  harness.manager.syncCommandKeybinding(null);
  equal(harness.registrations[1].unregisterCalls, 1);

  harness.manager.dispose();
  equal(harness.unsubscribeCalls, 1);
  equal(harness.cleared, [harness.intervals[0]]);
}

{
  const harness = createHarness({ initialHotkey: null });
  equal(harness.registrations, []);
  harness.reserve(true);
  harness.reserve(false);
  equal(harness.cleared, [harness.intervals[0]]);
}

{
  const harness = createHarness({ registrationFails: true });
  equal(harness.logs[0].message, "Failed to apply realtime voice hotkey");
  equal(harness.logs[0].details.sensitive.error.message, "Unable to register voice chat hotkey: Ctrl+V");
  harness.manager.syncCommandKeybinding("Alt+V");
  equal(harness.logs[1].message, "Failed to sync realtime voice hotkey");
  equal(harness.permissions, ["Alt+V"]);
}

{
  const harness = createHarness({ toggleRejects: true });
  harness.registrations[0].handlers.onPressed();
  await new Promise(setImmediate);
  equal(harness.logs.length, 1);
  equal(harness.logs[0].message, "Failed to toggle realtime voice hotkey");
  equal(harness.logs[0].details.sensitive.error.message, "toggle failed");
}

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("jat = createRealtimeVoiceHotkeyManager({"), true);
equal(main.includes("ae = jat({"), true);
equal(main.includes("function jat("), false);
equal(main.includes("Aat = 250"), false);

console.log(`${assertions} main realtime-voice hotkey manager assertions passed`);
