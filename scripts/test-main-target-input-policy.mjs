import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/main-app/open-target/target-input-policy.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { normalizeAppsPath, isPackagedAppPath, isDataImage, isAbsoluteTargetPath } = module.exports;
const fakePath = {
  posix: { isAbsolute: (value) => value.startsWith("/") },
  win32: {
    parse: (value) => ({ root: value.startsWith("\\\\") ? "\\\\" : value.slice(0, 3) }),
    isAbsolute: (value) => /^[A-Za-z]:[\\/]/.test(value) || value.startsWith("\\\\"),
  },
};
assert.equal(normalizeAppsPath("apps/vscode.png"), "/apps/vscode.png");
assert.equal(normalizeAppsPath("/apps/vscode.png"), "/apps/vscode.png");
assert.equal(isPackagedAppPath("apps/vscode.png"), true);
assert.equal(isPackagedAppPath("apps/../secret.png"), false);
assert.equal(isDataImage("data:image/png;base64,AAAA"), true);
assert.equal(isDataImage("data:text/plain;base64,AAAA"), false);
assert.equal(isAbsoluteTargetPath("/tmp/editor", "linux", fakePath), true);
assert.equal(isAbsoluteTargetPath("C:\\editor", "win32", fakePath), true);
assert.equal(isAbsoluteTargetPath("editor", "win32", fakePath), false);
console.log("main target input policy passed (9 assertions)");
