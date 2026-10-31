import assert from "node:assert/strict";
import fs from "node:fs";
import esbuild from "esbuild";
const sourcePath = new URL("../src/renderer/app-shared/runtime/format-error-message.ts", import.meta.url).pathname;
for (const consumer of ["pull-request-fix-automation", "use-resume-conversation-if-needed"]) {
  const source = fs.readFileSync(new URL(`../src/renderer/${consumer}/index.ts`, import.meta.url), "utf8");
  assert.match(source, /app-shared\/runtime\/format-error-message/);
  assert.doesNotMatch(source, /\bIH as getErrorMessage\b/);
}
const built = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { formatErrorMessage } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);
assert.equal(formatErrorMessage(new Error("failed")), "failed");
assert.equal(formatErrorMessage("plain"), "plain");
assert.equal(formatErrorMessage({ message: "structured" }), "structured");
assert.equal(formatErrorMessage({ code: 7 }), '{"code":7}');
console.log("app-shared format error message: 8 assertions passed");
