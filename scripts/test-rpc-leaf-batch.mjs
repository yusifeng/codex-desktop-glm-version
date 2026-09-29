import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modules = {
  "array-like-to-array-runtime": ["rolldown-runtime"],
  "array-like-to-array": [],
  "precise-location-banner-constants": ["rolldown-runtime"],
  "file-tree-rows": ["rolldown-runtime"],
  "format-angle-label": ["rolldown-runtime"],
  "format-coordinate-pair": ["rolldown-runtime"],
  "format-number-input": ["rolldown-runtime", "adaptive-slider"],
  "analytics-type-helpers": ["rolldown-runtime"],
  "analytics-query-string": ["rolldown-runtime", "analytics-type-helpers", "graceful-decode-uri-component"],
  "browser-profile-import-nux": ["thread-panel-secondary-state"],
};

let sourceAssertions = 0;
for (const [directory, expectedImports] of Object.entries(modules)) {
  const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8");
  assert.deepEqual([...source.matchAll(/(?:from|import)\s*(?:\([^)]*?from\s*)?["']@rchunk\/([^"']+)/g)].map((match) => match[1]), expectedImports);
  assert.equal(/\bany\b/.test(source), false);
  assert.equal(source.includes("@ts-expect-error"), false);
  sourceAssertions += 3;
}

globalThis.__rpcLeaf = { initialized: [], acknowledged: [] };
globalThis.document = { createElement() { return { search: "", set href(value) { this.search = new URL(value).search; } }; } };
const mocks = {
  "rolldown-runtime": "export {};",
  "adaptive-slider": "export const a=()=>globalThis.__rpcLeaf.initialized.push('adaptive'); export const i=value=>String(value).split('.')[1]?.length??0;",
  "analytics-type-helpers": "export const a=value=>Object.prototype.toString.call(value).slice(8,-1).toLowerCase()==='object';",
  "graceful-decode-uri-component": "export const t=value=>decodeURIComponent(value.split('+').join(' '));",
  "thread-panel-secondary-state": "export const m=()=>globalThis.__rpcLeaf.initialized.push('profile'); export const o=value=>globalThis.__rpcLeaf.acknowledged.push(value);",
};
async function bundle(directory) {
  const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "rpc-leaf-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: value }) => ({ path: value.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: value }) => ({ contents: mocks[value] ?? "export {};", loader: "js" })); } }] });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

let runtimeAssertions = 0;
const arrayRuntime = await bundle("array-like-to-array-runtime");
assert.equal(arrayRuntime.t({ 0: "a", length: 1 }).length, 1);
assert.deepEqual(arrayRuntime.t(new Set([1, 2])), [1, 2]);
runtimeAssertions += 2;
const array = await bundle("array-like-to-array");
assert.deepEqual(array.t(new Set([3, 4])), [3, 4]);
runtimeAssertions += 1;
const constants = await bundle("precise-location-banner-constants");
constants.n();
assert.equal(constants.t, "precise_location_banner_beacon");
runtimeAssertions += 1;
const rows = await bundle("file-tree-rows");
assert.deepEqual(rows.t([{ path: "b.txt" }, { path: "folder/10.txt" }, { path: "folder/2.txt" }], new Set()).map((row) => row.kind === "folder" ? row.path : row.file.path), ["folder", "folder/2.txt", "folder/10.txt", "b.txt"]);
assert.deepEqual(rows.t([{ path: "folder/a.txt" }], new Set(["folder"])).map((row) => row.kind), ["folder"]);
runtimeAssertions += 2;
const angle = await bundle("format-angle-label");
assert.equal(angle.t("\\theta_i"), "θ_i");
assert.equal(angle.t("x"), "x");
runtimeAssertions += 2;
const coordinate = await bundle("format-coordinate-pair");
assert.equal(coordinate.t({ formatNumber: () => "1.1" }, "2", "3"), "(2, 3)");
assert.equal(coordinate.t({ formatNumber: () => "1,1" }, "2", "3"), "(2; 3)");
runtimeAssertions += 2;
const numberInput = await bundle("format-number-input");
const enNumberFormat = new Intl.NumberFormat("en-US");
const en = {
  formatNumber: (value, options) => new Intl.NumberFormat("en-US", options).format(value),
  formatNumberToParts: (value) => enNumberFormat.formatToParts(value),
};
numberInput.i();
assert.equal(numberInput.n(en, 1.2, 0.01), "1.20");
assert.equal(numberInput.a(en, "1,234.5"), 1234.5);
assert.equal(numberInput.t(en, Number.NaN), "");
runtimeAssertions += 3;
const helpers = await bundle("analytics-type-helpers");
assert.equal(helpers.a({}), true);
assert.equal(helpers.a([]), false);
assert.equal(helpers.t(0), true);
runtimeAssertions += 3;
const query = await bundle("analytics-query-string");
const calls = [];
await query.queryString({ options: { useQueryString: {} }, identify: (...args) => calls.push(["identify", ...args]), setAnonymousId: (id) => calls.push(["anonymous", id]), track: (...args) => calls.push(["track", ...args]) }, "https://example.com/?ajs_aid=anon&ajs_uid=user&ajs_trait_role=admin&ajs_event=Opened&ajs_prop_source=sidebar");
assert.deepEqual(calls, [["anonymous", "anon"], ["identify", "user", { role: "admin" }], ["track", "Opened", { source: "sidebar" }]]);
runtimeAssertions += 1;
const profile = await bundle("browser-profile-import-nux");
profile.acknowledgeBrowserProfileImportNux("done");
assert.deepEqual(globalThis.__rpcLeaf.initialized.slice(-1), ["profile"]);
assert.deepEqual(globalThis.__rpcLeaf.acknowledged, ["done"]);
runtimeAssertions += 2;

console.log(`${sourceAssertions} source assertions and ${runtimeAssertions} runtime assertions passed`);
