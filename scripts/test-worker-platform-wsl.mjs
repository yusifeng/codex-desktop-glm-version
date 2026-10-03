#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/worker/platform-wsl.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { decodeCommandOutput, findActiveDistro, orderEligibleDistros } = module.exports;
assert.equal(decodeCommandOutput(Buffer.from([255, 254, 85, 0, 84, 0, 70, 0, 45, 0, 49, 0])), "UTF-1");
assert.equal(findActiveDistro("NAME  STATE  VERSION\n* Ubuntu  Running  2\nDebian  Stopped  2"), "Ubuntu");
assert.deepEqual(orderEligibleDistros("NAME  STATE  VERSION\n* Ubuntu  Running  2\nDebian  Stopped  2"), ["Ubuntu", "Debian"]);
console.log("3 worker WSL platform assertions passed");
