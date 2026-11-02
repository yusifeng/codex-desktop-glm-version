import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import { assertReleaseOwner } from "./release-owner-test-helpers.mjs";

const root = path.resolve(import.meta.dirname, "..");
const publishedRoot = "/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets";
const modules = [
  ["consent-1e345bc20d6a.js", "chatgpt-ads-consent-boundary", ["ChatGptAdsConsentBoundary"]],
];
const dependencyAliases = new Map([["ad-control-dialog-runtime", "control-dialog"], ["ads-controls-state", "state"]]);
const normalize = (name) => { const base = name.replace(/-[a-f0-9]{12}$/u, ""); return dependencyAliases.get(base) ?? base; };
const dependencies = (source, pattern) => [...source.matchAll(pattern)].map((match) => normalize(match[1]));
let assertions = 0;
for (const [asset, directory] of modules) {
  const original = fs.readFileSync(path.join(publishedRoot, asset), "utf8");
  const recovered = fs.readFileSync(path.join(root, "src/renderer", directory, "index.ts"), "utf8");
  assert.deepEqual(dependencies(original, /from "\.\/([^".]+(?:-[^".]+)?)\.js"/gu), dependencies(recovered, /(?:from\s*|import\s*)["']@rchunk\/([^"']+)/gu));
  assert.equal((original.match(/import\(/gu) ?? []).length, (recovered.match(/import\(/gu) ?? []).length);
  assert.equal(/(?:\bas\s+any\b|:\s*any\b|<any>)|@ts-(?:expect-error|nocheck)/u.test(recovered), false);
  assert.ok(recovered.includes("Release chunk: " + asset));
  assert.equal(/from\s+["']\./u.test(recovered), false);
  assertions += 5;
}

const exportsByAlias = {
  "rolldown-runtime": [],
  "app-shared": ["$3", "$h", "C_", "FX", "G2", "HX", "I3", "If", "Ih", "K2", "LX", "Oh", "QI", "Rh", "Y2", "Yh", "ZI", "Zh", "_L", "c_", "dZ", "e6", "fg", "h4", "iL", "lw", "m4", "n4", "rL", "sZ", "wL", "zh"],
  "app-initial": ["$qt", "Bfn", "Bqt", "Dft", "Dqt", "Hln", "M6t", "N6t", "Oqt", "Qgn", "Rln", "Sqt", "Sun", "U6t", "Ugn", "Wgn", "Xet", "Ygn", "Zet", "_Et", "_un", "bqt", "bsn", "gfn", "h0", "i_n", "iot", "j6t", "k6t", "kft", "mfn", "o_n", "p0", "pdn", "pfn", "rot", "udn", "ugn", "uun", "v4", "vfn", "xpn", "ypn", "zqt"],
  "ad-control-dialog-runtime": ["a", "d", "i", "n", "o", "s", "u"],
  "ads-controls-state": ["a", "i"],
  "app-primary": ["bc", "dc", "uc", "yc"],
};
globalThis.__nlMocks = Object.create(null);
async function load(directory) {
  const entry = path.join(root, "src/renderer", directory, "index.ts");
  const output = path.join(os.tmpdir(), "nl-" + directory + "-" + process.pid + "-" + Date.now() + "-" + Math.random() + ".mjs");
  await esbuild.build({ entryPoints: [entry], outfile: output, bundle: true, format: "esm", platform: "node", plugins: [{ name: "nl-mocks", setup(build) {
    build.onResolve({ filter: /^@rchunk\// }, (args) => ({ path: args.path.slice(8), namespace: "nl-mock" }));
    build.onLoad({ filter: /.*/, namespace: "nl-mock" }, ({ path: alias }) => ({ loader: "js", contents: (exportsByAlias[alias] ?? []).map((name) => "export const " + name + "=globalThis.__nlMocks[" + JSON.stringify(alias) + "][" + JSON.stringify(name) + "]").join(";\n") }));
  } }] });
  return import(pathToFileURL(output).href + "?v=" + Date.now());
}
const noop = () => {};
const jsx = { Fragment: "Fragment", jsx: (type, props, key) => ({ type, props, key }), jsxs: (type, props, key) => ({ type, props, key }) };
const createSharedBase = () => ({ $3: noop, $h: noop, C_: noop, FX: noop, G2: noop, I3: () => jsx, If: noop, Ih: "Dialog", K2: noop, Oh: "DialogBody", QI: noop, Rh: "Text", Y2: "Message", Yh: "Button", ZI: Symbol("scope"), Zh: noop, c_: noop, e6: () => ({ useRef: (value) => ({ current: value }), useState: (value) => [value, noop] }), fg: () => false, h4: noop, lw: noop, m4: (...classes) => classes.filter(Boolean).join(" "), n4: () => ({}), rL: noop, wL: noop, zh: noop });

let consentState = { status: "inactive" };
const consentScope = { get: () => consentState, set: noop };
let analyticsEvents = [];
let saveCalls = [];
let consentMutation;
let consentSignal;
globalThis.__nlMocks["app-shared"] = { ...createSharedBase(), HX: () => consentState.status === "identity" ? "user-1" : consentState, LX: () => consentScope, dZ: () => Symbol("config"), sZ: (_scope, reader) => { consentSignal = { reader }; return consentSignal; }, iL: (options) => { consentMutation = options; return { mutate: (selection) => { void options.mutationFn(selection).then(options.onSuccess); }, isPending: false, data: undefined }; } };
globalThis.__nlMocks["app-initial"] = { $qt: noop, Bqt: { CHATGPT_ADS_CONSENT_MODAL_ACTION_TYPE_MODAL_SHOWN: "shown", CHATGPT_ADS_CONSENT_MODAL_ACTION_TYPE_SAVE_PERSONALIZATION_ENABLED: "enabled", CHATGPT_ADS_CONSENT_MODAL_ACTION_TYPE_SAVE_PERSONALIZATION_DISABLED: "disabled" }, Dqt: (value) => value, Oqt: noop, Qgn: noop, Sqt: noop, Sun: noop, U6t: Symbol(), Xet: Symbol(), Zet: noop, _un: Symbol(), bqt: Symbol(), gfn: Symbol(), i_n: () => ({ pathname: "/chat" }), mfn: Symbol(), pfn: noop, vfn: Symbol(), xpn: (_scope, _signal, event) => analyticsEvents.push(event), ypn: noop, zqt: Symbol() };
globalThis.__nlMocks["ad-control-dialog-runtime"] = { a: noop, d: () => "Consent description", i: noop, n: "ConsentError", o: { scope: "scope" }, s: noop, u: "ConsentOptions" };
globalThis.__nlMocks["ads-controls-state"] = { a: async (...args) => { saveCalls.push(args); return true; }, i: noop };
const consent = await load("chatgpt-ads-consent-boundary");
assert.deepEqual(Object.keys(consent), ["ChatGptAdsConsentBoundary"]);
let result = consent.ChatGptAdsConsentBoundary({ children: "content" });
assert.equal(result.type, "Fragment");
assert.equal(result.props.children, "content");
consentState = { status: "loading" };
assert.equal(consent.ChatGptAdsConsentBoundary({ children: "content" }), null);
consentState = { status: "required", accountId: "account-1", variant: "restaurants", isTwoStep: true };
result = consent.ChatGptAdsConsentBoundary({ children: "content" });
assert.equal(typeof result.type, "function");
const modal = result.type(result.props);
assert.equal(modal.type, "Dialog");
modal.props.contentProps.onOpenAutoFocus();
assert.equal(analyticsEvents.at(-1).action, "shown");
modal.props.children.props.children[1].props.onSave("personalized");
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(saveCalls.length, 1);
assert.equal(saveCalls[0][2].value, true);
assert.equal(analyticsEvents.at(-1).action, "enabled");
assert.equal(consentMutation != null, true);
assertions += 12;

assertions += assertReleaseOwner("conversation-header", [
  /open-recent-tasks-menu/,
  /recent-tasks-filter/,
  /export \{ ot as Header \}/,
]);

assertions += assertReleaseOwner("workspace-recovery-gate-electron");

assert.deepEqual(Object.keys(consent), ["ChatGptAdsConsentBoundary"]);
assertions += 1;
console.log("misc-ui-utils NL: " + assertions + " assertions passed across " + modules.length + " modules.");
