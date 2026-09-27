import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { n as HeaderToolbar, t as HeaderAction } from "@rchunk/popcorn-manual-edit-header-controls";

interface EditorControls { annotationControl?: unknown; commentsControl?: unknown; editingControls?: unknown; navigationControl?: unknown; supplementalActions?: unknown; zoomControl?: unknown }
interface EditorHeaderProps { actions?: unknown; annotationControlPlacement?: "editing" | "review"; commentsControl?: unknown; contentFade?: boolean; controls: EditorControls; downloadControl?: unknown; downloadPending?: boolean; onClose?(): void; onDownload?(): void; onShare?(): void; tabId?: string; title?: unknown }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ actions, annotationControlPlacement = "review", commentsControl, controls, downloadControl, downloadPending = false, onClose, onDownload, onShare, tabId, title }: EditorHeaderProps): unknown {
  const annotation = controls.annotationControl;
  const review = annotationControlPlacement === "review" ? annotation : null;
  const editing = annotationControlPlacement === "editing" ? annotation : null;
  return jsx().jsxs("header", { className: "flex min-w-0 items-center justify-between", children: [
    jsx().jsxs("div", { children: [actions ?? title, controls.navigationControl, controls.editingControls, editing] }),
    jsx().jsxs("div", { children: [review, commentsControl ?? controls.commentsControl, controls.zoomControl, onShare == null ? null : jsx().jsx(HeaderAction, { label: "Share", onClick: onShare, children: "Share" }), downloadControl ?? (onDownload == null ? null : jsx().jsx(HeaderAction, { disabled: downloadPending, label: "Download", onClick: onDownload, children: "Download" })), controls.supplementalActions, tabId == null && onClose != null ? jsx().jsx(HeaderToolbar, { ariaLabel: "Viewer controls", children: jsx().jsx("button", { onClick: onClose, type: "button", children: "Close" }) }) : null] }),
  ] });
}
function n({ onOpenChange, open }: { onOpenChange(open: boolean): void; open: boolean }): unknown { return jsx().jsx(HeaderAction, { activeLabel: "Comments", expanded: open, label: "Open comments", onClick: () => onOpenChange(!open), pressed: open, size: "default", children: "Comments" }); }
function r(): void {}
export { n, r, t };
