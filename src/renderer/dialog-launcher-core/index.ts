// dialog-launcher —— Browser profile import 弹窗的门控与启动器。

import * as analyticsChunk from "@rchunk/browser-profile-import-analytics";
import * as availabilityChunk from "@rchunk/browser-profile-import-availability";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { MaitaiScopeApi } from "@rchunk/app-shared";
import type { BrowserProfileImportEntryPoint } from "@rchunk/browser-profile-import-analytics";
import type { BrowserProfileImportService } from "@rchunk/browser-profile-import-dialog";

void runtimeChunk;

const {
  a: recordDialogOpened,
  t: initializeBrowserProfileImportAnalytics,
} = analyticsChunk;
const {
  n: browserProfileImportAvailableSignal,
  t: initializeBrowserProfileImportAvailability,
} = availabilityChunk;
const {
  Hzt: isDialogOpen,
  Uzt: openDialog,
  Vzt: initializeDialogManager,
} = appInitialChunk;
const {
  H3: initializeReactLazy,
  e6: getReactRuntime,
} = appSharedChunk;

interface BrowserProfileImportLauncherProps extends Record<string, unknown> {
  entryPoint: BrowserProfileImportEntryPoint;
  flowId: string;
  service: BrowserProfileImportService;
}

type BrowserProfileImportDialogComponent = (
  props: BrowserProfileImportLauncherProps & { onClose(): void },
) => unknown;

let BrowserProfileImportDialog: BrowserProfileImportDialogComponent | null = null;

function initializeDialogComponent(): void {
  if (BrowserProfileImportDialog != null) return;
  initializeReactLazy?.();
  const React =
    typeof getReactRuntime === "function" ? getReactRuntime() : getReactRuntime;
  const loader = async () => ({
    default: (await import("@rchunk/browser-profile-import-dialog"))
      .BrowserProfileImportDialogModal,
  });
  BrowserProfileImportDialog = React.lazy(loader);
}

function openBrowserProfileImportDialog(
  scope: MaitaiScopeApi<unknown>,
  service: BrowserProfileImportService | null | undefined,
  entryPoint: BrowserProfileImportEntryPoint,
  flowId?: string,
): boolean {
  initializeDialogLauncher();
  if (
    service == null ||
    !scope.get<boolean>(browserProfileImportAvailableSignal)
  ) {
    return false;
  }
  if (isDialogOpen(scope, BrowserProfileImportDialog)) return true;
  const id = flowId ?? crypto.randomUUID();
  recordDialogOpened(scope, entryPoint, id);
  openDialog(scope, BrowserProfileImportDialog, {
    entryPoint,
    flowId: id,
    service,
  });
  return true;
}

function initializeDialogLauncher(): void {
  initializeDialogManager?.();
  initializeBrowserProfileImportAnalytics?.();
  initializeBrowserProfileImportAvailability?.();
  initializeDialogComponent();
}

export { openBrowserProfileImportDialog as n, initializeDialogLauncher as t };
