// debug-window-page —— 独立调试窗口的宿主消息订阅、权限门与分析面板。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as panelChunk from "@rchunk/panel";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  Cq: debugMenuPolicy,
  I3: getJsxRuntime,
  K3: useHostMessageHandler,
  W3: initializeHostMessageBridge,
  e6: reactRuntime,
  wL: initializeWindowRuntime,
} = appSharedChunk;
const {
  Oun: getRuntimeEnvironment,
  Qgn: initializeAccountContext,
  Ygn: Navigate,
} = appInitialChunk;
const { n: initializeDebugPanel, t: DebugPanel } = panelChunk;

type OriginConversationChangedMessage =
  import("@rchunk/app-shared").RendererHostMessage & {
    conversationId: string | null;
  };

type AnalyticsHistoryChangedMessage =
  import("@rchunk/app-shared").RendererHostMessage & {
    events: readonly unknown[];
  };

let jsx: import("@rchunk/app-shared").JsxRuntime;

function DebugWindowPage(): unknown {
  const [conversationId, setConversationId] = reactRuntime.useState<
    string | null
  >(null);
  const [clientAnalyticsHistory, setClientAnalyticsHistory] =
    reactRuntime.useState<readonly unknown[]>([]);
  useHostMessageHandler<OriginConversationChangedMessage>(
    "debug-window-origin-conversation-changed",
    ({ conversationId: nextConversationId }) =>
      setConversationId(nextConversationId),
  );
  useHostMessageHandler<AnalyticsHistoryChangedMessage>(
    "debug-window-client-analytics-history-changed",
    ({ events }) => setClientAnalyticsHistory(events),
  );
  if (!debugMenuPolicy.allowDebugMenu(getRuntimeEnvironment())) {
    return jsx.jsx(Navigate, { to: "/", replace: true });
  }
  return jsx.jsx(jsx.Fragment, {
    children: jsx.jsx("main", {
      className: "h-dvh w-full overflow-hidden bg-surface text-default",
      children: jsx.jsx(DebugPanel, {
        clientAnalyticsHistory,
        conversationIdOverride: conversationId,
        onClose: closeDebugWindow,
        showHeader: false,
      }),
    }),
  });
}

function closeDebugWindow(): void {
  window.close();
}

function initializeDebugWindowPage(): void {
  initializeRuntimeLazy();
  initializeWindowRuntime();
  reactRuntime();
  initializeAccountContext();
  initializeHostMessageBridge();
  initializeDebugPanel();
  jsx = getJsxRuntime();
}

initializeDebugWindowPage();
export { DebugWindowPage };
