import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULES = ["checkout-policy", "checkout-error", "checkout-confirm-latency"];
const state = globalThis.__checkoutHelpersTest = {};
state.jsx = { Fragment: Symbol("Fragment"), jsx: (type, props, key) => ({ type, props: props ?? {}, key }), jsxs: (type, props, key) => ({ type, props: props ?? {}, key }) };
state.react = { useState(initial) { let value = typeof initial === "function" ? initial() : initial; return [value, next => { value = typeof next === "function" ? next(value) : next; }]; } };
state.secureForm = function SecureForm() {};
const imports = new Map();
for (const directory of MODULES) { const source = fs.readFileSync(path.join(ROOT, "src/renderer", directory, "index.ts"), "utf8"); for (const match of source.matchAll(/import\s*{([\s\S]*?)}\s*from\s*"@rchunk\/([^"]+)";/g)) { const names = imports.get(match[2]) ?? new Set(); for (const item of match[1].split(",")) names.add(item.trim().split(/\s+as\s+/)[0]); imports.set(match[2], names); } }
const overrides = {
  "app-shared": { I3: "() => globalThis.__checkoutHelpersTest.jsx", e6: "() => globalThis.__checkoutHelpersTest.react" },
  "checkout-policy": { S: "() => undefined", b: "input => !input.setupFailed && input.source === 'codex' && input.checkoutFrom === 'codex_app' ? 'desktop_handoff' : input.audience === 'workspace' ? 'workspace_billing' : 'personal_usage'", d: "plan => plan.includes('team') ? 'team' : plan.includes('go') ? 'go' : plan.includes('pro') ? 'pro' : 'plus'" },
  "checkout-error": { a: "globalThis.__checkoutHelpersTest.secureForm", o: "() => undefined" },
};
const sideEffects = new Set(["rolldown-runtime", "app-initial", "checkout-session"]);
function mock(name) { if (sideEffects.has(name)) return "export {};"; return [...(imports.get(name) ?? [])].map(exportName => `export const ${exportName} = ${overrides[name]?.[exportName] ?? "() => undefined"};`).join("\n"); }
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "checkout-helper-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: mock(importPath), loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function nodes(root) { const output = []; const visit = value => { if (value == null || typeof value !== "object") return; if (Array.isArray(value)) return value.forEach(visit); if ("type" in value && "props" in value) output.push(value); visit(value.props?.children); }; visit(root); return output; }
const nodeOfType = (tree, type) => nodes(tree).find(node => node.type === type);

// checkout-policy: 35
const policy = await bundle("checkout-policy"); policy.S(); policy.k();
assert.equal(policy.O("source=codex"), "codex");
assert.equal(policy.O("source=external"), null);
assert.equal(policy.j("/pay?x=1", "source=codex&checkout_from=codex_app"), "/pay?x=1&source=codex&checkout_from=codex_app");
assert.equal(policy.j("relative", "source=codex"), "relative");
assert.equal(policy.j("https://evil.test/pay", "source=codex"), "https://evil.test/pay");
assert.equal(policy.d("chatgptgoplan"), "go");
assert.equal(policy.d("chatgptpro"), "pro");
assert.equal(policy.d("chatgptteamplan"), "team");
assert.equal(policy.d("chatgptplusplan"), "plus");
assert.equal(policy.v("credit_purchase_modal"), "workspace");
assert.equal(policy.v("codex_purchase_credits_route"), "personal");
assert.equal(policy.v("other"), "unknown");
assert.equal(policy.b({ audience: "personal", checkoutFrom: "codex_app", setupFailed: false, source: "codex" }), "desktop_handoff");
assert.equal(policy.b({ audience: "workspace" }), "workspace_billing");
assert.equal(policy.s({ canConfirm: false }), true);
assert.equal(policy.s({ canConfirm: false, isWalletOnlyCheckout: true }), false);
assert.equal(policy.i("oaics_123"), true);
assert.equal(policy.i("cs_123", "if_required"), true);
assert.equal(policy.i("cs_123"), false);
assert.equal(policy.h({ appliedBalance: { minorUnitsAmount: -500 } }), -500);
assert.equal(policy.h({ appliedBalance: { minorUnitsAmount: 0 } }), null);
const checkout = { currency: "USD", total: { total: { minorUnitsAmount: 500 }, subtotal: { minorUnitsAmount: 500 }, discount: { minorUnitsAmount: 0 }, appliedBalance: { minorUnitsAmount: -100 } } };
assert.deepEqual(policy.y(checkout), { invoiceTotalMinorUnits: 600, amountDueMinorUnits: 500, currency: "usd" });
assert.equal(policy.C("standard", checkout), true);
assert.equal(policy.C("standalone_credit", { total: { total: { minorUnitsAmount: 0 } } }), false);
assert.equal(policy.D({ isStandaloneCredit: true, intentType: "payment_element", paymentMethodType: "paypal" }), true);
assert.equal(policy.D({ isStandaloneCredit: true, intentType: "payment_element", paymentMethodType: "card" }), false);
assert.equal(policy.p("processing"), "processing");
assert.equal(policy.p("canceled"), "failed");
assert.equal(policy.f({ payment_status: "paid" }), "succeeded");
assert.equal(policy.f({ payment_status: "unpaid", payment_intent_status: "requires_action" }), "requires_action");
assert.equal(policy.m("jpy"), 0);
assert.equal(policy.m("usd"), 2);
assert.deepEqual(policy.c({ countryCode: "US", pricingCountryCode: "US", isCandidate: true, monthlyAmount: 20, yearlyAmount: 200 }), { monthlyAmount: 20, yearlyAmount: 200 });
assert.equal(policy.c({ countryCode: "US", pricingCountryCode: "DE", isCandidate: true, monthlyAmount: 20, yearlyAmount: 200 }), null);
assert.equal(policy.u({ detail: "declined" }), "declined");

const checkoutFieldsReleaseAssertions = assertReleaseOwner("checkout-dialog-fields");

// checkout-error: 11
const checkoutError = await bundle("checkout-error"); checkoutError.o(); checkoutError.i();
let retried = false;
const loadingError = checkoutError.a({ kind: "payment", loading: true, onRetry: () => {} });
assert.equal(loadingError.props.role, "status");
assert.match(loadingError.props.children, /Loading secure payment/);
const timeout = new Error("slow"); timeout.name = "TimeoutError";
const timeoutTree = checkoutError.a({ kind: "billing", error: timeout, onRetry: () => { retried = true; } });
assert.match(nodes(timeoutTree).find(node => node.props.role === "alert").props.children, /too long/);
nodes(timeoutTree).find(node => node.type === "button").props.onClick();
assert.equal(retried, true);
assert.equal(checkoutError.r(new Error("ordinary")), "save");
const insufficient = new checkoutError.t(JSON.stringify({ detail: { stripe_decline_code: "insufficient_funds" } }), { status: 402, errorCode: "confirmation_token_requires_new_token" });
assert.equal(checkoutError.r(insufficient), "insufficient_funds");
const declined = new checkoutError.t(JSON.stringify({ detail: { stripe_error_code: "card_declined" } }), { status: 402, errorCode: "confirmation_token_requires_new_token" });
assert.equal(checkoutError.r(declined), "payment_method_declined");
const auth = new checkoutError.t(JSON.stringify({ detail: { stripe_error_code: "authentication_required" } }), { status: 402, errorCode: "confirmation_token_requires_new_token" });
assert.equal(checkoutError.r(auth), "authentication_failed");
assert.match(checkoutError.n("expired_card"), /expired/);
assert.equal(checkoutError.n("missing"), undefined);
assert.equal(new checkoutError.t("message").message, "message");

// checkout-confirm-latency: 20
const sessionData = new Map(); const localData = new Map(); let replacedPath = null;
const storage = data => ({ getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) });
globalThis.window = { sessionStorage: storage(sessionData), localStorage: storage(localData), location: { replace: path => { replacedPath = path; } } };
const latency = await bundle("checkout-confirm-latency"); latency.m(); latency.c(); latency.o(); latency.r();
assert.deepEqual(latency.a("person@example.com", "fallback@example.com"), { checkoutEmail: "person@example.com", hasCheckoutEmail: true, defaultEmail: "" });
assert.deepEqual(latency.a("bad", "fallback@example.com"), { checkoutEmail: "bad", hasCheckoutEmail: false, defaultEmail: "fallback@example.com" });
assert.equal(latency.i.test("person@example.com"), true);
assert.equal(latency.i.test("person@localhost"), false);
latency.u("session-1", new URLSearchParams("source=codex&checkout_from=codex_app"));
assert.equal(sessionData.get("oai/apps/codexEmbeddedCheckoutSource/session-1"), "codex");
assert.equal(sessionData.get("oai/apps/codexEmbeddedCheckoutSource/session-1/checkout_from"), "codex_app");
latency.l("session-1", 2500);
assert.match(sessionData.get("oai/apps/modalCreditCheckoutSuccessContext"), /2500/);
latency.f("session-1", "session-2");
assert.match(sessionData.get("oai/apps/modalCreditCheckoutSuccessContext"), /session-2/);
assert.equal(sessionData.get("oai/apps/codexEmbeddedCheckoutSource/session-2"), "codex");
assert.equal(latency.s("session-2", new URLSearchParams(), "personal", false), "/codex/open-app?target=launch");
assert.equal(latency.s("missing", new URLSearchParams(), "workspace", false), "/admin/billing");
latency.d("/settings/usage");
assert.equal(replacedPath, "/settings/usage");
const success = await latency.t({ checkout_kind: "standard", plan_name: "chatgptplusplan", checkout_session_id: "session-3" }, async () => ({ type: "success" }));
assert.equal(success.type, "success");
assert.match(localData.get("oai/apps/checkoutConfirmLatencyPending"), /session-3/);
const metric = latency.n({ checkoutSessionId: "session-3" });
assert.equal(typeof metric.durationMs, "number");
assert.equal(metric.checkoutSessionId, "session-3");
assert.equal(localData.has("oai/apps/checkoutConfirmLatencyPending"), false);
const loadingTree = latency.p({ loading: true, loadingContent: "Preparing", onRetry: () => {} });
assert.equal(loadingTree, "Preparing");
const errorState = latency.p({ loading: false, error: new Error("failed"), onRetry: () => {}, returnPath: "/settings" });
assert.equal(errorState.props["data-return-path"], "/settings");
assert.equal(errorState.props.children[0].type, state.secureForm);

console.log(`66 checkout helper assertions and ${checkoutFieldsReleaseAssertions} checkout fields release assertions passed`);
