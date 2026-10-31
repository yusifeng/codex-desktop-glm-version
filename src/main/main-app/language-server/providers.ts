import {
  LANGUAGE_SERVER_LOOKUP_MARKER,
  LANGUAGE_SERVER_LOOKUP_TIMEOUT_MS,
  LANGUAGE_SERVER_NODE_SCRIPT_MAX_BYTES,
  buildUnixDirectLaunchCommand,
  parseUnixTrustedLookup,
  parseWindowsTrustedLookup,
  resolveTrustedLanguageServerPath,
} from "./command-trust";
import { buildJavaSessionOptions } from "./java-session-options";
import { buildKotlinWorkspaceConfig } from "./kotlin-workspace-config";
import { buildPyrightSessionOptions } from "./pyright-session-options";
import { buildRustAnalyzerOptions } from "./rust-analyzer-options";
import { SOURCEKIT_INITIALIZATION_OPTIONS } from "./sourcekit-options";
import { buildTypeScriptServerInitializationOptions } from "./typescript-server-options";

type ProviderDependencies = {
  path: any;
  fsPromises: any;
  crypto: { createHash(algorithm: string): any };
  resolveExecutable(name: string): string | null;
  readProcessResult(process: unknown): Promise<{ code: number; stdout: string; stderr: string }>;
  readHostFile(value: unknown): Promise<Uint8Array>;
  resolveElectronResourcesPath(options: { env: NodeJS.ProcessEnv; resourcesPath?: string }): string | null;
  resolveNodeExecutable(resourcesPath: string): string | null;
  filePathToUri(path: string, pathApi: any): string;
};

type ProviderContext = {
  getLocalRuntimeRoot(providerId: string): Promise<string | null> | string | null;
  host: any;
  sessionId: string;
  workspaceRoot: string;
};

const JAVA_VERSION_TIMEOUT_MS = 10_000;
const JAVA_WRAPPER_MAX_BYTES = 262_144;
const RUST_SYSROOT_TIMEOUT_MS = 10_000;
const JAVA_WORKSPACE_CONFIGURATION = {
  autobuild: { enabled: false },
  configuration: { updateBuildConfiguration: "disabled" },
  hover: { javadoc: { enabled: true } },
  import: {
    gradle: { enabled: false, wrapper: { enabled: false } },
    maven: { enabled: false },
  },
};
const JAVA_CONFIG_DIRECTORIES: Record<string, string[]> = {
  darwin: ["@vscjava", "java-ls-config-darwin", "config_mac"],
  linux: ["@vscjava", "java-ls-config-linux", "config_linux"],
  win32: ["@vscjava", "java-ls-config-win32", "config_win"],
};

export function createLanguageServerProvidersRuntime(dependencies: ProviderDependencies) {
  const {
    path: pathModule,
    fsPromises,
    crypto,
    resolveExecutable,
    readProcessResult,
    readHostFile,
    resolveElectronResourcesPath,
    resolveNodeExecutable,
    filePathToUri,
  } = dependencies;
  const path = pathModule.default ?? pathModule;

  async function canUseLocalRuntime(context: ProviderContext) {
    return context.host.isLocal
      ? ((await context.host.platformFamily()) === "windows") === (process.platform === "win32")
      : false;
  }

  async function getLocalRuntimeRoot(context: ProviderContext, providerId: string) {
    return (await canUseLocalRuntime(context)) ? context.getLocalRuntimeRoot(providerId) : null;
  }

  async function getNodeModulesPath(context: ProviderContext, providerId: string) {
    const root = await getLocalRuntimeRoot(context, providerId);
    return root == null ? null : path.join(root, "node_modules");
  }

  async function getNodeRuntime(context: ProviderContext, providerId: string) {
    const [root, resourcesPath] = await Promise.all([
      getLocalRuntimeRoot(context, providerId),
      canUseLocalRuntime(context).then((allowed) =>
        allowed
          ? resolveElectronResourcesPath({
              env: process.env,
              resourcesPath: (process as NodeJS.Process & { resourcesPath?: string }).resourcesPath,
            })
          : null,
      ),
    ]);
    if (root == null || resourcesPath == null) return null;
    const nodePath = resolveNodeExecutable(resourcesPath);
    return nodePath == null ? null : { nodeModulesPath: path.join(root, "node_modules"), nodePath };
  }

  async function getRuntimePath(context: ProviderContext, providerId: string, relativePath: string) {
    const root = await getLocalRuntimeRoot(context, providerId);
    return root == null ? null : path.join(root, relativePath);
  }

  class CommandResolver {
    constructor(readonly context: ProviderContext, readonly hostPath: any) {}

    trustedPath(candidate: string | null | undefined) {
      return resolveTrustedLanguageServerPath(candidate, this.context.workspaceRoot, this.hostPath);
    }

    async lookup(args: string[]) {
      const processHandle = await this.context.host.spawn({
        args,
        cwd: await this.context.host.codexHome(),
        outputBytesCap: 65_536,
        timeoutMs: LANGUAGE_SERVER_LOOKUP_TIMEOUT_MS,
      });
      const { code, stdout } = await readProcessResult(processHandle);
      return code === 0 ? stdout : null;
    }

    async isFile(candidate: string) {
      return (
        (await this.context.host
          .stat(candidate, { bypassCache: true, followSymlinks: true })
          .catch(() => null))?.isFile() === true
      );
    }
  }

  class UnixCommandResolver extends CommandResolver {
    async findTrustedCommand(name: string) {
      if (this.context.host.isLocal && process.platform !== "win32")
        return this.trustedPath(resolveExecutable(name));
      const output = await this.lookup([
        "/bin/sh",
        "-lc",
        `printf '\\n${LANGUAGE_SERVER_LOOKUP_MARKER}%s\\n' "$(command -v -- "$1")"`,
        "sh",
        name,
      ]);
      return this.trustedPath(parseUnixTrustedLookup(output));
    }

    async getNodeModuleLaunchCommand(
      executable: string,
      _packageName: string,
      _packageEntry: string[],
      args: string[],
    ) {
      const [nodePath, stat] = await Promise.all([
        this.findTrustedCommand("node"),
        this.context.host
          .stat(executable, { bypassCache: true, followSymlinks: true })
          .catch(() => null),
      ]);
      if (nodePath == null || stat?.isFile() !== true ||
        (stat.size != null && stat.size > LANGUAGE_SERVER_NODE_SCRIPT_MAX_BYTES)) return null;
      let firstLine: string;
      try {
        firstLine = new TextDecoder()
          .decode(await readHostFile(await this.context.host.readFile(executable)))
          .split(/\r?\n/u, 1)[0];
      } catch {
        return null;
      }
      return /^#!.*\bnode(?:\s|$)/u.test(firstLine) ? [nodePath, executable, ...args] : null;
    }

    getDirectLaunchCommand(executable: string, args: string[]) {
      return buildUnixDirectLaunchCommand(
        executable,
        args,
        this.context.host.isLocal,
        process.platform,
      );
    }

    async getTypeScriptServerPath(candidate: string) {
      return (await this.isFile(candidate)) ? candidate : null;
    }
  }

  class WindowsCommandResolver extends CommandResolver {
    async findTrustedCommand(name: string) {
      if (this.context.host.isLocal) return this.trustedPath(resolveExecutable(name));
      return this.trustedPath(parseWindowsTrustedLookup(await this.lookup(["where.exe", name])));
    }

    async getNodeModuleLaunchCommand(
      executable: string,
      packageName: string,
      packageEntry: string[],
      args: string[],
    ) {
      if (!/\.(?:bat|cmd)$/iu.test(executable)) return [executable, ...args];
      const nodePath = await this.findTrustedCommand("node");
      if (nodePath == null) return null;
      const script = this.hostPath.join(
        this.hostPath.dirname(executable),
        "node_modules",
        ...packageName.split("/"),
        ...packageEntry,
      );
      return (await this.isFile(script)) ? [nodePath, script, ...args] : null;
    }

    getDirectLaunchCommand(executable: string, args: string[]) {
      return /\.(?:bat|cmd)$/iu.test(executable) ? null : [executable, ...args];
    }

    async getTypeScriptServerPath(candidate: string) {
      const script = /\.(?:bat|cmd)$/iu.test(candidate)
        ? this.hostPath.join(
            this.hostPath.dirname(candidate),
            "node_modules",
            "typescript",
            "lib",
            "tsserver.js",
          )
        : candidate;
      return (await this.isFile(script)) ? script : null;
    }
  }

  async function createCommandResolver(context: ProviderContext) {
    const [platform, hostPath] = await Promise.all([
      context.host.platformFamily(),
      context.host.platformPath(),
    ]);
    return platform === "windows"
      ? new WindowsCommandResolver(context, hostPath)
      : new UnixCommandResolver(context, hostPath);
  }

  class JavaLanguageServerProvider {
    readonly id = "jdtls";
    readonly languageIds = ["java"];
    readonly workspaceConfiguration = { java: JAVA_WORKSPACE_CONFIGURATION };
    constructor(readonly dataRoot: string) {}

    async findCommand(context: ProviderContext) {
      const resolver = await createCommandResolver(context);
      const nodeModulesPath = await getNodeModulesPath(context, "java");
      if (nodeModulesPath != null) {
        const java = await resolver.findTrustedCommand("java");
        const downloaded = java == null || !(await supportsJava21(context, java))
          ? null
          : await this.findDownloadedCommand(java, nodeModulesPath, await this.getDataPaths(context));
        if (downloaded != null) return downloaded;
      }
      const [jdtls, java] = await Promise.all([
        resolver.findTrustedCommand("jdtls"),
        resolver.findTrustedCommand("java"),
      ]);
      if (jdtls == null || java == null) return null;
      const wrapper = await classifyJdtlsWrapper(context, jdtls);
      if (wrapper == null) return null;
      const { workspace } = await this.getDataPaths(context);
      await context.host.createDirectory(workspace, { recursive: true });
      if (wrapper === "python") {
        const python = (await resolver.findTrustedCommand("python3")) ??
          (await resolver.findTrustedCommand("python"));
        return python == null ? null : [python, jdtls, "--java-executable", java, "-data", workspace];
      }
      return resolver.getDirectLaunchCommand(jdtls, ["-data", workspace]);
    }

    async findSessionOptions(context: ProviderContext) {
      const resolver = await createCommandResolver(context);
      const platform = await context.host.platformFamily();
      const java = await resolver.findTrustedCommand("java");
      if (java == null) return null;
      const python = (await resolver.findTrustedCommand(platform === "windows" ? "python" : "python3")) ??
        (await resolver.findTrustedCommand("python"));
      const hostPath = await context.host.platformPath();
      const pathEntries = new Set([hostPath.dirname(java)]);
      if (python != null) pathEntries.add(hostPath.dirname(python));
      if (platform === "windows") {
        const command = await resolver.findTrustedCommand("cmd.exe");
        if (command != null) pathEntries.add(hostPath.dirname(command));
      } else {
        pathEntries.add("/usr/bin");
        pathEntries.add("/bin");
      }
      return buildJavaSessionOptions({ platform, pathEntries: [...pathEntries] });
    }

    async findWorkingDirectory(context: ProviderContext) {
      const { root } = await this.getDataPaths(context);
      await context.host.createDirectory(root, { recursive: true });
      return root;
    }

    private async findDownloadedCommand(
      java: string,
      nodeModulesPath: string,
      dataPaths: { root: string; workspace: string },
    ) {
      const serverRoot = path.join(nodeModulesPath, "@vscjava", "java-language-server", "server");
      const plugins = path.join(serverRoot, "plugins");
      const launcher = (await fsPromises.readdir(plugins).catch(() => [] as string[])).find(
        (entry: string) => entry.startsWith("org.eclipse.equinox.launcher_") && entry.endsWith(".jar"),
      );
      if (launcher == null) return null;
      const configParts = JAVA_CONFIG_DIRECTORIES[process.platform];
      if (configParts == null) return null;
      const configSource = path.join(nodeModulesPath, ...configParts);
      if (!(await fsPromises.stat(path.join(configSource, "config.ini")).catch(() => null))?.isFile())
        return null;
      const configuration = path.join(
        dataPaths.root,
        path.basename(launcher, ".jar"),
        "configuration",
      );
      await Promise.all([
        fsPromises.cp(configSource, configuration, { force: true, recursive: true }),
        fsPromises.mkdir(dataPaths.workspace, { recursive: true }),
      ]);
      return [
        java,
        "-Declipse.application=org.eclipse.jdt.ls.core.id1",
        "-Dosgi.bundles.defaultStartLevel=4",
        "-Dosgi.checkConfiguration=true",
        "-Declipse.product=org.eclipse.jdt.ls.core.product",
        "-Djava.import.generatesMetadataFilesAtProjectRoot=false",
        "-Dfile.encoding=UTF-8",
        "-Xmx1G",
        "--add-modules=ALL-SYSTEM",
        "--add-opens",
        "java.base/java.util=ALL-UNNAMED",
        "--add-opens",
        "java.base/java.lang=ALL-UNNAMED",
        "-jar",
        path.join(plugins, launcher),
        "-configuration",
        configuration,
        "-data",
        dataPaths.workspace,
      ];
    }

    private async getDataPaths(context: ProviderContext) {
      const hostPath = await context.host.platformPath();
      const base = (await canUseLocalRuntime(context))
        ? this.dataRoot
        : hostPath.join(await context.host.codexHome(), "language-servers", "java");
      const root = hostPath.join(
        base,
        crypto.createHash("sha256")
          .update(context.workspaceRoot)
          .update("\0")
          .update(context.sessionId)
          .digest("hex")
          .slice(0, 16),
      );
      return { root, workspace: hostPath.join(root, "workspace") };
    }
  }

  async function classifyJdtlsWrapper(context: ProviderContext, command: string) {
    try {
      const stat = await context.host.stat(command, { bypassCache: true, followSymlinks: true });
      if (!stat.isFile() || (stat.size != null && stat.size > JAVA_WRAPPER_MAX_BYTES)) return null;
      const contents = await readStreamUpTo(await context.host.readFile(command), JAVA_WRAPPER_MAX_BYTES);
      if (
        contents == null ||
        (contents.includes("java-lsp.json") && contents.includes("createLspProxy")) ||
        /^#!.*\b(?:ba|z|k)?sh(?:\s|$)/u.test(contents.split(/\r?\n/u, 1)[0])
      ) return null;
      const firstLine = contents.split(/\r?\n/u, 1)[0];
      return /^#!.*\bpython3?(?:\s|$)/u.test(firstLine)
        ? "python"
        : firstLine.startsWith("#!")
          ? null
          : "binary";
    } catch {
      return null;
    }
  }

  async function readStreamUpTo(stream: ReadableStream<Uint8Array>, limit: number) {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          const combined = new Uint8Array(length);
          let offset = 0;
          for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.byteLength;
          }
          return new TextDecoder().decode(combined);
        }
        length += value.byteLength;
        if (length > limit) {
          await reader.cancel();
          return null;
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }

  async function supportsJava21(context: ProviderContext, java: string) {
    try {
      const processHandle = await context.host.spawn({
        args: [java, "-version"],
        cwd: context.workspaceRoot,
        outputBytesCap: 65_536,
        timeoutMs: JAVA_VERSION_TIMEOUT_MS,
      });
      const { code, stderr, stdout } = await readProcessResult(processHandle);
      if (code !== 0) return false;
      const version = /(?:java|openjdk) version "(?:1\.)?(\d+)/iu.exec(`${stderr}\n${stdout}`)?.[1];
      return version != null && Number(version) >= 21;
    } catch {
      return false;
    }
  }

  class KotlinLanguageServerProvider {
    readonly id = "kotlin-lsp";
    readonly languageIds = ["kotlin"];
    readonly downloadedExecutablePaths = new Set<string>();
    constructor(readonly dataRoot: string) {}

    async findCommand(context: ProviderContext) {
      const downloaded = await this.getDownloadedExecutablePath(context);
      const args = ["--stdio", "--system-path", await this.getSystemPath(context)];
      if (downloaded != null && (await fsPromises.stat(downloaded).catch(() => null))?.isFile()) {
        this.downloadedExecutablePaths.add(downloaded);
        return [downloaded, ...args];
      }
      const resolver = await createCommandResolver(context);
      for (const command of await Promise.all([
        resolver.findTrustedCommand("kotlin-lsp"),
        resolver.findTrustedCommand("intellij-server"),
      ])) {
        if (command == null) continue;
        const launch = resolver.getDirectLaunchCommand(command, args);
        if (launch != null) return launch;
      }
      return null;
    }

    async classifyProcessExit(_context: ProviderContext, command: string[], exit: { code: number }) {
      if (exit.code !== 7) return null;
      const executable = command[0];
      return {
        localRuntimeId: executable != null && this.downloadedExecutablePaths.delete(executable)
          ? "kotlin"
          : null,
        status: "expired-build",
      };
    }

    async findSessionOptions(context: ProviderContext) {
      const hostPath = await context.host.platformPath();
      const workspace = hostPath.join(await this.getSystemPath(context), "workspace");
      await context.host.createDirectory(workspace, { recursive: true });
      await context.host.writeFile(
        hostPath.join(workspace, "workspace.json"),
        `${JSON.stringify(buildKotlinWorkspaceConfig(context.workspaceRoot))}\n`,
      );
      return {
        initializationOptions: { buildTools: { [filePathToUri(workspace, hostPath)]: "json" } },
        languageServerWorkspaceRoot: workspace,
      };
    }

    private async getSystemPath(context: ProviderContext) {
      const hostPath = await context.host.platformPath();
      const base = (await canUseLocalRuntime(context))
        ? this.dataRoot
        : hostPath.join(await context.host.codexHome(), "language-servers", "kotlin");
      return hostPath.join(
        base,
        crypto.createHash("sha256").update(context.workspaceRoot).digest("hex").slice(0, 16),
      );
    }

    private async getDownloadedExecutablePath(context: ProviderContext) {
      return getRuntimePath(
        context,
        "kotlin",
        path.join(
          "server",
          "bin",
          (await context.host.platformFamily()) === "windows"
            ? "intellij-server.exe"
            : "intellij-server",
        ),
      );
    }
  }

  class PyrightLanguageServerProvider {
    readonly id = "pyright";
    readonly languageIds = ["python"];

    async findCommand(context: ProviderContext) {
      const runtime = await getNodeRuntime(context, "python");
      if (runtime != null) {
        const server = path.join(runtime.nodeModulesPath, "pyright", "langserver.index.js");
        if ((await fsPromises.stat(server).catch(() => null))?.isFile())
          return [runtime.nodePath, server, "--stdio"];
      }
      const resolver = await createCommandResolver(context);
      const command = await resolver.findTrustedCommand("pyright-langserver");
      return command == null
        ? null
        : resolver.getNodeModuleLaunchCommand(
            command,
            "pyright",
            ["langserver.index.js"],
            ["--stdio"],
          );
    }

    async findSessionOptions(context: ProviderContext) {
      const resolver = await createCommandResolver(context);
      const platform = await context.host.platformFamily();
      const python = (await resolver.findTrustedCommand(platform === "windows" ? "python" : "python3")) ??
        (await resolver.findTrustedCommand("python"));
      const hostPath = await context.host.platformPath();
      const pathEntries = new Set<string>();
      if (python != null) pathEntries.add(hostPath.dirname(python));
      if (platform !== "windows") {
        pathEntries.add("/usr/bin");
        pathEntries.add("/bin");
      } else {
        const command = await resolver.findTrustedCommand("cmd.exe");
        if (command != null) pathEntries.add(hostPath.dirname(command));
      }
      return buildPyrightSessionOptions({ platform, pathEntries: [...pathEntries], pythonCommand: python });
    }

    async findWorkingDirectory(context: ProviderContext) {
      const directory = (await context.host.platformPath()).join(
        await context.host.codexHome(),
        "language-servers",
        "pyright",
      );
      await context.host.createDirectory(directory, { recursive: true });
      return directory;
    }
  }

  class RustAnalyzerProvider {
    readonly id = "rust-analyzer";
    readonly languageIds = ["rust"];

    async findCommand(context: ProviderContext) {
      const downloaded = await getRuntimePath(
        context,
        "rust",
        (await context.host.platformFamily()) === "windows" ? "rust-analyzer.exe" : "rust-analyzer",
      );
      if (downloaded != null && (await fsPromises.stat(downloaded).catch(() => null))?.isFile())
        return [downloaded];
      const resolver = await createCommandResolver(context);
      const command = await resolver.findTrustedCommand("rust-analyzer");
      return command == null ? null : resolver.getDirectLaunchCommand(command, []);
    }

    async findSessionOptions(context: ProviderContext) {
      const [resolver, platform, hostPath] = await Promise.all([
        createCommandResolver(context),
        context.host.platformFamily(),
        context.host.platformPath(),
      ]);
      const [cargo, rustc] = await Promise.all([
        resolver.findTrustedCommand("cargo"),
        resolver.findTrustedCommand("rustc"),
      ]);
      if (rustc == null) return null;
      const pathEntries = new Set([cargo, rustc].filter((value): value is string => value != null)
        .map((value) => hostPath.dirname(value)));
      if (platform === "windows") {
        const command = await resolver.findTrustedCommand("cmd.exe");
        if (command != null) pathEntries.add(hostPath.dirname(command));
      } else {
        pathEntries.add("/usr/bin");
        pathEntries.add("/bin");
      }
      const env = {
        CARGO_NET_OFFLINE: "true",
        PATH: [...pathEntries].join(platform === "windows" ? ";" : ":"),
        RUSTC: rustc,
        RUSTC_WRAPPER: "",
        RUSTC_WORKSPACE_WRAPPER: "",
        RUSTUP_AUTO_INSTALL: "0",
      };
      const options = buildRustAnalyzerOptions(
        await findRustSysroot(context, hostPath, rustc, env),
      );
      return { env, initializationOptions: options, workspaceConfiguration: { "rust-analyzer": options } };
    }
  }

  async function findRustSysroot(
    context: ProviderContext,
    hostPath: any,
    rustc: string | null,
    env: Record<string, string>,
  ) {
    if (rustc == null) return null;
    try {
      const processHandle = await context.host.spawn({
        args: [rustc, "--print", "sysroot"],
        cwd: context.workspaceRoot,
        env,
        outputBytesCap: 65_536,
        timeoutMs: RUST_SYSROOT_TIMEOUT_MS,
      });
      const { code, stdout } = await readProcessResult(processHandle);
      const sysroot = stdout.trim();
      if (code !== 0 || !hostPath.isAbsolute(sysroot)) return null;
      return (
        await context.host.stat(
          hostPath.join(sysroot, "lib", "rustlib", "src", "rust", "library"),
          { bypassCache: true, followSymlinks: true },
        ).catch(() => null)
      )?.isDirectory() === true
        ? sysroot
        : null;
    } catch {
      return null;
    }
  }

  class SourceKitLanguageServerProvider {
    readonly id = "sourcekit-lsp";
    readonly languageIds = ["swift"];

    async findCommand(context: ProviderContext) {
      const resolver = await createCommandResolver(context);
      const command = await resolver.findTrustedCommand("sourcekit-lsp");
      if (command != null) return resolver.getDirectLaunchCommand(command, []);
      if ((await context.host.platformOs()) !== "macos") return null;
      const xcrun = context.host.isLocal
        ? "/usr/bin/xcrun"
        : await resolver.findTrustedCommand("xcrun");
      return xcrun == null ? null : resolver.getDirectLaunchCommand(xcrun, ["sourcekit-lsp"]);
    }

    async findSessionOptions(context: ProviderContext) {
      const directory = (await context.host.platformPath()).join(
        await context.host.codexHome(),
        "language-servers",
        "sourcekit-lsp",
        "workspace",
      );
      await context.host.createDirectory(directory, { recursive: true });
      return {
        initializationOptions: SOURCEKIT_INITIALIZATION_OPTIONS,
        languageServerWorkspaceRoot: directory,
      };
    }
  }

  class TypeScriptLanguageServerProvider {
    readonly id = "typescript-language-server";
    readonly languageIds = ["javascript", "javascriptreact", "typescript", "typescriptreact"];

    async findCommand(context: ProviderContext) {
      const runtime = await findTypeScriptRuntime(context);
      if (runtime != null) return [runtime.nodePath, runtime.languageServerPath, "--stdio"];
      const resolver = await createCommandResolver(context);
      const command = await resolver.findTrustedCommand("typescript-language-server");
      return command == null
        ? null
        : resolver.getNodeModuleLaunchCommand(
            command,
            "typescript-language-server",
            ["lib", "cli.mjs"],
            ["--stdio"],
          );
    }

    async findInitializationOptions(context: ProviderContext) {
      const runtime = await findTypeScriptRuntime(context);
      if (runtime != null) return buildTypeScriptServerInitializationOptions(runtime.tsserverPath);
      const resolver = await createCommandResolver(context);
      const command = await resolver.findTrustedCommand("tsserver");
      if (command == null) return null;
      const script = await resolver.getTypeScriptServerPath(command);
      return script == null ? null : buildTypeScriptServerInitializationOptions(script);
    }
  }

  async function findTypeScriptRuntime(context: ProviderContext) {
    const runtime = await getNodeRuntime(context, "typescript");
    if (runtime == null) return null;
    const paths = {
      languageServerPath: path.join(
        runtime.nodeModulesPath,
        "typescript-language-server",
        "lib",
        "cli.mjs",
      ),
      nodePath: runtime.nodePath,
      tsserverPath: path.join(runtime.nodeModulesPath, "typescript", "lib", "tsserver.js"),
    };
    try {
      return (await Promise.all(Object.values(paths).map((value) => fsPromises.stat(value))))
        .every((stat) => stat.isFile())
        ? paths
        : null;
    } catch {
      return null;
    }
  }

  return {
    CommandResolver,
    JavaLanguageServerProvider,
    KotlinLanguageServerProvider,
    PyrightLanguageServerProvider,
    RustAnalyzerProvider,
    SourceKitLanguageServerProvider,
    TypeScriptLanguageServerProvider,
    UnixCommandResolver,
    WindowsCommandResolver,
    canUseLocalRuntime,
    createCommandResolver,
  };
}
