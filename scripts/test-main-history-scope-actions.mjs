#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { HISTORY_SCOPE_ACTIONS, HISTORY_CLEAR_ACTIONS, historyScopeAction } = require("../app/.vite/build/main-app/computer-use/history-scope-actions.js");
assert.equal(historyScopeAction(`app`, true), `include_application`);
assert.equal(historyScopeAction(`app`, false), `exclude_application`);
assert.equal(historyScopeAction(`url`, true), `include_url`);
assert.equal(historyScopeAction(`url`, false), `exclude_url`);
assert.deepEqual(HISTORY_CLEAR_ACTIONS, { application_session: `clear_application_session`, last_ten_minutes: `clear_last_ten_minutes`, last_hour: `clear_last_hour`, last_day: `clear_last_day` });
assert.deepEqual(HISTORY_SCOPE_ACTIONS.app, { include: `include_application`, exclude: `exclude_application` });
console.log(`6 main history scope action assertions passed`);
