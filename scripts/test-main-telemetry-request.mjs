#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { sendTelemetryRequest } = require("../app/.vite/build/main-app/worker/telemetry-request.js");
const controller = new AbortController();
const calls = [];
let canceled = 0;
const success = await sendTelemetryRequest({ fetch: async (url, init) => {
  calls.push({ url, init });
  return { ok: true, status: 204, body: { cancel: async () => { canceled += 1; } }, text: async () => `unused` };
} }, { payload: `payload`, requestId: `req-1` }, controller.signal, (id) => `/telemetry/${id}`);
assert.deepEqual(success, { status: 204, body: null });
assert.equal(canceled, 1);
assert.equal(calls[0].init.headers[`x-request-id`], `req-1`);
const failure = await sendTelemetryRequest({ fetch: async () => ({ ok: false, status: 500, body: null, text: async () => `failure` }) }, { payload: `payload`, requestId: `req-2` }, controller.signal, (id) => `/telemetry/${id}`);
assert.deepEqual(failure, { status: 500, body: `failure` });
console.log(`4 main telemetry request assertions passed`);
