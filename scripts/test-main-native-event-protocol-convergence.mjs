import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { z } from "zod";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function load(relativePath) {
  const built = await esbuild.build({ bundle: true, entryPoints: [path.join(root, relativePath)], format: "esm", logLevel: "silent", platform: "node", target: "node22", write: false });
  return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
}
const workerProtocolModule = await load("src/main/main-app/worker/worker-main-protocol.ts");
const nativeProtocolModule = await load("src/main/main-app/tray/native-status-item-event-protocol.ts");
const samplerModule = await load("src/main/main-app/worker/invocation-sampler.ts");
const schema = {
  wf: (shape) => z.object(shape), Of: () => z.string(), bf: (value) => z.literal(value),
  df: (values) => z.enum(values), gf: () => z.boolean(), Cf: () => z.number(),
  vf: (key, values) => z.discriminatedUnion(key, values),
};
let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };

const workerProtocol = workerProtocolModule.createWorkerMainProtocol(schema);
equal(workerProtocol.parseCesPayload({ payload: "trace", requestId: "request-1" }), { payload: "trace", requestId: "request-1" });
assert.throws(() => workerProtocol.parseCesPayload({ payload: 1, requestId: "request-1" })); assertions += 1;

const nativeProtocol = nativeProtocolModule.createNativeStatusItemEventProtocol(schema);
for (const event of [
  { type: "menu-update" }, { type: "menu-open" }, { type: "menu-close" }, { type: "quit" },
  { type: "open-thread", path: "/thread/1" },
  { type: "computer-use/stop-application", applicationId: "app-1" },
  { type: "computer-history/pause", duration: "one_hour" },
  { type: "computer-history/resume" },
  { type: "computer-history/update-observation", scope: "url", target: "example.com", observe: true },
  { type: "computer-history/clear-history", scope: "last_hour" },
  { type: "computer-history/show-history" },
  { type: "computer-history/open-settings" },
  { type: "service-state-changed", processIdentifier: 42, computerUseActive: true, computerHistoryState: "running" },
]) {
  equal(nativeProtocol.parseNativeEvent(event).success, true);
}
equal(nativeProtocol.parseNativeEvent({ type: "computer-history/pause", duration: "forever" }).success, false);
equal(nativeProtocol.parseNativeEvent({ type: "service-state-changed", processIdentifier: 0, computerUseActive: true, computerHistoryState: "running" }).success, false);
equal(nativeProtocol.parseNativeEvent({ type: "unknown" }).success, false);

const counters = [];
const sampler = samplerModule.createGitWorkerInvocationSampler(({ windowMs }) => {
  equal(windowMs, 30_000);
  return {
    record(value, atMs) { counters.push(["record", value, atMs]); },
    getSnapshot(atMs) { counters.push(["snapshot", atMs]); return { count: 2 }; },
  };
});
sampler.recordInvocation(100);
sampler.recordInvocation(200);
equal(sampler.getSnapshot(300), { totalInvocations: 2, invocationsLast30s: 2 });
equal(counters, [["record", 1, 100], ["record", 1, 200], ["snapshot", 300]]);

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(main.includes("createWorkerMainProtocol(n)"), true);
equal(main.includes("createNativeStatusItemEventProtocol(n)"), true);
equal(main.includes("createGitWorkerInvocationSampler("), true);
equal(main.includes("var yst ="), false);
equal(main.includes("var jst ="), false);
equal(main.includes("class extends WorkerInvocationSampler"), false);

console.log(`${assertions} main native-event protocol convergence assertions passed`);
