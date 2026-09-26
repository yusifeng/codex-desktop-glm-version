// appgen-publication-terms-route —— 在 Site 路由内容上叠加首次发布条款提示。
// 原版：app/webview/assets/appgen-publication-terms-route-bc1c14271f1f.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const jsx = appShared.I3();

function AppgenPublicationTermsRoute({ children }: { children: any }) {
  return jsx.jsxs(jsx.Fragment, {
    children: [children, jsx.jsx(appInitial.dl, { showWhenUnseen: true })],
  });
}

function initializeAppgenPublicationTermsRoute(): void {
  appShared.$3?.();
  appInitial.fl?.();
}

initializeAppgenPublicationTermsRoute();

export { AppgenPublicationTermsRoute };
