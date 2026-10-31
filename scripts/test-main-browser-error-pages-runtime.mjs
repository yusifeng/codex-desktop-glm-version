import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({
  entryPoints: [new URL("../src/main/main-app/browser-sidebar/error-pages.ts", import.meta.url).pathname],
  bundle: true, format: "esm", platform: "node", target: "node22", write: false,
  plugins: [{ name: "error-page-stubs", setup(api) {
    api.onResolve({ filter: /^@chunk\/shared$/ }, ({ path }) => ({ path, namespace: "shared" }));
    api.onLoad({ filter: /.*/, namespace: "shared" }, () => ({ contents: `
      export const xa = ({ type }) => type === "image/png" || type === "image/jpeg";
      export const Sa = (name) => !name.includes("..") && name.length > 0;
      export const od = (value) => value;
      export const gu = { BATCH: "batch" };
    `, loader: "js" }));
    api.onResolve({ filter: /^@chunk\/logger$/ }, ({ path }) => ({ path, namespace: "logger" }));
    api.onLoad({ filter: /.*/, namespace: "logger" }, () => ({ contents: `export const memoizedTaggedLogger = () => () => ({ warning() {} });`, loader: "js" }));
    api.onResolve({ filter: /^\.\.\/browser\/link-opening$/ }, ({ path }) => ({ path, namespace: "link" }));
    api.onLoad({ filter: /.*/, namespace: "link" }, () => ({ contents: `export const isSecureOrLocalHttpUrl = (url) => url.startsWith("https://") || url.startsWith("http://localhost");`, loader: "js" }));
  } }],
});
const runtime = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);

equal(runtime.blankableUrl("about:blank"), "");
equal(runtime.blankableUrl("https://example.com"), "https://example.com");
equal(runtime.isImageDragItem({ mediaType: "image", hasImageContents: true, linkURL: "", srcURL: "https://example.com/a.png" }), true);
equal(runtime.isImageDragItem({ mediaType: "image", hasImageContents: true, linkURL: "https://example.com", srcURL: "a.png" }), false);
equal(runtime.hasPendingDesignChange({ comments: [{ designChange: { x: 1 } }] }, true), true, "snapshot is accepted directly");
const snapshot = runtime.snapshotForInteractionMode({ comments: [], annotationFlow: null, isTweaksEditorOpen: true }, "comment");
equal(snapshot.interactionMode, "comment");
equal(snapshot.annotationFlow, "batch");
equal(snapshot.isTweaksEditorOpen, false);
equal(runtime.setAnnotationModeEnabled({ isAnnotationModeEnabled: true, pendingCommentModeActivation: {}, snapshot: { interactionMode: "comment", comments: [] } }, true), false);
equal(runtime.escapeHtml("<script>&"), "&lt;script&gt;&amp;");
equal(runtime.SCREENSHOT_SIZE_CONSTRAINTS, { maxHeight: 4096, maxWidth: 4096, minHeight: 160, minWidth: 240 });
equal(runtime.CONTEXT_MENU_MESSAGE_IDS.attachImage, "browserSidebar.contextMenu.attachImage");

const formatMessage = ({ defaultMessage, values }) => values?.host ? defaultMessage.replace("{host}", values.host) : defaultMessage;
const content = runtime.buildLoadErrorContent({ errorDescription: "ERR_NAME_NOT_RESOLVED", failedUrl: "https://bad.example/path", formatMessage, runtimeIntlConfig: { locale: "en-US" } });
equal(content.details.length, 4);
equal(content.showErrorCode, true);
const page = runtime.buildLoadErrorPage({ content, errorCode: -105, errorDescription: "ERR_NAME_NOT_RESOLVED", failedUrl: "https://bad.example/path" });
equal(page.errorCode, -105);
equal(page.pageUrl.startsWith("data:text/html;charset=utf-8,"), true);
equal(runtime.matchesLoadError(page, page.pageUrl), true);
equal(runtime.shouldSuppressLoadError({ errorCode: -3, errorDescription: "ERR_ABORTED", isMainFrame: true }), true);
equal(runtime.isAbortedNavigationError(new Error("Navigation failed with error code -3.")), true);
equal(runtime.isPendingNavigationError(new Error("navigation is already pending")), true);
equal(runtime.openExternalActionUrl("codex-browser-sidebar://open-external?url=https%3A%2F%2Fexample.com"), "https://example.com");
const crash = runtime.buildCrashErrorPage({ failedUrl: "https://example.com", formatMessage, isDefaultBrowser: false, runtimeIntlConfig: { locale: "en-US" } });
equal(decodeURIComponent(crash.pageUrl).includes("open-in-browser-button"), true);

const listeners = new Map();
const owner = { isDestroyed: () => false, once: (name, fn) => listeners.set(`owner:${name}`, fn), removeListener: (name) => listeners.delete(`owner:${name}`) };
const webContents = {
  isDestroyed: () => false,
  once: (name, fn) => listeners.set(`web:${name}`, fn),
  removeListener: (name) => listeners.delete(`web:${name}`),
  session: { fetch: async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/png" } }) },
};
const messages = [];
await runtime.attachBrowserImage({ browserTabId: "tab", browserPageUrl: "https://page", conversationId: "conversation", owner, sourceUrl: "https://cdn.example/image.png", webContents, windowManager: { sendMessageToWebContents: (_target, message) => messages.push(message) } });
equal(messages.length, 1);
equal(messages[0].image.filename, "image.png");
equal(messages[0].image.dataUrl, "data:image/png;base64,AQID");
equal(listeners.size, 0, "destroy listeners are released");
const suspension = runtime.suspendImageAttachments(webContents);
equal(suspension.hadPendingDownloads, false);
suspension.resume();

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/error-pages.js")'), true);
for (const oldOwner of ["function mVe(", "async function xU(", "function OHe(", "function VU("]) equal(main.includes(oldOwner), false, `${oldOwner} is removed`);

console.log(`${assertions} main browser error-pages runtime assertions passed`);
