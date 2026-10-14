import assert from "node:assert/strict";
import { createBrowserPageWebviewBindingControllerClass } from "../src/main/main-app/browser-sidebar/browser-page-webview-binding-controller.ts";

const calls = [];
const bindPageToWebview = (...args) => calls.push(args);
const Controller = createBrowserPageWebviewBindingControllerClass({ bindPageToWebview });
const host = { marker: "main-host" };
const controller = new Controller(host);
const helpers = { marker: "helpers" };
const windowState = { window: { id: 1 } };
const page = { conversationId: "conversation", browserTabId: "tab" };
const webContents = { id: 42 };

controller.bindPageToWebview(helpers, windowState, page, webContents, "dark", "app");

assert.equal(calls.length, 1);
assert.deepEqual(calls[0], [helpers, windowState, page, webContents, "dark", "app"]);
console.log("browser page webview binding controller tests passed");
