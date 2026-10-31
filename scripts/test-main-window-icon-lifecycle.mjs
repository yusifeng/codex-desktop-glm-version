import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = await esbuild.build({
  bundle: true,
  entryPoints: [path.join(root, "src/main/main-app/startup/window-icon-lifecycle.ts")],
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createWindowIconLifecycle } = await import(
  `data:text/javascript;base64,${Buffer.from(build.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); assertions += 1; };
const deepEqual = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };

function harness({ isMacOS = false, isWindows = false, isLinux = false, preference = "codex-system", packaged = true } = {}) {
  const state = {
    dark: false,
    disposers: [],
    dockIcons: [],
    listeners: new Set(),
    macUpdates: [],
    windowIcons: [],
    windowsIcon: "/icons/windows-light.ico",
  };
  const image = (source) => ({
    source,
    isEmpty: () => false,
    getSize: () => ({ width: 256, height: 256 }),
    crop: (bounds) => ({ source, bounds, isEmpty: () => false }),
  });
  const app = { isPackaged: packaged, dock: { setIcon(value) { state.dockIcons.push(value); } } };
  const nativeTheme = {
    get shouldUseDarkColorsForSystemIntegratedUI() { return state.dark; },
    on(_event, listener) { state.listeners.add(listener); },
    off(_event, listener) { state.listeners.delete(listener); },
  };
  const dependencies = {
    app,
    browserWindows: () => [
      { isDestroyed: () => false, setIcon: (value) => state.windowIcons.push(value) },
      { isDestroyed: () => true, setIcon: () => state.windowIcons.push("destroyed") },
    ],
    createEmptyImage: () => ({ isEmpty: () => true }),
    createImageFromPath: image,
    exists: (candidate) => candidate.startsWith("/resources/") || candidate.startsWith("/repo/electron/src/icons/"),
    join: path.posix.join,
    nativeTheme,
    resolveDockIconPreference: ({ getPreference }) => getPreference(),
    resolveFlavorIconAssetNames: () => ({ dark: "dark.png", light: "light.png" }),
    resolveLinuxIcon: () => "/icons/linux.png",
    resolveWindowIconResource: () => ({ fileName: "fallback.png", allowPackaged: true }),
    resolveWindowsIcon: () => state.windowsIcon,
    resourcesPath: "/resources",
    async setMacAppIcon(value) { state.macUpdates.push(value); return true; },
  };
  const lifecycle = createWindowIconLifecycle(dependencies, {
    buildFlavor: "prod",
    flavorPolicy: { agent: "agent", nightly: "nightly", internalAlpha: "alpha", publicBeta: "beta", dev: "dev", prod: "prod" },
    iconsRoot: "/repo/electron/src/icons",
    isDevMode: false,
    isLinux,
    isMacOS,
    isWindows,
    readDockIconPreference: () => preference,
    registerDispose: (dispose) => state.disposers.push(dispose),
    repoRoot: "/repo",
  });
  return { dependencies, lifecycle, state };
}

{
  const { lifecycle, state } = harness({ isWindows: true });
  equal(lifecycle.windowIconPath, "/icons/windows-light.ico", "starts with the resolved Windows icon");
  equal(state.listeners.size, 1, "subscribes to native-theme updates while a Windows icon exists");
  state.windowsIcon = "/icons/windows-dark.ico";
  for (const listener of [...state.listeners]) listener();
  equal(lifecycle.windowIconPath, "/icons/windows-dark.ico", "updates the live icon path after a theme change");
  deepEqual(state.windowIcons, ["/icons/windows-dark.ico"], "updates only live BrowserWindows");
  state.disposers[0]();
  equal(state.listeners.size, 0, "removes the Windows theme listener on disposal");
}

{
  const { lifecycle, state } = harness({ isLinux: true });
  equal(lifecycle.windowIconPath, "/icons/linux.png", "uses the Linux icon resolver without a theme subscription");
  equal(state.listeners.size, 0, "does not subscribe for a static Linux icon");
}

{
  const { state } = harness({ isMacOS: true });
  await new Promise((resolve) => setImmediate(resolve));
  equal(state.listeners.size, 1, "subscribes to macOS system icon theme changes");
  equal(state.macUpdates.length, 1, "synchronizes the macOS application bundle icon");
  equal(state.macUpdates[0].resourceName, "light.png", "uses the light resource for the bundle icon contract");
  equal(state.dockIcons[0].source, "/resources/light.png", "prefers the packaged dock resource");
  deepEqual(state.dockIcons[0].bounds, { x: 2, y: 2, width: 252, height: 252 }, "crops Codex dock artwork by the original 1/128 inset");
  state.dark = true;
  for (const listener of [...state.listeners]) listener();
  equal(state.dockIcons.at(-1).source, "/resources/dark.png", "refreshes codex-system artwork for the new native theme");
  for (const dispose of state.disposers) dispose();
  equal(state.listeners.size, 0, "removes the macOS theme listener on disposal");
}

{
  const { state } = harness({ isMacOS: true, preference: "app-default" });
  equal(state.dockIcons[0], null, "restores the packaged app-default dock icon with Electron's null contract");
}

console.log(`${assertions} window icon lifecycle assertions passed`);
