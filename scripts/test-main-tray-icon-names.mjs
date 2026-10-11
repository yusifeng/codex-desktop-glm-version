#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveTrayTemplateNames, resolveTrayWindowsIconNames } = require("../app/.vite/build/main-app/startup/tray-icon-paths.js");
assert.deepEqual(resolveTrayTemplateNames(), [`chatgptTemplate.png`, `chatgptTemplate@2x.png`]);
assert.deepEqual(resolveTrayWindowsIconNames(`agent`, `agent`), { dark: `icon-agent.ico`, light: `icon-agent.ico` });
assert.deepEqual(resolveTrayWindowsIconNames(`prod`, `agent`), { dark: `chatgpt-tray-dark.ico`, light: `chatgpt-tray-light.ico` });
console.log(`3 main tray icon name assertions passed`);
