import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const api = require("../app/.vite/build/main-app/files/open-path-arguments.js");

assert.equal(api.isCodexDeepLink("CODEX://thread/1"), true);
assert.equal(api.isCodexDeepLink("https://example.com"), false);
assert.equal(api.normalizeFileArgument("/tmp/report.csv"), "/tmp/report.csv");
assert.equal(api.normalizeFileArgument("file:///tmp/report.csv"), "/tmp/report.csv");
assert.equal(api.normalizeFileArgument("file://%zz"), null);
assert.equal(api.isAbsoluteForPlatform("/tmp/report.csv", "linux"), true);
assert.equal(api.isAbsoluteForPlatform("C:\\tmp\\report.csv", "win32"), true);
assert.equal(api.isOpenableFilePath("/tmp/report.xlsx"), true);
assert.equal(api.isOpenableFilePath("/tmp/report.txt"), false);

assert.deepEqual(api.collectOpenableFileArguments([
  "node", "--open-project", "/tmp/project", "--open-project=/tmp/other",
  "--flag", "codex://thread/1", "/tmp/report.xlsx", "file:///tmp/report.csv",
  "/tmp/readme.txt", "/tmp/report.xlsx",
], "linux"), ["/tmp/report.xlsx", "/tmp/report.csv", "/tmp/report.xlsx"]);
assert.deepEqual(api.createOpenFileDescriptors(["/tmp/report.xlsx", "/tmp/report.xlsx", "/tmp/report.csv"]), [
  { label: "report.xlsx", path: "/tmp/report.xlsx", fsPath: "/tmp/report.xlsx" },
  { label: "report.csv", path: "/tmp/report.csv", fsPath: "/tmp/report.csv" },
]);
assert.deepEqual(api.collectFileExtensions([{ path: "/tmp/report.XLSX" }, { path: "/tmp/a.csv" }, { path: "/tmp/b.csv" }]), ["csv", "xlsx"]);
assert.deepEqual(api.classifyDesktopOpenPath("/tmp/index.HTML", { isDirectory: () => false, isFile: () => true }), { kind: "browser-document", path: "/tmp/index.HTML" });
assert.deepEqual(api.classifyDesktopOpenPath("/tmp/src.ts", { isDirectory: () => false, isFile: () => true }), { kind: "file", path: "/tmp/src.ts" });
assert.deepEqual(api.classifyDesktopOpenPath("/tmp/project", { isDirectory: () => true, isFile: () => false }), { kind: "directory", path: "/tmp/project" });
assert.equal(api.classifyDesktopOpenPath("/tmp/missing", { isDirectory: () => false, isFile: () => false }), null);
console.log("17 main open-path argument assertions passed");
