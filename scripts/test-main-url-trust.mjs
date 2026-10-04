#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/main-app/util/url-trust.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
vm.runInNewContext(code, { module, exports: module.exports, URL });
const trust = module.exports;

assert.equal(trust.sameOrigin("https://chatgpt.com/index.html", "https://chatgpt.com"), true);
assert.equal(trust.sameOrigin("file:///tmp/index.html", "file://"), false);
assert.equal(trust.sameOrigin("ftp://chatgpt.com/index.html", "ftp://chatgpt.com"), false);
assert.equal(trust.sameOrigin("not a URL", "https://chatgpt.com"), false);

assert.equal(trust.samePathOnOrigin("https://chatgpt.com/a?one", "https://chatgpt.com/a?two", "https://chatgpt.com"), true);
assert.equal(trust.samePathOnOrigin("https://chatgpt.com/a", "https://chatgpt.com/b", "https://chatgpt.com"), false);
assert.equal(trust.sameFilePath("file:///tmp/a", "file://localhost/tmp/a"), true);
assert.equal(trust.sameFilePath("file:///tmp/a", "file:///tmp/b"), false);
assert.equal(trust.sameAppPath("app://-/index.html", "app://-/index.html?cache=1"), true);
assert.equal(trust.sameAppPath("app://openai/index.html", "app://openai/index.html"), false);
assert.equal(trust.sameTrustedPath("https://chatgpt.com/a", "https://chatgpt.com/a", "https://chatgpt.com"), true);
assert.equal(trust.sameTrustedPath("app://-/index.html", "app://-/index.html", null), true);
assert.equal(trust.isAppFrameUrl("app://-/index.html"), true);
assert.equal(trust.isAppFrameUrl("app:///index.html"), true);
assert.equal(trust.isAppFrameUrl("app://fs/file"), false);
assert.equal(trust.isAppProtocolUrl("app://fs/file"), true);
assert.equal(trust.isAppProtocolUrl("https://chatgpt.com"), false);

const main = await fs.readFile(".reference/originals/main/main-C-Mhak1n.ts", "utf8");
assert.match(main, /require\("\.\/main-app\/util\/url-trust\.js"\)/);
assert.match(main, /return mainUrlTrust\.sameTrustedPath\(e, t, n \?\? null\)/);
console.log("19 main URL trust assertions passed");
