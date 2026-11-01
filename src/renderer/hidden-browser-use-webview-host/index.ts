import '@rchunk/rolldown-runtime';
import * as SharedChunk from '@rchunk/app-shared';
import * as InitialChunk from '@rchunk/app-initial';
import * as WebviewChunk from '@rchunk/webview';

interface JsxRuntime {
  Fragment: unknown;
  jsx(type: unknown, props: Record<string, unknown>, key?: unknown): unknown;
}

interface ReactRuntime {
  useRef<Value>(initialValue: Value): { current: Value };
  useSyncExternalStore<Value>(
    subscribe: (listener: () => void) => () => void,
    getSnapshot: () => Value,
    getServerSnapshot: () => Value,
  ): Value;
}

interface ChangeStore<Value> {
  get(): Value;
  on(event: 'change', listener: () => void): () => void;
}

interface BrowserTabSnapshot {
  tabType: unknown;
  url: string;
}

interface BrowserUseManager {
  getSnapshot(conversationId: string, browserTabId: string): BrowserTabSnapshot | null;
  subscribe(listener: () => void): () => void;
}

interface InitialRuntime {
  Vvt: { activeTab$: unknown };
  qvt: { activeTab$: unknown };
  mbt: unknown;
  dbt: unknown;
  _bt: unknown;
  vbt: unknown;
  hbt: unknown;
  pgt(
    tabs: { bottom: unknown; right: unknown },
    visible: { bottom: boolean; right: boolean },
  ): string[];
  ggt: BrowserUseManager;
}

interface SharedRuntime {
  HX<Value>(signal: unknown): Value;
  I3(): JsxRuntime;
  Jq: { WEB: unknown };
  e6(): ReactRuntime;
  hJ(value: string): string;
  x_(): number;
}

interface WebviewRuntime {
  t(props: Record<string, unknown>): unknown;
}

const shared = SharedChunk as unknown as SharedRuntime;
const initial = InitialChunk as unknown as InitialRuntime;
const webview = WebviewChunk as unknown as WebviewRuntime;
const React = shared.e6();
const jsx = shared.I3();

function readZero(): number {
  return 0;
}

function HiddenBrowserUseWebview(props: {
  browserTabId: string;
  conversationId: string;
}): unknown {
  const { browserTabId, conversationId } = props;
  const windowZoom = shared.x_();
  const webviewRef = React.useRef<unknown>(null);
  const snapshot = React.useSyncExternalStore(
    initial.ggt.subscribe,
    () => initial.ggt.getSnapshot(conversationId, browserTabId),
    () => null,
  );

  if (snapshot != null && snapshot.tabType !== shared.Jq.WEB) return null;

  const initialUrl = snapshot == null || snapshot.url.length === 0
    ? 'about:blank'
    : snapshot.url;

  return jsx.jsx(webview.t, {
    bounds: null,
    browserTabId,
    conversationId,
    hostKind: 'hidden-browser-use',
    initialUrl,
    isVisible: false,
    scale: 1,
    shouldBootstrapWhenHidden: true,
    shouldPaint: false,
    webviewRef,
    windowZoom,
  });
}

function HiddenBrowserUseWebviewHost(props: {
  browserUseTabIdsKey: string;
  conversationId: string;
}): unknown {
  const bottomTab = shared.HX<unknown>(initial.Vvt.activeTab$);
  const rightTab = shared.HX<unknown>(initial.qvt.activeTab$);
  const bottomOpen = shared.HX<boolean>(initial.mbt);
  const bottomAnimationStore = shared.HX<ChangeStore<number>>(initial.dbt);
  const bottomAnimationCount = React.useSyncExternalStore(
    (listener) => bottomAnimationStore.on('change', listener),
    () => bottomAnimationStore.get(),
    readZero,
  );
  const rightMounted = shared.HX<boolean>(initial._bt);
  const rightOpen = shared.HX<boolean>(initial.vbt);
  const rightAnimationStore = shared.HX<ChangeStore<number>>(initial.hbt);
  const rightAnimationCount = React.useSyncExternalStore(
    (listener) => rightAnimationStore.on('change', listener),
    () => rightAnimationStore.get(),
    readZero,
  );

  const mountedBrowserTabIds = new Set(initial.pgt(
    { bottom: bottomTab, right: rightTab },
    {
      bottom: bottomOpen || bottomAnimationCount > 0,
      right: (rightMounted && rightOpen) || rightAnimationCount > 0,
    },
  ));
  const browserTabIds = props.browserUseTabIdsKey
    .split('\0')
    .map(shared.hJ)
    .filter((browserTabId) => !mountedBrowserTabIds.has(browserTabId));

  if (browserTabIds.length === 0) return null;

  return jsx.jsx(jsx.Fragment, {
    children: browserTabIds.map((browserTabId) => jsx.jsx(
      HiddenBrowserUseWebview,
      { browserTabId, conversationId: props.conversationId },
      browserTabId,
    )),
  });
}

export { HiddenBrowserUseWebviewHost };
