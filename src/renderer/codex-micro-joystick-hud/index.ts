import {
  G2 as defineMessages,
  HX as useSignalValue,
  I3 as getJsxRuntime,
  Y2 as FormattedMessage,
  m4 as classNames,
  n4 as useIntl,
  type JsxRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import { r as initializeJoystickFeedback, t as feedbackSignal } from "@rchunk/codex-micro-joystick-feedback";
import { n as initializeAnalogActionTitle } from "@rchunk/codex-micro-analog-action-title";

interface HudFeedback {
  action: Record<string, unknown> | null;
  direction: "up" | "right" | "down" | "left";
  event: { angle: number; distance: number };
  gameActivationProgress?: number;
  status: "game-gesture" | "tracking" | "triggered" | "unassigned" | "unavailable";
  visible: boolean;
}

let jsx: JsxRuntime;
const messages = defineMessages({
  miniGameTitle: { id: "codexMicro.joystickFeedback.miniGameTitle", defaultMessage: "Mini-game" },
  gameGesture: { id: "codexMicro.joystickFeedback.gameGesture", defaultMessage: "Secret game" },
  tracking: { id: "codexMicro.joystickFeedback.tracking", defaultMessage: "Move farther to trigger" },
  triggered: { id: "codexMicro.joystickFeedback.triggered", defaultMessage: "Triggered" },
  unassigned: { id: "codexMicro.joystickFeedback.unassigned", defaultMessage: "Direction reached" },
  unavailable: { id: "codexMicro.joystickFeedback.unavailable", defaultMessage: "Shortcut unavailable" },
  unassignedTracking: { id: "codexMicro.joystickFeedback.unassignedTracking", defaultMessage: "No shortcut configured" },
  up: { id: "codexMicro.joystickFeedback.up", defaultMessage: "Up" },
  right: { id: "codexMicro.joystickFeedback.right", defaultMessage: "Right" },
  down: { id: "codexMicro.joystickFeedback.down", defaultMessage: "Down" },
  left: { id: "codexMicro.joystickFeedback.left", defaultMessage: "Left" },
});

function CodexMicroJoystickHud(): unknown {
  const feedback = useSignalValue(feedbackSignal) as HudFeedback;
  return renderJoystickHud({ feedback, isMappingEditorOpen: false });
}

function renderJoystickHud({ feedback, isMappingEditorOpen }: {
  feedback: HudFeedback;
  isMappingEditorOpen: boolean;
}): unknown {
  const runtime = ensureJsx();
  const intl = useIntl();
  const visible = feedback.visible && !isMappingEditorOpen;
  const radians = feedback.event.angle * Math.PI * 2;
  const distance = Math.min(feedback.event.distance, 1) * 13;
  const gameGesture = feedback.status === "game-gesture";
  const statusMessage = feedback.status === "tracking" && feedback.action == null
    ? messages.unassignedTracking : messages[feedback.status];
  const title = gameGesture
    ? runtime.jsx(FormattedMessage, { ...messages.miniGameTitle })
    : feedback.action == null
      ? runtime.jsx(FormattedMessage, { id: "codexMicro.joystickFeedback.unassignedTitle", defaultMessage: "Unassigned" })
      : String(feedback.action.command ?? feedback.action.commandId ?? feedback.action.skillName ?? "Action");
  const progress = Math.round((feedback.gameActivationProgress ?? 0) * 100);
  return runtime.jsxs("div", {
    "aria-hidden": !visible,
    className: classNames(
      "pointer-events-none absolute top-14 left-1/2 z-[55] -translate-x-1/2 transition",
      visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
    ),
    "data-status": feedback.status,
    "data-visible": visible,
    children: [
      runtime.jsx("div", {
        className: "relative size-14 rounded-full border border-default",
        children: runtime.jsx("span", {
          className: "absolute left-1/2 top-1/2 size-2 rounded-full bg-text-info",
          style: { transform: `translate(${Math.cos(radians) * distance}px, ${Math.sin(radians) * distance}px)` },
        }),
      }),
      runtime.jsxs("div", { className: "flex min-w-0 flex-col", children: [
        runtime.jsx("strong", { children: title }),
        runtime.jsx("span", { children: gameGesture
          ? `${intl.formatMessage(messages.gameGesture)} · ${progress}%`
          : intl.formatMessage(statusMessage) }),
        runtime.jsx("span", { children: intl.formatMessage(messages[feedback.direction]) }),
      ] }),
    ],
  });
}

function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}

initializeJoystickFeedback();
initializeAnalogActionTitle();
jsx = getJsxRuntime();

export { CodexMicroJoystickHud };
