import { isDoubleModifierShortcut } from "./appshot-shortcut";

type Logger = {
  info(message: string, context: unknown): void;
  warning(message: string, context: unknown): void;
};

type Registration = {
  unregister(): void;
};

type TimeoutHandle = ReturnType<typeof setTimeout> & {
  refresh(): void;
  unref(): TimeoutHandle;
};

type WebContentsLike = {
  id: number;
  getBackgroundThrottling(): boolean;
  isDestroyed(): boolean;
  setBackgroundThrottling(enabled: boolean): void;
};

type WindowLike = {
  id: number;
  isDestroyed(): boolean;
  webContents: WebContentsLike;
};

type HotkeyState = {
  configuredHotkey: string | null;
  isActive: boolean;
  supported: boolean;
};

type SetHotkeyResult =
  | { error: string; state: HotkeyState; success: false }
  | { state: HotkeyState; success: true };

type WindowsCaptureNativeBridge = {
  claimHotkeyFlight(webContents: WebContentsLike): void;
  registerHotkey(
    hotkey: string,
    handlers: {
      onPressed(): void;
      onRegistrationFailed(): void;
      onReleased(): void;
    },
  ): Registration | null;
  release(): Promise<unknown>;
};

type AppshotHotkeyManagerDependencies = {
  destinationSettingKey: unknown;
  globalState: {
    getStored(key: string): unknown;
    set(key: string, value: unknown): void;
  };
  handleQuickChatAppshotShortcut: ((payload: null) => boolean) | null | undefined;
  logger(): Logger;
  onSupportChanged: (() => void) | null | undefined;
  platform: NodeJS.Platform | string;
  registerGlobalHotkey(
    hotkey: string,
    handlers: { onPressed(): void },
    options: { bareModifierTrigger: "immediatePress" },
  ): Registration | null;
  setTimeout(callback: () => void, delayMs: number): TimeoutHandle;
  settingsStore: {
    getEffective(key: unknown): unknown;
  };
  validateBareModifierHotkey(
    hotkey: string,
    options: { bareModifierTrigger: "immediatePress" },
  ): void;
  validateHotkey(hotkey: string): string | null;
  windowManager: {
    getAppShellShortcutState(webContentsId: number):
      | { canAcceptAppshotShortcut?: boolean; isNewChatRoute?: boolean }
      | null
      | undefined;
    getPrimaryWindow(): WindowLike | null | undefined;
    sendMessageToWindow(window: WindowLike, message: unknown): void;
    wasPrimaryWindowFocusedWithin(window: WindowLike, durationMs: number): boolean;
  };
  windowsCaptureNativeBridge: WindowsCaptureNativeBridge | null;
};

const DEFAULT_MAC_HOTKEY = "DoubleCommand";
const DEFAULT_WINDOWS_HOTKEY = "DoubleAlt";
const RECENT_FOCUS_WINDOW_MS = 60_000;
const RENDERER_PRIORITY_LEASE_MS = 2_000;

/** Owns Appshot hotkey registration, dispatch routing, and renderer priority lifetime. */
export class AppshotHotkeyManager {
  private configuredHotkey: string | null;
  private enabled: boolean;
  private readonly dependencies: AppshotHotkeyManagerDependencies;
  private registration: Registration | null = null;
  private rendererPriority: {
    previousBackgroundThrottling: boolean;
    timeout: TimeoutHandle;
    webContents: WebContentsLike;
  } | null = null;
  private windowsCaptureNativeBridgeFailed = false;
  private windowsShortcutDispatchedOnDown = false;

  constructor(dependencies: AppshotHotkeyManagerDependencies & { enabled: boolean }) {
    this.dependencies = dependencies;
    this.enabled = dependencies.enabled;
    const stored = dependencies.globalState.getStored("appshotHotkey");
    this.configuredHotkey =
      stored === undefined
        ? dependencies.platform === "win32"
          ? DEFAULT_WINDOWS_HOTKEY
          : DEFAULT_MAC_HOTKEY
        : (stored as string | null);
    try {
      this.reconcileRegistration();
    } catch (error) {
      dependencies.logger().warning("Failed to register appshot hotkey", {
        safe: {},
        sensitive: { error },
      });
    }
  }

  readonly dispose = (): void => {
    this.registration?.unregister();
    this.registration = null;
    this.clearRendererPriority();
  };

  async setEnabled(enabled: boolean): Promise<void> {
    if (this.enabled === enabled) return;
    if (enabled) this.windowsCaptureNativeBridgeFailed = false;
    this.enabled = enabled;
    try {
      this.reconcileRegistration();
    } catch (error) {
      this.dependencies.logger().warning("Failed to reconcile appshot hotkey availability", {
        safe: { enabled },
        sensitive: { error },
      });
    }
    this.dependencies.onSupportChanged?.();
    if (!enabled) await this.dependencies.windowsCaptureNativeBridge?.release();
  }

  getState(): HotkeyState {
    return {
      supported:
        this.enabled &&
        (this.dependencies.platform === "darwin" ||
          (this.dependencies.platform === "win32" &&
            this.dependencies.windowsCaptureNativeBridge != null &&
            !this.windowsCaptureNativeBridgeFailed)),
      configuredHotkey: this.configuredHotkey,
      isActive: this.registration != null,
    };
  }

  setHotkey(hotkey: string | null): SetHotkeyResult {
    if (!this.getState().supported) {
      return { success: false, error: "Not supported.", state: this.getState() };
    }
    if (hotkey != null) {
      const validationError =
        this.dependencies.platform === "win32" && isDoubleModifierShortcut(hotkey)
          ? null
          : this.dependencies.validateHotkey(hotkey);
      if (validationError != null) {
        return { success: false, error: validationError, state: this.getState() };
      }
    }
    const previousHotkey = this.configuredHotkey;
    this.configuredHotkey = hotkey;
    try {
      this.reconcileRegistration();
    } catch (error) {
      this.configuredHotkey = previousHotkey;
      try {
        this.reconcileRegistration();
      } catch (rollbackError) {
        this.dependencies.logger().warning(
          "Failed to restore appshot hotkey after update failure",
          { safe: {}, sensitive: { rollbackError } },
        );
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        state: this.getState(),
      };
    }
    this.dependencies.globalState.set("appshotHotkey", this.configuredHotkey);
    return { success: true, state: this.getState() };
  }

  private reconcileRegistration(): void {
    this.registration?.unregister();
    this.registration = null;
    this.windowsShortcutDispatchedOnDown = false;
    this.clearRendererPriority();
    if (!this.getState().supported || this.configuredHotkey == null) {
      this.dependencies.logger().info("Appshot hotkey inactive", {
        safe: {
          enabled: this.enabled,
          platform: this.dependencies.platform,
          configured: this.configuredHotkey != null,
        },
        sensitive: {},
      });
      return;
    }

    this.dependencies.logger().info("Registering appshot hotkey", {
      safe: { hotkey: this.configuredHotkey },
      sensitive: {},
    });
    if (
      this.dependencies.platform === "win32" &&
      isDoubleModifierShortcut(this.configuredHotkey)
    ) {
      this.registration =
        this.dependencies.windowsCaptureNativeBridge?.registerHotkey(this.configuredHotkey, {
          onPressed: () => this.handleWindowsPressed(),
          onReleased: () => this.handleWindowsReleased(),
          onRegistrationFailed: () => {
            this.windowsCaptureNativeBridgeFailed = true;
            this.registration = null;
            this.windowsShortcutDispatchedOnDown = false;
            this.clearRendererPriority();
            this.dependencies.onSupportChanged?.();
          },
        }) ?? null;
      if (this.registration == null) {
        throw Error(`Unable to register shortcut: ${this.configuredHotkey}`);
      }
      return;
    }

    if (this.dependencies.platform === "darwin") {
      this.dependencies.validateBareModifierHotkey(this.configuredHotkey, {
        bareModifierTrigger: "immediatePress",
      });
    }
    this.registration = this.dependencies.registerGlobalHotkey(
      this.configuredHotkey,
      { onPressed: () => this.handlePressed() },
      { bareModifierTrigger: "immediatePress" },
    );
    if (this.registration == null) {
      throw Error(`Unable to register shortcut: ${this.configuredHotkey}`);
    }
    this.dependencies.logger().info("Registered appshot hotkey", {
      safe: { hotkey: this.configuredHotkey },
      sensitive: {},
    });
  }

  private handleWindowsPressed(): void {
    this.windowsShortcutDispatchedOnDown = false;
    const window = this.dependencies.windowManager.getPrimaryWindow();
    if (window == null || window.isDestroyed()) return;
    this.raiseRendererPriority(window);
    this.dependencies.windowsCaptureNativeBridge?.claimHotkeyFlight(window.webContents);
    if (this.canDispatchToCurrentRoute(window)) {
      this.windowsShortcutDispatchedOnDown = true;
      this.dispatch(window, true);
    }
  }

  private handleWindowsReleased(): void {
    if (this.windowsShortcutDispatchedOnDown) {
      this.windowsShortcutDispatchedOnDown = false;
      return;
    }
    this.handlePressed();
  }

  private handlePressed(): void {
    this.dependencies.logger().info("Appshot hotkey pressed", {
      safe: { hotkey: this.configuredHotkey },
      sensitive: {},
    });
    const destination = this.getDestination();
    const window = this.dependencies.windowManager.getPrimaryWindow();
    const canDispatchToCurrentRoute =
      window != null && !window.isDestroyed() && this.canDispatchToCurrentRoute(window);
    if (
      destination !== "automatic" ||
      (canDispatchToCurrentRoute &&
        (window == null ||
          this.dependencies.windowManager.getAppShellShortcutState(window.webContents.id)
            ?.isNewChatRoute !== true)) ||
      !this.dependencies.handleQuickChatAppshotShortcut?.(null)
    ) {
      if (window == null || window.isDestroyed()) {
        this.dependencies.logger().info("Appshot hotkey skipped", {
          safe: { reason: window == null ? "no-primary-window" : "primary-window-destroyed" },
          sensitive: {},
        });
        return;
      }
      this.dispatch(window, canDispatchToCurrentRoute);
    }
  }

  private dispatch(window: WindowLike, currentRoute: boolean): void {
    const destination = this.getDestination();
    this.dependencies.logger().info("Dispatching appshot hotkey", {
      safe: {
        target: currentRoute ? "current-route" : "new-chat",
        destination,
        windowId: window.id,
      },
      sensitive: {},
    });
    this.dependencies.windowManager.sendMessageToWindow(
      window,
      currentRoute ? { type: "appshot-shortcut" } : { type: "new-chat-with-appshot" },
    );
  }

  private canDispatchToCurrentRoute(window: WindowLike): boolean {
    const shortcutState = this.dependencies.windowManager.getAppShellShortcutState(
      window.webContents.id,
    );
    if (shortcutState?.canAcceptAppshotShortcut !== true) return false;
    switch (this.getDestination()) {
      case "automatic":
        return this.dependencies.windowManager.wasPrimaryWindowFocusedWithin(
          window,
          RECENT_FOCUS_WINDOW_MS,
        );
      case "last-chat":
        return true;
      case "new-chat":
        return shortcutState.isNewChatRoute === true;
    }
    return false;
  }

  private getDestination(): unknown {
    return this.dependencies.settingsStore.getEffective(
      this.dependencies.destinationSettingKey,
    ) ?? "automatic";
  }

  private raiseRendererPriority(window: WindowLike): void {
    const webContents = window.webContents;
    if (this.rendererPriority?.webContents === webContents) {
      this.rendererPriority.timeout.refresh();
      return;
    }
    this.clearRendererPriority();
    const previousBackgroundThrottling = webContents.getBackgroundThrottling();
    webContents.setBackgroundThrottling(false);
    const timeout = this.dependencies
      .setTimeout(() => this.clearRendererPriority(), RENDERER_PRIORITY_LEASE_MS)
      .unref();
    this.rendererPriority = { previousBackgroundThrottling, timeout, webContents };
  }

  private clearRendererPriority(): void {
    const priority = this.rendererPriority;
    this.rendererPriority = null;
    if (priority == null) return;
    clearTimeout(priority.timeout);
    if (!priority.webContents.isDestroyed()) {
      priority.webContents.setBackgroundThrottling(priority.previousBackgroundThrottling);
    }
  }
}

