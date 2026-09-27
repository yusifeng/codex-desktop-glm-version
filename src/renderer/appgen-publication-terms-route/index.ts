// appgen-publication-terms-route —— 在 Site 路由内容上叠加首次发布条款提示。
// 原版：app/webview/assets/appgen-publication-terms-route-bc1c14271f1f.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const {
  $3: initializeJsxRuntime,
  I3: getJsxRuntime,
} = appSharedChunk;
const {
  dl: PublicationTermsNotice,
  fl: initializePublicationTermsNotice,
} = appInitialChunk;
const jsx = getJsxRuntime();

interface AppgenPublicationTermsRouteProps {
  children?: unknown;
}

function AppgenPublicationTermsRoute({
  children,
}: AppgenPublicationTermsRouteProps): unknown {
  return jsx.jsxs(jsx.Fragment, {
    children: [children, jsx.jsx(PublicationTermsNotice, { showWhenUnseen: true })],
  });
}

function initializeAppgenPublicationTermsRoute(): void {
  initializeJsxRuntime();
  initializePublicationTermsNotice();
}

initializeAppgenPublicationTermsRoute();

export { AppgenPublicationTermsRoute };
