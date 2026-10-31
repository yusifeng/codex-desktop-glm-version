import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/open-target/standalone-editor-targets.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createStandaloneEditorTargetRuntime } = await import(
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

function fixture(overrides = {}) {
  const pathApi = overrides.path ?? path;
  const files = new Set([
    "/Applications/BBEdit.app",
    "/Applications/Emacs.app",
    "/Applications/TextMate.app",
    "/Applications/Xcode.app",
    "/Developer/usr/bin/xed",
  ]);
  const directories = new Map();
  const executables = new Map();
  const links = new Map();
  const spawns = [];
  const linuxLaunches = [];
  const logs = [];
  const descriptorOptions = [];
  const windowsInstalls = [];
  const globPatterns = [];
  const state = {
    files,
    directories,
    executables,
    links,
    spawns,
    linuxLaunches,
    logs,
    descriptorOptions,
    windowsInstalls,
    globPatterns,
  };
  const dependencies = {
    platform: "darwin",
    path: pathApi,
    fs: {
      existsSync: (value) => files.has(value) || directories.has(value),
      statSync: (value) => ({ isDirectory: () => directories.has(value) }),
      readdirSync: (value) => {
        if (!directories.has(value)) throw Error("missing");
        return directories.get(value);
      },
    },
    env: { KEEP: "yes" },
    createLogger: () => () => ({ debug: (...args) => logs.push(args) }),
    createTargetDescriptor(options) {
      descriptorOptions.push(options);
      return { id: options.id, options };
    },
    findMacApplicationBundle: (prefix) => {
      const candidate = `/Applications/${prefix}.app`;
      return files.has(candidate) ? candidate : null;
    },
    findExistingMacApplication: (candidates) => candidates.find((value) => files.has(value)) ?? null,
    findMacApplicationExecutable: (prefix, executable) =>
      files.has(`/Users/me/${prefix}.app/Contents/MacOS/${executable}`)
        ? `/Users/me/${prefix}.app/Contents/MacOS/${executable}`
        : null,
    findCommandOrDesktopEntry: (commands, entries) =>
      commands.map((command) => executables.get(command)).find(Boolean) ?? entries[0] ?? null,
    findExecutable: (command) => executables.get(command) ?? null,
    resolveExecutableLink: (value) => links.get(value) ?? null,
    findSiblingExecutable: (value, executable) =>
      files.has(pathApi.join(pathApi.dirname(value), executable))
        ? pathApi.join(pathApi.dirname(value), executable)
        : null,
    findWindowsInstall(paths) {
      windowsInstalls.push(paths);
      return null;
    },
    findWindowsExecutableGlob(pattern) {
      globPatterns.push(pattern);
      return "C:\\Glob\\devenv.exe";
    },
    async launchLinuxEditor(options, buildArgs) {
      linuxLaunches.push({ options, args: buildArgs(
        options.path,
        options.location,
        options.hostConfig,
        options.remoteWorkspaceRoot,
        options.remotePath,
      ) });
    },
    isRemoteHost: (value) => value?.kind === "ssh",
    remoteHostLabel: (value) => value.label ?? null,
    pathToFileURL,
    sanitizeEnvironment: (env) => ({ ...env, SANITIZED: "1" }),
    spawnSync: () => ({ status: 0, stdout: "/Developer\n" }),
    async spawn(command, args) { spawns.push({ command, args }); },
    ...overrides,
  };
  return { dependencies, state };
}

const base = fixture();
const runtime = createStandaloneEditorTargetRuntime(base.dependencies);
equal([
  runtime.bbedit.id,
  runtime.emacs.id,
  runtime.sublimeText.id,
  runtime.textmate.id,
  runtime.visualStudio.id,
  runtime.xcode.id,
  runtime.zed.id,
], ["bbedit", "emacs", "sublimeText", "textmate", "visualStudio", "xcode", "zed"], "all seven editor descriptors are exported");
equal(base.state.descriptorOptions.length, 2, "shared target constructor is used for Sublime and Visual Studio");
equal(runtime.sublimeText.options.label, "Sublime Text", "Sublime label is stable");
equal(runtime.visualStudio.options.icon, "apps/vscode.png", "Visual Studio icon is stable");
equal(runtime.xcode.platforms.darwin.icon, "apps/xcode.png", "Xcode icon is stable");
equal(runtime.zed.platforms.linux.kind, "editor", "Zed Linux target remains an editor");
equal(runtime.bbedit.platforms.darwin.detect(), "/usr/bin/open", "BBEdit app detection uses LaunchServices");
equal(runtime.bbedit.platforms.darwin.args("/repo/a.txt"), ["-a", "BBEdit", "/repo/a.txt"], "BBEdit LaunchServices args are stable");
equal(runtime.emacs.platforms.darwin.detect(), "/usr/bin/open", "Emacs app detection uses LaunchServices");
equal(runtime.emacsArgs("/repo/a.el", null), ["/repo/a.el"], "Emacs args omit location when absent");
equal(runtime.emacsArgs("/repo/a.el", { line: 8, column: 3 }), ["+8:3", "/repo/a.el"], "Emacs args preserve line and column");
equal(runtime.emacs.platforms.linux.detect(), "emacs.desktop", "Emacs Linux detection falls back to desktop entry");
equal(runtime.sublimeText.options.linux.detect(), "sublime_text.desktop", "Sublime Linux detection uses desktop fallback");
equal(runtime.zed.platforms.linux.detect(), "dev.zed.Zed.desktop", "Zed Linux detection uses stable desktop priority");
await runtime.emacs.platforms.linux.open({ path: "/repo/a.el", location: { line: 2, column: 1 } });
equal(base.state.linuxLaunches[0].args, ["+2:1", "/repo/a.el"], "Emacs Linux launch delegates with Emacs args");

equal(runtime.formatEditorLocation("/repo/a.ts", null), "/repo/a.ts", "plain editor path stays unchanged");
equal(runtime.formatEditorLocation("/repo/a.ts", { line: 4, column: 5 }), "/repo/a.ts:4:5", "location suffix is stable");
equal(runtime.buildSshUri(" host ", "repo/a b.ts"), "ssh://host/repo/a%20b.ts", "SSH URI trims and percent-encodes path segments");
equal(runtime.buildSshUri("", "/repo"), null, "SSH URI rejects empty host");
equal(runtime.editorArgs("/local", null, null, null, null), ["/local"], "local editor args use local path");
const remote = { kind: "ssh", label: "dev@example.com" };
equal(runtime.editorArgs("ignored", { line: 7, column: 9 }, remote, "/workspace", "/workspace/a b.ts"), [
  "ssh://dev@example.com/workspace/a%20b.ts:7:9",
], "remote editor args use encoded SSH URI and location");
assert.throws(
  () => runtime.editorArgs("ignored", null, { kind: "ssh", label: null }, "/workspace", null),
  /SSH open is not available/,
);
assertions += 1;
assert.throws(
  () => runtime.editorArgs("ignored", null, remote, null, null),
  /Missing remote path/,
);
assertions += 1;

base.state.executables.set("subl", "/usr/local/bin/subl");
equal(runtime.detectSublimeMac(), "/usr/local/bin/subl", "Sublime macOS detection prefers PATH");
base.state.executables.delete("subl");
base.state.files.add("/Applications/Sublime Text.app");
base.state.files.add("/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl");
equal(runtime.detectSublimeMac(), "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl", "Sublime macOS detection resolves bundle CLI");

const sublimeWindows = fixture({ platform: "win32", path: path.win32 });
sublimeWindows.state.executables.set("subl.exe", "C:\\Sublime\\subl.exe");
sublimeWindows.state.links.set("C:\\Sublime\\subl.exe", "C:\\Sublime\\subl.exe");
sublimeWindows.state.files.add("C:\\Sublime\\sublime_text.exe");
const sublimeWindowsRuntime = createStandaloneEditorTargetRuntime(sublimeWindows.dependencies);
equal(sublimeWindowsRuntime.detectSublimeWindows(), "C:\\Sublime\\sublime_text.exe", "Sublime Windows resolves sibling GUI executable");
sublimeWindows.state.executables.clear();
equal(sublimeWindowsRuntime.detectSublimeWindows(), null, "Sublime Windows uses install fallback when PATH is absent");
equal(sublimeWindows.state.windowsInstalls.at(-1), [
  ["Sublime Text", "sublime_text.exe"],
  ["Sublime Text", "subl.exe"],
], "Sublime Windows checks both install layouts");

equal(runtime.textMateArgs("/repo/a.swift", null), ["-a", "TextMate", "/repo/a.swift"], "TextMate plain args use file path");
const textMateUrl = runtime.textMateArgs("/repo/a b.swift", { line: 3, column: 6 })[2];
ok(textMateUrl.startsWith("txmt://open/?"), "TextMate location uses txmt URL");
ok(textMateUrl.includes("line=3") && textMateUrl.includes("column=6"), "TextMate URL includes location");
ok(textMateUrl.includes("a+b.swift") || textMateUrl.includes("a%2520b.swift"), "TextMate URL contains encoded file URL");
equal(runtime.textmate.platforms.darwin.detect(), "/usr/bin/open", "TextMate app detection uses LaunchServices");
equal(runtime.visualStudio.options.win32.args("C:\\repo\\a.sln"), ["C:\\repo\\a.sln"], "Visual Studio args preserve target path");
equal(runtime.xcode.platforms.darwin.args("/repo/a.swift"), ["/repo/a.swift"], "Xcode descriptor args preserve target path");

const visualPath = fixture({ platform: "win32", path: path.win32 });
visualPath.state.executables.set("devenv.exe", "C:\\bin\\devenv.exe");
visualPath.state.links.set("C:\\bin\\devenv.exe", "C:\\VS\\devenv.exe");
const visualPathRuntime = createStandaloneEditorTargetRuntime(visualPath.dependencies);
equal(visualPathRuntime.detectVisualStudioWindows(), "C:\\VS\\devenv.exe", "Visual Studio prefers resolved PATH executable");
visualPath.state.executables.clear();
equal(visualPathRuntime.detectVisualStudioWindows(), "C:\\Glob\\devenv.exe", "Visual Studio falls back to global executable scan");
equal(visualPath.state.windowsInstalls.at(-1).length, 15, "Visual Studio checks three versions and five editions");
equal(visualPath.state.globPatterns.at(-1), "**\\Common7\\IDE\\devenv.exe", "Visual Studio uses stable fallback glob");

equal(runtime.resolveXcodeRuntime(), {
  appPath: "/Applications/Xcode.app",
  xedPath: "/Developer/usr/bin/xed",
}, "Xcode runtime prefers xcode-select xed");
equal(runtime.xcode.platforms.darwin.detect(), "/Developer/usr/bin/xed", "Xcode descriptor detects selected xed");
base.state.directories.set("/repo", ["App.xcworkspace", "App.xcodeproj", "Package.swift"]);
base.state.directories.set("/repo/Sources", []);
equal(runtime.findXcodeContainer("/repo/Sources/file.swift"), "/repo/App.xcworkspace", "Xcode search prefers workspace over project");
base.state.directories.set("/repo", ["App.xcodeproj", "Package.swift"]);
equal(runtime.findXcodeContainer("/repo/Sources/file.swift"), "/repo/App.xcodeproj", "Xcode search falls back to project");
base.state.directories.set("/repo", ["Package.swift"]);
equal(runtime.findXcodeContainer("/repo/Sources/file.swift"), "/repo", "Xcode search falls back to nearest Swift package");
await runtime.openXcode("/repo/Sources/file.swift", { line: 11, column: 2 });
equal(base.state.spawns.at(-1), {
  command: "/Developer/usr/bin/xed",
  args: ["--project", "/repo", "--line", "11", "/repo/Sources/file.swift"],
}, "Xcode xed launch preserves project then line then path order");
ok(base.state.logs.some(([message]) => message.includes("via xed")), "Xcode xed launch is logged");

const xcodeFallback = fixture({
  spawnSync: () => ({ status: 1, stdout: "" }),
});
xcodeFallback.state.files.delete("/Developer/usr/bin/xed");
const xcodeFallbackRuntime = createStandaloneEditorTargetRuntime(xcodeFallback.dependencies);
equal(xcodeFallbackRuntime.resolveXcodeRuntime(), {
  appPath: "/Applications/Xcode.app",
  xedPath: null,
}, "Xcode runtime retains app when xed is unavailable");
await xcodeFallbackRuntime.openXcode("/repo/a.swift", null);
equal(xcodeFallback.state.spawns.at(-1), {
  command: "/usr/bin/open",
  args: ["-a", "/Applications/Xcode.app", "/repo/a.swift"],
}, "Xcode launch falls back to LaunchServices");

const xcodeMissing = fixture({
  platform: "linux",
  findMacApplicationBundle: () => null,
  findExistingMacApplication: () => null,
});
const xcodeMissingRuntime = createStandaloneEditorTargetRuntime(xcodeMissing.dependencies);
equal(xcodeMissingRuntime.resolveXcodeRuntime(), null, "Xcode runtime is unavailable off macOS");
await assert.rejects(() => xcodeMissingRuntime.openXcode("/repo/a.swift", null), /not available/);
assertions += 1;

base.state.executables.set("zed", "/usr/local/bin/zed");
equal(runtime.detectZedMac(), "/usr/local/bin/zed", "Zed macOS detection prefers PATH");
equal(runtime.macApplicationPath("/Applications/Zed.app/Contents/MacOS/zed"), "/Applications/Zed.app", "Zed extracts macOS app bundle");
equal(runtime.macApplicationPath("/usr/local/bin/zed"), null, "Zed ignores non-bundle command");
const zedWindows = fixture({ platform: "win32", path: path.win32 });
zedWindows.state.executables.set("zed.exe", "C:\\bin\\zed.exe");
zedWindows.state.links.set("C:\\bin\\zed.exe", "C:\\Zed\\Zed.exe");
const zedWindowsRuntime = createStandaloneEditorTargetRuntime(zedWindows.dependencies);
equal(zedWindowsRuntime.detectZedWindows(), "C:\\Zed\\Zed.exe", "Zed Windows resolves PATH link");

base.state.spawns.length = 0;
await runtime.openZed({
  command: "/Applications/Zed.app/Contents/MacOS/zed",
  path: "/repo/a.ts",
  location: null,
});
equal(base.state.spawns, [{
  command: "/usr/bin/open",
  args: ["-a", "/Applications/Zed.app", "/repo/a.ts"],
}], "Zed bundle launch without location uses LaunchServices once");

base.state.spawns.length = 0;
await runtime.openZed({
  command: "/Applications/Zed.app/Contents/MacOS/zed",
  path: "/repo/a.ts",
  location: { line: 5, column: 4 },
});
equal(base.state.spawns, [
  { command: "/usr/bin/open", args: ["-a", "/Applications/Zed.app", "/repo/a.ts"] },
  { command: "/usr/local/bin/zed", args: ["/repo/a.ts:5:4"] },
], "Zed bundle launch opens app before CLI location dispatch");

const zedRemote = fixture();
const zedRemoteRuntime = createStandaloneEditorTargetRuntime(zedRemote.dependencies);
await zedRemoteRuntime.openZed({
  command: "/usr/local/bin/zed",
  path: "/local/a.ts",
  location: { line: 2, column: 1 },
  hostConfig: remote,
  remoteWorkspaceRoot: "/remote",
  remotePath: "/remote/a.ts",
});
equal(zedRemote.state.spawns.at(-1), {
  command: "/usr/local/bin/zed",
  args: ["ssh://dev@example.com/remote/a.ts:2:1"],
}, "Zed direct launch preserves remote SSH args");

ok(assertions >= 50, "standalone editor owner has broad descriptor, detection, args, and launch coverage");
console.log(`${assertions} main standalone editor target owner assertions passed`);
