import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__paymentMethodEditorTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "payment-method-editor-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__paymentMethodEditorTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; output.push(value); const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(visit); else visit(children); }; visit(root); return output; }
function find(root, predicate) { return nodes(root).find(predicate); }
function text(root) { return nodes(root).flatMap(node => typeof node.props?.children === "string" ? [node.props.children] : []).join(" "); }

// add-payment-method: 10
const add = await bundle("add-payment-method");
assert.deepEqual(Object.keys(add), ["n", "t"]);
assert.equal(find(add.t({ accountId: "a", isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Preparing secure payment form…");
let retried = 0;
const addError = add.t({ accountId: "a", error: "Offline", onClose() {}, onRetry() { retried++; } });
assert.equal(find(addError, node => node.props?.role === "alert").type, "div");
find(addError, node => node.props?.children === "Retry").props.onClick();
assert.equal(retried, 1);
let added, succeeded, addClosed = 0;
const addUi = add.t({ accountId: "account", onClose() { addClosed++; }, onSubmit(input) { added = input; return { paymentMethodId: "pm" }; }, onSuccess(method) { succeeded = method; } });
assert.match(text(addUi), /Add payment method.*Name on card.*Card details.*Continue/);
await find(addUi, node => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: { elements: { billingName: { value: " David " }, cardComplete: { checked: true } } } });
assert.deepEqual(added, { accountId: "account", billingName: "David", cardComplete: true });
assert.deepEqual(succeeded, { paymentMethodId: "pm" });
find(addUi, node => node.props?.children === "Close").props.onClick();
assert.equal(addClosed, 1);
const busyAdd = add.t({ accountId: "a", isSubmitting: true, onClose() { addClosed++; } });
assert.equal(find(busyAdd, node => node.props?.children === "Close").props.disabled, true);
find(busyAdd, node => node.props?.children === "Close").props.onClick();
assert.equal(addClosed, 1);

// edit-payment-method: 12
const edit = await bundle("edit-payment-method");
assert.deepEqual(Object.keys(edit), ["n", "t"]);
assert.equal(find(edit.t({ accountId: "a", methodId: "m", isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Loading payment method…");
assert.match(text(edit.t({ accountId: "a", methodId: "m", method: null, onClose() {} })), /Payment method unavailable/);
const method = { id: "pm", card: { brand: "Visa", last4: "4242", exp_month: 10, exp_year: 2027 }, billing_details: { name: "David" } };
let saved, editClosed = 0;
const editUi = edit.t({ accountId: "account", methodId: "pm", method, now: new Date("2026-09-01T00:00:00Z"), onClose() { editClosed++; }, onSave(input) { saved = input; } });
assert.match(text(editUi), /Visa •••• 4242.*Expiration month.*Expiration year.*Billing name.*Save/);
await find(editUi, node => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: { elements: { expMonth: { value: "11" }, expYear: { value: "2028" }, billingName: { value: " New Name " } } } });
assert.deepEqual(saved, { accountId: "account", methodId: "pm", billingName: "New Name", expMonth: 11, expYear: 2028 });
assert.equal(editClosed, 1);
saved = undefined;
await find(editUi, node => node.type === "form").props.onSubmit({ preventDefault() {}, currentTarget: { elements: { expMonth: { value: "8" }, expYear: { value: "2026" }, billingName: { value: "David" } } } });
assert.equal(saved, undefined);
assert.equal(editClosed, 1);
const busyEdit = edit.t({ accountId: "a", methodId: "pm", method, isSubmitting: true, onClose() { editClosed++; } });
assert.equal(find(busyEdit, node => node.props?.children === "Close").props.disabled, true);
assert.equal(find(busyEdit, node => node.props?.children === "Saving…").props.disabled, true);
find(busyEdit, node => node.props?.children === "Close").props.onClick();
assert.equal(editClosed, 1);
assert.equal(find(editUi, node => node.props?.["aria-label"] === "Edit payment method").props["aria-modal"], true);

console.log("22 payment method editor cluster assertions passed");
