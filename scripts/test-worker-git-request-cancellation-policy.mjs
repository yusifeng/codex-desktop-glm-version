import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { createGitRequestCancellationTelemetry } = require("../app/.vite/build/worker/git-request-cancellation-policy.js");
let n=0; const eq=(...a)=>{n++;assert.deepEqual(...a)};
eq(createGitRequestCancellationTelemetry({ durationMs:10, startedAtMs:100, enqueuedAtMs:70, host:"local" }), { attribution:undefined,canceled:true,durationMs:10,host:"local",operation:undefined,queueDurationMs:30,repoIndexSizeBucket:undefined,result:undefined,resultDisposition:"canceled",reviewSource:undefined,source:undefined,trigger:"request" });
eq(createGitRequestCancellationTelemetry({ durationMs:10, startedAtMs:100, enqueuedAtMs:120, host:"remote", operation:"status", result:{type:"error"} }).queueDurationMs, 0);
eq(createGitRequestCancellationTelemetry({ durationMs:10, startedAtMs:100, host:"local" }).queueDurationMs, null);
console.log(`${n} worker request cancellation policy assertions passed`);
