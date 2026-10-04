#!/usr/bin/env node
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import * as esbuild from "esbuild";
const result = await esbuild.build({ entryPoints: ["src/renderer/app-primary/runtime/extract-site-subdomain.ts"], bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent" });
const { extractSiteSubdomain } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
assert.equal(extractSiteSubdomain("https://tenant.chatgpt-team.site/apps", "tenant"), ".chatgpt-team.site");
assert.equal(extractSiteSubdomain("https://tenant.chatgpt.site", " TENANT "), ".chatgpt.site");
assert.equal(extractSiteSubdomain("https://tenant.example.com", "tenant"), null);
assert.equal(extractSiteSubdomain("not a url", "tenant"), null);
assert.equal(extractSiteSubdomain(null, "tenant"), null);
console.log("app-primary extract-site-subdomain: 5 assertions passed");
