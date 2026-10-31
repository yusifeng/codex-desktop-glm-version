import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/open-target/vscode-family-targets.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createVscodeFamilyTargetRuntime } = await import(
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

const files = new Set([
  "/Applications/Cursor.app/Contents/MacOS/Cursor",
  "/Applications/Cursor.app/Contents/Resources/app/out/cli.js",
  "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
  "/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity",
  "/Applications/Devin.app/Contents/Resources/app/bin/devin-desktop",
  "/Applications/Windsurf.app/Contents/Resources/app/bin/windsurf",
]);
const executables = new Map();
const resolvedLinks = new Map();
const editorDescriptors = [];
const commandLookups = [];
const windowsFallbacks = [];
const windowsElectronQueries = [];
const remoteArgsCalls = [];

function dependencies(overrides = {}) {
  return {
    platform: "darwin",
    path,
    fs: { existsSync: (value) => files.has(value) },
    env: {
      NODE_OPTIONS: "--inspect",
      NODE_REPL_EXTERNAL_MODULE: "module",
      KEEP: "yes",
    },
    createEditorTargetDescriptor(options) {
      editorDescriptors.push(options);
      return { id: options.id, options };
    },
    buildEditorArgs: (targetPath, location) => location
      ? ["--goto", `${targetPath}:${location.line}:${location.column}`]
      : ["--goto", targetPath],
    buildVscodeRemoteArgs(options) {
      remoteArgsCalls.push(options);
      return ["--remote-result", options.remotePath];
    },
    isHostConfig: (value) => value?.kind === "ssh",
    findExistingMacApplication: (paths) => paths.find((value) => files.has(value)) ?? null,
    findMacApplicationBundle: (prefix) => prefix === "Cursor" ? "/Applications/Cursor.app" : null,
    macApplicationCandidates: (value) => [value],
    findCommandOrDesktopEntry(commands, entries) {
      commandLookups.push({ commands, entries });
      return commands.map((command) => executables.get(command)).find(Boolean) ?? entries[0] ?? null;
    },
    findExecutable: (command) => executables.get(command) ?? null,
    resolveExecutableLink: (value) => resolvedLinks.get(value) ?? null,
    findWindowsInstall(paths) { windowsFallbacks.push(paths); return "C:\\Fallback\\App.exe"; },
    resolveWindowsElectronApp(options) {
      windowsElectronQueries.push(options);
      return `C:\\Resolved\\${options.executableName}`;
    },
    ...overrides,
  };
}

const runtime = createVscodeFamilyTargetRuntime(dependencies());
equal(runtime.findCursorMacRuntime(), {
  electronBin: "/Applications/Cursor.app/Contents/MacOS/Cursor",
  cliJs: "/Applications/Cursor.app/Contents/Resources/app/out/cli.js",
}, "Cursor macOS runtime requires both Electron binary and CLI entrypoint");
equal(runtime.cursor.options.darwinDetect(), "/Applications/Cursor.app/Contents/MacOS/Cursor", "Cursor descriptor detects Electron binary");
equal(runtime.cursorArgs("/repo/file.ts", { line: 3, column: 2 }), [
  "/Applications/Cursor.app/Contents/Resources/app/out/cli.js",
  "--goto",
  "/repo/file.ts:3:2",
], "Cursor macOS args prepend CLI entrypoint");

equal(runtime.editorArgs("/repo/file.ts", null, null, null, null), ["--goto", "/repo/file.ts"], "local editor args delegate to shared builder");
const sshHost = { kind: "ssh", name: "prod" };
equal(runtime.editorArgs("ignored", { line: 1, column: 2 }, sshHost, "/repo", "/repo/file.ts"), ["--remote-result", "/repo/file.ts"], "remote editor args delegate to VS Code remote builder");
equal(remoteArgsCalls[0], {
  hostConfig: sshHost,
  location: { line: 1, column: 2 },
  remotePath: "/repo/file.ts",
  remoteWorkspaceRoot: "/repo",
}, "remote builder receives complete host context");

equal(runtime.cursorEnvironment(), {
  VSCODE_NODE_OPTIONS: "--inspect",
  VSCODE_NODE_REPL_EXTERNAL_MODULE: "module",
  KEEP: "yes",
  ELECTRON_RUN_AS_NODE: "1",
}, "Cursor environment remaps Electron-sensitive Node variables");
equal(Object.hasOwn(runtime.cursorEnvironment(), "NODE_OPTIONS"), false, "Cursor environment removes NODE_OPTIONS");
equal(Object.hasOwn(runtime.cursorEnvironment(), "NODE_REPL_EXTERNAL_MODULE"), false, "Cursor environment removes repl module variable");

equal(runtime.antigravity.id, "antigravity", "Antigravity descriptor is exported");
equal(runtime.cursor.id, "cursor", "Cursor descriptor is exported");
equal(runtime.devin.id, "devin", "Devin descriptor is exported");
equal(runtime.vscode.id, "vscode", "VS Code descriptor is exported");
equal(runtime.vscodeInsiders.id, "vscodeInsiders", "VS Code Insiders descriptor is exported");
equal(runtime.windsurf.id, "windsurf", "Windsurf descriptor is exported");
equal(editorDescriptors.length, 6, "all family descriptors use shared editor constructor");
equal(runtime.antigravity.options.icon, "apps/antigravity.png", "Antigravity icon is stable");
equal(runtime.cursor.options.icon, "apps/cursor.png", "Cursor icon is stable");
equal(runtime.devin.options.icon, "apps/devin.svg", "Devin SVG icon is stable");
equal(runtime.vscode.options.label, "VS Code", "VS Code label is stable");
equal(runtime.vscodeInsiders.options.label, "VS Code Insiders", "Insiders label is stable");
equal(runtime.windsurf.options.label, "Windsurf", "Windsurf label is stable");

equal(runtime.antigravity.options.darwinDetect(), "/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity", "Antigravity macOS CLI is detected");
equal(runtime.devin.options.darwinDetect(), "/Applications/Devin.app/Contents/Resources/app/bin/devin-desktop", "Devin macOS CLI is detected");
equal(runtime.vscode.options.darwinDetect(), "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code", "VS Code macOS CLI is detected");
equal(runtime.windsurf.options.darwinDetect(), "/Applications/Windsurf.app/Contents/Resources/app/bin/windsurf", "Windsurf macOS CLI is detected");

equal(runtime.antigravity.options.linuxDetect(), "antigravity-ide.desktop", "Antigravity Linux desktop fallback is used");
equal(runtime.cursor.options.linuxDetect(), "cursor.desktop", "Cursor Linux desktop fallback is used");
equal(runtime.vscode.options.linuxDetect(), "code.desktop", "VS Code Linux desktop fallback is used");
equal(runtime.vscodeInsiders.options.linuxDetect(), "code-insiders.desktop", "Insiders Linux desktop fallback is used");
equal(runtime.windsurf.options.linuxDetect(), "windsurf.desktop", "Windsurf Linux desktop fallback is used");
equal(commandLookups.find(({ commands }) => commands.includes("code")).commands, ["code", "code-oss"], "VS Code Linux command priority is stable");

executables.set("antigravity.cmd", "C:\\bin\\antigravity.cmd");
resolvedLinks.set("C:\\bin\\antigravity.cmd", "C:\\Apps\\Antigravity.cmd");
equal(runtime.detectAntigravityWindows(), "C:\\Apps\\Antigravity.cmd", "Antigravity Windows PATH command resolves link");
executables.delete("antigravity.cmd");
equal(runtime.detectAntigravityWindows(), "C:\\Fallback\\App.exe", "Antigravity Windows falls back to install roots");
equal(windowsFallbacks.at(-1).length, 6, "Antigravity fallback checks all layouts");

equal(runtime.detectVscodeWindows(), "C:\\Resolved\\Code.exe", "VS Code Windows delegates Electron app resolution");
equal(windowsElectronQueries.at(-1), {
  pathCommand: null,
  executableName: "Code.exe",
  installDirName: "Microsoft VS Code",
}, "VS Code Windows resolution receives stable install metadata");
executables.set("code-insiders", "C:\\bin\\code-insiders.cmd");
equal(runtime.detectVscodeInsidersWindows(), "C:\\Resolved\\Code - Insiders.exe", "Insiders Windows delegates Electron app resolution");
equal(windowsElectronQueries.at(-1).pathCommand, "C:\\bin\\code-insiders.cmd", "Insiders passes PATH command");

const windowsFiles = new Set(["C:\\Users\\me\\Cursor\\Cursor.exe"]);
const directWindowsRuntime = createVscodeFamilyTargetRuntime(dependencies({
  platform: "win32",
  path: path.win32,
  fs: { existsSync: (value) => windowsFiles.has(value) },
  findExecutable: (command) => command === "cursor" ? "C:\\Users\\me\\Cursor\\Cursor.exe" : null,
  resolveExecutableLink: (value) => value,
}));
equal(directWindowsRuntime.detectCursorWindows(), "C:\\Users\\me\\Cursor\\Cursor.exe", "direct Cursor.exe is accepted");
equal(directWindowsRuntime.findCursorMacRuntime(), null, "Cursor macOS lookup is disabled on Windows");

const nestedCli = "C:\\Users\\me\\Cursor\\resources\\app\\bin\\cursor.cmd";
windowsFiles.add("C:\\Users\\me\\Cursor\\Cursor.exe");
const nestedWindowsRuntime = createVscodeFamilyTargetRuntime(dependencies({
  platform: "win32",
  path: path.win32,
  fs: { existsSync: (value) => windowsFiles.has(value) },
  findExecutable: (command) => command === "cursor" ? nestedCli : null,
  resolveExecutableLink: (value) => value,
}));
equal(nestedWindowsRuntime.detectCursorWindows(), "C:\\Users\\me\\Cursor\\Cursor.exe", "nested Cursor CLI resolves sibling app executable");

const missingCursorRuntime = createVscodeFamilyTargetRuntime(dependencies({
  platform: "darwin",
  fs: { existsSync: () => false },
  findMacApplicationBundle: () => null,
}));
equal(missingCursorRuntime.findCursorMacRuntime(), null, "missing Cursor runtime returns null");
assert.throws(() => missingCursorRuntime.cursorArgs("/repo"), /Cursor CLI entrypoint not available/);
assertions += 1;

ok(assertions >= 40, "VS Code family owner has broad descriptor, macOS, Windows, Linux, env, and remote-args coverage");
console.log(`${assertions} main VS Code family target owner assertions passed`);
