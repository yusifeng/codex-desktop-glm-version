interface RemoteHostedPipBindingsOptions {
  manager: {
    handleGlobalHiddenChanged(): void;
    onContentHostStarted(listener: () => void): () => void;
    reconcileContentHostLifecycle(): void;
    setPetWakeRequestHandler(handler: () => void): void;
    setWindowMessageSender(sender: (message: unknown) => void): void;
  };
  logger: {
    warning(message: string, fields: { safe: Record<string, unknown>; sensitive: Record<string, unknown> }): void;
  };
  reconcileOverlayContentHost(): void;
  registerDispose(dispose: () => void): void;
  sendWindowMessage(message: unknown): void;
  settingsStore: { onDidChange(key: unknown, listener: () => void): () => void };
  hiddenSettingKey: unknown;
  wakeOverlay(): Promise<unknown>;
}

/** Installs the settings/window/overlay adapters around the existing RemoteHostedPipManager owner. */
export function installRemoteHostedPipBindings(options: RemoteHostedPipBindingsOptions) {
  const {
    hiddenSettingKey,
    logger,
    manager,
    reconcileOverlayContentHost,
    registerDispose,
    sendWindowMessage,
    settingsStore,
    wakeOverlay,
  } = options;
  manager.setWindowMessageSender(sendWindowMessage);
  registerDispose(settingsStore.onDidChange(hiddenSettingKey, manager.handleGlobalHiddenChanged));
  manager.setPetWakeRequestHandler(() => {
    wakeOverlay().catch((error) => {
      logger.warning(`Failed to wake pet for PiP placement request`, {
        safe: {},
        sensitive: { error },
      });
    });
  });
  registerDispose(manager.onContentHostStarted(reconcileOverlayContentHost));
  manager.reconcileContentHostLifecycle();
}
