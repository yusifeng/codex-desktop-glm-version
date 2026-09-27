import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/rolldown-runtime";

export interface ModelPickerUpsellModel { displayName: string; model: string; defaultReasoningEffort?: string; }
export interface ModelPickerUpsellStatus {
  model_picker_upsell?: { title?: string; message?: string; ctas?: Array<{ id: string; label: string }> } | null;
}
export interface ModelPickerUpsellModalProps {
  model: ModelPickerUpsellModel;
  rateLimitStatus: ModelPickerUpsellStatus;
  onClose(): void;
  onRestorePickerFocus?(): void;
  onSelectCta?(id: string): void;
}

let jsx: JsxRuntime;

function ModelPickerUpsellModal(props: ModelPickerUpsellModalProps): unknown {
  const upsell = props.rateLimitStatus.model_picker_upsell;
  if (upsell == null) return null;
  return jsx.jsxs("dialog", {
    open: true,
    children: [
      jsx.jsx("button", { type: "button", "aria-label": "Close", onClick: () => { props.onClose(); props.onRestorePickerFocus?.(); }, children: "×" }),
      jsx.jsx("h2", { children: upsell.title ?? `Keep using ${props.model.displayName}` }),
      upsell.message ? jsx.jsx("p", { children: upsell.message }) : null,
      jsx.jsx("div", {
        children: (upsell.ctas ?? []).map((cta) => jsx.jsx("button", {
          type: "button", onClick: () => props.onSelectCta?.(cta.id), children: cta.label,
        }, cta.id)),
      }),
    ],
  });
}

function initializeModelPickerUpsellModal(): void { jsx = getJsxRuntime(); }
initializeModelPickerUpsellModal();
export { ModelPickerUpsellModal };
