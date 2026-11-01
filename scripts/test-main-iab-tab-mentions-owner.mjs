import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/browser-sidebar/iab-tab-mentions.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find(
  (node) => node.type === "ClassDeclaration" && node.id?.name === "IabTabMentions",
);
assert.ok(classNode);
assertions += 1;
equal(classNode.body.body.length, 24);

class EventEmitterBase {}
class UnsubscribeOnce {
  constructor(unsubscribe) { this.unsubscribeOnce = unsubscribe; }
  unsubscribe() { const callback = this.unsubscribeOnce; this.unsubscribeOnce = null; callback?.(); }
  [Symbol.dispose]() { this.unsubscribe(); }
}
const providerKey = (connection, includeGeneration) => JSON.stringify([
  connection.providerInfo.protocolVersion,
  connection.providerInfo.browserFamily,
  connection.providerInfo.buildChannel,
  connection.providerInfo.extensionId,
  connection.providerInfo.profileInstanceId,
  ...(includeGeneration ? [connection.providerInfo.generation] : []),
]);
const classSource = transpiled.code.slice(classNode.start, classNode.end);
const dependencies = {
  EventEmitterBase,
  defaultChromeProviderConnector: () => async () => [],
  tabMentionSearchSchema: { safeParse: (data) => ({ success: true, data }) },
  chromeTabLivenessSchema: { safeParse: (data) => ({ success: true, data }) },
  chromeTabFocusSchema: { safeParse: (data) => ({ success: true, data }) },
  candidateLimitForQuery: () => 5,
  dedupeTabCandidates: (candidates) => candidates,
  browserPluginDescriptor: { browser: "browser-plugin" },
  UnsubscribeOnce,
  connectionKeyWithGeneration: (connection) => providerKey(connection, true),
  connectionProfileKey: (connection) => providerKey(connection, false),
  CHROME_DISCOVERY_INTERVAL_MS: 5_000,
};
const IabTabMentions = Function(
  ...Object.keys(dependencies),
  `${classSource}; return IabTabMentions;`,
)(...Object.values(dependencies));

let closed = 0;
let focused = null;
let closeListener;
let invalidationListener;
let removedListeners = 0;
const connection = {
  providerInfo: {
    protocolVersion: "1",
    browserFamily: "chrome",
    buildChannel: "prod",
    extensionId: "extension-1",
    profileInstanceId: "profile-1",
    generation: "generation-1",
  },
  client: {
    async getUserTabs({ query }) {
      return [
        {
          browserId: "profile-1",
          id: "native-tab-1",
          providerTabId: "tab-1",
          title: `Chrome ${query}`,
          url: "https://example.test",
          lastOpened: "2026-10-31T00:00:00.000Z",
        },
      ];
    },
    async focusTab(tabId) { focused = tabId; },
    addCloseListener(listener) {
      closeListener = listener;
      return () => { removedListeners += 1; };
    },
    addInvalidationListener(listener) {
      invalidationListener = listener;
      return () => { removedListeners += 1; };
    },
    isClosed: () => false,
    close: () => { closed += 1; },
  },
};
const origin = new EventEmitter();
origin.id = 101;
let unsubscribeIab = 0;
let iabInvalidation;
const service = new IabTabMentions(
  {
    async search() {
      return {
        candidates: [
          {
            browserId: "iab",
            browserFamily: "iab",
            faviconUrl: null,
            pluginId: "browser-plugin",
            recency: 1,
            snapshot: { title: "IAB", url: "https://iab.test" },
            source: "iab",
            tabId: "iab-tab",
          },
        ],
      };
    },
    subscribeInvalidations(listener) {
      iabInvalidation = listener;
      return () => { unsubscribeIab += 1; };
    },
  },
  origin,
  async () => [connection],
);

const search = await service.search({ conversationId: "thread-1", query: "docs" });
equal(search.candidates.length, 2);
equal(search.candidates[1].snapshot.title, "Chrome docs");
equal(search.candidates[1].tabId, "tab-1");
equal(
  await service.getChromeTabLiveness({
    extensionInstanceId: "profile-1",
    tabIds: ["native-tab-1", "missing"],
  }),
  { status: "available", liveTabIds: ["native-tab-1"] },
);
await service.focusChromeTab({ extensionInstanceId: "profile-1", tabId: "tab-1" });
equal(focused, "tab-1");

const invalidations = [];
let streamDisposed = 0;
const stream = {
  dup() { return this; },
  onRpcBroken(listener) { this.broken = listener; },
  call() { invalidations.push("invalidated"); },
  [Symbol.dispose]() { streamDisposed += 1; },
};
const subscription = service.subscribeInvalidations(stream);
equal(typeof iabInvalidation, "function");
iabInvalidation();
invalidationListener();
equal(invalidations.length, 0);
// The RPC stream itself is callable in production; Reflect/app RPC wrappers expose invocation.
service.listeners.clear();
service.listeners.add(Object.assign(() => invalidations.push("invalidated"), stream));
iabInvalidation();
equal(invalidations, ["invalidated"]);
subscription.unsubscribe();
origin.emit("destroyed");
equal(service.disposed, true);
equal(closed, 1);
equal(removedListeners, 2);
equal(unsubscribeIab, 1);
equal(typeof closeListener, "function");

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('const { IabTabMentions } = require("./main-app/browser-sidebar/iab-tab-mentions.js")'), true);
equal(main.includes("HOe = class"), false);
equal(main.includes("browserTabs: new HOe(s.iabTabMentions, e)"), false);
const windowContext = fs.readFileSync(
  new URL("../src/main/main-app/window/window-context.ts", import.meta.url),
  "utf8",
);
equal(windowContext.includes("browserTabs: new IabTabMentions(s.iabTabMentions, e)"), true);

console.log(`${assertions} main IAB tab mentions owner assertions passed`);
