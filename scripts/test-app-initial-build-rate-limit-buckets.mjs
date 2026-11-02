import assert from "node:assert/strict";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-initial/runtime/build-rate-limit-buckets.ts", import.meta.url).pathname;
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const mod = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
const entry = { limitName: "core", snapshot: { primary: { windowDurationMins: 300 }, secondary: { windowDurationMins: 10_080 } } };
const buckets = mod.buildRateLimitBuckets({ entry, keyPrefix: "core" });
assert.equal(buckets.length, 2);
assert.equal(buckets[0].key, "core-five-hour");
assert.equal(buckets[1].key, "core-weekly");
assert.equal(buckets[1].limitName, "core");
const duplicateBuckets = mod.buildRateLimitBuckets({
  entry: { snapshot: { primary: { windowDurationMins: 300 }, secondary: { windowDurationMins: 300 } } },
  keyPrefix: "duplicate",
});
assert.equal(duplicateBuckets[1].key, "duplicate-five-hour-secondary");
console.log("app-initial build rate-limit buckets: 5 assertions passed");
