// Preloads durable pinned content tabs while their route is inactive. Release chunk: preload-bridge-a281bb5f90a3.js.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as webviewChunk from "@rchunk/webview";

interface JsxRuntime {
  jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown;
}
interface ReactRuntime {
  useContext(context: unknown): unknown;
  useState<Value>(factory: () => Value): [Value];
  useSyncExternalStore<Value>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => Value,
    getServerSnapshot: () => Value,
  ): Value;
  useRef<Value>(value: Value): { current: Value };
}
interface Scope {
  value: { routeKind: string; conversationId: string };
  get(signal: unknown, parameter?: unknown): unknown;
  watch(listener: (scope: Scope) => void): () => void;
}
interface Pin {
  id: string;
  accountId?: string;
  hostId?: string;
  threadId: string;
  clientThreadId?: string;
  tabId: string;
  tabKind: string;
  routePath: string;
  routeSearch: string;
}
interface Descriptor {
  kind: string;
  tabId: string;
  payloadVersion?: number;
}
interface Layout {
  routes: Descriptor[];
  topology: { right: { tabIds: string[] }; bottom: { tabIds: string[] } };
}
interface TabManager {
  tabById$: unknown;
}
interface PageSnapshot {
  isLoading?: boolean;
  isSuspended?: boolean;
}
interface PageRegistry {
  getSnapshot(scope: unknown, tabId: string): PageSnapshot | null;
  subscribe(listener: () => void): () => void;
  pages: {
    getHost(
      scope: unknown,
      tabId: string,
    ): { hasRegisteredNativeHost(): boolean } | null;
  };
  isBrowserUseTab(scope: unknown, tabId: string): boolean;
}
interface SharedRuntime {
  $3(): unknown;
  FX(): void;
  I3(): JsxRuntime;
  LX(context: unknown): Scope;
  Mm: string;
  Nm(): void;
  Q3: { error(message: string, details: unknown): void };
  QI(): void;
  Z3(): void;
  ZI: unknown;
  __<Value>(factory: () => Value): Value;
  e6(): ReactRuntime;
  g_(): void;
  kB: string;
  wL(): void;
  x_(): number;
  y_(): void;
}
interface InitialRuntime {
  $en: unknown;
  BDt(scope: Scope, tabId: string): boolean;
  CY(): void;
  F0t(): void;
  FDt(): void;
  Fgt(): void;
  H0t(): void;
  I0t(): void;
  Jst: string;
  Ken(scope: Scope): string | null;
  L0t: unknown;
  LDt(scope: Scope, descriptor: Descriptor): boolean;
  Mgt(conversationId: string, browserTabId: string): string | null;
  Q_t: unknown;
  SY: unknown;
  Vvt: TabManager;
  Wvt(): void;
  Yen(): void;
  Yst(): void;
  Z_t(): void;
  _gt(): void;
  aut: string;
  bl: unknown;
  clt(descriptor: Descriptor): { browserTabId: string } | null;
  cyt: unknown;
  dut(): void;
  dyt: unknown;
  etn(input: { pathname: string; routeTemplate: string; search: string }): {
    routeKind: string;
    conversationId?: string;
    hostId?: string;
  };
  evt: unknown;
  fpn(): void;
  ggt: PageRegistry;
  itn(): void;
  iyt(): void;
  jDt(kind: string): {
    durableRoute?: { version?: number };
    isAvailable(scope: Scope): boolean;
  } | null;
  lpn: unknown;
  mun: unknown;
  nct(): void;
  ng(): void;
  nvt(): void;
  out(): void;
  oyt(layout: unknown): Layout | null;
  qvt: TabManager;
  rg(input: {
    scope: Scope;
    revealAndFocus: false;
    descriptor: Descriptor;
    insertPosition: undefined;
    isDisconnected(): boolean;
    reason: string;
    target: string;
  }): Promise<boolean>;
  slt(): void;
  tct: string;
  tvt: unknown;
  uut: string;
  xl(): void;
  zDt(): void;
}
interface WebviewRuntime {
  n(): void;
  t: unknown;
}

const shared = appSharedChunk as unknown as SharedRuntime;
const initial = appInitialChunk as unknown as InitialRuntime;
const webview = webviewChunk as unknown as WebviewRuntime;
let React: ReactRuntime;
let jsx: JsxRuntime;
let eligibleKinds: Set<string>;

function pinKey(pin: Pin): string {
  return JSON.stringify([
    pin.id,
    pin.accountId,
    pin.hostId,
    pin.threadId,
    pin.clientThreadId,
    pin.tabId,
    pin.tabKind,
    pin.routePath,
    pin.routeSearch,
  ]);
}
function routeForPin(pin: Pin) {
  const route = initial.etn({
    pathname: pin.routePath,
    routeTemplate: shared.kB,
    search: pin.routeSearch,
  });
  return route.routeKind === "local-thread" &&
    route.conversationId === pin.threadId &&
    (route.hostId == null || route.hostId === pin.hostId)
    ? route
    : null;
}
function matchesCurrentRoute(
  route: { pathname?: string; search?: string } | null,
  pin: Pin,
): boolean {
  return (
    route?.pathname === pin.routePath &&
    new URLSearchParams(route.search).get("hostId") ===
      new URLSearchParams(pin.routeSearch).get("hostId")
  );
}
function isCurrentPin(scope: Scope, pin: Pin): boolean {
  const current = scope.get(initial.L0t, pin.id) as Pin | null;
  const identity = scope.get(initial.evt) as Pin | null;
  const route = scope.get(initial.lpn) as {
    pathname?: string;
    search?: string;
  } | null;
  return (
    current != null &&
    pinKey(current) === pinKey(pin) &&
    (scope.get(initial.Q_t) as string[]).includes(pin.id) &&
    scope.get(initial.tvt, pin) == null &&
    !matchesCurrentRoute(route, pin) &&
    identity?.accountId === pin.accountId &&
    identity.hostId === pin.hostId &&
    identity.threadId === pin.threadId &&
    identity.clientThreadId === pin.clientThreadId
  );
}

function waitForPageReady(
  pageScope: unknown,
  tabId: string,
  previous: PageSnapshot | null,
  signal: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = () => undefined;
    const timeout = globalThis.setTimeout(() => finish(false), 15000);
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      unsubscribe();
      globalThis.clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      resolve(value);
    };
    const abort = () => finish(false);
    const check = () => {
      const snapshot = initial.ggt.getSnapshot(pageScope, tabId);
      if (
        initial.ggt.pages
          .getHost(pageScope, tabId)
          ?.hasRegisteredNativeHost() &&
        snapshot != null &&
        (previous == null || snapshot !== previous) &&
        !snapshot.isLoading &&
        !snapshot.isSuspended
      )
        finish(true);
    };
    unsubscribe = initial.ggt.subscribe(check);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) finish(false);
    else check();
  });
}

class PreloadScheduler {
  private accountId: unknown;
  private completed = new Set<string>();
  private errors = new Set<string>();
  private retry = new Map<string, { attempts: number; at: number }>();
  private listeners = new Set<() => void>();
  private pending: { key: string; pin: Pin } | null = null;
  private stopWatch: (() => void) | null = null;
  private cancelIdle: (() => void) | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  constructor(private scope: Scope) {}
  getSnapshot = () => this.pending;
  getServerSnapshot = () => null;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1)
      this.stopWatch = this.scope.watch((scope) => this.schedule(scope));
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopWatch?.();
        this.stopWatch = null;
        this.cancelScheduled();
        this.pending = null;
      }
    };
  };
  finish(key: string, result: "prepared" | "deferred" | "ineligible") {
    if (this.pending?.key !== key) return;
    this.pending = null;
    if (result === "deferred") {
      const attempts = (this.retry.get(key)?.attempts ?? 0) + 1;
      this.retry.set(key, {
        attempts,
        at: Date.now() + Math.min(60000, 1000 * 5 ** (attempts - 1)),
      });
    } else {
      this.completed.add(key);
      this.retry.delete(key);
    }
    this.emit();
  }
  continue() {
    this.schedule();
  }
  reportError(key: string, kind: string, error: unknown) {
    if (this.errors.has(key)) return;
    this.errors.add(key);
    shared.Q3.error("Failed to preload pinned content tab", {
      safe: { kind },
      sensitive: { error },
    });
  }
  schedule(snapshot: Scope = this.scope) {
    this.cancelScheduled();
    if (this.listeners.size === 0) return;
    // I0t is the pinned-content-tab collection. dyt is the active
    // conversation id used while materialising a saved tab route. Keeping
    // these two obfuscated exports distinct is important: subscribing to dyt
    // as though it were the pin collection makes the scope watcher throw an
    // AggregateError as soon as the bridge mounts.
    const pins = snapshot.get(initial.I0t) as Pin[];
    const pinnedIds = new Set(snapshot.get(initial.Q_t) as string[]);
    const accountId = snapshot.get(initial.mun);
    if (this.accountId !== accountId) {
      this.accountId = accountId;
      if (this.pending) this.completed.add(this.pending.key);
      for (const key of this.retry.keys()) this.completed.add(key);
      this.retry.clear();
      this.pending = null;
      this.emit();
    }
    const route = snapshot.get(initial.lpn) as {
      pathname?: string;
      search?: string;
    } | null;
    const validKeys = new Set(pins.map(pinKey));
    for (const key of this.completed)
      if (!validKeys.has(key)) this.completed.delete(key);
    for (const key of this.retry.keys())
      if (!validKeys.has(key)) this.retry.delete(key);
    const candidates = pins.filter(
      (pin) =>
        pinnedIds.has(pin.id) &&
        routeForPin(pin) != null &&
        !matchesCurrentRoute(route, pin) &&
        snapshot.get(initial.tvt, pin) == null,
    );
    if (
      this.pending &&
      !candidates.some((pin) => pinKey(pin) === this.pending?.key)
    ) {
      this.pending = null;
      this.emit();
      return;
    }
    if (this.pending) return;
    const now = Date.now();
    const candidate = candidates.find(
      (pin) =>
        !this.completed.has(pinKey(pin)) &&
        (this.retry.get(pinKey(pin))?.at ?? 0) <= now,
    );
    if (candidate) {
      const run = () => {
        this.cancelIdle = null;
        const current = this.scope.get(initial.L0t, candidate.id) as Pin | null;
        if (
          this.listeners.size !== 0 &&
          this.scope.get(initial.mun) === accountId &&
          current &&
          pinKey(current) === pinKey(candidate) &&
          this.scope.get(initial.tvt, candidate) == null &&
          (this.scope.get(initial.Q_t) as string[]).includes(candidate.id) &&
          routeForPin(candidate) != null &&
          !matchesCurrentRoute(
            this.scope.get(initial.lpn) as {
              pathname?: string;
              search?: string;
            } | null,
            candidate,
          )
        ) {
          this.pending = { key: pinKey(candidate), pin: candidate };
          this.emit();
        } else this.schedule();
      };
      const idleId =
        typeof window !== "undefined"
          ? window.requestIdleCallback?.(run, { timeout: 2000 })
          : undefined;
      if (idleId == null) {
        const timer = globalThis.setTimeout(run, 0);
        this.cancelIdle = () => globalThis.clearTimeout(timer);
      } else this.cancelIdle = () => window.cancelIdleCallback?.(idleId);
      return;
    }
    const retryTimes = candidates.flatMap((pin) => {
      const entry = this.retry.get(pinKey(pin));
      return !this.completed.has(pinKey(pin)) && entry ? [entry.at] : [];
    });
    if (retryTimes.length)
      this.retryTimer = globalThis.setTimeout(
        () => this.schedule(),
        Math.max(0, Math.min(...retryTimes) - now),
      );
  }
  private cancelScheduled() {
    this.cancelIdle?.();
    this.cancelIdle = null;
    if (this.retryTimer) {
      globalThis.clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
  private emit() {
    for (const listener of this.listeners) listener();
  }
}

class PinPreloader {
  private listeners = new Set<() => void>();
  private browserTabId: string | null = null;
  private stopWatch: (() => void) | null = null;
  private abort: AbortController | null = null;
  private accountId: unknown;
  constructor(
    private scope: Scope,
    private pin: Pin,
    private scheduler: PreloadScheduler,
  ) {
    this.accountId = scope.get(initial.mun);
  }
  getSnapshot = () => this.browserTabId;
  getServerSnapshot = () => null;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      const controller = new AbortController();
      this.abort = controller;
      if (!this.isCurrent()) {
        controller.abort();
        this.scheduler.finish(pinKey(this.pin), "deferred");
        return () => {
          this.listeners.delete(listener);
          this.scheduler.continue();
        };
      }
      this.stopWatch = this.scope.watch((scope) => {
        if (
          scope.get(initial.mun) !== this.accountId ||
          !isCurrentPin(scope, this.pin)
        ) {
          controller.abort();
          this.scheduler.finish(pinKey(this.pin), "deferred");
        }
      });
      if (!controller.signal.aborted)
        void this.prepare(controller)
          .catch((error) => {
            if (!controller.signal.aborted && this.isCurrent())
              this.scheduler.reportError(
                pinKey(this.pin),
                this.pin.tabKind,
                error,
              );
            return "deferred" as const;
          })
          .then((result) => {
            if (!controller.signal.aborted && this.isCurrent())
              this.scheduler.finish(pinKey(this.pin), result);
          });
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.abort?.abort();
        this.abort = null;
        this.stopWatch?.();
        this.stopWatch = null;
        this.scheduler.continue();
      }
    };
  };
  private setBrowserTabId(tabId: string) {
    this.browserTabId = tabId;
    for (const listener of this.listeners) listener();
  }
  private isCurrent() {
    return (
      this.scope.get(initial.mun) === this.accountId &&
      isCurrentPin(this.scope, this.pin)
    );
  }
  private async prepare(
    controller: AbortController,
  ): Promise<"prepared" | "deferred" | "ineligible"> {
    const disconnected = () => controller.signal.aborted || !this.isCurrent();
    if (disconnected() || this.scope.value.routeKind !== "local-thread")
      return "deferred";
    const conversationId = this.scope.value.conversationId;
    const layout = initial.oyt(this.scope.get(initial.cyt, conversationId));
    const descriptor = layout?.routes.find(
      (route) =>
        route.tabId === this.pin.tabId && route.kind === this.pin.tabKind,
    );
    const target = layout?.topology.right.tabIds.includes(this.pin.tabId)
      ? "right"
      : layout?.topology.bottom.tabIds.includes(this.pin.tabId)
        ? "bottom"
        : null;
    if (!layout || !descriptor || !target) return "deferred";
    if (
      !eligibleKinds.has(descriptor.kind) ||
      initial.BDt(this.scope, this.pin.tabId) ||
      !initial.LDt(this.scope, descriptor)
    )
      return "ineligible";
    const definition = initial.jDt(descriptor.kind);
    if (!definition) return "deferred";
    if (definition.durableRoute?.version !== descriptor.payloadVersion)
      return "ineligible";
    if (definition.isAvailable(this.scope) !== true) return "deferred";
    const manager = target === "right" ? initial.qvt : initial.Vvt;
    const routeActive = this.scope.get(initial.dyt) === conversationId;
    const tab = this.scope.get(manager.tabById$, this.pin.tabId);
    if (
      !routeActive &&
      tab == null &&
      !(await initial.rg({
        scope: this.scope,
        revealAndFocus: false,
        descriptor,
        insertPosition: undefined,
        isDisconnected: disconnected,
        reason: "pinned-tab-preload",
        target,
      }))
    )
      return "deferred";
    if (disconnected()) return "deferred";
    if (descriptor.kind === "terminal") return "prepared";
    if (this.scope.get(manager.tabById$, this.pin.tabId) == null)
      return "deferred";
    if (descriptor.kind !== "browser") return "prepared";
    const browser = initial.clt(descriptor);
    if (!browser) return "ineligible";
    const pageScope = initial.Ken(this.scope);
    if (!pageScope) return "deferred";
    if (initial.ggt.isBrowserUseTab(pageScope, browser.browserTabId))
      return "ineligible";
    const host = initial.ggt.pages.getHost(pageScope, browser.browserTabId);
    const previous = initial.ggt.getSnapshot(pageScope, browser.browserTabId);
    if (!host) this.setBrowserTabId(browser.browserTabId);
    return (await waitForPageReady(
      pageScope,
      browser.browserTabId,
      host ? null : previous,
      controller.signal,
    ))
      ? "prepared"
      : "deferred";
  }
}

function HiddenBrowser({
  browserTabId,
  conversationId,
  pin,
}: {
  browserTabId: string;
  conversationId: string;
  pin: Pin;
}): unknown {
  const scope = shared.LX(initial.$en);
  const webviewRef = React.useRef(null);
  const zoom = shared.x_();
  const shouldDispose = shared.__(
    () =>
      !isCurrentPin(scope, pin) &&
      !matchesCurrentRoute(
        scope.get(initial.lpn) as { pathname?: string; search?: string } | null,
        pin,
      ),
  );
  return jsx.jsx(webview.t, {
    bounds: null,
    browserTabId,
    conversationId,
    initialUrl: initial.Mgt(conversationId, browserTabId) ?? "about:blank",
    isVisible: false,
    scale: 1,
    shouldBootstrapWhenHidden: true,
    shouldDisposeOnUnmount: shouldDispose,
    shouldPaint: false,
    webviewRef,
    windowZoom: zoom,
  });
}
function PreloadPin({
  pin,
  scheduler,
}: {
  pin: Pin;
  scheduler: PreloadScheduler;
}): unknown {
  const scope = shared.LX(initial.$en);
  const [preloader] = React.useState(
    () => new PinPreloader(scope, pin, scheduler),
  );
  const browserTabId = React.useSyncExternalStore(
    preloader.subscribe,
    preloader.getSnapshot,
    preloader.getServerSnapshot,
  );
  return browserTabId == null
    ? null
    : jsx.jsx(HiddenBrowser, {
        browserTabId,
        conversationId: initial.Ken(scope) ?? pin.threadId,
        pin,
      });
}
function BridgeContent(): unknown {
  const scope = shared.LX(shared.ZI);
  const [scheduler] = React.useState(() => new PreloadScheduler(scope));
  const pending = React.useSyncExternalStore(
    scheduler.subscribe,
    scheduler.getSnapshot,
    scheduler.getServerSnapshot,
  );
  if (!pending) return null;
  const route = routeForPin(pending.pin);
  return route == null
    ? null
    : jsx.jsx(
        initial.SY,
        {
          route,
          children: jsx.jsx(PreloadPin, { pin: pending.pin, scheduler }),
        },
        pending.key,
      );
}
function PinnedContentTabPreloadBridge(): unknown {
  return React.useContext(initial.bl) ? jsx.jsx(BridgeContent, {}) : null;
}

function initialize(): void {
  shared.$3();
  shared.FX();
  shared.wL();
  React = shared.e6();
  initial.H0t();
  initial.nvt();
  initial.zDt();
  initial.Wvt();
  initial.FDt();
  shared.y_();
  initial.out();
  initial._gt();
  initial.Fgt();
  shared.Nm();
  initial.Yen();
  initial.slt();
  webview.n();
  initial.fpn();
  initial.dut();
  shared.QI();
  initial.itn();
  initial.CY();
  initial.Yst();
  initial.nct();
  initial.ng();
  initial.iyt();
  shared.Z3();
  initial.xl();
  shared.g_();
  initial.Z_t();
  initial.F0t();
  jsx = shared.I3();
  eligibleKinds = new Set([
    initial.aut,
    shared.Mm,
    initial.Jst,
    initial.tct,
    initial.uut,
  ]);
}
initialize();

export { PinnedContentTabPreloadBridge };
