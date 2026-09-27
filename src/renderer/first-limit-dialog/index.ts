import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/rolldown-runtime";

export type FirstLimitPresentation =
  | { variant: "thinking" | "instant"; resetDay: "today" | "later"; resetTime: Date }
  | { variant: "plan_intro" | "limit_reached" };

export interface FirstLimitDialogProps {
  presentation: FirstLimitPresentation;
  onClose(): void;
  onUpgradeAfterClose?(presentation: FirstLimitPresentation): void;
}

const titles: Record<FirstLimitPresentation["variant"], string> = {
  thinking: "You’re out of messages with advanced intelligence",
  instant: "You’re out of messages with standard intelligence",
  plan_intro: "What’s in your Free plan",
  limit_reached: "You’ve reached a limit",
};

let jsx: JsxRuntime;

function FirstLimitDialog(props: FirstLimitDialogProps): unknown {
  const presentation = props.presentation;
  const reset = "resetTime" in presentation ? presentation.resetTime.toLocaleString() : null;
  return jsx.jsxs("dialog", {
    open: true,
    children: [
      jsx.jsx("h2", { children: titles[presentation.variant] }),
      jsx.jsx("p", {
        children: reset
          ? `Keep chatting with reduced capability until usage resets ${"resetDay" in presentation && presentation.resetDay === "today" ? "today" : "later"} at ${reset}.`
          : presentation.variant === "plan_intro"
            ? "The free version of ChatGPT includes a limited amount of usage."
            : "Some Free plan features may be unavailable until usage resets.",
      }),
      jsx.jsx("button", { type: "button", onClick: props.onClose, children: "Continue" }),
      props.onUpgradeAfterClose
        ? jsx.jsx("button", { type: "button", onClick: () => { props.onClose(); props.onUpgradeAfterClose?.(presentation); }, children: "Upgrade" })
        : null,
    ],
  });
}

function initializeFirstLimitDialog(): void { jsx = getJsxRuntime(); }
initializeFirstLimitDialog();
export { FirstLimitDialog };
