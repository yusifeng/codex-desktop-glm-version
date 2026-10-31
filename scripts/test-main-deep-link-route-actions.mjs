import assert from "node:assert/strict";
import fs from "node:fs";
import {
  findPluginMarketplacePath,
  openBrowserForDeepLink,
} from "../src/main/main-app/deep-links/route-actions.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

function captureBrowserAction(options) {
  const messages = [];
  const window = { id: "window" };
  openBrowserForDeepLink({
    window,
    windowManager: {
      sendMessageToWindow: (target, message) => messages.push({ target, message }),
    },
    ...options,
  });
  return messages;
}

equal(captureBrowserAction({ browserUrl: null }), []);
equal(captureBrowserAction({
  browserActive: false,
  browserTabId: "tab-1",
  browserUrl: "https://example.com",
  conversationId: "conversation",
}), [{
  target: { id: "window" },
  message: {
    type: "open-browser-tab",
    active: false,
    browserTabId: "tab-1",
    conversationId: "conversation",
    initialUrl: "https://example.com",
    source: "manual",
    initiator: "open_in_browser_bridge",
  },
}]);
equal(captureBrowserAction({
  browserActive: false,
  browserUrl: "https://example.com",
}), [{
  target: { id: "window" },
  message: {
    type: "toggle-browser-panel",
    conversationId: undefined,
    open: true,
    url: "https://example.com",
    source: "manual",
    initiator: "open_in_browser_bridge",
  },
}]);
equal(captureBrowserAction({
  browserTabId: "tab-2",
  browserUrl: "https://example.com/path",
  conversationId: "conversation",
  initiator: "external_link",
}), [{
  target: { id: "window" },
  message: {
    type: "toggle-browser-panel",
    browserTabId: "tab-2",
    conversationId: "conversation",
    open: true,
    url: "https://example.com/path",
    source: "manual",
    initiator: "external_link",
  },
}]);

equal(await findPluginMarketplacePath({
  listPlugins: null,
  marketplaceName: "marketplace",
  pluginName: "plugin",
  localMarketplacesOnly: false,
}), null);

const marketplaces = [
  { name: "marketplace", path: null, plugins: [{ name: "plugin" }] },
  { name: "other", path: "/other", plugins: [{ name: "plugin" }] },
  { name: "marketplace", path: "/marketplace", plugins: [{ name: "other" }, { name: "plugin" }] },
];
for (const [localMarketplacesOnly, expectedOptions] of [
  [false, {}],
  [true, { marketplaceKinds: ["local"] }],
]) {
  const calls = [];
  equal(await findPluginMarketplacePath({
    listPlugins: async (options) => {
      calls.push(options);
      return { marketplaces };
    },
    marketplaceName: "marketplace",
    pluginName: "plugin",
    localMarketplacesOnly,
  }), "/marketplace");
  equal(calls, [expectedOptions]);
}

equal(await findPluginMarketplacePath({
  listPlugins: async () => ({ marketplaces }),
  marketplaceName: "marketplace",
  pluginName: "missing",
  localMarketplacesOnly: false,
}), null);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes("openBrowserForDeepLink"), true);
equal(main.includes("findPluginMarketplacePath"), true);
equal(main.includes("function b7("), false);
equal(main.includes("function uit("), false);

console.log(`${assertions} main deep-link route-action assertions passed`);
