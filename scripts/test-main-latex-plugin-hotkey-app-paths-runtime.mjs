import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

let assertions = 0;
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions += 1; };
const importBundle = async (entry, stubs) => {
  const output = await build({
    entryPoints: [new URL(entry, import.meta.url).pathname], bundle: true, format: "esm", platform: "node", target: "node22", write: false,
    plugins: [{ name: "runtime-stubs", setup(api) {
      for (const [index, [pattern, contents]] of stubs.entries()) {
        const namespace = `stub-${index}`;
        api.onResolve({ filter: pattern }, ({ path }) => ({ path, namespace }));
        api.onLoad({ filter: /.*/, namespace }, ({ path }) => ({ contents: contents(path), loader: "js" }));
      }
    } }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString("base64")}`);
};

globalThis.__shortcutCalls = [];
globalThis.__registeredCallbacks = new Map();
const hotkey = await importBundle("../src/main/main-app/hotkey/global-shortcut.ts", [
  [/^electron$/, () => `
    export const app = { getAppPath: () => "/app" };
    export const globalShortcut = {
      register(key, callback) { globalThis.__shortcutCalls.push(["register", key]); globalThis.__registeredCallbacks.set(key, callback); return true; },
      unregister(key) { globalThis.__shortcutCalls.push(["unregister", key]); globalThis.__registeredCallbacks.delete(key); },
    };
  `],
  [/^@chunk\/logger$/, () => `export const getLogger = () => ({ warning() {} }); export const memoizedTaggedLogger = () => () => ({ debug() {}, warning() {} });`],
]);
let pressed = 0;
const registration = hotkey.registerGlobalHotkey("CmdOrCtrl+K", { onPressed: () => { pressed += 1; } });
equal(registration != null, true);
equal(globalThis.__shortcutCalls[0][0], "register");
globalThis.__registeredCallbacks.values().next().value();
equal(pressed, 1);
equal(hotkey.registerGlobalHotkey("CmdOrCtrl+K", { onPressed() {} }), null, "duplicate registration accelerator is rejected");
const resume = hotkey.suspendGlobalHotkeys();
equal(globalThis.__shortcutCalls.at(-1)[0], "unregister");
resume();
equal(globalThis.__shortcutCalls.at(-1)[0], "register");
registration.unregister();
equal(globalThis.__shortcutCalls.at(-1)[0], "unregister");
equal(hotkey.validateHotkey("CmdOrCtrl+K", "darwin"), null);
equal(hotkey.validateGlobalDictationHotkey("CmdOrCtrl+K"), null);

const temp = await mkdtemp(join(tmpdir(), "codex-plugin-runtime-test-"));
globalThis.__downloadCalls = [];
const pluginRuntime = await importBundle("../src/main/main-app/plugins/download-internal-plugins.ts", [
  [/^@chunk\/shared$/, () => `
    const schema = () => ({ optional() { return this; }, parse(value) { return value; } });
    export const Z = async () => true; export const Ho = schema(); export const Q = () => ${JSON.stringify(temp)};
    export const X = "internal"; export const Ef = () => schema(); export const Of = () => schema(); export const xf = () => schema();
    export const tt = async (query, paths, limit, options) => { globalThis.__downloadCalls.push([query, paths, limit, options.rgPath]); return [{ path: paths[0] + "/match" }]; };
    export const zn = () => "/resources/rg";
  `],
  [/^@chunk\/logger$/, () => `export const memoizedTaggedLogger = () => () => ({ error() {} });`],
  [/^\.\.\/misc\/workspace-paths$/, () => `export const convertPathForExecutionHost = (path) => path;`],
]);
equal(pluginRuntime.assertLocalHost("local"), undefined);
assert.throws(() => pluginRuntime.assertLocalHost("remote"), /only supported on the local host/); assertions += 1;
equal(await pluginRuntime.searchWithRipgrep({ query: " needle ", cwd: temp, limit: 5 }), [{ path: `${temp}/match` }]);
equal(globalThis.__downloadCalls[0].slice(0, 3), ["needle", [temp], 5]);
let reloads = 0;
const pluginResult = await pluginRuntime.downloadInternalPlugins({
  appServerConnection: {
    getUserSavedConfiguration: async () => ({}),
    addMarketplace: async () => ({ alreadyAdded: false, marketplaceName: "openai-internal-testing" }),
    sendAppServerRequest: async (method) => { equal(method, "config/mcpServer/reload"); reloads += 1; },
  },
  config: { version: "1" }, codexHome: temp, errorReporter: { reportNonFatal() {} }, downloadPlugins: async () => true,
});
equal(pluginResult, { marketplaceUpdated: true });
equal(reloads, 1);

globalThis.__keymap = { bindings: [{ command: "voice", key: "Cmd+V" }] };
const appPaths = await importBundle("../src/main/main-app/util/app-paths.ts", [
  [/^electron$/, () => `export const nativeImage = { createFromPath: () => ({ isEmpty: () => true, toDataURL: () => "data:" }) };`],
  [/^@chunk\/shared$/, () => `
    export const Dl = (path) => path; export const xl = () => false; export const Ui = () => false; export const bl = () => false;
    export const f = () => false; export const El = (path) => path; export const Ct = () => globalThis.__keymap;
    export const Tt = async (value) => value; export const Bi = (env) => env;
  `],
  [/^\.\.\/windows\/native-app-icons$/, () => `export const getWindowsAppIconSmall = async () => null;`],
  [/^\.\.\/platform\/windows-account$/, () => `export const isNetworkDrive = () => false; export const supportsPersistentAcls = async () => true;`],
  [/^\.\.\/platform\/linux-applications$/, () => `export const resolveLinuxDesktopEntryIcon = () => null;`],
]);
equal(appPaths.lookupCommandHotkey("voice"), { hasBinding: true, hotkey: "Cmd+V" });
equal(appPaths.lookupCommandHotkey("other", { bindings: [{ command: "other", key: "Alt+O" }] }), { hasBinding: true, hotkey: "Alt+O" });
equal(appPaths.preferKeymapHotkey({ keymapHotkey: { hasBinding: false, hotkey: null }, legacyHotkey: "Ctrl+L" }), "Ctrl+L");
equal(appPaths.isPathInside("/root/child", "/root"), true);
equal(appPaths.isPathInside("/root", "/root"), false);

const latex = await importBundle("../src/main/main-app/latex/compile.ts", [
  [/^@chunk\/shared$/, () => `export const Kn = () => {}; export const Bo = ({ codexHome }) => codexHome; export const Ul = () => "market";`],
  [/^@chunk\/bootstrap$/, () => `const buildFlavor = { resolve: () => "prod" }; export { buildFlavor as in };`],
  [/^\.\.\/plugins\/marketplace$/, () => `export const selectBundledMarketplaces = ({ marketplaces }) => marketplaces;`],
]);
equal(latex.tectonicExecutablePath("/plugin", "linux"), "/plugin/bin/tectonic");
equal(latex.tectonicExecutablePath("C:\\plugin", "win32"), "C:\\plugin\\bin\\tectonic.exe");
equal(await latex.compileLatexArtifact("/missing.tex", null), { contentsBase64: null });

const main = fs.readFileSync(new URL("../.reference/originals/main/main-C-Mhak1n.ts", import.meta.url), "utf8");
for (const modulePath of ["latex/compile.js", "plugins/download-internal-plugins.js", "hotkey/global-shortcut.js", "util/app-paths.js"]) equal(main.includes(modulePath), true, `${modulePath} is wired`);
for (const oldOwner of ["async function QRe(", "async function lze(", "function jze(", "function qV(", "async function oH(", "function pH("]) equal(main.includes(oldOwner), false, `${oldOwner} is removed`);

await rm(temp, { recursive: true, force: true });
console.log(`${assertions} main latex/plugin/hotkey/app-paths runtime assertions passed`);
