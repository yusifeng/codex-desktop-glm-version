import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__artifactPreviewPrimitivesTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "artifact-preview-primitives-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__artifactPreviewPrimitivesTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); output.push(value); visit(value.props?.children); }; visit(root); return output; }
function find(root, predicate) { return nodes(root).find(predicate); }

// editor-header-controls: 3
const controls = await bundle("editor-header-controls");
assert.deepEqual(Object.keys(controls), ["n", "t"]);
assert.deepEqual(Object.keys(controls.t).sort(), ["annotationControl", "commentsControl", "editingControls", "navigationControl", "supplementalActions", "zoomControl"]);
assert.equal(controls.t.zoomControl, null);

// comment-mode-coachmark-state: 4
const coachmark = await bundle("comment-mode-coachmark-state");
assert.deepEqual(Object.keys(coachmark), ["i", "n", "r", "t"]);
assert.match(coachmark.t, /coachmark-dismissed/);
assert.equal(coachmark.r.value, false);
coachmark.n(); assert.equal(coachmark.r.value, true);

// artifact-preview-zoom: 7
const zoom = await bundle("artifact-preview-zoom");
assert.deepEqual(Object.keys(zoom), ["a", "i", "n", "o", "r", "t"]);
assert.equal(zoom.n(5), 10);
assert.equal(zoom.n(500), 400);
assert.equal(zoom.n(125), 125);
assert.equal(zoom.a(0, 0, 3, 4), 5);
assert.equal(zoom.r({ initialDistance: 100, initialZoomPercent: 100, nextDistance: 150 }), 150);
assert.equal(zoom.i(100, 0), 100);

// artifact-preview-status: 4
const status = await bundle("artifact-preview-status");
assert.deepEqual(Object.keys(status), ["n", "t"]);
assert.equal(status.n("loading"), null);
assert.equal(status.n("ready"), null);
assert.equal(status.n("error").props.role, "alert");

// artifact-layout: 4
const layout = await bundle("artifact-layout");
assert.deepEqual(Object.keys(layout), ["n", "t"]);
assert.deepEqual(layout.t({ header: "head", content: "body" }).props.children, ["head", "body"]);
let layoutParts;
assert.equal(layout.t({ header: "h", content: "c", headerPlacement: "top", renderLayout(parts) { layoutParts = parts; return "custom"; } }), "custom");
assert.deepEqual(layoutParts, { header: "h", content: "c", headerPlacement: "top" });

// header-content-fade: 5
const fade = await bundle("header-content-fade");
assert.deepEqual(Object.keys(fade), ["i", "n", "r", "t"]);
assert.equal(fade.t("docx"), "artifact");
assert.equal(fade.t("ipynb"), "surface");
assert.equal(fade.t("csv"), undefined);
assert.equal(fade.r({}), null);

// loading-controls: 4
const loadingControls = await bundle("loading-controls");
assert.deepEqual(Object.keys(loadingControls), ["n", "t"]);
assert.equal(loadingControls.t({ paginated: false }).navigationControl, null);
assert.equal(loadingControls.t({ paginated: true }).navigationControl.props["data-control"], "navigation");
assert.equal(loadingControls.t({ paginated: true }).zoomControl.props["aria-hidden"], true);

// file-viewer-frame: 4
const frame = await bundle("file-viewer-frame");
assert.deepEqual(Object.keys(frame), ["n", "t"]);
const frameUi = frame.t({ filePath: "/tmp/a.txt", fileViewer: { hostId: "host" }, mcpAppId: "app" });
assert.equal(frameUi.props.src, "codex-resource://app");
assert.equal(frameUi.props["data-file-path"], "/tmp/a.txt");
assert.equal(frameUi.props["data-host-id"], "host");

// detail-section-state: 4
const detail = await bundle("detail-section-state");
assert.deepEqual(Object.keys(detail), ["n", "t"]);
assert.match(detail.t({ children: "ok" }).props.className, /text-secondary/);
assert.match(detail.t({ children: "bad", tone: "danger" }).props.className, /text-danger/);
assert.equal(detail.t({ children: "ok", role: "status" }).props.role, "status");

// source-dashed-border: 4
const border = await bundle("source-dashed-border");
assert.deepEqual(Object.keys(border), ["n", "t"]);
assert.equal(border.t({}).type, "svg");
assert.equal(border.t({ isDragActive: true }).props["data-active"], true);
assert.equal(border.t({}).props.children.props.strokeDasharray, "7 6.3");

// compact-empty-state: 5
const empty = await bundle("compact-empty-state");
assert.deepEqual(Object.keys(empty), ["n", "t"]);
const emptyUi = empty.t({ icon: "icon", title: "Nothing here", description: "Try again", actions: "Refresh" });
assert.equal(find(emptyUi, node => node.props?.["data-slot"] === "icon").props.children, "icon");
assert.equal(find(emptyUi, node => node.props?.["data-slot"] === "title").props.children, "Nothing here");
assert.equal(find(emptyUi, node => node.props?.["data-slot"] === "description").props.children, "Try again");
assert.equal(find(emptyUi, node => node.props?.["data-slot"] === "actions").props.children, "Refresh");

console.log("48 artifact preview primitives cluster assertions passed");
