import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, e6 as getReactRuntime, type JsxRuntime } from "@rchunk/app-shared";
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
export interface PopcornWorkbookController {
  getActiveSheetName(): string | undefined;
  getSelectedAddress(): string;
  getZoom(): number;
  setActiveSheetName(name: string): void;
  setSelectedAddress(address: string): void;
  setZoom(zoom: number): void;
}
export interface PopcornElectronWorkbookPanelProps {
  className?: string;
  headerCenterContent?: unknown;
  headerRightContent?: unknown;
  headerTitleContent?: unknown;
  initialSelectedAddress?: string;
  initialSourceBytes?: Uint8Array;
  initialSourceFormat?: string;
  initialZoom?: number;
  isEditing?: boolean;
  onControllerReady?(controller: PopcornWorkbookController): void;
  onImportError?(error: Error): void;
  onImportReady?(): void;
  onInteractionAttempt?(): void;
  renderHeader?(parts: Record<string, unknown>): unknown;
  renderLayout?(parts: Record<string, unknown>): unknown;
  sheets?: readonly WorkbookSheet[];
  theme?: string;
  title?: string;
  toolbarHidden?: boolean;
}

let runtime: JsxRuntime | undefined;
let React: ReturnType<typeof getReactRuntime> | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function react(): ReturnType<typeof getReactRuntime> { React ??= getReactRuntime(); return React; }
function clampZoom(value: number): number { return Number.isFinite(value) ? Math.min(4, Math.max(0.25, value)) : 1; }
function validateSource(bytes?: Uint8Array, format?: string): void {
  if (bytes != null && bytes.byteLength === 0) throw new Error("Workbook source is empty");
  if (format != null && !["csv", "tsv", "xls", "xlsx"].includes(format.toLowerCase())) throw new Error(`Unsupported workbook format: ${format}`);
}

function PopcornElectronWorkbookPanel(props: PopcornElectronWorkbookPanelProps): unknown {
  const R = react();
  const [activeSheet, setActiveSheet] = R.useState<string | undefined>(() => props.sheets?.[0]?.name);
  const [address, setAddress] = R.useState(props.initialSelectedAddress ?? "A1");
  const [zoom, setZoom] = R.useState(clampZoom(props.initialZoom ?? 1));
  const state = R.useRef({ activeSheet, address, zoom });
  state.current = { activeSheet, address, zoom };
  const controllerRef = R.useRef<PopcornWorkbookController | null>(null);
  controllerRef.current ??= {
    getActiveSheetName: () => state.current.activeSheet,
    getSelectedAddress: () => state.current.address,
    getZoom: () => state.current.zoom,
    setActiveSheetName(name) {
      if (!props.sheets?.some((sheet) => sheet.name === name) || state.current.activeSheet === name) return;
      state.current.activeSheet = name;
      setActiveSheet(name);
      props.onInteractionAttempt?.();
    },
    setSelectedAddress(next) {
      const normalized = next.trim().toUpperCase();
      if (!/^[A-Z]+[1-9]\d*$/.test(normalized) || normalized === state.current.address) return;
      state.current.address = normalized;
      setAddress(normalized);
      props.onInteractionAttempt?.();
    },
    setZoom(next) {
      const normalized = clampZoom(next);
      if (normalized === state.current.zoom) return;
      state.current.zoom = normalized;
      setZoom(normalized);
      props.onInteractionAttempt?.();
    },
  };
  R.useEffect(() => {
    try { validateSource(props.initialSourceBytes, props.initialSourceFormat); props.onImportReady?.(); }
    catch (error) { props.onImportError?.(error instanceof Error ? error : new Error(String(error))); }
  }, [props.initialSourceBytes, props.initialSourceFormat, props.onImportError, props.onImportReady]);
  R.useEffect(() => { props.onControllerReady?.(controllerRef.current!); }, [props.onControllerReady]);
  R.useEffect(() => {
    if (activeSheet != null && !props.sheets?.some((sheet) => sheet.name === activeSheet)) {
      const fallback = props.sheets?.[0]?.name;
      state.current.activeSheet = fallback;
      setActiveSheet(fallback);
    }
  }, [activeSheet, props.sheets]);

  const controller = controllerRef.current;
  const header = props.renderHeader?.({ address, controller, title: props.title, zoom }) ?? jsx().jsxs("header", { children: [props.headerTitleContent ?? jsx().jsx("h1", { children: props.title ?? "Spreadsheet" }), props.headerCenterContent, props.headerRightContent] });
  const sheet = props.sheets?.find((candidate) => candidate.name === activeSheet);
  const content = jsx().jsxs("div", { "data-active-sheet": activeSheet, "data-selected-address": address, "data-zoom": zoom, children: [
    jsx().jsx("nav", { "aria-label": "Workbook sheets", children: (props.sheets ?? []).map((candidate) => jsx().jsx("button", { "aria-pressed": candidate.name === activeSheet, onClick: () => controller.setActiveSheetName(candidate.name), type: "button", children: candidate.name }, candidate.id)) }),
    jsx().jsx("div", { role: "grid", "aria-label": sheet?.name ?? "Workbook", children: (sheet?.cells ?? []).map((row, rowIndex) => jsx().jsx("div", { role: "row", children: row.map((cell, columnIndex) => jsx().jsx("span", { role: "gridcell", "data-address": `${String.fromCharCode(65 + columnIndex)}${rowIndex + 1}`, children: String(cell ?? "") }, columnIndex)) }, rowIndex)) }),
  ] });
  const panel = jsx().jsxs("section", { className: props.className, "data-codex-popcorn-editor": true, "data-testid": "popcorn-electron-workbook-panel", "data-theme": props.theme ?? "codex", "data-editing": props.isEditing ?? false, children: [header, props.toolbarHidden ? null : jsx().jsxs("div", { role: "toolbar", children: [address, jsx().jsx("output", { children: `${Math.round(zoom * 100)}%` })] }), content] });
  return props.renderLayout?.({ content, controller, header, panel }) ?? panel;
}

export { PopcornElectronWorkbookPanel };
