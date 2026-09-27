// browser-load-page —— 登录后安全恢复目标 URL 的重定向页。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
void runtimeChunk;

const { $3: initializeRuntimeLazy, I3: getJsxRuntime } = appSharedChunk;
const {
  Fx: sanitizeReturnUrl,
  Ix: initializeReturnUrlSanitizer,
  Qgn: initializeAccountContext,
  Ygn: Navigate,
  d_n: useSearchParams,
} = appInitialChunk;
let jsx: import("@rchunk/app-shared").JsxRuntime;

function BrowserLoadPageWithAuth(): unknown {
  const [searchParams] = useSearchParams();
  let target = "/";
  try {
    target = decodeURIComponent(searchParams.get("toUrl") ?? "/");
  } catch {}
  const url = new URL(sanitizeReturnUrl(target));
  return jsx.jsx(Navigate, {
    to: `${url.pathname}${url.search}${url.hash}`,
    replace: true,
  });
}

function initializeBrowserLoadPage(): void {
  initializeRuntimeLazy();
  initializeAccountContext();
  initializeReturnUrlSanitizer();
  jsx = getJsxRuntime();
}

initializeBrowserLoadPage();
export { BrowserLoadPageWithAuth };
