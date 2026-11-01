// Shared Popcorn artifact runtime: headers, transports, viewport/input, text geometry, and insert controls.

import "@rchunk/rolldown-runtime";
import "@rchunk/artifact-workbook-runtime";
import "@rchunk/popcorn-icons";
import "@rchunk/app-primary";
import "@rchunk/popcorn-manual-edit-header-controls";
import "@rchunk/drawing-frame-geometry";
import {
  I3 as getJsxRuntime,
  e6 as getReactRuntime,
  m4 as classNames,
  type JsxRuntime,
  type ReactRuntime,
} from "@rchunk/app-shared";
import { installArtifactShapePresets } from "./shape-presets.generated";

interface Point {
  x: number;
  y: number;
}
interface Camera {
  k: number;
  x: number;
  y: number;
}
interface Rect {
  height: number;
  width: number;
  x: number;
  y: number;
}
interface TextPosition {
  blockId: string;
  charIndex: number;
  paraIndex: number;
  runIndex: number;
}
interface TextSegment {
  advance: number[];
  charEnd: number;
  charStart: number;
  font?: string;
  paraIndex: number;
  px?: number;
  runIndex: number;
  text?: string;
  widthPx: number;
  xPx?: number;
}
interface TextLine {
  baselineOffsetPx: number;
  contentHeightPx?: number;
  hardBreakAfter?: TextSegment;
  heightPx: number;
  maxAscentPx: number;
  maxDescentPx: number;
  maxPx?: number;
  segments: TextSegment[];
  widthPx: number;
  align?: "left" | "center" | "right";
}
interface TextLayout {
  height?: number;
  lines: TextLine[];
  unrotatedWidth?: number;
  width: number;
  x: number;
  y: number;
}
interface TextBlock {
  getRunText?(paraIndex: number, runIndex: number): string;
  hitBox: {
    height: number;
    rotationDeg?: number;
    rotationOrigin?: Point;
    width: number;
    x: number;
    y: number;
  };
  id: string;
  layout: TextLayout;
  rotationDeg: number;
  zIndex?: number;
}
interface WorkerLike {
  onerror:
    | ((event: {
        colno?: number;
        filename?: string;
        lineno?: number;
        message?: string;
      }) => void)
    | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onmessageerror: (() => void) | null;
  postMessage(message: unknown, transfer?: Transferable[]): void;
  terminate(): void;
}

const jsx = getJsxRuntime() as JsxRuntime;
const React = getReactRuntime() as unknown as ReactRuntime;
const ZOOM_OPTIONS = [0.25, 0.5, 1, 1.5, 2] as const;
const IMAGE_TYPES = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["gif", "image/gif"],
  ["webp", "image/webp"],
  ["svg", "image/svg+xml"],
  ["bmp", "image/bmp"],
  ["avif", "image/avif"],
  ["ico", "image/x-icon"],
]);

function initialize(): void {}
function HeaderLayout({
  header,
  headerPlacement,
  children,
  renderLayout,
}: {
  header?: unknown;
  headerPlacement?: unknown;
  children?: unknown;
  renderLayout?(parts: Record<string, unknown>): unknown;
}): unknown {
  return renderLayout
    ? renderLayout({ header, headerPlacement, content: children })
    : jsx.jsxs(jsx.Fragment, { children: [header, children] });
}
function FileMenu({
  icon,
  content,
  label,
  testId = "popcorn-file-menu-trigger",
}: {
  icon?: unknown;
  content?: unknown;
  label: string;
  testId?: string;
}): unknown {
  return jsx.jsxs("div", {
    className: "relative",
    children: [
      jsx.jsx("button", {
        type: "button",
        "aria-label": label,
        "data-testid": testId,
        className: "inline-flex items-center justify-center rounded-lg p-1",
        children: icon,
      }),
      jsx.jsx("div", {
        role: "menu",
        className: "absolute z-50 w-[320px] rounded-2xl p-3",
        children: content,
      }),
    ],
  });
}
function compactTitle(title: string): string {
  const value = title.trim();
  const dot = value.lastIndexOf(".");
  return dot <= 0 || dot === value.length - 1 ? value : value.slice(0, dot);
}
function HeaderGroup({
  children,
  compact = false,
  testId,
}: {
  children?: unknown;
  compact?: boolean;
  testId?: string;
}): unknown {
  return jsx.jsx("div", {
    className: classNames("flex items-center", compact ? "gap-1" : "gap-2"),
    "data-testid": testId,
    children,
  });
}
function ArtifactHeader({
  title,
  headerTitleContent,
  headerTitleTrailingContent,
  closeLabel = "Close",
  icon,
  fileMenuContent,
  compactTitle: compact = false,
  floating = false,
  floatingSurface = "grouped",
  centerContent,
  centeredContent,
  navigationContent,
  actions,
  onClose,
  className,
  testId = "popcorn-artifact-header",
}: {
  title: string;
  headerTitleContent?: unknown;
  headerTitleTrailingContent?: unknown;
  closeLabel?: string;
  icon?: unknown;
  fileMenuContent?: unknown;
  compactTitle?: boolean;
  floating?: boolean;
  floatingSurface?: string;
  centerContent?: unknown;
  centeredContent?: unknown;
  navigationContent?: unknown;
  actions?: unknown;
  onClose?(): void;
  className?: string;
  testId?: string;
}): unknown {
  const displayTitle =
    headerTitleContent ?? (compact ? compactTitle(title) : title);
  return jsx.jsx("header", {
    "data-testid": testId,
    "data-floating": floating,
    "data-floating-surface": floatingSurface,
    className: classNames(
      "relative z-30 grid items-center",
      floating ? "absolute inset-x-0 top-0" : "h-12 border-b",
      centeredContent ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-[1fr_auto]",
      className,
    ),
    children: jsx.jsxs(jsx.Fragment, {
      children: [
        jsx.jsxs("div", {
          "data-testid": `${testId}-leading`,
          className: "flex min-w-0 items-center gap-2",
          children: [
            navigationContent,
            onClose
              ? jsx.jsx("button", {
                  type: "button",
                  "aria-label": closeLabel,
                  "data-testid": "popcorn-close",
                  onClick: onClose,
                  children: "×",
                })
              : null,
            fileMenuContent
              ? jsx.jsx(FileMenu, {
                  icon,
                  content: fileMenuContent,
                  label: `Open ${title} menu`,
                })
              : icon,
            jsx.jsxs("div", {
              "data-testid": "popcorn-file-title",
              className: "min-w-0 truncate",
              children: [displayTitle, headerTitleTrailingContent],
            }),
            centerContent,
          ],
        }),
        centeredContent
          ? jsx.jsx("div", {
              "data-testid": `${testId}-centered`,
              children: centeredContent,
            })
          : null,
        actions
          ? jsx.jsx("div", {
              "data-testid": `${testId}-actions`,
              className: "flex justify-self-end gap-1",
              children: actions,
            })
          : null,
      ],
    }),
  });
}
function MaskIcon({
  source,
  className,
  style,
  ...props
}: {
  source: string;
  className?: string;
  style?: Record<string, unknown>;
} & Record<string, unknown>): unknown {
  return jsx.jsx("span", {
    "aria-hidden": true,
    className: classNames("inline-block size-4 shrink-0 bg-current", className),
    style: {
      maskImage: `url("${source}")`,
      maskPosition: "center",
      maskRepeat: "no-repeat",
      ...style,
    },
    ...props,
  });
}
function ZoomSelect({
  zoom,
  onZoomChange,
  options = ZOOM_OPTIONS,
  fitOption,
  className,
  testId = "popcorn-zoom-select",
}: {
  zoom: number;
  onZoomChange(value: number): void;
  options?: readonly number[];
  fitOption?: { label: string; onSelect(): void; selected: boolean };
  className?: string;
  testId?: string;
}): unknown {
  return jsx.jsxs("label", {
    className,
    children: [
      jsx.jsx("span", { className: "sr-only", children: "Zoom" }),
      jsx.jsxs("select", {
        "aria-label": "Zoom",
        "data-testid": testId,
        value: fitOption?.selected ? "fit" : String(zoom),
        onChange: (event: { currentTarget: { value: string } }) =>
          event.currentTarget.value === "fit"
            ? fitOption?.onSelect()
            : onZoomChange(Number(event.currentTarget.value)),
        children: [
          ...options.map((value) =>
            jsx.jsx(
              "option",
              { value: String(value), children: `${Math.round(value * 100)}%` },
              value,
            ),
          ),
          fitOption
            ? jsx.jsx("option", { value: "fit", children: fitOption.label })
            : null,
        ],
      }),
    ],
  });
}

function disposeResource(value: { destroy?(): void; dispose?(): void }): void {
  if (typeof value.destroy === "function") value.destroy();
  else value.dispose?.();
}
function useDisposable<T extends { destroy?(): void; dispose?(): void }>(
  external: T | null | undefined,
  create: () => T,
  options?: { dispose?(value: T): void },
): T | null | undefined {
  const owned = React.useRef<T | null>(null);
  const pending = React.useRef<object | null>(null);
  if (!external && owned.current == null) owned.current = create();
  React.useEffect(() => {
    const current = owned.current;
    if (external || !current) return;
    pending.current = null;
    return () => {
      const token = {};
      pending.current = token;
      setTimeout(() => {
        if (pending.current !== token) return;
        pending.current = null;
        if (owned.current === current) owned.current = null;
        options?.dispose ? options.dispose(current) : disposeResource(current);
      }, 0);
    };
  }, [external, options]);
  return external ?? owned.current;
}

class PopcornTransportTerminalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PopcornTransportTerminalError";
  }
}
class PopcornTransportDisposedError extends PopcornTransportTerminalError {
  constructor() {
    super("Worker transport disposed");
  }
}
class WorkerTransport {
  private nextRequestId = 1;
  private readonly pending = new Map<
    string,
    { reject(error: unknown): void; resolve(value: unknown): void }
  >();
  private terminalError: PopcornTransportTerminalError | null = null;
  private disposed = false;
  constructor(
    readonly worker: WorkerLike,
    readonly onEvent: (value: unknown) => void,
    readonly onError?: (message: string) => void,
  ) {
    worker.onmessage = (event) => this.receive(event.data);
    worker.onerror = (event) =>
      this.fail(event.message || "Worker runtime error");
    worker.onmessageerror = () =>
      this.fail("Worker message deserialization failed");
  }
  bootstrap(payload: unknown, transfer?: Transferable[]): void {
    this.post({ type: "bootstrap", payload }, transfer);
  }
  dispatch(payload: unknown, transfer?: Transferable[]): void {
    this.post({ type: "intent", payload }, transfer);
  }
  request(payload: unknown, transfer?: Transferable[]): Promise<unknown> {
    if (this.disposed)
      return Promise.reject(new PopcornTransportDisposedError());
    if (this.terminalError) return Promise.reject(this.terminalError);
    const requestId = String(this.nextRequestId++);
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      try {
        this.post({ type: "request", requestId, payload }, transfer);
      } catch (error) {
        this.pending.delete(requestId);
        reject(error);
      }
    });
  }
  dispose(): void {
    if (this.disposed) return;
    this.post({ type: "dispose" });
    this.disposed = true;
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.onmessageerror = null;
    this.worker.terminate();
    const error = new PopcornTransportDisposedError();
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }
  post(message: unknown, transfer?: Transferable[]): void {
    if (this.disposed || this.terminalError) return;
    transfer?.length
      ? this.worker.postMessage(message, transfer)
      : this.worker.postMessage(message);
  }
  private receive(message: unknown): void {
    if (
      this.disposed ||
      typeof message !== "object" ||
      message === null ||
      !("type" in message)
    )
      return;
    const value = message as {
      message?: string;
      payload?: unknown;
      requestId?: string;
      type: string;
    };
    if (value.type === "ready") return;
    if (value.type === "event") return this.onEvent(value.payload);
    if (value.type === "response" && value.requestId) {
      const pending = this.pending.get(value.requestId);
      if (pending) {
        this.pending.delete(value.requestId);
        pending.resolve(value.payload);
      }
      return;
    }
    if (value.type === "error")
      return this.fail(value.message ?? "Worker error");
    throw new Error(`Unhandled transport message: ${value.type}`);
  }
  private fail(message: string): void {
    if (this.disposed || this.terminalError) return;
    this.terminalError = new PopcornTransportTerminalError(message);
    for (const pending of this.pending.values())
      pending.reject(this.terminalError);
    this.pending.clear();
    this.onError?.(message);
  }
}
function rethrowUnlessDisposed(error: unknown): void {
  if (!(error instanceof PopcornTransportDisposedError)) throw error;
}
function isPopcornDev(): boolean {
  return (
    typeof globalThis !== "undefined" &&
    (globalThis as Record<string, unknown>).__POPCORN_DEV__ === true
  );
}
function createLogger(namespace: string): {
  debug(message: string, details?: unknown): void;
} {
  return {
    debug(message, details) {
      if (!isPopcornDev()) return;
      const target = globalThis as Record<string, unknown>;
      const entries = (target.__POPCORN_LOGS__ ??= []) as unknown[];
      entries.push({ namespace, message, details, timestampMs: Date.now() });
      if (target.__POPCORN_CONSOLE_DEBUG__ === true)
        details === undefined
          ? console.debug(`[popcorn:${namespace}] ${message}`)
          : console.debug(`[popcorn:${namespace}] ${message}`, details);
    },
  };
}
function installShapePresets(): void {
  installArtifactShapePresets();
}

function shallowEqual(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every((key) => Object.is(left[key], right[key]))
  );
}
class ExternalStore<T extends Record<string, unknown>> {
  private subscribers = new Set<() => void>();
  private frame: number | null = null;
  constructor(private state: T) {}
  subscribe(listener: () => void): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
      if (this.subscribers.size === 0) this.cancelFrame();
    };
  }
  getState(): T {
    return this.state;
  }
  dispose(): void {
    this.cancelFrame();
    this.subscribers.clear();
  }
  replace(state: T): boolean {
    if (Object.is(this.state, state) || shallowEqual(this.state, state))
      return false;
    this.state = state;
    this.notify();
    return true;
  }
  patch(patch: Partial<T>, options?: { notify?: "animation-frame" }): boolean {
    let changed = false;
    const state = { ...this.state };
    for (const [key, value] of Object.entries(patch))
      if (!Object.is(state[key], value)) {
        state[key as keyof T] = value as T[keyof T];
        changed = true;
      }
    if (!changed) return false;
    this.state = state;
    if (
      options?.notify === "animation-frame" &&
      typeof requestAnimationFrame === "function"
    ) {
      if (this.frame == null && this.subscribers.size > 0)
        this.frame = requestAnimationFrame(() => this.notify());
    } else this.notify();
    return true;
  }
  private cancelFrame(): void {
    if (this.frame != null && typeof cancelAnimationFrame === "function")
      cancelAnimationFrame(this.frame);
    this.frame = null;
  }
  private notify(): void {
    this.cancelFrame();
    for (const subscriber of [...this.subscribers]) subscriber();
  }
}

function clientToLocal(
  element: Pick<
    HTMLElement,
    "clientHeight" | "clientWidth" | "getBoundingClientRect"
  >,
  clientX: number,
  clientY: number,
): Point {
  const rect = element.getBoundingClientRect();
  return {
    x:
      (clientX - rect.left) *
      (rect.width > 0 && element.clientWidth > 0
        ? element.clientWidth / rect.width
        : 1),
    y:
      (clientY - rect.top) *
      (rect.height > 0 && element.clientHeight > 0
        ? element.clientHeight / rect.height
        : 1),
  };
}
function localToClient(
  element: Pick<
    HTMLElement,
    "clientHeight" | "clientWidth" | "getBoundingClientRect"
  >,
  x: number,
  y: number,
): Point {
  const rect = element.getBoundingClientRect();
  return {
    x:
      rect.left +
      x *
        (rect.width > 0 && element.clientWidth > 0
          ? rect.width / element.clientWidth
          : 1),
    y:
      rect.top +
      y *
        (rect.height > 0 && element.clientHeight > 0
          ? rect.height / element.clientHeight
          : 1),
  };
}
function arrowDirection(key: string): { dx: number; dy: number } | null {
  return key === "ArrowLeft"
    ? { dx: -1, dy: 0 }
    : key === "ArrowRight"
      ? { dx: 1, dy: 0 }
      : key === "ArrowUp"
        ? { dx: 0, dy: -1 }
        : key === "ArrowDown"
          ? { dx: 0, dy: 1 }
          : null;
}
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (
    target.closest(
      "input,textarea,select,[role='textbox'],[role='searchbox'],[role='combobox'],[data-testid='popcorn-find-bar'],[data-testid='popcorn-annotation-editor'],[data-testid='popcorn-presentation-comments-sidebar']",
    )
  )
    return true;
  const editable = target.closest("[contenteditable]");
  if (!editable) return false;
  const value = editable.getAttribute("contenteditable")?.trim().toLowerCase();
  return (
    value === "" ||
    value === "true" ||
    value === "plaintext-only" ||
    (value !== "false" &&
      editable instanceof HTMLElement &&
      editable.isContentEditable)
  );
}
function allowedShortcut(
  event: {
    altKey: boolean;
    ctrlKey: boolean;
    keyCode: number;
    metaKey: boolean;
    nativeEvent: { isComposing?: boolean };
    repeat: boolean;
    shiftKey: boolean;
  },
  {
    allowShift = false,
    requirePrimaryModifier = false,
  }: { allowShift?: boolean; requirePrimaryModifier?: boolean } = {},
): boolean {
  if (
    event.repeat ||
    event.nativeEvent.isComposing ||
    event.keyCode === 229 ||
    event.altKey ||
    (!allowShift && event.shiftKey)
  )
    return false;
  const primary = event.metaKey || event.ctrlKey;
  return requirePrimaryModifier ? event.metaKey !== event.ctrlKey : !primary;
}
function wheelZoomFactor(
  event: Pick<WheelEvent, "deltaMode" | "deltaY">,
): number {
  const unit = event.deltaMode === 1 ? 0.05 : event.deltaMode === 2 ? 1 : 0.002;
  return Math.max(0.5, Math.min(2, 2 ** (-event.deltaY * unit * 10)));
}
function cameraEqual(left: Camera, right: Camera): boolean {
  return (
    Math.abs(left.x - right.x) < 0.01 &&
    Math.abs(left.y - right.y) < 0.01 &&
    Math.abs(left.k - right.k) < 1e-4
  );
}
class ViewportController {
  private element: HTMLElement | null = null;
  private listeners = new Set<() => void>();
  private camera: Camera;
  private enabled: boolean;
  private readonly wheel = (event: WheelEvent) => {
    if (!this.enabled) return;
    event.preventDefault();
    if (event.ctrlKey || event.metaKey) {
      const local = this.element
        ? clientToLocal(this.element, event.clientX, event.clientY)
        : { x: 0, y: 0 };
      const nextZoom = this.clampZoom(this.camera.k * wheelZoomFactor(event));
      const world = {
        x: (local.x - this.camera.x) / this.camera.k,
        y: (local.y - this.camera.y) / this.camera.k,
      };
      this.setCamera({
        k: nextZoom,
        x: local.x - world.x * nextZoom,
        y: local.y - world.y * nextZoom,
      });
    } else
      this.setCamera({
        ...this.camera,
        x: this.camera.x - event.deltaX,
        y: this.camera.y - event.deltaY,
      });
  };
  constructor(
    private readonly options: {
      enabled: boolean;
      getViewportSize?(): { height: number; width: number };
      initialCamera: Camera;
      maxZoom: number;
      minZoom: number;
      onCameraSettled?(camera: Camera): void;
      requestDraw(): void;
    },
  ) {
    this.camera = { ...options.initialCamera };
    this.enabled = options.enabled;
  }
  attach(element: HTMLElement | null): void {
    if (this.element === element) return;
    this.element?.removeEventListener("wheel", this.wheel);
    this.element = element;
    if (element && this.enabled)
      element.addEventListener("wheel", this.wheel, { passive: false });
  }
  destroy(): void {
    this.attach(null);
    this.listeners.clear();
  }
  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    const element = this.element;
    if (element) {
      element.removeEventListener("wheel", this.wheel);
      if (enabled)
        element.addEventListener("wheel", this.wheel, { passive: false });
    }
  }
  getCamera(): Camera {
    return this.camera;
  }
  getViewportSnapshot(): {
    height: number;
    scrollLeft: number;
    scrollTop: number;
    width: number;
  } {
    return {
      scrollLeft: -this.camera.x / this.camera.k,
      scrollTop: -this.camera.y / this.camera.k,
      width: this.element?.clientWidth ?? 0,
      height: this.element?.clientHeight ?? 0,
    };
  }
  subscribeToCameraChanges(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  shouldSuppressMouseInteractions(): boolean {
    return false;
  }
  setCamera(camera: Camera, options?: { settled?: boolean }): void {
    const next = { ...camera, k: this.clampZoom(camera.k) };
    if (cameraEqual(this.camera, next)) {
      if (options?.settled) this.options.onCameraSettled?.(next);
      return;
    }
    this.camera = next;
    for (const listener of [...this.listeners]) listener();
    this.options.requestDraw();
    if (options?.settled) this.options.onCameraSettled?.(next);
  }
  zoomTo(
    zoom: number,
    options?: { screenX?: number; screenY?: number; settled?: boolean },
  ): void {
    const x = options?.screenX ?? (this.element?.clientWidth ?? 0) / 2;
    const y = options?.screenY ?? (this.element?.clientHeight ?? 0) / 2;
    const worldX = (x - this.camera.x) / this.camera.k;
    const worldY = (y - this.camera.y) / this.camera.k;
    const k = this.clampZoom(zoom);
    this.setCamera(
      { k, x: x - worldX * k, y: y - worldY * k },
      { settled: options?.settled },
    );
  }
  panByScroll(x: number, y: number): void {
    this.setCamera({
      ...this.camera,
      x: this.camera.x - x * this.camera.k,
      y: this.camera.y - y * this.camera.k,
    });
  }
  private clampZoom(zoom: number): number {
    return Math.max(this.options.minZoom, Math.min(this.options.maxZoom, zoom));
  }
}

class HiddenTextareaBridge {
  readonly textarea: HTMLTextAreaElement;
  private disposed = false;
  private composing = false;
  constructor(
    private readonly options: {
      container: HTMLElement;
      onBeforeInput?(event: InputEvent): void;
      onCompositionEnd?(event: CompositionEvent): void;
      onCompositionStart?(event: CompositionEvent): void;
      onCompositionUpdate?(event: CompositionEvent): void;
      onCopy?(event: ClipboardEvent): void;
      onCut?(event: ClipboardEvent): void;
      onInput?(event: InputEvent): void;
      onKeyDown?(event: KeyboardEvent): void;
      onPaste?(event: ClipboardEvent): void;
    },
  ) {
    this.textarea = options.container.ownerDocument.createElement("textarea");
    Object.assign(this.textarea.style, {
      position: "absolute",
      opacity: "0",
      pointerEvents: "none",
      zIndex: "1",
      fontSize: "16px",
      width: "1px",
      height: "1px",
      resize: "none",
      overflow: "hidden",
      padding: "0",
      margin: "0",
      border: "0",
      outline: "none",
    });
    this.textarea.setAttribute("aria-hidden", "true");
    options.container.appendChild(this.textarea);
    this.bind();
  }
  focus(): void {
    if (!this.disposed) this.textarea.focus({ preventScroll: true });
  }
  blur(): void {
    if (!this.disposed) this.textarea.blur();
  }
  setAnchorRect(rect: {
    height?: number;
    width?: number;
    x: number;
    y: number;
  }): void {
    if (this.disposed) return;
    Object.assign(this.textarea.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${Math.max(1, rect.width ?? 1)}px`,
      height: `${Math.max(1, rect.height ?? 16)}px`,
    });
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.textarea.remove();
  }
  private bind(): void {
    const textarea = this.textarea;
    textarea.addEventListener("beforeinput", (event) =>
      this.options.onBeforeInput?.(event),
    );
    textarea.addEventListener("input", (event) => {
      this.options.onInput?.(event as InputEvent);
      if (!this.composing && !(event as InputEvent).isComposing)
        textarea.value = "";
    });
    textarea.addEventListener("keydown", (event) =>
      this.options.onKeyDown?.(event),
    );
    textarea.addEventListener("compositionstart", (event) => {
      this.composing = true;
      this.options.onCompositionStart?.(event);
    });
    textarea.addEventListener("compositionupdate", (event) =>
      this.options.onCompositionUpdate?.(event),
    );
    textarea.addEventListener("compositionend", (event) => {
      this.options.onCompositionEnd?.(event);
      this.composing = false;
      textarea.value = "";
    });
    textarea.addEventListener("copy", (event) => this.options.onCopy?.(event));
    textarea.addEventListener("cut", (event) => this.options.onCut?.(event));
    textarea.addEventListener("paste", (event) =>
      this.options.onPaste?.(event),
    );
  }
}

function lineX(layout: TextLayout, line: TextLine): number {
  const width = layout.unrotatedWidth ?? layout.width;
  return line.align === "center"
    ? (width - line.widthPx) / 2
    : line.align === "right"
      ? width - line.widthPx
      : 0;
}
function lineTop(layout: TextLayout, lineIndex: number): number {
  let top = 0;
  for (let index = 0; index < lineIndex; index++)
    top += layout.lines[index]?.heightPx ?? 0;
  return top;
}
function lineMetrics(
  layout: TextLayout,
  lineIndex: number,
): { height: number; y: number } | null {
  const line = layout.lines[lineIndex];
  if (!line) return null;
  const height =
    Number.isFinite(line.maxAscentPx + line.maxDescentPx) &&
    line.maxAscentPx + line.maxDescentPx > 0
      ? line.maxAscentPx + line.maxDescentPx
      : (line.contentHeightPx ?? line.heightPx);
  return {
    y:
      lineTop(layout, lineIndex) +
      (height === line.heightPx ? 0 : line.baselineOffsetPx - line.maxAscentPx),
    height,
  };
}
function findSegment(
  layout: TextLayout,
  position: TextPosition,
): {
  line: TextLine;
  lineIndex: number;
  segment: TextSegment;
  segmentIndex: number;
} | null {
  for (let lineIndex = 0; lineIndex < layout.lines.length; lineIndex++) {
    const line = layout.lines[lineIndex]!;
    for (
      let segmentIndex = 0;
      segmentIndex < line.segments.length;
      segmentIndex++
    ) {
      const segment = line.segments[segmentIndex]!;
      if (
        segment.paraIndex === position.paraIndex &&
        segment.runIndex === position.runIndex &&
        position.charIndex >= segment.charStart &&
        position.charIndex <= segment.charEnd
      )
        return { line, segment, lineIndex, segmentIndex };
    }
  }
  return null;
}
function caretRect(layout: TextLayout, position: TextPosition): Rect | null {
  const found = findSegment(layout, position);
  if (!found) return null;
  let x = lineX(layout, found.line);
  for (const segment of found.line.segments) {
    if (segment === found.segment) break;
    x += segment.widthPx;
  }
  const offset = Math.max(
    0,
    Math.min(
      found.segment.advance.length - 1,
      position.charIndex - found.segment.charStart,
    ),
  );
  const metrics = lineMetrics(layout, found.lineIndex);
  return metrics
    ? {
        x: x + (found.segment.advance[offset] ?? 0),
        y: metrics.y,
        width: 1,
        height: metrics.height,
      }
    : null;
}
function clampPosition(position: TextPosition, block: TextBlock): TextPosition {
  const text = block.getRunText?.(position.paraIndex, position.runIndex);
  if (!text) return position;
  const length = [...text].length;
  const charIndex = Math.max(0, Math.min(length, position.charIndex));
  return charIndex === position.charIndex
    ? position
    : { ...position, charIndex };
}
function hitBoxContains(block: TextBlock, point: Point): boolean {
  const box = block.hitBox;
  let x = point.x;
  let y = point.y;
  const angle = ((box.rotationDeg ?? 0) * Math.PI) / 180;
  if (angle !== 0) {
    const origin = box.rotationOrigin ?? {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
    };
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    x = origin.x + dx * cos - dy * sin;
    y = origin.y + dx * sin + dy * cos;
  }
  return (
    x >= box.x &&
    x <= box.x + box.width &&
    y >= box.y &&
    y <= box.y + box.height
  );
}
function hitTestBlock(block: TextBlock, point: Point): TextPosition | null {
  let x = point.x - block.layout.x;
  let y = point.y - block.layout.y;
  const angle = (block.rotationDeg * Math.PI) / 180;
  if (angle !== 0) {
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const nextX = x * cos - y * sin;
    y = x * sin + y * cos;
    x = nextX;
  }
  let lineIndex = block.layout.lines.findIndex(
    (line, index) =>
      y >= lineTop(block.layout, index) &&
      y <= lineTop(block.layout, index) + line.heightPx,
  );
  if (lineIndex < 0) lineIndex = y < 0 ? 0 : block.layout.lines.length - 1;
  const line = block.layout.lines[lineIndex];
  if (!line) return null;
  let cursor = lineX(block.layout, line);
  for (const segment of line.segments) {
    if (x <= cursor + segment.widthPx) {
      let index = 0;
      while (
        index < segment.advance.length &&
        (segment.advance[index] ?? 0) < x - cursor
      )
        index++;
      return clampPosition(
        {
          blockId: block.id,
          paraIndex: segment.paraIndex,
          runIndex: segment.runIndex,
          charIndex: segment.charStart + Math.max(0, index - 1),
        },
        block,
      );
    }
    cursor += segment.widthPx;
  }
  const last = line.segments.at(-1);
  return last
    ? {
        blockId: block.id,
        paraIndex: last.paraIndex,
        runIndex: last.runIndex,
        charIndex: last.charEnd,
      }
    : null;
}
class TextLayoutIndex {
  readonly blocksById = new Map<string, TextBlock>();
  readonly hitOrder: TextBlock[];
  constructor(readonly snapshot: { blocks: TextBlock[] }) {
    for (const block of snapshot.blocks) this.blocksById.set(block.id, block);
    this.hitOrder = [...snapshot.blocks].sort(
      (left, right) => (right.zIndex ?? 0) - (left.zIndex ?? 0),
    );
  }
  getBlock(id: string): TextBlock | undefined {
    return this.blocksById.get(id);
  }
}
function hitTest(
  index: TextLayoutIndex,
  point: Point,
  options?: { restrictToBlockId?: string },
): TextPosition | null {
  const blocks = options?.restrictToBlockId
    ? [index.getBlock(options.restrictToBlockId)].filter(
        (block): block is TextBlock => Boolean(block),
      )
    : index.hitOrder;
  for (const block of blocks)
    if (hitBoxContains(block, point)) {
      const position = hitTestBlock(block, point);
      if (position) return position;
    }
  return null;
}
function comparePosition(left: TextPosition, right: TextPosition): number {
  return left.paraIndex === right.paraIndex
    ? left.runIndex === right.runIndex
      ? left.charIndex - right.charIndex
      : left.runIndex - right.runIndex
    : left.paraIndex - right.paraIndex;
}
function selectionRanges(
  layout: TextLayout,
  first: TextPosition,
  second: TextPosition,
  getRunText?: (paraIndex: number, runIndex: number) => string | undefined,
): Array<{ end: number; paraIndex: number; runIndex: number; start: number }> {
  const [start, end] =
    comparePosition(first, second) <= 0 ? [first, second] : [second, first];
  const runs = new Map<
    string,
    { end: number; paraIndex: number; runIndex: number; start: number }
  >();
  for (const line of layout.lines)
    for (const segment of [
      ...line.segments,
      ...(line.hardBreakAfter ? [line.hardBreakAfter] : []),
    ]) {
      const key = `${segment.paraIndex}:${segment.runIndex}`;
      const current = runs.get(key);
      runs.set(key, {
        paraIndex: segment.paraIndex,
        runIndex: segment.runIndex,
        start: current
          ? Math.min(current.start, segment.charStart)
          : segment.charStart,
        end: current ? Math.max(current.end, segment.charEnd) : segment.charEnd,
      });
    }
  return [...runs.values()]
    .sort(
      (left, right) =>
        left.paraIndex - right.paraIndex || left.runIndex - right.runIndex,
    )
    .flatMap((run) => {
      if (
        comparePosition(
          {
            blockId: "",
            paraIndex: run.paraIndex,
            runIndex: run.runIndex,
            charIndex: run.end,
          },
          start,
        ) < 0 ||
        comparePosition(
          {
            blockId: "",
            paraIndex: run.paraIndex,
            runIndex: run.runIndex,
            charIndex: run.start,
          },
          end,
        ) > 0
      )
        return [];
      const max = Math.max(
        run.end,
        [...(getRunText?.(run.paraIndex, run.runIndex) ?? "")].length,
      );
      const rangeStart =
        run.paraIndex === start.paraIndex && run.runIndex === start.runIndex
          ? Math.max(run.start, Math.min(max, start.charIndex))
          : run.start;
      const rangeEnd =
        run.paraIndex === end.paraIndex && run.runIndex === end.runIndex
          ? Math.max(run.start, Math.min(max, end.charIndex))
          : run.end;
      return rangeEnd > rangeStart
        ? [{ ...run, start: rangeStart, end: rangeEnd }]
        : [];
    });
}
class SelectionState {
  activeBlockId: string | null = null;
  caret: TextPosition | null = null;
  anchor: TextPosition | null = null;
  setActiveCaret(
    position: TextPosition,
    options?: { preserveAnchor?: boolean },
  ): void {
    this.activeBlockId = position.blockId;
    this.caret = position;
    if (!options?.preserveAnchor) this.anchor = position;
  }
  clear(): void {
    this.activeBlockId = null;
    this.caret = null;
    this.anchor = null;
  }
  collapseTo(position: TextPosition): void {
    this.activeBlockId = position.blockId;
    this.caret = position;
    this.anchor = position;
  }
  hasSelection(): boolean {
    return Boolean(
      this.anchor &&
      this.caret &&
      (this.anchor.blockId !== this.caret.blockId ||
        comparePosition(this.anchor, this.caret) !== 0),
    );
  }
  getRanges(index: TextLayoutIndex): ReturnType<typeof selectionRanges> {
    if (!this.activeBlockId || !this.caret || !this.anchor) return [];
    const block = index.getBlock(this.activeBlockId);
    return block
      ? selectionRanges(
          block.layout,
          this.anchor,
          this.caret,
          block.getRunText?.bind(block),
        )
      : [];
  }
}
class SelectionPainter {
  draw(
    context: CanvasRenderingContext2D,
    index: TextLayoutIndex,
    selection: SelectionState,
    options: {
      caretColor?: string;
      caretWidthPx?: number;
      selectionFill?: string;
    } = {},
  ): void {
    if (!selection.activeBlockId) return;
    const block = index.getBlock(selection.activeBlockId);
    if (!block) return;
    const caret = selection.caret
      ? caretRect(block.layout, selection.caret)
      : null;
    if (caret && !selection.hasSelection()) {
      context.save();
      context.fillStyle = options.caretColor ?? "#336CFF";
      context.fillRect(
        block.layout.x + caret.x,
        block.layout.y + caret.y,
        options.caretWidthPx ?? 1,
        caret.height,
      );
      context.restore();
    }
  }
}
class TextEditingController {
  private container: HTMLElement | null = null;
  private textarea: HiddenTextareaBridge | null = null;
  private index: TextLayoutIndex | null = null;
  private state: {
    activeBlockId?: string | null;
    anchor?: TextPosition | null;
    caret?: TextPosition | null;
    selectedPlainText?: string | null;
  } | null = null;
  private readOnly = false;
  constructor(
    readonly callbacks: Record<
      string,
      ((...args: unknown[]) => unknown) | undefined
    >,
    private readonly options?: {
      onChange?(): void;
      onUnhandledKeyDown?(event: KeyboardEvent): void;
    },
  ) {}
  attachContainer(container: HTMLElement | null): void {
    if (this.container === container) return;
    this.detach();
    this.container = container;
    if (container)
      this.textarea = new HiddenTextareaBridge({
        container,
        onBeforeInput: (event) => {
          if (!this.readOnly)
            this.callbacks.onBeforeInput?.({
              inputType: event.inputType,
              data: event.data,
            });
        },
        onKeyDown: (event) => this.options?.onUnhandledKeyDown?.(event),
        onPaste: (event) => {
          const text = event.clipboardData?.getData("text/plain");
          if (text && !this.readOnly)
            this.callbacks.onBeforeInput?.({
              inputType: "insertFromPaste",
              data: text.replace(/\r\n?/g, "\n"),
            });
        },
      });
  }
  setReadOnly(value: boolean): void {
    this.readOnly = value;
    if (this.textarea) this.textarea.textarea.readOnly = value;
    this.options?.onChange?.();
  }
  detach(): void {
    this.textarea?.dispose();
    this.textarea = null;
    this.container = null;
  }
  dispose(): void {
    this.clear();
    this.detach();
  }
  updateState(input: { blocks: TextBlock[]; state: typeof this.state }): void {
    this.state = input.state;
    this.index = new TextLayoutIndex({ blocks: input.blocks });
    this.options?.onChange?.();
  }
  setViewportTransform(): void {}
  isActive(): boolean {
    return Boolean(this.state?.activeBlockId);
  }
  getActiveBlockId(): string | null {
    return this.state?.activeBlockId ?? null;
  }
  getEditingState(): typeof this.state {
    return this.state;
  }
  hasTextCursorAtPoint(
    point: Point,
    options?: { restrictToBlockId?: string },
  ): boolean {
    return Boolean(this.index && hitTest(this.index, point, options));
  }
  getTextBlockIdAtPoint(
    point: Point,
    options?: { restrictToBlockId?: string },
  ): string | null {
    return this.index
      ? (hitTest(this.index, point, options)?.blockId ?? null)
      : null;
  }
  tryPointerDown(
    point: Point,
    options?: { restrictToBlockId?: string; shiftKey?: boolean },
  ): boolean {
    const position = this.index ? hitTest(this.index, point, options) : null;
    if (!position) return false;
    this.callbacks.onPointerDown?.(point, {
      shiftKey: options?.shiftKey,
      blockId: position.blockId,
    });
    this.options?.onChange?.();
    return true;
  }
  selectWordAtPoint(point: Point): boolean {
    const position = this.index ? hitTest(this.index, point) : null;
    if (!position) return false;
    this.callbacks.onSelectWordAtPoint?.(point, { blockId: position.blockId });
    return true;
  }
  selectParagraphAtPoint(point: Point): boolean {
    const position = this.index ? hitTest(this.index, point) : null;
    if (!position) return false;
    this.callbacks.onSelectParagraphAtPoint?.(point, {
      blockId: position.blockId,
    });
    return true;
  }
  pointerMove(point: Point): boolean {
    if (!this.isActive()) return false;
    this.callbacks.onPointerMove?.(point);
    return true;
  }
  pointerUp(): void {
    this.callbacks.onPointerUp?.();
  }
  activateBlockEnd(blockId: string): boolean {
    if (!this.index?.getBlock(blockId)) return false;
    this.callbacks.onActivateBlockEnd?.(blockId);
    return true;
  }
  requestInputFocus(): void {
    this.textarea?.focus();
  }
  clear(): void {
    this.callbacks.onClear?.();
    this.state = null;
    this.options?.onChange?.();
  }
  drawViewportOverlay(): void {}
  drawOverlay(): void {}
}

function normalizeClickCount(count: number): 1 | 2 | 3 {
  return count <= 1 ? 1 : count % 2 === 0 ? 2 : 3;
}
function trackPointerClick(
  previous: Record<string, unknown> | null,
  event: {
    button: number;
    clientX: number;
    clientY: number;
    detail: number;
    pointerType: string;
    timeStamp: number;
  },
  targetId: string,
): Record<string, unknown> {
  const same =
    previous != null &&
    event.timeStamp >= Number(previous.timeStamp) &&
    event.timeStamp - Number(previous.timeStamp) <= 500 &&
    Math.hypot(
      event.clientX - Number(previous.clientX),
      event.clientY - Number(previous.clientY),
    ) <= 5 &&
    previous.button === event.button &&
    previous.pointerType === event.pointerType &&
    previous.targetId === targetId;
  const count = normalizeClickCount(
    same && event.detail > 1
      ? event.detail
      : same
        ? Number(previous.count) + 1
        : 1,
  );
  return {
    count,
    timeStamp: event.timeStamp,
    clientX: event.clientX,
    clientY: event.clientY,
    button: event.button,
    pointerType: event.pointerType,
    targetId,
  };
}
function pointerMoved(
  previous: { clientX: number; clientY: number } | null,
  event: { clientX: number; clientY: number },
): boolean {
  return (
    previous != null &&
    Math.hypot(
      event.clientX - previous.clientX,
      event.clientY - previous.clientY,
    ) > 5
  );
}
function inferImageType(file: Pick<File, "name" | "type">): string | null {
  if (file.type !== "")
    return /^image\/[a-z0-9!#$&^_.+-]+$/i.test(file.type) ? file.type : null;
  const extension = /\.([^.]+)$/.exec(file.name)?.[1]?.toLowerCase();
  return extension ? (IMAGE_TYPES.get(extension) ?? null) : null;
}
async function loadImageFile(
  file: File,
): Promise<{
  bytes: Uint8Array;
  contentType: string;
  name: string;
  sourceHeight: number;
  sourceWidth: number;
}> {
  const contentType = inferImageType(file);
  if (!contentType || file.size === 0) throw new Error("Invalid image");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) throw new Error("Invalid image");
  let sourceWidth = 0;
  let sourceHeight = 0;
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    sourceWidth = bitmap.width;
    sourceHeight = bitmap.height;
    bitmap.close();
  }
  if (sourceWidth <= 0 || sourceHeight <= 0)
    throw new Error("Invalid dimensions");
  return { bytes, contentType, name: file.name, sourceWidth, sourceHeight };
}

function InsertMenu({
  ariaLabel,
  primaryItems,
  secondaryLabel,
  secondaryItems = [],
  testId,
  size = "compact",
  triggerIcon,
}: {
  ariaLabel: string;
  primaryItems: Array<Record<string, unknown>>;
  secondaryLabel?: string;
  secondaryItems?: Array<Record<string, unknown>>;
  testId?: string;
  size?: string;
  triggerIcon?: unknown;
}): unknown {
  const renderItem = (item: Record<string, unknown>) =>
    jsx.jsx(
      "button",
      {
        type: "button",
        disabled: item.disabled,
        "data-popcorn-insert-item": item.id,
        onClick: item.onSelect as (() => void) | undefined,
        children: String(item.label ?? item.id),
      },
      String(item.id),
    );
  return jsx.jsxs("div", {
    "data-testid": testId,
    "data-size": size,
    children: [
      jsx.jsx("button", {
        type: "button",
        "aria-label": ariaLabel,
        children: triggerIcon ?? "+",
      }),
      jsx.jsxs("div", {
        role: "menu",
        children: [
          primaryItems.map(renderItem),
          secondaryItems.length
            ? jsx.jsxs(jsx.Fragment, {
                children: [
                  secondaryLabel
                    ? jsx.jsx("div", { children: secondaryLabel })
                    : null,
                  secondaryItems.map(renderItem),
                ],
              })
            : null,
        ],
      }),
    ],
  });
}
function ImageUploadPanel({
  onInsert,
  onClose,
}: {
  onInsert(value: Awaited<ReturnType<typeof loadImageFile>>): void;
  onClose(): void;
}): unknown {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  return jsx.jsxs("label", {
    className: "w-[192px]",
    children: [
      jsx.jsx("input", {
        type: "file",
        accept: "image/*",
        "aria-label": "Choose image",
        disabled: loading,
        onChange: async (event: {
          currentTarget: { files?: FileList | null; value: string };
        }) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          setLoading(true);
          setError(null);
          try {
            onInsert(await loadImageFile(file));
            onClose();
          } catch {
            setError("Could not load this image. Choose another image.");
          } finally {
            setLoading(false);
          }
        },
      }),
      loading ? "Loading image…" : "Upload",
      error ? jsx.jsx("p", { role: "alert", children: error }) : null,
    ],
  });
}
function UploadImageButton({
  icon,
  onInsert,
}: {
  icon?: unknown;
  onInsert(value: Awaited<ReturnType<typeof loadImageFile>>): void;
}): unknown {
  const [open, setOpen] = React.useState(false);
  return jsx.jsxs("div", {
    children: [
      jsx.jsx("button", {
        type: "button",
        "aria-label": "Upload image",
        onClick: () => setOpen((value) => !value),
        children: icon ?? "Upload",
      }),
      open
        ? jsx.jsx(ImageUploadPanel, { onInsert, onClose: () => setOpen(false) })
        : null,
    ],
  });
}
function AlignmentIcon({
  alignment,
  className,
  ...props
}: {
  alignment: "center" | "justify" | "left" | "right";
  className?: string;
} & Record<string, unknown>): unknown {
  const paths =
    alignment === "center"
      ? ["M3.5 5H17.5", "M6.5 10H14.5", "M3.5 15H17.5"]
      : alignment === "justify"
        ? ["M3.5 5H17.5", "M3.5 10H17.5", "M3.5 15H17.5"]
        : alignment === "left"
          ? ["M3.5 5H17.5", "M3.5 10H11.5", "M3 15H14"]
          : ["M3.5 5H17.5", "M9.5 10H17.5", "M6.5 15H17.5"];
  return jsx.jsx("svg", {
    viewBox: "0 0 20 20",
    fill: "none",
    className: classNames("size-5", className),
    ...props,
    children: paths.map((path, index) =>
      jsx.jsx(
        "path",
        {
          d: path,
          stroke: "currentColor",
          strokeWidth: 1.33,
          strokeLinecap: "round",
        },
        index,
      ),
    ),
  });
}
function CenterAlignIcon(props: Record<string, unknown>): unknown {
  return AlignmentIcon({ alignment: "center", ...props });
}
function JustifyAlignIcon(props: Record<string, unknown>): unknown {
  return AlignmentIcon({ alignment: "justify", ...props });
}
function LeftAlignIcon(props: Record<string, unknown>): unknown {
  return AlignmentIcon({ alignment: "left", ...props });
}
function RightAlignIcon(props: Record<string, unknown>): unknown {
  return AlignmentIcon({ alignment: "right", ...props });
}
function InsertIcon(props: Record<string, unknown>): unknown {
  return MaskIcon({
    source: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
    ...props,
  });
}
function UploadIcon(props: Record<string, unknown>): unknown {
  return MaskIcon({
    source: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
    ...props,
  });
}
function copyArrayBuffer(value: Uint8Array): ArrayBuffer {
  const bytes = new Uint8Array(value.byteLength);
  bytes.set(value);
  return bytes.buffer;
}

export {
  initialize as $,
  initialize as A,
  initialize as B,
  InsertMenu as C,
  initialize as Ct,
  loadImageFile as D,
  initialize as E,
  selectionRanges as F,
  findSegment as G,
  initialize as H,
  initialize as I,
  HiddenTextareaBridge as J,
  initialize as K,
  SelectionPainter as L,
  TextEditingController as M,
  initialize as N,
  trackPointerClick as O,
  SelectionState as P,
  arrowDirection as Q,
  initialize as R,
  InsertIcon as S,
  HeaderGroup as St,
  inferImageType as T,
  initialize as Tt,
  caretRect as U,
  hitTest as V,
  clampPosition as W,
  ViewportController as X,
  initialize as Y,
  initialize as Z,
  UploadIcon as _,
  initialize as _t,
  LeftAlignIcon as a,
  ExternalStore as at,
  InsertIcon as b,
  initialize as bt,
  JustifyAlignIcon as c,
  installShapePresets as ct,
  initialize as d,
  initialize as dt,
  isEditableTarget as et,
  ImageUploadPanel as f,
  isPopcornDev as ft,
  UploadIcon as g,
  initialize as gt,
  InsertIcon as h,
  rethrowUnlessDisposed as ht,
  RightAlignIcon as i,
  initialize as it,
  normalizeClickCount as j,
  pointerMoved as k,
  CenterAlignIcon as l,
  createLogger as lt,
  initialize as m,
  PopcornTransportTerminalError as mt,
  initialize as n,
  localToClient as nt,
  initialize as o,
  initialize as ot,
  UploadImageButton as p,
  WorkerTransport as pt,
  lineX as q,
  RightAlignIcon as r,
  clientToLocal as rt,
  JustifyAlignIcon as s,
  initialize as st,
  copyArrayBuffer as t,
  allowedShortcut as tt,
  initialize as u,
  initialize as ut,
  InsertIcon as v,
  useDisposable as vt,
  initialize as w,
  HeaderLayout as wt,
  InsertIcon as x,
  ArtifactHeader as xt,
  InsertIcon as y,
  ZoomSelect as yt,
  TextLayoutIndex as z,
};

initialize();
