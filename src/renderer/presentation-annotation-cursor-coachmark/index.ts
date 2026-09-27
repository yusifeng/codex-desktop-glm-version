import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

interface CursorCoachmarkProps { children?: unknown; contentSelector?: string; message: { defaultMessage?: string; id?: string }; onDismiss(): void; open: boolean }
const r = {
  document: { id: "artifactAnnotationCursorOnboarding.documentDescription", defaultMessage: "Select text to request changes or ask questions" },
  pdf: { id: "artifactAnnotationCursorOnboarding.pdfDescription", defaultMessage: "Select text or objects to request changes or ask questions" },
  presentation: { id: "artifactAnnotationCursorOnboarding.presentationDescription", defaultMessage: "Select text, images, or objects to request changes or ask questions" },
  spreadsheet: { id: "artifactAnnotationCursorOnboarding.spreadsheetDescription", defaultMessage: "Select a cell or range to request changes or ask questions" },
} as const;
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ children, contentSelector = "[data-artifact-annotation-content]", message, onDismiss, open }: CursorCoachmarkProps): unknown { return jsx().jsxs("div", { className: "relative h-full min-h-0", "data-content-selector": contentSelector, onPointerDownCapture: (event: { button: number }) => { if (open && event.button === 0) onDismiss(); }, children: [children, open ? jsx().jsx("div", { role: "tooltip", children: message.defaultMessage ?? message.id }) : null] }); }
function i(): void {}
function n(): void {}
export { i, n, r, t };
