import assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as esbuild from "esbuild";

const source = await fs.readFile("src/main/main-app/open-target/target-filter-policy.ts", "utf8");
const { code } = await esbuild.transform(source, { loader: "ts", format: "cjs" });
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { isTargetSupported, filterTargetsForHost, filterTargetIdsForHost } = module.exports;
const targets = [
  { id: "fileManager" },
  { id: "zed", supportsSsh: true },
  { id: "vscode", supportsSsh: true },
  { id: "plain" },
];
const predicates = {
  isHostConfig: (value) => value != null && typeof value === "object" && "kind" in value,
  isLocalHost: (value) => value.kind === "local",
  isRemoteHost: (value) => value.kind === "ssh",
  remoteHostLabel: (value) => value.label ?? null,
  platform: "win32",
};
assert.equal(isTargetSupported(targets[0], { kind: "local" }, predicates), true);
assert.equal(isTargetSupported(targets[1], { kind: "local" }, predicates), false);
assert.equal(isTargetSupported(targets[1], { kind: "ssh", label: "prod" }, predicates), true);
assert.equal(isTargetSupported(targets[1], { kind: "ssh" }, predicates), false);
assert.equal(isTargetSupported(targets[3], { kind: "ssh", label: "prod" }, predicates), false);
assert.deepEqual(filterTargetsForHost({ kind: "local" }, targets, predicates).map(({ id }) => id), ["fileManager"]);
assert.deepEqual(filterTargetIdsForHost({ kind: "ssh", label: "prod" }, ["zed", "plain", "missing"], targets, predicates), ["zed"]);
assert.deepEqual(filterTargetIdsForHost({ kind: "other" }, ["zed", "missing"], targets, predicates), []);
console.log("main target filter policy passed (8 assertions)");
