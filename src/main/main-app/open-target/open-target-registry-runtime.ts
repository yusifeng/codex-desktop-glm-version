type OpenTargetRegistryDependencies = {
  targetDescriptors: any[];
  platform: NodeJS.Platform;
  path: any;
  fs: any;
  electron: any;
  spawn(command: string, args: string[], options?: any): Promise<unknown>;
  findExistingMacApplication(paths: string[]): string | null;
  preferredBundleIdsForPath(path: string): string[];
  getApplicationIcon(path: string): Promise<string | null>;
  includeCodexTargets(path: string): boolean;
  listLinuxApplicationsForFile(path: string): Promise<any[]>;
  listApplicationsForFile(options: any): Promise<any[]>;
  discoverLinuxBrowsers(): Promise<any>;
  scanNativeBrowsers(): Promise<any>;
  discoverKnownBrowsers(options: any): Promise<any[]>;
  codexBundleIds: string[];
  uniqueBy(values: any[], key: (value: any) => string): any[];
};

const NATIVE_TARGET_LIMIT = 5;
const BROWSER_TARGET_LIMIT = 5;
const OFFICE_APPLICATIONS = new Map([
  [
    ".pptx",
    {
      appPath: "/Applications/Microsoft PowerPoint.app",
      bundleId: "com.microsoft.Powerpoint",
      displayName: "Microsoft PowerPoint",
    },
  ],
  [
    ".xlsx",
    {
      appPath: "/Applications/Microsoft Excel.app",
      bundleId: "com.microsoft.Excel",
      displayName: "Microsoft Excel",
    },
  ],
]);

/** Owns platform target projection, launch dispatch, and native application discovery. */
export function createOpenTargetRegistryRuntime(dependencies: OpenTargetRegistryDependencies) {
  const path = dependencies.path.default ?? dependencies.path;
  const excludedBundleIds = new Set(dependencies.codexBundleIds);

  function targetsForPlatform(platform = dependencies.platform) {
    return dependencies.targetDescriptors.flatMap((descriptor) => {
      const target = descriptor.platforms[platform];
      return target ? [{ id: descriptor.id, ...target }] : [];
    });
  }

  const defaultTargets = targetsForPlatform();

  function isEditorTarget(targetId: string, targets = defaultTargets) {
    return targets.some((target) => target.id === targetId && target.kind === "editor");
  }

  async function openWithTarget(
    targetId: string,
    targetPath: string,
    {
      appPath,
      detectedCommand,
      hostConfig,
      location,
      remotePath,
      remoteWorkspaceRoot,
      targets = defaultTargets,
    }: any = {},
  ) {
    if (remotePath != null && hostConfig?.kind === "remote-control")
      throw Error(`Remote control does not support open in ${targetId} yet.`);
    const target = targets.find((candidate) => candidate.id === targetId);
    if (target == null) throw Error(`Unknown open target "${targetId}"`);
    const command = detectedCommand ??
      (await target.detect((shortcutPath: string) =>
        dependencies.electron.shell.readShortcutLink(shortcutPath)));
    if (!command) throw Error(`Open target "${targetId}" is not available`);
    if (target.open) {
      await target.open({
        command,
        path: targetPath,
        appPath,
        location,
        hostConfig,
        remoteWorkspaceRoot,
        remotePath,
      });
      return;
    }
    await dependencies.spawn(
      command,
      target.args(targetPath, location, hostConfig, remoteWorkspaceRoot, remotePath),
      { env: target.env?.() },
    );
  }

  function officeApplicationForPath(filePath: string) {
    const application = OFFICE_APPLICATIONS.get(path.extname(filePath).toLowerCase());
    if (application == null) return null;
    const appPath = dependencies.findExistingMacApplication([application.appPath]);
    return appPath == null ? null : { ...application, appPath };
  }

  async function nativeTarget({ appPath, bundleId, displayName }: any) {
    return {
      id: `app:${appPath}`,
      target: "systemDefault",
      label: displayName,
      icon:
        (await dependencies.getApplicationIcon(appPath)) ??
        (dependencies.platform === "linux"
          ? "/apps/file-explorer.png"
          : "/apps/finder.png"),
      kind: "native",
      appPath,
      bundleId,
      available: true,
    };
  }

  async function listApplications(filePath: string, { includeCodexTargets, limit }: any) {
    const applications = (
      dependencies.platform === "linux"
        ? await dependencies.listLinuxApplicationsForFile(filePath)
        : await dependencies.listApplicationsForFile({
            filePath,
            ...(includeCodexTargets && limit != null ? { limit } : {}),
            order: "usage",
            prioritizedBundleIds: dependencies.preferredBundleIdsForPath(filePath),
          })
    ).filter((application) => includeCodexTargets || !excludedBundleIds.has(application.bundleId));
    return limit == null ? applications : applications.slice(0, limit);
  }

  async function discoverNativeApplications(filePath: string) {
    const applications = await listApplications(filePath, {
      includeCodexTargets: dependencies.includeCodexTargets(filePath),
      limit: NATIVE_TARGET_LIMIT,
    });
    return Promise.all(applications.map(nativeTarget));
  }

  async function discoverDocumentApplications(filePath: string) {
    const applications = await listApplications(filePath, {
      includeCodexTargets: false,
      limit: undefined,
    });
    const officeFallback = officeApplicationForPath(filePath);
    const preferred = officeFallback == null
      ? undefined
      : applications.find(({ appPath }) => appPath === officeFallback.appPath) ?? officeFallback;
    const ordered = [
      ...(preferred == null ? [] : [preferred]),
      ...applications.filter(({ appPath }) => appPath !== preferred?.appPath),
    ];
    ordered.sort((left, right) => Number(Boolean(right.isDefault)) - Number(Boolean(left.isDefault)));
    return Promise.all(
      ordered.slice(0, NATIVE_TARGET_LIMIT).map(async (application) => ({
        ...(await nativeTarget(application)),
        default: application.isDefault ? true : undefined,
      })),
    );
  }

  async function canonicalApplicationPath(applicationPath: string) {
    return dependencies.fs.promises.realpath(applicationPath).catch(() => applicationPath);
  }

  async function discoverNativeBrowsers(discovery: string) {
    let result = null;
    if (dependencies.platform === "linux") result = await dependencies.discoverLinuxBrowsers();
    else if (discovery === "scan") result = await dependencies.scanNativeBrowsers();
    let applications = result?.applications.filter(
      (application: any) => !excludedBundleIds.has(application.bundleId),
    ) ?? [];
    if (applications.length === 0 && dependencies.platform !== "linux")
      applications = await dependencies.discoverKnownBrowsers({
        discovery: "known",
        limit: BROWSER_TARGET_LIMIT,
        order: "usage",
      });
    const defaultApplicationPath = result?.defaultApplicationPath ??
      (dependencies.platform === "darwin" || dependencies.platform === "win32"
        ? await dependencies.electron.app
            .getApplicationInfoForProtocol("https://")
            .then((application: any) => application.path)
            .catch(() => null)
        : null);
    const canonicalDefault = defaultApplicationPath == null
      ? null
      : await canonicalApplicationPath(defaultApplicationPath);
    const withDefault = await Promise.all(
      applications.map(async (application: any) => ({
        application,
        isDefault:
          canonicalDefault != null &&
          (await canonicalApplicationPath(application.appPath)) === canonicalDefault,
      })),
    );
    const unique = dependencies.uniqueBy(
      withDefault.sort((left, right) => Number(right.isDefault) - Number(left.isDefault)),
      ({ application }) => application.bundleId,
    );
    return Promise.all(
      unique.slice(0, BROWSER_TARGET_LIMIT).map(async ({ application, isDefault }) => ({
        ...(await nativeTarget(application)),
        default: isDefault || undefined,
      })),
    );
  }

  return {
    defaultTargets,
    discoverDocumentApplications,
    discoverNativeApplications,
    discoverNativeBrowsers,
    isEditorTarget,
    listApplications,
    nativeTarget,
    officeApplicationForPath,
    openWithTarget,
    targetsForPlatform,
  };
}
