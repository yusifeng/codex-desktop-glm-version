import assert from "node:assert/strict";
import fs from "node:fs";
import { createQuitStateClass } from "../src/main/main-app/startup/quit-state.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const timers = [];
const cleared = [];
const QuitState = createQuitStateClass({
  setTimeoutImpl(callback, delay) {
    const timer = {
      callback,
      delay,
      unrefCalls: 0,
      unref() { this.unrefCalls += 1; },
    };
    timers.push(timer);
    return timer;
  },
  clearTimeoutImpl(timer) { cleared.push(timer); },
});

const state = new QuitState();
equal(state.canQuitWithoutPrompt(), false);
equal(state.shouldSkipDrainBeforeQuit(), false);

state.allowQuitTemporarily();
equal(state.canQuitWithoutPrompt(), true);
equal(state.shouldSkipDrainBeforeQuit(), false);
equal(timers.length, 1);
equal(timers[0].delay, 60_000);
equal(timers[0].unrefCalls, 1);

state.allowQuitTemporarily({ allowWithoutPrompt: false, skipDrainBeforeQuit: true });
equal(cleared, [timers[0]]);
equal(state.canQuitWithoutPrompt(), false);
equal(state.shouldSkipDrainBeforeQuit(), true);
equal(timers[1].unrefCalls, 1);

state.markQuitApproved();
equal(state.canQuitWithoutPrompt(), true);
equal(state.shouldSkipDrainBeforeQuit(), true);
timers[1].callback();
equal(state.canQuitWithoutPrompt(), false);
equal(state.shouldSkipDrainBeforeQuit(), false);
equal(state.allowQuitResetTimer, null);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("yit = createQuitStateClass()"), true);
equal(main.includes("new yit()"), true);
equal(main.includes("var yit = class"), false);
equal(main.includes("allowQuitResetTimer = null"), false);

console.log(`${assertions} main quit-state assertions passed`);
