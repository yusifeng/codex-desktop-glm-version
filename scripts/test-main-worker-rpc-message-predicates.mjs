#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { isAllowedMainRpcMethod, isNonNullObject, isWorkerMainRpcCancel, isWorkerMainRpcRequest } = require("../app/.vite/build/main-app/worker/rpc-message-predicates.js");
for (const method of [`ces-telemetry`, `otel-export`, `computer-use-invalidate-service-pid`, `computer-use-service-pid`, `read-shortcut-link`]) assert.equal(isAllowedMainRpcMethod(method), true);
assert.equal(isAllowedMainRpcMethod(`unknown`), false);
assert.equal(isNonNullObject({}), true);
assert.equal(isNonNullObject([]), true);
assert.equal(isNonNullObject(null), false);
assert.equal(isNonNullObject(`value`), false);
assert.equal(isWorkerMainRpcCancel({ type: `worker-main-rpc-cancel`, workerId: `git`, requestId: `1` }), true);
assert.equal(isWorkerMainRpcCancel({ type: `worker-main-rpc-cancel`, workerId: `git` }), false);
assert.equal(isWorkerMainRpcRequest({ type: `worker-main-rpc-request`, workerId: `git`, requestId: `1`, method: `ces-telemetry` }), true);
assert.equal(isWorkerMainRpcRequest({ type: `worker-main-rpc-request`, workerId: `git`, requestId: `1`, method: `unknown` }), false);
assert.equal(isWorkerMainRpcRequest(null), false);
console.log(`14 main worker RPC predicate assertions passed`);
