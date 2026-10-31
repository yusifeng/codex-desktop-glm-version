// @ts-nocheck

const DESKTOP_FEATURE_KEYS = [
  `noPluginListPhase2`, `noPluginListPhase4`, `ambientSuggestions`,
  `ambientSuggestionsFeatureDiscovery`, `ambientSuggestionsStaleTimeMs`,
  `appshotsEnabled`, `artifactSession`, `artifactTemplatePicker`, `autoAuthForSites`,
  `cuaPIP`, `codexLocalAccess`, `inAppBrowserUse`, `inAppBrowserUseAllowed`,
  `inAppBrowserUseHistory`, `browserUseTinysky`, `defaultLinkOpenTargetPreference`,
  `localBackend`, `localProjectTaskMembership`, `localAutomationHabitatMigration`,
  `browserPane`, `browserExtensions`, `browserSettingsCloudSync`, `externalBrowserUse`,
  `externalBrowserUseAllowed`, `computerUse`, `computerUseAutoInstall`,
  `nodeReplEnforceModelCheck`, `messages`, `recordAndReplay`, `skysight`, `sites`,
  `control`, `dil`, `multiWindow`, `unifiedTabStrip`, `quickChat`,
  `remoteControlClientScopedEnvironments`, `workCloudAccess`, `workLocalAccess`,
  `webMcp`, `webMcpMaxTools`, `codeReviewPlugin`, `deepResearch`, `userWriting`,
  `visualizeLive`, `workspaceDir`,
];

/** Registers the primary renderer, browser-sidebar/page, Codex-home, Sentry, and AppView IPC routes. */
export function registerMainIpcRouter(options: Record<string, any>) {
  const {
    app,
    ipcMain,
    BrowserWindow,
    channels,
    logger,
    loadInternalRuntime,
    isInternalBuild,
    assertPrimaryRuntimeAvailable,
    setInternalUpdateCdn,
    setWindowsRuntimeFrameworks,
    registerContextMenu,
    getDesktopFeatureAvailability,
    isSafeRoute,
    parseBrowserSidebarMessage,
    isBrowserPageEvent,
    guardedBrowserPageEventTypes,
    resolveCodexHomeRequest,
    createMessagePortRemoteMain,
    isTrayMenuThreadsChangedMessage,
    relaunchApp,
    desktopSentry,
    hotkeyWindowLifecycleManager,
    globalDictationLifecycleManager,
    globalState,
    productionAppcastStateStore,
    getContextForWebContents,
    getPrimaryWindow,
    showPrimaryWindow,
    sendMessageToWindow,
    ensureWindow,
    createFreshWindow,
    setDesktopFeatureAvailability,
    setAvatarOverlayFeedbackDiagnosticsEnabled,
    latchInAppUpdatesEnabledForLaunch,
    setAutomaticBackgroundDownloadsEnabled,
    restoreAvatarOverlayOpenState,
    prewarmAvatarOverlay,
    reloadBundledPlugins,
    setMacMenuBarEnabled,
    navigateToRoute,
    setRemoteHostedPIPActiveThreadID,
    setRemoteHostedPIPHostLayout,
    getDockMenuController,
    getTrayController,
    onAppEntrySource,
    isTrustedIpcEvent,
    requestDevRelaunch,
    quitState,
  } = options;
  const internalRuntime = loadInternalRuntime();
  registerContextMenu();
  let avatarOverlayRestored = false;
  let avatarOverlayPrewarming = false;
  let trayMenuThreads = null;

  ipcMain.handle(channels.mainMessage, async (event: Record<string, any>, message: Record<string, any>) => {
    if (!isTrustedIpcEvent(event)) return;
    if (message.type === `electron-avatar-overlay-restore-ready`) {
      if (!avatarOverlayRestored) {
        avatarOverlayRestored = true;
        await restoreAvatarOverlayOpenState(event.sender);
      }
      if (
        message.shouldPrewarmAvatarOverlay &&
        !avatarOverlayPrewarming &&
        prewarmAvatarOverlay != null
      ) {
        avatarOverlayPrewarming = true;
        try {
          await prewarmAvatarOverlay(event.sender).catch(() => prewarmAvatarOverlay(event.sender));
        } catch (error) {
          avatarOverlayPrewarming = false;
          throw error;
        }
      }
      return;
    }
    if (message.type === `remote-hosted-pip-active-thread-changed`) {
      setRemoteHostedPIPActiveThreadID?.(event.sender, message.conversationId);
      return;
    }
    if (message.type === `remote-hosted-pip-host-layout-changed`) {
      setRemoteHostedPIPHostLayout?.(event.sender, message.layout);
      return;
    }
    if (message.type === `electron-avatar-overlay-feedback-diagnostics-changed`) {
      setAvatarOverlayFeedbackDiagnosticsEnabled(message.enabled);
      return;
    }
    if (message.type === `electron-sparkle-gates-changed`) {
      const runtimeFrameworks = {
        core: message.useWindowsCoreRuntimeFrameworks,
        primary: message.useWindowsPrimaryRuntimeFrameworks,
      };
      if (isInternalBuild()) {
        assertPrimaryRuntimeAvailable((await internalRuntime) != null || runtimeFrameworks.primary);
      }
      latchInAppUpdatesEnabledForLaunch(!message.disableInAppUpdates);
      setAutomaticBackgroundDownloadsEnabled(!message.disableSparkleAutodownload);
      productionAppcastStateStore?.setBackendAppcastEnabled(message.useBackendAppcast);
      await setInternalUpdateCdn(globalState, message.useInternalUpdateCdn);
      await setWindowsRuntimeFrameworks(globalState, runtimeFrameworks);
      return;
    }
    if (message.type === `electron-desktop-features-changed`) {
      const features = {};
      for (const key of DESKTOP_FEATURE_KEYS) features[key] = message[key];
      features.visualizeTreatment = false;
      setDesktopFeatureAvailability(features, message.bundledPluginEligibilityReasons);
      return;
    }
    if (message.type === `mac-menu-bar-enabled-changed`) {
      await setMacMenuBarEnabled(message.enabled);
      if (message.enabled && trayMenuThreads != null) {
        await getTrayController()?.handleMessage({
          type: `tray-menu-threads-changed`,
          trayMenuThreads,
        });
      }
      return;
    }
    if (message.type === `reload-bundled-plugins`) {
      await reloadBundledPlugins?.();
      return;
    }
    if (message.type === `open-browser-in-main-window`) {
      if (!getDesktopFeatureAvailability().browserPane || !isSafeRoute(message.path)) return;
      hotkeyWindowLifecycleManager.hide();
      let window =
        getContextForWebContents(event.sender)
          ?.getBrowserHostManager()
          .getPreferredWindowStateForConversation(message.browserPanel.conversationId)?.window ??
        getPrimaryWindow();
      const hadWindow = window != null;
      window ??= await createFreshWindow(message.path);
      if (window == null) return;
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
      sendMessageToWindow(window, message.browserPanel);
      if (hadWindow) navigateToRoute(window, message.path);
      return;
    }
    if (message.type === `open-current-main-window` || message.type === `open-in-main-window`) {
      const path = message.type === `open-current-main-window` ? null : message.path;
      if (path != null && !isSafeRoute(path)) return;
      hotkeyWindowLifecycleManager.hide();
      const existingWindow = getPrimaryWindow();
      const shouldAttribute =
        message.appEntryAttribution != null &&
        (existingWindow == null || !existingWindow.isVisible() || !existingWindow.isFocused());
      const window = existingWindow != null || path == null
        ? await ensureWindow()
        : await createFreshWindow(path);
      if (window == null) return;
      if (message.type === `open-in-main-window`) {
        showPrimaryWindow({ stealFocus: true });
      } else if (message.stealFocus === true) {
        showPrimaryWindow({ focusComposer: message.focusComposer, stealFocus: true });
      } else {
        if (window.isMinimized()) window.restore();
        window.show();
        window.focus();
      }
      if (existingWindow != null && path != null) navigateToRoute(window, path);
      if (shouldAttribute && message.appEntryAttribution != null) {
        onAppEntrySource?.(message.appEntryAttribution, window.webContents);
      }
      return;
    }
    if (message.type === `open-in-new-window`) {
      if (!isSafeRoute(message.path)) return;
      hotkeyWindowLifecycleManager.hide();
      const window = await createFreshWindow(message.path);
      if (window != null) {
        if (window.isMinimized()) window.restore();
        window.show();
        window.focus();
      }
      return;
    }
    if (message.type === `show-settings`) {
      hotkeyWindowLifecycleManager.hide();
      const window = await ensureWindow();
      if (window == null) return;
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
      navigateToRoute(window, `/settings/${message.section}`, message.state);
      return;
    }
    if (message.type === `quit-app`) {
      if (message.relaunch === true) {
        quitState?.allowQuitTemporarily();
        relaunchApp(requestDevRelaunch);
      } else {
        app.quit();
      }
      return;
    }
    if (isTrayMenuThreadsChangedMessage(message)) {
      trayMenuThreads = message.trayMenuThreads;
      await Promise.all([
        getTrayController()?.handleMessage(message),
        getDockMenuController?.()?.handleMessage(message),
      ]);
      return;
    }
    if (await globalDictationLifecycleManager.handleMessage(event, message)) return;
    const context = getContextForWebContents(event.sender);
    if (context == null) {
      logger.n().warning(`Message received for unknown window context`);
      return;
    }
    await context.handleMessage(event.sender, message);
  });

  ipcMain.handle(channels.browserSidebarMessage, async (event: Record<string, any>, payload: unknown) => {
    const parsed = parseBrowserSidebarMessage(payload);
    if (!parsed.success) {
      logger.n().warning(`Invalid browser sidebar runtime message received`);
      return;
    }
    const ownerWindow = BrowserWindow.fromWebContents(event.sender);
    if (ownerWindow == null) {
      logger.n().warning(`Browser sidebar runtime message received without owner window`);
      return;
    }
    const context = getContextForWebContents(ownerWindow.webContents);
    if (context == null) {
      logger.n().warning(`Browser sidebar runtime message received for unknown window context`);
      return;
    }
    await context.handleMessage(event.sender, parsed.data);
  });

  ipcMain.on(channels.browserPageEvent, (event: Record<string, any>, payload: Record<string, any>) => {
    if (!isBrowserPageEvent(payload)) {
      logger.n().warning(`Invalid browser page event received`);
      return;
    }
    if (guardedBrowserPageEventTypes.has(payload.type)) {
      const mainFrame = event.sender.mainFrame;
      if (event.processId !== mainFrame.processId || event.frameId !== mainFrame.routingId) return;
    }
    const ownerWindow = BrowserWindow.fromWebContents(event.sender);
    const context = ownerWindow == null ? null : getContextForWebContents(ownerWindow.webContents);
    if (context == null) {
      logger.n().warning(`Browser page event received for unknown window context`);
      return;
    }
    context.getBrowserHostManager().handlePageEvent(event.sender, payload);
  });

  ipcMain.handle(channels.codexHomeRequest, async (event: Record<string, any>, params: unknown) =>
    isTrustedIpcEvent(event) ? resolveCodexHomeRequest(params) : null,
  );
  ipcMain.handle(channels.sentryTest, (event: Record<string, any>) => {
    if (!isTrustedIpcEvent(event)) return;
    desktopSentry.captureException(Error(`Desktop Sentry test error (debug button)`), {
      tags: { trigger: `debug-button` },
    });
  });
  ipcMain.on(channels.appViewPort, (event: Record<string, any>) => {
    if (!isTrustedIpcEvent(event)) return;
    const [port] = event.ports;
    const context = getContextForWebContents(event.sender);
    const appHost = context?.createAppHost(event.sender);
    const remoteMain = createMessagePortRemoteMain(port, appHost);
    context?.registerAppView(event.sender, remoteMain).catch((error: unknown) => {
      logger.n().warning(`Failed to register AppView RPC services`, {
        safe: {},
        sensitive: { error },
      });
    });
  });
}

if (typeof module !== "undefined") {
  module.exports = { registerMainIpcRouter };
}
