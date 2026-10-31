// @ts-nocheck

/** Owns tab-drag preview availability, pointer projection, presentation window, and drag session. */
export function createTabDragPreviewServiceClass(dependencies: Record<string, any>) {
  const {
    runtime,
    platform,
    TabDragPresentationWindow,
    TabDragSession,
    electron,
    setTimer,
    clearTimer,
    setRepeatingTimer,
    clearRepeatingTimer,
    operationTimeoutMs = 3000,
  } = dependencies;
  const pointSchema = runtime.wf({ x: runtime.Cf(), y: runtime.Cf() });
  const loadSchema = runtime.wf({
    size: runtime.wf({ width: runtime.Cf().int().positive(), height: runtime.Cf().int().positive() }),
    grabOffset: pointSchema,
    borderRadius: runtime.Cf().nonnegative(),
    zoom: runtime.Cf().min(0.25).max(4),
    markup: runtime.Of().min(1).max(2e6),
  });
  const cueSchema = runtime
    .wf({
      destination: runtime.df([`new-window`, `left`, `right`, `bottom`, `pin`, `chat`, `new-chat`]),
    })
    .nullable();

  return class TabDragPreviewService extends runtime.Uf {
    origin;
    createPresentation;
    constructor(origin, createPresentation) {
      (super(), (this.origin = origin), (this.createPresentation = createPresentation));
    }
    static create(origin) {
      if (platform === `darwin` || platform === `win32`)
        return new TabDragPreviewService(
          origin,
          () =>
            new TabDragPresentationWindow({
              clearInterval: (timer) => clearRepeatingTimer(timer),
              clearTimeout: (timer) => clearTimer(timer),
              createWindow: (options) => new electron.BrowserWindow(options),
              getCursorScreenPoint: () => electron.screen.getCursorScreenPoint(),
              isDarwin: platform === `darwin`,
              operationTimeoutMs,
              setInterval: (callback, delay) => setRepeatingTimer(callback, delay),
              setTimeout: (callback, delay) => setTimer(callback, delay),
            }),
        );
    }
    getPointerPosition() {
      if (this.origin.isDestroyed()) return null;
      let window = electron.BrowserWindow.fromWebContents(this.origin);
      if (window == null || window.isDestroyed() || !window.isVisible()) return null;
      let pointer = electron.screen.getCursorScreenPoint(),
        bounds = window.getContentBounds(),
        zoom = this.origin.getZoomFactor();
      return { x: (pointer.x - bounds.x) / zoom, y: (pointer.y - bounds.y) / zoom };
    }
    prepare() {
      if (this.origin.isDestroyed()) return null;
      let window = electron.BrowserWindow.fromWebContents(this.origin);
      if (
        window == null ||
        window.isDestroyed() ||
        !window.isVisible() ||
        (platform === `darwin` && window.isFullScreen())
      )
        return null;
      try {
        return new TabDragSession({
          owner: window,
          parseCue: (value) => {
            let parsed = cueSchema.safeParse(value);
            return parsed.success ? parsed.data : void 0;
          },
          parseLoad: (value) => {
            let parsed = loadSchema.safeParse(value);
            return parsed.success ? parsed.data : void 0;
          },
          parsePoint: (value) => {
            let parsed = pointSchema.safeParse(value);
            return parsed.success ? parsed.data : void 0;
          },
          presentation: this.createPresentation(),
        });
      } catch {
        return null;
      }
    }
  };
}

if (typeof module !== "undefined") {
  module.exports = { createTabDragPreviewServiceClass };
}
