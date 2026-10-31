type RpcBaseConstructor = new (...args: any[]) => any;

type MenuItem = {
  commandId: number;
  type: string;
  visible: boolean;
  enabled: boolean;
  label: string;
  accelerator?: string;
  submenu?: { items: MenuItem[] } | null;
  click: (...args: unknown[]) => unknown;
};

type WebContents = {
  id: number;
  isDestroyed(): boolean;
  hostWebContents?: WebContents | null;
};

type GlobalState = {
  get(key: unknown): unknown;
  set(key: unknown, value: unknown): void;
  flushOrThrow(): Promise<void>;
};

type DesktopCapabilityDependencies = {
  RpcHandlerBase: RpcBaseConstructor;
  electron: {
    app: {
      getVersion(): string;
      getLocale(): string;
      getPreferredSystemLanguages(): string[];
    };
    BrowserWindow: {
      fromWebContents(origin: WebContents): unknown | null;
    };
    dialog: {
      showMessageBox(...args: unknown[]): Promise<{ response: number }>;
    };
    Menu: {
      getApplicationMenu(): {
        getMenuItemById(id: string): { submenu?: { items: MenuItem[] } | null } | null;
      } | null;
    };
    screen: {
      getPrimaryDisplay(): { size: { height: number; width: number }; scaleFactor: number };
    };
    webContents: {
      getFocusedWebContents(): WebContents | null;
    };
  };
  menuSectionIds: { file: string; edit: string; view: string; help: string };
  persistedStateKey: unknown;
  updateResumeStateKey: string;
  parseThreadId(value: string): string;
  parseVersion(value: string): { version: string };
  getBuildNumber(): string;
  getReleaseChannel(): string | null | undefined;
  getDefaultReleaseChannel(): string;
  getNativeIntl(): {
    formatMessage(input: {
      messageId: string;
      defaultMessage: string;
      values?: Record<string, string>;
    }): string;
  };
  isRemoteControlSessionActive(): boolean;
  appSessionId: string;
  platform?: NodeJS.Platform;
  timezone?: string;
};

type UpdateResumeState = {
  accountId: string;
  userId: string;
  threadIds: string[];
  expiresAtMs: number;
};

type NativeMenuEntry =
  | { type: "separator"; nativeCommandId: number }
  | {
      type: "item";
      nativeCommandId: number;
      label: string;
      accelerator?: string;
      enabled: boolean;
    }
  | {
      type: "submenu";
      nativeCommandId: number;
      label: string;
      enabled: boolean;
      items: NativeMenuEntry[];
    };

function parseUpdateResumeState(
  value: unknown,
  parseThreadId: (value: string) => string,
): UpdateResumeState | null {
  if (typeof value !== "object" || value == null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.accountId !== "string" ||
    typeof record.userId !== "string" ||
    !Array.isArray(record.threadIds) ||
    !record.threadIds.every((threadId) => typeof threadId === "string") ||
    typeof record.expiresAtMs !== "number" ||
    !Number.isFinite(record.expiresAtMs)
  ) {
    return null;
  }
  try {
    return {
      accountId: record.accountId,
      userId: record.userId,
      threadIds: record.threadIds.map((threadId) => parseThreadId(threadId as string)),
      expiresAtMs: record.expiresAtMs,
    };
  } catch {
    return null;
  }
}

function projectMenuItems(items: MenuItem[], commandItems: Map<number, MenuItem>): NativeMenuEntry[] {
  return items.flatMap<NativeMenuEntry>((item) => {
    if (!item.visible) return [];
    if (item.type === "separator")
      return [{ type: "separator" as const, nativeCommandId: item.commandId }];
    commandItems.set(item.commandId, item);
    if (item.submenu == null) {
      return item.type === "normal"
        ? [
            {
              type: "item" as const,
              nativeCommandId: item.commandId,
              label: item.label,
              accelerator: item.accelerator,
              enabled: item.enabled,
            },
          ]
        : [];
    }
    return [
      {
        type: "submenu" as const,
        nativeCommandId: item.commandId,
        label: item.label,
        enabled: item.enabled,
        items: projectMenuItems(item.submenu.items, commandItems),
      },
    ];
  });
}

export function projectDesktopEnvironmentSignals(
  appSessionId: string,
  screenHeight: number,
  screenWidth: number,
  screenScale: number,
  locale: string,
  preferredLanguages: string[],
  timezone: string,
) {
  const safeLocale = (locale || "unknown").slice(0, 64);
  return {
    schemaVersion: 1,
    preferredLanguages: (preferredLanguages.length > 0 ? preferredLanguages : [safeLocale])
      .slice(0, 16)
      .map((language) => language.slice(0, 64)),
    locale: safeLocale,
    timezone: (timezone || "unknown").slice(0, 64),
    screenSizeSum: Math.max(0, Math.round(screenWidth + screenHeight)),
    screenScale,
    appSessionId: appSessionId.slice(0, 128),
  };
}

/** Builds the renderer-facing desktop capability services owned by WindowContext. */
export function createDesktopCapabilityServices(dependencies: DesktopCapabilityDependencies) {
  const platform = dependencies.platform ?? process.platform;
  const timezone =
    dependencies.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  class AppUpdateService extends dependencies.RpcHandlerBase {
    constructor(
      private readonly windowManager: { getPrimaryWindow(): unknown | null },
      private readonly origin: WebContents,
      private readonly sparkleManager: {
        checkForUpdates(): void;
        checkForUpdateInformation(): Promise<Record<string, unknown>>;
        setSparkleQueryParams(params: unknown): void;
        installUpdatesIfAvailable(): void;
      },
      private readonly globalState: GlobalState,
    ) {
      super();
    }

    checkForUpdates() {
      this.sparkleManager.checkForUpdates();
    }

    async checkForUpdateInformation() {
      return {
        installedVersion: dependencies.parseVersion(
          dependencies.electron.app.getVersion(),
        ).version,
        installedBuildVersion: dependencies.getBuildNumber(),
        installedReleaseChannel:
          dependencies.getReleaseChannel() ?? dependencies.getDefaultReleaseChannel(),
        ...(await this.sparkleManager.checkForUpdateInformation()),
      };
    }

    setSparkleQueryParams(params: unknown) {
      this.sparkleManager.setSparkleQueryParams(params);
    }

    async takeResumeState(): Promise<UpdateResumeState | null> {
      const persisted = this.globalState.get(dependencies.persistedStateKey);
      const state =
        typeof persisted === "object" && persisted != null && !Array.isArray(persisted)
          ? (persisted as Record<string, unknown>)[dependencies.updateResumeStateKey]
          : undefined;
      if (state == null) return null;
      this.globalState.set(dependencies.persistedStateKey, {
        ...(persisted as Record<string, unknown>),
        [dependencies.updateResumeStateKey]: null,
      });
      await this.globalState.flushOrThrow();
      return parseUpdateResumeState(state, dependencies.parseThreadId);
    }

    async installUpdate() {
      if (platform === "darwin" && dependencies.isRemoteControlSessionActive()) {
        const parent =
          dependencies.electron.BrowserWindow.fromWebContents(this.origin) ??
          this.windowManager.getPrimaryWindow();
        const intl = dependencies.getNativeIntl();
        const title = intl.formatMessage({
          messageId: "appHeader.installUpdate.confirmTitle",
          defaultMessage: "Update {appName} now?",
          values: { appName: "ChatGPT" },
        });
        const options = {
          type: "warning",
          buttons: [
            intl.formatMessage({
              messageId: "appHeader.installUpdate.confirmInstall",
              defaultMessage: "Update",
            }),
            intl.formatMessage({
              messageId: "appHeader.installUpdate.confirmCancel",
              defaultMessage: "Cancel",
            }),
          ],
          defaultId: 0,
          cancelId: 1,
          noLink: true,
          title,
          message: title,
          detail: intl.formatMessage({
            messageId: "appHeader.installUpdate.confirmSubtitle",
            defaultMessage:
              "{appName} will quit to install the update, which will interrupt active local sessions on this machine",
            values: { appName: "ChatGPT" },
          }),
        };
        const result =
          parent == null
            ? await dependencies.electron.dialog.showMessageBox(options)
            : await dependencies.electron.dialog.showMessageBox(parent, options);
        if (result.response !== 0) return;
      }
      this.sparkleManager.installUpdatesIfAvailable();
    }
  }

  class ApplicationMenuSnapshotService extends dependencies.RpcHandlerBase {
    private readonly menuItemsByCommandId = new Map<number, MenuItem>();

    constructor(private readonly owner: WebContents) {
      super();
    }

    getSnapshot() {
      this.menuItemsByCommandId.clear();
      const menu = dependencies.electron.Menu.getApplicationMenu();
      if (menu == null) return null;
      const section = (id: string) =>
        projectMenuItems(
          menu.getMenuItemById(id)?.submenu?.items ?? [],
          this.menuItemsByCommandId,
        );
      const ids = dependencies.menuSectionIds;
      return {
        [ids.file]: section(ids.file),
        [ids.edit]: section(ids.edit),
        [ids.view]: section(ids.view),
        [ids.help]: section(ids.help),
      };
    }

    invokeItem(commandId: unknown) {
      if (typeof commandId !== "number" || !Number.isInteger(commandId)) return;
      const item = this.menuItemsByCommandId.get(commandId);
      if (item == null || !item.enabled || !item.visible) return;
      const focused = dependencies.electron.webContents.getFocusedWebContents();
      const invocationTarget =
        focused != null &&
        !focused.isDestroyed() &&
        (focused === this.owner || focused.hostWebContents === this.owner)
          ? focused
          : this.owner;
      Reflect.apply(item.click, item, [
        { triggeredByAccelerator: false },
        dependencies.electron.BrowserWindow.fromWebContents(this.owner) ?? undefined,
        invocationTarget,
      ]);
    }
  }

  class AppshotCapabilityService extends dependencies.RpcHandlerBase {
    constructor(
      private readonly hotkeysService: {
        getState(): unknown;
        setHotkey(value: unknown): unknown;
      },
      private readonly requestFinalUpdateImpl: (request: unknown) => unknown,
    ) {
      super();
    }

    getState() {
      return this.hotkeysService.getState();
    }

    setHotkey(value: unknown) {
      return this.hotkeysService.setHotkey(value);
    }

    requestFinalUpdate(request: unknown) {
      return this.requestFinalUpdateImpl(request);
    }
  }

  function getDesktopEnvironmentSignals() {
    const display = dependencies.electron.screen.getPrimaryDisplay();
    return projectDesktopEnvironmentSignals(
      dependencies.appSessionId,
      display.size.height,
      display.size.width,
      display.scaleFactor,
      dependencies.electron.app.getLocale(),
      dependencies.electron.app.getPreferredSystemLanguages(),
      timezone,
    );
  }

  return {
    AppUpdateService,
    ApplicationMenuSnapshotService,
    AppshotCapabilityService,
    getDesktopEnvironmentSignals,
  };
}
