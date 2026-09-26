// dialog-launcher —— Browser profile import 弹窗的门控与启动器。

import * as analyticsChunk from "@rchunk/browser-profile-import-analytics";
import * as availabilityChunk from "@rchunk/browser-profile-import-availability";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const analytics = analyticsChunk as Record<string, any>;
const availability = availabilityChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

let BrowserProfileImportDialog: unknown = null;

function initializeDialogComponent(): void {
  if (BrowserProfileImportDialog != null) return;
  appShared.H3?.();
  const React =
    typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  const loader = async () => ({
    default: (await import("@rchunk/browser-profile-import-dialog"))
      .BrowserProfileImportDialogModal,
  });
  BrowserProfileImportDialog = React?.lazy?.(loader) ?? loader;
}

function openBrowserProfileImportDialog(
  scope: { get(signal: unknown): any },
  service: unknown,
  entryPoint: unknown,
  flowId?: string,
): boolean {
  initializeDialogLauncher();
  if (service == null || !scope.get(availability.n)) return false;
  if (appInitial.Hzt?.(scope, BrowserProfileImportDialog)) return true;
  const id = flowId ?? crypto.randomUUID();
  analytics.a?.(scope, entryPoint, id);
  appInitial.Uzt?.(scope, BrowserProfileImportDialog, {
    entryPoint,
    flowId: id,
    service,
  });
  return true;
}

function initializeDialogLauncher(): void {
  appInitial.Vzt?.();
  analytics.t?.();
  availability.t?.();
  initializeDialogComponent();
}

export { openBrowserProfileImportDialog as n, initializeDialogLauncher as t };
