import { n as onceExport } from "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Y2 as FormattedMessage,
} from "@rchunk/app-shared";
import type { JsxRuntime } from "@rchunk/app-shared";
import {
  _dn as desktopHttpClient,
  fdn as authenticatedHeaders,
  pdn as initializeDesktopHttpClient,
  ydn as initializeAuthenticatedHeaders,
} from "@rchunk/app-initial";
import {
  n as initializeReportDialog,
  t as ReportDialog,
} from "@rchunk/report-dialog-core";

interface ReportReason {
  id: string;
  [key: string]: unknown;
}
interface ReportRequestResponse {
  json(): Promise<unknown>;
  ok: boolean;
}
type ReportRequest = (
  path: string,
  options?: Record<string, unknown>,
) => Promise<ReportRequestResponse>;
interface AdReport {
  loadReasons(signal: AbortSignal): Promise<unknown>;
  queryKey?: readonly unknown[];
  submit(
    input: { details?: string; id: string },
    additionalFields?: Record<string, string>,
  ): Promise<unknown>;
  title?: unknown;
}
interface CodexThreadReportDialogProps {
  adReport?: AdReport;
  chatGptMessageId?: string;
  connectorId?: string;
  contentClassName?: string;
  onBackToFeedback?(): void;
  onClose(): void;
  productArea?: string;
  reportEntityType: string;
  reportReasonsEntityType?: string;
  reportRequest?: ReportRequest;
  successBody?: unknown;
  threadId: string;
  title?: unknown;
}
interface LegacyHttpClient {
  get(
    path: string,
    headers: Record<string, string>,
  ): Promise<{ body: unknown }>;
  post(
    path: string,
    body: string,
    headers: Record<string, string>,
  ): Promise<unknown>;
}

const once = onceExport as (initializer: () => void) => () => void;
let jsx: JsxRuntime;
let reportReasonsQueryKey: string;

function reportTitle({
  reportEntityType,
  title,
}: Pick<CodexThreadReportDialogProps, "reportEntityType" | "title">): unknown {
  if (title != null) return jsx.jsx(jsx.Fragment, { children: title });
  if (reportEntityType === "share_link") {
    return jsx.jsx(FormattedMessage, {
      id: "codexThreadReportDialog.sharedConversationTitle",
      defaultMessage: "Report a conversation",
      description:
        "Title for the modal where users report a shared ChatGPT conversation for safety or legal reasons",
    });
  }
  if (reportEntityType === "connector") {
    return jsx.jsx(FormattedMessage, {
      id: "codexThreadReportDialog.connectorTitle",
      defaultMessage: "Report app",
      description:
        "Title for the dialog used to report a connected app for safety or legal reasons",
    });
  }
  return jsx.jsx(FormattedMessage, {
    id: "codexThreadReportDialog.title",
    defaultMessage: "Report response",
    description:
      "Title for the modal where users report a Codex response for safety or legal reasons",
  });
}

function openExternalForm(url: string): void {
  if (!/^https:\/\//i.test(url)) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.click();
}

async function loadReasons(
  reasonType: string,
  reportRequest?: ReportRequest,
): Promise<unknown> {
  if (reportRequest != null) {
    const response = await reportRequest(`/report_flow/reasons/${reasonType}`);
    if (!response.ok) throw new Error("Could not load reporting options");
    return response.json();
  }
  const client = desktopHttpClient.getInstance() as unknown as LegacyHttpClient;
  return (
    await client.get(
      `/report_flow/reasons/${reasonType}`,
      authenticatedHeaders(),
    )
  ).body;
}

async function submitReport(
  input: {
    details: string;
    entityType: string;
    reasonId: string;
    threadId: string;
  },
  reportRequest?: ReportRequest,
  chatGptMessageId?: string,
  productArea?: string,
): Promise<void> {
  const body = JSON.stringify({
    entity_id: input.threadId,
    entity_type: input.entityType,
    additional_fields_values:
      input.entityType === "project" || input.entityType === "share_link"
        ? {}
        : undefined,
    product_area:
      productArea ??
      (["conversation", "connector", "project", "share_link"].includes(
        input.entityType,
      )
        ? "1p"
        : "codex"),
    reason:
      input.details.length === 0
        ? { id: input.reasonId }
        : { id: input.reasonId, details: input.details },
  });
  if (reportRequest != null) {
    const response = await reportRequest("/report_flow/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!response.ok) throw new Error("Could not submit report");
    return;
  }
  const client = desktopHttpClient.getInstance() as unknown as LegacyHttpClient;
  await client.post("/report_flow/report", body, {
    ...authenticatedHeaders(),
    ...(chatGptMessageId == null
      ? {}
      : { "chatgpt-conv-message-id": chatGptMessageId }),
  });
}

function CodexThreadReportDialog(props: CodexThreadReportDialogProps): unknown {
  const {
    adReport,
    chatGptMessageId,
    connectorId,
    contentClassName,
    onBackToFeedback,
    onClose,
    productArea,
    reportEntityType,
    reportReasonsEntityType,
    reportRequest,
    successBody,
    threadId,
    title,
  } = props;
  const entityId = reportEntityType === "connector" ? connectorId : threadId;
  const reasonType = reportReasonsEntityType ?? reportEntityType;
  const onBack =
    onBackToFeedback == null
      ? undefined
      : () => {
          if (adReport == null) onClose();
          onBackToFeedback();
        };
  return jsx.jsx(ReportDialog, {
    onBack,
    onClose,
    queryKey: adReport?.queryKey ?? [reportReasonsQueryKey, reasonType],
    loadReasons:
      adReport == null
        ? () => loadReasons(reasonType, reportRequest)
        : ({ signal }: { signal: AbortSignal }) => adReport.loadReasons(signal),
    gcTime: adReport == null ? undefined : 0,
    includeServerFields: adReport != null,
    preventCloseWhileSubmitting: adReport != null,
    dialogVariant: adReport == null ? undefined : "chatgpt",
    contentClassName,
    submitReport: ({
      reason,
      details,
      additionalFields,
    }: {
      reason: ReportReason;
      details: string;
      additionalFields?: Record<string, string>;
    }) =>
      adReport == null
        ? submitReport(
            {
              details,
              entityType: reportEntityType,
              reasonId: reason.id,
              threadId: entityId ?? threadId,
            },
            reportRequest,
            chatGptMessageId,
            productArea,
          )
        : adReport.submit(
            { id: reason.id, details: details || undefined },
            additionalFields,
          ),
    openExternalForm: reportRequest == null ? undefined : openExternalForm,
    successBody,
    title: adReport?.title ?? reportTitle({ reportEntityType, title }),
  });
}

const initializeCodexThreadReportDialog = once(() => {
  initializeCompilerRuntime();
  initializeInternationalization();
  initializeReportDialog();
  initializeDesktopHttpClient();
  initializeAuthenticatedHeaders();
  jsx = getJsxRuntime();
  reportReasonsQueryKey = "codex-thread-report-reasons";
});

export { initializeCodexThreadReportDialog as n, CodexThreadReportDialog as t };
