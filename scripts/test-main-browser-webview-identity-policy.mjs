import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { build } from "esbuild";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/browser-sidebar/browser-webview-identity-policy.ts",
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserWebviewIdentityPolicy } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);
const policy = createBrowserWebviewIdentityPolicy({
  browserRoutePartitionPrefix: "persist:codex-browser-app-route:",
  hashBrowserStorageId: (value) => `hash:${value}`,
  isInternalEnvironment: (environment) => environment === "internal",
  parseBrowserTabId: (value) => `tab:${value}`,
  webviewPartitionSuffix: ":webview:",
});
let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const session = {};
equal(policy.isTrustedSession(session), false);
policy.markTrustedSession(session);
equal(policy.isTrustedSession(session), true);
equal(policy.isTrustedSession({}), false);
equal(policy.isWebMcpEnabled("internal", false), true);
equal(policy.isWebMcpEnabled("prod", true), true);
equal(policy.isWebMcpEnabled("prod", false), false);
equal(
  policy.basePartition("persist:route:webview:renderer:2"),
  "persist:route",
);
equal(policy.basePartition("persist:route"), "persist:route");
equal(policy.basePartition(null), null);

equal(
  policy.routeFromWebviewParams({
    "data-browser-sidebar-conversation-id": "conversation",
    "data-browser-sidebar-browser-tab-id": "browser",
  }),
  { browserTabId: "tab:browser", conversationId: "conversation" },
);
const encodedRoute = encodeURIComponent("conversation\0browser");
equal(
  policy.routeFromWebviewParams({
    partition: `persist:codex-browser-app-route:${encodedRoute}:webview:renderer:3`,
  }),
  { browserTabId: "tab:browser", conversationId: "conversation" },
);
equal(policy.routeFromWebviewParams({ partition: "persist:other" }), null);
equal(
  policy.routeFromWebviewParams({
    partition: "persist:codex-browser-app-route:%",
  }),
  null,
);
equal(
  policy.hostIdentityFromWebviewParams({
    partition: "persist:route:webview:renderer-id:4",
  }),
  { hostGeneration: 4, rendererInstanceId: "renderer-id" },
);
equal(
  policy.hostIdentityFromWebviewParams({
    partition: "persist:route:webview::4",
  }),
  null,
);
equal(
  policy.hostIdentityFromWebviewParams({
    partition: "persist:route:webview:renderer:0",
  }),
  null,
);
equal(
  policy.makeBrowserStorageId({
    browserTabId: "tab",
    conversationId: "conversation",
  }),
  "hash:conversation\0tab",
);

const sender = new EventEmitter();
sender.mainFrame = { url: "https://example.com" };
const owner = new EventEmitter();
const event = { senderFrame: sender.mainFrame };
policy.resolveSynchronousAnnotationPolicy(
  event,
  sender,
  owner,
  () => ({ enabled: true }),
  () => () => {},
);
equal(event.returnValue, { enabled: true });

const wrongFrameEvent = { senderFrame: { url: "https://example.com" } };
policy.resolveSynchronousAnnotationPolicy(
  wrongFrameEvent,
  sender,
  owner,
  () => ({ enabled: true }),
  () => () => {},
);
equal(wrongFrameEvent.returnValue.enabled, false);

let deferred;
let canceled = false;
let resolved = null;
const pendingEvent = { senderFrame: sender.mainFrame };
policy.resolveSynchronousAnnotationPolicy(
  pendingEvent,
  sender,
  owner,
  () => resolved,
  (callback) => {
    deferred = callback;
    return () => {
      canceled = true;
    };
  },
);
equal(sender.listenerCount("destroyed"), 1);
resolved = { enabled: true, canUseTweaks: true };
deferred();
equal(pendingEvent.returnValue, resolved);
equal(canceled, true);
equal(sender.listenerCount("destroyed"), 0);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-webview-identity-policy.js")',
  ),
  true,
);
equal(main.includes("createBrowserWebviewIdentityPolicy({"), true);
for (const oldOwner of [
  "var jG = new WeakSet()",
  "function pWe(",
  "function mWe(",
  "function hWe(",
  "function MG(",
  "function vWe(",
  "function yWe(",
  "function NG(",
  "function PG(",
]) {
  equal(main.includes(oldOwner), false, `${oldOwner} must be removed`);
}

console.log(
  `main browser webview identity policy tests passed (${assertions} assertions)`,
);
