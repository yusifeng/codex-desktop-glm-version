import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { transform } from "esbuild";

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

const source = fs.readFileSync(
  new URL("../src/main/main-app/misc/open-in-service.ts", import.meta.url),
  "utf8",
);
const transpiled = await transform(source, {
  loader: "ts",
  format: "cjs",
  target: "es2022",
});
const module = { exports: {} };
Function("require", "module", "exports", transpiled.code)(
  () => { throw new Error("unexpected import"); },
  module,
  module.exports,
);

const calls = [];
const logs = [];
const settingsValues = new Map([
  ["custom-handlers", null],
  ["open-preferences", { global: "vscode", perPath: { "/repo": "fileManager" } }],
]);
const settingsStore = {
  getEffective: (key) => settingsValues.get(key),
  set: (key, value) => settingsValues.set(key, value),
};
const worker = async ({ method, params }) => {
  calls.push(["worker", method, params]);
  if (method === "load-target-icon") return { icon: `icon:${params.target}` };
  return { command: params.target === "missing" ? null : `/bin/${params.target}` };
};
const targets = [
  { id: "vscode", label: "VS Code", icon: "apps/vscode.png", kind: "editor" },
  { id: "fileManager", label: "Files", icon: "apps/files.png", kind: "fileManager" },
  { id: "systemDefault", label: "Default", icon: "apps/default.png", kind: "systemDefault" },
];
const dependencies = {
  DisposableBase: class {},
  createLogger: (tag) => () => ({
    error: (message, data) => logs.push([tag, "error", message, data]),
    warning: (message, data) => logs.push([tag, "warning", message, data]),
  }),
  platform: "darwin",
  extname: path.extname,
  customFileHandlersKey: "custom-handlers",
  openInTargetPreferencesKey: "open-preferences",
  defaultTargets: targets,
  parseCustomTargets: () => [],
  normalizeTargetIcon: (icon) => `/normalized/${icon}`,
  openWithTarget: async (...args) => calls.push(["open-target", ...args]),
  isEditorTarget: (target, candidates) => candidates.some(({ id, kind }) => id === target && kind === "editor"),
  filterTargetIds: (_host, available) => available,
  filterTargets: (candidates) => candidates,
  resolveTarget: ({ requestedTarget, requestedTargetWasFiltered, preferredTarget, shouldUseFileManager }) =>
    shouldUseFileManager ? "fileManager" : requestedTarget != null && !requestedTargetWasFiltered ? requestedTarget : preferredTarget,
  isHostConfig: (value) => value?.kind === "remote",
  translateHostPath: (value) => value ?? null,
  defaultCwd: () => "/default",
  resolvePath: (value, cwd) => path.posix.resolve(cwd ?? "/", value),
  isUrl: (value) => /^https?:/.test(value),
  isHtml: (value) => value.endsWith(".html"),
  isNativeDocument: (value) => /\.(docx|png)$/.test(value),
  isDarwinNativeDocument: (value) => value.endsWith(".png"),
  isPlatformDefaultViewerDocument: (value) => value.endsWith(".png"),
  nativeDocumentExtensions: [".docx"],
  discoverNativeBrowsers: async () => [{ id: "browser-native" }],
  discoverDocumentApplications: async () => [{ id: "word-native" }],
  discoverNativeApplications: async () => [{ id: "preview-native" }],
  openExternalLink: async (input) => (calls.push(["external", input]), true),
  shouldOpenInBrowserPane: ({ link }) => link.path.endsWith(".html") && link.target == null,
  browserPaneEnabled: () => true,
  pathToFileUrl: (value) => `file://${value}`,
  isPathOnPlatform: () => false,
  statPath: async (value) => ({ isDirectory: () => value.endsWith("/directory") }),
};

const OpenInService = module.exports.createOpenInServiceClass(dependencies);
const inlineMessages = [];
const service = new OpenInService(
  {},
  {
    get: () => ({
      hostConfig: { kind: "local" },
      platformPath: async () => ({ kind: "posix" }),
    }),
  },
  settingsStore,
  worker,
  "window-1",
  { sendInlineMessageForView: (...args) => inlineMessages.push(args) },
);

equal(await service.detectTarget({ target: "vscode" }), { available: true });
equal(await service.detectTarget({ target: "missing" }), { available: false });

const deferred = await service.getTargets({ cwd: "/repo", deferEnrichment: true });
equal(deferred.preferredTarget, "fileManager");
equal(deferred.availableTargets, []);
equal(deferred.targets[0], {
  id: "vscode",
  target: "vscode",
  label: "VS Code",
  icon: "/normalized/apps/vscode.png",
  kind: "editor",
  hidden: undefined,
  default: undefined,
});

const urlTargets = await service.getTargets({ cwd: "/repo", path: "https://example.test" });
equal(urlTargets.mode, "native");
equal(urlTargets.targets.at(-1), { id: "browser-native" });
equal(urlTargets.availableTargets, ["vscode", "fileManager", "systemDefault"]);

const documentTargets = await service.getTargets({ cwd: "/repo", path: "/repo/file.docx" });
equal(documentTargets.mode, "native");
equal(documentTargets.targets.some(({ id }) => id === "systemDefault"), false);
equal(documentTargets.targets.at(-1), { id: "word-native" });

equal(await service.open({ path: "https://example.test", target: "systemDefault" }), { success: true });
equal(calls.some(([kind]) => kind === "external"), true);

equal(await service.open({
  path: "/repo/index.html",
  cwd: "/repo",
  conversationId: "thread-1",
}), { success: true });
equal(inlineMessages[0], ["window-1", {
  open: true,
  type: "toggle-browser-panel",
  conversationId: "thread-1",
  url: "file:///repo/index.html",
  source: "manual",
  initiator: "open_in_browser_bridge",
}]);

equal(await service.open({
  path: "/repo/file.ts",
  cwd: "/repo",
  target: "vscode",
  persistPreferredTargetPath: "/repo/next",
}), { success: true });
const openCall = calls.find(([kind, target]) => kind === "open-target" && target === "vscode");
equal(openCall[2], "/repo/file.ts");
equal(openCall[3].detectedCommand, "/bin/vscode");
equal(settingsValues.get("open-preferences").perPath["/repo/next"], "vscode");

equal(await service.open({
  path: "/repo/directory",
  cwd: "/repo",
}), { success: true });
equal(calls.some(([kind, target]) => kind === "open-target" && target === "fileManager"), true);

equal(await service.setGlobalPreferredTarget({ target: "systemDefault" }), { success: true });
equal(settingsValues.get("open-preferences").global, "systemDefault");

const unavailable = new OpenInService(
  {},
  { get: () => ({ hostConfig: {}, platformPath: async () => ({}) }) },
  settingsStore,
  null,
  null,
  { sendInlineMessageForView() {} },
);
await assert.rejects(unavailable.detectTarget({ target: "vscode" }), /Open in worker unavailable/);
assertions += 1;
equal(await unavailable.open({ path: "/repo/file.ts", cwd: "/repo" }), { success: false });
equal(logs.some(([tag, level, message]) => tag === "open-in-service" && level === "error" && message === "Failed to open file"), true);

const main = fs.readFileSync(
  new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url),
  "utf8",
);
equal(main.includes('require("./main-app/misc/open-in-service.js")'), true);
equal(main.includes("N0 = createOpenInServiceClass({"), true);
equal(main.includes("N0 = class extends"), false);
for (const oldHelper of [
  "function f6e(", "function y0(", "function b0(", "function x0(",
  "async function S0(", "async function C0(", "function p6e(", "function w0(",
  "function T0(", "function E0(", "function D0(", "function O0(", "function k0(",
]) equal(main.includes(oldHelper), false);

console.log(`${assertions} main open-in service owner assertions passed`);
