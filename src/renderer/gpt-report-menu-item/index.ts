// gpt-report-menu-item —— 公开第三方 GPT 的举报菜单入口。
// 原版：app/webview/assets/gpt-report-menu-item-b10c8ec78c70.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const jsx = appShared.I3();

const reportDialogDependencies = [
  "./gpt-report-dialog-8f475e8bdb75.js",
  "./rolldown-runtime-2d059c5e81f4.js",
  "./app-shared-7b9edc1bfb7f.js",
  "./app-shared-fa570b9eb9dd.css",
  "./app-initial-51da50e6c6e3.js",
  "./app-initial-e8ceb32eb626.css",
  "./report-dialog-75a130d615ed.js",
];

const LazyGptReportDialog = appShared.Jm(async () => {
  const loadDialog = async () => {
    const { GptReportDialog } = await import("@rchunk/gpt-report-dialog");
    return { GptReportDialog };
  };
  const loaded = appShared.V3
    ? await appShared.V3(loadDialog, reportDialogDependencies, import.meta.url)
    : await loadDialog();
  return loaded.GptReportDialog;
});

function GptReportMenuItem({
  resource,
  onSelect,
}: {
  resource: any;
  onSelect?: () => void;
}) {
  const scope = appShared.LX(appShared.ZI);
  const accountId = appShared.HX(appInitial.mun);
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
    appInitial.Uzt(scope, LazyGptReportDialog, { accountId, resource });
  };

  return jsx.jsxs(appShared.jf.Item, {
    onSelect: openReportDialog,
    children: [
      jsx.jsx(appShared.jf.ItemIcon, { children: jsx.jsx(appShared.mb, {}) }),
      jsx.jsx(appShared.Y2, {
        id: "chatgptConversations.gpts.report.action",
        defaultMessage: "Report GPT",
        description: "Menu action to report a publicly shared third-party GPT",
      }),
    ],
  });
}

function initializeGptReportMenuItem(): void {
  appShared.$3?.();
  appShared.FX?.();
  appShared.K2?.();
  appInitial.Sun?.();
  appShared.If?.();
  appShared.lw?.();
  appShared.qm?.();
  appInitial.Vzt?.();
  appShared.QI?.();
  appShared.H3?.();
}

initializeGptReportMenuItem();

export { initializeGptReportMenuItem as n, GptReportMenuItem as t };
