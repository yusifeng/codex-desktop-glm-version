import assert from "node:assert/strict";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/open-target/native-shell-targets.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createNativeShellTargetRuntime } = await import(
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
  const files = new Set();
  const directories = new Set([pathApi.parse("/repo").root || "/"]);
  const executables = new Map();
  const links = new Map();
  const spawns = [];
  const opened = [];
  const revealed = [];
  const installs = [];
  const shortcutQueries = [];
  const translated = [];
  const descriptors = [];
  let openError = "";
  const state = {
    files,
    directories,
    executables,
    links,
    spawns,
    opened,
    revealed,
    installs,
    shortcutQueries,
    translated,
    descriptors,
    setOpenError(value) { openError = value; },
  };
  const dependencies = {
    path: pathApi,
    fs: {
      existsSync: (value) => files.has(value) || directories.has(value),
      statSync: (value) => ({ isFile: () => files.has(value) }),
    },
    os: { homedir: () => "C:\\Users\\me" },
    env: {},
    createTargetDescriptor(options) {
      descriptors.push(options);
      return { id: options.id, options };
    },
    buildRevealPathArgs: (value) => ["--reveal", value],
    directoryForTarget: (value) => pathApi.extname(value) ? pathApi.dirname(value) : value,
    findExecutable: (command) => executables.get(command) ?? null,
    resolveExecutableLink: (value) => links.get(value) ?? null,
    findSiblingFile: (value, sibling) => {
      const candidate = pathApi.join(pathApi.dirname(value), sibling);
      return files.has(candidate) ? candidate : null;
    },
    findWindowsInstall(paths) { installs.push(paths); return null; },
    findStartMenuShortcut(names) { shortcutQueries.push(names); return null; },
    isLocalHostConfig: (value) => value?.kind === "local",
    translateHostPath(value, distro) {
      translated.push({ value, distro });
      return `translated:${value}`;
    },
    async loadElectronShell() {
      return {
        async openPath(value) { opened.push(value); return openError; },
        showItemInFolder(value) { revealed.push(value); },
      };
    },
    async spawn(command, args) { spawns.push({ command, args }); },
    ...overrides,
  };
  return { dependencies, state };
}

const base = fixture();
base.state.directories.add("/repo");
base.state.directories.add("/repo/folder");
base.state.files.add("/repo/file.txt");
const runtime = createNativeShellTargetRuntime(base.dependencies);
equal([
  runtime.fileManager.id,
  runtime.gitBash.id,
  runtime.githubDesktop.id,
  runtime.systemDefault.id,
], ["fileManager", "gitBash", "githubDesktop", "systemDefault"], "all four native shell targets are exported");
equal(base.state.descriptors.length, 4, "all native shell targets use shared descriptor constructor");
equal(runtime.fileManager.options.kind, "fileManager", "file manager kind is stable");
equal(runtime.gitBash.options.kind, "terminal", "Git Bash kind is stable");
equal(runtime.githubDesktop.options.kind, "editor", "GitHub Desktop kind is stable");
equal(runtime.systemDefault.options.hidden, true, "system default remains hidden");
equal(runtime.fileManager.options.darwin.args("/repo/file.txt"), ["--reveal", "/repo/file.txt"], "Finder args use reveal policy");
equal(runtime.fileManager.options.linux.args("/repo"), ["/repo"], "Linux file manager args preserve path");

equal(runtime.nearestExistingPath("/repo/file.txt"), "/repo/file.txt", "nearest path returns existing file");
equal(runtime.nearestExistingPath("/repo/folder/missing/deeper"), "/repo/folder", "nearest path walks to existing directory");
await runtime.openNativePath("/repo/file.txt");
equal(base.state.revealed, ["/repo/file.txt"], "native path reveals an existing file");
equal(base.state.opened, [], "file reveal does not also open path");
await runtime.openNativePath("/repo/folder/missing");
equal(base.state.opened, ["/repo/folder"], "native path opens nearest existing directory");
base.state.setOpenError("permission denied");
await assert.rejects(() => runtime.openNativePath("/repo/folder"), /permission denied/);
assertions += 1;
base.state.setOpenError("");

await runtime.fileManager.options.win32.open({
  path: "C:\\fallback",
  hostConfig: { kind: "local", distro: "Ubuntu" },
  remoteWorkspaceRoot: "/workspace",
  remotePath: "/workspace/file.txt",
});
equal(base.state.translated.at(-1), {
  value: "/workspace/file.txt",
  distro: "Ubuntu",
}, "File Explorer translates local-host remote path before opening");
equal(base.state.opened.at(-1), "translated:/workspace/file.txt", "File Explorer opens translated host path");

const windows = fixture({ path: path.win32, env: { SystemRoot: "C:\\Windows" } });
windows.state.files.add("C:\\Windows\\explorer.exe");
const windowsRuntime = createNativeShellTargetRuntime(windows.dependencies);
equal(windowsRuntime.detectWindowsExplorer(), "C:\\Windows\\explorer.exe", "Explorer detection uses existing SystemRoot binary");
windows.state.files.delete("C:\\Windows\\explorer.exe");
equal(windowsRuntime.detectWindowsExplorer(), "explorer.exe", "Explorer detection falls back to command name");

windows.state.executables.set("git-bash.exe", "C:\\Git\\bin\\git-bash.exe");
windows.state.links.set("C:\\Git\\bin\\git-bash.exe", "C:\\Git\\bin\\git-bash.exe");
windows.state.files.add("C:\\Git\\bin\\git-bash.exe");
equal(windowsRuntime.detectGitBashWindows(), "C:\\Git\\bin\\git-bash.exe", "Git Bash resolves PATH command and sibling");
equal(windowsRuntime.gitBash.options.win32.args("C:\\repo\\file.txt"), ["--cd=C:\\repo"], "Git Bash args use target directory");
windows.state.executables.clear();
equal(windowsRuntime.detectGitBashWindows(), null, "Git Bash uses install fallback when PATH is absent");
equal(windows.state.installs.at(-1), [
  ["Git", "git-bash.exe"],
  ["Git", "bin", "bash.exe"],
], "Git Bash checks GUI and bin layouts");

const shortcut = fixture({
  path: path.win32,
  findStartMenuShortcut: () => "C:\\Menu\\Git Bash.lnk",
});
const shortcutRuntime = createNativeShellTargetRuntime(shortcut.dependencies);
equal(shortcutRuntime.resolveGitBashIcon("C:\\Git\\bash.exe"), "C:\\Menu\\Git Bash.lnk", "Git Bash icon prefers Start Menu shortcut");

windows.state.executables.set("github.exe", "C:\\GitHub\\github.exe");
windows.state.links.set("C:\\GitHub\\github.exe", "C:\\GitHub\\github.exe");
windows.state.files.add("C:\\GitHub\\GitHubDesktop.exe");
equal(windowsRuntime.detectGithubDesktopWindows(), "C:\\GitHub\\GitHubDesktop.exe", "GitHub Desktop resolves sibling GUI app");
equal(windowsRuntime.githubDesktop.options.win32.args("C:\\repo\\file.txt"), ["C:\\repo"], "GitHub Desktop receives target directory");

const localAppData = fixture({
  path: path.win32,
  env: { LOCALAPPDATA: "D:\\Local" },
});
localAppData.state.files.add("D:\\Local\\GitHubDesktop\\GitHubDesktop.exe");
const localAppDataRuntime = createNativeShellTargetRuntime(localAppData.dependencies);
equal(localAppDataRuntime.detectGithubDesktopWindows(), "D:\\Local\\GitHubDesktop\\GitHubDesktop.exe", "GitHub Desktop detects LOCALAPPDATA install");
localAppData.state.files.clear();
equal(localAppDataRuntime.detectGithubDesktopWindows(), null, "GitHub Desktop falls back to Windows install roots");
equal(localAppData.state.installs.at(-1), [
  ["GitHub Desktop", "GitHubDesktop.exe"],
  ["GitHubDesktop", "GitHubDesktop.exe"],
], "GitHub Desktop checks both install directory names");

await runtime.openDarwinDefault("/repo/file.txt", null);
equal(base.state.spawns.at(-1), {
  command: "/usr/bin/open",
  args: ["/repo/file.txt"],
}, "macOS system default opens without app override");
await runtime.openDarwinDefault("/repo/file.txt", "/Applications/Preview.app");
equal(base.state.spawns.at(-1), {
  command: "/usr/bin/open",
  args: ["-a", "/Applications/Preview.app", "/repo/file.txt"],
}, "macOS system default honors app override");

await runtime.openLinuxDefault("/repo/file.txt", null);
equal(base.state.revealed.at(-1), "/repo/file.txt", "Linux default without app uses Electron shell");
await assert.rejects(
  () => runtime.openLinuxDefault("/repo/file.txt", "relative.desktop"),
  /Invalid Linux desktop application path/,
);
assertions += 1;
await assert.rejects(
  () => runtime.openLinuxDefault("/repo/file.txt", "/apps/editor.exe"),
  /Invalid Linux desktop application path/,
);
assertions += 1;
await assert.rejects(
  () => runtime.openLinuxDefault("/repo/file.txt", "/apps/editor.desktop"),
  /launcher is unavailable/,
);
assertions += 1;
base.state.executables.set("gio", "/usr/bin/gio");
await runtime.openLinuxDefault("/repo/file.txt", "/apps/editor.desktop");
equal(base.state.spawns.at(-1), {
  command: "/usr/bin/gio",
  args: ["launch", "/apps/editor.desktop", "/repo/file.txt"],
}, "Linux system default launches validated desktop application with gio");
equal(runtime.systemDefault.options.darwin.detect(), "system-default", "macOS system default marker is stable");
equal(runtime.systemDefault.options.win32.iconPath(), null, "system default has no synthetic icon path");

ok(assertions >= 35, "native shell target owner has broad path, detector, fallback, and launch coverage");
console.log(`${assertions} main native shell target owner assertions passed`);
