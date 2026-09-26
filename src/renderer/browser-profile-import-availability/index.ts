// browser-profile-import-availability —— 浏览器资料导入功能的服务端资格判断。
// 原版：app/webview/assets/availability-7faf4f21a73f.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;

let browserProfileImportAvailableSignal: unknown;
let initialized = false;

function initializeBrowserProfileImportAvailability(): void {
  if (initialized) return;

  appShared.FX?.();
  appInitial.Oln?.();
  appInitial.$sn?.();
  appShared.QI?.();
  appInitial.fgn?.();

  browserProfileImportAvailableSignal = appShared.sZ(
    appShared.ZI,
    ({ get }: { get: (signal: unknown, options?: unknown) => any }) => {
      const { authLoading, authMethod } = get(appInitial.Sln);
      if (authLoading) return false;

      const { data, isError } = get(appInitial.Ysn, {
        authMethod,
        hostId: appInitial.dgn,
      });
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
