// gpt-report-dialog —— GPT 举报原因查询与提交的账户隔离宿主。
// 原版：app/webview/assets/gpt-report-dialog-8f475e8bdb75.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as reportDialogChunk from "@rchunk/report-dialog-core";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;

interface GptReportResource extends Record<string, unknown> {
  gizmo: {
    display: { name: string };
    id: string;
  };
}

interface ReportReason {
  id: string;
  [key: string]: unknown;
}

interface SubmitReportInput {
  details: string;
  reason: ReportReason;
}

const {
  $3: initializeRuntimeLazy,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  K2: initializeReactRuntime,
  LX: useSignalScope,
  QI: initializeAppScope,
  Y2: FormattedMessage,
  ZI: appScope,
} = appSharedChunk;
const {
  Sun: initializeAccountState,
  cJt: initializeApiClient,
  mun: currentAccountIdSignal,
  rJt: apiClient,
} = appInitialChunk;
const {
  n: initializeReportDialog,
  t: ReportDialog,
} = reportDialogChunk;

const jsx: JsxRuntime = getJsxRuntime();

function loadGptReportReasons(): Promise<ReportReason[]> {
  return apiClient.safeGet<ReportReason[]>("/report_flow/reasons/{entity_type}", {
    parameters: { path: { entity_type: "gizmo" } },
  });
}

function GptReportDialog({
  accountId,
  resource,
  onClose = () => {},
}: {
  accountId: string;
  resource: GptReportResource;
  onClose?: () => void;
}): unknown {
  const scope = useSignalScope(appScope);
  const activeAccountId = useSignalValue(currentAccountIdSignal);
  if (activeAccountId !== accountId) return null;

  return jsx.jsx(
    ReportDialog,
    {
      onClose,
      queryKey: ["gpt-report-reasons", accountId],
      loadReasons: loadGptReportReasons,
      submitReport: async ({ reason, details }: SubmitReportInput) => {
        if (scope.get(currentAccountIdSignal) !== accountId) {
          onClose();
          return;
        }
        await apiClient.safePost("/report_flow/report", {
          requestBody: {
            entity_id: resource.gizmo.id,
            entity_type: "gizmo",
            product_area: "gpts",
            reason: { id: reason.id, details },
            additional_fields_values: {},
          },
        });
      },
      title: jsx.jsx(FormattedMessage, {
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
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeReactRuntime();
  initializeAccountState();
  initializeReportDialog();
  initializeAppScope();
  initializeApiClient();
}

initializeGptReportDialog();

export { GptReportDialog };
