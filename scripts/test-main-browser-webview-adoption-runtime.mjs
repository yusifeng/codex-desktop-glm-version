import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

const output = await build({
  entryPoints: [
    new URL(
      "../src/main/main-app/browser-sidebar/browser-webview-adoption-runtime.ts",
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
  BROWSER_WEBVIEW_ADOPTION_LEASE,
  BROWSER_WEBVIEW_ADOPTED_WEB_CONTENTS_ID,
  attachPendingAdoptedWebview,
  getAdoptedWebContentsId,
  getAttachedWebviewInstanceId,
  getWebviewInstanceId,
  hasWebviewAdoptionLease,
  parsePositiveWebviewInstanceId,
  takePendingWebviewRoute,
} = runtime;

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};

equal(BROWSER_WEBVIEW_ADOPTION_LEASE, "owl-webcontents-adoption-lease");
equal(
  BROWSER_WEBVIEW_ADOPTED_WEB_CONTENTS_ID,
  "owl-webcontents-adopted-web-contents-id",
);
for (const [value, expected] of [
  [1, 1],
  ["2", 2],
  [2.5, null],
  [0, null],
  [-1, null],
  ["", null],
  ["invalid", null],
  [null, null],
]) {
  equal(parsePositiveWebviewInstanceId(value), expected);
}
equal(getWebviewInstanceId({ instanceId: "7" }), 7);
equal(getAttachedWebviewInstanceId({ viewInstanceId: "8" }), 8);
equal(
  hasWebviewAdoptionLease({ [BROWSER_WEBVIEW_ADOPTION_LEASE]: "lease" }),
  true,
);
equal(hasWebviewAdoptionLease({ [BROWSER_WEBVIEW_ADOPTION_LEASE]: "" }), false);
equal(hasWebviewAdoptionLease({ [BROWSER_WEBVIEW_ADOPTION_LEASE]: 1 }), false);
equal(
  getAdoptedWebContentsId({ [BROWSER_WEBVIEW_ADOPTED_WEB_CONTENTS_ID]: "91" }),
  91,
);
equal(
  getAdoptedWebContentsId({ [BROWSER_WEBVIEW_ADOPTED_WEB_CONTENTS_ID]: "bad" }),
  null,
);

const pendingRoutes = new Map([
  [7, { route: "route-7" }],
  [8, undefined],
]);
const routeState = { pendingWebviewRoutesByInstanceId: pendingRoutes };
equal(takePendingWebviewRoute({ viewInstanceId: "bad" }, routeState), null);
equal(pendingRoutes.size, 2);
equal(takePendingWebviewRoute({ viewInstanceId: "7" }, routeState), {
  route: "route-7",
});
equal(pendingRoutes.has(7), false);
equal(takePendingWebviewRoute({ viewInstanceId: "8" }, routeState), null);
equal(pendingRoutes.has(8), false);
equal(takePendingWebviewRoute({ viewInstanceId: "7" }, routeState), null);

const makeWebContents = (id) => ({
  id,
  destroyed: false,
  calls: [],
  isDestroyed() {
    return this.destroyed;
  },
  goBack() {
    this.calls.push("back");
  },
  goForward() {
    this.calls.push("forward");
  },
  reload() {
    this.calls.push("reload");
  },
});
const routeKey = (route) => `${route.conversationId}:${route.browserTabId}`;

const destroyed = makeWebContents(1);
destroyed.destroyed = true;
equal(
  attachPendingAdoptedWebview({
    attachWebview: () => {
      throw Error("must not attach");
    },
    routeKey,
    state: {
      pendingAdoptedWebviewsByWebContentsId: new Map(),
      threads: new Map(),
    },
    webContents: destroyed,
  }),
  false,
);

const missingIdentity = makeWebContents(2);
equal(
  attachPendingAdoptedWebview({
    attachWebview: () => {
      throw Error("must not attach");
    },
    routeKey,
    state: {
      pendingAdoptedWebviewsByWebContentsId: new Map([
        [2, { acceptedHostIdentity: null }],
      ]),
      threads: new Map(),
    },
    webContents: missingIdentity,
  }),
  false,
);

for (const navigation of ["back", "forward", "reload", "none"]) {
  const webContents = makeWebContents(10 + assertions);
  const route = {
    browserTabId: `tab-${navigation}`,
    conversationId: "conversation",
  };
  const errorPagesByUrl = new Map([["https://failed.example", "error"]]);
  const page = { errorPagesByUrl: new Map(), view: { webContents } };
  const calls = [];
  const pending = {
    acceptedHostIdentity: { hostGeneration: 3, rendererInstanceId: "renderer" },
    initialHistoryNavigation: { errorPagesByUrl, navigation },
    route,
    stopTracking: () => calls.push("stop"),
  };
  const state = {
    pendingAdoptedWebviewsByWebContentsId: new Map([[webContents.id, pending]]),
    threads: new Map([[routeKey(route), { page }]]),
  };
  equal(
    attachPendingAdoptedWebview({
      attachWebview: (attached, identity) => {
        calls.push("attach");
        equal(attached, webContents);
        equal(identity, {
          hostGeneration: 3,
          rendererInstanceId: "renderer",
          route,
          initialNavigationOwner: "history-clone",
        });
      },
      routeKey,
      state,
      webContents,
    }),
    true,
  );
  equal(calls, ["attach", "stop"]);
  equal(page.errorPagesByUrl, errorPagesByUrl);
  equal(webContents.calls, navigation === "none" ? [] : [navigation]);
}

const noHistoryWebContents = makeWebContents(50);
const noHistoryRoute = {
  browserTabId: "tab-no-history",
  conversationId: "conversation",
};
const noHistoryCalls = [];
equal(
  attachPendingAdoptedWebview({
    attachWebview: (_attached, identity) => {
      noHistoryCalls.push(identity.initialNavigationOwner);
    },
    routeKey,
    state: {
      pendingAdoptedWebviewsByWebContentsId: new Map([
        [
          50,
          {
            acceptedHostIdentity: { hostGeneration: 4 },
            initialHistoryNavigation: null,
            route: noHistoryRoute,
            stopTracking: () => noHistoryCalls.push("stop"),
          },
        ],
      ]),
      threads: new Map(),
    },
    webContents: noHistoryWebContents,
  }),
  true,
);
equal(noHistoryCalls, ["owl", "stop"]);
equal(noHistoryWebContents.calls, []);

const mismatchedWebContents = makeWebContents(60);
const mismatchedRoute = {
  browserTabId: "tab-mismatch",
  conversationId: "conversation",
};
equal(
  attachPendingAdoptedWebview({
    attachWebview: () => undefined,
    routeKey,
    state: {
      pendingAdoptedWebviewsByWebContentsId: new Map([
        [
          60,
          {
            acceptedHostIdentity: { hostGeneration: 5 },
            initialHistoryNavigation: {
              errorPagesByUrl: new Map(),
              navigation: "reload",
            },
            route: mismatchedRoute,
            stopTracking: () => undefined,
          },
        ],
      ]),
      threads: new Map([
        [
          mismatchedRoute.conversationId + ":" + mismatchedRoute.browserTabId,
          { page: { view: { webContents: makeWebContents(61) } } },
        ],
      ]),
    },
    webContents: mismatchedWebContents,
  }),
  true,
);
equal(mismatchedWebContents.calls, []);

const destroyedDuringAttach = makeWebContents(70);
const destroyedRoute = {
  browserTabId: "tab-destroyed",
  conversationId: "conversation",
};
equal(
  attachPendingAdoptedWebview({
    attachWebview: () => {
      destroyedDuringAttach.destroyed = true;
    },
    routeKey,
    state: {
      pendingAdoptedWebviewsByWebContentsId: new Map([
        [
          70,
          {
            acceptedHostIdentity: { hostGeneration: 6 },
            initialHistoryNavigation: {
              errorPagesByUrl: new Map(),
              navigation: "back",
            },
            route: destroyedRoute,
            stopTracking: () => undefined,
          },
        ],
      ]),
      threads: new Map([
        [
          routeKey(destroyedRoute),
          { page: { view: { webContents: destroyedDuringAttach } } },
        ],
      ]),
    },
    webContents: destroyedDuringAttach,
  }),
  true,
);
equal(destroyedDuringAttach.calls, []);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(
  main.includes(
    'require("./main-app/browser-sidebar/browser-webview-adoption-runtime.js")',
  ),
  true,
);
equal(main.includes("attachPendingAdoptedWebview({"), true);
for (const oldOwner of [
  "function GG(",
  "function KG(",
  "function qG(",
  "function NWe(",
  "function PWe(",
  "function FWe(",
  "function IWe(",
]) {
  equal(main.includes(oldOwner), false, oldOwner);
}

console.log(`browser webview adoption runtime assertions: ${assertions}`);
