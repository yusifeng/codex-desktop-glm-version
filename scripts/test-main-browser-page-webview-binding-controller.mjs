import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transform } from "esbuild";

const ownerText = readFileSync(new URL("../src/main/main-app/browser-sidebar/browser-page-webview-binding-controller.ts", import.meta.url), "utf8");
const ownerRuntime = await transform(ownerText, { loader: "ts", format: "cjs", target: "es2022" });
const ownerModule = { exports: {} };
Function("module", "exports", ownerRuntime.code)(ownerModule, ownerModule.exports);
const { createBrowserPageWebviewBindingControllerClass } = ownerModule.exports;

const Controller = createBrowserPageWebviewBindingControllerClass({});
const controller = new Controller({ marker: "main-host" });
const helpers = { marker: "helpers" };
const windowState = { window: { id: 1 } };
const page = { conversationId: "conversation", browserTabId: "tab", view: { webContents: { id: 42 } } };
const webContents = { id: 42 };

const source = readFileSync(new URL("../src/main/main-app/browser-sidebar/browser-page-webview-binding-controller.ts", import.meta.url), "utf8");
assert.match(source, /did-navigate/);
assert.match(source, /setWindowOpenHandler/);
assert.match(source, /render-process-gone/);
assert.match(source, /removeListener\(`destroyed`/);
assert.doesNotMatch(source, /generatedBindPageToWebview/);

controller.bindPageToWebview(helpers, windowState, page, webContents, "dark", "app");

assert.deepEqual(controller.getBinding(webContents), { helpers, windowState, page });
controller.disposeBinding(webContents);
assert.equal(controller.getBinding(webContents), null);
console.log("browser page webview binding controller tests passed");
