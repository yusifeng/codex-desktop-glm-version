type TerminalTargetDependencies = {
  platform: NodeJS.Platform;
  path: any;
  fs: any;
  env: NodeJS.ProcessEnv;
  createLogger(tag: string): () => any;
  findExistingMacApplication(paths: string[]): string | null;
  findExecutable(command: string): string | null;
  findWindowsExecutable(command: string): string | null;
  findWindowsShortcut(names: string[]): string | null;
  resolveExecutableLink(path: string): string | null;
  getWindowsSystemPath(): string;
  parseShellWords(command: string): string[];
  shellEscape(value: string): string;
  shellJoin(values: string[]): string;
  toWslPath(path: string): string;
  getWslDistro(path: string): string | null;
  getWslInfo(): Promise<unknown>;
  spawn(command: string, args: string[], options?: any): Promise<unknown>;
};

const EDITOR_CANDIDATES = ["nvim", "vim", "nano", "less"];
const WINDOWS_TERMINAL_COMMAND = "wt.exe";
const WINDOWS_TERMINAL_SHORTCUTS = ["Terminal.lnk", "Windows Terminal.lnk"];
const WSL_COMMAND = "wsl.exe";

/** Owns terminal target descriptors and their cross-platform file/editor launch chain. */
export function createTerminalTargetRuntime(dependencies: TerminalTargetDependencies) {
  const path = dependencies.path.default ?? dependencies.path;
  const logger = dependencies.createLogger("open-in-targets");

  function directoryForTarget(targetPath: string) {
    return dependencies.fs.existsSync(targetPath) && dependencies.fs.statSync(targetPath).isDirectory()
      ? targetPath
      : path.dirname(targetPath);
  }

  function findEditorCommand(resolveCommand = dependencies.findExecutable) {
    const visual = dependencies.env.VISUAL?.trim();
    if (visual) return visual;
    const editor = dependencies.env.EDITOR?.trim();
    if (editor) return editor;
    for (const candidate of EDITOR_CANDIDATES) {
      const command = resolveCommand(candidate);
      if (command) return command;
    }
    return null;
  }

  function parseEditorCommand(command: string) {
    try {
      const args = dependencies.parseShellWords(command);
      const executable = args.at(0)?.trim();
      return executable
        ? {
            args,
            executableName: path.basename(executable).replace(/\.exe$/i, "").toLowerCase(),
          }
        : null;
    } catch {
      return null;
    }
  }

  function editorLocationArgs(executableName: string, location: any) {
    if (location == null) return [];
    switch (executableName) {
      case "nvim":
      case "vim":
        return [`+call cursor(${location.line},${location.column})`];
      case "nano":
        return [`+${location.line},${location.column}`];
      case "less":
        return [`+${location.line}g`];
      default:
        return [];
    }
  }

  function buildEditorShellCommand(editor: string, targetPath: string, location: any) {
    const directory = path.dirname(targetPath);
    const parsed = parseEditorCommand(editor);
    if (parsed == null)
      return `cd ${dependencies.shellEscape(directory)} && ${editor} ${dependencies.shellEscape(targetPath)}`;
    const locationArgs = editorLocationArgs(parsed.executableName, location);
    const separatorIndex = parsed.args.indexOf("--");
    const args = separatorIndex < 0
      ? [...parsed.args, ...locationArgs, targetPath]
      : [
          ...parsed.args.slice(0, separatorIndex),
          ...locationArgs,
          ...parsed.args.slice(separatorIndex),
          targetPath,
        ];
    return `cd ${dependencies.shellEscape(directory)} && ${dependencies.shellJoin(args)}`;
  }

  function linuxTerminalArgs(command: string, targetPath: string) {
    const directory = directoryForTarget(targetPath);
    switch (path.basename(command)) {
      case "kitty":
        return ["--directory", directory];
      case "ghostty":
        return [`--working-directory=${directory}`];
      case "konsole":
        return ["--workdir", directory];
      case "alacritty":
      case "gnome-terminal":
      case "kgx":
      case "mate-terminal":
      case "tilix":
      case "xfce4-terminal":
        return ["--working-directory", directory];
      case "x-terminal-emulator":
      case "zutty": {
        const shell = dependencies.env.SHELL?.trim() || "/bin/sh";
        return [
          "-e",
          shell,
          "-lc",
          `cd ${dependencies.shellEscape(directory)} && exec ${dependencies.shellEscape(shell)}`,
        ];
      }
      default:
        throw Error(`Unsupported Linux terminal command: ${path.basename(command)}`);
    }
  }

  async function launchLinuxTerminal(command: string, targetPath: string, location: any) {
    let args = linuxTerminalArgs(command, targetPath);
    const editor = findEditorCommand();
    if (
      editor != null &&
      dependencies.fs.existsSync(targetPath) &&
      dependencies.fs.statSync(targetPath).isFile()
    ) {
      const shell = dependencies.env.SHELL?.trim() || "/bin/sh";
      const editorCommand = buildEditorShellCommand(editor, targetPath, location);
      switch (path.basename(command)) {
        case "kitty":
          args.push(shell, "-lc", editorCommand);
          break;
        case "alacritty":
        case "ghostty":
        case "kgx":
        case "konsole":
        case "tilix":
          args.push("-e", shell, "-lc", editorCommand);
          break;
        case "mate-terminal":
        case "xfce4-terminal":
          args.push("--execute", shell, "-lc", editorCommand);
          break;
        case "x-terminal-emulator":
        case "zutty":
          args = ["-e", shell, "-lc", editorCommand];
          break;
        case "gnome-terminal":
          args.push("--", shell, "-lc", editorCommand);
          break;
        default:
          throw Error(`Unsupported Linux terminal command: ${path.basename(command)}`);
      }
    }
    await dependencies.spawn(command, args);
  }

  function macTerminalCommand(targetId: string, editorCommand: string) {
    const shell = dependencies.env.SHELL?.trim() || "/bin/zsh";
    const escaped = editorCommand.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    switch (targetId) {
      case "kitty":
        return {
          command: "/usr/bin/open",
          args: ["-na", "kitty.app", "--args", shell, "-lc", editorCommand],
        };
      case "ghostty":
        return {
          command: "/usr/bin/open",
          args: ["-na", "Ghostty.app", "--args", "-e", shell, "-lc", editorCommand],
        };
      case "terminal":
        return {
          command: "/usr/bin/osascript",
          args: ["-e", `tell application "Terminal" to do script "${escaped}"`],
        };
      case "iterm2":
        return {
          command: "/usr/bin/osascript",
          args: [
            "-e",
            [
              'tell application "iTerm"',
              "create window with default profile",
              `tell current session of current window to write text "${escaped}"`,
              "end tell",
            ].join("\n"),
          ],
        };
      default:
        return null;
    }
  }

  async function tryOpenFileInMacTerminal(targetId: string, targetPath: string, location: any) {
    const editor = findEditorCommand();
    if (
      !editor ||
      !dependencies.fs.existsSync(targetPath) ||
      dependencies.fs.statSync(targetPath).isDirectory()
    ) return false;
    const launch = macTerminalCommand(
      targetId,
      buildEditorShellCommand(editor, targetPath, location),
    );
    if (launch == null) return false;
    try {
      await dependencies.spawn(launch.command, launch.args);
      return true;
    } catch (error) {
      logger().warning(
        "Failed to run $EDITOR command for terminal target; falling back to opening directory",
        { safe: { targetId }, sensitive: { error, path: targetPath } },
      );
      return false;
    }
  }

  function findFirstExecutable(commands: string[]) {
    for (const command of commands) {
      const executable = dependencies.findExecutable(command);
      if (executable != null) return executable;
    }
    return null;
  }

  function createTerminalTarget({ id, label, icon, darwin, linux }: any) {
    return {
      id,
      platforms: {
        darwin: {
          label,
          icon,
          kind: "terminal",
          detect: () => dependencies.findExistingMacApplication(darwin.appPaths)
            ? "/usr/bin/open"
            : null,
          args: (targetPath: string) => ["-a", darwin.appName, directoryForTarget(targetPath)],
          open: async ({ command, path: targetPath, location }: any) => {
            if (!(await tryOpenFileInMacTerminal(id, targetPath, location)))
              await dependencies.spawn(command, ["-a", darwin.appName, directoryForTarget(targetPath)]);
          },
        },
        linux: linux == null
          ? undefined
          : {
              label,
              icon,
              kind: "terminal",
              detect: () => findFirstExecutable(linux.commandNames),
              args: (targetPath: string) => linuxTerminalArgs(linux.commandNames[0], targetPath),
              open: ({ command, path: targetPath, location }: any) =>
                launchLinuxTerminal(command, targetPath, location),
            },
      },
    };
  }

  async function detectWindowsTerminal(readShortcut: (path: string) => Promise<any>) {
    if (
      dependencies.findExecutable(WINDOWS_TERMINAL_COMMAND) ||
      dependencies.findWindowsExecutable(WINDOWS_TERMINAL_COMMAND)
    ) return WINDOWS_TERMINAL_COMMAND;
    const shortcut = dependencies.findWindowsShortcut(WINDOWS_TERMINAL_SHORTCUTS);
    return shortcut
      ? dependencies.resolveExecutableLink((await readShortcut(shortcut)).target) ??
        WINDOWS_TERMINAL_COMMAND
      : null;
  }

  function windowsTerminalArgs(targetPath: string) {
    return ["-d", directoryForTarget(targetPath)];
  }

  function windowsLaunchEnvironment() {
    const systemPath = dependencies.getWindowsSystemPath();
    const key = dependencies.env.Path == null ? "PATH" : "Path";
    const entries = (dependencies.env[key] ?? "").split(";").filter(Boolean);
    if (!entries.some((entry) => entry.toLowerCase() === systemPath.toLowerCase()))
      entries.unshift(systemPath);
    return { ...dependencies.env, [key]: entries.join(";") };
  }

  async function launchWindowsTerminal(command: string, args: string[]) {
    await dependencies.spawn(
      "cmd.exe",
      ["/d", "/s", "/c", "start", "", command, ...args],
      { env: windowsLaunchEnvironment() },
    );
  }

  async function detectCmder(readShortcut: (path: string) => Promise<any>) {
    const configuredRoot = dependencies.env.CMDER_ROOT?.trim();
    if (configuredRoot) {
      const configured = path.join(configuredRoot, "Cmder.exe");
      if (dependencies.fs.existsSync(configured)) return configured;
    }
    const command = dependencies.findExecutable("cmder.exe") ??
      dependencies.findExecutable("cmder");
    if (command) return dependencies.resolveExecutableLink(command);
    const shortcut = dependencies.findWindowsShortcut(["Cmder.lnk"]);
    return shortcut ? dependencies.resolveExecutableLink((await readShortcut(shortcut)).target) : null;
  }

  function wslArgs(targetPath: string) {
    const directory = directoryForTarget(targetPath);
    const wslPath = dependencies.toWslPath(directory);
    const args = [...windowsTerminalArgs(targetPath), WSL_COMMAND];
    const distro = dependencies.getWslDistro(directory);
    if (distro != null) args.push("-d", distro);
    if (!wslPath.startsWith("\\\\")) args.push("--cd", wslPath);
    return args;
  }

  function wslIconPath() {
    return dependencies.findWindowsShortcut(["WSL.lnk"]) ??
      dependencies.findWindowsExecutable(WSL_COMMAND);
  }

  async function detectWsl(readShortcut: (path: string) => Promise<any>) {
    return (await dependencies.getWslInfo()) == null ? null : detectWindowsTerminal(readShortcut);
  }

  const terminal: any = createTerminalTarget({
    id: "terminal",
    label: "Terminal",
    icon: "apps/terminal.png",
    darwin: {
      appPaths: ["/System/Applications/Utilities/Terminal.app"],
      appName: "Terminal",
    },
    linux: {
      commandNames: [
        "kgx",
        "gnome-terminal",
        "konsole",
        "xfce4-terminal",
        "mate-terminal",
        "tilix",
        "alacritty",
        "x-terminal-emulator",
      ],
    },
  });
  terminal.platforms.win32 = {
    label: "Terminal",
    icon: "apps/microsoft-terminal.png",
    kind: "terminal",
    detect: detectWindowsTerminal,
    iconPath: () => null,
    args: windowsTerminalArgs,
    open: ({ command, path: targetPath }: any) =>
      launchWindowsTerminal(command, windowsTerminalArgs(targetPath)),
  };

  const cmder = {
    id: "cmder",
    platforms: {
      win32: {
        label: "Cmder",
        icon: "apps/cmder.png",
        kind: "terminal",
        detect: detectCmder,
        args: (targetPath: string) => ["/START", directoryForTarget(targetPath)],
      },
    },
  };
  const ghostty = createTerminalTarget({
    id: "ghostty",
    label: "Ghostty",
    icon: "apps/ghostty.png",
    darwin: { appPaths: ["/Applications/Ghostty.app"], appName: "Ghostty" },
    linux: { commandNames: ["ghostty"] },
  });
  const iterm2 = createTerminalTarget({
    id: "iterm2",
    label: "iTerm2",
    icon: "apps/iterm2.png",
    darwin: {
      appPaths: ["/Applications/iTerm.app", "/Applications/iTerm2.app"],
      appName: "iTerm",
    },
  });
  const kitty = createTerminalTarget({
    id: "kitty",
    label: "Kitty",
    icon: "apps/kitty.png",
    darwin: { appPaths: ["/Applications/kitty.app"], appName: "kitty" },
    linux: { commandNames: ["kitty"] },
  });
  const warp = createTerminalTarget({
    id: "warp",
    label: "Warp",
    icon: "apps/warp.png",
    darwin: { appPaths: ["/Applications/Warp.app"], appName: "Warp" },
  });
  const wsl = {
    id: "wsl",
    platforms: {
      win32: {
        label: "WSL",
        icon: "apps/terminal.png",
        kind: "terminal",
        detect: detectWsl,
        iconPath: wslIconPath,
        args: wslArgs,
        open: ({ command, path: targetPath }: any) =>
          launchWindowsTerminal(command, wslArgs(targetPath)),
      },
    },
  };

  return {
    buildEditorShellCommand,
    cmder,
    detectCmder,
    detectWindowsTerminal,
    detectWsl,
    directoryForTarget,
    editorLocationArgs,
    findEditorCommand,
    ghostty,
    iterm2,
    kitty,
    launchLinuxTerminal,
    launchWindowsTerminal,
    linuxTerminalArgs,
    macTerminalCommand,
    parseEditorCommand,
    terminal,
    tryOpenFileInMacTerminal,
    warp,
    windowsLaunchEnvironment,
    windowsTerminalArgs,
    wsl,
    wslArgs,
    wslIconPath,
  };
}
