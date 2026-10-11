#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { resolveDockIconPreference } = require("../app/.vite/build/main-app/startup/startup-policy.js");
const eligibleFlavors = [`dev`, `nightly`, `internal-alpha`, `public-beta`, `prod`];
const getPreference = () => `codex-system`;
assert.equal(resolveDockIconPreference({ buildFlavor: `dev`, getPreference, eligibleFlavors, agentFlavor: `agent` }), `codex-system`);
assert.equal(resolveDockIconPreference({ buildFlavor: `dev`, getPreference: () => undefined, eligibleFlavors, agentFlavor: `agent` }), `app-default`);
assert.equal(resolveDockIconPreference({ buildFlavor: `agent`, getPreference, eligibleFlavors, agentFlavor: `agent` }), `app-default`);
assert.equal(resolveDockIconPreference({ buildFlavor: `unknown`, getPreference, eligibleFlavors, agentFlavor: `agent` }), undefined);
assert.equal(resolveDockIconPreference({ buildFlavor: `prod`, getPreference, eligibleFlavors: [], agentFlavor: `agent`, defaultPreference: `fallback` }), undefined);
console.log(`5 main dock icon policy assertions passed`);
