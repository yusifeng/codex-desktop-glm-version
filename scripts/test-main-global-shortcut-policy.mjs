import assert from "node:assert/strict";
import { validateGlobalShortcut } from "../app/.vite/build/main-app/hotkey/global-shortcut-policy.js";

const isBareModifierAccelerator = (value, platform) => platform === "darwin" && value.toLowerCase() === "fn";
const isBareOrUnsupported = (value) => value.toLowerCase() === "shift";
const deps = { isBareModifierAccelerator, isBareOrUnsupported };
let assertions = 0;
const check = (actual, expected) => { assert.equal(actual, expected); assertions += 1; };
check(validateGlobalShortcut("", "win32", deps), "Shortcut cannot be empty.");
check(validateGlobalShortcut("Ctrl+K", "win32", deps), null);
check(validateGlobalShortcut("K", "win32", deps), "Shortcut must include Cmd/Ctrl or Alt.");
check(validateGlobalShortcut("Ctrl+K+L", "win32", deps), "Shortcut must include exactly one non-modifier key.");
check(validateGlobalShortcut("Shift", "win32", deps), "Choose a shortcut with Ctrl or Alt plus another key.");
check(validateGlobalShortcut("Fn", "darwin", deps), null);
console.log(`main global shortcut policy assertions passed (${assertions})`);
