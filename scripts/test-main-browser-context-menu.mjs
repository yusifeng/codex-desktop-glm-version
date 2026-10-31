import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const output = await build({ entryPoints: [new URL("../src/main/main-app/browser-sidebar/browser-context-menu.ts", import.meta.url).pathname], bundle: true, format: "esm", platform: "node", target: "node22", write: false });
const { createBrowserContextMenuRuntime } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
let template;
const calls = [];
const runtime = createBrowserContextMenuRuntime({
  canOpenExternalUrl: () => true,
  clipboard: { writeText: (value) => calls.push(["clipboard", value]) },
  getIntl: () => ({ formatMessage: ({ defaultMessage }) => defaultMessage }),
  isHttpUrl: (url) => url.startsWith("http"),
  isImageContext: (params) => params.mediaType === "image",
  menu: { buildFromTemplate(value) { template = value; return { popup: (input) => calls.push(["popup", input]) }; } },
  messages: { inspect: "inspect", back: "back", forward: "forward", reload: "reload", openLinkInNewTab: "new", openExternalBrowser: "external", copyLink: "copy-link", commentWithCodex: "comment", quickAnnotate: "quick", attachImage: "attach" },
  shared: { gu: { QUICK: "quick", BATCH: "batch" }, lu: { WEB: "web" } },
});
equal(runtime.canCommentOnSnapshot({ tabType: "web", commentModeDisabledReason: null }), true);
equal(runtime.canCommentOnSnapshot({ tabType: "web", commentModeDisabledReason: "blocked" }), false);
equal(runtime.canCommentOnSnapshot({ tabType: "new-tab", commentModeDisabledReason: null }), false);
const webContents = { canGoBack: () => true, canGoForward: () => false, isDestroyed: () => false, _executePasswordManagerContextMenuCommand: (command) => calls.push(["password", command]) };
const params = { editFlags: { canCopy: true, canCut: false, canPaste: true }, formControlType: "none", isEditable: false, linkURL: "https://example.test", mediaType: "image", passwordManager: { selectPassword: { label: "Select password" } }, selectionText: " selected ", srcURL: "https://image.test", x: 3, y: 4 };
runtime.showBrowserContextMenu({ canAttachImage: true, canReload: true, isDefaultBrowser: false, snapshot: { tabType: "web", commentModeDisabledReason: null }, params, webContents, window: { id: 1 }, onAttachImage: (url) => calls.push(["attach", url]), onBack: () => {}, onComment: (...args) => calls.push(["comment", ...args]), onForward: () => {}, onInspect: (...args) => calls.push(["inspect", ...args]), onOpenInBrowser: (url) => calls.push(["new", url]), onOpenExternal: (url) => calls.push(["external", url]), onReload: () => {} });
equal(calls[0][0], "popup");
equal(template.some((item) => item.label === "Quick annotate"), true);
equal(template.some((item) => item.label === "Annotate"), true);
equal(template.some((item) => item.label === "Attach image to chat"), true);
equal(template.some((item) => item.label === "Select password"), true);
equal(template.some((item) => item.label === "Open link in new tab"), true);
equal(template.some((item) => item.label === "Open in external browser"), true);
equal(template.some((item) => item.label === "Copy link address"), true);
equal(template.at(-1).label, "Inspect");
template.find((item) => item.label === "Quick annotate").click();
equal(calls.at(-1), ["comment", { x: 3, y: 4 }, "quick", " selected "]);
template.find((item) => item.label === "Select password").click();
equal(calls.at(-1), ["password", "select-password"]);
template.find((item) => item.label === "Copy link address").click();
equal(calls.at(-1), ["clipboard", "https://example.test"]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/browser-sidebar/browser-context-menu.js")'), true);
for (const oldOwner of ["function zX(", "function LXe(", "function RXe(", "function BX(", "function zXe(", "function BXe(", "function VX(", "function VXe("]) equal(main.includes(oldOwner), false);
console.log(`${assertions} main browser context menu assertions passed`);
