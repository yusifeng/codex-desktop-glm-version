import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const source = fs.readFileSync(new URL("../src/main/main-app/desktop/environment.ts", import.meta.url), "utf8");
const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
const declaration = (name) => ast.body.find((node) =>
  (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") && node.id?.name === name,
);
const slice = (name) => {
  const node = declaration(name);
  assert.ok(node, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(node.start, node.end);
};

const osNameOf = Function("OS_NAMES", `${slice("osNameOf")}; return osNameOf;`)(
  { darwin: "macOS", linux: "Linux", win32: "Windows" },
);
equal(osNameOf("darwin"), "macOS");
equal(osNameOf("linux"), "Linux");
equal(osNameOf("win32"), "Windows");
equal(osNameOf("freebsd"), undefined);

const BuildFlavor = { Agent: "agent", Dev: "dev", Prod: "prod", Nightly: "nightly", InternalAlpha: "alpha", PublicBeta: "beta" };
const iconBaseName = Function("BuildFlavor", `${slice("iconBaseName")}; return iconBaseName;`)(BuildFlavor);
equal(iconBaseName("agent"), "icon-agent");
equal(iconBaseName("nightly"), "icon-chatgpt-nightly");
equal(iconBaseName("prod"), "icon-chatgpt");

const codexIconNames = Function("BuildFlavor", `${slice("codexIconNames")}; return codexIconNames;`)(BuildFlavor);
equal(codexIconNames("beta"), { dark: "icon-codex-dark-color-beta.png", light: "icon-codex-light-beta.png" });

const appIconMedium = Function(
  "process",
  "BuildFlavor",
  "iconToDataUrl",
  "join",
  "app",
  "getAppIconMedium",
  "getMacAppIconPath",
  "windowsAppIconPath",
  "pngIconPath",
  "iconDataUrlByName",
  `${slice("appIconMedium")}; return appIconMedium;`,
)(
  { platform: "darwin" },
  BuildFlavor,
  (path) => `data:${path}`,
  (...parts) => parts.join("/"),
  { isPackaged: true, getAppPath: () => "/app" },
  async (path) => `sky:${path}`,
  () => "/Applications/ChatGPT.app",
  () => null,
  () => null,
  (name) => `asset:${name}`,
);
equal(await appIconMedium("prod"), "sky:/Applications/ChatGPT.app");

class EventEmitterBase {}
const BrowserAuthServices = Function(
  "EventEmitterBase",
  "createBrowserAuthOperations",
  `${slice("BrowserAuthServices")}; return BrowserAuthServices;`,
)(EventEmitterBase, (globalState) => ({ globalState }));
const globalState = { updateAndPersist: async () => {} };
equal(new BrowserAuthServices({ globalState, value: 7 }).services, {
  value: 7,
  browserAuthOperations: { globalState },
});

const authSource = fs.readFileSync(new URL("../src/main/main-app/api/browser-auth-operations.ts", import.meta.url), "utf8");
const authTranspiled = await transform(authSource, { loader: "ts", format: "esm", target: "es2022" });
const authAst = acorn.parse(authTranspiled.code, { ecmaVersion: "latest", sourceType: "module" });
const authNode = authAst.body.find((node) => node.type === "FunctionDeclaration" && node.id?.name === "createBrowserAuthOperations");
assert.ok(authNode);
assertions += 1;
const authFunctionSource = authTranspiled.code.slice(authNode.start, authNode.end);
class BrowserAuthOperationsStore {
  constructor(commit) { this.commit = commit; }
}
const createBrowserAuthOperations = Function(
  "BrowserAuthOperationsStore",
  "BROWSER_AUTH_OPERATIONS_KEY",
  `${authFunctionSource}; return createBrowserAuthOperations;`,
)(BrowserAuthOperationsStore, "browser-auth");
const writes = [];
const operations = createBrowserAuthOperations({
  async updateAndPersist(key, update) { writes.push([key, update("old")]); },
});
equal(await operations.commit(() => ({ value: "next", result: "committed" })), "committed");
equal(writes, [["browser-auth", "next"]]);
const failedOperations = createBrowserAuthOperations({ async updateAndPersist() {} });
await assert.rejects(failedOperations.commit(() => ({ value: "next", result: "unused" })), /not committed/);
assertions += 1;

equal(source.includes('import { getAppIconMedium } from "../windows/native-app-icons"'), true);
equal(source.includes('from "../api/browser-auth-operations"'), true);
equal(source.includes("getWindowsAppIconSmall"), false);
const desktopFetch = fs.readFileSync(new URL("../src/main/main-app/api/desktop-fetch.ts", import.meta.url), "utf8");
equal(desktopFetch.includes('import { createBrowserAuthOperations } from "./browser-auth-operations"'), true);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(
  main.includes('const { osNameOf: ut, BrowserAuthServices: aEe, pngIconPath: wT, windowsAppIconPath: TT, DesktopEnvironment: oEe } = require("./main-app/desktop/environment.js");'),
  true,
);
equal(main.includes("var aEe = class"), false);
equal(main.includes("var oEe = class"), false);
equal(main.includes("function wT("), false);
equal(main.includes("function TT("), false);
equal(main.includes("function iEe("), false);
equal(main.includes("resolveWindowsIcon: TT"), true);
equal(main.includes("resolveLinuxIcon: wT"), true);
const windowContext = fs.readFileSync(new URL("../src/main/main-app/window/window-context.ts", import.meta.url), "utf8");
equal(windowContext.includes("new aEe({"), true);
equal(windowContext.includes("appInfo: new oEe()"), true);

console.log(`${assertions} main desktop environment owner assertions passed`);
