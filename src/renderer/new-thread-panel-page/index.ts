// new-thread-panel-page —— 新建线程面板的兼容入口，统一回退到首页。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as announcementsChunk from "@rchunk/codex-home-announcements-current";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  n4: useIntl,
} = appSharedChunk;
const {
  Dht: initializeNewThreadPanelState,
  Du: initializeNewThreadComposer,
  Oht: newThreadPanelState,
  Qgn: initializeAccountContext,
  Ygn: Navigate,
  cln: initializeComposerLayout,
  ifn: initializeFeatureGates,
  ofn: useFeatureGate,
} = appInitialChunk;
const {
  P: initializeNewThreadPanel,
  ds: newThreadPanelGate,
  dt: initializeNewThreadPanelAnalytics,
  ko: initializeNewThreadPanelLayout,
  r: initializeNewThreadPanelIcons,
  rt: initializeNewThreadPanelRouting,
  us: newThreadSurfaceGate,
} = appPrimaryChunk;
const { r: initializeCodexHomeAnnouncements } = announcementsChunk;

let jsx: import("@rchunk/app-shared").JsxRuntime;

function NewThreadPanelPage(): unknown {
  useIntl();
  useSignalValue(newThreadPanelState);
  useFeatureGate(newThreadSurfaceGate);
  return jsx.jsx(Navigate, { to: "/", replace: true });
}

function initializeNewThreadPanelPage(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeSharedUi();
  initializeAccountContext();
  initializeNewThreadPanel();
  void newThreadPanelGate;
  initializeNewThreadPanelAnalytics();
  initializeNewThreadPanelLayout();
  initializeComposerLayout();
  initializeNewThreadComposer();
  initializeNewThreadPanelState();
  initializeNewThreadPanelIcons();
  initializeFeatureGates();
  initializeNewThreadPanelRouting();
  initializeCodexHomeAnnouncements();
  jsx = getJsxRuntime();
}

initializeNewThreadPanelPage();
export { NewThreadPanelPage };
