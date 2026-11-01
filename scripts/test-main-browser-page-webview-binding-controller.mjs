import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { transform } from "esbuild";

const ownerText = readFileSync(new URL("../src/main/main-app/browser-sidebar/browser-page-webview-binding-controller.ts", import.meta.url), "utf8");
const ownerRuntime = await transform(ownerText, { loader: "ts", format: "cjs", target: "es2022" });
const ownerModule = { exports: {} };
Function("module", "exports", ownerRuntime.code)(ownerModule, ownerModule.exports);
const {
  createAnnotationContextMenuActions,
  createBrowserPageWebviewBindingControllerClass,
} = ownerModule.exports;

const annotationKinds = { BATCH: "batch", QUICK: "quick" };
assert.deepEqual(createAnnotationContextMenuActions(annotationKinds), {
  batch: {
    action: "annotate",
    annotationModeEntrySource: "context-menu-annotate",
  },
  quick: {
    action: "quick-annotate",
    annotationModeEntrySource: "context-menu-quick-annotate",
  },
});

const Controller = createBrowserPageWebviewBindingControllerClass({ n: { gu: annotationKinds } });
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
assert.match(source, /annotationContextMenuActions\[a\]/);
assert.doesNotMatch(source, /\baZe\b/);
assert.doesNotMatch(source, /\$U\(/);
assert.doesNotMatch(source, /\$X\(\)/);
assert.match(source, /matchesLoadError\(page\.loadError, url\)/);
assert.match(source, /logger\(\)\.info/);
assert.match(source, /resolveBrowserUseOpenRequests\?\.\(t\)/);

const runtimeSyncSource = readFileSync(
  new URL("../src/main/main-app/browser-sidebar/browser-runtime-sync-controller.ts", import.meta.url),
  `utf8`,
);
assert.match(
  runtimeSyncSource,
  /resolveBrowserUseOpenRequests:\s*bind\(`resolveBrowserUseOpenRequests`\)/,
);

const mainSource = readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
assert.doesNotMatch(mainSource, /\baZe\s*=\s*\{/);

controller.bindPageToWebview(helpers, windowState, page, webContents, "dark", "app");

assert.deepEqual(controller.getBinding(webContents), { helpers, windowState, page });
controller.disposeBinding(webContents);
assert.equal(controller.getBinding(webContents), null);
console.log("browser page webview binding controller tests passed");
