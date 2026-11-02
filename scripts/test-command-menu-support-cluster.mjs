import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "command-menu-support-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "command-menu-holdout" ? "export const t=client=>client.getDynamicConfig?.(\"1648954249\")?.get(\"suppress_ads\",false)??false;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }

const holdout = await bundle("command-menu-holdout");
assert.deepEqual(Object.keys(holdout), ["n", "t"]);
assert.equal(holdout.t({ getDynamicConfig() { return { get() { return true; } }; } }), true);
assert.equal(holdout.t({}), false);

const availability = await bundle("command-menu-availability");
assert.deepEqual(Object.keys(availability), ["n", "t"]);
const available = { activeAccountId: "a", activeUserId: "u", commandMenuEnabled: true, isBrowserWindow: false, isLocked: false };
assert.equal(availability.t(available), true);
assert.equal(availability.t({ ...available, isLocked: true }), false);
assert.equal(availability.t({ ...available, client: { getDynamicConfig() { return { get() { return true; } }; } } }), false);

const queryReleaseAssertions = assertReleaseOwner("command-menu-queries");
const searchReleaseAssertions = assertReleaseOwner("command-menu-search-results");

console.log(`command menu support cluster tests passed with ${queryReleaseAssertions + searchReleaseAssertions} query/search release assertions`);
