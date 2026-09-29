import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(ROOT, "src/renderer/pricing-plan-page/index.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const hooks = [];
let hookIndex = 0;
let effects = [];
const runtime = { account: undefined, accountLoading: false, initialized: [], location: { hash: "", key: "location-1", pathname: "/pricing-plan", search: "", state: null }, navigated: [] };
const React = {
  Fragment: "Fragment",
  useEffect(effect) { effects.push(effect); },
  useState(initial) { const index = hookIndex++; if (!(index in hooks)) hooks[index] = typeof initial === "function" ? initial() : initial; return [hooks[index], (next) => { hooks[index] = typeof next === "function" ? next(hooks[index]) : next; }]; },
};
const jsx = { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } };
globalThis.__pricingPage = { React, jsx, runtime };
const mocks = {
  "app-shared": "const r=globalThis.__pricingPage;export const I3=()=>r.jsx;export const e6=Object.assign(()=>r.React,r.React);",
  "app-initial": ["const r=globalThis.__pricingPage;", "export const uht=()=>({data:r.runtime.account,isLoading:r.runtime.accountLoading});", "export const i_n=()=>r.runtime.location;export const o_n=()=>((destination,options)=>r.runtime.navigated.push({destination,options}));", "export const Ygn=props=>({type:'navigate',props});"].join("\n"),
  "pricing-plan-comparison": "const r=globalThis.__pricingPage;export const n=()=>r.runtime.initialized.push('comparison');export const t=props=>({type:'comparison',props});",
  "pricing-promotions": "const r=globalThis.__pricingPage;export const f=()=>r.runtime.initialized.push('promotions');",
  "subscription-update-plan": "const state=globalThis.__pricingPage;export const r=()=>state.runtime.initialized.push('plan');export const t=plan=>({go:'chatgptgoplan',plus:'chatgptplusplan',prolite:'chatgptprolite',pro:'chatgptpro'}[plan]);",
  "subscription-update-dialog": "const r=globalThis.__pricingPage;export const n=()=>r.runtime.initialized.push('dialog');export const t=props=>({type:'update-dialog',props});",
  "rolldown-runtime": "export {};", "app-primary": "export {};", "chatgpt-subscription-events": "export {};", "checkout-telemetry": "export {};",
};
const result = await esbuild.build({ entryPoints: [sourcePath], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "pricing-page-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: module }) => ({ contents: mocks[module] ?? "export {};", loader: "js" })); } }] });
const module = await import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));

let assertions = 0;
function equal(actual, expected) { assertions++; assert.equal(actual, expected); }
function deepEqual(actual, expected) { assertions++; assert.deepEqual(actual, expected); }
function ok(value) { assertions++; assert.ok(value); }
function reset() { hooks.length = 0; hookIndex = 0; effects = []; runtime.account = undefined; runtime.accountLoading = false; runtime.location = { hash: "", key: "location-1", pathname: "/pricing-plan", search: "", state: null }; runtime.navigated.length = 0; }
function render(props = {}) { hookIndex = 0; effects = []; return module.PricingPlanPage(props); }
function walk(value, output = []) { if (value == null || typeof value !== "object") return output; if (Array.isArray(value)) { for (const item of value) walk(item, output); return output; } output.push(value); walk(value.props?.children, output); return output; }
function text(value) { if (value == null || typeof value === "boolean") return ""; if (typeof value === "string" || typeof value === "number") return String(value); if (Array.isArray(value)) return value.map(text).join(" "); return text(value.props?.children); }
function find(view, type, label) { return walk(view).find((node) => node.type === type && (label == null || text(node) === label)); }
async function flush() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }
async function runEffects() { const queued = effects; effects = []; for (const effect of queued) effect(); await flush(); }

deepEqual(Object.keys(module), ["PricingPlanPage"]);
deepEqual([...source.matchAll(/import\s+(?:[^;]*?from\s*)?"@rchunk\/([^"]+)"/g)].map((match) => match[1]), ["rolldown-runtime", "app-shared", "app-initial", "app-primary", "chatgpt-subscription-events", "checkout-telemetry", "pricing-plan-comparison", "pricing-promotions", "subscription-update-dialog", "subscription-update-plan"]);
equal([...source.matchAll(/import\(/g)].length, 0);
equal(/\bany\b/.test(source), false);
equal(/import \* as/.test(source), false);
deepEqual(runtime.initialized, ["promotions", "plan", "dialog", "comparison"]);
equal(source.includes("oai/apps/contextualUpsellId"), true);
equal(source.includes("codex_upgrade_location"), true);
equal(source.includes("/promotions/"), true);

reset(); runtime.accountLoading = true; let view = render();
equal(view.type, "main"); equal(view.props["aria-label"], "Loading pricing plans");
reset(); view = render(); equal(view.type, "navigate"); equal(view.props.to, "/"); equal(view.props.replace, true);
reset(); runtime.account = { id: "bad", plan_type: "enterprise" }; view = render(); equal(view.type, "navigate"); equal(view.props.to, "/settings/account");

const free = { id: "acct-free", plan_type: "free" };
const plus = { id: "acct-plus", plan_type: "plus" };
const pricing = { currencyCode: "USD", minorUnitExponent: 2, monthlyAmounts: { plus: 2000, pro: 20000 } };
const preview = { amount_due: { amount: 2000, amount_excluding_tax: 2000, tax_amount: 0 }, currency: "usd", positive_line_item_total: 2000, renewal_date: "2026-10-30" };
let opened = [], toasts = [], calls = [], navigation = [];
const service = { loadPricing: async (accountId) => { calls.push("pricing:" + accountId); return pricing; }, previewUpdate: async ({ targetPlan }) => { calls.push("preview:" + targetPlan); return preview; }, confirmUpdate: async ({ update }) => { calls.push("confirm:" + update.targetPlan); return "complete"; }, claimPromotion: async ({ promoCode }) => { calls.push("promo:" + promoCode); return true; } };
const common = { onNavigate: (destination, options) => navigation.push({ destination, options }), onOpenCheckout: (url) => opened.push(url), onToast: (kind, message) => toasts.push([kind, message]), pricingInfo: pricing, service };

reset(); view = render({ ...common, account: free });
let comparison = find(view, "comparison"); ok(comparison); equal(comparison.props.currentPlan, "free"); equal(comparison.props.plans.length, 6);
comparison.props.onSelectPlan("plus", "/checkout?target=plus"); await flush(); deepEqual(opened, ["/checkout?target=plus"]); equal(calls.includes("preview:plus"), false);

reset(); opened = []; calls = []; view = render({ ...common, account: plus });
find(view, "comparison").props.onSelectPlan("pro", "/checkout?target=pro"); await flush();
deepEqual(calls, ["preview:pro"]);
view = render({ ...common, account: plus }); let dialog = find(view, "update-dialog"); ok(dialog); equal(dialog.props.subscriptionUpdate.kind, "saved_card_upgrade"); equal(dialog.props.subscriptionUpdate.updatedPlan, "chatgptpro"); equal(dialog.props.pricingInfo.currencyCode, "USD");
dialog.props.onConfirm(); await flush(); equal(calls.includes("confirm:pro"), true); equal(toasts.at(-1)[0], "success"); equal(navigation.at(-1).destination, "/");

reset(); calls = []; view = render({ ...common, account: { id: "acct-pro", plan_type: "pro" } });
find(view, "comparison").props.onSelectPlan("plus", "/checkout?target=plus"); await flush(); view = render({ ...common, account: { id: "acct-pro", plan_type: "pro" } });
equal(find(view, "update-dialog").props.subscriptionUpdate.kind, "scheduled_downgrade");

reset(); calls = []; toasts = []; view = render({ ...common, account: free, offers: { plus: { promoCode: "plus-free" } } });
find(view, "comparison").props.onSelectPlan("plus", "/checkout?target=plus"); await flush(); deepEqual(calls, ["promo:plus-free"]); equal(toasts[0][1], "You've successfully claimed your promotion");

reset(); toasts = []; opened = []; view = render({ ...common, account: { id: "workspace", plan_type: "free_workspace" } });
find(view, "comparison").props.onSelectPlan("plus", null); await flush(); equal(toasts.at(-1)[0], "danger"); equal(opened.length, 0);

reset(); view = render({ ...common, account: free, modal: true, returnPath: "/settings/account" });
find(view, "button", "Back").props.onClick(); equal(navigation.at(-1).destination, "/settings/account"); equal(navigation.at(-1).options.replace, true);

reset(); runtime.location.search = "?codex_upgrade_location=sidebar%20profile&keep=1"; view = render({ ...common, account: free, upgradeContext: { upsellContextId: "upsell-1", sourceThreadId: "thread-1" } }); equal(view, null); await runEffects(); equal(navigation.at(-1).destination, "/pricing-plan?keep=1"); equal(navigation.at(-1).options.replace, true);

reset(); calls = []; view = render({ account: free, service, onToast: common.onToast }); await runEffects(); view = render({ account: free, service, onToast: common.onToast }); equal(calls.includes("pricing:acct-free"), true); ok(find(view, "comparison"));

reset(); const failingPricing = { ...service, loadPricing: async () => { throw Error("offline"); } }; view = render({ account: free, service: failingPricing }); await runEffects(); view = render({ account: free, service: failingPricing }); equal(text(view).includes("Pricing is unavailable"), true); ok(find(view, "button", "Retry"));

reset(); calls = []; opened = []; const failingUpdate = { ...service, confirmUpdate: async () => { throw Error("declined"); } }; view = render({ ...common, account: plus, service: failingUpdate }); find(view, "comparison").props.onSelectPlan("pro", "/checkout?target=pro"); await flush(); view = render({ ...common, account: plus, service: failingUpdate }); find(view, "update-dialog").props.onConfirm(); await flush(); view = render({ ...common, account: plus, service: failingUpdate }); const failedDialog = find(view, "update-dialog"); equal(failedDialog.props.disableConfirm, true); equal(text(failedDialog.props.error).includes("couldn't complete"), true); failedDialog.props.onGoToWeb(); deepEqual(opened, ["/checkout?target=pro"]);

console.log("pricing-plan-page tests passed (" + assertions + " assertions)");
