import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/worker/git-stable-root-cache.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { GitStableRootCache } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => {
  assert.equal(actual, expected);
  assertions += 1;
};

let generation = 3;
let now = 100;
const timers = [];
const cleared = [];
const cache = new GitStableRootCache({
  clearTimeout: (timer) => cleared.push(timer),
  getGeneration: () => generation,
  maxAgeMs: 50,
  maxEntries: 2,
  now: () => now,
  setTimeout: (callback, delayMs) => {
    const timer = {
      callback,
      delayMs,
      unrefCount: 0,
      unref() { this.unrefCount += 1; },
    };
    timers.push(timer);
    return timer;
  },
});

cache.set("stale", "/stale", 2);
equal(cache.size, 0);
equal(timers.length, 0);

cache.set("a", "/a", 3);
equal(cache.size, 1);
equal(cache.get("a"), "/a");
equal(timers[0].delayMs, 50);
equal(timers[0].unrefCount, 1);

cache.set("a", "/a-new", 3);
equal(cache.size, 1);
equal(cleared[0], timers[0]);
timers[0].callback();
equal(cache.get("a"), "/a-new");

cache.set("b", null, 3);
equal(cache.get("b"), null);
cache.get("a");
cache.set("c", "/c", 3);
equal(cache.size, 2);
equal(cache.get("b"), undefined);
equal(cache.get("a"), "/a-new");
equal(cache.get("c"), "/c");

now = 151;
equal(cache.get("a"), undefined);
equal(cache.get("c"), undefined);
equal(cache.size, 0);

now = 200;
cache.set("timer", "/timer", 3);
const expiryTimer = timers.at(-1);
expiryTimer.callback();
equal(cache.get("timer"), undefined);
equal(cleared.at(-1), expiryTimer);

cache.set("delete", "/delete", 3);
const deleteTimer = timers.at(-1);
cache.delete("delete");
equal(cache.get("delete"), undefined);
equal(cleared.at(-1), deleteTimer);

cache.set("one", "/one", 3);
cache.set("two", "/two", 3);
const clearsBefore = cleared.length;
cache.clear();
equal(cache.size, 0);
equal(cleared.length, clearsBefore + 2);

generation = 4;
cache.set("old-generation", "/old", 3);
cache.set("current-generation", "/current", 4);
equal(cache.get("old-generation"), undefined);
equal(cache.get("current-generation"), "/current");

console.log(`${assertions} worker git stable root cache lifecycle assertions passed`);
