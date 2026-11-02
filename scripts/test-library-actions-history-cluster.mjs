import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__libraryActionsHistoryTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", treeShaking: false, plugins: [{ name: "library-actions-history-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: path.basename(importPath) === "app-shared" ? "export const I3=()=>globalThis.__libraryActionsHistoryTest.jsx;" : path.basename(importPath) === "library-file-download" ? "export const t=async()=>{};" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); output.push(value); visit(value.props?.children); }; visit(root); return output; }
function find(root, predicate) { return nodes(root).find(predicate); }

// library-multiplayer-access: 6
const access = await bundle("library-multiplayer-access");
assert.deepEqual(Object.keys(access), ["n", "r", "t"]);
assert.equal(access.r.evaluate({ access: "denied" }), false);
assert.equal(access.r.evaluate({ access: "allowed", isInternal: true }), true);
assert.equal(access.r.evaluate({ access: "allowed", sharedContentGateEnabled: true, isLoadingAccount: true }), false);
assert.equal(access.n.evaluate({ access: "allowed", sharedContentGateEnabled: true, accountFeatures: ["library_shared_content_available"] }), true);
assert.equal(access.n.evaluate({ access: "allowed", sharedContentGateEnabled: true, accountFeatures: [] }), false);

// library-trash-analytics: 8
const trash = await bundle("library-trash-analytics");
assert.deepEqual(Object.keys(trash), ["a", "i", "n", "r", "t"]);
assert.equal(typeof trash.a.value, "string");
const analytics = []; const analyticsScope = { log(event) { analytics.push(event); } };
trash.i(analyticsScope, [{ node: { id: "a" } }, { node: { id: "a" } }, { node: { id: "b" } }]);
assert.deepEqual(analytics[0].libraryFileIds, ["a", "b"]);
assert.equal(analytics[0].selectedCount, 3);
trash.r(analyticsScope, [{ node: { id: "a" } }]);
assert.equal(analytics[1].event, "library_items_selected_for_delete");
trash.n(analyticsScope, "session", "failed", { responseStatus: 429, errorCode: "rate_limit" });
assert.equal(analytics[2].error.type, "rate_limited");
assert.equal(analytics[2].error.httpStatus, 429);
trash.n(analyticsScope, "session", "failed", { errorKind: "network" });
assert.equal(analytics[3].error.type, "network_error");

assertReleaseOwner("library-item-actions");

assertReleaseOwner("version-history");

// lazy-version-history: 4
const lazy = await bundle("lazy-version-history");
assert.deepEqual(Object.keys(lazy), ["n", "r", "t"]);
assert.equal(lazy.n({}).props["data-version-history"], "library");
assert.equal(lazy.t({}).props["data-version-history"], "chatgpt");
assert.equal(lazy.n({ children: "History" }).props.children, "History");

// file-preview: 7
const preview = await bundle("file-preview");
assert.deepEqual(Object.keys(preview), ["ChatGptSearchFilePreview"]);
const base = { accountId: "a", authenticatedAccountId: "a", userId: "u", authenticatedUserId: "u", item: { cloudFile: { name: "Report" } }, onClose() {} };
assert.equal(preview.ChatGptSearchFilePreview({ ...base, authenticatedAccountId: "b" }), null);
assert.equal(preview.ChatGptSearchFilePreview({ ...base, authenticatedUserId: "other" }), null);
assert.equal(preview.ChatGptSearchFilePreview({ ...base, sessionReady: false }), null);
let closed = 0;
const previewUi = preview.ChatGptSearchFilePreview({ ...base, onClose() { closed++; }, renderPreview() { return "Rendered"; } });
assert.equal(previewUi.props["aria-label"], "Report");
find(previewUi, node => node.props?.children === "Close").props.onClick();
assert.equal(closed, 1);
assert.equal(previewUi.props.children[1], "Rendered");

const historyReleaseAssertions = assertReleaseOwner("history");

console.log(`47 library actions and history cluster assertions plus ${historyReleaseAssertions} history release assertions passed`);
