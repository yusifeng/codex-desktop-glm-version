import "@rchunk/rolldown-runtime";
import * as Shared from "@rchunk/app-shared";
import * as InputSelector from "@rchunk/input-selector-group";
import * as Buttons from "@rchunk/button";
import * as Motion from "@rchunk/proxy";
import * as ReducedMotion from "@rchunk/use-reduced-motion";

type Role = "candidate" | "comparison" | "sorted" | "remaining";
interface Item { id: string; value: number; label: unknown; positionLabel: unknown; role: Role }
interface JsxRuntime { jsx(type: unknown, props: Record<string, unknown>, key?: string): unknown; jsxs(type: unknown, props: Record<string, unknown>, key?: string): unknown }
const shared = Shared as unknown as { I3(): JsxRuntime; K2(): void; Y2: (p: Record<string, unknown>) => unknown; h4(): void; m4(...v: unknown[]): string };
const inputs = InputSelector as unknown as { r(): void; t: (p: Record<string, unknown>) => unknown };
const buttons = Buttons as unknown as { n: (p: Record<string, unknown>) => unknown; r(): void; t: (p: Record<string, unknown>) => unknown };
const motion = Motion as unknown as { n(): void; t: { div: unknown } };
const reduced = ReducedMotion as unknown as { n: () => boolean; t(): void };
let jsx: JsxRuntime;

function SortControls(props: Record<string, unknown>): unknown {
  const message = (id: string, defaultMessage: string) => jsx.jsx(shared.Y2, { id, defaultMessage });
  return jsx.jsxs(buttons.n, { columns: 2, role: "group", "aria-label": props.ariaLabel, children: [
    jsx.jsx(buttons.t, { onClick: props.onShuffle, children: message("learningBlock.sortControls.shuffle", "Shuffle") }),
    jsx.jsx(buttons.t, { onClick: props.onPlayPause, disabled: props.playDisabled, "aria-pressed": props.isPlaying, children: props.isPlaying ? message("learningBlock.sortControls.pause", "Pause") : message("learningBlock.sortControls.play", "Play") }),
    jsx.jsx(buttons.t, { onClick: props.onStep, disabled: props.stepDisabled, children: message("learningBlock.sortControls.step", "Step") }),
    jsx.jsx(buttons.t, { onClick: props.onFinishPass, disabled: props.finishPassDisabled, "aria-busy": props.isFinishingPass || undefined, children: props.isFinishingPass ? message("learningBlock.sortControls.finishingPass", "Finishing pass…") : message("learningBlock.sortControls.finishPass", "Finish pass") }),
  ] });
}
function SortIndexSelector({ ariaValueText, label, max, onChange, onInteractionStart, value }: { ariaValueText?: string; label: string; max: number; onChange(v: number): void; onInteractionStart?: () => void; value: number }): unknown {
  return jsx.jsx(inputs.t, { inputs: [{ ariaLabel: label, ariaValueText, min: 1, max: max + 1, step: 1, value: value + 1, variable: label, variableFormat: "text", formatValueForInput: (v: number) => String(Math.round(v)), onChange: (v: number) => { onInteractionStart?.(); onChange(v - 1); } }] });
}
const barHeight = (value: number, max: number) => max > 0 ? Math.max(0, value) / max * 168 : 0;
const color = (role: Role, sortedColor: "primary" | "companion") => role === "candidate" ? "var(--learning-block-accent-surface)" : role === "comparison" ? "var(--learning-block-color-primary)" : role === "sorted" ? (sortedColor === "primary" ? "var(--learning-block-color-primary)" : "var(--learning-block-color-companion)") : "var(--text-tertiary)";
function SortBarVisualization({ ariaLabel, details, heading, headerMinHeightPx, items, maxValue, presentationMode = "standard", sortedColor = "companion" }: { ariaLabel: string; details?: unknown; heading: unknown; headerMinHeightPx?: number; items: Item[]; maxValue: number; presentationMode?: string; sortedColor?: "primary" | "companion" }): unknown {
  const reduceMotion = reduced.n();
  if (presentationMode === "thumbnail") return jsx.jsx("div", { "aria-label": ariaLabel, role: "img", "data-sort-bar-thumbnail": true, children: items.map((item) => jsx.jsx(motion.t.div, { layout: !reduceMotion && "position", children: jsx.jsx("div", { "data-sort-bar-id": item.id, "data-sort-bar-role": item.role, style: { backgroundColor: color(item.role, sortedColor), height: (maxValue > 0 ? Math.max(0, item.value) / maxValue * 100 : 0) + "%" } }) }, item.id)) });
  return jsx.jsx("div", { "data-sort-bar-visualization": true, "aria-label": ariaLabel, role: "img", children: jsx.jsxs("div", { children: [jsx.jsxs("div", { style: headerMinHeightPx === undefined ? undefined : { minHeight: headerMinHeightPx }, children: [heading, details || null] }), jsx.jsx("div", { children: items.map((item) => jsx.jsx(motion.t.div, { layout: !reduceMotion && "position", children: jsx.jsx("div", { "data-sort-bar-id": item.id, "data-sort-bar-role": item.role, style: { height: barHeight(item.value, maxValue) + "px" }, children: item.label }) }, item.id)) })] }) });
}
function initializeSortControls(): void { shared.K2(); buttons.r(); jsx = shared.I3(); }
function initializeSortIndexSelector(): void { inputs.r(); jsx = shared.I3(); }
function initializeSortBarVisualization(): void { shared.h4(); motion.n(); reduced.t(); jsx = shared.I3(); }
export { SortControls as a, initializeSortIndexSelector as i, initializeSortBarVisualization as n, initializeSortControls as o, SortIndexSelector as r, SortBarVisualization as t };
