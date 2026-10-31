export interface BrowserSettingsWebviewDefinition {
  allowedNavigationUrls: string[];
  canOpenPopup(details: any): boolean;
  isEnabled?(): boolean;
  partition: string;
}

export interface BrowserSettingsWebviewState {
  browserSettingsWebContentsByWebContentsId: Map<number, any>;
  browserSettingsWebviewAllowedNavigationUrlsByWebContentsId: Map<
    number,
    string[]
  >;
  browserSettingsWebviewNavigationDisposersByWebContentsId: Map<
    number,
    () => void
  >;
  browserSettingsWebviewThemeVariant: unknown;
  pendingBrowserSettingsWebviewsByInstanceId: Map<
    number,
    BrowserSettingsWebviewDefinition
  >;
}

export interface BrowserSettingsWebviewRuntimeDependencies {
  definitions: BrowserSettingsWebviewDefinition[];
  getPartitionName(): string;
  syncColorScheme(webContents: any, themeVariant: unknown): Promise<unknown>;
}

export function parseBrowserSettingsUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizeNavigationPath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, ``);
  return normalized.length === 0 ? `/` : normalized;
}

export function isBrowserSettingsNavigationUrlAllowed({
  allowedNavigationUrl,
  navigationUrl,
}: {
  allowedNavigationUrl: string;
  navigationUrl: string;
}): boolean {
  const allowed = parseBrowserSettingsUrl(allowedNavigationUrl);
  const navigation = parseBrowserSettingsUrl(navigationUrl);
  if (
    allowed == null ||
    navigation == null ||
    navigation.protocol !== allowed.protocol ||
    navigation.host !== allowed.host
  ) {
    return false;
  }
  const allowedPath = normalizeNavigationPath(allowed.pathname);
  const navigationPath = normalizeNavigationPath(navigation.pathname);
  return (
    allowedPath === `/` ||
    navigationPath === allowedPath ||
    navigationPath.startsWith(`${allowedPath}/`)
  );
}

export function isAnyBrowserSettingsNavigationUrlAllowed({
  allowedNavigationUrls,
  navigationUrl,
}: {
  allowedNavigationUrls: string[];
  navigationUrl: string;
}): boolean {
  return allowedNavigationUrls.some((allowedNavigationUrl) =>
    isBrowserSettingsNavigationUrlAllowed({
      allowedNavigationUrl,
      navigationUrl,
    }),
  );
}

function parsePositiveInstanceId(value: unknown): number | null {
  const instanceId = Number(value);
  return Number.isInteger(instanceId) && instanceId > 0 ? instanceId : null;
}

/** Owns Browser settings WebView admission, preferences, navigation, theme, and cleanup. */
export function createBrowserSettingsWebviewRuntime(
  dependencies: BrowserSettingsWebviewRuntimeDependencies,
) {
  const colorSchemeSyncs = new WeakMap<object, Promise<unknown>>();

  function hardenWebPreferences(params: any, webPreferences: any): void {
    delete params.allowpopups;
    delete params.disablewebsecurity;
    delete params.webpreferences;
    webPreferences.sandbox = true;
    webPreferences.devTools = true;
    webPreferences.nodeIntegration = false;
    webPreferences.nodeIntegrationInSubFrames = false;
    webPreferences.nodeIntegrationInWorker = false;
    webPreferences.contextIsolation = true;
    webPreferences.webSecurity = true;
    webPreferences.allowRunningInsecureContent = false;
    webPreferences.webviewTag = false;
    webPreferences.plugins = false;
    Object.assign(webPreferences, { disablePopups: true });
  }

  function configureBrowserPageWebviewPreferences({
    browserSession,
    params,
    preloadPath,
    webPreferences,
  }: {
    browserSession: unknown;
    params: any;
    preloadPath: string;
    webPreferences: any;
  }): void {
    params.partition = dependencies.getPartitionName();
    webPreferences.session = browserSession;
    webPreferences.preload = preloadPath;
    webPreferences.navigateOnDragDrop = true;
    hardenWebPreferences(params, webPreferences);
  }

  function configureBrowserSettingsWebviewPreferences({
    browserSession,
    params,
    webPreferences,
  }: {
    browserSession: unknown;
    params: any;
    webPreferences: any;
  }): void {
    params.partition = dependencies.getPartitionName();
    webPreferences.session = browserSession;
    delete webPreferences.preload;
    hardenWebPreferences(params, webPreferences);
    params.allowpopups = ``;
    Object.assign(webPreferences, { disablePopups: false });
  }

  function findBrowserSettingsWebviewDefinition(
    params: any,
  ): BrowserSettingsWebviewDefinition | null {
    const definition =
      dependencies.definitions.find(
        (candidate) =>
          params.partition === candidate.partition &&
          isAnyBrowserSettingsNavigationUrlAllowed({
            allowedNavigationUrls: candidate.allowedNavigationUrls,
            navigationUrl: params.src,
          }),
      ) ?? null;
    return definition != null &&
      (definition.isEnabled == null || definition.isEnabled())
      ? definition
      : null;
  }

  function takePendingBrowserSettingsWebview(
    webContents: any,
    state: BrowserSettingsWebviewState,
  ): BrowserSettingsWebviewDefinition | null {
    const instanceId = parsePositiveInstanceId(webContents.viewInstanceId);
    if (instanceId == null) return null;
    const definition =
      state.pendingBrowserSettingsWebviewsByInstanceId.get(instanceId) ?? null;
    if (definition == null) return null;
    state.pendingBrowserSettingsWebviewsByInstanceId.delete(instanceId);
    return definition;
  }

  function queueColorSchemeSync(webContents: any, themeVariant: unknown): void {
    const pending = (colorSchemeSyncs.get(webContents) ?? Promise.resolve())
      .catch(() => undefined)
      .then(async () => {
        await dependencies.syncColorScheme(webContents, themeVariant);
      });
    colorSchemeSyncs.set(webContents, pending);
  }

  function installNavigationRestriction({
    allowedNavigationUrls,
    onDispose,
    webContents,
  }: {
    allowedNavigationUrls: string[];
    onDispose(): void;
    webContents: any;
  }): () => void {
    const isAllowed = (url: string) =>
      isAnyBrowserSettingsNavigationUrlAllowed({
        allowedNavigationUrls,
        navigationUrl: url,
      });
    const preventDisallowedMainFrameNavigation = (event: any, url: string) => {
      if (event.isMainFrame && !isAllowed(url)) event.preventDefault();
    };
    const onWillFrameNavigate = (event: any) =>
      preventDisallowedMainFrameNavigation(event, event.url);
    const onWillNavigate = (event: any, url: string) =>
      preventDisallowedMainFrameNavigation(event, event.url ?? url);
    const onWillRedirect = (event: any, url: string) =>
      preventDisallowedMainFrameNavigation(event, event.url ?? url);
    const recoverDisallowedCommittedNavigation = (
      url: string,
      isMainFrame: boolean,
    ) => {
      if (!isMainFrame || isAllowed(url)) return;
      webContents
        .loadURL(allowedNavigationUrls[0] ?? `about:blank`)
        .catch(() => {
          webContents.close();
        });
    };
    const onDidNavigate = (_event: unknown, url: string) =>
      recoverDisallowedCommittedNavigation(url, true);
    const onDidNavigateInPage = (
      _event: unknown,
      url: string,
      isMainFrame: boolean,
    ) => recoverDisallowedCommittedNavigation(url, isMainFrame);
    const dispose = () => {
      webContents.removeListener(`will-frame-navigate`, onWillFrameNavigate);
      webContents.removeListener(`will-navigate`, onWillNavigate);
      webContents.removeListener(`will-redirect`, onWillRedirect);
      webContents.removeListener(`did-navigate`, onDidNavigate);
      webContents.removeListener(`did-navigate-in-page`, onDidNavigateInPage);
      webContents.removeListener(`destroyed`, dispose);
      onDispose();
    };
    webContents.on(`will-frame-navigate`, onWillFrameNavigate);
    webContents.on(`will-navigate`, onWillNavigate);
    webContents.on(`will-redirect`, onWillRedirect);
    webContents.on(`did-navigate`, onDidNavigate);
    webContents.on(`did-navigate-in-page`, onDidNavigateInPage);
    webContents.on(`destroyed`, dispose);
    return dispose;
  }

  function bindBrowserSettingsWebview({
    browserSettingsWebview,
    openBrowserSettingsUrlInTab,
    state,
    webContents,
  }: {
    browserSettingsWebview: BrowserSettingsWebviewDefinition;
    openBrowserSettingsUrlInTab(url: string): void;
    state: BrowserSettingsWebviewState;
    webContents: any;
  }): void {
    state.browserSettingsWebviewNavigationDisposersByWebContentsId.get(
      webContents.id,
    )?.();
    state.browserSettingsWebviewAllowedNavigationUrlsByWebContentsId.set(
      webContents.id,
      browserSettingsWebview.allowedNavigationUrls,
    );
    state.browserSettingsWebContentsByWebContentsId.set(
      webContents.id,
      webContents,
    );

    const syncTheme = () =>
      queueColorSchemeSync(
        webContents,
        state.browserSettingsWebviewThemeVariant,
      );
    const disposeNavigation = installNavigationRestriction({
      allowedNavigationUrls: browserSettingsWebview.allowedNavigationUrls,
      onDispose: () => {
        state.browserSettingsWebviewAllowedNavigationUrlsByWebContentsId.delete(
          webContents.id,
        );
        state.browserSettingsWebContentsByWebContentsId.delete(webContents.id);
        state.browserSettingsWebviewNavigationDisposersByWebContentsId.delete(
          webContents.id,
        );
      },
      webContents,
    });
    state.browserSettingsWebviewNavigationDisposersByWebContentsId.set(
      webContents.id,
      () => {
        webContents.removeListener(`did-finish-load`, syncTheme);
        disposeNavigation();
      },
    );
    webContents.setWindowOpenHandler((details: any) => {
      if (browserSettingsWebview.canOpenPopup(details))
        openBrowserSettingsUrlInTab(details.url);
      return { action: `deny` };
    });
    webContents.on(`did-finish-load`, syncTheme);
    syncTheme();
  }

  function findAllowedNavigationUrls(
    windows: Iterable<BrowserSettingsWebviewState>,
    webContentsId: number,
  ): string[] | null {
    for (const windowState of windows) {
      const urls =
        windowState.browserSettingsWebviewAllowedNavigationUrlsByWebContentsId.get(
          webContentsId,
        ) ?? null;
      if (urls != null) return urls;
    }
    return null;
  }

  function isBrowserSettingsNavigationBlocked({
    webContentsId,
    windows,
    url,
  }: {
    webContentsId?: number | null;
    windows: Iterable<BrowserSettingsWebviewState>;
    url: string;
  }): boolean {
    const allowedNavigationUrls =
      webContentsId == null
        ? null
        : findAllowedNavigationUrls(windows, webContentsId);
    return (
      allowedNavigationUrls != null &&
      !isAnyBrowserSettingsNavigationUrlAllowed({
        allowedNavigationUrls,
        navigationUrl: url,
      })
    );
  }

  function updateBrowserSettingsThemeVariant(
    state: BrowserSettingsWebviewState,
    themeVariant: unknown,
  ): void {
    if (state.browserSettingsWebviewThemeVariant === themeVariant) return;
    state.browserSettingsWebviewThemeVariant = themeVariant;
    for (const webContents of state.browserSettingsWebContentsByWebContentsId.values()) {
      queueColorSchemeSync(webContents, themeVariant);
    }
  }

  return {
    bindBrowserSettingsWebview,
    configureBrowserPageWebviewPreferences,
    configureBrowserSettingsWebviewPreferences,
    findBrowserSettingsWebviewDefinition,
    isBrowserSettingsNavigationBlocked,
    takePendingBrowserSettingsWebview,
    updateBrowserSettingsThemeVariant,
  };
}
