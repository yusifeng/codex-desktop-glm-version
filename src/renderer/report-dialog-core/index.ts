import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface ReportReason {
  id: string;
  label?: string;
  title?: string;
  details_placeholder?: string;
  link_attachment?: string;
  sub_reasons?: ReportReason[];
  [key: string]: unknown;
}
interface ReportDialogProps {
  contentClassName?: string;
  dialogVariant?: string;
  includeServerFields?: boolean;
  initialReasons?: ReportReason[];
  loadReasons(context: { signal: AbortSignal }): Promise<{ reasons: ReportReason[] } | ReportReason[]>;
  onBack?(): void;
  onClose(): void;
  openExternalForm?(url: string): void;
  preventCloseWhileSubmitting?: boolean;
  queryKey: readonly unknown[];
  submitReport(input: { additionalFields?: Record<string, string>; details: string; path: ReportReason[]; reason: ReportReason }): Promise<unknown>;
  successBody?: unknown;
  title: unknown;
}

const jsx = getJsxRuntime();
const React = getReactRuntime();

function ReportDialog(props: ReportDialogProps): unknown {
  const [reasons, setReasons] = React.useState<ReportReason[]>(props.initialReasons ?? []);
  const [reasonId, setReasonId] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "submitting" | "success" | "error">(props.initialReasons == null ? "loading" : "idle");
  React.useEffect(() => {
    if (props.initialReasons != null) return;
    const controller = new AbortController();
    props.loadReasons({ signal: controller.signal }).then(value => {
      setReasons(Array.isArray(value) ? value : value.reasons);
      setStatus("idle");
    }, () => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [props.initialReasons, props.loadReasons, props.queryKey]);
  const selected = reasons.find(reason => reason.id === reasonId) ?? null;
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (status === "success") return props.onClose();
    if (selected?.link_attachment) return props.openExternalForm?.(selected.link_attachment);
    if (selected == null) return;
    setStatus("submitting");
    try {
      await props.submitReport({ details: details.trim(), path: [selected], reason: selected });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };
  return jsx.jsxs("dialog", { open: true, "data-variant": props.dialogVariant, children: [
    jsx.jsx("h2", { children: status === "success" ? "Thanks for your report" : props.title }),
    status === "success" ? jsx.jsx("div", { children: props.successBody ?? "Our team will review the content." }) : jsx.jsxs("form", { className: props.contentClassName, onSubmit: submit, children: [
      status === "loading" ? jsx.jsx("p", { role: "status", children: "Loading reporting options…" }) : null,
      status === "error" ? jsx.jsx("p", { role: "alert", children: "We couldn't complete this report. Please try again." }) : null,
      jsx.jsx("fieldset", { children: reasons.map(reason => jsx.jsxs("label", { children: [jsx.jsx("input", { type: "radio", name: "report-reason", value: reason.id, checked: reason.id === reasonId, onChange: () => setReasonId(reason.id) }), reason.label ?? reason.title ?? reason.id] }, reason.id)) }),
      selected ? jsx.jsx("textarea", { "aria-label": "Add details", placeholder: selected.details_placeholder, value: details, onChange: (event: { currentTarget: { value: string } }) => setDetails(event.currentTarget.value) }) : null,
      jsx.jsxs("footer", { children: [props.onBack ? jsx.jsx("button", { type: "button", onClick: props.onBack, children: "Back" }) : null, jsx.jsx("button", { type: "button", disabled: props.preventCloseWhileSubmitting && status === "submitting", onClick: props.onClose, children: "Cancel" }), jsx.jsx("button", { type: "submit", disabled: selected == null || status === "submitting", children: "Submit" })] }),
    ] }),
  ] });
}

function initializeReportDialog(): void { initializeApiClient(); }
export { initializeReportDialog as n, ReportDialog as t };
