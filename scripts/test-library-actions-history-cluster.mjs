import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
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

// library-item-actions: 15
const actions = await bundle("library-item-actions");
assert.deepEqual(Object.keys(actions), ["i", "n", "r", "t"]);
const calls = [], invalidations = [], errors = [];
const scope = { api: { async delete(pathname, input) { calls.push(["delete", pathname, input]); return { success: true }; }, async patch(pathname, input) { calls.push(["patch", pathname, input]); }, async post(pathname, input) { calls.push(["post", pathname, input]); } }, async download(node) { calls.push(["download", node.id]); }, invalidate(action) { invalidations.push(action.type); }, notifyError(message) { errors.push(message); } };
const file = { node: { id: "file", kind: "file", name: "Report.pdf" }, canRestore: true };
assert.equal(await actions.i(scope, file, { type: "rename", name: "New.pdf" }), true);
assert.deepEqual(calls[0], ["patch", "/files/library/files/file", { file_name: "New.pdf" }]);
assert.equal(await actions.i(scope, file, { type: "restore" }), true);
assert.equal(calls[1][1], "/files/library/files/file/restore");
assert.equal(await actions.i(scope, file, { type: "move", directoryId: "folder" }), true);
assert.deepEqual(calls[2][2], { directory_id: "folder" });
assert.equal(await actions.i(scope, file, { type: "download" }), true);
assert.deepEqual(calls[3], ["download", "file"]);
assert.equal(await actions.i(scope, { ...file, canDownload: false }, { type: "download" }), false);
assert.equal(actions.n.get("file"), false);
const completed = await actions.r(scope, [file, { node: { id: "folder", kind: "directory", name: "Folder" } }], { type: "delete" });
assert.deepEqual(completed, ["file", "folder"]);
assert.equal(invalidations.at(-1), "delete");
assert.equal(errors.length, 0);
assert.equal(calls.filter(call => call[0] === "delete").length, 2);

// version-history: 7
const history = await bundle("version-history");
assert.deepEqual(Object.keys(history), ["n", "r", "t"]);
assert.equal(history.n({ file: { libraryFileId: "f" }, isLoading: true }).props.role, "status");
assert.equal(history.n({ file: { libraryFileId: "f" }, error: "Offline" }).props.role, "alert");
let restored, loaded = 0;
const historyUi = history.n({ file: { libraryFileId: "f" }, versions: [{ id: "v1", label: "Current", is_current: true }, { id: "v0", label: "Earlier" }], hasNextPage: true, onRestore(version) { restored = version.id; }, onLoadMore() { loaded++; } });
assert.equal(find(historyUi, node => node.props?.children?.[0] === "Current").props.disabled, true);
find(historyUi, node => node.props?.children?.[0] === "Earlier").props.onClick();
assert.equal(restored, "v0");
find(historyUi, node => node.props?.children === "Load more").props.onClick();
assert.equal(loaded, 1);
assert.equal(historyUi.props["aria-label"], "Version history");

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

console.log("47 library actions and history cluster assertions passed");
