import assert from "node:assert/strict";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let activeHooks = [], hookCursor = 0;
const React = { useState(initial) { const hooks = activeHooks, index = hookCursor++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }]; } };
globalThis.__subscriptionLifecycleTest = { React, jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "subscription-lifecycle-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__subscriptionLifecycleTest.jsx;export const e6=globalThis.__subscriptionLifecycleTest.React;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function mount(Component, props) { const hooks = []; return { render() { activeHooks = hooks; hookCursor = 0; return Component(props); } }; }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const cadence = await bundle("billing-cadence-dialog");
assert.deepEqual(Object.keys(cadence), ["BillingCadenceDialog"]);
const cadenceState = { annualPrice: { amount: 10 }, monthlyPrice: { amount: 12 }, billingCurrency: "USD", effectiveNextCadence: "monthly", renewalDate: "2026-11-02T00:00:00Z" };
let updatedCadence, cadenceClosed = 0;
const cadenceMount = mount(cadence.BillingCadenceDialog, { accountId: "a", entryPoint: "manage_billing_schedule", state: cadenceState, onClose() { cadenceClosed++; }, onUpdate(value) { updatedCadence = value; } });
let cadenceUi = cadenceMount.render();
assert.match(text(cadenceUi), /Manage billing schedule/);
assert.equal(all(cadenceUi, node => node.type === "input" && node.props?.name === "cadence").length, 2);
all(cadenceUi, node => node.type === "input" && node.props?.name === "cadence")[1].props.onChange();
cadenceUi = cadenceMount.render();
find(cadenceUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(updatedCadence, "yearly");
assert.equal(cadenceClosed, 1);
assert.match(text(cadenceUi), /November 2, 2026/);
assert.equal(find(mount(cadence.BillingCadenceDialog, { accountId: "a", entryPoint: "manage_billing_schedule", state: cadenceState, isLoading: true, onClose() {} }).render(), node => node.props?.role === "status").props.children, "Checking your billing details…");
assert.equal(find(mount(cadence.BillingCadenceDialog, { accountId: "a", entryPoint: "annual_offer", state: cadenceState, error: "stale", onClose() {} }).render(), node => node.props?.role === "alert").type, "div");

const recovery = await bundle("subscription-recovery-dialog");
assert.deepEqual(Object.keys(recovery), ["RecoveryDialog"]);
let paidMethod, paymentCompleted = 0, recoveryClosed = 0;
const recoveryUi = mount(recovery.RecoveryDialog, { accountId: "a", planName: "Plus", amountDue: 20, walletBalanceApplied: 5, paymentMethods: [{ id: "card", brand: "Visa", last4: "4242" }], onClose() { recoveryClosed++; }, onComplete() { paymentCompleted++; }, onPay(method) { paidMethod = method.id; return "succeeded"; } }).render();
assert.match(text(recoveryUi), /Renew your ChatGPT Plus plan/);
assert.match(text(recoveryUi), /Due today: \$20\.00/);
assert.match(text(recoveryUi), /Wallet balance applied: 5/);
assert.match(text(recoveryUi), /Visa •••• 4242/);
find(recoveryUi, node => node.props?.children === "Pay now").props.onClick();
await Promise.resolve();
assert.equal(paidMethod, "card");
assert.equal(paymentCompleted, 1);
find(recoveryUi, node => node.props?.children === "Close").props.onClick();
assert.equal(recoveryClosed, 1);
const missingMethod = mount(recovery.RecoveryDialog, { accountId: "a", planName: "Plus", onClose() {}, onComplete() {} }).render();
assert.equal(find(missingMethod, node => node.props?.children === "Pay now").props.disabled, true);
assert.equal(find(missingMethod, node => node.props?.children === "Add payment method").type, "button");

assertReleaseOwner("subscription-cancellation-dialog", [/^\/\/ @ts-nocheck/m, /export \{/]);
assertReleaseOwner("credit-reload-dialog-host", [/^\/\/ @ts-nocheck/m, /export \{/]);

console.log("subscription billing lifecycle cluster tests passed");
