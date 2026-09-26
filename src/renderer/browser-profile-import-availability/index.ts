// browser-profile-import-availability —— 浏览器资料导入功能的服务端资格判断。
// 原版：app/webview/assets/availability-7faf4f21a73f.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import {
  FX as initializeSignals,
  QI as initializeQueryBridge,
  ZI as AppScope,
  sZ as createDerivedSignal,
  type DerivedScopedSignalContext,
  type ScopedDerivedSignal,
} from "@rchunk/app-shared";
import {
  $sn as initializeAuthState,
  Oln as initializeBrowserProfileImportService,
  Sln as authStateSignal,
  Ysn as browserProfileRequirementsQuery,
  dgn as localHostId,
  fgn as initializeBrowserProfileRequirements,
} from "@rchunk/app-initial";

void runtimeChunk;

interface AuthState {
  authLoading: boolean;
  authMethod: unknown;
}

interface BrowserProfileRequirementsResult {
  data?: {
    requirements?: {
      inAppBrowser?: {
        allowExternalBrowserSettingsImport?: boolean;
      };
    };
  };
  isError: boolean;
}

let browserProfileImportAvailableSignal: ScopedDerivedSignal<
  Record<string, unknown>,
  boolean
>;
let initialized = false;

function initializeBrowserProfileImportAvailability(): void {
  if (initialized) return;

  initializeSignals();
  initializeBrowserProfileImportService();
  initializeAuthState();
  initializeQueryBridge();
  initializeBrowserProfileRequirements();

  browserProfileImportAvailableSignal = createDerivedSignal(
    AppScope,
    ({ get }: DerivedScopedSignalContext<Record<string, unknown>>) => {
      const { authLoading, authMethod } = get<AuthState>(authStateSignal);
      if (authLoading) return false;

      const { data, isError } = get<BrowserProfileRequirementsResult>(
        browserProfileRequirementsQuery,
        { authMethod, hostId: localHostId },
      );
      return (
        !isError &&
        data != null &&
        data.requirements?.inAppBrowser?.allowExternalBrowserSettingsImport !==
          false
      );
    },
  );
  initialized = true;
}

export {
  browserProfileImportAvailableSignal as n,
  initializeBrowserProfileImportAvailability as t,
};
