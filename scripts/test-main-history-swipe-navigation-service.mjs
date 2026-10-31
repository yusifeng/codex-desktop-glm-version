import assert from "node:assert/strict";
import fs from "node:fs";
import { createHistorySwipeNavigationServiceClass } from "../src/main/main-app/window/history-swipe-navigation-service.ts";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

class RpcHandlerBase {
  constructor() { this.rpcBaseInitialized = true; }
}
const HistorySwipeNavigationService = createHistorySwipeNavigationServiceClass({ RpcHandlerBase });
const calls = [];
const windowManager = {
  setHistorySwipeNavigationState(origin, state) {
    calls.push([origin, state]);
    return "ignored-result";
  },
};
const origin = { id: 17 };
const service = new HistorySwipeNavigationService(windowManager, origin);
equal(service instanceof RpcHandlerBase, true);
equal(service.windowManager, windowManager);
equal(service.origin, origin);
equal(service.setHistorySwipeNavigationState({ canGoBack: true, canGoForward: false }), undefined);
equal(calls, [[origin, { canGoBack: true, canGoForward: false }]]);
service.setHistorySwipeNavigationState(null);
equal(calls.at(-1), [origin, null]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes("Xnt = createHistorySwipeNavigationServiceClass({ RpcHandlerBase: n.Uf })"), true);
equal(main.includes("windowNavigation: new Xnt(this.options.windowManager, e)"), true);
equal(main.includes("Xnt = class"), false);

console.log(`${assertions} main history-swipe navigation service assertions passed`);
