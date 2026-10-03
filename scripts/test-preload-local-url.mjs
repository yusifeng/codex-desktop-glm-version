import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { isLocalHostname, isLocalHttpUrl } = require("../app/.vite/build/browser-page-preload/local-url.js");

assert.equal(isLocalHostname("localhost"), true);
assert.equal(isLocalHostname("api.localhost"), true);
assert.equal(isLocalHostname("127.0.0.1"), true);
assert.equal(isLocalHostname("example.com"), false);
assert.equal(isLocalHttpUrl("http://localhost:5173/overlay"), true);
assert.equal(isLocalHttpUrl("https://api.localhost/path"), true);
assert.equal(isLocalHttpUrl("ftp://localhost/file"), false);
assert.equal(isLocalHttpUrl("https://example.com/"), false);
assert.equal(isLocalHttpUrl("not a url"), false);

console.log("9 preload local URL assertions passed");
