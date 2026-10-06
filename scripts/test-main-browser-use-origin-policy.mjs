import assert from "node:assert/strict";
import { dedupeBrowserUseStrings, normalizeBrowserUseOrigin, oppositeBrowserUseRuleKind } from "../app/.vite/build/main-app/browser-use/origin-policy.js";

let assertions = 0;
const check = (actual, expected) => { assert.equal(actual, expected); assertions += 1; };
check(normalizeBrowserUseOrigin("example.com/path"), "https://example.com");
check(normalizeBrowserUseOrigin(" http://Example.com:80/path "), "http://example.com");
check(normalizeBrowserUseOrigin("ftp://example.com"), null);
check(normalizeBrowserUseOrigin(""), null);
assert.deepEqual(dedupeBrowserUseStrings([" a ", "a", "", 2, "b"]), ["a", "b"]); assertions += 1;
check(oppositeBrowserUseRuleKind("allowed"), "denied");
check(oppositeBrowserUseRuleKind("denied"), "allowed");
console.log(`main browser-use origin policy assertions passed (${assertions})`);
