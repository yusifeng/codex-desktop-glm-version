import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/codex-thread-report-dialog";
import "@rchunk/editable-plan-tab";
import "@rchunk/feedback-form-dialog";
import "@rchunk/feedback-legal-notice";
import "@rchunk/plan-side-panel";
import "@rchunk/surface";
import "@rchunk/thumb-mixed";

interface RatingControlsProps { disabled?: boolean; rating?: "down" | "up" | null; variant?: "imageOverlay" | "imageTurn" | "response"; onRate(rating: "down" | "up" | null): void }
interface PlanSummaryProps { conversationId: string; cwd?: string | null; hideCodeBlocks?: boolean; item: { content: string }; showOpenButton?: boolean; title?: string; turnId?: string; onOpen?(content: string): void }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function RatingControls({ disabled, rating, onRate }: RatingControlsProps): unknown { return jsx().jsxs("div", { "aria-label": "Rate response", children: [jsx().jsx("button", { type: "button", disabled, "aria-pressed": rating === "up", onClick: () => onRate(rating === "up" ? null : "up"), children: "Good response" }), jsx().jsx("button", { type: "button", disabled, "aria-pressed": rating === "down", onClick: () => onRate(rating === "down" ? null : "down"), children: "Bad response" })] }); }
function PlanSummary(props: PlanSummaryProps): unknown { return jsx().jsxs("section", { "aria-label": props.title ?? "Plan", children: [jsx().jsx("header", { children: props.title ?? "Plan" }), jsx().jsx("pre", { children: props.item.content }), props.showOpenButton === false ? null : jsx().jsx("button", { type: "button", onClick: () => props.onOpen?.(props.item.content), children: "Open plan" })] }); }
function createFeedbackHandler(onFeedback: (details: string, rating: "down" | "up") => void): (rating: "down" | "up", details?: string) => void { return (rating, details = "") => onFeedback(details, rating); }
function initializePlanSummary(): void { void jsx(); }
export { RatingControls as a, initializePlanSummary as i, initializePlanSummary as n, initializePlanSummary as o, createFeedbackHandler as r, PlanSummary as t };
