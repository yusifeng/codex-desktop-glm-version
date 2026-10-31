// @ts-nocheck

const QUIT_COPY = {
  title: [`desktop.quitConfirmation.title`, `Quit {appName}?`],
  active: [
    `desktop.quitConfirmation.activeLocalTasksDetail`,
    `Active local chats on this machine will be interrupted`,
  ],
  scheduled: [
    `desktop.quitConfirmation.scheduledTasksDetail`,
    `Scheduled tasks won't run while {appName} is closed`,
  ],
  activeAndScheduled: [
    `desktop.quitConfirmation.activeLocalAndScheduledTasksDetail`,
    `Active local chats on this machine will be interrupted and scheduled tasks won't run while {appName} is closed`,
  ],
  pending: [
    `desktop.quitConfirmation.pendingWorktreeChatsDetail`,
    `Chats still starting in new worktrees may be lost, including on remote hosts`,
  ],
  pendingAndActive: [
    `desktop.quitConfirmation.pendingWorktreeAndLocalChatsDetail`,
    `Chats still starting in new worktrees may be lost, including on remote hosts. Active local chats will be interrupted`,
  ],
  pendingAndScheduled: [
    `desktop.quitConfirmation.pendingWorktreeAndScheduledTasksDetail`,
    `Chats still starting in new worktrees may be lost, including on remote hosts. Scheduled tasks won't run while {appName} is closed`,
  ],
  pendingActiveAndScheduled: [
    `desktop.quitConfirmation.pendingWorktreeLocalAndScheduledTasksDetail`,
    `Chats still starting in new worktrees may be lost, including on remote hosts. Active local chats will be interrupted and scheduled tasks won't run while {appName} is closed`,
  ],
};

/** Installs app activation, focus/background, quit confirmation, and ordered cleanup handlers. */
export function installApplicationLifecycle(options: Record<string, any>) {
  const {
    app,
    BrowserWindow,
    showMessageBoxSync,
    getNativeIntl,
    shouldBlockQuit,
    hasInProgressLocalConversation,
    getAutomations,
    observeSystemShutdown,
    armWindowsForcedExit,
    waitForContextCleanup,
    isWindows,
    disableQuitConfirmationPrompt,
    quitState,
    windows,
    applicationMenuManager,
    ensureWindow,
    hotkeyWindowLifecycleManager,
    globalDictationLifecycleManager,
    globalState,
    settingsStore,
    getPendingWorktrees,
    stopCodexMicro,
    flushTracingBeforeQuit,
    flushAndDisposeContext,
    disposables,
    appEvent,
    onAppEntrySource,
    canAttributeAppReactivation,
  } = options;
  let cleanupStarted = false;
  let appQuitting = false;

  observeSystemShutdown(() => {
    quitState.allowQuitTemporarily();
  });

  app.on(`before-quit`, (event: Record<string, any>) => {
    if (shouldBlockQuit()) {
      event.preventDefault();
      return;
    }
    const hasLocalConversation = hasInProgressLocalConversation();
    const hasPendingWorktreeChats = getPendingWorktrees()?.some(
      (worktree: Record<string, any>) =>
        worktree.launchMode !== `create-stable-worktree` &&
        worktree.phase !== `failed` &&
        worktree.conversationStartResult?.status !== `created`,
    ) ?? false;
    const hasEnabledAutomations = getAutomations().some(
      (automation: Record<string, any>) => automation.status === `ACTIVE`,
    );
    if (
      isWindows ||
      quitState.canQuitWithoutPrompt() ||
      disableQuitConfirmationPrompt ||
      (!hasLocalConversation && !hasEnabledAutomations && !hasPendingWorktreeChats)
    ) {
      appQuitting = true;
      windows.markAppQuitting();
      return;
    }

    const appName = app.getName();
    const nativeIntl = getNativeIntl();
    const title = nativeIntl.formatMessage({
      messageId: QUIT_COPY.title[0],
      defaultMessage: QUIT_COPY.title[1],
      values: { appName },
    });
    const response = showMessageBoxSync({
      type: `warning`,
      buttons: [
        nativeIntl.formatMessage({
          messageId: `desktop.quitConfirmation.quit`,
          defaultMessage: `Quit`,
        }),
        nativeIntl.formatMessage({
          messageId: `desktop.quitConfirmation.cancel`,
          defaultMessage: `Cancel`,
        }),
      ],
      defaultId: 0,
      cancelId: 1,
      noLink: true,
      title,
      message: title,
      detail: formatQuitConfirmationDetail({
        nativeIntl,
        appName,
        hasInProgressLocalConversation: hasLocalConversation,
        hasEnabledAutomations,
        hasPendingWorktreeChats,
      }),
    });
    if (response !== 0) {
      event.preventDefault();
      return;
    }
    quitState.markQuitApproved();
    appQuitting = true;
    windows.markAppQuitting();
  });

  app.on(`activate`, () => {
    if (appQuitting) return;
    if (!windows.windowManager.hasPendingAuxiliaryActivationTarget()) {
      const shouldAttribute = canAttributeAppReactivation?.() === true;
      const window = windows.showLastActivePrimaryWindow();
      if (window == null) {
        ensureWindow().then((createdWindow: Record<string, any> | null) => {
          if (shouldAttribute && createdWindow != null && !createdWindow.isDestroyed()) {
            onAppEntrySource?.(
              { channel: `shortcut`, source: `shortcut` },
              createdWindow.webContents,
            );
          }
        });
      } else if (shouldAttribute) {
        onAppEntrySource?.(
          { channel: `shortcut`, source: `shortcut` },
          window.webContents,
        );
      }
    }
    applicationMenuManager.refresh();
  });

  app.on(`browser-window-blur`, () => {
    if (BrowserWindow.getFocusedWindow() == null) appEvent.emit(`background`);
  });
  app.on(`browser-window-focus`, () => {
    appEvent.emit(`foreground`);
    applicationMenuManager.refresh();
  });
  app.on(`will-quit`, (event: Record<string, any>) => {
    appQuitting = true;
    if (cleanupStarted) return;
    if (isWindows && app.isPackaged) armWindowsForcedExit();
    const finishCleanup = () => {
      waitForContextCleanup(flushAndDisposeContext).then(() => {
        disposables.dispose();
        app.quit();
      });
    };
    event.preventDefault();
    cleanupStarted = true;
    hotkeyWindowLifecycleManager.dispose();
    globalDictationLifecycleManager.dispose();
    const cleanupTasks = quitState.shouldSkipDrainBeforeQuit()
      ? [globalState.flush(), stopCodexMicro(), flushTracingBeforeQuit()]
      : [
          globalState.flush(),
          settingsStore.flush(),
          stopCodexMicro(),
          flushTracingBeforeQuit(),
        ];
    Promise.allSettled(cleanupTasks).then(finishCleanup);
  });
}

export function formatQuitConfirmationDetail({
  nativeIntl,
  appName,
  hasInProgressLocalConversation,
  hasEnabledAutomations,
  hasPendingWorktreeChats,
}: Record<string, any>) {
  let copy;
  if (hasPendingWorktreeChats) {
    copy = hasInProgressLocalConversation && hasEnabledAutomations
      ? QUIT_COPY.pendingActiveAndScheduled
      : hasInProgressLocalConversation
        ? QUIT_COPY.pendingAndActive
        : hasEnabledAutomations
          ? QUIT_COPY.pendingAndScheduled
          : QUIT_COPY.pending;
  } else {
    copy = hasInProgressLocalConversation && hasEnabledAutomations
      ? QUIT_COPY.activeAndScheduled
      : hasInProgressLocalConversation
        ? QUIT_COPY.active
        : QUIT_COPY.scheduled;
  }
  return nativeIntl.formatMessage({
    messageId: copy[0],
    defaultMessage: copy[1],
    values: { appName },
  });
}

if (typeof module !== "undefined") {
  module.exports = { formatQuitConfirmationDetail, installApplicationLifecycle };
}
