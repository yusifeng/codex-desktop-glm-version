import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [join(root, "src/main/main-app/platform/linux-applications.ts")],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const {
  createLinuxApplicationsRuntime,
  parseGioMimeOutput,
  resolveLinuxDesktopEntryIcon,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);

let assertions = 0;
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions += 1;
};

equal(parseGioMimeOutput(`Default application for “text/plain”: editor.desktop
Recommended applications:
	editor.desktop
	viewer.desktop
Registered applications:
	viewer.desktop
	other.desktop
`), {
  defaultDesktopId: "editor.desktop",
  desktopIds: ["editor.desktop", "viewer.desktop", "other.desktop"],
});
equal(parseGioMimeOutput("Default application for text/plain: ../../bad.desktop\n"), {
  defaultDesktopId: null,
  desktopIds: [],
});

const directory = await mkdtemp(join(tmpdir(), "codex-linux-applications-"));
const previousEnvironment = Object.fromEntries([
  "PATH",
  "XDG_CONFIG_HOME",
  "XDG_CURRENT_DESKTOP",
  "XDG_DATA_DIRS",
  "XDG_DATA_HOME",
  "XDG_ICON_THEME",
].map((key) => [key, process.env[key]]));
try {
  const dataHome = join(directory, "data-home");
  const dataSystem = join(directory, "data-system");
  const appsHome = join(dataHome, "applications");
  const appsSystem = join(dataSystem, "applications");
  const bin = join(directory, "bin");
  await mkdir(appsHome, { recursive: true });
  await mkdir(appsSystem, { recursive: true });
  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, "editor"), "#!/bin/sh\n");
  await writeFile(join(bin, "gio"), "#!/bin/sh\n");
  await fs.promises.chmod(join(bin, "editor"), 0o755);
  await fs.promises.chmod(join(bin, "gio"), 0o755);

  const editorDesktop = join(appsHome, "editor.desktop");
  const viewerDesktop = join(appsSystem, "viewer.desktop");
  await writeFile(editorDesktop, `[Desktop Entry]
Type=Application
Name=Editor
Exec=editor %f
TryExec=editor
Icon=editor-icon
OnlyShowIn=GNOME;
`);
  await writeFile(viewerDesktop, `[Desktop Entry]
Type=Application
Name=Viewer
Exec=viewer %f
Icon=viewer-icon
`);
  await writeFile(join(appsHome, "hidden.desktop"), `[Desktop Entry]
Type=Application
Name=Hidden
Exec=hidden
Hidden=true
`);
  await writeFile(join(appsHome, "wrong-desktop.desktop"), `[Desktop Entry]
Type=Application
Name=Wrong
Exec=wrong
OnlyShowIn=KDE;
`);

  const themeRoot = join(dataHome, "icons", "custom");
  await mkdir(join(themeRoot, "48x48", "apps"), { recursive: true });
  await writeFile(join(themeRoot, "index.theme"), `[Icon Theme]
Name=Custom
Directories=48x48/apps
`);
  const iconPath = join(themeRoot, "48x48", "apps", "editor-icon.png");
  await writeFile(iconPath, "png");

  process.env.PATH = bin;
  process.env.XDG_CONFIG_HOME = join(directory, "config");
  process.env.XDG_CURRENT_DESKTOP = "GNOME";
  process.env.XDG_DATA_HOME = dataHome;
  process.env.XDG_DATA_DIRS = dataSystem;
  process.env.XDG_ICON_THEME = "custom";

  const calls = [];
  const fakeExecFile = (file, args, _options, callback) => {
    calls.push([file, args]);
    if (args[0] === "info") {
      callback(null, { stdout: "standard::content-type: text/plain\n", stderr: "" });
      return;
    }
    const mime = args[1];
    callback(null, {
      stdout: mime === "x-scheme-handler/http"
        ? `Default application for ${mime}: viewer.desktop\nRegistered applications:\n\teditor.desktop\n`
        : `Default application for ${mime}: editor.desktop\nRecommended applications:\n\tviewer.desktop\n`,
      stderr: "",
    });
  };
  const findExecutable = (command) => fs.existsSync(join(bin, command)) ? join(bin, command) : null;
  const runtime = createLinuxApplicationsRuntime({
    execFile: fakeExecFile,
    findExecutable,
    mimeLookup: () => "fallback/type",
  });

  equal(runtime.findDesktopApplicationPathByIds(["missing.desktop", "editor.desktop"]), editorDesktop);
  equal(runtime.findDesktopApplicationPathByIds(["hidden.desktop"]), null);
  equal(runtime.findDesktopApplicationPathByIds(["wrong-desktop.desktop"]), null);
  equal(await runtime.findApplicationsForPath(join(directory, "notes.txt")), [
    { appPath: editorDesktop, bundleId: "editor.desktop", displayName: "Editor", isDefault: true },
    { appPath: viewerDesktop, bundleId: "viewer.desktop", displayName: "Viewer" },
  ]);
  equal(calls[0][1], ["info", "--attributes=standard::content-type", "--", join(directory, "notes.txt")]);

  equal(await runtime.findDefaultBrowserApplications(), {
    applications: [
      { appPath: editorDesktop, bundleId: "editor.desktop", displayName: "Editor" },
      { appPath: viewerDesktop, bundleId: "viewer.desktop", displayName: "Viewer" },
    ],
    defaultApplicationPath: editorDesktop,
  });
  equal(runtime.resolveLinuxDesktopEntryIcon(editorDesktop), fs.realpathSync(iconPath));
  equal(resolveLinuxDesktopEntryIcon(editorDesktop), fs.realpathSync(iconPath));
  equal(runtime.resolveLinuxDesktopEntryIcon(viewerDesktop), null);

  const missingRuntime = createLinuxApplicationsRuntime({
    findExecutable: () => null,
    mimeLookup: () => false,
  });
  equal(missingRuntime.findDesktopApplicationPathByIds(["editor.desktop"]), null);
  equal(await missingRuntime.findApplicationsForPath("/tmp/example"), []);
  equal(await missingRuntime.findDefaultBrowserApplications(), {
    applications: [],
    defaultApplicationPath: null,
  });
} finally {
  for (const [key, value] of Object.entries(previousEnvironment)) {
    if (value == null) delete process.env[key];
    else process.env[key] = value;
  }
  await rm(directory, { recursive: true, force: true });
}

const main = fs.readFileSync(join(root, ".reference/originals/main/main-C-Mhak1n.ts"), "utf8");
const appPaths = fs.readFileSync(join(root, "src/main/main-app/util/app-paths.ts"), "utf8");
equal(main.includes('require("./main-app/platform/linux-applications.js")'), true);
equal(main.includes("findApplicationsForPath: NAe"), true);
equal(main.includes("findDefaultBrowserApplications: uO"), true);
equal(main.includes("resolveLinuxDesktopEntryIcon: PAe"), true);
equal(main.includes("async function NAe("), false);
equal(main.includes("function PAe("), false);
equal(main.includes("function pO("), false);
equal(main.includes("function RAe("), false);
equal(appPaths.includes('import { resolveLinuxDesktopEntryIcon } from "../platform/linux-applications"'), true);
equal(appPaths.includes("function linuxDesktopEntryIcon"), false);

console.log(`${assertions} main Linux applications owner assertions passed`);
