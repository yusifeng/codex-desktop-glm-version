import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, m4 as cn } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";

const jsxRuntime = getJsxRuntime();
export type AnnotationControlValue = boolean | number | string;
export interface AnnotationControlBase { callback: string; currentValue?: AnnotationControlValue | null; defaultValue?: AnnotationControlValue | null; label: string; reference?: string | null }
export interface SelectAnnotationControl extends AnnotationControlBase { options: Array<{ label: string; value: string }>; type: "select" }
export interface ToggleAnnotationControl extends AnnotationControlBase { type: "toggle" }
export interface ColorAnnotationControl extends AnnotationControlBase { type: "color" }
export interface NumberAnnotationControl extends AnnotationControlBase { max: number; min: number; step?: number; type: "number" | "range" }
export type AnnotationControl = SelectAnnotationControl | ToggleAnnotationControl | ColorAnnotationControl | NumberAnnotationControl;
export interface AnnotationControlChange { callback: string; previousValue?: AnnotationControlValue | null; value: AnnotationControlValue }
export interface DesignEditorState { annotationControlChanges?: AnnotationControlChange[]; annotationControls: { controls: AnnotationControl[] } }
const designEditorInputClasses = { numericInput: "_numericInput_1517c_1", colorInput: "_colorInput_1517c_19" } as const;
const defaultControlValue = (control: AnnotationControl): AnnotationControlValue => control.defaultValue ?? control.currentValue ?? (control.type === "toggle" ? false : control.type === "color" ? "#ffffff" : control.type === "select" ? control.options[0]?.value ?? "" : control.min);
function DesignEditorRow({ children }: { children?: unknown }): unknown { return jsxRuntime.jsx("div", { className: "grid grid-cols-[minmax(0,--spacing(30))_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 px-4 py-2", children }); }
function ControlInput({ change, control, isEditable, onValueChange }: { change: AnnotationControlChange; control: AnnotationControl; isEditable: boolean; onValueChange(value: AnnotationControlValue): void }): unknown {
  if (control.type === "select") return jsxRuntime.jsx("select", { "aria-label": control.label, disabled: !isEditable, value: String(change.value), onChange: (event: { target: { value: string } }) => onValueChange(event.target.value), children: control.options.map(option => jsxRuntime.jsx("option", { value: option.value, children: option.label }, option.value)) });
  if (control.type === "toggle") return jsxRuntime.jsx("input", { "aria-label": control.label, checked: change.value === true, disabled: !isEditable, type: "checkbox", onChange: (event: { target: { checked: boolean } }) => onValueChange(event.target.checked) });
  if (control.type === "color") return jsxRuntime.jsx("input", { "aria-label": control.label, className: designEditorInputClasses.colorInput, disabled: !isEditable, type: "color", value: normalizeColor(String(change.value)), onChange: (event: { target: { value: string } }) => onValueChange(event.target.value) });
  return jsxRuntime.jsx("input", { "aria-label": control.label, className: designEditorInputClasses.numericInput, disabled: !isEditable, max: control.max, min: control.min, step: control.step, type: "range", value: Number(change.value), onChange: (event: { currentTarget: { valueAsNumber: number } }) => onValueChange(event.currentTarget.valueAsNumber) });
}
function DesignEditorControls({ editorState, isEditable, onReset, onValueChange }: { dropdownPortalContainer?: unknown; editorState: DesignEditorState; isEditable: boolean; onReset(callback: string): void; onValueChange(callback: string, value: AnnotationControlValue): void }): unknown {
  if (editorState.annotationControls.controls.length === 0) return null;
  return jsxRuntime.jsx(jsxRuntime.Fragment, { children: editorState.annotationControls.controls.map(control => { const change = editorState.annotationControlChanges?.find(item => item.callback === control.callback) ?? { callback: control.callback, previousValue: control.currentValue, value: control.currentValue ?? defaultControlValue(control) }; const edited = isEditable && change.previousValue != null && change.value !== change.previousValue; return jsxRuntime.jsxs(DesignEditorRow, { children: [jsxRuntime.jsxs("span", { className: "min-w-0 truncate", children: [control.label, control.reference == null ? null : jsxRuntime.jsx("code", { children: control.reference })] }), jsxRuntime.jsxs("span", { className: cn("flex items-center justify-end", control.type !== "toggle" && "w-48"), children: [edited ? jsxRuntime.jsx("button", { type: "button", "aria-label": `Reset ${control.label}`, onClick: () => onReset(control.callback), children: "↺" }) : null, jsxRuntime.jsx(ControlInput, { change, control, isEditable, onValueChange: value => onValueChange(control.callback, value) })] })] }, control.callback); }) });
}
function rgbToHexOrOriginal(value: string): string { const match = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i); return match?.slice(1).every(channel => Number(channel) <= 255) ? normalizeColor(value) : value; }
function normalizeColor(value?: string | null): string { const trimmed = value?.trim() ?? "", hex = trimmed.match(/^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i); if (hex) { const color = hex[1]; return color.length <= 4 ? `#${color.slice(0, 3).split("").map(channel => `${channel}${channel}`).join("")}` : `#${color.slice(0, 6)}`; } const rgb = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i); return rgb == null ? "#000000" : `#${rgb.slice(1, 4).map(channel => Math.min(255, Number(channel)).toString(16).padStart(2, "0")).join("")}`; }
function updateAnnotationControl(state: DesignEditorState, callback: string, value?: AnnotationControlValue | null): DesignEditorState { const control = state.annotationControls.controls.find(item => item.callback === callback); if (!control) return state; const changes = state.annotationControlChanges ?? [], existing = changes.find(item => item.callback === callback), previousValue = existing == null ? control.currentValue : existing.previousValue, change = { callback, previousValue, value: value ?? previousValue ?? defaultControlValue(control) }; return { ...state, annotationControlChanges: existing == null ? [...changes, change] : changes.map(item => item.callback === callback ? change : item) }; }
function initializeDesignEditorLayout(): void {}
function initializeDesignEditorStyles(): void {}
function initializeDesignEditorControls(): void { void rgbToHexOrOriginal; }
function initializeDesignEditorState(): void {}
export { designEditorInputClasses as a, initializeDesignEditorLayout as c, initializeDesignEditorControls as i, updateAnnotationControl as n, initializeDesignEditorStyles as o, DesignEditorControls as r, DesignEditorRow as s, initializeDesignEditorState as t };
