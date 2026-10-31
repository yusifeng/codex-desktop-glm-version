import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/open-target/open-target-registry-runtime.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createOpenTargetRegistryRuntime } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`
);

let assertions = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
};
const ok = (actual, message) => {
  assert.ok(actual, message);
  assertions += 1;
};

const spawnCalls = [];
const shortcutReads = [];
const applicationQueries = [];
const iconQueries = [];
const realpaths = new Map([
  ["/Applications/Safari.app", "/canonical/safari"],
  ["/Applications/Safari Alias.app", "/canonical/safari"],
]);
const descriptors = [
  {
    id: "code",
    platforms: {
      darwin: {
        label: "Code",
        icon: "code.png",
        kind: "editor",
        detect: async (readShortcut) => {
          await readShortcut("/shortcut/code");
          return "/usr/bin/code";
        },
        args: (targetPath, location) => location
          ? ["--goto", `${targetPath}:${location.line}:${location.column}`]
          : [targetPath],
        env: () => ({ CODE: "1" }),
      },
      linux: {
        label: "Code Linux",
        icon: "code.png",
        kind: "editor",
        detect: async () => "/usr/bin/code-linux",
        args: (targetPath) => [targetPath],
      },
    },
  },
  {
    id: "fileManager",
    platforms: {
      darwin: {
        label: "Finder",
        icon: "finder.png",
        kind: "fileManager",
        detect: async () => "/usr/bin/open",
        args: (targetPath) => [targetPath],
      },
    },
  },
  {
    id: "custom-open",
    platforms: {
      darwin: {
        label: "Custom",
        icon: "custom.png",
        kind: "editor",
        detect: async () => "/usr/bin/custom",
        args: () => [],
        async open(request) { spawnCalls.push(["custom-open", request]); },
      },
    },
  },
];

const applicationLists = new Map();
function dependencies(overrides = {}) {
  return {
    targetDescriptors: descriptors,
    platform: "darwin",
    path,
    fs: {
      promises: {
        async realpath(value) {
          if (!realpaths.has(value)) throw new Error("missing");
          return realpaths.get(value);
        },
      },
    },
    electron: {
      shell: {
        readShortcutLink(value) { shortcutReads.push(value); return { target: value }; },
      },
      app: {
        async getApplicationInfoForProtocol() { return { path: "/Applications/Safari.app" }; },
      },
    },
    async spawn(...args) { spawnCalls.push(args); },
    findExistingMacApplication(paths) {
      return paths.includes("/Applications/Microsoft PowerPoint.app")
        ? "/Applications/Microsoft PowerPoint.app"
        : paths.includes("/Applications/Microsoft Excel.app")
          ? "/Applications/Microsoft Excel.app"
          : null;
    },
    preferredBundleIdsForPath: (value) => value.endsWith(".pptx") ? ["com.microsoft.Powerpoint"] : [],
    async getApplicationIcon(value) { iconQueries.push(value); return value.includes("NoIcon") ? null : `icon:${value}`; },
    includeCodexTargets: (value) => value.includes("include-codex"),
    async listLinuxApplicationsForFile(value) { return applicationLists.get(value) ?? []; },
    async listApplicationsForFile(options) {
      applicationQueries.push(options);
      return applicationLists.get(options.filePath) ?? [];
    },
    async discoverLinuxBrowsers() { return null; },
    async scanNativeBrowsers() { return null; },
    async discoverKnownBrowsers() { return []; },
    codexBundleIds: ["com.openai.codex"],
    uniqueBy(values, key) {
      const seen = new Set();
      return values.filter((value) => {
        const identity = key(value);
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      });
    },
    ...overrides,
  };
}

const runtime = createOpenTargetRegistryRuntime(dependencies());
equal(runtime.targetsForPlatform("darwin").map(({ id }) => id), ["code", "fileManager", "custom-open"], "Darwin target projection preserves descriptor order");
equal(runtime.targetsForPlatform("linux").map(({ id }) => id), ["code"], "Linux projection excludes unsupported descriptors");
equal(runtime.targetsForPlatform("win32"), [], "empty platform projection is supported");
equal(runtime.defaultTargets.length, 3, "default target registry is projected once");
equal(runtime.defaultTargets[0].label, "Code", "platform metadata is flattened into target");
equal(runtime.isEditorTarget("code"), true, "editor target is classified");
equal(runtime.isEditorTarget("fileManager"), false, "file manager is not editor");
equal(runtime.isEditorTarget("missing"), false, "unknown target is not editor");

await runtime.openWithTarget("code", "/repo/file.ts", { location: { line: 2, column: 4 } });
equal(shortcutReads, ["/shortcut/code"], "target detection receives shortcut reader");
equal(spawnCalls.at(-1), ["/usr/bin/code", ["--goto", "/repo/file.ts:2:4"], { env: { CODE: "1" } }], "detected target launches with args and environment");
await runtime.openWithTarget("code", "/repo/file.ts", { detectedCommand: "/custom/code" });
equal(shortcutReads.length, 1, "detected command bypasses target detection");
equal(spawnCalls.at(-1)[0], "/custom/code", "detected command is authoritative");

await runtime.openWithTarget("custom-open", "/repo/file.ts", { appPath: "/Applications/Custom.app" });
equal(spawnCalls.at(-1)[0], "custom-open", "custom open callback is used instead of generic spawn");
equal(spawnCalls.at(-1)[1].path, "/repo/file.ts", "custom open receives target path");
equal(spawnCalls.at(-1)[1].appPath, "/Applications/Custom.app", "custom open receives app path");
await assert.rejects(runtime.openWithTarget("missing", "/repo"), /Unknown open target/);
assertions += 1;
await assert.rejects(runtime.openWithTarget("code", "/repo", {
  hostConfig: { kind: "remote-control" }, remotePath: "/remote/repo",
}), /Remote control does not support/);
assertions += 1;
await assert.rejects(runtime.openWithTarget("unavailable", "/repo", {
  targets: [{ id: "unavailable", detect: async () => null }],
}), /is not available/);
assertions += 1;

equal(runtime.officeApplicationForPath("deck.pptx"), {
  appPath: "/Applications/Microsoft PowerPoint.app",
  bundleId: "com.microsoft.Powerpoint",
  displayName: "Microsoft PowerPoint",
}, "PowerPoint fallback is detected");
equal(runtime.officeApplicationForPath("sheet.xlsx")?.bundleId, "com.microsoft.Excel", "Excel fallback is detected");
equal(runtime.officeApplicationForPath("doc.docx"), null, "non-special Office extension has no fallback");

equal(await runtime.nativeTarget({ appPath: "/Applications/App.app", bundleId: "bundle", displayName: "App" }), {
  id: "app:/Applications/App.app",
  target: "systemDefault",
  label: "App",
  icon: "icon:/Applications/App.app",
  kind: "native",
  appPath: "/Applications/App.app",
  bundleId: "bundle",
  available: true,
}, "native application is projected to open target");
const noIconRuntime = createOpenTargetRegistryRuntime(dependencies());
equal((await noIconRuntime.nativeTarget({ appPath: "/Applications/NoIcon.app", bundleId: "none", displayName: "No Icon" })).icon, "/apps/finder.png", "Darwin native target falls back to Finder icon");

applicationLists.set("/tmp/file.png", [
  { appPath: "/Applications/Codex.app", bundleId: "com.openai.codex", displayName: "Codex" },
  { appPath: "/Applications/Preview.app", bundleId: "com.apple.Preview", displayName: "Preview" },
]);
equal((await runtime.listApplications("/tmp/file.png", { includeCodexTargets: false, limit: 5 })).map(({ bundleId }) => bundleId), ["com.apple.Preview"], "Codex applications are excluded by default");
equal(applicationQueries.at(-1), {
  filePath: "/tmp/file.png", order: "usage", prioritizedBundleIds: [],
}, "application query omits limit when Codex targets are excluded");
equal((await runtime.listApplications("/tmp/file.png", { includeCodexTargets: true, limit: 1 })).map(({ bundleId }) => bundleId), ["com.openai.codex"], "Codex target may be explicitly included and limited");
equal(applicationQueries.at(-1).limit, 1, "include-Codex query passes native limit to provider");

const nativeApps = await runtime.discoverNativeApplications("/tmp/file.png");
equal(nativeApps.length, 1, "native discovery filters Codex target");
equal(nativeApps[0].label, "Preview", "native discovery projects application metadata");

applicationLists.set("/tmp/deck.pptx", [
  { appPath: "/Applications/Keynote.app", bundleId: "com.apple.Keynote", displayName: "Keynote", isDefault: true },
]);
const documentApps = await runtime.discoverDocumentApplications("/tmp/deck.pptx");
equal(documentApps.map(({ label }) => label), ["Keynote", "Microsoft PowerPoint"], "default document app sorts before Office fallback");
equal(documentApps[0].default, true, "default document application is marked");
equal(documentApps[1].default, undefined, "fallback application is not default");

const scannedBrowsers = [
  { appPath: "/Applications/Chrome.app", bundleId: "chrome", displayName: "Chrome" },
  { appPath: "/Applications/Safari Alias.app", bundleId: "safari", displayName: "Safari" },
  { appPath: "/Applications/Safari Duplicate.app", bundleId: "safari", displayName: "Safari Duplicate" },
  { appPath: "/Applications/Codex.app", bundleId: "com.openai.codex", displayName: "Codex" },
];
const browserRuntime = createOpenTargetRegistryRuntime(dependencies({
  async scanNativeBrowsers() {
    return { applications: scannedBrowsers, defaultApplicationPath: "/Applications/Safari.app" };
  },
}));
const browsers = await browserRuntime.discoverNativeBrowsers("scan");
equal(browsers.map(({ bundleId }) => bundleId), ["safari", "chrome"], "browser discovery sorts default, filters Codex, and deduplicates bundle");
equal(browsers[0].default, true, "canonical default browser is marked");
equal(browsers[1].default, undefined, "non-default browser omits default flag");

let knownCalls = 0;
const knownRuntime = createOpenTargetRegistryRuntime(dependencies({
  async scanNativeBrowsers() { return { applications: [], defaultApplicationPath: null }; },
  async discoverKnownBrowsers(options) {
    knownCalls += 1;
    equal(options, { discovery: "known", limit: 5, order: "usage" }, "known fallback receives bounded usage query");
    return [{ appPath: "/Applications/Firefox.app", bundleId: "firefox", displayName: "Firefox" }];
  },
}));
equal((await knownRuntime.discoverNativeBrowsers("scan"))[0].bundleId, "firefox", "empty scan falls back to known browsers");
equal(knownCalls, 1, "known browser fallback runs once");

const linuxApplications = Array.from({ length: 7 }, (_, index) => ({
  appPath: `/usr/share/applications/app-${index}.desktop`,
  bundleId: `app-${index}`,
  displayName: `App ${index}`,
}));
applicationLists.set("/tmp/linux.png", linuxApplications);
const linuxRuntime = createOpenTargetRegistryRuntime(dependencies({
  platform: "linux",
  async discoverLinuxBrowsers() {
    return { applications: linuxApplications, defaultApplicationPath: null };
  },
}));
equal((await linuxRuntime.listApplications("/tmp/linux.png", { includeCodexTargets: false, limit: 5 })).length, 5, "Linux application list enforces local slice limit");
equal((await linuxRuntime.discoverNativeBrowsers("scan")).length, 5, "Linux browser discovery enforces target limit");
equal((await linuxRuntime.nativeTarget({ appPath: "/no/icon", bundleId: "x", displayName: "X" })).icon, "icon:/no/icon", "resolved Linux icon is retained");

ok(assertions >= 35, "open-target registry runtime has broad projection, launch, application, and browser coverage");
console.log(`${assertions} main open target registry runtime owner assertions passed`);
