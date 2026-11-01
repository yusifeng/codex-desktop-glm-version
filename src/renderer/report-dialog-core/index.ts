import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

interface AdditionalField {
  id: string;
  placeholder: string;
  required?: boolean;
  type?: "email" | "int" | "multi_line_text" | "text" | "url";
}

interface ReportReason {
  additional_fields?: AdditionalField[];
  cta?: string;
  details_placeholder?: string;
  explanation?: string;
  has_details?: boolean;
  id: string;
  label?: string;
  link_attachment?: string;
  link_explanation?: string;
  sub_reasons?: ReportReason[];
  subtext?: string;
  title?: string;
  [key: string]: unknown;
}

interface ReportReasonsPayload {
  header?: unknown;
  header_explanation?: unknown;
  reasons: ReportReason[];
}

interface ReportDialogProps {
  contentClassName?: string;
  dialogVariant?: string;
  gcTime?: number;
  includeServerFields?: boolean;
  initialReasons?: ReportReason[] | ReportReasonsPayload;
  loadReasons(context: { signal: AbortSignal }): Promise<ReportReasonsPayload | ReportReason[]>;
  onBack?(): void;
  onClose(): void;
  openExternalForm?(url: string): void;
  preventCloseWhileSubmitting?: boolean;
  queryKey: readonly unknown[];
  submitReport(input: {
    additionalFields?: Record<string, string>;
    details: string;
    path: ReportReason[];
    reason: ReportReason;
  }): Promise<unknown>;
  successBody?: unknown;
  title: unknown;
}

const jsx = getJsxRuntime();
const React = getReactRuntime();

function normalizeReasons(value: ReportReasonsPayload | ReportReason[]): ReportReasonsPayload {
  return Array.isArray(value) ? { reasons: value } : value;
}

function reasonLabel(reason: ReportReason): string {
  return reason.cta ?? reason.label ?? reason.title ?? reason.id;
}

function hasAdditionalFields(reason: ReportReason | null): boolean {
  return (reason?.additional_fields?.length ?? 0) > 0;
}

function needsDetails(reason: ReportReason | null, includeServerFields: boolean): boolean {
  return reason != null && (
    reason.details_placeholder != null
    || (includeServerFields && reason.has_details === true)
    || (includeServerFields && hasAdditionalFields(reason))
  );
}

function isImmediateLeaf(reason: ReportReason, includeServerFields: boolean): boolean {
  return (
    (!includeServerFields || (reason.has_details !== true && !hasAdditionalFields(reason)))
    && (reason.sub_reasons?.length ?? 0) === 0
    && reason.details_placeholder == null
    && reason.link_attachment == null
    && reason.subtext == null
  );
}

function ReportDialog(props: ReportDialogProps): unknown {
  const initialPayload = props.initialReasons == null ? null : normalizeReasons(props.initialReasons);
  const [payload, setPayload] = React.useState<ReportReasonsPayload | null>(initialPayload);
  const [loadState, setLoadState] = React.useState<"error" | "loading" | "ready">(
    initialPayload == null ? "loading" : "ready",
  );
  const [selectedReasonId, setSelectedReasonId] = React.useState<string | null>(null);
  const [details, setDetails] = React.useState("");
  const [additionalFields, setAdditionalFields] = React.useState<Record<string, string>>({});
  const [path, setPath] = React.useState<ReportReason[]>([]);
  const [submitState, setSubmitState] = React.useState<"error" | "idle" | "submitting" | "success">("idle");

  React.useEffect(() => {
    if (props.initialReasons != null) {
      setPayload(normalizeReasons(props.initialReasons));
      setLoadState("ready");
      return;
    }
    const controller = new AbortController();
    setLoadState("loading");
    props.loadReasons({ signal: controller.signal }).then(
      value => {
        if (controller.signal.aborted) return;
        setPayload(normalizeReasons(value));
        setLoadState("ready");
      },
      () => {
        if (!controller.signal.aborted) setLoadState("error");
      },
    );
    return () => controller.abort();
  }, [props.initialReasons, props.loadReasons, props.queryKey]);

  const activeReason = path.at(-1) ?? null;
  const reasons = activeReason == null ? payload?.reasons ?? [] : activeReason.sub_reasons ?? [];
  const selectedReason = reasons.find(reason => reason.id === selectedReasonId) ?? null;
  const detailStep = needsDetails(activeReason, props.includeServerFields === true);
  const linkStep = activeReason?.link_attachment != null;
  const terminalTextStep = activeReason?.subtext != null && reasons.length === 0 && !detailStep && !linkStep;
  const completed = submitState === "success" || loadState === "error";
  const canClose = !props.preventCloseWhileSubmitting || submitState !== "submitting";

  const resetStep = (): void => {
    setDetails("");
    setAdditionalFields({});
    setSubmitState("idle");
  };

  const goBack = (): void => {
    if (activeReason == null) {
      props.onBack?.();
      return;
    }
    const previous = path.at(-1) ?? null;
    setPath(current => current.slice(0, -1));
    setSelectedReasonId(previous?.id ?? null);
    resetStep();
  };

  const openExternalForm = (): void => {
    if (activeReason?.link_attachment == null) return;
    props.openExternalForm?.(activeReason.link_attachment);
  };

  const submitSelectedReason = async (reason: ReportReason, reportPath: ReportReason[]): Promise<void> => {
    setSubmitState("submitting");
    try {
      await props.submitReport({
        ...(props.includeServerFields === true ? { additionalFields } : {}),
        details: details.trim(),
        path: reportPath,
        reason,
      });
      setSubmitState("success");
    } catch {
      setSubmitState("error");
    }
  };

  const advance = async (event: {
    currentTarget?: { reportValidity?(): boolean };
    preventDefault(): void;
  }): Promise<void> => {
    event.preventDefault();
    if (submitState === "submitting") return;
    if (completed) {
      if (canClose) props.onClose();
      return;
    }
    if (props.includeServerFields === true && event.currentTarget?.reportValidity?.() === false) return;
    if (linkStep) {
      openExternalForm();
      return;
    }
    if (detailStep && activeReason != null) {
      await submitSelectedReason(activeReason, path);
      return;
    }
    if (selectedReason == null || terminalTextStep) return;
    if (isImmediateLeaf(selectedReason, props.includeServerFields === true)) {
      await submitSelectedReason(selectedReason, [...path, selectedReason]);
      return;
    }
    setPath(current => [...current, selectedReason]);
    setSelectedReasonId(null);
    resetStep();
  };

  const subtitle = submitState === "success"
    ? null
    : activeReason == null
      ? payload?.header_explanation ?? payload?.header ?? null
      : reasonLabel(activeReason);
  const primaryLabel = completed
    ? "Close"
    : linkStep
      ? "View form"
      : detailStep
        ? "Submit"
        : "Next";
  const primaryDisabled = !completed
    && !linkStep
    && !detailStep
    && (selectedReason == null || loadState !== "ready" || submitState === "submitting");

  const reasonOptions = jsx.jsx("fieldset", {
    "aria-label": "Reporting options",
    children: reasons.map(reason => jsx.jsxs("label", {
      children: [
        jsx.jsx("input", {
          "aria-checked": selectedReasonId === reason.id,
          checked: selectedReasonId === reason.id,
          name: "report-reason",
          onChange: () => setSelectedReasonId(reason.id),
          role: "radio",
          type: "radio",
          value: reason.id,
        }),
        reasonLabel(reason),
      ],
    }, reason.id)),
  });

  let body: unknown;
  if (submitState === "success") {
    body = jsx.jsx("div", { children: props.successBody ?? "Our team will review the content to determine if it violates our policies." });
  } else if (loadState === "loading") {
    body = jsx.jsx("p", { role: "status", children: "Loading reporting options…" });
  } else if (loadState === "error") {
    body = jsx.jsx("p", { role: "alert", children: "We couldn't load reporting options. Please try again in a moment." });
  } else if (detailStep && activeReason != null) {
    body = jsx.jsxs("div", { children: [
      props.includeServerFields === true && activeReason.explanation != null
        ? jsx.jsx("p", { children: activeReason.explanation })
        : null,
      activeReason.details_placeholder != null || (props.includeServerFields === true && activeReason.has_details === true)
        ? jsx.jsx("textarea", {
            "aria-label": "Add details",
            autoFocus: true,
            onChange: (event: { currentTarget: { value: string } }) => setDetails(event.currentTarget.value),
            placeholder: activeReason.details_placeholder,
            rows: 5,
            value: details,
          })
        : null,
      activeReason.subtext == null ? null : jsx.jsx("p", { children: activeReason.subtext }),
      props.includeServerFields === true
        ? activeReason.additional_fields?.map(field => jsx.jsxs("label", {
            children: [
              field.placeholder,
              field.type === "multi_line_text"
                ? jsx.jsx("textarea", {
                    onChange: (event: { currentTarget: { value: string } }) => setAdditionalFields(current => ({ ...current, [field.id]: event.currentTarget.value })),
                    required: field.required,
                    value: additionalFields[field.id] ?? "",
                  })
                : jsx.jsx("input", {
                    onChange: (event: { currentTarget: { value: string } }) => setAdditionalFields(current => ({ ...current, [field.id]: event.currentTarget.value })),
                    required: field.required,
                    type: field.type === "int" ? "number" : field.type ?? "text",
                    value: additionalFields[field.id] ?? "",
                  }),
            ],
          }, field.id))
        : null,
    ] });
  } else if (linkStep) {
    body = jsx.jsx("p", {
      children: (props.includeServerFields === true
        ? activeReason?.link_explanation ?? activeReason?.explanation
        : activeReason?.link_explanation ?? activeReason?.subtext)
        ?? "Open the linked form to finish this report.",
    });
  } else {
    body = jsx.jsxs(jsx.Fragment, {
      children: [terminalTextStep ? jsx.jsx("p", { children: activeReason?.subtext }) : null, terminalTextStep ? null : reasonOptions],
    });
  }

  return jsx.jsx("dialog", {
    className: props.contentClassName,
    "data-variant": props.dialogVariant,
    onClose: () => { if (canClose) props.onClose(); },
    open: true,
    children: jsx.jsxs("form", {
      onSubmit: event => { void advance(event); },
      children: [
        jsx.jsxs("header", {
          children: [
            jsx.jsx("h2", { children: submitState === "success" ? "Thanks for your report" : props.title }),
            subtitle == null ? null : jsx.jsx("p", { children: subtitle }),
          ],
        }),
        body,
        submitState === "error" ? jsx.jsx("p", { role: "alert", children: "We couldn't submit your report. Please try again in a moment." }) : null,
        jsx.jsxs("footer", {
          children: [
            (activeReason != null || props.onBack != null) && submitState !== "success"
              ? jsx.jsx("button", { disabled: submitState === "submitting", onClick: goBack, type: "button", children: "Back" })
              : null,
            jsx.jsx("button", { disabled: !canClose, onClick: () => { if (canClose) props.onClose(); }, type: "button", children: "Cancel" }),
            terminalTextStep && !completed
              ? null
              : jsx.jsx("button", {
                  disabled: primaryDisabled,
                  onClick: linkStep ? openExternalForm : undefined,
                  type: linkStep ? "button" : "submit",
                  children: primaryLabel,
                }),
          ],
        }),
      ],
    }),
  });
}

function initializeReportDialog(): void {
  initializeApiClient();
}

export { initializeReportDialog as n, ReportDialog as t };
