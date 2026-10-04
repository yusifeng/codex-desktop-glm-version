#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/main-app/window/renderer-frame-trust.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const trustSource = await fs.readFile("src/main/main-app/util/url-trust.ts", "utf8");
const transformedTrust = await esbuild.transform(trustSource, { loader: "ts", format: "cjs" });
const trustModule = { exports: {} };
new Function("module", "exports", transformedTrust.code)(trustModule, trustModule.exports);
const module = { exports: {} };
new Function("module", "exports", "require", code)(module, module.exports, (id) => {
  if (id === "../util/url-trust") return trustModule.exports;
  if (id === "node:url") return { pathToFileURL: (value) => new URL(`file://${value}`) };
  throw new Error(`unexpected require: ${id}`);
});
const api = module.exports;

assert.equal(api.resolveRendererEntryUrl("http://localhost:5173", "app://-/index.html"), "http://localhost:5173");
assert.equal(api.resolveRendererEntryUrl("", "app://-/index.html"), "app://-/index.html");
assert.equal(api.rendererOrigin("https://example.com/path"), "https://example.com");
assert.equal(api.rendererOrigin("app://-/index.html"), null);
const options = { rendererUrl: "http://localhost:5173", webviewEntryPath: "/app/webview/index.html" };
assert.equal(api.isTrustedRendererFrameUrl("about:blank", options), true);
assert.equal(api.isTrustedRendererFrameUrl("app://-/index.html", options), true);
assert.equal(api.isTrustedRendererFrameUrl("http://localhost:5173/thread/1", options), true);
assert.equal(api.isTrustedRendererFrameUrl("https://evil.example/thread/1", options), false);
assert.equal(api.isTrustedRendererFrameUrl("file:///app/webview/index.html?x=1", options), true);
const mainFrame = { url: "app://-/index.html" };
const sender = { mainFrame };
assert.equal(api.isTrustedRendererSenderFrame(sender, mainFrame, options), true);
assert.equal(api.isTrustedRendererSenderFrame(sender, { url: "app://-/index.html" }, options), false);
console.log("11 main renderer frame trust assertions passed");
