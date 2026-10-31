type OpenTargetFoundationDependencies = {
  schema: any;
  path: any;
  fs: any;
  os: any;
  url: any;
  platform: NodeJS.Platform;
  sshMetadataKey: string;
  customFileHandlersSetting: { schema: { safeParse(value: unknown): any } };
  createLogger(tag: string): () => any;
  spawn(command: string, args: string[], options?: any): Promise<unknown>;
  findExecutable(command: string): string | null;
  findLinuxDesktopEntry(entries: string[]): string | null;
  isHostConfig(value: unknown): boolean;
  isLocalHost(value: unknown): boolean;
  isRemoteHost(value: unknown): boolean;
  remoteHost: any;
  targetFilter: any;
  targetInput: any;
  targetSelection: any;
  targetLaunchArgs: any;
  targetDescriptors: any;
};

const NATIVE_APPLICATIONS_BY_EXTENSION = new Map<string, string[]>([
  ["pdf", ["com.apple.Preview"]],
  ["png", ["com.apple.Preview"]],
  ["jpg", ["com.apple.Preview"]],
  ["jpeg", ["com.apple.Preview"]],
  ["gif", ["com.apple.Preview"]],
  ["bmp", ["com.apple.Preview"]],
  ["tiff", ["com.apple.Preview"]],
  ["ico", ["com.apple.Preview"]],
  ["webp", ["com.apple.Preview"]],
  ["mov", ["com.apple.QuickTimePlayerX"]],
  ["mp4", ["com.apple.QuickTimePlayerX"]],
  ["m4v", ["com.apple.QuickTimePlayerX"]],
  ["avi", ["com.apple.QuickTimePlayerX"]],
  ["mkv", ["com.apple.QuickTimePlayerX"]],
  ["webm", ["com.apple.QuickTimePlayerX"]],
  ["mpg", ["com.apple.QuickTimePlayerX"]],
  ["mpeg", ["com.apple.QuickTimePlayerX"]],
  ["mp3", ["com.apple.QuickTimePlayerX"]],
  ["wav", ["com.apple.QuickTimePlayerX"]],
  ["m4a", ["com.apple.QuickTimePlayerX"]],
  ["aac", ["com.apple.QuickTimePlayerX"]],
  ["aiff", ["com.apple.QuickTimePlayerX"]],
  ["aif", ["com.apple.QuickTimePlayerX"]],
  ["flac", ["com.apple.QuickTimePlayerX"]],
  ["caf", ["com.apple.QuickTimePlayerX"]],
  ["zip", ["com.apple.archiveutility"]],
  ["tar", ["com.apple.archiveutility"]],
  ["gz", ["com.apple.archiveutility"]],
  ["tgz", ["com.apple.archiveutility"]],
  ["bz2", ["com.apple.archiveutility"]],
  ["tbz", ["com.apple.archiveutility"]],
  ["xz", ["com.apple.archiveutility"]],
  ["txz", ["com.apple.archiveutility"]],
  ["7z", ["com.apple.archiveutility"]],
  ["rar", ["com.apple.archiveutility"]],
  ["sketch", ["com.bohemiancoding.sketch3"]],
  ["fig", ["com.figma.Desktop"]],
  ["psd", ["com.adobe.Photoshop"]],
  ["ai", ["com.adobe.illustrator"]],
  ["indd", ["com.adobe.InDesign"]],
  ["xd", ["com.adobe.xd"]],
  ["doc", ["com.microsoft.Word", "com.apple.iWork.Pages"]],
  ["docx", ["com.microsoft.Word", "com.apple.iWork.Pages"]],
  ["xls", ["com.microsoft.Excel", "com.apple.iWork.Numbers"]],
  ["xlsm", ["com.microsoft.Excel", "com.apple.iWork.Numbers"]],
  ["xlsx", ["com.microsoft.Excel", "com.apple.iWork.Numbers"]],
  ["csv", ["com.microsoft.Excel", "com.apple.iWork.Numbers"]],
  ["ppt", ["com.microsoft.Powerpoint", "com.apple.iWork.Keynote"]],
  ["pptx", ["com.microsoft.Powerpoint", "com.apple.iWork.Keynote"]],
  ["key", ["com.apple.iWork.Keynote"]],
  ["pages", ["com.apple.iWork.Pages"]],
  ["numbers", ["com.apple.iWork.Numbers"]],
]);
const NATIVE_DOCUMENT_EXTENSIONS = new Set([...NATIVE_APPLICATIONS_BY_EXTENSION.keys(), "html"]);
const PACKAGED_APP_PREFIX = "apps/";
const APP_FILE_ORIGIN = "app://fs";
const APP_FILE_PATH_PREFIX = "/@fs";
const DEFAULT_TARGET_ICON = "apps/vscode.png";
const SYSTEM_APPLICATIONS = "/Applications";

/** Shared policy and construction owner for main-process open-target descriptors. */
export function createOpenTargetFoundation(dependencies: OpenTargetFoundationDependencies) {
  const path = dependencies.path.default ?? dependencies.path;
  const customTargetIdSchema = dependencies.schema.Of().regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/);
  const sshMetadataSchema = dependencies.schema.wf({
    sshAlias: dependencies.schema.Of().nullable(),
    sshHost: dependencies.schema.Of(),
    sshPort: dependencies.schema.Cf().nullable(),
    identity: dependencies.schema.Of().nullable(),
  });
  const logger = dependencies.createLogger("open-in-targets");
  const userApplications = path.join(dependencies.os.homedir(), "Applications");
  const applicationRoots = [SYSTEM_APPLICATIONS, userApplications];

  function preferredBundleIdsForPath(filePath: string) {
    return NATIVE_APPLICATIONS_BY_EXTENSION.get(path.extname(filePath).slice(1).toLowerCase()) ?? [];
  }

  function isKnownNativeDocument(filePath: string) {
    if (!dependencies.fs.existsSync(filePath) || !dependencies.fs.statSync(filePath).isFile())
      return false;
    const extension = path.extname(filePath).toLowerCase();
    return extension ? NATIVE_DOCUMENT_EXTENSIONS.has(extension.slice(1)) : false;
  }

  function isDarwinNativeDocument(filePath: string, platform = dependencies.platform) {
    return platform === "darwin" && isKnownNativeDocument(filePath);
  }

  function isPlatformDefaultViewerDocument(filePath: string, platform = dependencies.platform) {
    return platform !== "darwin" && isKnownNativeDocument(filePath);
  }

  function isNativeDocument(filePath: string, platform = dependencies.platform) {
    return isDarwinNativeDocument(filePath, platform) ||
      isPlatformDefaultViewerDocument(filePath, platform);
  }

  function resolveRequestedTarget(options: any) {
    return dependencies.targetSelection.resolveRequestedTarget(options);
  }

  function resolveTargetFallback(options: any) {
    return dependencies.targetSelection.resolveTargetFallback(options);
  }

  function readSshMetadata(hostConfig: any) {
    const parsed = sshMetadataSchema.safeParse(hostConfig[dependencies.sshMetadataKey]);
    return parsed.success ? parsed.data : null;
  }

  function remoteAuthorityName(hostConfig: any) {
    if (hostConfig.kind === "ssh") {
      const alias = dependencies.remoteHost.readSshAlias(readSshMetadata(hostConfig));
      if (alias) return alias;
      const commandHost = dependencies.remoteHost.readTerminalCommandLastArg(
        Array.isArray(hostConfig.terminal_command) ? hostConfig.terminal_command : [],
      );
      if (commandHost) return commandHost;
    }
    return hostConfig.name?.trim() || dependencies.remoteHost.fallbackTargetIdentifier(hostConfig);
  }

  function remoteHostLabel(hostConfig: any) {
    const metadata = readSshMetadata(hostConfig);
    const alias = dependencies.remoteHost.readSshAlias(metadata);
    if (alias) return alias;
    if (metadata != null) {
      if (metadata.identity?.trim()) return null;
      const host = metadata.sshHost.trim();
      if (host.length > 0)
        return dependencies.remoteHost.formatHostWithPort(host, metadata.sshPort);
    }
    const terminalCommand = Array.isArray(hostConfig.terminal_command)
      ? hostConfig.terminal_command
      : [];
    if (dependencies.remoteHost.terminalCommandHasIdentity(terminalCommand)) return null;
    const host = dependencies.remoteHost.readTerminalCommandLastArg(terminalCommand);
    return host
      ? dependencies.remoteHost.formatHostWithPort(
          host,
          dependencies.remoteHost.readTerminalCommandPort(terminalCommand),
        )
      : hostConfig.name?.trim() || dependencies.remoteHost.fallbackTargetIdentifier(hostConfig);
  }

  const filterDependencies = {
    isHostConfig: dependencies.isHostConfig,
    isLocalHost: dependencies.isLocalHost,
    isRemoteHost: dependencies.isRemoteHost,
    remoteHostLabel,
    platform: dependencies.platform,
  };
  function filterTargetIds(hostConfig: any, targetIds: string[], targets: any[]) {
    return dependencies.targetFilter.filterTargetIdsForHost(
      hostConfig,
      targetIds,
      targets,
      filterDependencies,
    );
  }
  function filterTargets(targets: any[], hostConfig: any) {
    return dependencies.targetFilter.filterTargetsForHost(
      hostConfig,
      targets,
      filterDependencies,
    );
  }
  function isTargetSupported(hostConfig: any, target: any) {
    return dependencies.targetFilter.isTargetSupported(target, hostConfig, filterDependencies);
  }

  function normalizeTargetIcon(icon: string) {
    return dependencies.targetInput.normalizeAppsPath(icon);
  }

  function isAbsoluteTargetPath(value: string, platform: NodeJS.Platform) {
    return dependencies.targetInput.isAbsoluteTargetPath(value, platform, path);
  }

  function localIconPath(icon: string, platform: NodeJS.Platform, requireExisting = true) {
    if (icon.startsWith("file:")) {
      try {
        return dependencies.url.fileURLToPath(icon);
      } catch {
        return null;
      }
    }
    return isAbsoluteTargetPath(icon, platform) &&
      (platform === "win32" || !requireExisting || dependencies.fs.existsSync(icon))
      ? icon
      : null;
  }

  function encodeAppFileUrl(filePath: string) {
    const normalized = dependencies.schema.wl(dependencies.schema.Tl(filePath));
    return `${APP_FILE_ORIGIN}${APP_FILE_PATH_PREFIX}${encodeURI(normalized)
      .replaceAll("#", "%23")
      .replaceAll("?", "%3F")}`;
  }

  function resolveTargetIcon(icon: string, platform: NodeJS.Platform, requireExisting = true) {
    if (dependencies.targetInput.isPackagedAppPath(icon)) return normalizeTargetIcon(icon);
    if (dependencies.targetInput.isDataImage(icon)) return icon;
    const filePath = localIconPath(icon, platform, requireExisting);
    return filePath == null ? normalizeTargetIcon(DEFAULT_TARGET_ICON) : encodeAppFileUrl(filePath);
  }

  function resolveConfiguredCommand(command: string, platform: NodeJS.Platform) {
    return isAbsoluteTargetPath(command, platform)
      ? (dependencies.fs.existsSync(command) ? command : null)
      : dependencies.findExecutable(command);
  }

  function createCustomTarget(id: string, config: any, platform: NodeJS.Platform) {
    const targetId = `custom:${id}`;
    return {
      id: targetId,
      configuredCommand: config.command,
      configuredIcon: config.icon,
      label: config.label,
      icon: resolveTargetIcon(config.icon, platform, false),
      kind: "editor",
      supportsSsh: config.supports_ssh,
      detect: () => resolveConfiguredCommand(config.command, platform),
      iconPath: () => null,
      args: () => config.args,
      open: async ({
        command,
        path: targetPath,
        appPath,
        location,
        hostConfig,
        remoteWorkspaceRoot,
        remotePath,
      }: any) => {
        switch (config.input) {
          case "path":
            await dependencies.spawn(command, [...config.args, targetPath]);
            return;
          case "json_argument":
            await dependencies.spawn(command, [
              ...config.args,
              JSON.stringify({
                target: targetId,
                path: targetPath,
                appPath: appPath ?? null,
                location: location ?? null,
              }),
            ]);
            return;
          case "json_stdin":
            await dependencies.spawn(command, config.args, {
              stdin: JSON.stringify({
                target: targetId,
                path: targetPath,
                appPath: appPath ?? null,
                location: location ?? null,
                hostConfig: hostConfig ?? null,
                remoteWorkspaceRoot: remoteWorkspaceRoot ?? null,
                remotePath: remotePath ?? null,
              }),
            });
            return;
        }
      },
    };
  }

  function parseCustomTargets(value: unknown, platform: NodeJS.Platform) {
    const parsed = dependencies.customFileHandlersSetting.schema.safeParse(value);
    if (!parsed.success) {
      if (value != null)
        logger().warning("Dropping invalid custom file handlers config", {
          safe: {},
          sensitive: { error: parsed.error },
        });
      return [];
    }
    return Object.entries(parsed.data).flatMap(([id, config]) => {
      const parsedId = customTargetIdSchema.safeParse(id);
      if (parsedId.success) return [createCustomTarget(parsedId.data, config, platform)];
      logger().warning("Dropping invalid custom file handler", {
        safe: { id },
        sensitive: { error: parsedId.error },
      });
      return [];
    });
  }

  function macApplicationCandidates(applicationPath: string) {
    return applicationPath.startsWith(`${SYSTEM_APPLICATIONS}/`)
      ? [
          applicationPath,
          path.join(userApplications, applicationPath.slice(`${SYSTEM_APPLICATIONS}/`.length)),
        ]
      : [applicationPath];
  }

  function findExistingMacApplication(paths: string[]) {
    if (dependencies.platform !== "darwin") return null;
    for (const candidate of paths)
      for (const resolved of macApplicationCandidates(candidate))
        if (dependencies.fs.existsSync(resolved)) return resolved;
    return null;
  }

  function findMacApplicationExecutable(prefix: string, executable: string) {
    if (dependencies.platform !== "darwin") return null;
    const normalizedPrefix = prefix.toLowerCase();
    for (const root of applicationRoots) {
      let entries;
      try {
        entries = dependencies.fs.readdirSync(root);
      } catch {
        continue;
      }
      for (const entry of entries) {
        const normalizedEntry = entry.toLowerCase();
        if (!normalizedEntry.startsWith(normalizedPrefix) || !normalizedEntry.endsWith(".app"))
          continue;
        const candidate = path.join(root, entry, "Contents", "MacOS", executable);
        if (dependencies.fs.existsSync(candidate)) return candidate;
      }
    }
    return null;
  }

  function findMacApplicationBundle(prefix: string) {
    if (dependencies.platform !== "darwin") return null;
    const normalizedPrefix = prefix.toLowerCase();
    for (const root of applicationRoots) {
      let entries;
      try {
        entries = dependencies.fs.readdirSync(root);
      } catch {
        continue;
      }
      for (const entry of entries) {
        const normalizedEntry = entry.toLowerCase();
        if (!normalizedEntry.startsWith(normalizedPrefix) || !normalizedEntry.endsWith(".app"))
          continue;
        const candidate = path.join(root, entry);
        if (dependencies.fs.existsSync(candidate)) return candidate;
      }
    }
    return null;
  }

  function buildVscodeRemoteArgs({ hostConfig, remoteWorkspaceRoot, remotePath, location }: any) {
    if (hostConfig.kind === "remote-control")
      throw Error("Remote control does not support VS Code remote open yet.");
    const remoteAuthority = `ssh-remote+${remoteAuthorityName(hostConfig)}`;
    const workspace = remoteWorkspaceRoot?.trim() || undefined;
    const filePath = remotePath?.trim() || undefined;
    if (filePath != null && location != null)
      return dependencies.targetLaunchArgs.buildVscodeRemoteArgs({
        remoteAuthority,
        remoteWorkspaceRoot: workspace,
        path: filePath,
        location,
      });
    const args: string[] = [];
    if (workspace != null)
      args.push(
        "--folder-uri",
        dependencies.targetLaunchArgs.buildVscodeRemoteUri(remoteAuthority, workspace),
      );
    if (filePath != null)
      args.push(
        "--file-uri",
        dependencies.targetLaunchArgs.buildVscodeRemoteUri(remoteAuthority, filePath),
      );
    return args;
  }

  function buildEditorArgs(
    targetPath: string,
    location: any,
    hostConfig: any,
    remoteWorkspaceRoot: string | null,
    remotePath: string | null,
  ) {
    return hostConfig != null &&
      dependencies.isHostConfig(hostConfig) &&
      (remoteWorkspaceRoot != null || remotePath != null)
      ? buildVscodeRemoteArgs({ hostConfig, location, remotePath, remoteWorkspaceRoot })
      : dependencies.targetLaunchArgs.buildEditorGotoArgs(
          targetPath,
          location,
          dependencies.platform,
        );
  }

  function mergeTargetPlatformDescriptor(options: any) {
    return dependencies.targetDescriptors.mergeTargetPlatformDescriptor(options);
  }

  function createTargetDescriptor(options: any) {
    return dependencies.targetDescriptors.createTargetDescriptor(options);
  }

  async function launchLinuxEditor(request: any, argsBuilder = buildEditorArgs) {
    if (path.extname(request.command) === ".desktop") {
      const gio = dependencies.findExecutable("gio");
      if (gio == null) throw Error("Linux desktop application launcher is unavailable");
      await dependencies.spawn(gio, ["launch", request.command, request.path]);
      return;
    }
    await dependencies.spawn(
      request.command,
      argsBuilder(
        request.path,
        request.location,
        request.hostConfig,
        request.remoteWorkspaceRoot,
        request.remotePath,
      ),
    );
  }

  function createEditorTargetDescriptor(options: any) {
    return dependencies.targetDescriptors.createEditorTargetDescriptor({
      ...options,
      defaultArgs: buildEditorArgs,
      linuxOpen: (request: any) => launchLinuxEditor(request, buildEditorArgs),
    });
  }

  function findCommandOrDesktopEntry(commands: string[], desktopEntries: string[]) {
    for (const command of commands) {
      const executable = dependencies.findExecutable(command);
      if (executable != null) return executable;
    }
    return dependencies.findLinuxDesktopEntry(desktopEntries);
  }

  return {
    bracketIpv6Host: dependencies.remoteHost.bracketIpv6Host,
    buildEditorArgs,
    buildVscodeRemoteArgs,
    createCustomTarget,
    createEditorTargetDescriptor,
    createTargetDescriptor,
    filterTargetIds,
    filterTargets,
    findCommandOrDesktopEntry,
    findExistingMacApplication,
    findMacApplicationBundle,
    findMacApplicationExecutable,
    isDarwinNativeDocument,
    isNativeDocument,
    isPlatformDefaultViewerDocument,
    isTargetSupported,
    launchLinuxEditor,
    macApplicationCandidates,
    mergeTargetPlatformDescriptor,
    normalizeTargetIcon,
    parseCustomTargets,
    preferredBundleIdsForPath,
    remoteAuthorityName,
    remoteHostLabel,
    resolveRequestedTarget,
    resolveTargetFallback,
    resolveTargetIcon,
  };
}
