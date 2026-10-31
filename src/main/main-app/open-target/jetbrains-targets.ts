type JetBrainsTargetDependencies = {
  platform: NodeJS.Platform;
  path: any;
  fs: any;
  os: any;
  env: NodeJS.ProcessEnv;
  createLogger(tag: string): () => any;
  findExecutable(command: string): string | null;
  resolveExecutableLink(path: string): string | null;
  findWindowsInstall(paths: string[][]): string | null;
  findLinuxDesktopEntry(entries: string[]): string | null;
  findExistingMacApplication(paths: string[]): string | null;
  findMacApplicationExecutable(prefix: string, executable: string): string | null;
  launchLinuxEditor(request: any, argsBuilder: (path: string, location: any) => string[]): Promise<void>;
};

const TOOLBOX_APPLICATIONS = [
  { target: "androidStudio", bundlePrefixes: ["android studio"], executable: "studio" },
  { target: "intellij", bundlePrefixes: ["intellij idea"], executable: "idea" },
  { target: "rider", bundlePrefixes: ["rider"], executable: "rider" },
  { target: "goland", bundlePrefixes: ["goland"], executable: "goland" },
  { target: "rustrover", bundlePrefixes: ["rustrover"], executable: "rustrover" },
  { target: "pycharm", bundlePrefixes: ["pycharm"], executable: "pycharm" },
  { target: "webstorm", bundlePrefixes: ["webstorm"], executable: "webstorm" },
  { target: "phpstorm", bundlePrefixes: ["phpstorm"], executable: "phpstorm" },
];

const LINUX_DESKTOP_ENTRIES: Record<string, string[]> = {
  androidStudio: [
    "jetbrains-studio.desktop",
    "android-studio.desktop",
    "com.google.AndroidStudio.desktop",
    "android-studio_android-studio.desktop",
  ],
  intellij: [
    "jetbrains-idea.desktop",
    "jetbrains-idea-ce.desktop",
    "com.jetbrains.IntelliJ-IDEA-Ultimate.desktop",
    "com.jetbrains.IntelliJ-IDEA-Community.desktop",
    "intellij-idea_intellij-idea.desktop",
    "intellij-idea-ultimate_intellij-idea-ultimate.desktop",
    "intellij-idea-community_intellij-idea-community.desktop",
  ],
  rider: ["jetbrains-rider.desktop", "com.jetbrains.Rider.desktop", "rider_rider.desktop"],
  goland: ["jetbrains-goland.desktop", "com.jetbrains.GoLand.desktop", "goland_goland.desktop"],
  rustrover: [
    "jetbrains-rustrover.desktop",
    "com.jetbrains.RustRover.desktop",
    "rustrover_rustrover.desktop",
  ],
  pycharm: [
    "jetbrains-pycharm.desktop",
    "jetbrains-pycharm-ce.desktop",
    "com.jetbrains.PyCharm-Professional.desktop",
    "com.jetbrains.PyCharm-Community.desktop",
    "pycharm_pycharm.desktop",
    "pycharm-professional_pycharm-professional.desktop",
    "pycharm-community_pycharm-community.desktop",
  ],
  webstorm: [
    "jetbrains-webstorm.desktop",
    "com.jetbrains.WebStorm.desktop",
    "webstorm_webstorm.desktop",
  ],
  phpstorm: [
    "jetbrains-phpstorm.desktop",
    "com.jetbrains.PhpStorm.desktop",
    "phpstorm_phpstorm.desktop",
  ],
};

const TARGETS = [
  {
    id: "androidStudio",
    label: "Android Studio",
    icon: "apps/android-studio.png",
    toolboxTarget: "androidStudio",
    macExecutable: "studio",
    windowsPathCommands: ["studio64.exe", "studio.exe", "studio"],
    windowsInstallDirPrefixes: ["android studio"],
    windowsInstallExecutables: ["studio64.exe", "studio.exe"],
    windowsFallbackPaths: [
      ["Android", "Android Studio", "bin", "studio64.exe"],
      ["Android", "Android Studio", "bin", "studio.exe"],
    ],
  },
  {
    id: "intellij",
    label: "IntelliJ IDEA",
    icon: "apps/intellij.png",
    toolboxTarget: "intellij",
    macExecutable: "idea",
    windowsPathCommands: ["idea64.exe", "idea.exe", "idea"],
    windowsInstallDirPrefixes: ["intellij idea", "idea"],
    windowsInstallExecutables: ["idea64.exe", "idea.exe"],
  },
  {
    id: "rider",
    label: "Rider",
    icon: "apps/rider.png",
    toolboxTarget: "rider",
    macExecutable: "rider",
    windowsPathCommands: ["rider64.exe", "rider.exe", "rider"],
    windowsInstallDirPrefixes: ["rider"],
    windowsInstallExecutables: ["rider64.exe", "rider.exe"],
  },
  { id: "goland", label: "GoLand", icon: "apps/goland.png", toolboxTarget: "goland", macExecutable: "goland" },
  { id: "rustrover", label: "RustRover", icon: "apps/rustrover.png", toolboxTarget: "rustrover", macExecutable: "rustrover" },
  {
    id: "pycharm",
    label: "PyCharm",
    icon: "apps/pycharm.png",
    toolboxTarget: "pycharm",
    macExecutable: "pycharm",
    windowsPathCommands: ["pycharm64.exe", "pycharm.exe", "pycharm"],
    windowsInstallDirPrefixes: ["pycharm"],
    windowsInstallExecutables: ["pycharm64.exe", "pycharm.exe"],
  },
  {
    id: "webstorm",
    label: "WebStorm",
    icon: "apps/webstorm.svg",
    toolboxTarget: "webstorm",
    macExecutable: "webstorm",
    windowsPathCommands: ["webstorm64.exe", "webstorm.exe", "webstorm"],
    windowsInstallDirPrefixes: ["webstorm"],
    windowsInstallExecutables: ["webstorm64.exe", "webstorm.exe"],
  },
  {
    id: "phpstorm",
    label: "PhpStorm",
    icon: "apps/phpstorm.png",
    toolboxTarget: "phpstorm",
    macExecutable: "phpstorm",
    windowsPathCommands: ["phpstorm64.exe", "phpstorm.exe", "phpstorm"],
    windowsInstallDirPrefixes: ["phpstorm"],
    windowsInstallExecutables: ["phpstorm64.exe", "phpstorm.exe"],
  },
];

/** Owns all JetBrains target descriptors and the shared Toolbox discovery cache. */
export function createJetBrainsTargetRuntime(dependencies: JetBrainsTargetDependencies) {
  const path = dependencies.path.default ?? dependencies.path;
  const logger = dependencies.createLogger("open-in-targets");
  const toolboxApplicationsRoot = path.join(
    dependencies.os.homedir(),
    "Library",
    "Application Support",
    "JetBrains",
    "Toolbox",
    "apps",
  );
  const windowsInstallRoots = [
    dependencies.env.ProgramFiles,
    dependencies.env["ProgramFiles(x86)"],
  ].flatMap((root) => root ? [path.join(root, "JetBrains")] : []);
  let toolboxExecutables: Map<string, string> | null = null;

  function descending(values: Iterable<string>) {
    return [...values].sort((left, right) => right.localeCompare(left));
  }

  function scanToolboxApplications(root: string) {
    const discovered = new Map<string, string>();
    if (dependencies.platform !== "darwin") return discovered;
    let products;
    try {
      products = dependencies.fs.readdirSync(root);
    } catch {
      return discovered;
    }
    for (const product of descending(products)) {
      const productPath = path.join(root, product);
      let channels;
      try {
        channels = dependencies.fs.readdirSync(productPath);
      } catch {
        continue;
      }
      for (const channel of descending(channels)) {
        const channelPath = path.join(productPath, channel);
        let versions;
        try {
          versions = dependencies.fs.readdirSync(channelPath);
        } catch {
          continue;
        }
        for (const version of descending(versions)) {
          const versionPath = path.join(channelPath, version);
          let applications;
          try {
            applications = dependencies.fs.readdirSync(versionPath);
          } catch {
            continue;
          }
          for (const application of descending(applications)) {
            const normalized = application.toLowerCase();
            if (!normalized.endsWith(".app")) continue;
            for (const spec of TOOLBOX_APPLICATIONS) {
              if (
                discovered.has(spec.target) ||
                !spec.bundlePrefixes.some((prefix) => normalized.startsWith(prefix))
              ) continue;
              const executable = path.join(
                versionPath,
                application,
                "Contents",
                "MacOS",
                spec.executable,
              );
              if (dependencies.fs.existsSync(executable)) discovered.set(spec.target, executable);
            }
          }
        }
      }
    }
    return discovered;
  }

  function getToolboxExecutables() {
    if (toolboxExecutables != null) return toolboxExecutables;
    try {
      toolboxExecutables = scanToolboxApplications(toolboxApplicationsRoot);
    } catch (error) {
      logger().debug("Failed to discover JetBrains Toolbox installations", {
        safe: {},
        sensitive: { error },
      });
      toolboxExecutables = new Map();
    }
    return toolboxExecutables;
  }

  function detectMacTarget(
    toolboxTarget: string,
    applicationPaths: string[],
    bundlePrefix: string,
    executable: string,
  ) {
    return dependencies.findExistingMacApplication(applicationPaths) ??
      dependencies.findMacApplicationExecutable(bundlePrefix, executable) ??
      getToolboxExecutables().get(toolboxTarget) ??
      null;
  }

  function findWindowsInstallation({ installDirPrefixes, installExecutables }: any) {
    const normalizedPrefixes = installDirPrefixes.map((prefix: string) => prefix.toLowerCase());
    for (const root of windowsInstallRoots) {
      let entries;
      try {
        entries = descending(dependencies.fs.readdirSync(root));
      } catch {
        continue;
      }
      for (const entry of entries) {
        const normalizedEntry = entry.toLowerCase();
        if (!normalizedPrefixes.some((prefix: string) => normalizedEntry.startsWith(prefix)))
          continue;
        for (const executable of installExecutables) {
          const candidate = path.join(root, entry, "bin", executable);
          if (dependencies.fs.existsSync(candidate)) return candidate;
        }
      }
    }
    return null;
  }

  function detectWindowsTarget({
    pathCommands,
    installDirPrefixes,
    installExecutables,
    fallbackPaths,
  }: any) {
    for (const command of pathCommands) {
      const executable = dependencies.findExecutable(command);
      if (!executable) continue;
      const resolved = dependencies.resolveExecutableLink(executable);
      if (resolved) return resolved;
    }
    return findWindowsInstallation({ installDirPrefixes, installExecutables }) ||
      (fallbackPaths ? dependencies.findWindowsInstall(fallbackPaths) : null);
  }

  function detectLinuxTarget(target: string, executable: string) {
    const commands = target === "intellij"
      ? [executable, `${executable}.sh`, "intellij-idea"]
      : [executable, `${executable}.sh`];
    for (const command of commands) {
      const found = dependencies.findExecutable(command);
      if (found != null) return found;
    }
    const toolboxScript = path.join(
      dependencies.os.homedir(),
      ".local",
      "share",
      "JetBrains",
      "Toolbox",
      "scripts",
      executable,
    );
    return dependencies.fs.existsSync(toolboxScript)
      ? toolboxScript
      : dependencies.findLinuxDesktopEntry(LINUX_DESKTOP_ENTRIES[target]);
  }

  function buildJetBrainsArgs(targetPath: string, location: any) {
    return location
      ? [
          "--line",
          location.line.toString(),
          "--column",
          location.column.toString(),
          targetPath,
        ]
      : [targetPath];
  }

  function createTarget(options: any) {
    return {
      id: options.id,
      platforms: {
        darwin: {
          label: options.label,
          icon: options.icon,
          kind: "editor",
          detect: () => detectMacTarget(
            options.toolboxTarget,
            [`/Applications/${options.label}.app/Contents/MacOS/${options.macExecutable}`],
            options.label,
            options.macExecutable,
          ),
          args: buildJetBrainsArgs,
        },
        win32:
          options.windowsPathCommands &&
          options.windowsInstallDirPrefixes &&
          options.windowsInstallExecutables
            ? {
                label: options.label,
                icon: options.icon,
                kind: "editor",
                detect: () => detectWindowsTarget({
                  pathCommands: options.windowsPathCommands,
                  installDirPrefixes: options.windowsInstallDirPrefixes,
                  installExecutables: options.windowsInstallExecutables,
                  fallbackPaths: options.windowsFallbackPaths,
                }),
                args: buildJetBrainsArgs,
              }
            : undefined,
        linux: {
          label: options.label,
          icon: options.icon,
          kind: "editor",
          detect: () => detectLinuxTarget(options.toolboxTarget, options.macExecutable),
          args: buildJetBrainsArgs,
          open: (request: any) => dependencies.launchLinuxEditor(request, buildJetBrainsArgs),
        },
      },
    };
  }

  const targets = Object.fromEntries(TARGETS.map((target) => [target.id, createTarget(target)]));
  return {
    androidStudio: targets.androidStudio,
    buildJetBrainsArgs,
    createTarget,
    detectLinuxTarget,
    detectMacTarget,
    detectWindowsTarget,
    findWindowsInstallation,
    getToolboxExecutables,
    goland: targets.goland,
    intellij: targets.intellij,
    phpstorm: targets.phpstorm,
    pycharm: targets.pycharm,
    rider: targets.rider,
    rustrover: targets.rustrover,
    scanToolboxApplications,
    webstorm: targets.webstorm,
  };
}
