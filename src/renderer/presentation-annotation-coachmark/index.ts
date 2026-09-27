import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";

interface PresentationCoachmarkProps { children?: unknown; onDismiss(): void; open: boolean }
let runtime: JsxRuntime | undefined;
function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function t({ children, onDismiss, open }: PresentationCoachmarkProps): unknown {
  if (!open) return jsx().jsx(jsx().Fragment, { children });
  return jsx().jsx("section", {
    "aria-label": "Add an annotation",
    "data-align": "end",
    "data-side": "bottom",
    children: [
      jsx().jsx("strong", { children: "Add an annotation" }),
      jsx().jsx("p", { children: "Select part of the file, then request changes or ask a question." }),
      jsx().jsx("button", { "aria-label": "Dismiss onboarding tip", onClick: onDismiss, type: "button", children: "Dismiss" }),
      children,
    ],
  });
}
function n(): void {}
export { n, t };
