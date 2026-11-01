import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { transform } from "esbuild";

const nativeRequire = createRequire(import.meta.url);
let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

async function loadModule(relativePath, resolve = nativeRequire) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const transpiled = await transform(source, { loader: "ts", format: "cjs", target: "es2022" });
  const module = { exports: {} };
  Function("require", "module", "exports", transpiled.code)(resolve, module, module.exports);
  return { exports: module.exports, source };
}

const projectState = await loadModule("../src/main/shared/project-state.ts");
const { parseLocalProjects, qo } = projectState.exports;
equal(qo, parseLocalProjects);
equal(parseLocalProjects(null), {});
equal(parseLocalProjects([]), {});
equal(parseLocalProjects({ invalid: null }), {});

const roots = ["/work"];
const parsed = parseLocalProjects({
  valid: {
    id: "project-one",
    name: "One",
    rootPaths: roots,
    createdAt: 1,
    updatedAt: 2,
    ignored: "strip-me",
  },
  missingName: { id: "missing-name", rootPaths: [], createdAt: 1, updatedAt: 2 },
  invalidRoot: { id: "invalid-root", name: "Bad", rootPaths: [1], createdAt: 1, updatedAt: 2 },
  invalidTime: { id: "invalid-time", name: "Bad", rootPaths: [], createdAt: Infinity, updatedAt: 2 },
});
equal(parsed, {
  valid: {
    id: "project-one",
    name: "One",
    rootPaths: ["/work"],
    createdAt: 1,
    updatedAt: 2,
  },
});
equal(parsed.valid.rootPaths === roots, false);

const wslPaths = await loadModule(
  "../src/main/shared/wsl-paths.ts",
  (specifier) => {
    if (specifier === "@chunk/logger") return {
      memoizedTaggedLogger: () => () => ({ debug() {}, info() {}, warning() {} }),
    };
    if (specifier === "./host-config") return {
      isRemoteHostConfig: (host) => host?.kind === "remote",
    };
    return nativeRequire(specifier);
  },
);
const { isWindowsPath, isWslPath, isWslUncPath, Wi, Ui } = wslPaths.exports;
equal(Wi, isWslPath);
equal(Ui, isWslUncPath);
for (const value of ["/mnt/c", "/mnt/Z/work", "\\mnt\\c", "\\\\MNT\\Z\\work"])
  equal(isWslPath(value), true, value);
for (const value of ["/mnt/cc", "C:\\work", "/home/work", "\\wsl$\\Ubuntu\\work"])
  equal(isWslPath(value), false, value);
for (const value of ["\\\\wsl$\\Ubuntu\\work", "//wsl.localhost/Ubuntu/work", "\\\\?\\UNC\\wsl$\\Ubuntu\\work"])
  equal(isWslUncPath(value), true, value);
for (const value of ["/mnt/c/work", "C:\\work", "\\\\server\\share"])
  equal(isWslUncPath(value), false, value);
for (const value of ["C:\\work", "d:/work", "\\\\server\\share", "//server/share"])
  equal(isWindowsPath(value), true, value);
for (const value of ["/mnt/c/work", "/home/work", "relative/path"])
  equal(isWindowsPath(value), false, value);

const dts = fs.readFileSync(new URL("../src/main/types/chunk-modules.d.ts", import.meta.url), "utf8");
assert.match(dts, /isWslPath as Wi/); assertions += 1;
assert.match(dts, /isWslUncPath as Ui/); assertions += 1;
assert.match(dts, /parseLocalProjects as qo/); assertions += 1;

const pathPolicy = fs.readFileSync(new URL("../src/main/main-app/projects/path-policy.ts", import.meta.url), "utf8");
const appProjectState = fs.readFileSync(new URL("../src/main/main-app/projects/project-state.ts", import.meta.url), "utf8");
const migrations = fs.readFileSync(new URL("../src/main/main-app/projects/local-data-migrations.ts", import.meta.url), "utf8");
const manager = fs.readFileSync(new URL("../src/main/main-app/projects/projects-manager.ts", import.meta.url), "utf8");
const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.doesNotMatch(pathPolicy, /Wi as isNativePlatformPath|Ui as isWindowsDrivePath/); assertions += 1;
assert.doesNotMatch(appProjectState, /qo as parseLocalProjects/); assertions += 1;
assert.doesNotMatch(migrations, /runtime\.qo/); assertions += 1;
assert.doesNotMatch(manager, /n\.qo\(/); assertions += 1;
assert.doesNotMatch(main, /parseLocalProjects:\s*n\.qo/); assertions += 1;
assert.match(main, /parseLocalProjects,\n\s*getLocalProjects: jr/); assertions += 1;
assert.match(main, /createAutomationExecutionPolicy\(\{[\s\S]*?parseLocalProjects,/); assertions += 1;

console.log(`${assertions} shared project-state runtime assertions passed`);
