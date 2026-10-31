import assert from "node:assert/strict";
import path from "node:path";
import * as url from "node:url";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/open-target/open-target-foundation.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createOpenTargetFoundation } = await import(
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

function valueSchema(validate) {
  return {
    safeParse(value) {
      const result = validate(value);
      return result.ok ? { success: true, data: result.data } : { success: false, error: "invalid" };
    },
    regex(pattern) {
      return valueSchema((value) => typeof value === "string" && pattern.test(value)
        ? { ok: true, data: value }
        : { ok: false });
    },
    nullable() {
      return valueSchema((value) => value === null ? { ok: true, data: null } : validate(value));
    },
  };
}
const schema = {
  Of: () => valueSchema((value) => typeof value === "string" ? { ok: true, data: value } : { ok: false }),
  Cf: () => valueSchema((value) => typeof value === "number" ? { ok: true, data: value } : { ok: false }),
  wf(shape) {
    return valueSchema((value) => {
      if (value == null || typeof value !== "object") return { ok: false };
      const data = {};
      for (const [key, child] of Object.entries(shape)) {
        const parsed = child.safeParse(value[key]);
        if (!parsed.success) return { ok: false };
        data[key] = parsed.data;
      }
      return { ok: true, data };
    });
  },
  Tl: (value) => value.replaceAll("\\", "/"),
  wl: (value) => value.startsWith("/") ? value : `/${value}`,
};

const files = new Set([
  "/tmp/file.pdf",
  "/tmp/page.html",
  "/tmp/icon.png",
  "/Applications/Cursor.app",
  "/Applications/Visual Studio Code.app/Contents/MacOS/Electron",
  "/Users/test/Applications/Preview Test.app",
  "/bin/custom-editor",
]);
const directories = new Map([
  ["/Applications", ["Cursor.app", "Visual Studio Code.app"]],
  ["/Users/test/Applications", ["Preview Test.app"]],
]);
const fs = {
  existsSync: (value) => files.has(value),
  statSync: (value) => ({ isFile: () => files.has(value) }),
  readdirSync(value) {
    if (!directories.has(value)) throw new Error("missing directory");
    return directories.get(value);
  },
};
const logs = [];
const spawns = [];
const filterCalls = [];
const executableByName = new Map([["code", "/usr/bin/code"], ["gio", "/usr/bin/gio"]]);
const customConfig = {
  good: {
    command: "/bin/custom-editor",
    icon: "/tmp/icon.png",
    label: "Custom",
    supports_ssh: true,
    args: ["--reuse"],
    input: "path",
  },
};

function makeDependencies(overrides = {}) {
  return {
    schema,
    path,
    fs,
    os: { homedir: () => "/Users/test" },
    url,
    platform: "darwin",
    sshMetadataKey: "ssh",
    customFileHandlersSetting: {
      schema: {
        safeParse(value) {
          return value === "invalid"
            ? { success: false, error: "bad-config" }
            : { success: true, data: value ?? {} };
        },
      },
    },
    createLogger: () => () => ({ warning: (...args) => logs.push(args) }),
    async spawn(...args) { spawns.push(args); },
    findExecutable: (command) => executableByName.get(command) ?? null,
    findLinuxDesktopEntry: (entries) => entries.includes("code.desktop") ? "/apps/code.desktop" : null,
    isHostConfig: (value) => value?.kind === "ssh" || value?.kind === "remote-control",
    isLocalHost: (value) => value?.kind === "local",
    isRemoteHost: (value) => value?.kind === "ssh",
    remoteHost: {
      fallbackTargetIdentifier: (host) => `host-${host.id}`,
      readSshAlias: (metadata) => metadata?.sshAlias?.trim() || null,
      readTerminalCommandLastArg: (command) => command.at(-1) ?? null,
      readTerminalCommandPort: (command) => command.includes("-p") ? Number(command[command.indexOf("-p") + 1]) : null,
      terminalCommandHasIdentity: (command) => command.includes("-i"),
      formatHostWithPort: (host, port) => port == null ? host : `${host}:${port}`,
      bracketIpv6Host: (host) => host.includes(":") ? `[${host}]` : host,
    },
    targetFilter: {
      filterTargetIdsForHost(...args) { filterCalls.push(["ids", ...args]); return args[1]; },
      filterTargetsForHost(...args) { filterCalls.push(["targets", ...args]); return args[1]; },
      isTargetSupported(...args) { filterCalls.push(["supported", ...args]); return args[0].id !== "blocked"; },
    },
    targetInput: {
      normalizeAppsPath: (icon) => `/normalized/${icon}`,
      isPackagedAppPath: (icon) => icon.startsWith("apps/"),
      isDataImage: (icon) => icon.startsWith("data:image/"),
      isAbsoluteTargetPath: (value, platform) => platform === "win32" ? /^[A-Z]:\\/u.test(value) : value.startsWith("/"),
    },
    targetSelection: {
      resolveRequestedTarget: (options) => options.shouldUseFileManager ? "fileManager" : options.requestedTarget ?? options.preferredTarget ?? null,
      resolveTargetFallback: (options) => options.target ?? (!options.hasExplicitTarget && options.platform === "win32" ? "fileManager" : null),
    },
    targetLaunchArgs: {
      buildEditorGotoArgs: (targetPath, location, platform) => location
        ? ["--goto", `${targetPath}:${location.line}:${location.column}`]
        : [platform, targetPath],
      buildVscodeRemoteUri: (authority, targetPath) => `remote://${authority}${targetPath}`,
      buildVscodeRemoteArgs: ({ remoteAuthority, remoteWorkspaceRoot, path: targetPath, location }) => [
        "remote-goto", remoteAuthority, remoteWorkspaceRoot, targetPath, location.line, location.column,
      ],
    },
    targetDescriptors: {
      mergeTargetPlatformDescriptor: (options) => ({ ...options.platform, label: options.platform.label ?? options.label }),
      createTargetDescriptor: (options) => ({ id: options.id, platforms: { darwin: options.darwin, win32: options.win32, linux: options.linux } }),
      createEditorTargetDescriptor: (options) => ({ id: options.id, defaultArgs: options.defaultArgs, linuxOpen: options.linuxOpen }),
    },
    ...overrides,
  };
}

const runtime = createOpenTargetFoundation(makeDependencies());
equal(runtime.preferredBundleIdsForPath("/tmp/SLIDES.PPTX"), ["com.microsoft.Powerpoint", "com.apple.iWork.Keynote"], "native bundle priority is extension-aware");
equal(runtime.preferredBundleIdsForPath("/tmp/file.unknown"), [], "unknown extension has no preferred bundle");
equal(runtime.isDarwinNativeDocument("/tmp/file.pdf"), true, "known file is a macOS native document");
equal(runtime.isPlatformDefaultViewerDocument("/tmp/file.pdf"), false, "macOS document is not default-viewer classified");
equal(runtime.isNativeDocument("/tmp/page.html"), true, "HTML is a native document");
equal(runtime.isNativeDocument("/tmp/missing.pdf"), false, "missing file is rejected");

equal(runtime.resolveRequestedTarget({ requestedTarget: "code", shouldUseFileManager: false }), "code", "requested target delegates to selection policy");
equal(runtime.resolveRequestedTarget({ requestedTarget: null, preferredTarget: "code", shouldUseFileManager: true }), "fileManager", "file-manager policy wins");
equal(runtime.resolveTargetFallback({ target: null, hasExplicitTarget: false, platform: "win32" }), "fileManager", "fallback delegates to platform policy");

const sshWithAlias = { kind: "ssh", id: "one", name: " One ", ssh: { sshAlias: "prod", sshHost: "host", sshPort: 22, identity: null } };
equal(runtime.remoteAuthorityName(sshWithAlias), "prod", "SSH alias becomes remote authority");
equal(runtime.remoteHostLabel(sshWithAlias), "prod", "SSH alias becomes display label");
const sshWithHost = { kind: "ssh", id: "two", ssh: { sshAlias: null, sshHost: "example.com", sshPort: 2222, identity: null } };
equal(runtime.remoteHostLabel(sshWithHost), "example.com:2222", "SSH host and port form display label");
const sshWithIdentity = { kind: "ssh", id: "three", ssh: { sshAlias: null, sshHost: "example.com", sshPort: null, identity: "key" } };
equal(runtime.remoteHostLabel(sshWithIdentity), null, "identity-specific SSH config cannot be represented as a label");
equal(runtime.remoteAuthorityName({ kind: "ssh", id: "four", terminal_command: ["ssh", "fallback.example"] }), "fallback.example", "terminal command host becomes remote authority");
equal(runtime.bracketIpv6Host("2001:db8::1"), "[2001:db8::1]", "IPv6 helper remains wired");

equal(runtime.filterTargetIds({ kind: "local" }, ["code"], [{ id: "code" }]), ["code"], "target-id filter delegates with host dependencies");
equal(runtime.filterTargets([{ id: "code" }], { kind: "local" }), [{ id: "code" }], "target metadata filter delegates");
equal(runtime.isTargetSupported({}, { id: "blocked" }), false, "target support delegates in original argument order");
equal(filterCalls.length, 3, "all target filtering routes use one dependency owner");

equal(runtime.normalizeTargetIcon("apps/code.png"), "/normalized/apps/code.png", "packaged icon path is normalized");
equal(runtime.resolveTargetIcon("apps/code.png", "darwin"), "/normalized/apps/code.png", "packaged icon remains an app asset");
equal(runtime.resolveTargetIcon("data:image/png;base64,AA", "darwin"), "data:image/png;base64,AA", "data image remains inline");
ok(runtime.resolveTargetIcon("/tmp/icon.png", "darwin").startsWith("app://fs/@fs/"), "local icon is encoded as app filesystem URL");
equal(runtime.resolveTargetIcon("/tmp/missing.png", "darwin"), "/normalized/apps/vscode.png", "missing icon falls back to VS Code asset");

const customTargets = runtime.parseCustomTargets(customConfig, "darwin");
equal(customTargets.length, 1, "valid custom target is parsed");
equal(customTargets[0].id, "custom:good", "custom target receives stable namespace");
equal(customTargets[0].configuredCommand, "/bin/custom-editor", "configured command is retained for worker lookup");
equal(customTargets[0].supportsSsh, true, "custom SSH support is retained");
equal(customTargets[0].detect(), "/bin/custom-editor", "existing absolute command is detected");
await customTargets[0].open({ command: "/bin/custom-editor", path: "/tmp/file.ts" });
equal(spawns.at(-1), ["/bin/custom-editor", ["--reuse", "/tmp/file.ts"]], "path-input custom target appends path");

const argumentTarget = runtime.createCustomTarget("argument", { ...customConfig.good, input: "json_argument" }, "darwin");
await argumentTarget.open({ command: "editor", path: "/tmp/a", appPath: "/app", location: { line: 2 } });
equal(JSON.parse(spawns.at(-1)[1].at(-1)), { target: "custom:argument", path: "/tmp/a", appPath: "/app", location: { line: 2 } }, "JSON-argument target serializes public fields");
const stdinTarget = runtime.createCustomTarget("stdin", { ...customConfig.good, input: "json_stdin" }, "darwin");
await stdinTarget.open({ command: "editor", path: "/tmp/a", hostConfig: { kind: "ssh" }, remotePath: "/remote/a" });
equal(JSON.parse(spawns.at(-1)[2].stdin), {
  target: "custom:stdin", path: "/tmp/a", appPath: null, location: null,
  hostConfig: { kind: "ssh" }, remoteWorkspaceRoot: null, remotePath: "/remote/a",
}, "JSON-stdin target preserves remote context");

equal(runtime.parseCustomTargets("invalid", "darwin"), [], "invalid custom handler config is dropped");
equal(logs.at(-1)[0], "Dropping invalid custom file handlers config", "invalid config is logged");
equal(runtime.parseCustomTargets({ "bad id!": customConfig.good }, "darwin"), [], "invalid custom target id is dropped");
equal(logs.at(-1)[1].safe.id, "bad id!", "invalid target log identifies id safely");

equal(runtime.macApplicationCandidates("/Applications/Cursor.app"), ["/Applications/Cursor.app", "/Users/test/Applications/Cursor.app"], "system app path gains user fallback");
equal(runtime.macApplicationCandidates("/opt/App.app"), ["/opt/App.app"], "non-system app path remains singular");
equal(runtime.findExistingMacApplication(["/Applications/Cursor.app"]), "/Applications/Cursor.app", "existing macOS app is detected");
equal(runtime.findMacApplicationExecutable("visual studio code", "Electron"), "/Applications/Visual Studio Code.app/Contents/MacOS/Electron", "macOS executable is found case-insensitively");
equal(runtime.findMacApplicationBundle("preview"), "/Users/test/Applications/Preview Test.app", "user application bundle is discovered");
equal(runtime.findMacApplicationBundle("missing"), null, "missing application bundle returns null");

equal(runtime.buildEditorArgs("/tmp/file.ts", { line: 4, column: 2 }, null, null, null), ["--goto", "/tmp/file.ts:4:2"], "local editor args preserve location");
equal(runtime.buildEditorArgs("ignored", null, sshWithAlias, "/repo", "/repo/file.ts"), [
  "--folder-uri", "remote://ssh-remote+prod/repo",
  "--file-uri", "remote://ssh-remote+prod/repo/file.ts",
], "remote editor args include folder and file URIs");
equal(runtime.buildEditorArgs("ignored", { line: 2, column: 3 }, sshWithAlias, "/repo", "/repo/file.ts"), [
  "remote-goto", "ssh-remote+prod", "/repo", "/repo/file.ts", 2, 3,
], "remote location uses remote goto builder");
assert.throws(() => runtime.buildVscodeRemoteArgs({ hostConfig: { kind: "remote-control" } }), /does not support VS Code remote open/);
assertions += 1;

equal(runtime.findCommandOrDesktopEntry(["missing", "code"], ["code.desktop"]), "/usr/bin/code", "command discovery prefers executable");
equal(runtime.findCommandOrDesktopEntry(["missing"], ["code.desktop"]), "/apps/code.desktop", "desktop entry is fallback");
equal(runtime.createTargetDescriptor({ id: "code", darwin: { label: "Code" } }), { id: "code", platforms: { darwin: { label: "Code" }, win32: undefined, linux: undefined } }, "descriptor construction delegates");
const editorDescriptor = runtime.createEditorTargetDescriptor({ id: "code" });
equal(editorDescriptor.id, "code", "editor descriptor preserves identity");
equal(typeof editorDescriptor.defaultArgs, "function", "editor descriptor receives shared argument builder");
equal(typeof editorDescriptor.linuxOpen, "function", "editor descriptor receives shared Linux launcher");

await runtime.launchLinuxEditor({ command: "/apps/code.desktop", path: "/tmp/file.ts" });
equal(spawns.at(-1), ["/usr/bin/gio", ["launch", "/apps/code.desktop", "/tmp/file.ts"]], "desktop file launches through gio");
await runtime.launchLinuxEditor({ command: "/usr/bin/code", path: "/tmp/file.ts", location: null });
equal(spawns.at(-1), ["/usr/bin/code", ["darwin", "/tmp/file.ts"]], "executable editor launches with shared args");

const linuxRuntime = createOpenTargetFoundation(makeDependencies({ platform: "linux" }));
equal(linuxRuntime.isDarwinNativeDocument("/tmp/file.pdf"), false, "Linux document is not Darwin-native");
equal(linuxRuntime.isPlatformDefaultViewerDocument("/tmp/file.pdf"), true, "Linux native document uses platform viewer");
equal(linuxRuntime.findExistingMacApplication(["/Applications/Cursor.app"]), null, "macOS discovery is disabled on Linux");

ok(assertions >= 55, "open-target foundation has broad document, remote, custom, discovery, and launch coverage");
console.log(`${assertions} main open target foundation owner assertions passed`);
