#!/usr/bin/env node
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/main-app/util/main-business.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
vm.runInNewContext(code, { module, exports: module.exports, TextEncoder });
const business = module.exports;

assert.deepEqual(JSON.parse(JSON.stringify(business.parseDelegationEnvelope(
  " <codex_delegation><source_thread_id>t-1</source_thread_id><input>A &amp; B</input></codex_delegation> ",
))), { sourceThreadId: "t-1", input: "A & B" });
assert.equal(business.parseDelegationEnvelope("<codex_delegation></codex_delegation>"), null);
assert.equal(business.isOpenAiEmployee("person@openai.com"), true);
assert.equal(business.isEligibleAccount({ type: "chatgpt", planType: "pro" }), true);
assert.equal(business.isEligibleAccount({ type: "chatgpt", planType: "free" }), false);
console.log("5 main business assertions passed");
