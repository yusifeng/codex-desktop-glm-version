import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as joinClasses, type JsxRuntime } from "@rchunk/app-shared";

interface DrawingSizeSliderProps { "aria-label": string; className?: string; disabled?: boolean; forceExpanded?: boolean; max: number; min: number; name?: string; onInteractionEnd?(): void; onInteractionStart?(): void; onValueChange(value: number): void; preserveTextFocus?: boolean; title?: string; value: number }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ "aria-label": ariaLabel, className, disabled = false, forceExpanded = false, max, min, name, onInteractionEnd, onInteractionStart, onValueChange, preserveTextFocus = false, title, value }: DrawingSizeSliderProps): unknown {
  const clamped = Math.min(Math.max(value, min), max);
  return jsx().jsx("input", { "aria-label": ariaLabel, className: joinClasses("h-48 w-8 cursor-ns-resize", disabled && "cursor-not-allowed opacity-50", forceExpanded && "scale-110", className), "data-sketch-preserve-text-focus": preserveTextFocus || undefined, disabled, max, min, name, onBlur: onInteractionEnd, onChange: (event: { target: { value: string } }) => { if (!disabled) onValueChange(Number(event.target.value)); }, onFocus: onInteractionStart, onKeyDown: onInteractionStart, onKeyUp: onInteractionEnd, onPointerDown: onInteractionStart, onPointerUp: onInteractionEnd, orient: "vertical", title, type: "range", value: clamped });
}
function n(): void {}
export { n, t };
