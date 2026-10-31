// @ts-nocheck

const DIRECT_THREAD_ITEMS = 3;
const THREAD_TITLE_MAX_CHARS = 35;
const LABELS = {
  more: { messageId: `trayMenu.more`, defaultMessage: `More` },
  projectless: { messageId: `trayMenu.projectlessThreads`, defaultMessage: `Chats` },
  running: { messageId: `trayMenu.runningThreads`, defaultMessage: `Running` },
  unread: { messageId: `trayMenu.unreadThreads`, defaultMessage: `Unread` },
  pinned: { messageId: `trayMenu.pinnedThreads`, defaultMessage: `Pinned` },
  recent: { messageId: `trayMenu.recentThreads`, defaultMessage: `Recent` },
  usage: { messageId: `trayMenu.usage`, defaultMessage: `Usage` },
  newChat: { messageId: `trayMenu.newChat`, defaultMessage: `New Chat` },
  openApp: { messageId: `trayMenu.openApp`, defaultMessage: `Open {appName}` },
};

export function isTrayMenuThreadsChangedMessage(message: Record<string, any>) {
  return message.type === `tray-menu-threads-changed`;
}

/** Owns the native Electron tray menu and platform-specific click behavior. */
export function createTrayMenuControllerClass(dependencies: Record<string, any>) {
  const {
    Menu,
    app,
    platform = process.platform,
    setTimeoutImpl = setTimeout,
    clearTimeoutImpl = clearTimeout,
  } = dependencies;

  return class TrayMenuController {
    tray;
    onOpenMainWindow;
    onTrayMenuOpenNewThread;
    onTrayMenuOpenRecentThread;
    onTrayMenuSendFeedback;
    nativeIntl;
    appName;
    cachedWindowsTrayMenu = null;
    nativeTrayClickSuppressionReason = null;
    clearNativeTrayClickSuppressionTimeout = null;
    isNativeTrayMenuOpen = false;
    systemQuitMenuItemLabel;
    trayMenuThreads = {
      runningThreads: [],
      unreadThreads: [],
      pinnedThreads: [],
      recentThreads: [],
      usageLimits: [],
    };

    constructor(
      tray: any,
      onOpenMainWindow: () => void,
      onTrayMenuOpenNewThread: () => void,
      onTrayMenuOpenRecentThread: (path: string) => void,
      onTrayMenuSendFeedback: () => void,
      nativeIntl: any,
      appName: string,
    ) {
      this.tray = tray;
      this.onOpenMainWindow = onOpenMainWindow;
      this.onTrayMenuOpenNewThread = onTrayMenuOpenNewThread;
      this.onTrayMenuOpenRecentThread = onTrayMenuOpenRecentThread;
      this.onTrayMenuSendFeedback = onTrayMenuSendFeedback;
      this.nativeIntl = nativeIntl;
      this.appName = appName;
      this.systemQuitMenuItemLabel = getSystemQuitMenuItemLabel(Menu, appName);
      this.refreshCachedWindowsTrayMenu();

      if (platform === `linux`) {
        this.tray.on(`click`, () => this.onOpenMainWindow());
        this.updatePersistentTrayMenu();
        return;
      }
      if (platform === `darwin`) {
        this.tray.on(`mouse-down`, () => {
          this.clearPendingNativeTrayClickSuppression();
          if (this.isNativeTrayMenuOpen) {
            this.nativeTrayClickSuppressionReason = `close`;
            return;
          }
          this.nativeTrayClickSuppressionReason = `open`;
          this.openNativeTrayMenu();
        });
        this.tray.on(`click`, () => {
          if (!this.consumeIgnoredNativeTrayClick()) this.openNativeTrayMenu();
        });
        this.tray.on(`right-click`, () => {
          if (!this.consumeIgnoredNativeTrayClick()) this.openNativeTrayMenu();
        });
        return;
      }
      this.tray.on(`click`, () => this.onOpenMainWindow());
      this.tray.on(`right-click`, () => this.openNativeTrayMenu());
    }

    destroy() {
      this.tray.destroy();
    }

    isReady() {
      return this.tray.isReady();
    }

    async waitForReady() {
      try {
        await this.tray.whenReady();
        return true;
      } catch {
        return false;
      }
    }

    async handleMessage(message: Record<string, any>) {
      if (isTrayMenuThreadsChangedMessage(message)) {
        this.trayMenuThreads = message.trayMenuThreads;
        this.refreshMenu();
      }
    }

    refreshMenu() {
      this.refreshCachedWindowsTrayMenu();
      this.updatePersistentTrayMenu();
    }

    consumeIgnoredNativeTrayClick() {
      if (this.nativeTrayClickSuppressionReason == null) return false;
      this.clearNativeTrayClickSuppression();
      return true;
    }

    openNativeTrayMenu() {
      const menu =
        this.cachedWindowsTrayMenu ?? Menu.buildFromTemplate(this.getNativeTrayMenuItems());
      menu.once(`menu-will-show`, () => {
        this.isNativeTrayMenuOpen = true;
      });
      menu.once(`menu-will-close`, () => {
        this.isNativeTrayMenuOpen = false;
        this.handleNativeTrayMenuClosed();
      });
      this.tray.popUpContextMenu(menu);
    }

    refreshCachedWindowsTrayMenu() {
      if (platform !== `win32`) {
        this.cachedWindowsTrayMenu = null;
        return;
      }
      this.cachedWindowsTrayMenu = Menu.buildFromTemplate(this.getNativeTrayMenuItems());
    }

    updatePersistentTrayMenu() {
      if (platform === `linux`) {
        this.tray.setContextMenu(Menu.buildFromTemplate(this.getNativeTrayMenuItems()));
      }
    }

    handleNativeTrayMenuClosed() {
      if (this.nativeTrayClickSuppressionReason !== `close`) {
        this.clearNativeTrayClickSuppression();
        return;
      }
      this.clearPendingNativeTrayClickSuppression();
      this.clearNativeTrayClickSuppressionTimeout = setTimeoutImpl(() => {
        if (this.nativeTrayClickSuppressionReason === `close`) {
          this.clearNativeTrayClickSuppression();
        }
      }, 0);
      this.clearNativeTrayClickSuppressionTimeout.unref?.();
    }

    clearPendingNativeTrayClickSuppression() {
      if (this.clearNativeTrayClickSuppressionTimeout != null) {
        clearTimeoutImpl(this.clearNativeTrayClickSuppressionTimeout);
        this.clearNativeTrayClickSuppressionTimeout = null;
      }
    }

    clearNativeTrayClickSuppression() {
      this.clearPendingNativeTrayClickSuppression();
      this.nativeTrayClickSuppressionReason = null;
    }

    getNativeTrayMenuItems() {
      const {
        pinnedThreads,
        recentThreads,
        runningThreads,
        unreadThreads,
        usageLimits,
      } = this.trayMenuThreads;
      const projectlessLabel = this.nativeIntl.formatMessage(LABELS.projectless);
      const moreLabel = this.nativeIntl.formatMessage(LABELS.more);
      const sections = [
        buildThreadSection({
          label: this.nativeIntl.formatMessage(LABELS.running),
          moreLabel,
          threads: runningThreads,
          projectlessLabel,
          onOpenThread: this.onTrayMenuOpenRecentThread,
        }),
        buildThreadSection({
          label: this.nativeIntl.formatMessage(LABELS.unread),
          moreLabel,
          threads: unreadThreads,
          projectlessLabel,
          onOpenThread: this.onTrayMenuOpenRecentThread,
        }),
        buildThreadSection({
          label: this.nativeIntl.formatMessage(LABELS.pinned),
          moreLabel,
          threads: pinnedThreads,
          projectlessLabel,
          onOpenThread: this.onTrayMenuOpenRecentThread,
        }),
        buildThreadSection({
          label: this.nativeIntl.formatMessage(LABELS.recent),
          moreLabel,
          threads: recentThreads,
          projectlessLabel,
          onOpenThread: this.onTrayMenuOpenRecentThread,
        }),
        platform !== `darwin` || usageLimits.length === 0
          ? []
          : [
              { label: this.nativeIntl.formatMessage(LABELS.usage), enabled: false },
              ...usageLimits.map(({ label }: Record<string, any>) => ({
                label,
                enabled: false,
              })),
            ],
      ]
        .filter((section) => section.length > 0)
        .flatMap((section, index) =>
          index === 0 ? section : [{ type: `separator` }, ...section],
        );

      return [
        ...sections,
        ...(sections.length > 0 ? [{ type: `separator` }] : []),
        {
          label: this.nativeIntl.formatMessage(LABELS.newChat),
          click: () => this.onTrayMenuOpenNewThread(),
        },
        ...(platform === `win32`
          ? [{ label: `Send Feedback`, click: () => this.onTrayMenuSendFeedback() }]
          : []),
        { type: `separator` },
        ...(platform === `win32`
          ? []
          : [
              {
                label: this.nativeIntl.formatMessage({
                  ...LABELS.openApp,
                  values: { appName: this.appName },
                }),
                click: () => this.onOpenMainWindow(),
              },
              { type: `separator` },
            ]),
        { label: this.systemQuitMenuItemLabel, click: () => app.quit() },
      ];
    }
  };
}

function buildThreadSection({
  label,
  moreLabel,
  threads,
  projectlessLabel,
  onOpenThread,
}: Record<string, any>) {
  if (threads.length === 0) return [];
  const direct = threads.slice(0, DIRECT_THREAD_ITEMS);
  const overflow = threads.slice(DIRECT_THREAD_ITEMS);
  return [
    { label, enabled: false },
    ...direct.map((thread: Record<string, any>) =>
      buildThreadItem({ thread, projectlessLabel, onOpenThread }),
    ),
    ...(overflow.length > 0
      ? [
          {
            label: moreLabel,
            submenu: overflow.map((thread: Record<string, any>) =>
              buildThreadItem({ thread, projectlessLabel, onOpenThread }),
            ),
          },
        ]
      : []),
  ];
}

function buildThreadItem({ thread, projectlessLabel, onOpenThread }: Record<string, any>) {
  const titleCharacters = Array.from(thread.title);
  return {
    label:
      titleCharacters.length <= THREAD_TITLE_MAX_CHARS
        ? thread.title
        : `${titleCharacters.slice(0, 34).join(``).trimEnd()}…`,
    sublabel: thread.isProjectless ? projectlessLabel : thread.projectLabel,
    click: () => onOpenThread(thread.path),
  };
}

function getSystemQuitMenuItemLabel(Menu: any, appName: string) {
  const menu = Menu.buildFromTemplate([{ role: `quit` }]);
  return (Array.isArray(menu) ? menu : menu.items)[0]?.label ?? `Quit ${appName}`;
}

if (typeof module !== "undefined") {
  module.exports = {
    createTrayMenuControllerClass,
    isTrayMenuThreadsChangedMessage,
  };
}
