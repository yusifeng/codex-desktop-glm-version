import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const built = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/window/browser-window-policy-adapters.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createBrowserWindowPolicyAdapters } = await import(
  `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions += 1; };
const calls = [];
const adapters = createBrowserWindowPolicyAdapters({
  buildErrorPage: (name) => `error:${name}`,
  getAppName: () => "Codex",
  getWebviewEntryPath: (directory) => `${directory}/webview.html`,
  mainUrlTrust: {
    isAppProtocolUrl: (value) => value.startsWith("app:"),
    sameOrigin: (value, origin) => value === origin,
    sameTrustedPath: (...values) => values.join("|"),
  },
  packagedRendererUrl: "app://-/index.html",
  prefersDarkColors: () => true,
  rendererEnvironmentUrl: "http://localhost:5173/",
  rendererFrameTrust: {
    resolveRendererEntryUrl: (environment, packaged) => environment || packaged,
    rendererOrigin: (value) => new URL(value).origin,
    isTrustedRendererFrameUrl: (value, options) => { calls.push(["frame", value, options]); return true; },
    isTrustedRendererSenderFrame: (sender, frame, options) => {
      calls.push(["sender", sender, frame, options]);
      return sender === "sender" && frame === "frame";
    },
  },
  windowAppearance: {
    isLargeEnoughForNativeWindow: (value) => value.large,
    isOverlayAppearance: (value) => value === "overlay",
    minimumWindowSize: (appearance, primary) => ({ appearance, primary }),
    resolveAppearanceTheme: (appearance, dark) => `${appearance}:${dark}`,
    shouldHideInactiveWindow: (value) => value.hidden,
    shouldUseOpaqueWindows: (value) => value.opaque,
    supportsEmbeddedWebview: (value) => value === "primary",
    titleBarOverlay: (zoom, dark) => ({ zoom, dark }),
    trafficLightPosition: (zoom) => ({ x: zoom }),
    vibrancyForAppearance: (appearance, opaque) => `${appearance}:${opaque}`,
    windowOptions: (value) => ({ options: value }),
    windowSurfaceColors: (value) => ({ colors: value }),
  },
});

equal(adapters.rendererEntryUrl(), "http://localhost:5173/");
equal(adapters.rendererOrigin(), "http://localhost:5173");
equal(adapters.isTrustedRendererFrameUrl("app://-/page", "/module"), true);
equal(calls.at(-1), ["frame", "app://-/page", {
  rendererUrl: "http://localhost:5173/",
  webviewEntryPath: "/module/webview.html",
}]);
equal(adapters.isTrustedRendererSenderFrame({ sender: "sender", senderFrame: "frame", moduleDir: "/module" }), true);
equal(calls.at(-1), ["sender", "sender", "frame", {
  rendererUrl: "http://localhost:5173/",
  webviewEntryPath: "/module/webview.html",
}]);
equal(adapters.buildWindowErrorPage(), "error:Codex");
equal(adapters.resolveAppearanceTheme("system"), "system:true");
equal(adapters.titleBarOverlay(1.5), { zoom: 1.5, dark: true });
equal(adapters.trafficLightPosition(2), { x: 2 });
equal(adapters.isAppProtocolUrl("app://-/index.html"), true);
equal(adapters.sameOrigin("x", "x"), true);
equal(adapters.sameTrustedPath("a", "b", null), "a|b|");
equal(adapters.minimumWindowSize("primary", { width: 1 }), { appearance: "primary", primary: { width: 1 } });
equal(adapters.supportsEmbeddedWebview("primary"), true);
equal(adapters.isOverlayAppearance("overlay"), true);
equal(adapters.isLargeEnoughForNativeWindow({ large: true }), true);
equal(adapters.shouldHideInactiveWindow({ hidden: true }), true);
equal(adapters.shouldUseOpaqueWindows({ opaque: true }), true);
equal(adapters.vibrancyForAppearance("primary", false), "primary:false");
equal(adapters.windowOptions({ appearance: "primary" }), { options: { appearance: "primary" } });
equal(adapters.windowSurfaceColors({ appearance: "primary" }), { colors: { appearance: "primary" } });

const main = fs.readFileSync(path.join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
equal(main.includes('require("./main-app/window/browser-window-policy-adapters.js")'), true);
equal(main.includes("browserWindowPolicies = createBrowserWindowPolicyAdapters({"), true);
for (const oldName of ["E9", "wot", "Pot", "A9", "j9", "M9", "est", "N9", "F9", "I9", "rst", "ist", "ast", "ost", "sst", "L9", "cst", "z9"]) {
  equal(main.includes(`function ${oldName}(`), false);
}

console.log(`${assertions} main browser-window policy adapter assertions passed`);
