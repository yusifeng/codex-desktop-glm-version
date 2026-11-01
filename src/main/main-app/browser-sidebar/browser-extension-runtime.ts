type BrowserExtensionRuntimeDependencies = {
  RpcHandlerBase: new (...args: any[]) => any;
  createUsingScope(): any;
  featureAvailability(): { browserExtensions: boolean };
  iconManifestSchema: { safeParse(value: unknown): any };
  nativeImage: { createFromPath(path: string): any };
  orderBy(values: any[], ...iteratees: Array<(value: any) => unknown>): any[];
  path: {
    resolve(...parts: string[]): string;
    relative(from: string, to: string): string;
    isAbsolute(path: string): boolean;
    sep: string;
  };
};

/** Owns extension-toolbar projection, action lifecycles, and favicon subscriptions. */
export function createBrowserExtensionRuntime(
  dependencies: BrowserExtensionRuntimeDependencies,
) {
  class ExtensionSubscription extends dependencies.RpcHandlerBase {
    private unsubscribeOnce: (() => void) | null;

    constructor(unsubscribe: () => void) {
      super();
      this.unsubscribeOnce = unsubscribe;
    }

    unsubscribe() {
      const unsubscribe = this.unsubscribeOnce;
      this.unsubscribeOnce = null;
      unsubscribe?.();
    }

    [Symbol.dispose]() {
      this.unsubscribe();
    }
  }

  class FaviconSubscription extends dependencies.RpcHandlerBase {
    constructor(private readonly disposeSubscription: () => void) {
      super();
    }

    [Symbol.dispose]() {
      this.disposeSubscription();
    }
  }

  const faviconSizeReferences = new WeakMap<any, Map<number, number>>();

  function colorToRgbaHex(color: number) {
    const argb = (color < 0 ? color + 4_294_967_296 : color)
      .toString(16)
      .padStart(8, "0");
    return `#${argb.slice(2)}${argb.slice(0, 2)}`;
  }

  function extensionManifestIcon(extension: any) {
    const parsed = dependencies.iconManifestSchema.safeParse(extension.manifest);
    if (!parsed.success || parsed.data.icons == null) return null;
    const candidates = dependencies.orderBy(
      Object.entries(parsed.data.icons).filter(([size]) => Number.isFinite(Number(size))),
      ([size]) => Number(size) < 32,
      ([size]) => Math.abs(Number(size) - 32),
    );
    for (const [, relativeIconPath] of candidates) {
      const iconPath = dependencies.path.resolve(extension.path, relativeIconPath as string);
      const relativePath = dependencies.path.relative(extension.path, iconPath);
      if (
        relativePath === ".." ||
        relativePath.startsWith(`..${dependencies.path.sep}`) ||
        dependencies.path.isAbsolute(relativePath)
      )
        continue;
      const image = dependencies.nativeImage.createFromPath(iconPath);
      if (!image.isEmpty()) return image.toDataURL();
    }
    return null;
  }

  function projectExtensionAction(action: any, toolbarState: any) {
    return {
      badgeBackgroundColor: colorToRgbaHex(action.effectiveBadgeColors.backgroundColor),
      badgeText: action.badgeText,
      badgeTextColor: colorToRgbaHex(action.effectiveBadgeColors.textColor),
      enabled: action.visible,
      forcePinned: toolbarState.forcePinnedExtensionIds.includes(action.id),
      hasPopup: action.hasPopup,
      iconDataUrl: action.icon.isEmpty()
        ? extensionManifestIcon(action)
        : action.icon.toDataURL({ scaleFactor: 2 }),
      id: action.id,
      name: action.name,
      pinned: toolbarState.pinnedExtensionIds.includes(action.id),
      title: action.title,
    };
  }

  function extensionTarget(getWebContents: () => any) {
    if (!dependencies.featureAvailability().browserExtensions)
      return { status: "unsupported" } as const;
    const webContents = getWebContents();
    return webContents == null || webContents.isDestroyed()
      ? ({ status: "invalid-target" } as const)
      : ({ status: "available", webContents } as const);
  }

  function scaledAnchorRect(origin: any, bounds: any) {
    if (
      bounds == null ||
      !Number.isFinite(bounds.x) ||
      !Number.isFinite(bounds.y) ||
      !Number.isFinite(bounds.width) ||
      !Number.isFinite(bounds.height) ||
      bounds.width <= 0 ||
      bounds.height <= 0
    )
      return undefined;
    const zoom = origin.getZoomFactor();
    return {
      height: Math.round(bounds.height * zoom),
      width: Math.round(bounds.width * zoom),
      x: Math.round(bounds.x * zoom),
      y: Math.round(bounds.y * zoom),
    };
  }

  function subscribeToolbarChanges(session: any, listener: () => void) {
    session.extensions.on("extension-loaded", listener);
    session.extensions.on("extension-ready", listener);
    session.extensions.on("extension-unloaded", listener);
    session.extensions.on("pinned-extensions-changed", listener);
    return () => {
      session.extensions.removeListener("extension-loaded", listener);
      session.extensions.removeListener("extension-ready", listener);
      session.extensions.removeListener("extension-unloaded", listener);
      session.extensions.removeListener("pinned-extensions-changed", listener);
    };
  }

  function invokeRemote(callback: any, value: unknown) {
    const scope = dependencies.createUsingScope();
    try {
      scope.u(callback(value));
    } catch (error) {
      scope.e = error;
    } finally {
      scope.d();
    }
  }

  async function getExtensionActions(getWebContents: () => any) {
    const target = extensionTarget(getWebContents);
    if (target.status !== "available") return { status: "unsupported" };
    const toolbarState = target.webContents.session.extensions.getExtensionToolbarState();
    return {
      actions: target.webContents
        .getExtensionActions()
        .map((action: any) => projectExtensionAction(action, toolbarState)),
      status: "available",
      supportsContextMenu: true,
    };
  }

  async function subscribeExtensionProfile(
    session: any,
    origin: any,
    callback: any,
    recentUseRegistry: any,
  ) {
    if (origin.isDestroyed()) return null;
    const snapshot = () => {
      const toolbar = session.extensions.getExtensionToolbarState();
      return {
        extensions: session.extensions
          .getAllExtensions()
          .map((extension: any) => ({
            iconDataUrl: extensionManifestIcon(extension),
            id: extension.id,
            name: extension.name,
          })),
        recentlyUsedExtensionIds: recentUseRegistry.getRecentlyUsed(session, toolbar),
        toolbar,
      };
    };
    const initial = snapshot();
    const remoteCallback = callback.dup();
    const publish = () => invokeRemote(remoteCallback, snapshot());
    const unsubscribeToolbar = subscribeToolbarChanges(session, publish);
    const unsubscribeRecent = recentUseRegistry.subscribe(session, publish);
    const subscription = new ExtensionSubscription(() => {
      unsubscribeToolbar();
      unsubscribeRecent();
      origin.removeListener("destroyed", dispose);
      remoteCallback[Symbol.dispose]();
    });
    const dispose = () => subscription.unsubscribe();
    origin.once("destroyed", dispose);
    remoteCallback.onRpcBroken(dispose);
    try {
      await remoteCallback(initial);
      return subscription;
    } catch (error) {
      dispose();
      throw error;
    }
  }

  async function triggerExtensionAction(
    getWebContents: () => any,
    origin: any,
    { actionId, anchorBounds }: any,
    recentUseRegistry: any,
  ) {
    const target = extensionTarget(getWebContents);
    if (target.status !== "available") return target.status;
    if (origin.isDestroyed()) return "invalid-target";
    const session = target.webContents.session;
    const result = target.webContents.triggerExtensionAction(actionId, {
      anchorRect: scaledAnchorRect(origin, anchorBounds),
    });
    if (result === "triggered") recentUseRegistry.recordUse(session, actionId);
    return result;
  }

  async function setExtensionPinned(
    getWebContents: () => any,
    { actionId, pinned }: any,
    recentUseRegistry: any,
  ) {
    const target = extensionTarget(getWebContents);
    if (target.status !== "available") return target.status;
    const session = target.webContents.session;
    const result = session.extensions.setExtensionPinned(actionId, pinned);
    if (result === "updated" || result === "unchanged") recentUseRegistry.refreshPins(session);
    return result;
  }

  async function showExtensionActionContextMenu(
    getWebContents: () => any,
    origin: any,
    { actionId, anchorBounds, source, sourceType }: any,
    recentUseRegistry: any,
    allowHiddenBlankTab = false,
  ) {
    const target = extensionTarget(getWebContents);
    if (target.status !== "available") return target.status;
    if (origin.isDestroyed()) return "invalid-target";
    const session = target.webContents.session;
    const result = await target.webContents.showExtensionActionContextMenu(actionId, {
      allowHiddenBlankTab,
      anchorRect: scaledAnchorRect(origin, anchorBounds),
      source,
      sourceType,
    });
    if (result === "closed") recentUseRegistry.refreshPins(session);
    return result;
  }

  function subscribeExtensionActionEvents(
    getWebContents: () => any,
    origin: any,
    callback: any,
  ) {
    const target = extensionTarget(getWebContents);
    if (target.status !== "available" || origin.isDestroyed()) return null;
    const remoteCallback = callback.dup();
    let active = true;
    const publish = (event: unknown) => {
      if (active) invokeRemote(remoteCallback, event);
    };
    const changed = () => publish({ type: "changed" });
    const actionChanged = (_event: unknown, details: any) => {
      if (details.webContentsId == null || details.webContentsId === target.webContents.id) changed();
    };
    const popupOpening = (_event: unknown, details: any) =>
      publish({ actionId: details.extensionId, type: "popup-opening" });
    const popupOpened = (_event: unknown, details: any) =>
      publish({ actionId: details.extensionId, type: "popup-opened" });
    const popupClosed = (_event: unknown, details: any) =>
      publish({ actionId: details.extensionId, type: "popup-closed" });
    const session = target.webContents.session;
    const unsubscribeToolbar = subscribeToolbarChanges(session, changed);
    session.extensions.on("extension-action-updated", actionChanged);
    target.webContents.on("did-navigate", changed);
    target.webContents.on("did-navigate-in-page", changed);
    target.webContents.on("extension-action-popup-opening", popupOpening);
    target.webContents.on("extension-action-popup-opened", popupOpened);
    target.webContents.on("extension-action-popup-closed", popupClosed);
    const dispose = () => {
      if (!active) return;
      active = false;
      unsubscribeToolbar();
      session.extensions.removeListener("extension-action-updated", actionChanged);
      target.webContents.removeListener("did-navigate", changed);
      target.webContents.removeListener("did-navigate-in-page", changed);
      target.webContents.removeListener("extension-action-popup-opening", popupOpening);
      target.webContents.removeListener("extension-action-popup-opened", popupOpened);
      target.webContents.removeListener("extension-action-popup-closed", popupClosed);
      target.webContents.removeListener("destroyed", dispose);
      origin.removeListener("destroyed", dispose);
      remoteCallback[Symbol.dispose]();
    };
    target.webContents.once("destroyed", dispose);
    origin.once("destroyed", dispose);
    remoteCallback.onRpcBroken(dispose);
    return new ExtensionSubscription(dispose);
  }

  function imageDataUrl(image: any, scaleFactor?: number) {
    return image == null || image.isEmpty()
      ? null
      : scaleFactor == null
        ? image.toDataURL()
        : image.toDataURL({ scaleFactor });
  }

  async function loadFaviconData(
    faviconService: any,
    { destinationURL, iconURL, scaleFactor }: any,
  ) {
    if (iconURL != null) {
      const icon = imageDataUrl(
        await faviconService.getFaviconForIconURL(iconURL).catch(() => null),
        scaleFactor,
      );
      if (icon != null) return icon;
    }
    return imageDataUrl(await faviconService.getFavicon(destinationURL), scaleFactor);
  }

  function subscribeFavicon(
    webContents: any,
    origin: any,
    size: number,
    callback: any,
  ) {
    if (webContents == null || webContents.isDestroyed() || origin.isDestroyed()) return undefined;
    const sizeReferences = faviconSizeReferences.get(webContents) ?? new Map<number, number>();
    const remoteCallback = callback.dup();
    let active = true;
    let lastValue: string | null | undefined;
    const publish = (value: string | null) => {
      if (active && value !== lastValue) {
        lastValue = value;
        invokeRemote(remoteCallback, value);
      }
    };
    const refresh = () => publish(imageDataUrl(webContents.getFaviconImage({ size }), 2));
    const updated = (_event: unknown, _url: string, details: { sizes: number[] }) => {
      if (details.sizes.includes(size)) refresh();
      else publish(null);
    };
    const dispose = () => {
      if (!active) return;
      active = false;
      webContents.removeListener("owl-favicon-image-updated", updated);
      webContents.removeListener("destroyed", destroyed);
      origin.removeListener("destroyed", dispose);
      remoteCallback[Symbol.dispose]();
      const count = (sizeReferences.get(size) ?? 1) - 1;
      if (count === 0) sizeReferences.delete(size);
      else sizeReferences.set(size, count);
      if (sizeReferences.size === 0) faviconSizeReferences.delete(webContents);
      if (!webContents.isDestroyed()) webContents.setFaviconImageSizes([16, ...sizeReferences.keys()]);
    };
    const destroyed = () => {
      publish(null);
      dispose();
    };
    webContents.on("owl-favicon-image-updated", updated);
    webContents.once("destroyed", destroyed);
    origin.once("destroyed", dispose);
    remoteCallback.onRpcBroken(dispose);
    sizeReferences.set(size, (sizeReferences.get(size) ?? 0) + 1);
    faviconSizeReferences.set(webContents, sizeReferences);
    webContents.setFaviconImageSizes([16, ...sizeReferences.keys()]);
    refresh();
    return new FaviconSubscription(dispose);
  }

  return {
    getExtensionActions,
    loadFaviconData,
    setExtensionPinned,
    showExtensionActionContextMenu,
    subscribeExtensionActionEvents,
    subscribeExtensionProfile,
    subscribeFavicon,
    triggerExtensionAction,
  };
}
