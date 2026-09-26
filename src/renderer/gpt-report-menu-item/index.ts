// gpt-report-menu-item —— 公开第三方 GPT 的举报菜单入口。
// 原版：app/webview/assets/gpt-report-menu-item-b10c8ec78c70.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type {
  JsxRuntime,
  LazyComponent,
  MaitaiScopeApi,
} from "@rchunk/app-shared";

void runtimeChunk;

export interface GptResource extends Record<string, unknown> {
  gizmo: {
    id: string;
    share_recipient?: string | null;
    tags?: readonly string[];
  };
}

export interface GptReportDialogProps extends Record<string, unknown> {
  accountId: string;
  resource: GptResource;
  onClose?: () => void;
}

export interface GptReportMenuItemProps {
  resource: GptResource;
  onSelect?: () => void;
}

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  H3: initializePreloadHelper,
  HX: useSignalValue,
  I3: getJsxRuntime,
  If: initializeMenu,
  Jm: createLazyComponent,
  K2: initializeReactRuntime,
  LX: useSignalScope,
  QI: initializeAppScope,
  V3: preloadModule,
  Y2: FormattedMessage,
  ZI: appScope,
  jf: Menu,
  lw: initializeReportIcon,
  mb: ReportIcon,
  qm: initializeQueryRuntime,
} = appSharedChunk;
const {
  Sun: initializeAccountState,
  Uzt: openDialog,
  Vzt: initializeDialogHost,
  mun: currentAccountIdSignal,
} = appInitialChunk;

const jsx: JsxRuntime = getJsxRuntime();

const reportDialogDependencies = [
  "./gpt-report-dialog-8f475e8bdb75.js",
  "./rolldown-runtime-2d059c5e81f4.js",
  "./app-shared-7b9edc1bfb7f.js",
  "./app-shared-fa570b9eb9dd.css",
  "./app-initial-51da50e6c6e3.js",
  "./app-initial-e8ceb32eb626.css",
  "./report-dialog-75a130d615ed.js",
];

const LazyGptReportDialog: LazyComponent<GptReportDialogProps> =
  createLazyComponent<GptReportDialogProps>(async () => {
  const loadDialog = async () => {
    const { GptReportDialog } = await import("@rchunk/gpt-report-dialog");
    return { GptReportDialog };
  };
  const loaded = await preloadModule(
    loadDialog,
    reportDialogDependencies,
    import.meta.url,
  );
  return loaded.GptReportDialog;
});

function GptReportMenuItem({
  resource,
  onSelect,
}: GptReportMenuItemProps): unknown {
  const scope: MaitaiScopeApi<Record<string, unknown>> = useSignalScope(appScope);
  const accountId = useSignalValue(currentAccountIdSignal);
  const shareRecipient = resource.gizmo.share_recipient;
  if (
    accountId == null ||
    resource.gizmo.tags?.includes("first_party") ||
    (shareRecipient !== "marketplace" && shareRecipient !== "link")
  ) {
    return null;
  }

  const openReportDialog = () => {
    onSelect?.();
    openDialog(scope, LazyGptReportDialog, { accountId, resource });
  };

  return jsx.jsxs(Menu.Item, {
    onSelect: openReportDialog,
    children: [
      jsx.jsx(Menu.ItemIcon, { children: jsx.jsx(ReportIcon, {}) }),
      jsx.jsx(FormattedMessage, {
        id: "chatgptConversations.gpts.report.action",
        defaultMessage: "Report GPT",
        description: "Menu action to report a publicly shared third-party GPT",
      }),
    ],
  });
}

function initializeGptReportMenuItem(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeReactRuntime();
  initializeAccountState();
  initializeMenu();
  initializeReportIcon();
  initializeQueryRuntime();
  initializeDialogHost();
  initializeAppScope();
  initializePreloadHelper();
}

initializeGptReportMenuItem();

export { initializeGptReportMenuItem as n, GptReportMenuItem as t };
