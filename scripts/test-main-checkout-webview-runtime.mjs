import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { build } from "esbuild";
import { z } from "zod";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/browser-sidebar/checkout-webview.ts",
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const { createCheckoutWebviewRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);

const sessions = new Map();
const sessionFor = (partition) => {
  if (!sessions.has(partition)) {
    sessions.set(partition, {
      partition,
      clearCalls: [],
      clearStorageData(options) {
        this.clearCalls.push(options);
        return Promise.resolve();
      },
    });
  }
  return sessions.get(partition);
};
const warnings = [];
const openCalls = [];
const runtime = createCheckoutWebviewRuntime({
  authenticateChatGptWebview: async () => {},
  chatGptBaseUrl: () => "https://chatgpt.com",
  chatGptPurchaseUrl: "https://chatgpt.com/codex",
  createLogger: () => () => ({ warning: (...args) => warnings.push(args) }),
  electronSession: { fromPartition: sessionFor },
  openLink: (request) => openCalls.push(request),
  readChatGptPlanFromSession: async () => null,
  shared: {
    wf: (shape) => z.object(shape),
    gf: () => z.boolean(),
    Of: () => z.string(),
    bf: (value) => z.literal(value),
    df: (values) => z.enum(values),
  },
});

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

for (const [partition, expected] of [
  ["codex-checkout", true],
  ["codex-credit-1", true],
  ["codex-pricing-1", true],
  ["persist:other", false],
  [undefined, false],
]) {
  equal(runtime.isCheckoutAttachParams({ partition }), expected);
}

const params = {
  partition: "codex-credit-account",
  disablewebsecurity: "yes",
  webpreferences: "preload=/tmp/preload.js",
};
const preferences = { preload: "/tmp/preload.js", nodeIntegration: true };
equal(
  runtime.hardenCheckoutWebPreferences({ params, webPreferences: preferences }),
  true,
);
equal(preferences.session, sessionFor("codex-credit-account"));
equal(preferences.sandbox, true);
equal(preferences.contextIsolation, true);
equal(preferences.nodeIntegration, false);
equal(preferences.nodeIntegrationInWorker, false);
equal(preferences.disablePopups, false);
equal("preload" in preferences, false);
equal("disablewebsecurity" in params, false);
equal(params.allowpopups, "");

for (const [url, flags, expected] of [
  ["about:blank", [false, false, false, false, false], true],
  [
    "https://chatgpt.com/codex/purchase/credits",
    [false, false, false, false, false],
    true,
  ],
  [
    "https://pay.openai.com/c/pay/session",
    [false, false, true, false, false],
    true,
  ],
  ["https://evil.example/checkout/", [true, true, true, true, true], false],
]) {
  equal(runtime.isAllowedCheckoutNavigation(url, ...flags), expected, url);
}

class FakeDebugger extends EventEmitter {
  attached = false;
  commands = [];
  attach() {
    this.attached = true;
  }
  detach() {
    this.attached = false;
  }
  isAttached() {
    return this.attached;
  }
  async sendCommand(method, params) {
    this.commands.push([method, params]);
    if (method === "Network.getResponseBody")
      return { body: JSON.stringify({ status: "succeeded" }) };
    return {};
  }
}
const debugger_ = new FakeDebugger();
const webContents = new EventEmitter();
Object.assign(webContents, {
  debugger: debugger_,
  destroyed: false,
  session: sessionFor("codex-checkout"),
  getURL: () => "https://chatgpt.com/codex/purchase/credits?prewarm=true",
  isDestroyed() {
    return this.destroyed;
  },
  setWindowOpenHandler(handler) {
    this.windowOpenHandler = handler;
  },
  stop() {},
  async loadURL() {},
});
const owner = new EventEmitter();
const completions = [];
const dispose = runtime.installCheckoutWebviewLifecycle({
  getAuthToken: null,
  onBusinessCheckoutComplete: (value) => completions.push(["business", value]),
  onPersonalCheckoutComplete: (value) => completions.push(["personal", value]),
  onPurchaseCheckoutComplete: (value) => completions.push(["purchase", value]),
  onReturnToCodex: () => completions.push(["return"]),
  owner,
});
const attachParams = { partition: "codex-checkout", src: webContents.getURL() };
const attachPreferences = {};
owner.emit("will-attach-webview", {}, attachPreferences, attachParams);
equal(attachPreferences.session, sessionFor("codex-checkout"));
owner.emit("did-attach-webview", {}, webContents);
equal(debugger_.attached, true);
equal(typeof webContents.windowOpenHandler, "function");
equal(webContents.windowOpenHandler({ url: "javascript:alert(1)" }), {
  action: "deny",
});
equal(webContents.windowOpenHandler({ url: "https://example.com" }), {
  action: "deny",
});
equal(openCalls.length, 1);

debugger_.emit("message", {}, "Network.requestWillBeSent", {
  requestId: "subscription",
  request: {
    method: "POST",
    url: "https://chatgpt.com/backend-api/subscriptions/update",
    postData: JSON.stringify({ updated_plan: "chatgptplusplan" }),
  },
});
debugger_.emit("message", {}, "Network.responseReceived", {
  requestId: "subscription",
  response: { status: 200 },
});
await new Promise((resolve) => setImmediate(resolve));
equal(completions, [["personal", "plus"]]);

webContents.emit("destroyed");
webContents.destroyed = true;
await new Promise((resolve) => setImmediate(resolve));
equal(debugger_.attached, false);
dispose();
equal(owner.listenerCount("will-attach-webview"), 0);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes('require("./main-app/browser-sidebar/checkout-webview.js")'),
  true,
);
equal(main.includes("createCheckoutWebviewRuntime({"), true);
for (const oldOwner of [
  "var NW = r.i(`checkout-webview`)",
  "function IUe(",
  "function RUe(",
  "function BUe(",
  "function VUe(",
  "async function GUe(",
  "function sG(",
]) {
  equal(main.includes(oldOwner), false, `${oldOwner} must be removed`);
}

console.log(
  `main checkout webview runtime tests passed (${assertions} assertions)`,
);
