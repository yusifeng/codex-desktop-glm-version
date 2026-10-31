export interface WindowIconFlavorPolicy {
  agent: string;
  nightly: string;
  internalAlpha: string;
  publicBeta: string;
  dev: string;
  prod: string;
}

export interface WindowIconLifecycleDependencies {
  app: {
    isPackaged: boolean;
    dock?: { setIcon(image: unknown): void } | null;
  };
  browserWindows(): Array<{ isDestroyed(): boolean; setIcon(path: string): void }>;
  createEmptyImage(): any;
  createImageFromPath(path: string): any;
  exists(path: string): boolean;
  join(...parts: string[]): string;
  nativeTheme: {
    shouldUseDarkColorsForSystemIntegratedUI: boolean;
    on(event: "updated", listener: () => void): void;
    off(event: "updated", listener: () => void): void;
  };
  resolveDockIconPreference(input: {
    buildFlavor: string;
    getPreference: () => string | undefined;
    eligibleFlavors: readonly string[];
    agentFlavor: string;
  }): string | undefined;
  resolveFlavorIconAssetNames(flavor: string, policy: WindowIconFlavorPolicy): { dark: string; light: string };
  resolveLinuxIcon(flavor: string, iconsDirectory: string): string | null;
  resolveWindowIconResource(flavor: string, policy: WindowIconFlavorPolicy): { fileName: string; allowPackaged: boolean } | undefined;
  resolveWindowsIcon(flavor: string, options: { localIconsDirectory: string }): string | null;
  resourcesPath: string;
  setMacAppIcon(input: { preference: string | undefined; resourceName?: string | null }): Promise<boolean>;
}

export interface WindowIconLifecycleInput {
  buildFlavor: string;
  devDockIconsPath?: string;
  flavorPolicy: WindowIconFlavorPolicy;
  iconsRoot: string;
  isDevMode: boolean;
  isLinux: boolean;
  isMacOS: boolean;
  isWindows: boolean;
  readDockIconPreference(): string | undefined;
  registerDispose(dispose: () => void): void;
  repoRoot: string;
}

/**
 * Owns the mutable native window icon and macOS dock icon lifecycle that was
 * previously embedded in the main window composition root (`dst`).
 */
export function createWindowIconLifecycle(
  dependencies: WindowIconLifecycleDependencies,
  input: WindowIconLifecycleInput,
) {
  const { flavorPolicy } = input;
  const packagedResource = (name: string): string | null => {
    if (!dependencies.app.isPackaged) return null;
    const candidate = dependencies.join(dependencies.resourcesPath, name);
    return dependencies.exists(candidate) ? candidate : null;
  };
  const sourceResource = (name: string): string | null => {
    const candidate = dependencies.join(input.iconsRoot, name);
    return dependencies.exists(candidate) ? candidate : null;
  };
  const iconResource = (name: string): string | null => packagedResource(name) ?? sourceResource(name);
  const dockPreference = () => dependencies.resolveDockIconPreference({
    buildFlavor: input.buildFlavor,
    getPreference: input.readDockIconPreference,
    eligibleFlavors: [flavorPolicy.dev, flavorPolicy.nightly, flavorPolicy.internalAlpha, flavorPolicy.publicBeta, flavorPolicy.prod],
    agentFlavor: flavorPolicy.agent,
  });
  const fallbackWindowIcon = (): string | null => {
    const resource = dependencies.resolveWindowIconResource(input.buildFlavor, flavorPolicy);
    if (resource == null) return null;
    return resource.allowPackaged ? iconResource(resource.fileName) : sourceResource(resource.fileName);
  };
  const resolveWindowsIcon = () => dependencies.resolveWindowsIcon(input.buildFlavor, {
    localIconsDirectory: dependencies.join(input.repoRoot, "electron", ".generated", "windows-app-icons"),
  });

  let windowIconPath = input.isLinux
    ? dependencies.resolveLinuxIcon(input.buildFlavor, input.iconsRoot)
    : input.isWindows
      ? resolveWindowsIcon()
      : null;

  if (input.isWindows && windowIconPath != null) {
    const updateWindowsIcon = () => {
      const next = resolveWindowsIcon();
      if (next == null || next === windowIconPath) return;
      windowIconPath = next;
      for (const window of dependencies.browserWindows())
        if (!window.isDestroyed()) window.setIcon(next);
    };
    dependencies.nativeTheme.on("updated", updateWindowsIcon);
    input.registerDispose(() => dependencies.nativeTheme.off("updated", updateWindowsIcon));
  }

  const assets = dependencies.resolveFlavorIconAssetNames(input.buildFlavor, flavorPolicy);
  const systemAssetName = () => dependencies.nativeTheme.shouldUseDarkColorsForSystemIntegratedUI ? assets.dark : assets.light;
  const applyDockIcon = (preference: string | undefined) => {
    if (input.devDockIconsPath) {
      const fileName = preference === "codex-system"
        ? dependencies.nativeTheme.shouldUseDarkColorsForSystemIntegratedUI ? "codex-dark" : "codex-light"
        : "app-default";
      const image = dependencies.createImageFromPath(dependencies.join(input.devDockIconsPath, `${fileName}.png`));
      if (!image.isEmpty()) {
        dependencies.app.dock?.setIcon(image);
        return;
      }
    }
    if (preference === "app-default" && input.buildFlavor !== flavorPolicy.dev) {
      const dock = dependencies.app.dock;
      if (dock != null) Reflect.apply(dock.setIcon.bind(dock), dock, [null]);
      return;
    }
    const preferredPath = preference === "codex-system" ? iconResource(systemAssetName()) : null;
    const path = preferredPath ?? fallbackWindowIcon();
    let image = path == null ? dependencies.createEmptyImage() : dependencies.createImageFromPath(path);
    if (image.isEmpty()) return;
    if (preference === "codex-system") {
      const { width, height } = image.getSize();
      const inset = Math.round(width / 128);
      image = image.crop({ x: inset, y: inset, width: width - inset * 2, height: height - inset * 2 });
    }
    dependencies.app.dock?.setIcon(image);
  };
  const updateDockIcon = () => {
    if (!input.isMacOS) return;
    const preference = dockPreference();
    applyDockIcon(preference);
    void dependencies.setMacAppIcon({
      preference,
      resourceName: preference === "codex-system" ? assets.light : null,
    }).then((changed) => {
      if (changed) applyDockIcon(dockPreference());
    });
  };

  if (input.isMacOS) {
    updateDockIcon();
    const updateSystemDockIcon = () => {
      const preference = dockPreference();
      if (preference === "codex-system") applyDockIcon(preference);
    };
    dependencies.nativeTheme.on("updated", updateSystemDockIcon);
    input.registerDispose(() => dependencies.nativeTheme.off("updated", updateSystemDockIcon));
  }

  return {
    get windowIconPath() {
      return windowIconPath;
    },
    updateDockIcon,
  };
}
