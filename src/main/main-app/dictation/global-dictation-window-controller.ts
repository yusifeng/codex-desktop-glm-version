// @ts-nocheck

const WINDOW_MARGIN = 16;
const DEFAULT_WINDOW_SIZE = { width: 720, height: 84 };
const RECOVERY_WINDOW_HEIGHT = 180;

/** Owns the lazy global-dictation overlay window and renderer-ready handshake. */
export function createGlobalDictationWindowControllerClass(dependencies: Record<string, any>) {
  const { LazyWindow, BrowserWindow, screen, logger, initialRoute } = dependencies;

  return class GlobalDictationWindowController {
    windowManager;
    recorderWindow = new LazyWindow(() => this.createWindow());
    recoveryVisible = false;
    rendererReadyPromise = null;
    rendererReadyResolve = null;
    rendererReadyWebContentsId = null;

    constructor(windowManager: any) {
      this.windowManager = windowManager;
    }

    prewarm() {
      this.recorderWindow.prewarm();
    }

    async showPasteFailure(failure: unknown, isCurrent: () => boolean) {
      const window = await this.recorderWindow.get();
      if (
        window == null ||
        !isCurrent() ||
        (await this.waitForRenderer(window), window.isDestroyed()) ||
        !isCurrent()
      ) {
        return false;
      }
      this.recoveryVisible = false;
      this.positionWindow(window);
      window.setAlwaysOnTop(true, `floating`);
      this.windowManager.sendMessageToWebContents(window.webContents, {
        type: `global-dictation-paste-failed`,
        failure,
      });
      window.showInactive();
      this.applyPointerInteractivity(window, true);
      return true;
    }

    async showAndStart(
      sessionId: string,
      startGesture: string,
      isCurrent: () => boolean,
      activationStartedAtMs: number,
    ) {
      const window = await this.recorderWindow.get();
      if (
        window == null ||
        !isCurrent() ||
        (await this.waitForRenderer(window), window.isDestroyed()) ||
        !isCurrent()
      ) {
        return false;
      }
      this.recoveryVisible = false;
      this.positionWindow(window);
      window.setAlwaysOnTop(true, `floating`);
      this.windowManager.sendMessageToWebContents(window.webContents, {
        type: `global-dictation-start`,
        sessionId,
        startGesture,
        activationStartedAtMs,
      });
      window.showInactive();
      this.applyPointerInteractivity(window, false);
      return true;
    }

    showRecovery() {
      const window = this.recorderWindow.peek();
      if (window != null) {
        this.recoveryVisible = true;
        this.positionWindow(window);
        this.applyPointerInteractivity(window, true);
      }
    }

    sendStop(sessionId: string, cancel: boolean) {
      const window = this.recorderWindow.peek();
      if (window == null) return;
      const send = () =>
        this.windowManager.sendMessageToWebContents(window.webContents, {
          type: `global-dictation-stop`,
          sessionId,
          cancel,
        });
      if (this.rendererReadyWebContentsId === window.webContents.id) {
        send();
        return;
      }
      this.waitForRenderer(window).then(() => {
        if (!window.isDestroyed()) send();
      });
    }

    setPointerInteractive(webContentsId: number, interactive: boolean) {
      const window = this.recorderWindow.peek();
      if (window != null && window.webContents.id === webContentsId) {
        this.applyPointerInteractivity(window, interactive);
      }
    }

    setRendererReady(webContentsId: number) {
      const window = this.recorderWindow.peek();
      if (window == null) {
        this.recorderWindow.runWhenAvailable((availableWindow: any) => {
          if (availableWindow.webContents.id === webContentsId) {
            this.markRendererReady(webContentsId);
          }
        });
        return;
      }
      if (window.webContents.id === webContentsId) this.markRendererReady(webContentsId);
    }

    hide() {
      const hideWindow = (window: any) => {
        window.setIgnoreMouseEvents(true, { forward: false });
        window.hide();
      };
      const window = this.recorderWindow.peek();
      if (window != null) hideWindow(window);
      else this.recorderWindow.runWhenAvailable(hideWindow);
    }

    close() {
      this.rendererReadyWebContentsId = null;
      this.rendererReadyResolve?.();
      this.rendererReadyResolve = null;
      this.rendererReadyPromise = null;
      this.recorderWindow.clear();
    }

    getFocusedInAppWindow() {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      return focusedWindow == null ||
        focusedWindow.isDestroyed() ||
        focusedWindow === this.recorderWindow.peek()
        ? null
        : focusedWindow;
    }

    positionWindow(window: any) {
      const workArea = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
      const size = {
        ...DEFAULT_WINDOW_SIZE,
        height: this.recoveryVisible ? RECOVERY_WINDOW_HEIGHT : DEFAULT_WINDOW_SIZE.height,
      };
      window.setBounds(
        {
          ...size,
          x: Math.round(workArea.x + (workArea.width - DEFAULT_WINDOW_SIZE.width) / 2),
          y: Math.max(
            workArea.y,
            workArea.y + workArea.height - size.height - WINDOW_MARGIN,
          ),
        },
        false,
      );
    }

    async createWindow() {
      try {
        const window = await this.windowManager.createWindow({
          title: `Dictation`,
          ...DEFAULT_WINDOW_SIZE,
          appearance: `globalDictation`,
          show: false,
          initialRoute,
          focusable: false,
        });
        this.rendererReadyPromise = new Promise((resolve) => {
          this.rendererReadyResolve = resolve;
        });
        window.setAlwaysOnTop(true, `floating`);
        this.positionWindow(window);
        this.applyPointerInteractivity(window, false);
        const reposition = () => {
          if (!window.isDestroyed() && window.isVisible()) this.positionWindow(window);
        };
        screen.on(`display-added`, reposition);
        screen.on(`display-removed`, reposition);
        screen.on(`display-metrics-changed`, reposition);
        window.once(`closed`, () => {
          screen.off(`display-added`, reposition);
          screen.off(`display-removed`, reposition);
          screen.off(`display-metrics-changed`, reposition);
        });
        return window;
      } catch (error) {
        logger.n().warning(`Failed to create global dictation window`, {
          safe: {},
          sensitive: { error },
        });
        return null;
      }
    }

    async waitForRenderer(window: any) {
      if (this.rendererReadyWebContentsId !== window.webContents.id) {
        await this.rendererReadyPromise;
      }
    }

    markRendererReady(webContentsId: number) {
      this.rendererReadyWebContentsId = webContentsId;
      this.rendererReadyResolve?.();
      this.rendererReadyResolve = null;
    }

    applyPointerInteractivity(window: any, interactive: boolean) {
      if (!window.isVisible()) {
        window.setIgnoreMouseEvents(true, { forward: false });
      } else if (interactive) {
        window.setIgnoreMouseEvents(false);
      } else {
        window.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createGlobalDictationWindowControllerClass };
}
