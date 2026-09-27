import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__sharedDialogRuntimeTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "shared-dialog-runtime-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__sharedDialogRuntimeTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string") { parts.push(value); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const share = await bundle("skill-share-dialog-runtime");
assert.deepEqual(Object.keys(share).sort(), ["a", "c", "d", "f", "i", "l", "n", "o", "r", "s", "t", "u"]);
assert.deepEqual(share.c({ id: "team", name: "Research" }), { id: "group:team", label: "Research", target: { principal_type: "group", principal_id: "team" } });
assert.equal(share.l(new Error(JSON.stringify({ detail: { resolution: "FORCE_CREATE" } }))), "FORCE_CREATE");
assert.equal(share.l(new Error(JSON.stringify({ detail: { updateable: true } }))), "UPDATE_EXISTING");
assert.equal(share.l(new Error("invalid")), null);
let confirmed = 0, cancelled = 0;
const duplicateUi = share.s({ resolution: "UPDATE_EXISTING", onCancel() { cancelled++; }, onConfirm() { confirmed++; } });
assert.match(text(duplicateUi), /Skill already exists.*Replace existing/);
find(duplicateUi, node => node.props?.children === "Cancel").props.onClick();
find(duplicateUi, node => node.type === "form").props.onSubmit({ preventDefault() {}, stopPropagation() {} });
assert.equal(cancelled, 1);
assert.equal(confirmed, 1);
let shareClosed = 0;
const shareUi = share.t({ skill: { id: "s", name: "Research helper", description: "Summarizes papers" }, onClose() { shareClosed++; } });
assert.match(text(shareUi), /Share Research helper.*Summarizes papers/);
find(shareUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(shareClosed, 1);

const control = await bundle("ad-control-dialog-runtime");
assert.deepEqual(Object.keys(control).sort(), ["A", "C", "D", "E", "O", "S", "T", "_", "a", "b", "c", "d", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "v", "w", "x", "y"].sort());
assert.equal(control.E("https://example.com/path"), "example.com");
assert.equal(control.E("not a url"), null);
assert.deepEqual(control.A({ type: "single_advertiser_ad_unit", advertiser_brand: { name: "OpenAI" } }), [{ name: "OpenAI" }]);
assert.equal(control.T("  misleading  "), "misleading");
const formatter = { formatMessage(message) { return message.defaultMessage; } };
assert.deepEqual(control.C(formatter), { title: "Share feedback on this ad", sendLabel: "Send" });
assert.equal(find(control.n(), node => node.props?.role === "alert").type, "p");
assert.equal(find(control.r(), node => node.props?.role === "status").props.children, "Loading…");
let closed = 0;
const dialogUi = control.t({ title: "Ad controls", children: "Preferences", footer: "Actions", onClose() { closed++; } });
assert.match(text(dialogUi), /Ad controls.*Preferences.*Actions/);
find(dialogUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(closed, 1);
let selected, advanced = 0;
const step = control.c({ ads: [{ adDataToken: "ad-1", displayName: "First ad" }], onAdvance() { advanced++; }, onClose() {}, selectedAdToken: "ad-1", setSelectedAdToken(value) { selected = value; }, title: "Select ad", primitives: {} });
find(step.body, node => node.props?.children === "First ad").props.onClick();
assert.equal(selected, "ad-1");
step.primaryButton.props.onClick();
assert.equal(advanced, 1);

console.log("shared dialog runtime cluster tests passed");
