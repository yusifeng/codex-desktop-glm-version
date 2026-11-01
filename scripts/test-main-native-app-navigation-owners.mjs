import assert from "node:assert/strict";
import fs from "node:fs";
import * as acorn from "acorn";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};
const declarationSource = async (source, name) => {
  const transpiled = await transform(source, { loader: "ts", format: "esm", target: "es2022" });
  const ast = acorn.parse(transpiled.code, { ecmaVersion: "latest", sourceType: "module" });
  const declaration = ast.body.find(
    (node) =>
      (node.type === "FunctionDeclaration" || node.type === "ClassDeclaration") &&
      node.id?.name === name,
  );
  assert.ok(declaration, `missing ${name}`);
  assertions += 1;
  return transpiled.code.slice(declaration.start, declaration.end);
};

const navigationSource = fs.readFileSync(
  new URL("../src/main/main-app/browser-use/navigation-restriction.ts", import.meta.url),
  "utf8",
);
const navigationTranspiled = await transform(navigationSource, {
  loader: "ts",
  format: "cjs",
  target: "es2022",
});
const navigationModule = { exports: {} };
Function("require", "module", "exports", navigationTranspiled.code)(
  (specifier) => {
    if (specifier === "@chunk/bootstrap")
      return { b: (url) => /^https?:\/\//.test(url) };
    if (specifier === "../browser/link-opening")
      return {
        isLocalUrl: (url) => {
          try {
            const parsed = new URL(url);
            return (
              parsed.protocol === "file:" ||
              ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)
            );
          } catch {
            return false;
          }
        },
      };
    if (specifier === "./site-data") return { isInAppBrowserChromeUrlsAllowed: () => false };
    throw new Error(`unexpected require ${specifier}`);
  },
  navigationModule,
  navigationModule.exports,
);

equal(
  navigationModule.exports.shouldBlockLocalSubframeNavigation({
    currentUrl: "http://localhost:3000/app",
    requestUrl: "https://example.com/embed",
    resourceType: "subFrame",
  }),
  true,
);
equal(
  navigationModule.exports.shouldBlockLocalSubframeNavigation({
    currentUrl: "http://localhost:3000/app",
    requestUrl: "about:blank",
    resourceType: "subFrame",
  }),
  false,
);
equal(navigationModule.exports.isBrowserNavigationResourceType("mainFrame"), true);
equal(navigationModule.exports.isBrowserNavigationResourceType("script"), false);

const state = { isBrowserUseNavigationRestrictionActive: false };
const entry = { threadState: state };
const blocked = [];
const restriction = new navigationModule.exports.BrowserUseNavigationRestriction({
  findPageStateForPageKey: (key) => (key === "page" ? entry : null),
  findPageStateForWebContentsId: (id) => (id === 7 ? entry : null),
  onNavigationBlocked: (_entry, error, url, details) =>
    blocked.push([error.message, url, details.resourceType]),
});
restriction.activate("page");
equal(state.isBrowserUseNavigationRestrictionActive, true);
restriction.assertAllowed("page", "https://example.com");
assert.throws(() => restriction.assertAllowed("page", "javascript:alert(1)"), /Blocked browser navigation/);
assertions += 1;
equal(
  restriction.isRestrictedForWebContentsId(7, "data:text/html,ok", { resourceType: "subFrame" }),
  false,
);
equal(
  restriction.isRestrictedForWebContentsId(7, "javascript:alert(1)", {
    resourceType: "subFrame",
  }),
  true,
);
equal(blocked.length, 2);

const nativeSource = fs.readFileSync(
  new URL("../src/main/main-app/windows/native-app-icons.ts", import.meta.url),
  "utf8",
);
equal(nativeSource.includes("createRequire(import.meta.url)"), true);
equal(/\b__filename\b|\b__dirname\b/.test(nativeSource), false);
const privacySource = await declarationSource(nativeSource, "isPrivacySettingsTerminationRequest");
const nativeVideoSource = await declarationSource(
  nativeSource,
  "setRemoteHostedPIPContentNativeVideoEnabled",
);
const nativeHelpers = Function(
  `const app = { getAppPath: () => "/app" };
   const loadSkyAddon = () => { throw new Error("unused"); };
   ${privacySource}
   ${nativeVideoSource}
   return { isPrivacySettingsTerminationRequest, setRemoteHostedPIPContentNativeVideoEnabled };`,
)();
const addonCalls = [];
const addon = {
  isPrivacySettingsTerminationRequest: () => true,
  setRemoteHostedPIPContentNativeVideoEnabled: (ids, enabled) => {
    addonCalls.push([ids, enabled]);
    return true;
  },
};
equal(
  nativeHelpers.isPrivacySettingsTerminationRequest({
    addon,
    electronAppPath: "/app",
    platform: "darwin",
    resourcesPath: "/resources",
  }),
  true,
);
equal(
  nativeHelpers.isPrivacySettingsTerminationRequest({
    addon,
    electronAppPath: "/app",
    platform: "linux",
    resourcesPath: "/resources",
  }),
  false,
);
equal(
  nativeHelpers.setRemoteHostedPIPContentNativeVideoEnabled(["presentation"], true, {
    addon,
    electronAppPath: "/app",
    platform: "darwin",
    resourcesPath: "/resources",
  }),
  true,
);
equal(addonCalls, [[ ["presentation"], true ]]);
equal(
  nativeHelpers.setRemoteHostedPIPContentNativeVideoEnabled([], true, {
    addon,
    electronAppPath: "/app",
    platform: "darwin",
    resourcesPath: "/resources",
  }),
  false,
);

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
equal(main.includes('require("./main-app/windows/native-app-icons.js")'), true);
equal(main.includes('require("./main-app/browser-use/navigation-restriction.js")'), true);
equal(main.includes("BrowserUseNavigationRestriction: Vae"), true);
equal(main.includes("createBrowserUsePipManager: Pc"), true);
equal(main.includes("loadSkyAddon: Vs"), true);
equal(main.includes("var kae ="), false);
equal(main.includes("function Pae("), false);
equal(main.includes("var Vae = class"), false);
equal(main.includes("function Pc("), false);
equal(main.includes("async function Bc("), false);
equal(main.includes("browserUseNavigationRestriction = new Vae({"), true);
equal(main.includes("let Je = Pc({"), true);

console.log(`${assertions} main native app and navigation owner assertions passed`);
