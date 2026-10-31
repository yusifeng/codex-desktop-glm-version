import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/open-target/jetbrains-targets.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createJetBrainsTargetRuntime } = await import(
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

const toolboxRoot = "/Users/test/Library/Application Support/JetBrains/Toolbox/apps";
const directoryEntries = new Map([
  [toolboxRoot, ["IDEA-U", "AndroidStudio"]],
  [`${toolboxRoot}/IDEA-U`, ["ch-0"]],
  [`${toolboxRoot}/IDEA-U/ch-0`, ["2024.1", "2025.1"]],
  [`${toolboxRoot}/IDEA-U/ch-0/2025.1`, ["IntelliJ IDEA.app"]],
  [`${toolboxRoot}/IDEA-U/ch-0/2024.1`, ["IntelliJ IDEA.app"]],
  [`${toolboxRoot}/AndroidStudio`, ["ch-0"]],
  [`${toolboxRoot}/AndroidStudio/ch-0`, ["2025.2"]],
  [`${toolboxRoot}/AndroidStudio/ch-0/2025.2`, ["Android Studio.app"]],
  ["/Program Files/JetBrains", ["IntelliJ IDEA 2024.1", "IntelliJ IDEA 2025.1", "Rider 2025.1"]],
]);
const existing = new Set([
  `${toolboxRoot}/IDEA-U/ch-0/2025.1/IntelliJ IDEA.app/Contents/MacOS/idea`,
  `${toolboxRoot}/IDEA-U/ch-0/2024.1/IntelliJ IDEA.app/Contents/MacOS/idea`,
  `${toolboxRoot}/AndroidStudio/ch-0/2025.2/Android Studio.app/Contents/MacOS/studio`,
  "/Program Files/JetBrains/IntelliJ IDEA 2025.1/bin/idea64.exe",
  "/Program Files/JetBrains/Rider 2025.1/bin/rider64.exe",
  "/Users/test/.local/share/JetBrains/Toolbox/scripts/webstorm",
]);
let readdirCalls = 0;
const fs = {
  readdirSync(value) {
    readdirCalls += 1;
    if (!directoryEntries.has(value)) throw new Error(`missing ${value}`);
    return directoryEntries.get(value);
  },
  existsSync: (value) => existing.has(value),
};
const logs = [];
const linuxLaunches = [];
const executableLinks = new Map();
const executables = new Map();
const desktopLookups = [];
const macApplications = new Map();
const macExecutables = new Map();
const windowsFallbacks = [];

function dependencies(overrides = {}) {
  return {
    platform: "darwin",
    path,
    fs,
    os: { homedir: () => "/Users/test" },
    env: { ProgramFiles: "/Program Files" },
    createLogger: () => () => ({ debug: (...args) => logs.push(args) }),
    findExecutable: (command) => executables.get(command) ?? null,
    resolveExecutableLink: (value) => executableLinks.get(value) ?? null,
    findWindowsInstall(paths) { windowsFallbacks.push(paths); return "/fallback/ide.exe"; },
    findLinuxDesktopEntry(entries) { desktopLookups.push(entries); return entries?.[0] ?? null; },
    findExistingMacApplication: (paths) => paths.map((value) => macApplications.get(value)).find(Boolean) ?? null,
    findMacApplicationExecutable: (prefix, executable) => macExecutables.get(`${prefix}:${executable}`) ?? null,
    async launchLinuxEditor(...args) { linuxLaunches.push(args); },
    ...overrides,
  };
}

const runtime = createJetBrainsTargetRuntime(dependencies());
equal(runtime.buildJetBrainsArgs("/repo/file.ts", null), ["/repo/file.ts"], "plain JetBrains args contain path");
equal(runtime.buildJetBrainsArgs("/repo/file.ts", { line: 7, column: 3 }), ["--line", "7", "--column", "3", "/repo/file.ts"], "location args preserve line and column");

const scanned = runtime.scanToolboxApplications(toolboxRoot);
equal(scanned.get("intellij"), `${toolboxRoot}/IDEA-U/ch-0/2025.1/IntelliJ IDEA.app/Contents/MacOS/idea`, "Toolbox scan chooses newest IntelliJ version");
equal(scanned.get("androidStudio"), `${toolboxRoot}/AndroidStudio/ch-0/2025.2/Android Studio.app/Contents/MacOS/studio`, "Toolbox scan detects Android Studio");
equal(scanned.size, 2, "Toolbox scan only records matching applications");
const callsAfterScan = readdirCalls;
const cachedOne = runtime.getToolboxExecutables();
const callsAfterFirstCache = readdirCalls;
const cachedTwo = runtime.getToolboxExecutables();
equal(cachedOne, cachedTwo, "Toolbox discovery map is cached by identity");
equal(readdirCalls, callsAfterFirstCache, "cached Toolbox lookup performs no more filesystem reads");
ok(callsAfterFirstCache > callsAfterScan, "first cached lookup scans configured Toolbox root");

macApplications.set("/Applications/IntelliJ IDEA.app/Contents/MacOS/idea", "/Applications/IntelliJ IDEA.app/Contents/MacOS/idea");
equal(runtime.detectMacTarget("intellij", ["/Applications/IntelliJ IDEA.app/Contents/MacOS/idea"], "IntelliJ IDEA", "idea"), "/Applications/IntelliJ IDEA.app/Contents/MacOS/idea", "direct macOS application path has first priority");
macApplications.clear();
macExecutables.set("IntelliJ IDEA:idea", "/Applications/IntelliJ Preview.app/Contents/MacOS/idea");
equal(runtime.detectMacTarget("intellij", ["missing"], "IntelliJ IDEA", "idea"), "/Applications/IntelliJ Preview.app/Contents/MacOS/idea", "bundle-prefix executable is second priority");
macExecutables.clear();
equal(runtime.detectMacTarget("intellij", ["missing"], "IntelliJ IDEA", "idea"), `${toolboxRoot}/IDEA-U/ch-0/2025.1/IntelliJ IDEA.app/Contents/MacOS/idea`, "Toolbox cache is final macOS fallback");
equal(runtime.detectMacTarget("missing", ["missing"], "Missing", "missing"), null, "missing macOS target returns null");

executables.set("idea64.exe", "/path/idea64.exe");
executableLinks.set("/path/idea64.exe", "/resolved/idea64.exe");
equal(runtime.detectWindowsTarget({
  pathCommands: ["idea64.exe"], installDirPrefixes: ["intellij idea"], installExecutables: ["idea64.exe"],
}), "/resolved/idea64.exe", "Windows PATH command resolves shortcut/link target");
executables.clear();
equal(runtime.findWindowsInstallation({ installDirPrefixes: ["intellij idea"], installExecutables: ["idea64.exe"] }), "/Program Files/JetBrains/IntelliJ IDEA 2025.1/bin/idea64.exe", "Windows install scan chooses newest matching directory");
equal(runtime.findWindowsInstallation({ installDirPrefixes: ["rider"], installExecutables: ["rider64.exe"] }), "/Program Files/JetBrains/Rider 2025.1/bin/rider64.exe", "Windows scan supports Rider");
equal(runtime.findWindowsInstallation({ installDirPrefixes: ["missing"], installExecutables: ["missing.exe"] }), null, "missing Windows installation returns null");
equal(runtime.detectWindowsTarget({
  pathCommands: ["missing"], installDirPrefixes: ["missing"], installExecutables: ["missing.exe"], fallbackPaths: [["Fallback", "ide.exe"]],
}), "/fallback/ide.exe", "Windows fallback paths run after PATH and install roots");
equal(windowsFallbacks.at(-1), [["Fallback", "ide.exe"]], "Windows fallback receives configured relative paths");

executables.set("idea.sh", "/usr/bin/idea.sh");
equal(runtime.detectLinuxTarget("intellij", "idea"), "/usr/bin/idea.sh", "IntelliJ Linux detection checks shell alias");
executables.clear();
equal(runtime.detectLinuxTarget("webstorm", "webstorm"), "/Users/test/.local/share/JetBrains/Toolbox/scripts/webstorm", "Linux detection checks Toolbox script");
equal(runtime.detectLinuxTarget("phpstorm", "phpstorm"), "jetbrains-phpstorm.desktop", "Linux detection falls back to desktop entry");
equal(desktopLookups.at(-1)[0], "jetbrains-phpstorm.desktop", "desktop entry priority is stable");

const targetIds = ["androidStudio", "intellij", "rider", "goland", "rustrover", "pycharm", "webstorm", "phpstorm"];
for (const id of targetIds) equal(runtime[id].id, id, `${id} descriptor is exported`);
equal(runtime.intellij.platforms.darwin.label, "IntelliJ IDEA", "IntelliJ descriptor keeps label");
equal(runtime.webstorm.platforms.darwin.icon, "apps/webstorm.svg", "WebStorm descriptor keeps SVG icon");
equal(runtime.intellij.platforms.darwin.kind, "editor", "JetBrains target kind is editor");
equal(typeof runtime.intellij.platforms.darwin.detect, "function", "macOS detection is wired");
equal(typeof runtime.intellij.platforms.win32.detect, "function", "Windows detection is wired for IntelliJ");
equal(runtime.goland.platforms.win32, undefined, "GoLand has no generated Windows descriptor without config");
equal(typeof runtime.goland.platforms.linux.detect, "function", "Linux detection is wired for GoLand");
equal(runtime.androidStudio.platforms.darwin.args("file", { line: 1, column: 2 }), ["--line", "1", "--column", "2", "file"], "descriptor uses shared location args");
await runtime.intellij.platforms.linux.open({ command: "idea", path: "/repo" });
equal(linuxLaunches.length, 1, "Linux descriptor delegates to shared launcher");
equal(linuxLaunches[0][0], { command: "idea", path: "/repo" }, "Linux launcher receives request");
equal(typeof linuxLaunches[0][1], "function", "Linux launcher receives JetBrains args builder");

const linuxRuntime = createJetBrainsTargetRuntime(dependencies({ platform: "linux" }));
equal(linuxRuntime.scanToolboxApplications(toolboxRoot).size, 0, "Toolbox app scan is disabled off macOS");

const missingRootRuntime = createJetBrainsTargetRuntime(dependencies({
  fs: { readdirSync() { throw new Error("denied"); }, existsSync() { return false; } },
}));
equal(missingRootRuntime.scanToolboxApplications("/missing").size, 0, "unreadable Toolbox root yields empty discovery");
equal(missingRootRuntime.getToolboxExecutables().size, 0, "unreadable configured Toolbox root is cached empty");

ok(assertions >= 40, "JetBrains target owner has broad Toolbox, platform detection, descriptor, and launch coverage");
console.log(`${assertions} main JetBrains target owner assertions passed`);
