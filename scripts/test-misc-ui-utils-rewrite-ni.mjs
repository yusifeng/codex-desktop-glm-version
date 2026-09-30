import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(import.meta.dirname, "..");
const publishedRoot = "/Users/david/Workspace/ppio_github/chatgpt-desktop-src/app/webview/assets";
const modules = [
  ["export-6cf67894f30b.js", "image-markup-export", ["i", "n", "r", "t"]],
  ["draft-state-b6af9e5f8526.js", "business-agent-draft-state", ["i", "n", "r", "t"]],
  ["deferred-verification-banner-e314c15c65cb.js", "deferred-clinician-verification-banner", ["DeferredClinicianVerificationBanner"]],
];
const dependencyAliases = new Map([["cfc-persona-verification", "persona"]]);
const normalizeDependency = (name) => {
  const normalized = name.replace(/-[a-f0-9]{12}$/u, "");
  return dependencyAliases.get(normalized) ?? normalized;
};
const dependencies = (source, pattern) => [...source.matchAll(pattern)].map((match) => normalizeDependency(match[1]));
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

const exportNames = {
  "rolldown-runtime": [],
  "app-initial": ["Dan", "Ert", "krt", "Sqt", "Sun", "U6t", "_un", "agn", "cJt", "cqt", "dun", "lqt", "mun", "ngn", "rJt", "rgn", "sgn", "uun", "vun", "Qgn", "aNt", "iNt", "i_n", "n7", "nNt", "oNt", "r7", "rNt"],
  "app-shared": ["g4", "vW", "wL", "$3", "BX", "FX", "HX", "I3", "K2", "LX", "QI", "Y2", "Yh", "ZI", "Zh", "e6", "gx", "lk", "lw", "pk"],
  sketch: ["d", "i", "m", "t"],
  "cfc-persona-verification": ["n", "t"],
};
globalThis.__niMocks = Object.create(null);
async function load(directory) {
  const entry = path.join(root, "src/renderer", directory, "index.ts");
  const output = path.join(os.tmpdir(), "ni-" + directory + "-" + process.pid + "-" + Date.now() + "-" + Math.random() + ".mjs");
  await esbuild.build({
    entryPoints: [entry], outfile: output, bundle: true, format: "esm", platform: "node",
    plugins: [{ name: "ni-rchunk-mocks", setup(build) {
      build.onResolve({ filter: /^@rchunk\// }, (args) => ({ path: args.path.slice(8), namespace: "ni-mock" }));
      build.onLoad({ filter: /.*/, namespace: "ni-mock" }, ({ path: alias }) => ({
        loader: "js",
        contents: (exportNames[alias] ?? []).map((name) => "export const " + name + "=globalThis.__niMocks[" + JSON.stringify(alias) + "][" + JSON.stringify(name) + "]").join(";\n"),
      }));
    } }],
  });
  return import(pathToFileURL(output).href + "?v=" + Date.now());
}

for (const [, directory, expectedExports] of modules) {
  if (directory === "deferred-clinician-verification-banner") continue;
  if (directory === "image-markup-export") {
    globalThis.__niMocks["app-initial"] = { Dan: async () => "blob:preview", Ert: async () => null, krt() {} };
    globalThis.__niMocks.sketch = { d: () => [], i: async () => ({ kind: "failed" }), m: () => ({ x: 0, y: 0 }), t() {} };
  } else {
    globalThis.__niMocks["app-shared"] = { g4() {}, vW: "OpenAI-Project-ID", wL() {} };
    globalThis.__niMocks["app-initial"] = { Sqt() {}, Sun() {}, U6t: Symbol(), _un: Symbol(), agn() {}, cJt() {}, cqt: { parse: (value) => value }, dun: () => Symbol(), lqt() {}, mun: Symbol(), ngn: () => ({}), rJt: { safePost: async () => ({}) }, rgn() {}, sgn: async () => {}, uun() {}, vun: Symbol() };
  }
  const loaded = await load(directory);
  assert.deepEqual(Object.keys(loaded).sort(), [...expectedExports].sort());
  assertions += 1;
}

let imageInitializerCalls = 0;
let renderOptions;
const markupDocument = { id: "document" };
const renderedBlob = new Blob(["overlay"], { type: "image/png" });
globalThis.__niMocks["app-initial"] = {
  Dan: async (blob) => { assert.equal(blob, renderedBlob); return "blob:markup"; },
  Ert: async (source, options) => { assert.equal(source, "https://example.test/image.png"); assert.ok(options.signal); return { blob: new Blob(["source"]) }; },
  krt: () => { imageInitializerCalls += 1; },
};
globalThis.__niMocks.sketch = {
  d: (document) => { assert.equal(document, markupDocument); return [{ text: "Inspect this" }]; },
  i: async (_document, options) => { renderOptions = options; return { kind: "success", blob: renderedBlob, width: options.maxDimension, height: options.maxDimension / 2 }; },
  m: () => ({ x: 512, y: 128 }),
  t: () => { imageInitializerCalls += 1; },
};
const imageMarkup = await load("image-markup-export");
imageMarkup.i(); imageMarkup.i();
assert.equal(imageInitializerCalls, 2);
assert.deepEqual(imageMarkup.r({ width: 2000, height: 1000 }), { width: 1024, height: 512 });
assert.equal(await imageMarkup.n(markupDocument, { width: 0, height: 10 }, ""), null);
const exported = await imageMarkup.n(markupDocument, { width: 1024, height: 512 }, "  Extra context  ");
assert.equal(exported.overlay, renderedBlob);
assert.equal(exported.promptText, "1. (x: 50.0%, y: 25.0%) Inspect this\n\nExtra context");
assert.deepEqual(renderOptions.outputBounds, { x: 0, y: 0, width: 1024 - 1e-6, height: (512 - 1e-6) });
assert.equal(renderOptions.maxPixelCount, 1024 * 512);
let bitmapClosed = false;
globalThis.createImageBitmap = async () => ({ width: 1024, height: 512, close: () => { bitmapClosed = true; } });
const preview = await imageMarkup.t("https://example.test/image.png", markupDocument, new AbortController().signal, {});
assert.deepEqual(preview, { src: "blob:markup", prompt: "1. (x: 50.0%, y: 25.0%) Inspect this" });
assert.equal(bitmapClosed, true);
assert.equal(typeof renderOptions.drawBackground, "function");
assertions += 11;

const accountSignal = Symbol("account");
const userSignal = Symbol("user");
const sessionAccountSignal = Symbol("session-account");
const accessSignal = Symbol("access");
const persistedSignal = Symbol("persisted");
const store = Object.create(null);
let initializerCalls = 0;
let lastPost;
globalThis.__niMocks["app-shared"] = { g4: () => { initializerCalls += 1; }, vW: "OpenAI-Project-ID", wL: () => { initializerCalls += 1; } };
globalThis.__niMocks["app-initial"] = {
  Sqt: () => { initializerCalls += 1; }, Sun: () => { initializerCalls += 1; }, U6t: accountSignal, _un: userSignal, cJt: () => { initializerCalls += 1; }, lqt: () => { initializerCalls += 1; }, mun: sessionAccountSignal, rgn: () => { initializerCalls += 1; }, uun: () => { initializerCalls += 1; }, vun: accessSignal,
  agn: (_key, update) => { for (const [key, entry] of Object.entries(update.entries)) { if (entry == null) delete store[key]; else store[key] = entry.value; } },
  cqt: { parse: (value) => value }, dun: () => persistedSignal, ngn: () => ({ ...store }), sgn: async () => {},
  rJt: { safePost: async (url, options) => { lastPost = { url, options }; return { business_agent_id: "agent-1", underlying_gizmo_id: "gizmo-1", interaction_id: "interaction-1", privacy_policy_url: "https://privacy.test" }; } },
};
const scopeValues = new Map([[accountSignal, "account-1"], [userSignal, "user-1"], [sessionAccountSignal, "account-1"], [accessSignal, { status: "allowed", accountId: "account-1" }]]);
let unwatchCalls = 0;
const draftScope = {
  get: (signal) => scopeValues.get(signal),
  set: (signal, value) => scopeValues.set(signal, value),
  when: async (predicate) => { assert.equal(predicate({ get: draftScope.get }), true); },
  watch: () => () => { unwatchCalls += 1; },
};
const drafts = await load("business-agent-draft-state");
drafts.t(); drafts.t();
assert.equal(initializerCalls, 8);
const draftInput = { userId: "user-1", accountId: "account-1", context: { businessAgentId: "agent-1", gizmoId: "gizmo-1", interactionId: "interaction-1", showConversationStarters: true } };
assert.equal(drafts.i(draftScope, "interaction-1", draftInput), true);
assert.equal(Object.keys(store).length, 1);
assert.ok(Object.values(store)[0].expiresAt > Date.now());
const recovered = await drafts.n(draftScope, "interaction-1", "gizmo-1");
assert.equal(recovered.status, "ready");
assert.equal(recovered.context.privacyPolicyUrl, "https://privacy.test");
assert.equal(recovered.context.animateDisclosure, false);
assert.equal(lastPost.url, "/gizmos/business-agents/{business_agent_id}/interactions");
assert.equal(lastPost.options.additionalHeaders["ChatGPT-Account-ID"], "account-1");
assert.equal(lastPost.options.additionalHeaders["OpenAI-Project-ID"], "account-1");
assert.equal(unwatchCalls, 1);
drafts.r(draftScope, "interaction-1");
assert.equal(Object.keys(store).length, 0);
await assert.rejects(() => drafts.n(draftScope, "interaction-1", "gizmo-1"), { name: "Error" });
assertions += 13;

const dialogSignal = Symbol("dialog");
const querySignal = Symbol("query");
const requirementSignal = Symbol("requirement");
const toastSignal = Symbol("toast");
let requirement = null;
let dialogState = "closed";
let personaOptions;
let personaDisposed = 0;
let refetches = 0;
let retries = 0;
let toastErrors = 0;
let effectCleanup;
const dialogTransitions = [];
const bannerScope = {
  get: (signal) => { assert.equal(signal, toastSignal); return { danger: () => { toastErrors += 1; } }; },
  set: (signal, identity, value) => { assert.equal(signal, dialogSignal); assert.deepEqual(identity, requirement.identity); dialogState = value; dialogTransitions.push(value); },
};
const jsxRuntime = { jsx: (type, props, key) => ({ type, props, key }) };
let bannerInitializerCalls = 0;
globalThis.__niMocks["app-shared"] = {
  $3: () => { bannerInitializerCalls += 1; }, FX: () => { bannerInitializerCalls += 1; }, K2: () => { bannerInitializerCalls += 1; }, QI: () => { bannerInitializerCalls += 1; }, Zh: () => { bannerInitializerCalls += 1; }, lk: () => { bannerInitializerCalls += 1; }, lw: () => { bannerInitializerCalls += 1; },
  e6: () => ({ useEffect: (effect) => { effectCleanup = effect(); } }), I3: () => jsxRuntime, LX: () => bannerScope, HX: () => requirement,
  BX: (signal) => signal === dialogSignal ? dialogState : { refetch: () => { refetches += 1; } },
  Y2: "TranslatedMessage", Yh: "Button", ZI: Symbol("scope"), gx: "VerificationIcon", pk: toastSignal,
};
globalThis.__niMocks["app-initial"] = {
  Qgn: () => { bannerInitializerCalls += 1; }, aNt: () => { bannerInitializerCalls += 1; }, iNt: dialogSignal, i_n: () => ({ pathname: "/chat" }), n7: "Banner", nNt: querySignal, oNt: () => { retries += 1; }, r7: () => { bannerInitializerCalls += 1; }, rNt: requirementSignal,
};
globalThis.__niMocks["cfc-persona-verification"] = { n: (options) => { personaOptions = options; return () => { personaDisposed += 1; }; }, t: () => { bannerInitializerCalls += 1; } };
const banner = await load("deferred-clinician-verification-banner");
assert.deepEqual(Object.keys(banner), ["DeferredClinicianVerificationBanner"]);
assert.equal(bannerInitializerCalls, 11);
assert.equal(banner.DeferredClinicianVerificationBanner(), null);
requirement = { required: true, accountError: true, identity: { accountId: "account-1", userId: "user-1" } };
const errorBanner = banner.DeferredClinicianVerificationBanner();
assert.equal(errorBanner.type, "Banner");
errorBanner.props.onPrimaryCtaClick();
assert.equal(retries, 1);
requirement = { required: true, identity: { accountId: "account-1", userId: "user-1" } };
dialogState = "open";
const identityElement = banner.DeferredClinicianVerificationBanner();
assert.equal(identityElement.key, "account-1:user-1");
const announcementElement = identityElement.type(identityElement.props);
assert.deepEqual(dialogTransitions, ["loading"]);
assert.equal(personaOptions.accountId, "account-1");
personaOptions.onLoad();
assert.equal(dialogTransitions.at(-1), "open");
personaOptions.onComplete();
assert.equal(dialogTransitions.at(-1), "closed");
assert.equal(refetches, 1);
const renderedAnnouncement = announcementElement.type(announcementElement.props);
assert.equal(renderedAnnouncement.type, "Banner");
assert.equal(renderedAnnouncement.props.customCtas.type, "Button");
renderedAnnouncement.props.customCtas.props.onClick();
assert.equal(retries, 2);
personaOptions.onError();
assert.equal(toastErrors, 1);
effectCleanup();
assert.equal(personaDisposed, 1);
assert.equal(dialogTransitions.at(-1), "closed");
assertions += 17;

console.log("misc-ui-utils NI: " + assertions + " assertions passed across " + modules.length + " modules.");
