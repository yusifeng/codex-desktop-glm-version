import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient, rJt as apiClient } from "@rchunk/app-initial";
import { n as initializeReportDialog, t as ReportDialog } from "@rchunk/report-dialog-core";

interface ReportReason { id: string; [key: string]: unknown }
interface ReportRequest {
  (path: string, options?: Record<string, unknown>): Promise<{ json(): Promise<unknown>; ok: boolean }>;
}
interface CodexThreadReportDialogProps {
  adReport?: { loadReasons(signal: AbortSignal): Promise<ReportReason[]>; queryKey?: readonly unknown[]; submit(input: { details?: string; id: string }, additionalFields?: Record<string, string>): Promise<unknown>; title?: unknown };
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
interface ReportApiClient { safeGet<Response>(path: string, options?: Record<string, unknown>): Promise<Response>; safePost(path: string, options: Record<string, unknown>): Promise<unknown> }
const jsx = getJsxRuntime();
const client = apiClient as unknown as ReportApiClient;

function CodexThreadReportDialog(props: CodexThreadReportDialogProps): unknown {
  const entityId = props.reportEntityType === "connector" ? props.connectorId ?? props.threadId : props.threadId;
  const reasonType = props.reportReasonsEntityType ?? props.reportEntityType;
  const title = props.adReport?.title ?? props.title ?? (props.reportEntityType === "share_link" ? "Report a conversation" : props.reportEntityType === "connector" ? "Report app" : "Report response");
  const loadReasons = async ({ signal }: { signal: AbortSignal }) => {
    if (props.adReport) return { reasons: await props.adReport.loadReasons(signal) };
    if (props.reportRequest) {
      const response = await props.reportRequest(`/report_flow/reasons/${reasonType}`);
      if (!response.ok) throw new Error("Could not load reporting options");
      return await response.json() as { reasons: ReportReason[] };
    }
    return await client.safeGet<{ reasons: ReportReason[] }>(`/report_flow/reasons/${reasonType}`, { signal });
  };
  const submitReport = async ({ reason, details, additionalFields }: { reason: ReportReason; details: string; additionalFields?: Record<string, string> }) => {
    if (props.adReport) return props.adReport.submit({ id: reason.id, details: details || undefined }, additionalFields);
    const requestBody = { entity_id: entityId, entity_type: props.reportEntityType, product_area: props.productArea ?? "codex", reason: details ? { id: reason.id, details } : { id: reason.id }, additional_fields_values: additionalFields };
    if (props.reportRequest) {
      const response = await props.reportRequest("/report_flow/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      if (!response.ok) throw new Error("Could not submit report");
      return;
    }
    await client.safePost("/report_flow/report", { requestBody, additionalHeaders: props.chatGptMessageId == null ? undefined : { "chatgpt-conv-message-id": props.chatGptMessageId } });
  };
  return jsx.jsx(ReportDialog, { onBack: props.onBackToFeedback, onClose: props.onClose, queryKey: props.adReport?.queryKey ?? ["codex-thread-report-reasons", reasonType], loadReasons, submitReport, preventCloseWhileSubmitting: props.adReport != null, includeServerFields: props.adReport != null, dialogVariant: props.adReport == null ? undefined : "chatgpt", contentClassName: props.contentClassName, successBody: props.successBody, title });
}
function initializeCodexThreadReportDialog(): void { initializeApiClient(); initializeReportDialog(); }
export { initializeCodexThreadReportDialog as n, CodexThreadReportDialog as t };
