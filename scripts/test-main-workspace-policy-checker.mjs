#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createWorkspacePolicyChecker } = require("../app/.vite/build/main-app/startup/workspace-policy-checker.js");
let restarts = 0; let auth = `chatgpt`; let changes = true; let quitting = false; let errors = 0;
const checker = createWorkspacePolicyChecker({ isAppQuitting: () => quitting, getAuthMethod: async () => auth, hasStartupPolicyChanges: async () => changes, onRestartRequired: () => restarts++, onError: () => errors++ });
await checker.checkForChanges(); assert.equal(restarts, 1);
await checker.checkForChanges(); assert.equal(restarts, 1);
await checker.handleNotification({ method: `account/login/completed`, params: { success: true } }); await checker.handleNotification({ method: `account/updated`, params: { authMode: `chatgpt` } }); assert.equal(restarts, 1);
const checker2 = createWorkspacePolicyChecker({ isAppQuitting: () => quitting, getAuthMethod: async () => auth, hasStartupPolicyChanges: async () => changes, onRestartRequired: () => restarts++, onError: () => errors++ });
quitting = true; await checker2.checkForChanges(); assert.equal(restarts, 1); quitting = false; auth = `api`; await checker2.handleNotification({ method: `account/updated`, params: { authMode: `api` } }); assert.equal(restarts, 1); auth = `chatgpt`; changes = false; await checker2.checkForChanges(); assert.equal(restarts, 1); assert.equal(errors, 0);
console.log(`7 main workspace policy checker assertions passed`);
