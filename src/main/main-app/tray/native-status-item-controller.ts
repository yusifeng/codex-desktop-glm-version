// @ts-nocheck

const LABELS = {
  pinned: { messageId: `trayMenu.pinnedThreads`, defaultMessage: `Pinned` },
  unread: { messageId: `trayMenu.unreadThreads`, defaultMessage: `Unread` },
  running: { messageId: `trayMenu.runningThreads`, defaultMessage: `Running` },
};

export function resolveNativeQuitLabel(Menu: any, appName: string): string {
  const menu = Menu.buildFromTemplate([{ role: `quit` }]);
  return (Array.isArray(menu) ? menu : menu.items)[0]?.label ?? `Quit ${appName}`;
}

/** Owns the native macOS status item and its projected menu state. */
export function createNativeStatusItemControllerClass(dependencies: Record<string, any>) {
  const {
    app,
    resourcesPath,
    createStatusItemAddon,
    parseNativeEvent,
    indicatorSetting,
    projectMenuState,
    getQuitLabel,
    logger,
  } = dependencies;

  return class NativeStatusItemController {
    nativeIntl;
    appName;
    getMenuState;
    getServiceProcessIdentifier;
    onAction;
    addon;
    removeSettingsListener;
    destroyed = false;
    state = {
      computerHistoryAvailable: false,
      computerHistoryEnabled: false,
      computerHistoryIndicatorEnabled: indicatorSetting.default,
      computerUseAvailable: false,
      serviceProcessIdentifier: null,
      menuState: null,
    };
    trayMenuThreads = {
      runningThreads: [],
      unreadThreads: [],
      pinnedThreads: [],
      recentThreads: [],
      usageLimits: [],
    };

    constructor(
      iconPath: string,
      nativeIntl: any,
      appName: string,
      settingsStore: any,
      getMenuState: () => Promise<Record<string, any>>,
      getServiceProcessIdentifier: () => number | null,
      onAction: (event: Record<string, any>) => Promise<void>,
    ) {
      this.nativeIntl = nativeIntl;
      this.appName = appName;
      this.getMenuState = getMenuState;
      this.getServiceProcessIdentifier = getServiceProcessIdentifier;
      this.onAction = onAction;
      this.addon = createStatusItemAddon({
        electronAppPath: app.getAppPath(),
        resourcesPath,
      });
      if (
        !this.addon.createStatusItem(iconPath, (serializedEvent: string) => {
          const parsed = parseNativeEvent(JSON.parse(serializedEvent));
          if (parsed.success) this.handleNativeEvent(parsed.data);
        })
      ) {
        throw Error(`Failed to create the native macOS status item`);
      }
      const refreshIndicatorSetting = () => {
        this.state.computerHistoryIndicatorEnabled =
          settingsStore.getEffective(indicatorSetting.key) ?? indicatorSetting.default;
        this.refreshMenu();
      };
      this.removeSettingsListener = settingsStore.onDidChange(
        indicatorSetting.key,
        refreshIndicatorSetting,
      );
      refreshIndicatorSetting();
      this.updateMenuState();
    }

    destroy() {
      this.destroyed = true;
      this.removeSettingsListener();
      this.addon.destroyStatusItem();
      app.endNativeMenuTracking();
    }

    isReady() {
      return !this.destroyed;
    }

    waitForReady() {
      return Promise.resolve(this.isReady());
    }

    async handleMessage(message: Record<string, any>) {
      this.trayMenuThreads = message.trayMenuThreads;
      this.refreshMenu();
    }

    refreshMenu() {
      if (this.destroyed) return;
      this.addon.updateStatusItemMenuState(
        JSON.stringify(
          projectMenuState({
            appName: this.appName,
            computerHistoryAvailable: this.state.computerHistoryAvailable,
            computerHistoryEnabled: this.state.computerHistoryEnabled,
            computerHistoryIndicatorEnabled:
              this.state.computerHistoryIndicatorEnabled,
            computerUseAvailable: this.state.computerUseAvailable,
            menuState: this.state.menuState,
            trayMenuThreads: this.trayMenuThreads,
            labels: {
              pinned: this.nativeIntl.formatMessage(LABELS.pinned),
              unread: this.nativeIntl.formatMessage(LABELS.unread),
              running: this.nativeIntl.formatMessage(LABELS.running),
              quit: getQuitLabel(this.appName),
            },
          }),
        ),
      );
    }

    handleNativeEvent(event: Record<string, any>) {
      if (event.type === `menu-update`) {
        this.updateMenuState();
        return;
      }
      if (event.type === `menu-open`) {
        app.beginNativeMenuTracking();
        return;
      }
      if (event.type === `menu-close`) {
        app.endNativeMenuTracking();
        return;
      }
      if (event.type === `service-state-changed`) {
        if (event.processIdentifier !== this.getServiceProcessIdentifier()) return;
        this.addon.updateStatusItemState(
          event.computerUseActive,
          event.computerHistoryState === `running`,
        );
        this.updateMenuState();
        return;
      }
      this.onAction(event).catch((error: unknown) => {
        logger.n().warning(`Failed to handle a native menu-bar action`, {
          safe: { action: event.type },
          sensitive: { error },
        });
      });
    }

    async updateMenuState() {
      try {
        Object.assign(this.state, await this.getMenuState());
      } catch (error) {
        logger.n().warning(`Failed to load the native menu-bar state`, {
          safe: {},
          sensitive: { error },
        });
      }
      if (!this.destroyed) this.refreshMenu();
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createNativeStatusItemControllerClass, resolveNativeQuitLabel };
}
