#!/usr/bin/env node
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { sendSentryEnvelope } = require("../app/.vite/build/main-app/worker/sentry-envelope-transport.js");
assert.deepEqual(await sendSentryEnvelope(() => null, `event`), { statusCode: 403 });
assert.deepEqual(await sendSentryEnvelope(() => ({ getOptions: () => ({ enabled: false }), getTransport: () => undefined }), `event`), { statusCode: 403 });
assert.deepEqual(await sendSentryEnvelope(() => ({ getOptions: () => ({ enabled: true }), getTransport: () => ({ send: async (envelope) => { assert.equal(envelope, `event`); return { statusCode: 200 }; } }) }), `event`), { statusCode: 200 });
assert.deepEqual(await sendSentryEnvelope(() => ({ getOptions: () => ({ enabled: true }), getTransport: () => undefined }), `event`), { statusCode: 403 });
console.log(`4 main Sentry envelope transport assertions passed`);
