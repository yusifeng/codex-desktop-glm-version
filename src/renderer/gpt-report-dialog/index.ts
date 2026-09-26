// gpt-report-dialog —— GPT 举报原因查询与提交的账户隔离宿主。
// 原版：app/webview/assets/gpt-report-dialog-8f475e8bdb75.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as reportDialogChunk from "@rchunk/report-dialog-core";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const reportDialog = reportDialogChunk as Record<string, any>;
const jsx = appShared.I3();

function loadGptReportReasons() {
  return appInitial.rJt.safeGet("/report_flow/reasons/{entity_type}", {
    parameters: { path: { entity_type: "gizmo" } },
  });
}

function GptReportDialog({
  accountId,
  resource,
  onClose,
}: {
  accountId: string;
  resource: any;
  onClose: () => void;
}) {
  const scope = appShared.LX(appShared.ZI);
  const activeAccountId = appShared.HX(appInitial.mun);
  if (activeAccountId !== accountId) return null;

  return jsx.jsx(
    reportDialog.t,
    {
      onClose,
      queryKey: ["gpt-report-reasons", accountId],
      loadReasons: loadGptReportReasons,
      submitReport: async ({ reason, details }: any) => {
        if (scope.get(appInitial.mun) !== accountId) {
          onClose();
          return;
        }
        await appInitial.rJt.safePost("/report_flow/report", {
          requestBody: {
            entity_id: resource.gizmo.id,
            entity_type: "gizmo",
            product_area: "gpts",
            reason: { id: reason.id, details },
            additional_fields_values: {},
          },
        });
      },
      title: jsx.jsx(appShared.Y2, {
        id: "chatgptConversations.gpts.report.title",
        defaultMessage: "Report {gptName}",
        description: "Title of the reporting dialog for a GPT",
        values: { gptName: resource.gizmo.display.name },
      }),
    },
    resource.gizmo.id,
  );
}

function initializeGptReportDialog(): void {
  appShared.$3?.();
  appShared.FX?.();
  appShared.K2?.();
  appInitial.Sun?.();
  reportDialog.n?.();
  appShared.QI?.();
  appInitial.cJt?.();
}

initializeGptReportDialog();

export { GptReportDialog };
