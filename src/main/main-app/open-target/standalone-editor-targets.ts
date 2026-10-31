type StandaloneEditorDependencies = {
  platform: NodeJS.Platform;
  path: any;
  fs: any;
  env: NodeJS.ProcessEnv;
  createLogger(name: string): any;
  createTargetDescriptor(options: any): any;
  findMacApplicationBundle(prefix: string): string | null;
  findExistingMacApplication(paths: string[]): string | null;
  findMacApplicationExecutable(prefix: string, executable: string): string | null;
  findCommandOrDesktopEntry(commands: string[], entries: string[]): string | null;
  findExecutable(command: string): string | null;
  resolveExecutableLink(path: string): string | null;
  findSiblingExecutable(path: string, executable: string): string | null;
  findWindowsInstall(paths: string[][]): string | null;
  findWindowsExecutableGlob(pattern: string): string | null;
  launchLinuxEditor(options: any, buildArgs: (...args: any[]) => string[]): Promise<void>;
  isRemoteHost(value: unknown): boolean;
  remoteHostLabel(hostConfig: any): string | null;
  pathToFileURL(path: string): URL;
  sanitizeEnvironment(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
  spawnSync(command: string, args: string[], options: any): any;
  spawn(command: string, args: string[]): Promise<any>;
};

/** Owns standalone editor descriptors and their application-specific launch lifecycles. */
export function createStandaloneEditorTargetRuntime(dependencies: StandaloneEditorDependencies) {
  const path = dependencies.path.default ?? dependencies.path;
  const logger = dependencies.createLogger("open-in-targets");

  function emacsArgs(targetPath: string, location: any) {
    return location == null
      ? [targetPath]
      : [`+${location.line}:${location.column}`, targetPath];
  }

  function formatEditorLocation(targetPath: string, location: any) {
    return location ? `${targetPath}:${location.line}:${location.column}` : targetPath;
  }

  function buildSshUri(host: string, remotePath: string | null | undefined) {
    const normalizedHost = host.trim();
    const normalizedPath = remotePath?.trim();
    if (!normalizedHost || !normalizedPath) return null;
    const absolutePath = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
    return `ssh://${normalizedHost}${absolutePath.split("/").map(encodeURIComponent).join("/")}`;
  }

  function editorArgs(
    targetPath: string,
    location: any,
    hostConfig: any,
    remoteWorkspaceRoot: string | null,
    remotePath: string | null,
  ) {
    if (hostConfig != null && dependencies.isRemoteHost(hostConfig)) {
      const host = dependencies.remoteHostLabel(hostConfig);
      if (host == null) throw Error("Zed SSH open is not available for this host.");
      const uri = buildSshUri(host, remotePath?.trim() || remoteWorkspaceRoot);
      if (uri != null) return [formatEditorLocation(uri, location)];
      throw Error("Missing remote path for Zed SSH open.");
    }
    return [formatEditorLocation(targetPath, location)];
  }

  function detectSublimeMac() {
    const command = dependencies.findExecutable("subl");
    if (command) return command;
    const application = dependencies.findMacApplicationBundle("Sublime Text");
    if (application) {
      const bundledCommand = path.join(application, "Contents", "SharedSupport", "bin", "subl");
      if (dependencies.fs.existsSync(bundledCommand)) return bundledCommand;
    }
    return dependencies.findExistingMacApplication([
      "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl",
    ]);
  }

  function detectSublimeWindows() {
    const command = dependencies.findExecutable("subl.exe") ?? dependencies.findExecutable("subl");
    if (command) {
      const resolved = dependencies.resolveExecutableLink(command);
      if (resolved)
        return dependencies.findSiblingExecutable(resolved, "sublime_text.exe") ?? resolved;
    }
    return dependencies.findWindowsInstall([
      ["Sublime Text", "sublime_text.exe"],
      ["Sublime Text", "subl.exe"],
    ]);
  }

  function textMateArgs(targetPath: string, location: any) {
    if (!location) return ["-a", "TextMate", targetPath];
    const target = new URL("txmt://open/");
    target.searchParams.set("url", dependencies.pathToFileURL(targetPath).toString());
    target.searchParams.set("line", location.line.toString());
    target.searchParams.set("column", location.column.toString());
    return ["-a", "TextMate", target.toString()];
  }

  function detectVisualStudioWindows() {
    const command = dependencies.findExecutable("devenv.exe") ??
      dependencies.findExecutable("devenv");
    if (command) return dependencies.resolveExecutableLink(command);
    const versions = ["2022", "2019", "2017"];
    const editions = ["Community", "Professional", "Enterprise", "Preview", "BuildTools"];
    return dependencies.findWindowsInstall(
      versions.flatMap((version) => editions.map((edition) => [
        "Microsoft Visual Studio",
        version,
        edition,
        "Common7",
        "IDE",
        "devenv.exe",
      ])),
    ) || dependencies.findWindowsExecutableGlob("**\\Common7\\IDE\\devenv.exe");
  }

  function resolveXcodeRuntime() {
    if (dependencies.platform !== "darwin") return null;
    const appPath = dependencies.findMacApplicationBundle("Xcode") ??
      dependencies.findExistingMacApplication(["/Applications/Xcode.app"]);
    let xedPath: string | null = null;
    try {
      const result = dependencies.spawnSync("/usr/bin/xcode-select", ["-p"], {
        encoding: "utf8",
        env: dependencies.sanitizeEnvironment(dependencies.env),
        timeout: 1000,
      });
      const developerPath = result.stdout?.trim();
      if (result.status === 0 && developerPath) {
        const selectedXed = path.join(developerPath, "usr", "bin", "xed");
        if (dependencies.fs.existsSync(selectedXed)) xedPath = selectedXed;
      }
    } catch (error) {
      logger().debug("Failed to resolve Xcode via xcode-select", {
        safe: {},
        sensitive: { error },
      });
    }
    if (xedPath == null && appPath) {
      const bundledXed = path.join(appPath, "Contents", "Developer", "usr", "bin", "xed");
      if (dependencies.fs.existsSync(bundledXed)) xedPath = bundledXed;
    }
    return xedPath == null && appPath == null ? null : { appPath, xedPath };
  }

  function findXcodeContainer(targetPath: string) {
    let directory = targetPath;
    if (!dependencies.fs.existsSync(targetPath) || !dependencies.fs.statSync(targetPath).isDirectory())
      directory = path.dirname(targetPath);
    let packageDirectory: string | null = null;
    for (;;) {
      let entries: string[];
      try {
        entries = dependencies.fs.readdirSync(directory);
      } catch {
        entries = [];
      }
      const workspace = entries.find((entry) => entry.endsWith(".xcworkspace"));
      if (workspace) return path.join(directory, workspace);
      const project = entries.find((entry) => entry.endsWith(".xcodeproj"));
      if (project) return path.join(directory, project);
      if (packageDirectory == null && entries.includes("Package.swift")) packageDirectory = directory;
      const parent = path.dirname(directory);
      if (parent === directory) return packageDirectory;
      directory = parent;
    }
  }

  async function openXcode(targetPath: string, location: any) {
    const runtime = resolveXcodeRuntime();
    if (!runtime) throw Error('Open target "xcode" is not available');
    if (runtime.xedPath) {
      const containerPath = findXcodeContainer(targetPath);
      const args: string[] = [];
      if (containerPath) args.push("--project", containerPath);
      if (location) args.push("--line", location.line.toString());
      args.push(targetPath);
      logger().debug("Opening path in Xcode via xed", {
        safe: {},
        sensitive: { xedPath: runtime.xedPath, args, xcodeContainerPath: containerPath, path: targetPath },
      });
      await dependencies.spawn(runtime.xedPath, args);
      return;
    }
    if (runtime.appPath == null) throw Error('Open target "xcode" is not available');
    logger().debug("Opening path in Xcode via LaunchServices fallback", {
      safe: {},
      sensitive: { appPath: runtime.appPath, path: targetPath },
    });
    await dependencies.spawn("/usr/bin/open", ["-a", runtime.appPath, targetPath]);
  }

  function detectZedMac() {
    return dependencies.findExecutable("zed") ?? dependencies.findExistingMacApplication([
      "/Applications/Zed.app/Contents/MacOS/zed",
      "/Applications/Zed Preview.app/Contents/MacOS/zed",
      "/Applications/Zed Nightly.app/Contents/MacOS/zed",
    ]) ?? dependencies.findMacApplicationExecutable("Zed", "zed");
  }

  function detectZedWindows() {
    const command = dependencies.findExecutable("zed.exe") ?? dependencies.findExecutable("zed");
    return command
      ? dependencies.resolveExecutableLink(command)
      : dependencies.findWindowsInstall([["Zed", "Zed.exe"]]);
  }

  function macApplicationPath(command: string) {
    const marker = command.indexOf(".app/Contents/MacOS/");
    return marker === -1 ? null : command.slice(0, marker + 4);
  }

  async function openZed({
    command,
    path: targetPath,
    location,
    hostConfig,
    remoteWorkspaceRoot,
    remotePath,
  }: any) {
    const args = editorArgs(targetPath, location, hostConfig, remoteWorkspaceRoot, remotePath);
    const locationTarget = args[0] ?? targetPath;
    const plainTarget = location == null
      ? locationTarget
      : (editorArgs(targetPath, null, hostConfig, remoteWorkspaceRoot, remotePath)[0] ?? locationTarget);
    const application = macApplicationPath(command);
    if (application) {
      await dependencies.spawn("/usr/bin/open", ["-a", application, plainTarget]);
      if (!location) return;
      const cli = dependencies.findExecutable("zed") ?? command;
      try {
        await dependencies.spawn(cli, args);
      } catch {}
      return;
    }
    await dependencies.spawn(command, args);
  }

  const bbedit = {
    id: "bbedit",
    platforms: {
      darwin: {
        label: "BBEdit",
        icon: "apps/bbedit.png",
        kind: "editor",
        detect: () => dependencies.findMacApplicationBundle("BBEdit") ||
          dependencies.findExistingMacApplication(["/Applications/BBEdit.app"])
          ? "/usr/bin/open"
          : null,
        args: (targetPath: string) => ["-a", "BBEdit", targetPath],
      },
    },
  };

  const emacs = {
    id: "emacs",
    platforms: {
      darwin: {
        label: "Emacs",
        icon: "apps/emacs.png",
        kind: "editor",
        detect: () => dependencies.findMacApplicationBundle("Emacs") ||
          dependencies.findExistingMacApplication(["/Applications/Emacs.app"])
          ? "/usr/bin/open"
          : null,
        args: (targetPath: string) => ["-a", "Emacs", targetPath],
      },
      linux: {
        label: "Emacs",
        icon: "apps/emacs.png",
        kind: "editor",
        detect: () => dependencies.findCommandOrDesktopEntry(
          ["emacs", "emacsclient"],
          ["emacs.desktop", "emacsclient.desktop", "org.gnu.emacs.desktop"],
        ),
        args: emacsArgs,
        open: (options: any) => dependencies.launchLinuxEditor(options, emacsArgs),
      },
    },
  };

  const sublimeText = dependencies.createTargetDescriptor({
    id: "sublimeText",
    label: "Sublime Text",
    icon: "apps/sublime-text.png",
    kind: "editor",
    darwin: { detect: detectSublimeMac, args: editorArgs },
    win32: { detect: detectSublimeWindows, args: editorArgs },
    linux: {
      detect: () => dependencies.findCommandOrDesktopEntry(
        ["subl", "sublime_text"],
        ["sublime_text.desktop", "com.sublimetext.three.desktop", "sublime-text_subl.desktop"],
      ),
      args: editorArgs,
      open: (options: any) => dependencies.launchLinuxEditor(options, editorArgs),
    },
  });

  const textmate = {
    id: "textmate",
    platforms: {
      darwin: {
        label: "TextMate",
        icon: "apps/textmate.png",
        kind: "editor",
        detect: () => dependencies.findMacApplicationBundle("TextMate") ||
          dependencies.findExistingMacApplication(["/Applications/TextMate.app"])
          ? "/usr/bin/open"
          : null,
        args: textMateArgs,
      },
    },
  };

  const visualStudio = dependencies.createTargetDescriptor({
    id: "visualStudio",
    label: "Visual Studio",
    icon: "apps/vscode.png",
    kind: "editor",
    win32: { detect: detectVisualStudioWindows, args: (targetPath: string) => [targetPath] },
  });

  const xcode = {
    id: "xcode",
    platforms: {
      darwin: {
        label: "Xcode",
        icon: "apps/xcode.png",
        kind: "editor",
        detect: () => {
          const runtime = resolveXcodeRuntime();
          return runtime?.xedPath ?? runtime?.appPath ?? null;
        },
        args: (targetPath: string) => [targetPath],
        open: async ({ path: targetPath, location }: any) => openXcode(targetPath, location),
      },
    },
  };

  const zed = {
    id: "zed",
    platforms: {
      darwin: {
        label: "Zed",
        icon: "apps/zed.png",
        kind: "editor",
        detect: detectZedMac,
        args: editorArgs,
        open: openZed,
      },
      win32: {
        label: "Zed",
        icon: "apps/zed.png",
        kind: "editor",
        detect: detectZedWindows,
        args: editorArgs,
      },
      linux: {
        label: "Zed",
        icon: "apps/zed.png",
        kind: "editor",
        detect: () => dependencies.findCommandOrDesktopEntry(
          ["zed"],
          ["dev.zed.Zed.desktop", "dev.zed.Zed-Preview.desktop", "zed.desktop"],
        ),
        args: editorArgs,
        open: (options: any) => dependencies.launchLinuxEditor(options, editorArgs),
      },
    },
  };

  return {
    bbedit,
    buildSshUri,
    detectSublimeMac,
    detectSublimeWindows,
    detectVisualStudioWindows,
    detectZedMac,
    detectZedWindows,
    editorArgs,
    emacs,
    emacsArgs,
    findXcodeContainer,
    formatEditorLocation,
    macApplicationPath,
    openXcode,
    openZed,
    resolveXcodeRuntime,
    sublimeText,
    textmate,
    textMateArgs,
    visualStudio,
    xcode,
    zed,
  };
}
