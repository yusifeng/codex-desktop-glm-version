import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__subscriptionLifecycleTest = { jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } } };
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "subscription-lifecycle-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__subscriptionLifecycleTest.jsx;" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const parts = []; const collect = value => { if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; } if (value == null || typeof value !== "object") return; const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); }; collect(node); return parts.join(" "); }

const cadence = await bundle("billing-cadence-dialog");
assert.deepEqual(Object.keys(cadence), ["BillingCadenceDialog"]);
const cadenceState = { annualPrice: { amount: 10 }, monthlyPrice: { amount: 12 }, billingCurrency: "USD", effectiveNextCadence: "monthly", renewalDate: "2026-11-02T00:00:00Z" };
let updatedCadence, cadenceClosed = 0;
const cadenceUi = cadence.BillingCadenceDialog({ accountId: "a", entryPoint: "manage_billing_schedule", state: cadenceState, onClose() { cadenceClosed++; }, onUpdate(value) { updatedCadence = value; } });
assert.match(text(cadenceUi), /Manage billing schedule/);
assert.equal(all(cadenceUi, node => node.type === "input" && node.props?.name === "cadence").length, 2);
all(cadenceUi, node => node.type === "input" && node.props?.name === "cadence")[1].props.onChange();
find(cadenceUi, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(updatedCadence, "yearly");
assert.equal(cadenceClosed, 1);
assert.match(text(cadenceUi), /November 2, 2026/);
assert.equal(find(cadence.BillingCadenceDialog({ accountId: "a", entryPoint: "manage_billing_schedule", state: cadenceState, isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Checking your billing details…");
assert.equal(find(cadence.BillingCadenceDialog({ accountId: "a", entryPoint: "annual_offer", state: cadenceState, error: "stale", onClose() {} }), node => node.props?.role === "alert").type, "div");

const recovery = await bundle("subscription-recovery-dialog");
assert.deepEqual(Object.keys(recovery), ["RecoveryDialog"]);
let paidMethod, paymentCompleted = 0, recoveryClosed = 0;
const recoveryUi = recovery.RecoveryDialog({ accountId: "a", planName: "Plus", amountDue: 20, walletBalanceApplied: 5, paymentMethods: [{ id: "card", brand: "Visa", last4: "4242" }], onClose() { recoveryClosed++; }, onComplete() { paymentCompleted++; }, onPay(method) { paidMethod = method.id; return "succeeded"; } });
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
const missingMethod = recovery.RecoveryDialog({ accountId: "a", planName: "Plus", onClose() {}, onComplete() {} });
assert.equal(find(missingMethod, node => node.props?.children === "Pay now").props.disabled, true);
assert.equal(find(missingMethod, node => node.props?.children === "Add payment method").type, "button");

const cancellation = await bundle("subscription-cancellation-dialog");
assert.deepEqual(Object.keys(cancellation), ["CancellationDialog"]);
const account = { account: { account_id: "a", structure: "personal", plan_type: "Plus" }, entitlement: { has_active_subscription: true, plan_name: "Plus" } };
const unavailable = cancellation.CancellationDialog({ accountId: "a", activeAccountId: "b", account, onClose() {} });
assert.match(text(find(unavailable, node => node.props?.role === "alert")), /can no longer be canceled/);
assert.equal(find(cancellation.CancellationDialog({ accountId: "a", account, isLoading: true, onClose() {} }), node => node.props?.role === "status").props.children, "Checking your subscription…");
const initialCancel = cancellation.CancellationDialog({ accountId: "a", account, promotion: { label: "Save 50%", description: "Stay for less" }, onClose() {} });
assert.match(text(initialCancel), /Cancel Plus and return to Free/);
assert.match(text(initialCancel), /Save 50%/);
const survey = cancellation.CancellationDialog({ accountId: "a", account, initialStep: "survey", onClose() {} });
assert.match(text(survey), /Why are you canceling/);
assert.equal(all(survey, node => node.type === "option").length, 4);
let cancelReason, cancelClosed = 0;
const finalCancel = cancellation.CancellationDialog({ accountId: "a", account, initialStep: "things_you_lose", onClose() { cancelClosed++; }, onCancel(reason, detail) { cancelReason = `${reason}:${detail}`; } });
assert.match(text(finalCancel), /You'll no longer have/);
find(finalCancel, node => node.props?.children === "Cancel subscription").props.onClick();
await Promise.resolve();
assert.equal(cancelReason, "null:");
assert.equal(cancelClosed, 1);

const credits = await bundle("credit-reload-dialog-host");
assert.deepEqual(Object.keys(credits), ["CreditReloadDialogHost"]);
let checkoutCredits, creditsClosed = 0;
const purchase = credits.CreditReloadDialogHost({ source: "settings", variant: "one-time-purchase", creditBalance: 3, pricingOptions: [{ creditCount: 20, price: 10 }], onClose() { creditsClosed++; }, onStartCheckout(count) { checkoutCredits = count; } });
assert.match(text(purchase), /Add credits/);
assert.match(text(purchase), /Current balance: 3 credits/);
assert.match(text(purchase), /20 credits — \$10\.00/);
find(purchase, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(checkoutCredits, 20);
assert.equal(creditsClosed, 1);
let autoReloadSettings;
const setup = credits.CreditReloadDialogHost({ source: "billing", variant: "setup-auto-reload", pricingOptions: [{ creditCount: 25, price: 12 }], onClose() {}, onSaveAutoReload(settings) { autoReloadSettings = settings; } });
assert.match(text(setup), /Set up auto-reload/);
assert.equal(all(setup, node => node.type === "input" && node.props?.type === "number").length, 2);
find(setup, node => node.type === "form").props.onSubmit({ preventDefault() {} });
await Promise.resolve();
assert.equal(autoReloadSettings.reloadAmount, 25);
const failedCredits = credits.CreditReloadDialogHost({ source: "billing", variant: "manage-auto-reload", error: "bad", onClose() {} });
assert.match(text(find(failedCredits, node => node.props?.role === "alert")), /couldn’t load available/);

console.log("subscription billing lifecycle cluster tests passed");
