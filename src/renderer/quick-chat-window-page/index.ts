// quick-chat-window-page —— 独立 Quick Chat 窗口的会话装配与生命周期桥接。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as quickChatWindowChunk from "@rchunk/quick-chat-window";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useScope,
  QI: initializeScopeRuntime,
  XN: quickChatSurfaces,
  ZI: appScope,
  e6: reactRuntime,
  lY: parseConversationId,
  qN: quickChatLifecycleActions,
  wL: initializeWindowRuntime,
} = appSharedChunk;
const {
  Evt: initializeQuickChatAnalytics,
  G_: trackQuickChatLifecycle,
  Qgn: initializeAccountContext,
  W_: initializeQuickChatLifecycle,
  aqt: normalizeConversationId,
  bX: initializeQuickChatSession,
  d_n: useSearchParams,
  h_: quickChatSessionSignal,
  i_: initializeQuickChatRoute,
  l_n: useRouteParams,
  mnt: initializeAppServices,
  oqt: initializeConversationState,
  pnt: appServices,
  sqt: isConversationMissing,
  xvt: prepareQuickChatWindow,
  yX: QuickChatSurfaceProvider,
} = appInitialChunk;
const { n: initializeQuickChatWindow, t: QuickChatWindow } =
  quickChatWindowChunk;

interface QuickChatSession extends Record<string, unknown> {
  contextSourceThread: { hostId: string; threadId: string } | null;
  conversationId: string;
  hasConversation: boolean;
  initialScrollMode: "follow";
  projectId: string | null;
  projectName: string | null;
  selectedTextSourceConversationId: string | null;
  title: string | null;
}

let jsx: import("@rchunk/app-shared").JsxRuntime;

function QuickChatWindowPage(): unknown {
  const scope = useScope(appScope);
  const { conversationId } = useRouteParams();
  const [searchParams] = useSearchParams();
  const storedSession = useSignalValue(
    quickChatSessionSignal,
  ) as QuickChatSession | null;

  reactRuntime.useEffect(() => {
    if (conversationId == null) {
      appServices.quickChatWindow?.rendererReady(null);
      return;
    }
    prepareQuickChatWindow();
    const frame = requestAnimationFrame(() =>
      appServices.quickChatWindow?.rendererReady(conversationId),
    );
    return () => cancelAnimationFrame(frame);
  }, [conversationId]);
  if (conversationId == null) return null;

  const normalizedConversationId = normalizeConversationId(conversationId);
  const contextSourceConversationId = searchParams.get(
    "contextSourceConversationId",
  );
  const contextSourceHostId = searchParams.get("contextSourceHostId");
  const session: QuickChatSession = storedSession ?? {
    contextSourceThread:
      contextSourceConversationId == null || contextSourceHostId == null
        ? null
        : {
            threadId: parseConversationId(contextSourceConversationId),
            hostId: contextSourceHostId,
          },
    conversationId: normalizedConversationId,
    hasConversation: !isConversationMissing(normalizedConversationId),
    initialScrollMode: "follow",
    projectId: null,
    projectName: null,
    selectedTextSourceConversationId: null,
    title: null,
  };
  const close = (source: string): void => {
    trackQuickChatLifecycle(scope, {
      action:
        quickChatLifecycleActions.CODEX_QUICK_CHAT_LIFECYCLE_ACTION_CLOSED,
      hasConversation: session.hasConversation,
      source,
      surface: quickChatSurfaces.CODEX_QUICK_CHAT_SURFACE_WINDOW,
    });
    window.close();
  };
  return jsx.jsx(QuickChatSurfaceProvider, {
    value: "quick-chat",
    children: jsx.jsx(QuickChatWindow, {
      canPopOut: false,
      session,
      variant: "window",
      onAddToComposer: addToComposer,
      onClose: close,
    }),
  });
}

async function addToComposer(content: unknown): Promise<void> {
  const service = appServices.quickChatWindow;
  if (service == null)
    throw new Error("Quick Chat window service is unavailable");
  await service.addToComposer(content);
}

function initializeQuickChatWindowPage(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeWindowRuntime();
  reactRuntime();
  initializeAccountContext();
  initializeQuickChatAnalytics();
  initializeAppServices();
  initializeScopeRuntime();
  initializeQuickChatSession();
  initializeConversationState();
  initializeQuickChatLifecycle();
  initializeQuickChatRoute();
  initializeQuickChatWindow();
  jsx = getJsxRuntime();
}

initializeQuickChatWindowPage();
export { QuickChatWindowPage };
