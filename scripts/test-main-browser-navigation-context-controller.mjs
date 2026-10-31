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
const webContents = { id: 7, isDestroyed: () => false, isLoading: () => false, canGoBack: () => true, canGoForward: () => true, goBack: () => calls.push("back"), goForward: () => calls.push("forward"), loadURL: (url, options) => { calls.push(["load", url, options]); return Promise.resolve(); }, reload: () => calls.push("reload"), navigationHistory: { getAllEntries: () => [{ url: "https://kept.test" }] } };
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
  getThreadStateForWindow: (state, conversationId, browserTabId) => state.threads.get(`${conversationId}:${browserTabId}`),
  windowManager: {}, errorReporter: { reportNonFatal: (...args) => calls.push(["report", ...args]) },
  syncThreadState: (...args) => calls.push(["sync", ...args]), enforceDetachedPageBudget: (...args) => calls.push(["budget", ...args]),
};
const windowState = { owner: {}, threads: new Map() };
const page = { browserTabId: "tab", conversationId: "conv", title: "Example", url: "https://example.test", pendingUrl: "", view: { webContents }, errorPagesByUrl: new Map([["old", { failedUrl: "https://gone.test" }]]), navigationVersion: 0, mediaIndicator: { reset: () => calls.push("media-reset") }, pendingNavigationUsage: { expectedUrl: "https://failed.test" } };
windowState.threads.set("conv:tab", { conversationId: "conv", browserTabId: "tab", page });
const controller = new (createBrowserNavigationContextControllerClass({ hX: (state, conversationId, browserTabId) => state?.threads.get(`${conversationId}:${browserTabId}`) ?? null, sW: (value) => { value.navigationVersion += 1; }, QU: (value) => value.pendingUrl || value.url, fq: () => calls.push("find-close"), matchesLoadError: (error, url) => error.failedUrl === url, normalizeUrl: (url) => url, resetCaptureState: (value) => { value.isCapturingUserMedia = false; }, clearSiteTools: () => calls.push("tools-clear"), serializePageState: (value) => value, shouldIgnoreLoadError: () => false, shouldRetryLoadError: () => false, logger: () => ({ warning: (...args) => calls.push(["warning", ...args]) }), setTimer: (callback) => callback(), retryDelayMs: 50, maxAttempts: 100 }))(host);
equal(controller.getCurrentPageCommandContext({}, "conv", "tab").page, page);
equal(controller.getPageState({}, "conv", "tab"), page);
equal(controller.navigateCurrentPageHistory({}, "conv", "back", "tab"), true);
equal(calls[0], "back");
equal(controller.navigatePageToUrl(page, "https://next.test", "manual", "user"), true);
equal(calls[1], ["load", "https://next.test", undefined]);
equal(page.pendingUrl, "https://next.test");
equal(controller.isRestrictedBrowserNavigation(7, "https://blocked.test"), true);
equal(controller.isRestrictedBrowserNavigation(7, "https://ok.test"), false);
page.pendingNavigationUsage = { expectedUrl: "https://failed.test" };
controller.loadBrowserErrorPage(windowState, page, webContents, { failedUrl: "https://failed.test", kind: "load", loadError: { code: -2, failedUrl: "https://failed.test", pageUrl: "data:text/html,error", title: "Load failed" } });
equal(page.loadError.failedUrl, "https://failed.test");
equal(page.errorPagesByUrl.has("old"), false);
equal(page.errorPagesByUrl.has("data:text/html,error"), true);
equal(page.pendingNavigationUsage, null);
equal(page.title, "Load failed");
equal(page.canGoBack, true);
equal(calls.some((call) => Array.isArray(call) && call[0] === "load" && call[1] === "data:text/html,error" && call[2].replaceCurrentEntry), true);
console.log(`main browser navigation context controller tests passed (${assertions} assertions)`);
