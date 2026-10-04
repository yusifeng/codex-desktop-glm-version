#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveTrayIconCandidates } = require("../app/.vite/build/main-app/startup/tray-icon-paths.js");
const common = { flavor: `Prod`, resourcesPath: `/resources`, repoRoot: `/repo`, templateNames: [`chatgptTemplate.png`], iconBaseName: () => `icon-chatgpt`, windowsIconNames: () => ({ dark: `dark.ico`, light: `light.ico` }) };
assert.deepEqual(resolveTrayIconCandidates({ ...common, platform: `darwin`, packaged: true }), [`/resources/chatgptTemplate.png`, `/repo/electron/src/icons/chatgptTemplate.png`]);
assert.deepEqual(resolveTrayIconCandidates({ ...common, platform: `linux`, packaged: false }), [`/repo/electron/src/icons/icon-chatgpt.png`]);
assert.deepEqual(resolveTrayIconCandidates({ ...common, platform: `win32`, packaged: true, dark: true }), [`/resources/dark.ico`, `/repo/electron/src/icons/dark.ico`]);
console.log(`6 main tray icon path assertions passed`);
