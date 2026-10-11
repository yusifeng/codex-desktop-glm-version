#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveFlavorIconBaseName } = require("../app/.vite/build/main-app/startup/icon-flavor-policy.js");
const policy = { agent: `agent`, nightly: `nightly`, internalAlpha: `internal-alpha`, publicBeta: `public-beta`, dev: `dev`, prod: `prod` };
assert.equal(resolveFlavorIconBaseName(`agent`, policy), `icon-agent`);
assert.equal(resolveFlavorIconBaseName(`nightly`, policy), `icon-chatgpt-nightly`);
assert.equal(resolveFlavorIconBaseName(`internal-alpha`, policy), `icon-chatgpt-alpha`);
assert.equal(resolveFlavorIconBaseName(`public-beta`, policy), `icon-chatgpt-beta`);
assert.equal(resolveFlavorIconBaseName(`dev`, policy), `icon-chatgpt`);
assert.equal(resolveFlavorIconBaseName(`unknown`, policy), undefined);
console.log(`6 main icon flavor policy assertions passed`);
