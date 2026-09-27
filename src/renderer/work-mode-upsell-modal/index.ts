import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

export interface WorkModeUpsellModalProps {
  accountKind?: "business" | "personal";
  isLoading?: boolean;
  onClose(): void;
  onUpgrade(event: unknown, plan: "business" | "personal"): void;
}

let jsx: JsxRuntime;

function WorkModeUpsellModal(props: WorkModeUpsellModalProps): unknown {
  const plan = props.accountKind ?? "personal";
  return jsx.jsxs("dialog", {
    open: true,
    children: [
      jsx.jsx("button", { type: "button", "aria-label": "Close", onClick: props.onClose, children: "×" }),
      jsx.jsx("h2", { children: "Meet ChatGPT Work" }),
      jsx.jsx("p", { children: "Use ChatGPT Work when a task needs more than a quick answer." }),
      props.isLoading
        ? jsx.jsx("p", { role: "status", children: "Loading plan…" })
        : jsx.jsx("button", {
            type: "button",
            onClick: (event: unknown) => { props.onClose(); props.onUpgrade(event, plan); },
            children: `Unlock with ${plan === "business" ? "Business" : "Plus"}`,
          }),
    ],
  });
}

function initializeWorkModeUpsellModal(): void { jsx = getJsxRuntime(); }
initializeWorkModeUpsellModal();
export { WorkModeUpsellModal };
