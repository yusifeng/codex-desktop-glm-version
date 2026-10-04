#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { resolveWindowsPackageIdentity } = require("../app/.vite/build/main-app/startup/windows-package-identity.js");
const values = { Agent: "agent", Dev: "dev", Nightly: "nightly", InternalAlpha: "internal-alpha", PublicBeta: "public-beta", Prod: "prod" };
assert.equal(resolveWindowsPackageIdentity("agent", values), undefined);
assert.equal(resolveWindowsPackageIdentity("dev", values), undefined);
assert.equal(resolveWindowsPackageIdentity("nightly", values), "c4c933ff-16f4-47c7-a231-29e6bb84dccc");
assert.equal(resolveWindowsPackageIdentity("internal-alpha", values), "c4607cac-3138-48bd-8b2a-5bc99d08e393");
assert.equal(resolveWindowsPackageIdentity("public-beta", values), "758400cf-36c7-43be-9335-6354d603be3a");
assert.equal(resolveWindowsPackageIdentity("prod", values), "e5768d8b-6936-4f45-b1ad-4c5fb414cb35");
assert.equal(resolveWindowsPackageIdentity("unknown", values), undefined);
console.log("7 main Windows package identity assertions passed");
