import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const root = new URL("..", import.meta.url).pathname;
const bundle = await build({
  entryPoints: [path.join(root, "src/main/main-app/language-server/providers.ts")],
  bundle: true,
  format: "esm",
  logLevel: "silent",
  platform: "node",
  target: "node22",
  write: false,
});
const { createLanguageServerProvidersRuntime } = await import(
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

const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), "language-server-providers-"));
const workspaceRoot = path.join(tempRoot, "workspace");
const codexHome = path.join(tempRoot, "codex-home");
const dataRoot = path.join(tempRoot, "data");
const nodeExecutable = path.join(tempRoot, "resources", "node");
await Promise.all([
  fs.promises.mkdir(workspaceRoot, { recursive: true }),
  fs.promises.mkdir(codexHome, { recursive: true }),
  fs.promises.mkdir(dataRoot, { recursive: true }),
  fs.promises.mkdir(path.dirname(nodeExecutable), { recursive: true }),
]);
await fs.promises.writeFile(nodeExecutable, "node");

const runtimeRoots = Object.fromEntries(
  ["java", "kotlin", "python", "rust", "typescript"].map((id) => [
    id,
    path.join(tempRoot, "runtimes", id),
  ]),
);
const javaModules = path.join(runtimeRoots.java, "node_modules");
const javaServer = path.join(javaModules, "@vscjava", "java-language-server", "server");
const javaLauncher = "org.eclipse.equinox.launcher_1.2.3.jar";
const javaConfig = path.join(javaModules, "@vscjava", "java-ls-config-darwin", "config_mac");
const kotlinExecutable = path.join(runtimeRoots.kotlin, "server", "bin", "intellij-server");
const pyrightServer = path.join(
  runtimeRoots.python,
  "node_modules",
  "pyright",
  "langserver.index.js",
);
const rustExecutable = path.join(runtimeRoots.rust, "rust-analyzer");
const tsLanguageServer = path.join(
  runtimeRoots.typescript,
  "node_modules",
  "typescript-language-server",
  "lib",
  "cli.mjs",
);
const tsServer = path.join(
  runtimeRoots.typescript,
  "node_modules",
  "typescript",
  "lib",
  "tsserver.js",
);
await Promise.all([
  fs.promises.mkdir(path.join(javaServer, "plugins"), { recursive: true }),
  fs.promises.mkdir(javaConfig, { recursive: true }),
  fs.promises.mkdir(path.dirname(kotlinExecutable), { recursive: true }),
  fs.promises.mkdir(path.dirname(pyrightServer), { recursive: true }),
  fs.promises.mkdir(path.dirname(rustExecutable), { recursive: true }),
  fs.promises.mkdir(path.dirname(tsLanguageServer), { recursive: true }),
  fs.promises.mkdir(path.dirname(tsServer), { recursive: true }),
]);
await Promise.all([
  fs.promises.writeFile(path.join(javaServer, "plugins", javaLauncher), "jar"),
  fs.promises.writeFile(path.join(javaConfig, "config.ini"), "configuration"),
  fs.promises.writeFile(kotlinExecutable, "binary"),
  fs.promises.writeFile(pyrightServer, "server"),
  fs.promises.writeFile(rustExecutable, "binary"),
  fs.promises.writeFile(tsLanguageServer, "server"),
  fs.promises.writeFile(tsServer, "server"),
]);

const sysroot = path.join(tempRoot, "toolchain");
await fs.promises.mkdir(path.join(sysroot, "lib", "rustlib", "src", "rust", "library"), {
  recursive: true,
});
const commandPaths = new Map([
  ["java", "/usr/bin/java"],
  ["python3", "/usr/bin/python3"],
  ["python", "/usr/bin/python"],
  ["cargo", "/usr/bin/cargo"],
  ["rustc", "/usr/bin/rustc"],
  ["node", "/usr/bin/node"],
  ["sourcekit-lsp", "/usr/bin/sourcekit-lsp"],
  ["typescript-language-server", "/usr/bin/typescript-language-server"],
  ["tsserver", "/usr/bin/tsserver"],
]);
const spawnCalls = [];
const host = {
  isLocal: true,
  async codexHome() { return codexHome; },
  async createDirectory(value, options) { return fs.promises.mkdir(value, options); },
  async platformFamily() { return process.platform === "win32" ? "windows" : "unix"; },
  async platformOs() { return process.platform === "darwin" ? "macos" : "linux"; },
  async platformPath() { return path; },
  async readFile(value) {
    const bytes = await fs.promises.readFile(value);
    return new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } });
  },
  async spawn(options) {
    spawnCalls.push(options);
    let result = { code: 0, signal: null, stderr: "", stdout: "" };
    if (options.args.at(-1) === "-version")
      result = { ...result, stderr: 'openjdk version "21.0.4"' };
    if (options.args.includes("sysroot")) result = { ...result, stdout: `${sysroot}\n` };
    return { result };
  },
  async stat(value, options) {
    return fs.promises.stat(value, options);
  },
  async writeFile(value, contents) { return fs.promises.writeFile(value, contents); },
};

async function readWebStream(stream) {
  const reader = stream.getReader();
  const chunks = [];
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((value) => Buffer.from(value)));
}

const runtime = createLanguageServerProvidersRuntime({
  path,
  fsPromises: fs.promises,
  crypto,
  resolveExecutable: (name) => commandPaths.get(name) ?? null,
  readProcessResult: async (processHandle) => processHandle.result,
  readHostFile: readWebStream,
  resolveElectronResourcesPath: () => "/resources",
  resolveNodeExecutable: () => nodeExecutable,
  filePathToUri: (value) => `file://${value}`,
});
const context = {
  getLocalRuntimeRoot: (id) => runtimeRoots[id] ?? null,
  host,
  sessionId: "session-1",
  workspaceRoot,
};

equal(await runtime.canUseLocalRuntime(context), true, "matching local hosts may use bundled runtimes");
const unixResolver = await runtime.createCommandResolver(context);
equal(await unixResolver.findTrustedCommand("java"), "/usr/bin/java", "local Unix lookup uses PATH");
equal(unixResolver.trustedPath(path.join(workspaceRoot, "bin", "java")), null, "workspace commands are rejected");
equal(unixResolver.trustedPath("/opt/node_modules/tool/bin/server"), null, "node_modules commands are rejected");
equal(unixResolver.getDirectLaunchCommand("/usr/bin/java", ["-version"]), ["/usr/bin/java", "-version"], "local Unix launch is direct");

const nodeWrapper = path.join(tempRoot, "bin", "custom-server");
await fs.promises.mkdir(path.dirname(nodeWrapper), { recursive: true });
await fs.promises.writeFile(nodeWrapper, "#!/usr/bin/env node\nconsole.log('server');\n");
equal(
  await unixResolver.getNodeModuleLaunchCommand(nodeWrapper, "ignored", [], ["--stdio"]),
  ["/usr/bin/node", nodeWrapper, "--stdio"],
  "trusted node shebangs launch through the resolved node executable",
);
await fs.promises.writeFile(nodeWrapper, "#!/bin/sh\nexit 0\n");
equal(
  await unixResolver.getNodeModuleLaunchCommand(nodeWrapper, "ignored", [], ["--stdio"]),
  null,
  "non-node wrappers are rejected",
);

const remoteLookupHost = {
  ...host,
  isLocal: false,
  async spawn(options) {
    return {
      result: {
        code: 0,
        stderr: "",
        stdout: options.args[0] === "where.exe"
          ? "C:\\Tools\\server.cmd\r\n"
          : "noise\n__CODEX_LANGUAGE_SERVER__=/opt/tools/server\n",
      },
    };
  },
};
const remoteContext = { ...context, host: remoteLookupHost };
const remoteResolver = await runtime.createCommandResolver(remoteContext);
equal(await remoteResolver.findTrustedCommand("server"), "/opt/tools/server", "remote Unix lookup parses the marker");
equal(
  remoteResolver.getDirectLaunchCommand("/opt/tools/server", ["--stdio"]),
  ["/bin/sh", "-lc", 'exec "$@"', "sh", "/opt/tools/server", "--stdio"],
  "remote Unix launch preserves the shell boundary",
);
equal(await runtime.canUseLocalRuntime(remoteContext), false, "remote hosts cannot use local runtimes");

const windowsHost = {
  ...remoteLookupHost,
  async platformFamily() { return "windows"; },
  async platformPath() { return path.win32; },
};
const windowsContext = { ...context, host: windowsHost, workspaceRoot: "C:\\repo" };
const windowsResolver = await runtime.createCommandResolver(windowsContext);
equal(await windowsResolver.findTrustedCommand("server"), "C:\\Tools\\server.cmd", "Windows lookup accepts executable suffixes");
equal(windowsResolver.getDirectLaunchCommand("C:\\Tools\\server.cmd", []), null, "Windows batch files cannot launch directly");

const java = new runtime.JavaLanguageServerProvider(path.join(dataRoot, "java"));
const javaCommand = await java.findCommand(context);
equal(javaCommand[0], "/usr/bin/java", "Java provider launches the downloaded server with Java 21");
equal(javaCommand.includes("-jar"), true, "Java downloaded command uses the Eclipse launcher jar");
equal(javaCommand.at(-2), "-data", "Java command preserves the workspace flag ordering");
ok(javaCommand.at(-1).startsWith(path.join(dataRoot, "java")), "Java workspace stays under its data owner");
const javaOptions = await java.findSessionOptions(context);
equal(javaOptions.env.JAVA_HOME, "", "Java session cannot inherit JAVA_HOME");
equal(javaOptions.env.JDK_HOME, "", "Java session cannot inherit JDK_HOME");
equal(javaOptions.env.PATH, "/usr/bin:/bin", "Java session exposes only trusted command directories");
equal(await java.findWorkingDirectory(context), path.dirname(javaCommand.at(-1)), "Java working directory owns its workspace");
equal(spawnCalls.some(({ args }) => args[0] === "/usr/bin/java" && args[1] === "-version"), true, "Java 21 is actively verified");

const kotlin = new runtime.KotlinLanguageServerProvider(path.join(dataRoot, "kotlin"));
const kotlinCommand = await kotlin.findCommand(context);
equal(kotlinCommand[0], kotlinExecutable, "Kotlin provider prefers its downloaded binary");
equal(kotlinCommand.slice(1, 3), ["--stdio", "--system-path"], "Kotlin command preserves stdio arguments");
const kotlinOptions = await kotlin.findSessionOptions(context);
const kotlinWorkspace = kotlinOptions.languageServerWorkspaceRoot;
const kotlinConfig = JSON.parse(
  await fs.promises.readFile(path.join(kotlinWorkspace, "workspace.json"), "utf8"),
);
equal(kotlinConfig.modules[0].contentRoots[0].path, workspaceRoot, "Kotlin module points at the workspace");
equal(kotlinConfig.kotlinSettings[0].pureKotlinSourceFolders, [workspaceRoot], "Kotlin sources remain workspace-scoped");
equal(kotlinOptions.initializationOptions.buildTools[`file://${kotlinWorkspace}`], "json", "Kotlin initialization points at the JSON workspace");
equal(await kotlin.classifyProcessExit(context, kotlinCommand, { code: 7 }), {
  localRuntimeId: "kotlin",
  status: "expired-build",
}, "Kotlin exit code 7 expires the downloaded runtime");
equal(await kotlin.classifyProcessExit(context, kotlinCommand, { code: 7 }), {
  localRuntimeId: null,
  status: "expired-build",
}, "Kotlin runtime expiry ownership is consumed once");
equal(await kotlin.classifyProcessExit(context, kotlinCommand, { code: 1 }), null, "other Kotlin exits remain ordinary failures");

const pyright = new runtime.PyrightLanguageServerProvider();
equal(await pyright.findCommand(context), [nodeExecutable, pyrightServer, "--stdio"], "Pyright uses the pinned Node runtime");
const pyrightOptions = await pyright.findSessionOptions(context);
equal(pyrightOptions.env.PYTHONHOME, "", "Pyright cannot inherit PYTHONHOME");
equal(pyrightOptions.env.PYTHONPATH, "", "Pyright cannot inherit PYTHONPATH");
equal(pyrightOptions.workspaceConfiguration.python.pythonPath, "/usr/bin/python3", "Pyright receives the trusted Python path");
equal(await pyright.findWorkingDirectory(context), path.join(codexHome, "language-servers", "pyright"), "Pyright owns a stable working directory");

const rust = new runtime.RustAnalyzerProvider();
equal(await rust.findCommand(context), [rustExecutable], "rust-analyzer prefers the downloaded binary");
const rustOptions = await rust.findSessionOptions(context);
equal(rustOptions.env.CARGO_NET_OFFLINE, "true", "Rust analysis remains offline");
equal(rustOptions.env.RUSTUP_AUTO_INSTALL, "0", "Rust analysis cannot auto-install toolchains");
equal(rustOptions.initializationOptions.cargo.sysroot, sysroot, "validated Rust sysroot reaches initialization");
equal(rustOptions.workspaceConfiguration["rust-analyzer"], rustOptions.initializationOptions, "Rust workspace settings share the same policy owner");

const sourcekit = new runtime.SourceKitLanguageServerProvider();
equal(await sourcekit.findCommand(context), ["/usr/bin/sourcekit-lsp"], "SourceKit uses the trusted executable");
const sourcekitOptions = await sourcekit.findSessionOptions(context);
equal(sourcekitOptions.initializationOptions.backgroundIndexing, false, "SourceKit disables background indexing");
ok(sourcekitOptions.languageServerWorkspaceRoot.startsWith(codexHome), "SourceKit workspace stays under Codex home");

const typescript = new runtime.TypeScriptLanguageServerProvider();
equal(
  await typescript.findCommand(context),
  [nodeExecutable, tsLanguageServer, "--stdio"],
  "TypeScript provider uses the complete pinned runtime",
);
equal(await typescript.findInitializationOptions(context), {
  tsserver: { path: tsServer, useSyntaxServer: "never" },
}, "TypeScript initialization selects the pinned tsserver");

await fs.promises.rm(tsServer);
equal(await typescript.findCommand(context), null, "an incomplete TypeScript runtime does not partially launch");

console.log(`${assertions} main language-server provider owner assertions passed`);
