#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { applyQuitForUpdatePolicy } = require("../app/.vite/build/main-app/startup/quit-for-update-policy.js");
const events = [];
applyQuitForUpdatePolicy({ exitImmediately: true, exitImmediatelyForUpdateInstall: () => events.push("exit"), quitForUpdateInstall: () => events.push("quit"), allowQuitTemporarily: () => events.push("allow") });
assert.deepEqual(events, ["exit"]);
events.length = 0;
applyQuitForUpdatePolicy({ exitImmediately: false, exitImmediatelyForUpdateInstall: () => events.push("exit"), quitForUpdateInstall: () => events.push("quit"), allowQuitTemporarily: () => events.push("allow") });
assert.deepEqual(events, ["allow", "quit"]);
console.log("2 main quit-for-update policy assertions passed");
