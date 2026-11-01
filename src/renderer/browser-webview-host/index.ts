import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';

interface ReactRuntime {
  useId(): string;
  useLayoutEffect(effect: () => void | (() => void), dependencies: unknown[]): void;
  useRef<Value>(initialValue: Value): { current: Value };
  useSyncExternalStore<Value>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => Value,
    getServerSnapshot: () => Value,
  ): Value;
}

interface PortalRuntime {
  createPortal(children: unknown, container: Element): unknown;
}

interface ManagedWebview {
  disposed: boolean;
  hasRegisteredNativeHost(): boolean;
  isPainted(): boolean;
}

interface BrowserPagesRuntime {
  claimMountGeneration(conversationId: string, browserTabId: string, ownerId: string): number;
  detachElectronWebview(
    webview: ManagedWebview,
    webviewRef: unknown,
    hostKind: string,
    mountGeneration: number,
  ): void;
  disposeHost(conversationId: string, browserTabId: string, reason: 'web'): void;
  getCursorOverlayHost(conversationId: string, browserTabId: string): Element | null;
  getHost(conversationId: string, browserTabId: string): ManagedWebview | null;
  getMountGeneration(conversationId: string, browserTabId: string): number;
  getWebview(
    conversationId: string,
    browserTabId: string,
    initialUrl: string | undefined,
    options: {
      adoptionLease: unknown;
      adoptedWebContentsId: unknown;
      hostKind: string;
    },
  ): ManagedWebview;
  hasOtherMountGenerationClaim(
    conversationId: string,
    browserTabId: string,
    ownerId: string,
    mountGeneration: number,
  ): boolean;
  releaseMountGeneration(
    conversationId: string,
    browserTabId: string,
    ownerId: string,
    mountGeneration: number,
  ): number;
  setPrewarmedEmptyWebview(webview: ManagedWebview, value: boolean): void;
  syncElectronWebview(
    webview: ManagedWebview,
    state: {
      bounds: unknown;
      clipBounds: unknown;
      isExiting: boolean;
      isVisible: boolean;
      mountGeneration: number;
      opacity: unknown;
      scale: unknown;
      shouldBootstrap: boolean;
      shouldPaint: unknown;
      windowZoom: unknown;
    },
    webviewRef: unknown,
    hostKind: string,
  ): void;
}

interface BrowserWebviewHostProps {
  adoptionLease?: unknown;
  adoptedWebContentsId?: unknown;
  bounds?: unknown;
  browserTabId: string;
  children?: unknown;
  clipBounds?: unknown;
  conversationId: string;
  hostKind?: string;
  initialUrl?: string;
  isPrewarmedEmptyTab?: boolean;
  isExiting?: boolean;
  isVisible?: boolean;
  opacity?: unknown;
  scale?: unknown;
  shouldBootstrapWhenHidden?: boolean;
  shouldDisposeOnUnmount?: () => boolean;
  shouldPaint?: unknown;
  webviewRef?: unknown;
  windowZoom?: unknown;
}

interface SharedRuntime {
  P3(): PortalRuntime;
  __<Callback extends (...arguments_: never[]) => unknown>(callback: Callback): Callback;
  e6(): ReactRuntime;
  g_(): void;
}

interface InitialRuntime {
  _gt(): void;
  ggt: {
    pages: BrowserPagesRuntime;
    subscribe(listener: () => void): () => void;
  };
}

const shared = SharedChunk as unknown as SharedRuntime;
const initial = InitialChunk as unknown as InitialRuntime;
let React: ReactRuntime;
let portals: PortalRuntime;

function readNull(): null {
  return null;
}

function syncMode(input: {
  hasManagedWebview: boolean;
  isPresented: boolean;
  shouldBootstrapWhenHidden?: boolean;
}): 'bootstrap' | 'skip' | 'sync' {
  return input.isPresented
    ? 'sync'
    : input.shouldBootstrapWhenHidden
      ? input.hasManagedWebview ? 'sync' : 'bootstrap'
      : 'skip';
}

function webviewKey(conversationId: string, browserTabId: string): string {
  return `${conversationId}\0${browserTabId}`;
}

function BrowserWebviewHost(props: BrowserWebviewHostProps): unknown {
  const {
    adoptionLease,
    adoptedWebContentsId,
    bounds,
    browserTabId,
    children,
    clipBounds,
    conversationId,
    hostKind = 'right-panel',
    initialUrl,
    isPrewarmedEmptyTab = false,
    isExiting = false,
    isVisible,
    opacity,
    scale,
    shouldBootstrapWhenHidden,
    shouldDisposeOnUnmount,
    shouldPaint,
    webviewRef,
    windowZoom,
  } = props;
  const managedWebview = React.useRef<ManagedWebview | null>(null);
  const ownerId = React.useId();
  const claimed = React.useRef(false);
  const mounted = React.useRef(false);
  const mountGeneration = React.useRef(
    initial.ggt.pages.getMountGeneration(conversationId, browserTabId),
  );
  const readCurrentKey = shared.__(
    () => webviewKey(conversationId, browserTabId),
  );
  const cursorOverlayHost = React.useSyncExternalStore(
    initial.ggt.subscribe,
    () => initial.ggt.pages.getCursorOverlayHost(conversationId, browserTabId),
    readNull,
  );

  React.useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const isPresented = Boolean(isVisible || isExiting) && bounds != null;
  React.useLayoutEffect(() => {
    const keyAtClaim = webviewKey(conversationId, browserTabId);
    const mode = syncMode({
      hasManagedWebview: managedWebview.current != null,
      isPresented,
      shouldBootstrapWhenHidden,
    });
    if (mode === 'skip') {
      claimed.current = false;
      mountGeneration.current = initial.ggt.pages.getMountGeneration(
        conversationId,
        browserTabId,
      );
      return;
    }

    const generation = initial.ggt.pages.claimMountGeneration(
      conversationId,
      browserTabId,
      ownerId,
    );
    mountGeneration.current = generation;
    claimed.current = true;
    return () => {
      claimed.current = false;
      queueMicrotask(() => {
        if (mounted.current && readCurrentKey() === keyAtClaim && claimed.current) return;
        const nextGeneration = initial.ggt.pages.releaseMountGeneration(
          conversationId,
          browserTabId,
          ownerId,
          generation,
        );
        if (mountGeneration.current === generation) {
          mountGeneration.current = nextGeneration;
        }
      });
    };
  }, [browserTabId, conversationId, readCurrentKey, isPresented, ownerId, shouldBootstrapWhenHidden]);

  React.useLayoutEffect(() => {
    const keyAtMount = webviewKey(conversationId, browserTabId);
    return () => {
      const webview = managedWebview.current;
      const generation = mountGeneration.current;
      const shouldDispose = shouldDisposeOnUnmount?.() ?? false;
      queueMicrotask(() => {
        if (mounted.current && readCurrentKey() === keyAtMount) return;
        if (initial.ggt.pages.hasOtherMountGenerationClaim(
          conversationId,
          browserTabId,
          ownerId,
          generation,
        )) return;
        if (webview != null) {
          if (
            shouldDispose
            && initial.ggt.pages.getHost(conversationId, browserTabId) === webview
            && initial.ggt.pages.getMountGeneration(conversationId, browserTabId) === generation
            && !webview.isPainted()
          ) {
            initial.ggt.pages.disposeHost(conversationId, browserTabId, 'web');
          } else {
            initial.ggt.pages.detachElectronWebview(
              webview,
              webviewRef,
              hostKind,
              generation,
            );
          }
          if (managedWebview.current === webview) managedWebview.current = null;
        }
      });
    };
  }, [browserTabId, conversationId, readCurrentKey, hostKind, ownerId, shouldDisposeOnUnmount, webviewRef]);

  React.useLayoutEffect(() => {
    if (managedWebview.current?.disposed) managedWebview.current = null;
    const previous = managedWebview.current;
    const mode = syncMode({
      hasManagedWebview: previous != null,
      isPresented,
      shouldBootstrapWhenHidden,
    });
    if (mode === 'skip') {
      if (previous != null) {
        const generation = mountGeneration.current;
        if (!initial.ggt.pages.hasOtherMountGenerationClaim(
          conversationId,
          browserTabId,
          ownerId,
          generation,
        )) {
          initial.ggt.pages.detachElectronWebview(
            previous,
            webviewRef,
            hostKind,
            generation,
          );
        }
      }
      if (managedWebview.current === previous) managedWebview.current = null;
      return;
    }

    const webview = initial.ggt.pages.getWebview(
      conversationId,
      browserTabId,
      initialUrl,
      { adoptionLease, adoptedWebContentsId, hostKind },
    );
    managedWebview.current = webview;
    initial.ggt.pages.setPrewarmedEmptyWebview(webview, isPrewarmedEmptyTab);
    initial.ggt.pages.syncElectronWebview(
      webview,
      {
        bounds,
        clipBounds,
        isExiting,
        isVisible: isPresented,
        mountGeneration: mountGeneration.current,
        opacity,
        scale,
        shouldBootstrap:
          mode === 'bootstrap'
          || (!isPresented && Boolean(shouldBootstrapWhenHidden) && !webview.hasRegisteredNativeHost()),
        shouldPaint,
        windowZoom,
      },
      webviewRef,
      hostKind,
    );
  }, [
    browserTabId,
    conversationId,
    hostKind,
    initialUrl,
    isPrewarmedEmptyTab,
    adoptionLease,
    adoptedWebContentsId,
    bounds,
    clipBounds,
    isExiting,
    isPresented,
    ownerId,
    opacity,
    scale,
    shouldPaint,
    shouldBootstrapWhenHidden,
    webviewRef,
    windowZoom,
  ]);

  if (cursorOverlayHost == null || children == null) return null;
  return portals.createPortal(children, cursorOverlayHost);
}

function initialize(): void {
  React = shared.e6();
  portals = shared.P3();
  shared.g_();
  initial._gt();
}

initialize();

export { initialize as n, BrowserWebviewHost as t };
