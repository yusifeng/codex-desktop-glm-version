import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { collectNonEmptySections, defaultMaxBytes, defaultMaxConcurrency, resolvePatchSectionLimits } = require(
  "../app/.vite/build/worker/git-review-patch-sections-policy.js",
);
let assertions = 0;
const equal = (...args) => { assertions += 1; assert.equal(...args); };
const deepEqual = (...args) => { assertions += 1; assert.deepEqual(...args); };
equal(defaultMaxBytes, 64 * 1024 * 1024);
equal(defaultMaxConcurrency, 8);
deepEqual(collectNonEmptySections([" a ", "", null], [" b\n"]), ["a", "b"]);
deepEqual(resolvePatchSectionLimits(), { maxBytes: defaultMaxBytes, maxConcurrency: defaultMaxConcurrency });
deepEqual(resolvePatchSectionLimits({ maxBytes: 10, maxConcurrency: 2 }), { maxBytes: 10, maxConcurrency: 2 });
console.log(`${assertions} worker git review patch sections policy assertions passed`);
