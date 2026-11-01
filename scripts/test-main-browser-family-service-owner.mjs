import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/platform/browser-family.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const classNode = ast.body.find((node) => node.type === "ClassDeclaration" && node.id?.name === "BrowserFamilyService");
assert.ok(classNode); assertions += 1;
equal(classNode.body.body.length, 7);

const calls = [];
const BrowserFamilyService = Function(
  "getCompatibleExtensionIds", "BROWSER_FAMILY_CONFIGS", "isKnownBrowserFamily",
  "isChromiumBrowserInstalled", "BuildFlavor", "resolveChromeExtensionSet",
  "findInstalledExtensionId", "defaultBrowserInfo", "getMissingChromeExtensionInstallInfo",
  "openBrowserExtensionSettings", "openChromiumUrl",
  "RpcTarget",
  `${transpiled.code.slice(classNode.start, classNode.end)}; return BrowserFamilyService;`,
)(
  async () => undefined,
  { chrome: {}, edge: {} },
  () => true,
  async ({ browserFamily }) => browserFamily === "chrome",
  { resolve: () => "prod" },
  ({ compatibleExtensionIds }) => ({ extensionIds: compatibleExtensionIds ?? ["prod-extension"], installUrl: "https://install.test" }),
  ({ extensionIds }) => extensionIds[0] ?? null,
  async () => ({ defaultBrowserName: "Chrome", defaultBrowserPath: "/chrome" }),
  (value) => value,
  async (value) => calls.push(["settings", value]),
  async (value) => calls.push(["url", value]),
  class RpcTarget {},
);
const service = new BrowserFamilyService({ getCompatibleExtensionIds: async () => ["extension-1"] });
equal(await service.getInstalledBrowserFamilies(), ["chrome"]);
equal(await service.getExtensionStatus({ browserFamily: "chrome" }), {
  installUrl: "https://install.test", installedExtensionId: "extension-1",
});
equal(await service.getExtensionInstallBanner(), {
  buildFlavor: "prod", compatibleExtensionIds: ["extension-1"], defaultBrowserName: "Chrome", defaultBrowserPath: "/chrome",
});
await service.openExtensionSettings({ browserFamily: "chrome", extensionId: "extension-1" });
await service.openUrl({ browserFamily: "edge", url: "https://example.test" });
equal(calls, [
  ["settings", { browserFamily: "chrome", extensionId: "extension-1" }],
  ["url", { browserFamily: "edge", url: "https://example.test" }],
]);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('const { BrowserFamilyService: MO } = require("./main-app/platform/browser-family.js");'), true);
equal(main.includes("MO = class"), false);
equal(main.includes("async function NO("), false);
equal(main.includes("async function PO("), false);
equal(main.includes("async function FO("), false);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("chromiumBrowser: new MO()"), true);
console.log(`${assertions} main BrowserFamilyService owner assertions passed`);
