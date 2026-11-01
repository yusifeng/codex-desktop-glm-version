import assert from "node:assert/strict";
import fs from "node:fs";
import * as esbuild from "esbuild";

const entry = "src/renderer/app-primary-browser-comment-runtime/index.ts";
const result = await esbuild.build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
  logLevel: "silent",
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected, message) => {
  assertions += 1;
  assert.deepEqual(actual, expected, message);
};

let stateFamilyCreates = 0;
const stateSignal = Symbol("browser-tab-url-state");
runtime.initializeBrowserTabUrlState(() => { stateFamilyCreates += 1; return stateSignal; }, Symbol("app-scope"));
runtime.initializeBrowserTabUrlState(() => { stateFamilyCreates += 1; return Symbol("wrong"); }, Symbol("other-scope"));
const stateValues = new Map();
const stateScope = {
  get: (signal, key) => signal === stateSignal ? stateValues.get(key) : undefined,
  set: (signal, key, value) => { assert.equal(signal, stateSignal); stateValues.set(key, value); },
};
equal(stateFamilyCreates, 1);
runtime.setBrowserTabUrlState(stateScope, "thread", "tab", { isOpen: true, url: "  https://example.com/  " });
equal(runtime.getBrowserTabUrlState(stateScope, "thread", "tab"), { currentUrls: ["https://example.com/"], isOpen: true });
runtime.setBrowserTabUrlState(stateScope, "thread", "tab", { isOpen: false, url: "   " });
equal(runtime.getBrowserTabUrlState(stateScope, "thread", "tab"), { currentUrls: [], isOpen: false });
equal(runtime.getBrowserTabUrlState(stateScope, null, "tab"), null);
equal(runtime.getBrowserTabUrlState(stateScope, "thread", undefined), null);

equal(runtime.hasBrowserCommentHandler("thread", "tab"), false);
equal(runtime.submitBrowserComment({ conversationId: "thread", browserTabId: "tab" }), null);

const aborted = new AbortController();
aborted.abort();
equal(await runtime.waitForBrowserCommentHandler("thread", "tab", aborted.signal, 100), false);
equal(await runtime.waitForBrowserCommentHandler("thread", "tab", new AbortController().signal, 1), false);

const waiting = runtime.waitForBrowserCommentHandler("thread", "tab", new AbortController().signal, 100);
let readinessNotifications = 0;
const disposeReadiness = runtime.subscribeBrowserCommentReadiness("thread", () => { readinessNotifications += 1; });
const disposeOther = runtime.registerBrowserCommentHandler("thread", {
  acceptsTab: (tabId) => tabId === "other",
  submit: async () => "other",
});
const dispose = runtime.registerBrowserCommentHandler("thread", {
  acceptsTab: (tabId) => tabId === "tab",
  submit: async (message) => message.payload,
});
equal(await waiting, true);
equal(readinessNotifications, 2);
equal(runtime.hasBrowserCommentHandler("thread", "tab"), true);
equal(await runtime.submitBrowserComment({ conversationId: "thread", browserTabId: "tab", payload: "sent" }), "sent");
dispose();
equal(runtime.hasBrowserCommentHandler("thread", "tab"), false);
disposeOther();
disposeReadiness();

const disposeEmpty = runtime.registerBrowserContextProvider("thread", () => null);
const disposeContext = runtime.registerBrowserContextProvider("thread", (request) => ({ id: request.id }));
equal(runtime.resolveBrowserContext({ conversationId: "thread", id: 7 }), { id: 7 });
disposeContext();
equal(runtime.resolveBrowserContext({ conversationId: "thread", id: 7 }), undefined);
disposeEmpty();

const hubSource = fs.readFileSync("src/webview/assets/app-primary-d66705000d76.ts", "utf8");
const consumerSource = fs.readFileSync("src/renderer/detached-browser-annotation-host/index.ts", "utf8");
const registrySource = fs.readFileSync("src/renderer/source-annotation-host-registry/index.ts", "utf8");
equal(hubSource.includes('from "./source-annotation-host-registry-60c474ef605e.js"'), true);
equal(hubSource.includes("return recoveredRegisterBrowserCommentHandler(e, t)"), true);
equal(hubSource.includes("return recoveredWaitForBrowserCommentHandler(e, t, n, r)"), true);
equal(registrySource.includes('from "../app-primary-browser-comment-runtime"'), true);
equal(consumerSource.includes("initializeRegistry.browserComments"), true);
equal(/\bKs:|\bUs:|\bVs:/.test(consumerSource), false);

console.log(`app-primary browser-comment runtime tests passed (${assertions} assertions)`);
