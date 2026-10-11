#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveFlavorIconAssetNames, resolveFlavorIconBaseName, resolveWindowIconResource } = require("../app/.vite/build/main-app/startup/icon-flavor-policy.js");
const policy = { agent: `agent`, nightly: `nightly`, internalAlpha: `internal-alpha`, publicBeta: `public-beta`, dev: `dev`, prod: `prod` };
assert.equal(resolveFlavorIconBaseName(`agent`, policy), `icon-agent`);
assert.equal(resolveFlavorIconBaseName(`nightly`, policy), `icon-chatgpt-nightly`);
assert.equal(resolveFlavorIconBaseName(`internal-alpha`, policy), `icon-chatgpt-alpha`);
assert.equal(resolveFlavorIconBaseName(`public-beta`, policy), `icon-chatgpt-beta`);
assert.equal(resolveFlavorIconBaseName(`dev`, policy), `icon-chatgpt`);
assert.equal(resolveFlavorIconBaseName(`unknown`, policy), undefined);
assert.deepEqual(resolveFlavorIconAssetNames(`dev`, policy), { dark: `icon-codex-dark-color.png`, light: `icon-codex-light.png` });
assert.deepEqual(resolveFlavorIconAssetNames(`nightly`, policy), { dark: `icon-codex-dark-color-nightly.png`, light: `icon-codex-light-nightly.png` });
assert.deepEqual(resolveFlavorIconAssetNames(`public-beta`, policy), { dark: `icon-codex-dark-color-beta.png`, light: `icon-codex-light-beta.png` });
assert.deepEqual(resolveWindowIconResource(`dev`, policy), { fileName: `icon-dev-outline.png`, allowPackaged: false });
assert.deepEqual(resolveWindowIconResource(`agent`, policy), { fileName: `icon-agent.png`, allowPackaged: true });
assert.equal(resolveWindowIconResource(`unknown`, policy), undefined);
console.log(`12 main icon flavor policy assertions passed`);
