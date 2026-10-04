#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createComputerUseRpcHandler } = require("../app/.vite/build/main-app/worker/computer-use-rpc-handler.js");
let invalidated = null; let ensured = 0;
const handler = createComputerUseRpcHandler({ invalidateManagedComputerUseService: async (id) => { invalidated = id; }, ensureManagedComputerUseService: () => ++ensured });
assert.deepEqual(await handler({ method: `computer-use-invalidate-service-pid`, params: { processIdentifier: 42 } }), {}); assert.equal(invalidated, 42);
assert.equal(await handler({ method: `computer-use-service-pid` }), 1); assert.equal(await handler({ method: `computer-use-service-pid` }), 2);
await assert.rejects(() => handler({ method: `ces-telemetry` }), /Unsupported computer-use worker request/);
assert.equal(await handler({ method: `other` }), undefined);
console.log(`5 main computer-use RPC handler assertions passed`);
