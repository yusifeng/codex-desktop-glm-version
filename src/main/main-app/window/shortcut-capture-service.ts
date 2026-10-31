// @ts-nocheck

/** Owns focused-window shortcut capture and its native bare-modifier session lifecycle. */
export function createShortcutCaptureServices(dependencies: Record<string, any>) {
  const {
    RpcHandlerBase,
    electron,
    createNativeCapture,
    installKeyboardHook,
    platform,
    resourcesPath,
  } = dependencies;
  class ShortcutCaptureService extends RpcHandlerBase {
    origin;
    constructor(origin) {
      (super(), (this.origin = origin));
    }
    beginCapture() {
      if (this.origin.isDestroyed()) return null;
      let window = electron.BrowserWindow.fromWebContents(this.origin);
      return window == null || !window.isFocused() ? null : new ShortcutCaptureSession(this.origin, window);
    }
  }
  class ShortcutCaptureSession extends RpcHandlerBase {
    origin;
    window;
    #end = Promise.withResolvers();
    #removeKeyboardHook = installKeyboardHook();
    #disposed = !1;
    #nativeCapture = null;
    #nextModifier = Promise.withResolvers();
    #dispose = () => this[Symbol.dispose]();
    #navigate = (event) => {
      event.isMainFrame && !event.isSameDocument && this.#dispose();
    };
    constructor(origin, window) {
      (super(),
        (this.origin = origin),
        (this.window = window),
        window.once(`blur`, this.#dispose),
        origin.once(`destroyed`, this.#dispose),
        origin.once(`render-process-gone`, this.#dispose),
        origin.on(`did-start-navigation`, this.#navigate));
    }
    waitForEnd() { return this.#end.promise; }
    async startBareModifierCapture() {
      return this.#disposed || platform !== `darwin`
        ? !1
        : ((this.#nativeCapture =
            this.#nativeCapture ??
            createNativeCapture({
              electronAppPath: electron.app.getAppPath(),
              resourcesPath,
            }).startModifierCapture(this.window.getNativeWindowHandle(), (value) =>
              this.#nextModifier.resolve(value),
            )),
          this.#nativeCapture != null);
    }
    async nextBareModifier() {
      if (this.#disposed || this.#nativeCapture == null) return null;
      let value = await this.#nextModifier.promise;
      return ((this.#nextModifier = Promise.withResolvers()), value);
    }
    [Symbol.dispose]() {
      this.#disposed ||
        ((this.#disposed = !0),
        this.#nativeCapture?.dispose(),
        this.#nextModifier.resolve(null),
        this.window.removeListener(`blur`, this.#dispose),
        this.origin.removeListener(`destroyed`, this.#dispose),
        this.origin.removeListener(`render-process-gone`, this.#dispose),
        this.origin.removeListener(`did-start-navigation`, this.#navigate),
        this.#removeKeyboardHook(),
        this.#end.resolve(void 0));
    }
  }
  return { ShortcutCaptureService, ShortcutCaptureSession };
}
if (typeof module !== "undefined") {
  module.exports = { createShortcutCaptureServices };
}
