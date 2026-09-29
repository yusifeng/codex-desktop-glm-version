import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import {
  n as initializeClearBrowsingDataDialog,
  t as ClearBrowsingDataDialogView,
} from "@rchunk/browser-browsing-data-dialog";

const {
  $3: initializeRuntimeLazy,
  FX: initializeMaitaiRuntime,
  I3: getJsxRuntime,
  LX: useScope,
  QI: initializeToastRuntime,
  SL: initializeQueryClientRuntime,
  ZI: AppScope,
  lk: initializeToastManager,
  pk: toastManagerSignal,
  xL: QueryClientProvider,
} = appSharedChunk;
const {
  C6t: initializeHostFeatureAvailability,
  ifn: initializeExperimentRuntime,
  ofn: readBooleanGate,
  sfn: readBooleanGateLoading,
  w6t: useHostFeatureAvailability,
} = appInitialChunk;

export interface BrowserSettingVisibility {
  enabled: boolean;
  isLoading: boolean;
}

export interface BrowserSettingsVisibility {
  contactInfo: BrowserSettingVisibility;
  downloads: BrowserSettingVisibility;
  extensions: BrowserSettingVisibility;
  history: BrowserSettingVisibility;
  passwordManager: BrowserSettingVisibility;
  siteSettings: BrowserSettingVisibility;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;

function BrowserClearBrowsingDataDialog(props: {
  browsingDataSettings?: unknown;
  browsingHistory?: unknown;
  onClose?: () => void;
}): unknown {
  initializeBrowserClearBrowsingDataDialog();
  const scope = useScope(AppScope) as {
    get<Value>(signal: unknown): Value;
    queryClient: {
      invalidateQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
    };
  };
  const onCleared = async (categories: readonly string[]) => {
    await Promise.all([
      scope.queryClient.invalidateQueries({ queryKey: ["browser-browsing-history"] }),
      ...(categories.includes("downloads")
        ? [scope.queryClient.invalidateQueries({ queryKey: ["browser-download-history"] })]
        : []),
    ]);
  };
  const onError = (message: string) =>
    scope.get<import("@rchunk/app-shared").ToastManager>(toastManagerSignal).danger(
      message,
      { errorAnalytics: { toastId: "browserClearBrowsingDataDialog.clearBrowsingData" } },
    );
  return jsx.jsx(QueryClientProvider, {
    client: scope.queryClient,
    children: jsx.jsx(ClearBrowsingDataDialogView, {
      ...props,
      onCleared,
      onError,
    }),
  });
}

function getBrowserSettingsVisibility({ hostId }: { hostId: string }): BrowserSettingsVisibility {
  initializeBrowserSettingsVisibility();
  const availability = useHostFeatureAvailability({
    featureName: "in_app_browser",
    hostId,
  });
  const extensionsEnabled = readBooleanGate("2982604767");
  const extensionsLoading = readBooleanGateLoading("2982604767");
  const browser = {
    enabled: availability.enabled && !availability.isLoading,
    isLoading: availability.isLoading,
  };
  const extensions = {
    enabled: browser.enabled && extensionsEnabled,
    isLoading: availability.isLoading || extensionsLoading,
  };
  return {
    contactInfo: browser,
    downloads: browser,
    extensions,
    history: browser,
    passwordManager: browser,
    siteSettings: browser,
  };
}

let clearDialogInitialized = false;
function initializeBrowserClearBrowsingDataDialog(): void {
  if (clearDialogInitialized) return;
  initializeRuntimeLazy();
  initializeQueryClientRuntime();
  initializeMaitaiRuntime();
  initializeToastManager();
  initializeToastRuntime();
  initializeClearBrowsingDataDialog();
  jsx = getJsxRuntime();
  clearDialogInitialized = true;
}

let visibilityInitialized = false;
function initializeBrowserSettingsVisibility(): void {
  if (visibilityInitialized) return;
  initializeRuntimeLazy();
  initializeHostFeatureAvailability();
  initializeExperimentRuntime();
  visibilityInitialized = true;
}

export {
  initializeBrowserClearBrowsingDataDialog as i,
  getBrowserSettingsVisibility as n,
  BrowserClearBrowsingDataDialog as r,
  initializeBrowserSettingsVisibility as t,
};
