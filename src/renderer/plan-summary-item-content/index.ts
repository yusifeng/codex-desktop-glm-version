import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReact, type JsxRuntime } from "@rchunk/app-shared";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/app-primary";
import * as codexThreadReportDialog from "@rchunk/codex-thread-report-dialog";
import "@rchunk/editable-plan-tab";
import * as feedbackFormDialog from "@rchunk/feedback-form-dialog";
import * as feedbackLegalNotice from "@rchunk/feedback-legal-notice";
import "@rchunk/plan-side-panel";
import "@rchunk/surface";
import "@rchunk/thumb-mixed";

interface RatingControlsProps { disabled?: boolean; rating?: "down" | "up" | null; shouldRestoreFocus?: boolean; variant?: "imageOverlay" | "imageTurn" | "response"; onRate(rating: "down" | "up" | null): void }
interface TurnRatingControlsProps { hasArtifacts?: boolean; reportEntityType?: string; threadId: string; turnId?: string; onFeedback?(rating: "down" | "up" | null, details?: string): void }
interface PlanSummaryProps {
  conversationId: string;
  cwd?: string | null;
  defaultCollapsed?: boolean;
  hasArtifacts?: boolean;
  hideCodeBlocks?: boolean;
  isThreadPreview?: boolean;
  isThreadPreviewCollapsed?: boolean;
  item: { completed?: boolean; content: string };
  onOpen?(content: string): void;
  onOpenInSidePanel?(): void;
  reportEntityType?: string;
  showOpenButton?: boolean;
  title?: string;
  turnId?: string;
}
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function RatingControls({ disabled, rating, variant = "response", onRate }: RatingControlsProps): unknown {
  const action = (next: "down" | "up") => onRate(rating === next ? null : next);
  return jsx().jsxs("div", {
    "aria-label": "Rate response",
    "data-rating-controls-variant": variant,
    role: "group",
    children: [
      jsx().jsx("button", { type: "button", disabled, "aria-label": rating === "up" ? "Remove good response feedback" : "Good response", "aria-pressed": rating === "up", onClick: () => action("up"), children: "Good response" }),
      jsx().jsx("button", { type: "button", disabled, "aria-label": rating === "down" ? "Remove bad response feedback" : "Bad response", "aria-pressed": rating === "down", onClick: () => action("down"), children: "Bad response" }),
    ],
  });
}
function displayPlanContent(content: string, hideCodeBlocks: boolean): string {
  return hideCodeBlocks ? content.replace(/```[\s\S]*?```/gu, "").replace(/\n{3,}/gu, "\n\n").trim() : content;
}
function downloadPlan(content: string): void {
  if (typeof document === "undefined" || typeof URL?.createObjectURL !== "function") return;
  const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.download = "PLAN.md";
  anchor.href = url;
  anchor.click();
  URL.revokeObjectURL(url);
}
function PlanSummary(props: PlanSummaryProps): unknown {
  const react = getReact?.();
  const [collapsed, setCollapsed] = react?.useState?.(props.defaultCollapsed === true) ?? [props.defaultCollapsed === true, () => undefined];
  const completed = props.item.completed === true && props.item.content.trim().length > 0;
  const title = props.title ?? "Plan";
  const content = displayPlanContent(props.item.content, props.hideCodeBlocks === true);
  const open = () => props.onOpenInSidePanel != null ? props.onOpenInSidePanel() : props.onOpen?.(props.item.content);
  const toolbar = jsx().jsxs("div", { "data-plan-actions": true, children: [
    jsx().jsx("button", { type: "button", "aria-expanded": !collapsed, onClick: () => setCollapsed(!collapsed), children: collapsed ? "Expand plan" : "Collapse plan" }),
    completed ? jsx().jsx("button", { type: "button", onClick: () => downloadPlan(props.item.content), children: "Download plan" }) : null,
    props.showOpenButton === false || !completed ? null : jsx().jsx("button", { type: "button", "aria-pressed": props.isThreadPreviewCollapsed === true, onClick: open, children: props.isThreadPreviewCollapsed === true ? "Close plan side panel" : "Open plan in side panel" }),
  ] });
  return jsx().jsxs("section", {
    "aria-label": title,
    "data-plan-completed": completed,
    "data-plan-summary": true,
    "data-report-entity-type": props.reportEntityType ?? "thread",
    children: [
      jsx().jsxs("header", { children: [jsx().jsx("strong", { children: title }), toolbar] }),
      collapsed ? null : jsx().jsx("pre", { "data-plan-content": true, children: content }),
    ],
  });
}
function TurnRatingControls(props: TurnRatingControlsProps): unknown {
  const FeedbackFormDialog = (feedbackFormDialog as any).t;
  const FeedbackLegalNotice = (feedbackLegalNotice as any).t;
  const CodexThreadReportDialog = (codexThreadReportDialog as any).t;
  const react = getReact?.();
  const [rating, setRating] = react?.useState?.<"down" | "up" | null>(null) ?? [null, () => undefined];
  const scope = typeof (appSharedChunk as any).LX === "function" ? (appSharedChunk as any).LX((appSharedChunk as any).ZI) : null;
  const analytics = typeof (appSharedChunk as any).HX === "function" ? (appSharedChunk as any).HX((appInitialChunk as any).Cpn) : null;
  const closeFeedback = (): void => { if (scope != null && typeof (appInitialChunk as any).zzt === "function") (appInitialChunk as any).zzt(scope, FeedbackFormDialog); };
  const submit = (next: "down" | "up", details = "", selectedOptionId?: string): void => {
    analytics?.submitCodexAnalyticsEvent?.({
      action: "submit_turn_feedback",
      eventKind: "action",
      metadata: { details, has_artifacts: props.hasArtifacts === true, selected_option: selectedOptionId },
      threadId: props.threadId,
      turnId: props.turnId,
    });
  };
  const openFeedback = (next: "down" | "up"): void => {
    if (scope == null || typeof (appInitialChunk as any).Uzt !== "function") return;
    const options = next === "up"
      ? [
          { id: "solved_my_task", label: "Solved my task" },
          { id: "followed_my_instructions", label: "Followed my instructions" },
          { id: "good_code_or_output_quality", label: "Good code / output quality" },
          { id: "fast_and_efficient", label: "Fast and efficient" },
        ]
      : [
          { id: "incorrect_or_incomplete", label: "Incorrect or incomplete" },
          { id: "didnt_follow_my_instructions", label: "Didn't follow my instructions" },
          { id: "poor_code_or_output_quality", label: "Poor code / output quality" },
          { id: "off_track_or_lost_context", label: "Went off track or lost context" },
          { id: "slow_or_buggy", label: "Slow or buggy" },
          { id: "safety_or_legal_concern", label: "Safety or legal concern" },
          { id: "other", label: "Other" },
        ];
    (appInitialChunk as any).Uzt(scope, FeedbackFormDialog, {
      belowFreeformContent: jsx().jsx(FeedbackLegalNotice as any, {}),
      freeformFeedbackRequired: false,
      onClose: closeFeedback,
      onOptionSelect(value: { details: string; selectedOptionId: string }) {
        if (value.selectedOptionId !== "safety_or_legal_concern") return;
        closeFeedback();
        (appInitialChunk as any).Uzt(scope, CodexThreadReportDialog, {
          reportEntityType: props.reportEntityType ?? "thread",
          threadId: props.threadId,
          onBackToFeedback: () => openFeedback(next),
        });
      },
      onSubmit(value: { details: string; selectedOptionId: string }) {
        if (value.selectedOptionId !== "safety_or_legal_concern") submit(next, value.details, value.selectedOptionId);
      },
      options,
    });
  };
  return jsx().jsx(RatingControls, {
    rating,
    onRate(next) {
      const normalized = rating === next ? null : next;
      setRating(normalized);
      if (normalized == null) return;
      const sessionId = scope?.get?.((appInitialChunk as any).OQt, props.threadId);
      analytics?.submitCodexAnalyticsEvent?.({
        eventKind: "turn_rating",
        rating: normalized === "up" ? "thumbs_up" : "thumbs_down",
        sessionId: sessionId === props.threadId && scope?.get?.((appInitialChunk as any).PQt, props.threadId) != null ? null : sessionId,
        threadId: props.threadId,
        turnId: props.turnId,
      });
      props.onFeedback?.(normalized, "");
      openFeedback(normalized);
    },
  });
}
function initializePlanSummary(): void {
  (feedbackFormDialog as any).n?.();
  (codexThreadReportDialog as any).n?.();
  (feedbackLegalNotice as any).n?.();
  void jsx();
}
export { RatingControls as a, initializePlanSummary as i, initializePlanSummary as n, initializePlanSummary as o, TurnRatingControls as r, PlanSummary as t };
