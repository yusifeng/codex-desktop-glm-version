import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function bundle(directory) { const result = await esbuild.build({ entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")], bundle: true, format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent", plugins: [{ name: "foundation-mocks", setup(build) { build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" })); build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({ contents: importPath === "app-initial" ? "export const kHt=()=>({browser:true});" : "export {};", loader: "js" })); } }] }); return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`); }

// prop-types-runtime: 8
const propTypesModule = await bundle("prop-types-runtime");
assert.deepEqual(Object.keys(propTypesModule), ["t"]);
const propTypes = propTypesModule.t();
assert.equal(propTypes.PropTypes, propTypes);
assert.equal(propTypes.string.isRequired, propTypes.string);
assert.equal(propTypes.arrayOf(), propTypes.any);
assert.throws(() => propTypes.number({}, "age"), /Calling PropTypes validators directly/);
assert.equal(propTypes.number({}, "age", "Thing", "prop", null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"), undefined);
assert.equal(propTypes.checkPropTypes(), undefined);
assert.equal(propTypesModule.t(), propTypes);

// stripe-payment-element-options: 12
const stripe = await bundle("stripe-payment-element-options");
assert.deepEqual(Object.keys(stripe), ["n", "r", "t"]);
assert.equal(stripe.r("oaics_123"), true);
assert.equal(stripe.r("cs_123"), false);
const defaultOptions = stripe.t();
assert.deepEqual(defaultOptions.layout, { type: "tabs" });
assert.deepEqual(defaultOptions.terms, { card: "never" });
const accordion = stripe.t({ fields: { billingDetails: { email: "a@b.com" } } }, { paymentElementLayoutMode: "accordion", shouldHidePaymentElementName: true });
assert.deepEqual(accordion.layout, { type: "accordion", defaultCollapsed: false });
assert.equal(accordion.fields.billingDetails.name, "never");
assert.equal(accordion.fields.billingDetails.email, "a@b.com");
const checkout = stripe.t({ wallets: { applePay: "auto" } }, { checkoutSessionId: "oaics_x", isNewStripeCustomer: true, isGooglePayEnabled: false, paymentMethodOrder: ["card"] });
assert.equal(checkout.fields.billingDetails.address, "never");
assert.equal(checkout.wallets.googlePay, "never");
assert.deepEqual(checkout.paymentMethodOrder, ["card"]);
assert.equal(stripe.n(), undefined);

// tiny-invariant: 5
const invariant = await bundle("tiny-invariant");
assert.deepEqual(Object.keys(invariant), ["n", "t"]);
assert.equal(invariant.n(true), undefined);
assert.throws(() => invariant.n(false), /Invariant failed/);
assert.throws(() => invariant.n(0, "ignored"), /Invariant failed/);
assert.equal(invariant.t(), undefined);

// vite-browser-external: 2
const browserExternal = await bundle("vite-browser-external");
assert.deepEqual(Object.keys(browserExternal), ["default"]);
assert.deepEqual(browserExternal.default, { browser: true });

// portable-thumbnail-font-metrics: 11
const portableFonts = await bundle("portable-thumbnail-font-metrics");
assert.deepEqual(Object.keys(portableFonts), ["a", "c", "i", "n", "o", "r", "s", "t"]);
assert.equal(portableFonts.s(1.25), 0.25);
assert.equal(portableFonts.s(Number.NaN), 0);
assert.equal(portableFonts.t({ family: "Inter", style: "italic", weight: "700" }, 16), "italic 700 16px Inter");
assert.equal(portableFonts.t({ family: "Arial", style: "normal", weight: "normal" }, 12), "12px Arial");
assert.deepEqual(portableFonts.o({ actualBoundingBoxAscent: 70, fontBoundingBoxAscent: 80 }, { actualBoundingBoxDescent: 20, fontBoundingBoxDescent: 30 }, 100), { ascentEm: .7, descentEm: .2, lineGapEm: .2, measuredAtPx: 100 });
assert.deepEqual(portableFonts.o({}, {}, 50), { ascentEm: .8, descentEm: .2, lineGapEm: 0, measuredAtPx: 50 });
let portableNotifications = 0;
const unsubscribePortable = portableFonts.a(() => portableNotifications++);
portableFonts.c();
assert.equal(portableNotifications, 1);
unsubscribePortable(); portableFonts.c();
assert.equal(portableNotifications, 1);
portableFonts.i();
assert.equal(portableFonts.n.getFontKey({ family: "Inter", style: " Italic " }), "italic|normal|normal|Inter");
assert.throws(() => portableFonts.r(), /OffscreenCanvas/);

// thumbnail-worker-font-metrics: 9
const workerFonts = await bundle("thumbnail-worker-font-metrics");
assert.deepEqual(Object.keys(workerFonts), ["a", "i", "n", "o", "r", "s", "t"]);
assert.equal(workerFonts.o(2.75), -0.25);
assert.equal(workerFonts.t({ family: "Aptos", stretch: "condensed" }, 10), "condensed 10px Aptos");
assert.deepEqual(workerFonts.a({ actualBoundingBoxAscent: 8 }, { actualBoundingBoxDescent: 2 }, 10), { ascentEm: .8, descentEm: .2, lineGapEm: 0, measuredAtPx: 10 });
assert.equal(workerFonts.n.getFontKey({ family: "Aptos", weight: "BOLD" }), "normal|bold|normal|Aptos");
let workerNotifications = 0;
const unsubscribeWorker = workerFonts.i(() => workerNotifications++);
workerFonts.s();
assert.equal(workerNotifications, 1);
unsubscribeWorker(); workerFonts.s();
assert.equal(workerNotifications, 1);
workerFonts.n.reset();
assert.equal(workerFonts.n.dispose(), undefined);
assert.throws(() => workerFonts.r(), /OffscreenCanvas/);

console.log("47 runtime payment and font foundation cluster assertions passed");
