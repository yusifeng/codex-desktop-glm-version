import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL(
    "../src/main/main-app/browser-sidebar/browser-use-open-request-registry.ts",
    import.meta.url,
  ),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "cjs",
  target: "es2022",
});
const runtime = { exports: {} };
Function("module", "exports", transpiled.code)(runtime, runtime.exports);
const { BrowserUseOpenRequestRegistry } = runtime.exports;

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const events = [];
const logs = [];
const clearedTimers = [];
const timers = [];
const registry = new BrowserUseOpenRequestRegistry({
  clearTimer: (timer) => clearedTimers.push(timer),
  logger: () => ({
    info: (...args) => logs.push(["info", ...args]),
    warning: (...args) => logs.push(["warning", ...args]),
  }),
  recordDebugEvent: (event) => events.push(event),
  setTimer(callback, timeoutMs) {
    const timer = {
      callback,
      timeoutMs,
      unrefCalled: false,
      unref() {
        this.unrefCalled = true;
      },
    };
    timers.push(timer);
    return timer;
  },
  timeoutMs: 321,
});

const owner = { id: 10 };
const firstPromise = registry.waitForOpen(owner, "conversation-1", "tab-1");
equal(timers[0].timeoutMs, 321);
equal(timers[0].unrefCalled, true);
equal(events[0].kind, "browser-open-wait-started");
equal(logs[0][0], "info");
equal(registry.getDebugSnapshot(), [
  {
    activeBrowserTabId: null,
    activeConversationId: null,
    browserTabId: "tab-1",
    conversationId: "conversation-1",
    guestWebContentsId: null,
    hasPage: null,
    ownerWebContentsId: 10,
    ownerRoutePath: null,
    pendingAttachCount: null,
    pendingBrowserUsePanelOpen: null,
    routeActive: null,
    windowId: null,
  },
]);

const page = {
  browserTabId: "tab-1",
  pageKey: "page-key-1",
  webContents: { id: 91 },
};
let resolverCalls = 0;
registry.resolveForWindow({ owner: { id: 999 } }, () => {
  resolverCalls += 1;
  return page;
});
equal(resolverCalls, 0);
registry.resolveForWindow({ owner: { id: 10 } }, (request) => {
  resolverCalls += 1;
  equal(request.conversationId, "conversation-1");
  return page;
});
equal(await firstPromise, page);
equal(registry.getDebugSnapshot(), []);
equal(clearedTimers, [timers[0]]);
equal(events.at(-1).kind, "browser-open-wait-resolved");
equal(events.at(-1).guestWebContentsId, 91);

const routeRejected = registry.waitForOpen(owner, "conversation-2", "tab-2");
const ignored = registry.waitForOpen(owner, "conversation-3", "tab-3");
const routeError = Error("route closed");
registry.rejectForRoute({
  browserTabId: "tab-2",
  conversationId: "conversation-2",
  error: routeError,
  owner,
});
await assert.rejects(routeRejected, routeError);
assertions += 1;
equal(
  registry.getDebugSnapshot().map((item) => item.browserTabId),
  ["tab-3"],
);
equal(events.at(-1).kind, "browser-open-wait-rejected");
equal(events.at(-1).details, [
  { label: "errorMessage", value: "route closed" },
]);

const ownerError = Error("owner disposed");
registry.rejectForOwner({ id: 10 }, ownerError);
await assert.rejects(ignored, ownerError);
assertions += 1;
equal(registry.getDebugSnapshot(), []);

const timedOut = registry.waitForOpen({ id: 20 }, "conversation-4", "tab-4");
timers.at(-1).callback();
await assert.rejects(
  timedOut,
  /Timed out waiting for the Browser webview to attach for this browser-use page/,
);
assertions += 1;
equal(events.at(-2).kind, "browser-open-wait-timeout");
equal(events.at(-1).kind, "browser-open-wait-rejected");
equal(registry.getDebugSnapshot(), []);
equal(logs.at(-2)[1], "IAB_LIFECYCLE browser use open wait timed out");
equal(logs.at(-1)[1], "IAB_LIFECYCLE browser use open wait rejected");

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-use-open-request-registry.js")',
  ),
  true,
);
equal(main.includes("new BrowserUseOpenRequestRegistry({"), true);
equal(main.includes("UWe = class"), false);
equal(main.includes("browser-open-wait-timeout"), false);

console.log(`browser use open request registry assertions: ${assertions}`);
