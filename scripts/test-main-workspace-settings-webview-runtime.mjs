import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { build } from "esbuild";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/browser-sidebar/workspace-settings-webview-runtime.ts",
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createWorkspaceSettingsWebviewRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const sessions = new Map();
const sessionFor = (partition) => {
  if (!sessions.has(partition))
    sessions.set(partition, {
      clearCalls: 0,
      async clearStorageData() {
        this.clearCalls += 1;
      },
    });
  return sessions.get(partition);
};
const authCalls = [];
const openCalls = [];
const warnings = [];
const runtime = createWorkspaceSettingsWebviewRuntime({
  authenticateChatGptWebview: async (request) => authCalls.push(request),
  chatGptBaseUrl: () => "https://chatgpt.com",
  createLogger: () => () => ({ warning: (...args) => warnings.push(args) }),
  electronSession: { fromPartition: sessionFor },
  isSafeExternalUrl: (url) => url.startsWith("https://"),
  openLink: (request) => openCalls.push(request),
  partitionPrefix: "codex-workspace-settings-",
});

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

equal(
  runtime.isWorkspaceSettingsAttachParams({
    partition: "codex-workspace-settings-one",
  }),
  true,
);
equal(runtime.isWorkspaceSettingsAttachParams({ partition: "other" }), false);
equal(runtime.isWorkspaceAdminUrl("https://chatgpt.com/admin"), true);
equal(runtime.isWorkspaceAdminUrl("https://chatgpt.com/admin/settings"), true);
equal(runtime.isWorkspaceAdminUrl("https://chatgpt.com/codex"), false);
equal(runtime.isAllowedWorkspaceSettingsNavigation("about:blank"), true);
equal(
  runtime.isAllowedWorkspaceSettingsNavigation(
    "https://chatgpt.com/api/auth/session",
  ),
  true,
);
equal(
  runtime.isAllowedWorkspaceSettingsNavigation(
    "https://chatgpt.com/checkout/value",
  ),
  true,
);
equal(
  runtime.isAllowedWorkspaceSettingsNavigation("https://evil.example/admin"),
  false,
);

const bootstrap =
  "about:blank?toUrl=https%3A%2F%2Fchatgpt.com%2Fadmin%2Fworkspace&accountId=acct&routingOverride=EU_1";
equal(runtime.parseWorkspaceSettingsBootstrap(bootstrap), {
  accountId: "acct",
  routingOverride: "eu_1",
  url: "https://chatgpt.com/admin/workspace",
});
equal(
  runtime.parseWorkspaceSettingsBootstrap(
    "about:blank?toUrl=https://evil.example/admin&accountId=acct",
  ),
  null,
);

const owner = new EventEmitter();
const dispose = runtime.installWorkspaceSettingsWebviewLifecycle({
  getAuthToken: async () => "token",
  onReturnToCodex: () => {},
  owner,
});
const params = {
  partition: "codex-workspace-settings-account",
  src: bootstrap,
  disablewebsecurity: "yes",
  webpreferences: "preload=x",
};
const preferences = { preload: "x" };
owner.emit("will-attach-webview", {}, preferences, params);
equal(preferences.session, sessionFor(params.partition));
equal(preferences.sandbox, true);
equal(preferences.nodeIntegrationInWorker, false);
equal("preload" in preferences, false);
equal(params.allowpopups, "");

const webContents = new EventEmitter();
Object.assign(webContents, {
  session: sessionFor(params.partition),
  destroyed: false,
  getURL: () => bootstrap,
  isDestroyed() {
    return this.destroyed;
  },
  async loadURL(url) {
    this.loadedUrl = url;
  },
  setWindowOpenHandler(handler) {
    this.windowOpenHandler = handler;
  },
});
owner.emit("did-attach-webview", {}, webContents);
await new Promise((resolve) => setTimeout(resolve, 10));
equal(authCalls.length, 1, JSON.stringify(warnings));
equal(authCalls[0].accountId, "acct");
equal(authCalls[0].workspaceRoutingOverride, "eu_1");
equal(typeof webContents.windowOpenHandler, "function");
runtime.updateWorkspaceSettingsPresentation(owner, {
  partition: params.partition,
  presented: true,
});
equal(webContents.windowOpenHandler({ url: "https://example.com/help" }), {
  action: "deny",
});
equal(openCalls.length, 1);
equal(
  webContents.windowOpenHandler({ url: "https://chatgpt.com/admin/billing" }),
  { action: "deny" },
);
await new Promise((resolve) => setImmediate(resolve));
equal(webContents.loadedUrl, "https://chatgpt.com/admin/billing");

webContents.emit("destroyed");
webContents.destroyed = true;
dispose();
equal(owner.listenerCount("will-attach-webview"), 0);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/workspace-settings-webview-runtime.js")',
  ),
  true,
);
equal(main.includes("createWorkspaceSettingsWebviewRuntime({"), true);
for (const oldOwner of [
  "var vG = r.i(`workspace-settings-webview`)",
  "function lWe(",
  "function uWe(",
  "function dWe(",
  "async function fWe(",
  "function OG(",
  "function kG(",
]) {
  equal(main.includes(oldOwner), false, `${oldOwner} must be removed`);
}

console.log(
  `main workspace settings webview runtime tests passed (${assertions} assertions)`,
);
