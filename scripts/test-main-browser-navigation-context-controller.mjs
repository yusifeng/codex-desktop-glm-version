import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({ bundle: true, entryPoints: [path.join(root, "src/main/main-app/browser-sidebar/browser-navigation-context-controller.ts")], format: "esm", platform: "node", target: "node22", write: false, logLevel: "silent" });
const { createBrowserNavigationContextControllerClass } = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`);

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const calls = [];
const webContents = { id: 7, isDestroyed: () => false, canGoBack: () => true, canGoForward: () => true, goBack: () => calls.push("back"), goForward: () => calls.push("forward"), loadURL: (url) => calls.push(["load", url]), reload: () => calls.push("reload") };
const host = {
  getCurrentWindowState: () => windowState,
  ensureCurrentWindowState: () => windowState,
  ensureThreadStateForWindow: (_window, conversationId, browserTabId) => {
    const key = `${conversationId}:${browserTabId}`;
    let state = windowState.threads.get(key);
    if (state == null) { state = { conversationId, browserTabId, page: null }; windowState.threads.set(key, state); }
    return state;
  },
  materializeThreadPageState: (_window, state, request) => { state.page = { ...page, pendingUrl: request.page?.url ?? "" }; return state.page; },
  browserUseNavigationRestriction: { isRestrictedForWebContentsId: (id, url, options) => id === 7 && url.includes("blocked") && options.resourceType === "mainFrame" },
};
const windowState = { threads: new Map() };
const page = { title: "Example", url: "https://example.test", pendingUrl: "", view: { webContents }, errorPagesByUrl: new Map(), navigationVersion: 0 };
windowState.threads.set("conv:tab", { conversationId: "conv", browserTabId: "tab", page });
const controller = new (createBrowserNavigationContextControllerClass({ hX: (state, conversationId, browserTabId) => state?.threads.get(`${conversationId}:${browserTabId}`) ?? null, sW: (value) => { value.navigationVersion += 1; }, QU: (value) => value.pendingUrl || value.url }))(host);
equal(controller.getCurrentPageCommandContext({}, "conv", "tab").page, page);
equal(controller.getPageState({}, "conv", "tab"), page);
equal(controller.navigateCurrentPageHistory({}, "conv", "back", "tab"), true);
equal(calls[0], "back");
equal(controller.navigatePageToUrl(page, "https://next.test", "manual", "user"), true);
equal(calls[1], ["load", "https://next.test"]);
equal(page.pendingUrl, "https://next.test");
equal(controller.isRestrictedBrowserNavigation(7, "https://blocked.test"), true);
equal(controller.isRestrictedBrowserNavigation(7, "https://ok.test"), false);
controller.loadBrowserErrorPage(windowState, page, webContents, { failedUrl: "https://failed.test", loadError: { code: -2, failedUrl: "https://failed.test" } });
equal(page.loadError.failedUrl, "https://failed.test");
console.log(`main browser navigation context controller tests passed (${assertions} assertions)`);
