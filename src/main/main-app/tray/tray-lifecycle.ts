// @ts-nocheck

const LINUX_TRAY_ICON_SIZE = 16;

/** Owns singleton tray creation, platform icon loading, theme refresh, and cancellation. */
export function createTrayLifecycle(dependencies: Record<string, any>) {
  const {
    app,
    Tray,
    nativeImage,
    nativeTheme,
    platform,
    resourcesPath,
    execPath,
    join,
    agentFlavor,
    resolveTrayTemplateNames,
    resolveTrayWindowsIconNames,
    resolveTrayIconCandidates,
    iconBaseName,
    getWindowsDistributionFlavor,
    getWindowsPackageIdentity,
    resolveWindowsPackageIdentity,
    NativeStatusItemController,
    TrayMenuController,
    getNativeIntl,
    isTrayReady,
  } = dependencies;

  let controller = null;
  let pendingCreation = null;
  let removeThemeListener = null;
  let creationAllowed = false;
  let ready = false;
  let quitListenerInstalled = false;

  const getTrayController = () => controller;
  const isReady = () => isTrayReady(ready, controller);

  async function start(options: Record<string, any>) {
    creationAllowed = true;
    if (pendingCreation != null) return pendingCreation;
    if (controller != null) return controller;
    if (!quitListenerInstalled) {
      app.on(`will-quit`, dispose);
      quitListenerInstalled = true;
    }
    pendingCreation = create(options).finally(() => {
      pendingCreation = null;
    });
    return pendingCreation;
  }

  async function create(options: Record<string, any>) {
    if (
      platform === `darwin` &&
      options.getNativeStatusItemState != null &&
      options.getComputerUseServiceProcessIdentifier != null &&
      options.onNativeStatusItemMenuAction != null
    ) {
      if (!creationAllowed) return null;
      const [, templateName] = resolveTrayTemplateNames();
      const statusItem = new NativeStatusItemController(
        join(
          app.isPackaged
            ? resourcesPath
            : join(options.repoRoot, `electron`, `src`, `icons`),
          templateName,
        ),
        getNativeIntl(),
        app.getName(),
        options.settingsStore,
        options.getNativeStatusItemState,
        options.getComputerUseServiceProcessIdentifier,
        options.onNativeStatusItemMenuAction,
      );
      controller = statusItem;
      ready = true;
      return statusItem;
    }

    const flavor =
      platform === `win32` && app.isPackaged
        ? getWindowsDistributionFlavor(
            options.buildFlavor,
            getWindowsPackageIdentity(),
          )
        : options.buildFlavor;
    const icon = await loadTrayIcon(flavor, options.repoRoot);
    const tray = new Tray(
      icon.defaultIcon,
      platform === `win32` && app.isPackaged
        ? resolveWindowsPackageIdentity(flavor)
        : undefined,
    );
    if (!creationAllowed) {
      tray.destroy();
      return null;
    }
    if (platform === `win32`) {
      const iconNames = resolveTrayWindowsIconNames(flavor, agentFlavor);
      if (iconNames.dark !== iconNames.light) {
        const refreshIcon = () => {
          const image = loadWindowsTrayIcon(flavor, options.repoRoot);
          if (image != null) tray.setImage(image);
        };
        nativeTheme.on(`updated`, refreshIcon);
        removeThemeListener = () => nativeTheme.off(`updated`, refreshIcon);
        refreshIcon();
      }
    }
    tray.setToolTip(app.getName());
    const trayController = new TrayMenuController(
      tray,
      options.onOpenMainWindow,
      options.onTrayMenuOpenNewThread,
      options.onTrayMenuOpenRecentThread,
      options.onTrayMenuSendFeedback,
      getNativeIntl(),
      app.getName(),
    );
    controller = trayController;
    if (!(await trayController.waitForReady()) || controller !== trayController) {
      if (controller === trayController) {
        removeThemeListener?.();
        removeThemeListener = null;
        controller = null;
        trayController.destroy();
      }
      return null;
    }
    ready = true;
    return trayController;
  }

  function dispose() {
    creationAllowed = false;
    ready = false;
    removeThemeListener?.();
    removeThemeListener = null;
    controller?.destroy();
    controller = null;
  }

  async function loadTrayIcon(flavor: string, repoRoot: string) {
    if (platform === `darwin`) {
      const candidates = resolveTrayIconCandidates({
        platform,
        flavor,
        packaged: app.isPackaged,
        resourcesPath,
        repoRoot,
        templateNames: resolveTrayTemplateNames(),
        iconBaseName,
        windowsIconNames: (candidateFlavor: string) =>
          resolveTrayWindowsIconNames(candidateFlavor, agentFlavor),
      });
      for (const candidate of candidates) {
        const image = nativeImage.createFromPath(candidate);
        if (!image.isEmpty()) {
          image.setTemplateImage(true);
          return { defaultIcon: image };
        }
      }
      return {
        defaultIcon: await app.getFileIcon(execPath, { size: `normal` }),
      };
    }
    if (platform === `linux`) {
      const candidate = resolveTrayIconCandidates({
        platform,
        flavor,
        packaged: app.isPackaged,
        resourcesPath,
        repoRoot,
        templateNames: resolveTrayTemplateNames(),
        iconBaseName,
        windowsIconNames: (candidateFlavor: string) =>
          resolveTrayWindowsIconNames(candidateFlavor, agentFlavor),
      })[0];
      const image = nativeImage.createFromPath(candidate);
      if (image.isEmpty()) throw Error(`Linux tray application icon is unavailable`);
      return {
        defaultIcon: image.resize({
          width: LINUX_TRAY_ICON_SIZE,
          height: LINUX_TRAY_ICON_SIZE,
          quality: `best`,
        }),
      };
    }
    const image = loadWindowsTrayIcon(flavor, repoRoot);
    return image == null
      ? { defaultIcon: await app.getFileIcon(execPath, { size: `small` }) }
      : { defaultIcon: image };
  }

  function loadWindowsTrayIcon(flavor: string, repoRoot: string) {
    const candidates = resolveTrayIconCandidates({
      platform: `win32`,
      flavor,
      packaged: app.isPackaged,
      resourcesPath,
      repoRoot,
      dark: nativeTheme.shouldUseDarkColorsForSystemIntegratedUI,
      templateNames: resolveTrayTemplateNames(),
      iconBaseName,
      windowsIconNames: (candidateFlavor: string) =>
        resolveTrayWindowsIconNames(candidateFlavor, agentFlavor),
    });
    for (const candidate of candidates) {
      const image = nativeImage.createFromPath(candidate);
      if (!image.isEmpty()) return image;
    }
    return null;
  }

  return { dispose, getTrayController, isReady, start };
}

if (typeof module !== "undefined") {
  module.exports = { createTrayLifecycle };
}
