import assert from "node:assert/strict";
import fs from "node:fs";
import { transform } from "esbuild";

const source = fs.readFileSync(
  new URL(
    "../src/main/main-app/browser-sidebar/browser-session-service.ts",
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
Function(
  "require",
  "module",
  "exports",
  transpiled.code,
)(
  (specifier) => {
    if (specifier === "../browser-use/navigation-restriction") {
      return {
        isBrowserNavigationResourceType: (resourceType) =>
          resourceType === "mainFrame" || resourceType === "subFrame",
        shouldBlockLocalSubframeNavigation: ({
          currentUrl,
          requestUrl,
          resourceType,
        }) =>
          resourceType === "subFrame" &&
          currentUrl?.startsWith("http://localhost") &&
          !requestUrl.startsWith("http://localhost") &&
          requestUrl !== "about:blank",
      };
    }
    throw new Error(`unexpected require ${specifier}`);
  },
  runtime,
  runtime.exports,
);
const { createBrowserSessionServiceClass, parseBrowserUseChatGptRedirect } =
  runtime.exports;

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

const decodeCalls = [];
const decodeRedirectTarget = (value) => {
  decodeCalls.push(value);
  return value.startsWith("https://") ? `decoded:${value}` : null;
};
equal(
  parseBrowserUseChatGptRedirect(
    "https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fexample.com%2Ftarget%3Fx%3D1",
    decodeRedirectTarget,
  ),
  "decoded:https://example.com/target?x=1",
);
equal(decodeCalls, ["https://example.com/target?x=1"]);
for (const invalid of [
  "not a url",
  "http://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fexample.com",
  "https://evil.example/codex/deeplink?url=https%3A%2F%2Fexample.com",
  "https://chatgpt.com/other?url=https%3A%2F%2Fexample.com",
  "https://user@chatgpt.com/codex/deeplink?url=https%3A%2F%2Fexample.com",
  "https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fexample.com#fragment",
  "https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fa.example&url=https%3A%2F%2Fb.example",
  "https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fexample.com&prompt=ignore",
  "https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fexample.com&path=%2Ftmp",
  "https://chatgpt.com/codex/deeplink?originUrl=x&url=https%3A%2F%2Fexample.com",
]) {
  equal(
    parseBrowserUseChatGptRedirect(invalid, decodeRedirectTarget),
    null,
    invalid,
  );
}

const calls = [];
let permissionPromptHandler;
let permissionRequestHandler;
let permissionCheckHandler;
let notificationHandler;
let restriction;
const browserSession = {
  setPermissionPromptHandler(handler) {
    permissionPromptHandler = handler;
    calls.push("permission-prompt");
  },
  setPermissionRequestHandler(handler) {
    permissionRequestHandler = handler;
    calls.push("permission-request");
  },
  setPermissionCheckHandler(handler) {
    permissionCheckHandler = handler;
    calls.push("permission-check");
  },
  on(event, handler) {
    equal(event, "web-notification-clicked");
    notificationHandler = handler;
    calls.push("notification");
  },
};
const pageStates = new Map([
  [
    7,
    {
      page: { url: "https://example.com/current" },
      threadState: { isAgentControllingBrowser: false },
    },
  ],
  [
    8,
    {
      page: { url: "http://localhost:3000/app" },
      threadState: { isAgentControllingBrowser: false },
    },
  ],
  [
    9,
    {
      page: { url: "http://localhost:3000/app" },
      threadState: { isAgentControllingBrowser: true },
    },
  ],
]);
let routeNavigationDisabled = false;
let browserSettingsBlocked = false;
let restrictedNavigation = false;
const dependencies = {
  decodeRedirectTarget,
  fromPartition(partition, options) {
    calls.push(["from-partition", partition, options]);
    return browserSession;
  },
  getPartitionName: () => "persist:codex-app",
  isBrowserSettingsNavigationBlocked: ({ windows, ...options }) => {
    equal([...windows], ["window"]);
    calls.push(["settings-check", options]);
    return browserSettingsBlocked;
  },
  isRouteNavigationDisabled: () => routeNavigationDisabled,
  routePathForUrl: (url) => (url.startsWith("codex://") ? "/route" : null),
};
const notifications = [];
const prompts = [];
const Service = createBrowserSessionServiceClass(dependencies);
const service = new Service({
  applicationNetwork: {
    addSessionRestriction(session, handler) {
      equal(session, browserSession);
      restriction = handler;
      calls.push("network");
    },
  },
  browserSessionRegistry: { id: "registry" },
  downloadStore: {
    registerSession(options) {
      equal(options.browserSession, browserSession);
      equal(options.browserSessionRegistry, { id: "registry" });
      calls.push("download");
    },
  },
  findPageStateForWebContentsId: (id) => pageStates.get(id) ?? null,
  getWindows: () => ["window"],
  isRestrictedBrowserNavigation: (...args) => {
    calls.push(["restricted-check", ...args]);
    return restrictedNavigation;
  },
  onPermissionPrompt: (...args) => prompts.push(args),
  onWebNotificationClicked: (notification) => notifications.push(notification),
});

equal(service.configure(), browserSession);
equal(
  calls.slice(0, 7).map((entry) => (Array.isArray(entry) ? entry[0] : entry)),
  [
    "from-partition",
    "permission-prompt",
    "permission-request",
    "permission-check",
    "notification",
    "download",
    "network",
  ],
);
equal(service.configure(), browserSession);
equal(
  calls.filter((entry) => Array.isArray(entry) && entry[0] === "from-partition")
    .length,
  2,
);
equal(calls.filter((entry) => entry === "network").length, 1);

permissionPromptHandler("prompt");
equal(prompts, [["prompt"]]);
let permissionAllowed = true;
permissionRequestHandler(null, "camera", (allowed) => {
  permissionAllowed = allowed;
});
equal(permissionAllowed, false);
equal(permissionCheckHandler(), false);
notificationHandler({}, { id: "notice" });
equal(notifications, [{ id: "notice" }]);

equal(
  restriction({
    resourceType: "mainFrame",
    url: "https://chatgpt.com/codex/deeplink?url=https%3A%2F%2Fexample.com%2Fnext",
    webContentsId: 7,
  }),
  { redirectURL: "decoded:https://example.com/next" },
);
equal(
  restriction({
    resourceType: "mainFrame",
    url: "codex://threads/123",
    webContentsId: 7,
  }),
  {
    cancel: true,
  },
);
routeNavigationDisabled = true;
equal(
  restriction({
    resourceType: "mainFrame",
    url: "codex://threads/123",
    webContentsId: 7,
  }),
  {
    cancel: false,
  },
);
browserSettingsBlocked = true;
equal(
  restriction({
    resourceType: "mainFrame",
    url: "https://blocked.example",
    webContentsId: 7,
  }),
  {
    cancel: true,
  },
);
browserSettingsBlocked = false;
equal(
  restriction({
    resourceType: "subFrame",
    url: "https://embed.example",
    webContentsId: 8,
  }),
  {
    cancel: true,
  },
);
equal(
  restriction({
    resourceType: "subFrame",
    url: "https://embed.example",
    webContentsId: 9,
  }),
  {
    cancel: false,
  },
);
restrictedNavigation = true;
equal(
  restriction({
    resourceType: "mainFrame",
    url: "https://restricted.example",
    webContentsId: 7,
  }),
  {
    cancel: true,
  },
);
restrictedNavigation = false;
equal(
  restriction({
    resourceType: "script",
    url: "https://asset.example",
    webContentsId: 7,
  }),
  {
    cancel: false,
  },
);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-session-service.js")',
  ),
  true,
);
equal(main.includes("new BrowserSessionService({"), true);
equal(main.includes("BWe = class"), false);
equal(main.includes("function VWe("), false);

console.log(`browser session service assertions: ${assertions}`);
