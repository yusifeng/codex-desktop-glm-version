import assert from "node:assert/strict";
import { createBrowserPageLookupControllerClass } from "../src/main/main-app/browser-sidebar/browser-page-lookup-controller.ts";

const webContents = { id: 17 };
const pageState = { page: { view: { webContents } } };
const owner = {
  browserPageHostLifecycle: {
    findPageStateForWebContentsId(id) {
      return id === 17 ? pageState : null;
    },
  },
};
const Controller = createBrowserPageLookupControllerClass({});
const controller = new Controller(owner);

assert.equal(controller.isBrowserPageWebContents(webContents), true);
assert.equal(controller.isBrowserPageWebContents({ id: 17 }), false);
assert.equal(controller.isBrowserPageWebContents({ id: 18 }), false);
console.log("browser page lookup controller tests passed");
