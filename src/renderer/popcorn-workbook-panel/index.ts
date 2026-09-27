import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/artifact-workbook-runtime";
import "@rchunk/d3-ordinal-runtime";
import "@rchunk/tableau10-palette";
import "@rchunk/spreadsheet-utils";
import "@rchunk/spreadsheet-address-utils";
import "@rchunk/app-initial";
import "@rchunk/artifact-presentation";
import "@rchunk/popcorn-icons";
import "@rchunk/popcorn-chart-hover-tooltip";
import "@rchunk/artifact-source-bootstrap";
import "@rchunk/app-primary";
import "@rchunk/popcorn-manual-edit-header-controls";
import "@rchunk/portable-thumbnail-font-face-source-runtime";
import "@rchunk/portable-thumbnail-font-runtime";
import "@rchunk/drawing-frame-geometry";
import "@rchunk/freeze-panes";
import "@rchunk/floating-ui-modifiers";
import "@rchunk/popcorn-electron-surface-style";
import "@rchunk/popcorn-review-bar-overlay";
import "@rchunk/draw-presence-label";
import "@rchunk/workbook-review-utils";
export interface WorkbookSheet { cells?: readonly (readonly unknown[])[]; id: string; name: string }
export interface PopcornWorkbookController { getActiveSheetName(): string | undefined; setActiveSheetName(name: string): void; setSelectedAddress(address: string): void; setZoom(zoom: number): void }
export interface PopcornElectronWorkbookPanelProps { className?: string; headerCenterContent?: unknown; headerRightContent?: unknown; headerTitleContent?: unknown; initialSelectedAddress?: string; initialSourceBytes?: Uint8Array; initialSourceFormat?: string; initialZoom?: number; isEditing?: boolean; onControllerReady?(controller: PopcornWorkbookController): void; onImportError?(error: Error): void; onImportReady?(): void; onInteractionAttempt?(): void; renderHeader?(parts: Record<string, unknown>): unknown; renderLayout?(parts: Record<string, unknown>): unknown; sheets?: readonly WorkbookSheet[]; theme?: string; title?: string; toolbarHidden?: boolean }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function PopcornElectronWorkbookPanel(props: PopcornElectronWorkbookPanelProps): unknown { let activeSheet = props.sheets?.[0]?.name; let address = props.initialSelectedAddress ?? "A1"; let zoom = props.initialZoom ?? 1; const controller: PopcornWorkbookController = { getActiveSheetName: () => activeSheet, setActiveSheetName(name) { if (props.sheets?.some(sheet => sheet.name === name)) activeSheet = name; props.onInteractionAttempt?.(); }, setSelectedAddress(next) { address = next; props.onInteractionAttempt?.(); }, setZoom(next) { zoom = next; props.onInteractionAttempt?.(); } }; props.onControllerReady?.(controller); props.onImportReady?.(); const header = props.renderHeader?.({ address, title: props.title, zoom }) ?? jsx().jsxs("header", { children: [props.headerTitleContent ?? jsx().jsx("h1", { children: props.title ?? "Spreadsheet" }), props.headerCenterContent, props.headerRightContent] }); const content = jsx().jsxs("div", { "data-active-sheet": activeSheet, "data-selected-address": address, "data-zoom": zoom, children: [jsx().jsx("nav", { children: (props.sheets ?? []).map(sheet => jsx().jsx("button", { "aria-pressed": sheet.name === activeSheet, onClick: () => controller.setActiveSheetName(sheet.name), type: "button", children: sheet.name }, sheet.id)) }), jsx().jsx("div", { role: "grid", children: (props.sheets?.find(sheet => sheet.name === activeSheet)?.cells ?? []).map((row, rowIndex) => jsx().jsx("div", { role: "row", children: row.map((cell, columnIndex) => jsx().jsx("span", { role: "gridcell", children: String(cell ?? "") }, columnIndex)) }, rowIndex)) })] }); const panel = jsx().jsxs("section", { className: props.className, "data-codex-popcorn-editor": true, "data-testid": "popcorn-electron-workbook-panel", "data-theme": props.theme ?? "codex", "data-editing": props.isEditing ?? false, children: [header, props.toolbarHidden ? null : jsx().jsx("div", { role: "toolbar", children: address }), content] }); return props.renderLayout?.({ content, header, panel }) ?? panel; }
export { PopcornElectronWorkbookPanel };
