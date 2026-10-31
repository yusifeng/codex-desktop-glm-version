import assert from "node:assert/strict";
import fs from "node:fs";
import { EventEmitter } from "node:events";
import { build } from "esbuild";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/browser-sidebar/browser-settings-webview-runtime.ts",
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  write: false,
});
const runtime = await import(
  `data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`
);
const {
  createBrowserSettingsWebviewRuntime,
  isAnyBrowserSettingsNavigationUrlAllowed,
  isBrowserSettingsNavigationUrlAllowed,
  parseBrowserSettingsUrl,
} = runtime;

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

equal(
  parseBrowserSettingsUrl("https://example.com/path")?.hostname,
  "example.com",
);
equal(parseBrowserSettingsUrl("not a url"), null);
for (const [navigationUrl, expected] of [
  ["https://example.com/settings", true],
  ["https://example.com/settings/", true],
  ["https://example.com/settings/privacy?tab=1", true],
  ["https://example.com/setting", false],
  ["https://example.com/settings-other", false],
  ["http://example.com/settings", false],
  ["https://other.example/settings", false],
  ["invalid", false],
]) {
  equal(
    isBrowserSettingsNavigationUrlAllowed({
      allowedNavigationUrl: "https://example.com/settings/",
      navigationUrl,
    }),
    expected,
    navigationUrl,
  );
}
equal(
  isAnyBrowserSettingsNavigationUrlAllowed({
    allowedNavigationUrls: ["https://a.example/root", "https://b.example/"],
    navigationUrl: "https://b.example/anything",
  }),
  true,
);

let enabled = true;
const definitions = [
  {
    allowedNavigationUrls: ["https://settings.example/root"],
    canOpenPopup: ({ url }) => url.startsWith("https://allowed.example"),
    isEnabled: () => enabled,
    partition: "persist:settings",
  },
];
const themeCalls = [];
let rejectNextThemeSync = false;
const owners = createBrowserSettingsWebviewRuntime({
  definitions,
  getPartitionName: () => "persist:browser",
  syncColorScheme: async (webContents, themeVariant) => {
    themeCalls.push([webContents.id, themeVariant]);
    if (rejectNextThemeSync) {
      rejectNextThemeSync = false;
      throw Error("theme failed");
    }
  },
});

const pageParams = {
  allowpopups: "yes",
  disablewebsecurity: "yes",
  partition: "old",
  webpreferences: "old",
};
const pagePreferences = {
  allowRunningInsecureContent: true,
  disablePopups: false,
  nodeIntegration: true,
  preload: "old",
};
const browserSession = { id: "session" };
owners.configureBrowserPageWebviewPreferences({
  browserSession,
  params: pageParams,
  preloadPath: "/browser-preload.js",
  webPreferences: pagePreferences,
});
equal(pageParams, { partition: "persist:browser" });
equal(pagePreferences.session, browserSession);
equal(pagePreferences.preload, "/browser-preload.js");
equal(pagePreferences.navigateOnDragDrop, true);
equal(pagePreferences.disablePopups, true);
equal(pagePreferences.sandbox, true);
equal(pagePreferences.devTools, true);
equal(pagePreferences.nodeIntegration, false);
equal(pagePreferences.nodeIntegrationInSubFrames, false);
equal(pagePreferences.nodeIntegrationInWorker, false);
equal(pagePreferences.contextIsolation, true);
equal(pagePreferences.webSecurity, true);
equal(pagePreferences.allowRunningInsecureContent, false);
equal(pagePreferences.webviewTag, false);
equal(pagePreferences.plugins, false);

const settingsParams = {
  allowpopups: "old",
  src: "https://settings.example/root/privacy",
};
const settingsPreferences = { preload: "/unsafe.js" };
owners.configureBrowserSettingsWebviewPreferences({
  browserSession,
  params: settingsParams,
  webPreferences: settingsPreferences,
});
equal(settingsParams.partition, "persist:browser");
equal(settingsParams.allowpopups, "");
equal("preload" in settingsPreferences, false);
equal(settingsPreferences.disablePopups, false);
equal(settingsPreferences.session, browserSession);

equal(
  owners.findBrowserSettingsWebviewDefinition({
    partition: "persist:settings",
    src: "https://settings.example/root/privacy",
  }),
  definitions[0],
);
enabled = false;
equal(
  owners.findBrowserSettingsWebviewDefinition({
    partition: "persist:settings",
    src: "https://settings.example/root/privacy",
  }),
  null,
);
enabled = true;
equal(
  owners.findBrowserSettingsWebviewDefinition({
    partition: "persist:other",
    src: "https://settings.example/root/privacy",
  }),
  null,
);

const state = {
  browserSettingsWebContentsByWebContentsId: new Map(),
  browserSettingsWebviewAllowedNavigationUrlsByWebContentsId: new Map(),
  browserSettingsWebviewNavigationDisposersByWebContentsId: new Map(),
  browserSettingsWebviewThemeVariant: "light",
  pendingBrowserSettingsWebviewsByInstanceId: new Map([[7, definitions[0]]]),
};
equal(
  owners.takePendingBrowserSettingsWebview(
    { viewInstanceId: "invalid" },
    state,
  ),
  null,
);
equal(
  owners.takePendingBrowserSettingsWebview({ viewInstanceId: "7" }, state),
  definitions[0],
);
equal(state.pendingBrowserSettingsWebviewsByInstanceId.size, 0);
equal(
  owners.takePendingBrowserSettingsWebview({ viewInstanceId: "7" }, state),
  null,
);

class FakeWebContents extends EventEmitter {
  constructor(id) {
    super();
    this.id = id;
    this.closed = false;
    this.loaded = [];
  }
  setWindowOpenHandler(handler) {
    this.windowOpenHandler = handler;
  }
  loadURL(url) {
    this.loaded.push(url);
    return this.rejectLoad
      ? Promise.reject(Error("load failed"))
      : Promise.resolve();
  }
  close() {
    this.closed = true;
  }
}
const webContents = new FakeWebContents(41);
const opened = [];
owners.bindBrowserSettingsWebview({
  browserSettingsWebview: definitions[0],
  openBrowserSettingsUrlInTab: (url) => opened.push(url),
  state,
  webContents,
});
equal(state.browserSettingsWebContentsByWebContentsId.get(41), webContents);
equal(
  state.browserSettingsWebviewAllowedNavigationUrlsByWebContentsId.get(41),
  ["https://settings.example/root"],
);
equal(
  typeof state.browserSettingsWebviewNavigationDisposersByWebContentsId.get(41),
  "function",
);
equal(webContents.windowOpenHandler({ url: "https://allowed.example/page" }), {
  action: "deny",
});
equal(webContents.windowOpenHandler({ url: "https://blocked.example/page" }), {
  action: "deny",
});
equal(opened, ["https://allowed.example/page"]);

await new Promise((resolve) => setImmediate(resolve));
equal(themeCalls, [[41, "light"]]);
rejectNextThemeSync = true;
webContents.emit("did-finish-load");
state.browserSettingsWebviewThemeVariant = "dark";
webContents.emit("did-finish-load");
await new Promise((resolve) => setImmediate(resolve));
await new Promise((resolve) => setImmediate(resolve));
equal(themeCalls, [
  [41, "light"],
  [41, "light"],
  [41, "dark"],
]);

const allowedEvent = {
  isMainFrame: true,
  url: "https://settings.example/root/child",
  prevented: false,
  preventDefault() {
    this.prevented = true;
  },
};
webContents.emit("will-frame-navigate", allowedEvent);
equal(allowedEvent.prevented, false);
const blockedEvent = {
  isMainFrame: true,
  url: "https://evil.example/",
  prevented: false,
  preventDefault() {
    this.prevented = true;
  },
};
webContents.emit("will-frame-navigate", blockedEvent);
equal(blockedEvent.prevented, true);
const subframeEvent = {
  isMainFrame: false,
  url: "https://evil.example/",
  prevented: false,
  preventDefault() {
    this.prevented = true;
  },
};
webContents.emit("will-frame-navigate", subframeEvent);
equal(subframeEvent.prevented, false);
webContents.emit("did-navigate", {}, "https://evil.example/");
await Promise.resolve();
equal(webContents.loaded, ["https://settings.example/root"]);
webContents.emit("did-navigate-in-page", {}, "https://evil.example/", false);
equal(webContents.loaded, ["https://settings.example/root"]);

equal(
  owners.isBrowserSettingsNavigationBlocked({
    webContentsId: 41,
    windows: [
      { browserSettingsWebviewAllowedNavigationUrlsByWebContentsId: new Map() },
      state,
    ],
    url: "https://evil.example/",
  }),
  true,
);
equal(
  owners.isBrowserSettingsNavigationBlocked({
    webContentsId: 41,
    windows: [state],
    url: "https://settings.example/root/child",
  }),
  false,
);
equal(
  owners.isBrowserSettingsNavigationBlocked({
    webContentsId: null,
    windows: [state],
    url: "https://evil.example/",
  }),
  false,
);

const themeCount = themeCalls.length;
owners.updateBrowserSettingsThemeVariant(state, "dark");
await Promise.resolve();
equal(themeCalls.length, themeCount);
owners.updateBrowserSettingsThemeVariant(state, "contrast");
await new Promise((resolve) => setImmediate(resolve));
equal(themeCalls.at(-1), [41, "contrast"]);

state.browserSettingsWebviewNavigationDisposersByWebContentsId.get(41)();
equal(state.browserSettingsWebContentsByWebContentsId.size, 0);
equal(state.browserSettingsWebviewAllowedNavigationUrlsByWebContentsId.size, 0);
equal(state.browserSettingsWebviewNavigationDisposersByWebContentsId.size, 0);
equal(webContents.listenerCount("did-finish-load"), 0);
equal(webContents.listenerCount("will-frame-navigate"), 0);
equal(webContents.listenerCount("destroyed"), 0);

const failingWebContents = new FakeWebContents(42);
failingWebContents.rejectLoad = true;
owners.bindBrowserSettingsWebview({
  browserSettingsWebview: definitions[0],
  openBrowserSettingsUrlInTab: () => undefined,
  state,
  webContents: failingWebContents,
});
failingWebContents.emit("did-navigate", {}, "https://evil.example/");
await new Promise((resolve) => setImmediate(resolve));
equal(failingWebContents.closed, true);
failingWebContents.emit("destroyed");
equal(state.browserSettingsWebContentsByWebContentsId.has(42), false);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-settings-webview-runtime.js")',
  ),
  true,
);
equal(main.includes("createBrowserSettingsWebviewRuntime({"), true);
for (const oldOwner of [
  "function CWe(",
  "function wWe(",
  "function zG(",
  "function TWe(",
  "function EWe(",
  "function DWe(",
  "function BG(",
  "function OWe(",
  "function VG(",
  "function kWe(",
  "function AWe(",
  "function HG(",
  "function jWe(",
  "function UG(",
  "function MWe(",
  "function WG(",
]) {
  equal(main.includes(oldOwner), false, oldOwner);
}

console.log(`browser settings webview runtime assertions: ${assertions}`);
