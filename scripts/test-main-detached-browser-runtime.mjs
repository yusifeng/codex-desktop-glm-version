import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(new URL("../src/main/main-app/browser-sidebar/detached-browser-runtime.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const { createDetachedBrowserRuntime } = await import(`data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`);
let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const flush = () => new Promise((resolve) => setImmediate(resolve));

class RpcHandlerBase {}
let timerId = 0;
const timers = new Map();
const usingScopeHelper = () => {
  const resources = [];
  let error;
  let failed = false;
  return {
    u(value) { resources.push(value); return value; },
    set e(value) { failed = true; error = value; },
    d() {
      for (const resource of resources.reverse()) resource?.[Symbol.dispose]?.();
      if (failed) throw error;
    },
  };
};
const runtime = createDetachedBrowserRuntime({
  RpcHandlerBase,
  usingScopeHelper,
  setTimeout(callback) { const id = ++timerId; timers.set(id, callback); return id; },
  clearTimeout(id) { timers.delete(id); },
});

let active = true;
let phase = "detached";
let currentUrl = "https://site.test";
const abort = new AbortController();
const revealCalls = [];
const context = {
  request: { content: { kind: "browser", data: { browserTabId: "tab", conversationId: "conversation" } } },
  window: { webContents: "detached-web" },
  sourceWindow: { webContents: "source-web" },
  signal: abort.signal,
  get phase() { return phase; },
  isActive: () => active,
  revealSource: async (focusTask) => { revealCalls.push(focusTask); return true; },
};

let toolbarResourceDisposals = 0;
let sourceDisposals = 0;
let duplicated = 0;
const forwarded = [];
const sourceCalls = [];
let actionResult = true;
let pendingAction = null;
const disposablePromise = (value) => {
  const promise = Promise.resolve(value);
  promise[Symbol.dispose] = () => { sourceCalls.push(["request-disposed"]); };
  return promise;
};
const sourceService = {
  [Symbol.dispose]() { sourceDisposals += 1; },
  recordBrowserAddressCommit: async (input) => { sourceCalls.push(["address", input]); },
  recordBrowserAutocompleteSuggestionsShown: async (input) => { sourceCalls.push(["autocomplete", input]); },
  recordBrowserNavigation: async (input) => { sourceCalls.push(["navigation", input]); },
  getBrowserSiteToolsContext: (input) => disposablePromise({ input, canOpenSources: true }),
  requestBrowserToolbarAction: (input) => {
    sourceCalls.push(["action", input.type]);
    return pendingAction ?? disposablePromise(actionResult);
  },
  forwardBrowserAnnotationMessage: async (input) => { forwarded.push(input); },
};
const toolbar = {
  kind: "browser",
  service: { ...sourceService, dup: () => { duplicated += 1; return sourceService; } },
  [Symbol.dispose]() { toolbarResourceDisposals += 1; },
};
context.source = { get toolbar() { return Promise.resolve(toolbar); } };

const managerCalls = [];
let suspensionResumeCount = 0;
const manager = {
  moveTabToWindow: (input) => { managerCalls.push(["move", input]); return "moved"; },
  suspendImageAttachments: (...args) => {
    managerCalls.push(["suspend", ...args]);
    return { hadPendingDownloads: true, resume: () => { suspensionResumeCount += 1; } };
  },
  getCurrentPageUrl: () => currentUrl,
  closePage: (...args) => managerCalls.push(["close", ...args]),
};
const handler = runtime.createDetachedBrowserKindHandler(manager);
equal(handler.move("move-input"), "moved");
handler.close({ content: { conversationId: "c", browserTabId: "t" }, destinationWindow: { webContents: "destination" } });
equal(managerCalls.slice(0, 2), [["move", "move-input"], ["close", "destination", "c", "t"]]);

const toolbarResult = await handler.createToolbarService(context);
equal(toolbarResult.kind, "browser");
equal(duplicated, 1);
equal(toolbarResourceDisposals, 1, "toolbar acquisition resource must be released after dup");
const service = toolbarResult.service;

service.recordBrowserAddressCommit("address");
service.recordBrowserAutocompleteSuggestionsShown("autocomplete");
service.recordBrowserNavigation("navigation");
await flush();
equal(sourceCalls.slice(0, 3), [["address", "address"], ["autocomplete", "autocomplete"], ["navigation", "navigation"]]);
active = false;
service.recordBrowserNavigation("inactive");
await flush();
equal(sourceCalls.some((call) => call[1] === "inactive"), false);
active = true;

equal(await service.getBrowserSiteToolsContext("tools"), { input: "tools", canOpenSources: true });
equal(sourceCalls.at(-1), ["request-disposed"]);
equal(timers.size, 0, "completed calls clear their timeout");

revealCalls.length = 0;
equal(await service.requestBrowserToolbarAction({ type: "clear-browser-data" }), true);
equal(revealCalls, [], "none actions do not reveal the source");
equal(await service.requestBrowserToolbarAction({ type: "open-settings" }), true);
equal(revealCalls.at(-1), false, "window actions reveal without task focus");
equal(await service.requestBrowserToolbarAction({ type: "submit-browser-tweaks-after-focus" }), true);
equal(revealCalls.at(-1), true, "task actions request task focus");

currentUrl = "https://different.test";
equal(await service.requestBrowserToolbarAction({ type: "open-appgen-site-settings", siteUrl: "https://site.test" }), false);
equal(sourceCalls.at(-1), ["request-disposed"], "site mismatch must not reach the source");
currentUrl = "https://site.test";

let resolveAction;
pendingAction = new Promise((resolve) => { resolveAction = resolve; });
pendingAction[Symbol.dispose] = () => { sourceCalls.push(["pending-disposed"]); };
const staleAction = service.requestBrowserToolbarAction({ type: "open-appgen-site-share", siteUrl: "https://site.test" });
await flush();
currentUrl = "https://other.test";
resolveAction(true);
equal(await staleAction, false, "site URL is checked again after the RPC resolves");
equal(sourceCalls.at(-1), ["pending-disposed"]);

currentUrl = "https://site.test";
pendingAction = new Promise(() => {});
pendingAction[Symbol.dispose] = () => { sourceCalls.push(["timeout-disposed"]); };
const timedOut = service.requestBrowserToolbarAction({ type: "clear-browser-data" });
await flush();
equal(timers.size, 1);
timers.values().next().value();
equal(await timedOut, false);
equal(timers.size, 0);
equal(sourceCalls.at(-1), ["timeout-disposed"]);
pendingAction = null;

const abortController = new AbortController();
const abortContext = { ...context, signal: abortController.signal };
const abortService = (await handler.createToolbarService(abortContext)).service;
const originalSiteTools = sourceService.getBrowserSiteToolsContext;
const abortPending = new Promise(() => {});
abortPending[Symbol.dispose] = () => { sourceCalls.push(["abort-disposed"]); };
sourceService.getBrowserSiteToolsContext = () => abortPending;
const abortedCall = abortService.getBrowserSiteToolsContext("abort");
await flush();
abortController.abort();
equal(await abortedCall, { canOpenSources: false, recentToolCallCount: 0 });
equal(timers.size, 0, "aborted calls clear their timeout and listener path");
equal(sourceCalls.at(-1), ["abort-disposed"]);
sourceService.getBrowserSiteToolsContext = originalSiteTools;
abortService[Symbol.dispose]();

service.forwardBrowserAnnotationMessage({ browserTabId: "wrong", conversationId: "conversation" });
service.forwardBrowserAnnotationMessage({ browserTabId: "tab", conversationId: "conversation", payload: true });
await flush();
equal(forwarded.at(-1).payload, true);
equal(forwarded.length, 1, "annotation forwarding validates detached tab identity");
service[Symbol.dispose]();
equal(sourceDisposals, 2);

const suspension = handler.suspend(context);
await flush();
equal(managerCalls.at(-1), ["suspend", "detached-web", "conversation", "tab"]);
equal(forwarded.at(-1), {
  type: "browser-sidebar-image-attachment-status",
  browserTabId: "tab",
  conversationId: "conversation",
  enabled: false,
  hadPendingDownloads: true,
});
suspension();
await flush();
equal(forwarded.at(-1).enabled, true);
equal(suspensionResumeCount, 1, "attachments resume only after the enable message succeeds");

phase = "restored";
const restoredSuspension = handler.suspend(context);
await flush();
const beforeRestoreForwardCount = forwarded.length;
restoredSuspension();
await flush();
equal(suspensionResumeCount, 2, "restored contexts resume immediately");
equal(forwarded.length, beforeRestoreForwardCount, "restored resume does not send an enable message");
phase = "detached";

const nonBrowserContext = { ...context, source: { toolbar: Promise.resolve({ kind: "terminal", [Symbol.dispose]: () => { toolbarResourceDisposals += 1; } }) } };
equal(await handler.createToolbarService(nonBrowserContext), null);
equal(toolbarResourceDisposals, 6, "every toolbar lease from create/calls/suspends is released");

const detachedContext = {
  content: { kind: "browser", data: { conversationId: "conversation", browserTabId: "tab" } },
  window: { webContents: "found-web" },
};
const detachedManager = { findForSource: (_origin, predicate) => predicate(detachedContext) ? detachedContext : null };
equal(runtime.findDetachedBrowserPageWebContents(detachedManager, "origin", "conversation", "tab"), "found-web");
equal(runtime.findDetachedBrowserPageWebContents(detachedManager, "origin", "conversation", "wrong"), null);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(main.includes("createDetachedBrowserRuntime({"), true);
for (const symbol of ["Qke", "$ke", "eAe", "tAe", "rAe", "YD", "XD"]) equal(new RegExp(`(^|[^A-Za-z0-9_$])${symbol.replace("$", "\\$")}([^A-Za-z0-9_$]|$)`, "m").test(main), false, `${symbol} must be removed`);
equal(windowContext.includes("createDetachedBrowserKindHandler(s)"), true);
equal(windowContext.includes("findDetachedBrowserPageWebContents(c, e, t, n)"), true);

console.log(`${assertions} main detached browser runtime assertions passed`);
