type NativeShellTargetDependencies = {
  path: any;
  fs: any;
  os: any;
  env: NodeJS.ProcessEnv;
  createTargetDescriptor(options: any): any;
  buildRevealPathArgs(targetPath: string): string[];
  directoryForTarget(targetPath: string): string;
  findExecutable(command: string): string | null;
  resolveExecutableLink(path: string): string | null;
  findSiblingFile(path: string, sibling: string): string | null;
  findWindowsInstall(paths: string[][]): string | null;
  findStartMenuShortcut(names: string[]): string | null;
  isLocalHostConfig(value: unknown): boolean;
  translateHostPath(path: string, distro: string | null | undefined): string;
  loadElectronShell(): Promise<{
    openPath(path: string): Promise<string>;
    showItemInFolder(path: string): void;
  }>;
  spawn(command: string, args: string[]): Promise<any>;
};

/** Owns native shell, file-manager, and Windows desktop application targets. */
export function createNativeShellTargetRuntime(dependencies: NativeShellTargetDependencies) {
  const path = dependencies.path.default ?? dependencies.path;

  function detectWindowsExplorer() {
    const systemRoot = dependencies.env.SystemRoot ?? dependencies.env.windir;
    if (systemRoot) {
      const explorer = path.join(systemRoot, "explorer.exe");
      if (dependencies.fs.existsSync(explorer)) return explorer;
    }
    return "explorer.exe";
  }

  function nearestExistingPath(targetPath: string) {
    let candidate = targetPath;
    for (;;) {
      if (dependencies.fs.existsSync(candidate)) return candidate;
      const parent = path.dirname(candidate);
      if (parent === candidate) return null;
      candidate = parent;
    }
  }

  async function openNativePath(targetPath: string) {
    const shell = await dependencies.loadElectronShell();
    const existingPath = nearestExistingPath(targetPath);
    if (existingPath && dependencies.fs.statSync(existingPath).isFile()) {
      shell.showItemInFolder(existingPath);
      return;
    }
    const error = await shell.openPath(existingPath ?? targetPath);
    if (error) throw Error(error);
  }

  function detectGitBashWindows() {
    const command = dependencies.findExecutable("git-bash.exe") ??
      dependencies.findExecutable("git-bash");
    if (command) {
      const resolved = dependencies.resolveExecutableLink(command);
      if (resolved) return dependencies.findSiblingFile(resolved, "git-bash.exe") ?? resolved;
    }
    return dependencies.findWindowsInstall([
      ["Git", "git-bash.exe"],
      ["Git", "bin", "bash.exe"],
    ]);
  }

  function resolveGitBashIcon(command: string | null) {
    return dependencies.findStartMenuShortcut(["Git Bash.lnk"]) ||
      dependencies.findWindowsInstall([["Git", "git-bash.exe"]]) ||
      (command ? dependencies.findSiblingFile(command, "git-bash.exe") ?? command : null);
  }

  function detectGithubDesktopWindows() {
    const command = dependencies.findExecutable("github.exe") ?? dependencies.findExecutable("github");
    if (command) {
      const resolved = dependencies.resolveExecutableLink(command);
      if (resolved)
        return dependencies.findSiblingFile(resolved, "GitHubDesktop.exe") ?? resolved;
    }
    const localAppData = dependencies.env.LOCALAPPDATA ??
      `${dependencies.os.homedir()}\\AppData\\Local`;
    for (const segments of [
      ["GitHubDesktop", "GitHubDesktop.exe"],
      ["GitHub Desktop", "GitHubDesktop.exe"],
    ]) {
      const candidate = path.join(localAppData, ...segments);
      if (dependencies.fs.existsSync(candidate)) return candidate;
    }
    return dependencies.findWindowsInstall([
      ["GitHub Desktop", "GitHubDesktop.exe"],
      ["GitHubDesktop", "GitHubDesktop.exe"],
    ]);
  }

  async function openDarwinDefault(targetPath: string, appPath: string | null) {
    await dependencies.spawn(
      "/usr/bin/open",
      appPath == null ? [targetPath] : ["-a", appPath, targetPath],
    );
  }

  async function openLinuxDefault(targetPath: string, appPath: string | null) {
    if (appPath == null) {
      await openNativePath(targetPath);
      return;
    }
    if (!path.isAbsolute(appPath) || path.extname(appPath) !== ".desktop")
      throw Error("Invalid Linux desktop application path");
    const gio = dependencies.findExecutable("gio");
    if (gio == null) throw Error("Linux desktop application launcher is unavailable");
    await dependencies.spawn(gio, ["launch", appPath, targetPath]);
  }

  const fileManager = dependencies.createTargetDescriptor({
    id: "fileManager",
    label: "Finder",
    icon: "apps/finder.png",
    kind: "fileManager",
    darwin: {
      detect: () => "/usr/bin/open",
      args: (targetPath: string) => dependencies.buildRevealPathArgs(targetPath),
    },
    win32: {
      label: "File Explorer",
      icon: "apps/file-explorer.png",
      detect: detectWindowsExplorer,
      args: (targetPath: string) => dependencies.buildRevealPathArgs(targetPath),
      open: async ({ path: targetPath, hostConfig, remotePath, remoteWorkspaceRoot }: any) =>
        openNativePath(
          hostConfig != null && dependencies.isLocalHostConfig(hostConfig)
            ? dependencies.translateHostPath(
                remotePath ?? remoteWorkspaceRoot ?? targetPath,
                hostConfig.distro,
              )
            : targetPath,
        ),
    },
    linux: {
      label: "File Manager",
      icon: "apps/file-explorer.png",
      detect: () => "file-manager",
      args: (targetPath: string) => [targetPath],
      open: async ({ path: targetPath }: any) => openNativePath(targetPath),
    },
  });

  const gitBash = dependencies.createTargetDescriptor({
    id: "gitBash",
    label: "Git Bash",
    icon: "apps/vscode.png",
    kind: "terminal",
    win32: {
      detect: detectGitBashWindows,
      iconPath: resolveGitBashIcon,
      args: (targetPath: string) => [`--cd=${dependencies.directoryForTarget(targetPath)}`],
    },
  });

  const githubDesktop = dependencies.createTargetDescriptor({
    id: "githubDesktop",
    label: "GitHub Desktop",
    icon: "apps/vscode.png",
    kind: "editor",
    win32: {
      detect: detectGithubDesktopWindows,
      args: (targetPath: string) => [dependencies.directoryForTarget(targetPath)],
    },
  });

  const systemDefault = dependencies.createTargetDescriptor({
    id: "systemDefault",
    label: "Default app",
    icon: "apps/file-explorer.png",
    kind: "systemDefault",
    hidden: true,
    darwin: {
      detect: () => "system-default",
      iconPath: () => null,
      args: (targetPath: string) => [targetPath],
      open: async ({ appPath, path: targetPath }: any) => openDarwinDefault(targetPath, appPath),
    },
    win32: {
      detect: () => "system-default",
      iconPath: () => null,
      args: (targetPath: string) => [targetPath],
      open: async ({ path: targetPath }: any) => openNativePath(targetPath),
    },
    linux: {
      detect: () => "system-default",
      iconPath: () => null,
      args: (targetPath: string) => [targetPath],
      open: async ({ appPath, path: targetPath }: any) => openLinuxDefault(targetPath, appPath),
    },
  });

  return {
    detectGitBashWindows,
    detectGithubDesktopWindows,
    detectWindowsExplorer,
    fileManager,
    gitBash,
    githubDesktop,
    nearestExistingPath,
    openDarwinDefault,
    openLinuxDefault,
    openNativePath,
    resolveGitBashIcon,
    systemDefault,
  };
}
