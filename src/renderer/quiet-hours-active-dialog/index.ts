import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

export interface QuietHoursActiveDialogProps {
  accountId: string;
  userId: string;
  timeZone: string;
  nextAllowedAt?: Date | null;
  eligible?: boolean;
  onClose(): void;
}

let jsx: JsxRuntime;

function QuietHoursActiveDialog(props: QuietHoursActiveDialogProps): unknown {
  if (props.eligible === false) return null;
  const nextAllowed = props.nextAllowedAt?.toLocaleTimeString(undefined, {
    hour: "numeric", minute: "2-digit", timeZone: props.timeZone,
  });
  return jsx.jsxs("dialog", {
    open: true,
    "data-account-id": props.accountId,
    "data-user-id": props.userId,
    children: [
      jsx.jsx("h2", { children: "Time for a break" }),
      jsx.jsx("p", { children: nextAllowed ? `You can use ChatGPT again at ${nextAllowed}` : "Quiet hours are in effect" }),
      jsx.jsx("button", { type: "button", onClick: props.onClose, children: "Close" }),
    ],
  });
}

function initializeQuietHoursActiveDialog(): void { jsx = getJsxRuntime(); }
initializeQuietHoursActiveDialog();
export { QuietHoursActiveDialog };
