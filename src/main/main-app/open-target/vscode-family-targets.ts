type VscodeFamilyDependencies = {
  platform: NodeJS.Platform;
  path: any;
  fs: any;
  env: NodeJS.ProcessEnv;
  createEditorTargetDescriptor(options: any): any;
  buildEditorArgs(...args: any[]): string[];
  buildVscodeRemoteArgs(options: any): string[];
  isHostConfig(value: unknown): boolean;
  findExistingMacApplication(paths: string[]): string | null;
  findMacApplicationBundle(prefix: string): string | null;
  macApplicationCandidates(path: string): string[];
  findCommandOrDesktopEntry(commands: string[], entries: string[]): string | null;
  findExecutable(command: string): string | null;
  resolveExecutableLink(path: string): string | null;
  findWindowsInstall(paths: string[][]): string | null;
  resolveWindowsElectronApp(options: any): string | null;
};

/** Owns VS Code-derived editor descriptors and their platform-specific detection. */
export function createVscodeFamilyTargetRuntime(dependencies: VscodeFamilyDependencies) {
  const path = dependencies.path.default ?? dependencies.path;

  function editorArgs(
    targetPath: string,
    location: any,
    hostConfig: any,
    remoteWorkspaceRoot: string | null,
    remotePath: string | null,
  ) {
    return hostConfig != null &&
      dependencies.isHostConfig(hostConfig) &&
      (remoteWorkspaceRoot != null || remotePath != null)
      ? dependencies.buildVscodeRemoteArgs({
          hostConfig,
          location,
          remotePath,
          remoteWorkspaceRoot,
        })
      : dependencies.buildEditorArgs(targetPath, location);
  }

  function detectAntigravityWindows() {
    const command = dependencies.findExecutable("antigravity.exe") ??
      dependencies.findExecutable("antigravity.cmd") ??
      dependencies.findExecutable("antigravity");
    return command
      ? dependencies.resolveExecutableLink(command)
      : dependencies.findWindowsInstall([
          ["Antigravity", "Antigravity.exe"],
          ["antigravity", "Antigravity.exe"],
          ["Antigravity", "bin", "antigravity.cmd"],
          ["antigravity", "bin", "antigravity.cmd"],
          ["Antigravity", "resources", "app", "bin", "antigravity.cmd"],
          ["antigravity", "resources", "app", "bin", "antigravity.cmd"],
        ]);
  }

  function findCursorMacRuntime() {
    if (dependencies.platform !== "darwin") return null;
    const applications = [
      "/Applications/Cursor.app",
      "/Applications/Cursor Preview.app",
      "/Applications/Cursor Nightly.app",
    ];
    const discovered = dependencies.findMacApplicationBundle("Cursor");
    if (discovered) applications.push(discovered);
    for (const application of applications)
      for (const candidate of dependencies.macApplicationCandidates(application)) {
        const electronBin = path.join(candidate, "Contents", "MacOS", "Cursor");
        const cliJs = path.join(candidate, "Contents", "Resources", "app", "out", "cli.js");
        if (dependencies.fs.existsSync(electronBin) && dependencies.fs.existsSync(cliJs))
          return { electronBin, cliJs };
      }
    return null;
  }

  function detectCursorWindows() {
    const command = dependencies.findExecutable("cursor");
    if (command) {
      const resolved = dependencies.resolveExecutableLink(command);
      if (resolved) {
        if (path.basename(resolved).toLowerCase() === "cursor.exe") return resolved;
        const binDirectory = path.dirname(resolved);
        if (path.basename(binDirectory).toLowerCase() === "bin") {
          const appDirectory = path.dirname(binDirectory);
          if (path.basename(appDirectory).toLowerCase() === "app") {
            const resourcesDirectory = path.dirname(appDirectory);
            if (path.basename(resourcesDirectory).toLowerCase() === "resources") {
              const executable = path.join(path.dirname(resourcesDirectory), "Cursor.exe");
              if (dependencies.fs.existsSync(executable)) return executable;
            }
          }
        }
      }
    }
    return dependencies.findWindowsInstall([["Cursor", "Cursor.exe"]]);
  }

  function cursorEnvironment() {
    const env = { ...dependencies.env };
    env.VSCODE_NODE_OPTIONS = env.NODE_OPTIONS;
    env.VSCODE_NODE_REPL_EXTERNAL_MODULE = env.NODE_REPL_EXTERNAL_MODULE;
    delete env.NODE_OPTIONS;
    delete env.NODE_REPL_EXTERNAL_MODULE;
    env.ELECTRON_RUN_AS_NODE = "1";
    return env;
  }

  function cursorArgs(...args: any[]) {
    const runtime = findCursorMacRuntime();
    if (!runtime) throw Error("Cursor CLI entrypoint not available");
    return [runtime.cliJs, ...editorArgs(...args as [any, any, any, any, any])];
  }

  function detectVscodeWindows() {
    return dependencies.resolveWindowsElectronApp({
      pathCommand: dependencies.findExecutable("code"),
      executableName: "Code.exe",
      installDirName: "Microsoft VS Code",
    });
  }

  function detectVscodeInsidersWindows() {
    return dependencies.resolveWindowsElectronApp({
      pathCommand: dependencies.findExecutable("code-insiders"),
      executableName: "Code - Insiders.exe",
      installDirName: "Microsoft VS Code Insiders",
    });
  }

  const antigravity = dependencies.createEditorTargetDescriptor({
    id: "antigravity",
    label: "Antigravity",
    icon: "apps/antigravity.png",
    darwinDetect: () => dependencies.findExistingMacApplication([
      "/Applications/Antigravity.app/Contents/Resources/app/bin/antigravity",
    ]),
    win32Detect: detectAntigravityWindows,
    linuxDetect: () => dependencies.findCommandOrDesktopEntry(
      ["antigravity-ide"],
      ["antigravity-ide.desktop"],
    ),
  });

  const cursor = dependencies.createEditorTargetDescriptor({
    id: "cursor",
    label: "Cursor",
    icon: "apps/cursor.png",
    darwinDetect: () => findCursorMacRuntime()?.electronBin ?? null,
    win32Detect: detectCursorWindows,
    linuxDetect: () => dependencies.findCommandOrDesktopEntry(["cursor"], ["cursor.desktop"]),
    darwinEnv: cursorEnvironment,
    darwinArgs: cursorArgs,
  });

  const devin = dependencies.createEditorTargetDescriptor({
    id: "devin",
    label: "Devin Desktop",
    icon: "apps/devin.svg",
    darwinDetect: () => dependencies.findExistingMacApplication([
      "/Applications/Devin.app/Contents/Resources/app/bin/devin-desktop",
    ]),
  });

  const vscode = dependencies.createEditorTargetDescriptor({
    id: "vscode",
    label: "VS Code",
    icon: "apps/vscode.png",
    darwinDetect: () => dependencies.findExistingMacApplication([
      "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
      "/Applications/Code.app/Contents/Resources/app/bin/code",
    ]),
    win32Detect: detectVscodeWindows,
    linuxDetect: () => dependencies.findCommandOrDesktopEntry(
      ["code", "code-oss"],
      [
        "code.desktop",
        "code-oss.desktop",
        "com.visualstudio.code.desktop",
        "com.visualstudio.code-oss.desktop",
        "code_code.desktop",
      ],
    ),
  });

  const vscodeInsiders = dependencies.createEditorTargetDescriptor({
    id: "vscodeInsiders",
    label: "VS Code Insiders",
    icon: "apps/vscode-insiders.png",
    darwinDetect: () => dependencies.findExistingMacApplication([
      "/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code",
      "/Applications/Code - Insiders.app/Contents/Resources/app/bin/code",
    ]),
    win32Detect: detectVscodeInsidersWindows,
    linuxDetect: () => dependencies.findCommandOrDesktopEntry(
      ["code-insiders"],
      [
        "code-insiders.desktop",
        "com.visualstudio.code.insiders.desktop",
        "code-insiders_code-insiders.desktop",
      ],
    ),
  });

  const windsurf = dependencies.createEditorTargetDescriptor({
    id: "windsurf",
    label: "Windsurf",
    icon: "apps/windsurf.png",
    darwinDetect: () => dependencies.findExistingMacApplication([
      "/Applications/Windsurf.app/Contents/Resources/app/bin/windsurf",
    ]),
    linuxDetect: () => dependencies.findCommandOrDesktopEntry(
      ["windsurf"],
      ["windsurf.desktop"],
    ),
  });

  return {
    antigravity,
    cursor,
    cursorArgs,
    cursorEnvironment,
    detectAntigravityWindows,
    detectCursorWindows,
    detectVscodeInsidersWindows,
    detectVscodeWindows,
    devin,
    editorArgs,
    findCursorMacRuntime,
    vscode,
    vscodeInsiders,
    windsurf,
  };
}
