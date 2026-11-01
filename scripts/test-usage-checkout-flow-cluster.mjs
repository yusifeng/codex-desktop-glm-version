import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const usageState = {
  accountId: "account-1", userId: "user-1", currentAccountId: "account-1", imageRateLimit: undefined,
  family: new Map(), signal: new Map(), scopeSets: [], warningDismissals: [], shown: [], effects: [],
};
const React = { useEffect(effect) { usageState.effects.push(effect); return effect(); }, useRef(value) { return { current: value }; } };
globalThis.__usageCheckoutTest = {
  React, state: usageState,
  jsx: { Fragment: "Fragment", jsx(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; }, jsxs(type, props, key) { return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key }; } },
};
const usageMocks = {
  "app-shared": `const s=globalThis.__usageCheckoutTest.state;export const I3=()=>globalThis.__usageCheckoutTest.jsx;export const e6=()=>globalThis.__usageCheckoutTest.React;export const ZI='app-scope';export const LX=()=>({set:(signal,key,value)=>{s.scopeSets.push({signal,key,value});s.family.set(signal+':'+JSON.stringify(key),value)}});export const HX=signal=>s.signal.get(signal);export const BX=(family,key)=>s.family.get(family+':'+JSON.stringify(key));export const FX=()=>{};export const QI=()=>{};`,
  "app-initial": `const s=globalThis.__usageCheckoutTest.state;export const kht='composer-scope',LN='UsageBannerPresentation',vZt='conversation-service',R8='conversation-usage',g0t='dismissed-banner',X8='image-context',P8='model-selection',Z8='luna-available',ugn='local';export const N6t=()=>({accountId:s.accountId,userId:s.userId});export const uht=()=>({data:{id:s.currentAccountId},isError:false,isLoading:false});export const u0t=()=>({data:s.imageRateLimit});export const w8=()=>({data:{models:[{model:'fallback',hidden:false}]}});export const _0t=(_scope,status,context)=>status.dismissalKey??(context?'dismiss:'+context:null);export const Fht=()=> 'thread-1';export const F8=(_scope,id,state)=>s.dismissedConversation={id,state};export const Min=c=>c.turn;export const k5=input=>input.authAccountId===input.currentAccountId;export const y0t=(_scope,key)=>s.shown.push(key);export const fgn=()=>{};export const M6t=()=>{},rht=()=>{},O5=()=>{},HZt=()=>{},Iin=()=>{},L8=()=>{},RN=()=>{},S8=()=>{},d0t=()=>{},v0t=()=>{},Zrn=()=>{};`,
  "app-primary": `const s=globalThis.__usageCheckoutTest.state;export const Dm='RateLimitBanner',Em='ModelLimitBanner',wm='presentation-context';export const Pm=status=>status.percent??null;export const Im=(_scope,percent,threshold)=>s.warningDismissals.push({percent,threshold});export const Fm=()=>{},Om=()=>{},Tm=()=>{};`,
};
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "usage-checkout-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: usageMocks[importPath] ?? (importPath === "app-shared" ? "export const I3=()=>globalThis.__usageCheckoutTest.jsx;" : "export {};"), loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }
function walk(node, visit) { if (node == null || typeof node !== "object") return; visit(node); const children = node.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit)); else walk(children, visit); }
function find(node, predicate) { let result; walk(node, value => { if (result == null && predicate(value)) result = value; }); return result; }
function all(node, predicate) { const result = []; walk(node, value => { if (predicate(value)) result.push(value); }); return result; }
function text(node) { const values = []; const collect = value => { if (typeof value === "string") values.push(value); else if (value != null && typeof value === "object") { const children = value.props?.children; if (Array.isArray(children)) children.flat(Infinity).forEach(collect); else collect(children); } }; collect(node); return values.join(" "); }

// usage: 10
const usage = await bundle("usage");
assert.deepEqual(Object.keys(usage), ["n", "t"]);
assert.equal(usage.n({ canShowUsageBanners: false }), null);
assert.equal(usage.n({ canShowUsageBanners: true, showUpsell: true, rateLimit: {} }).type, "RateLimitBanner");
assert.equal(usage.n({ canShowUsageBanners: true, showWorkspaceUsageLimit: true, rateLimit: {} }).props.showWorkspaceUsageLimit, true);
assert.equal(usage.n({ canShowUsageBanners: true, imageGenerationLimit: { resetAt: 1 } }).type, "RateLimitBanner");
assert.equal(usage.n({ canShowUsageBanners: true, showModelLimit: true, modelName: "GPT-6" }).type, "ModelLimitBanner");
const warning = usage.n({ canShowUsageBanners: true, rateLimit: { percent: 91 }, rateLimitWarningThreshold: 90 });
assert.equal(warning.type, "RateLimitBanner");
warning.props.onDismissWarning();
assert.deepEqual(usageState.warningDismissals, [{ percent: 91, threshold: 90 }]);
usageState.signal.set("presentation-context", "home");
usageState.family.set('dismissed-banner:"dismiss:[\\"local\\",\\"home\\"]"', false);
const backend = usage.n({ canShowUsageBanners: true, showBackendRateLimitUpsell: true, selectedModel: "gpt", rateLimit: { rate_limit_upsell: { banner_type: "credits", model_slug: "gpt" } } });
assert.equal(backend.type, "div");
assert.equal(backend.props.children.type, "UsageBannerPresentation");
assert.equal(usage.t(), undefined);

// pricing-plan-comparison: 15
const pricing = await bundle("pricing-plan-comparison");
assert.deepEqual(Object.keys(pricing), ["i", "n", "r", "t"]);
assert.equal(pricing.r("free", "plus"), "/checkout?current_plan=free&target_plan=plus");
assert.equal(pricing.r("free_workspace", "plus"), null);
assert.equal(pricing.r("plus", "self_serve_business", "month"), "https://chatgpt.com/business?price_interval=month");
assert.equal(pricing.r("plus", "self_serve_business_usage_based"), "https://chatgpt.com/business/usage");
let selected;
const pricingUi = pricing.t({ currentPlan: "plus", plans: ["free", "plus", "prolite"], offers: { prolite: { price: "$20" } }, onSelectPlan(plan, url) { selected = { plan, url }; } });
assert.equal(pricingUi.props["aria-label"], "Compare plans");
assert.equal(all(pricingUi, node => node.type === "article").length, 3);
assert.equal(find(pricingUi, node => node.props?.["data-plan"] === "plus").props["data-current"], true);
assert.equal(find(pricingUi, node => node.props?.children === "Current plan").props.disabled, true);
assert.match(text(pricingUi), /Pro/);
assert.match(text(pricingUi), /\$20/);
find(pricingUi, node => node.props?.children === "Upgrade to Pro").props.onClick();
assert.equal(selected.plan, "prolite");
assert.match(selected.url, /target_plan=prolite/);
assert.equal(pricing.i(), undefined);
assert.equal(pricing.n(), undefined);

// billing-form-options: 12
const billing = await bundle("billing-form-options");
assert.deepEqual(Object.keys(billing), ["n", "r", "t"]);
const layers = { "1461259566": { payment_method_order: ["card", 2, "paypal"] }, "2160290604": { pe_layout_mode: "accordion", is_google_pay_pe_enabled: true }, "4224149292": { hide_payment_element_name: true } };
const experiments = { getLayer(id) { return { get(key, fallback) { return layers[id]?.[key] ?? fallback; } }; }, getDynamicConfig() { return { get(_key, fallback) { return fallback; } }; } };
const options = billing.t(experiments, { checkoutSessionId: "session", email: "a@example.test", isNewStripeCustomer: true, useMinimalBillingAddress: true });
assert.deepEqual(options.paymentMethodOrder, ["card", "paypal"]);
assert.equal(options.paymentElementLayoutMode, "accordion");
assert.equal(options.shouldHidePaymentElementName, true);
assert.equal(options.isGooglePayEnabled, true);
assert.equal(options.checkoutSessionId, "session");
assert.equal(options.defaultValues.billingDetails.email, "a@example.test");
assert.equal(options.useMinimalBillingAddress, true);
assert.equal(billing.r.PaymentElement, "PaymentElement");
assert.equal(billing.r.Elements, "Elements");
assert.equal(billing.n(), undefined);
const fallbackOptions = billing.t({ getLayer() { return { get(_key, fallback) { return fallback; } }; }, getDynamicConfig() { return { get(_key, fallback) { return fallback; } }; } });
assert.equal(fallbackOptions.paymentElementLayoutMode, "tabs");

// checkout-page-core: 13
const checkout = await bundle("checkout-page-core");
assert.deepEqual(Object.keys(checkout), ["n", "r", "t"]);
assert.equal(checkout.t({ loading: true }).props["aria-busy"], true);
assert.match(text(checkout.t({ accountId: null, userId: "u" })), /Loading checkout/);
let retried = 0;
const errorUi = checkout.t({ accountId: "a", userId: "u", error: "Expired", onRetry() { retried++; } });
assert.equal(errorUi.props.role, "alert");
assert.match(text(errorUi), /Expired/);
find(errorUi, node => node.props?.children === "Try again").props.onClick();
assert.equal(retried, 1);
let opened;
const hostedUi = checkout.t({ accountId: "a", userId: "u", checkoutSessionId: "s", hostedCheckoutUrl: "https://pay.test", returnPath: "/settings", onOpenExternal(url) { opened = url; } });
assert.equal(hostedUi.props["data-return-path"], "/settings");
find(hostedUi, node => node.props?.children === "Continue").props.onClick();
assert.equal(opened, "https://pay.test");
const embeddedUi = checkout.t({ accountId: "a", userId: "u", checkoutSessionId: "s", processorEntity: "OpenAI" });
assert.equal(embeddedUi.props["data-checkout-session"], "s");
assert.match(text(embeddedUi), /Secure payment · OpenAI/);
assert.equal(find(embeddedUi, node => node.props?.["data-payment-element"] === true).type, "div");
assert.equal(checkout.r(), undefined);
assert.equal(find(checkout.n({ url: "https://pay.test" }), node => node.props?.children === "Continue").type, "button");

console.log("50 usage and checkout flow cluster assertions passed");
