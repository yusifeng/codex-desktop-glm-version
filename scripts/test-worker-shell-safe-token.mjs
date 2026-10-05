import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";
const source = await fs.readFile("src/main/worker/shell-quoting.ts", "utf8"); const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" }); const module = { exports: {} }; new Function("module", "exports", code)(module, module.exports);
assert.equal(module.exports.isShellSafeToken("repo/path"), true); assert.equal(module.exports.isShellSafeToken(""), false); assert.equal(module.exports.isShellSafeToken("a b"), false); assert.equal(module.exports.quoteShellArg("repo/path"), "repo/path");
console.log("worker shell safe token tests passed (4 assertions)");
