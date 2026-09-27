// hotkey-window-new-thread-page —— 热键窗口中的新建线程欢迎页与 Composer。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as threadScrollLayoutChunk from "@rchunk/thread-scroll-layout";
import * as hotkeyDetailLayoutChunk from "@rchunk/use-hotkey-window-detail-layout";
void runtimeChunk;

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeSharedUi,
  UB: encodeHotkeyWindowPath,
  Y2: FormattedMessage,
  wL: initializeWindowRuntime,
} = appSharedChunk;
const {
  Dht: initializeNewThreadPanelState,
  Oht: selectedProjectSignal,
  mnt: initializeAppServices,
  pnt: appServices,
} = appInitialChunk;
const {
  Oo: ComposerSurface,
  c: WorkspaceName,
  dt: initializeNewThreadPanelAnalytics,
  ko: initializeNewThreadPanelLayout,
  l: initializeWorkspaceName,
  nt: HotkeyWindowPageLayout,
  o: ChatGptMark,
  rt: initializeNewThreadPanelRouting,
  s: initializeChatGptMark,
  ut: NewThreadComposer,
} = appPrimaryChunk;
const { n: initializeThreadScrollLayout, t: ThreadScrollLayout } =
  threadScrollLayoutChunk;
const { n: initializeHotkeyDetailLayout, r: useHotkeyDetailLayout } =
  hotkeyDetailLayoutChunk;

let jsx: import("@rchunk/app-shared").JsxRuntime;

function HotkeyWindowNewThreadPage(): unknown {
  const selectedProject = useSignalValue(selectedProjectSignal);
  useHotkeyDetailLayout({
    title: jsx.jsx("span", {
      className: "max-w-full truncate",
      children: jsx.jsx(FormattedMessage, {
        id: "threadPage.newThread",
        defaultMessage: "New chat",
        description: "Header title for the home page",
      }),
    }),
    mainWindowPath: "/",
    canCollapseToHome: false,
  });

  const footer = jsx.jsx(ComposerSurface, {
    children: jsx.jsx(NewThreadComposer, {
      selectedProject,
      showWorkspaceDropdownInUtilityBar: false,
      onLocalConversationCreated: openConversationInHotkeyWindow,
    }),
  });
  const welcome = jsx.jsx("div", {
    className: "flex h-full items-center justify-center px-panel",
    children: jsx.jsxs("div", {
      className: "flex flex-col items-center gap-3 text-center",
      children: [
        jsx.jsx("div", {
          "aria-hidden": true,
          children: jsx.jsx(ChatGptMark, {
            className: "h-12 w-12 text-text/20",
          }),
        }),
        jsx.jsxs("div", {
          className: "flex flex-col items-center gap-1",
          children: [
            jsx.jsx("div", {
              className: "heading-xl mt-2 font-normal text-default select-none",
              children: jsx.jsx(FormattedMessage, {
                id: "home.hero.letsBuild",
                defaultMessage: "Let’s build",
                description:
                  "Label above the workspace name on the electron home page",
              }),
            }),
            jsx.jsx(WorkspaceName, { variant: "hero" }),
          ],
        }),
      ],
    }),
  });
  return jsx.jsx(HotkeyWindowPageLayout, {
    className: "h-full [--padding-panel:calc(var(--padding-panel-base)/2)]",
    children: jsx.jsx(ThreadScrollLayout, { footer, children: welcome }),
  });
}

function openConversationInHotkeyWindow(conversationId: string): void {
  appServices.hotkeyWindowHotkeys?.open({
    path: encodeHotkeyWindowPath(conversationId),
  });
}

function initializeHotkeyWindowNewThreadPage(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeWindowRuntime();
  initializeSharedUi();
  initializeNewThreadPanelAnalytics();
  initializeNewThreadPanelLayout();
  initializeWorkspaceName();
  initializeChatGptMark();
  initializeNewThreadPanelState();
  initializeAppServices();
  initializeNewThreadPanelRouting();
  initializeThreadScrollLayout();
  initializeHotkeyDetailLayout();
  jsx = getJsxRuntime();
}

initializeHotkeyWindowNewThreadPage();
export { HotkeyWindowNewThreadPage };
