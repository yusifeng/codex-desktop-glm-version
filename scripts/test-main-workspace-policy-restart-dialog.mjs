#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { formatWorkspacePolicyRestartDetail, showWorkspacePolicyRestartDialog } = require("../app/.vite/build/main-app/startup/workspace-policy-restart-dialog.js");
assert.equal(formatWorkspacePolicyRestartDetail((descriptor) => descriptor.defaultMessage.replace("{appName}", descriptor.values.appName), "Codex"), "Restart Codex to apply your workspace settings. Active local chats will be interrupted");
const calls = []; let approved = 0; let quit = 0;
const intl = { formatMessage: (descriptor) => descriptor.messageId === `desktop.workspacePolicyRestart.detail` ? `Restart Codex to apply settings` : descriptor.defaultMessage };
showWorkspacePolicyRestartDialog({ getIntl: () => intl, getAppName: () => `Codex`, showMessageBoxSync: (options) => calls.push(options), markQuitApproved: () => approved++, quit: () => quit++ });
assert.equal(calls.length, 1); assert.equal(calls[0].type, `info`); assert.equal(calls[0].detail, `Restart Codex to apply settings`); assert.equal(approved, 1); assert.equal(quit, 1);
let errors = 0;
showWorkspacePolicyRestartDialog({ getIntl: () => { throw new Error(`format failed`); }, getAppName: () => `Codex`, showMessageBoxSync: () => { throw new Error(`dialog failed`); }, markQuitApproved: () => approved++, quit: () => quit++, onError: () => errors++ });
assert.equal(errors, 1); assert.equal(approved, 2); assert.equal(quit, 2);
console.log(`8 main workspace policy restart dialog assertions passed`);
