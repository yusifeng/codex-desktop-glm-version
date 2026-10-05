import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  MAX_GITHUB_FILE_BYTES,
  decodeGithubFileContent,
  encodeGithubContentPath,
} = require("../app/.vite/build/worker/github-pull-request-revision-policy.js");

assert.equal(encodeGithubContentPath("src/a b/[x].ts"), "src/a%20b/%5Bx%5D.ts");
assert.equal(encodeGithubContentPath("README.md"), "README.md");
assert.equal(decodeGithubFileContent({ size: 5, encoding: "base64", content: Buffer.from("hello").toString("base64") }), "hello");
assert.equal(decodeGithubFileContent({ size: MAX_GITHUB_FILE_BYTES + 1, encoding: "base64", content: "aA==" }), null);
assert.equal(decodeGithubFileContent({ size: 1, encoding: "utf-8", content: "aA==" }), null);
assert.equal(decodeGithubFileContent({ size: 1, encoding: "base64", content: Buffer.from([0]).toString("base64") }), null);
assert.equal(decodeGithubFileContent({ size: 2, encoding: "base64", content: "/w==" }), null);
console.log("test-worker-github-pull-request-revision-policy: 7 assertions passed");
