import {
  EX as getCodexMicroStatusColor,
  G2 as defineMessages,
  I3 as getJsxRuntime,
  Y2 as FormattedMessage,
  h4 as initializeClassNames,
  m4 as classNames,
  n4 as useIntl,
  o_ as Tooltip,
  type CodexMicroStatus,
  type JsxRuntime,
} from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/play-outline";

export interface KeycapDefinition {
  icon: string;
  id: string;
}
export interface KeycapShellProps { children?: unknown; className?: string }
export interface KeycapLegendProps { className?: string; keycap: KeycapDefinition }
export interface AgentSlotPreview {
  selected?: boolean;
  status?: CodexMicroStatus;
  threadKey?: string | null;
  title?: string | null;
}
export interface AgentKeyPreviewProps {
  assignmentTitle?: string | null;
  isPressed?: boolean;
  keycap?: KeycapDefinition | null;
  onClick?: () => void;
  position: number;
  showTooltip?: boolean;
  slot?: AgentSlotPreview | null;
}
export interface KeyboardSurfaceProps { children?: unknown; className?: string }
export interface EncoderKnobProps {
  ariaLabel?: string;
  isPressed?: boolean;
  pulse?: "clockwise" | "counterclockwise" | null;
}
export interface JoystickState { angle: number; distance: number }
export interface JoystickKeyProps { className?: string; joystick: JoystickState }

let inputMonitoringPermissionKeys: readonly string[] = [];
let permissionPollingIntervalMs = 0;
let jsx: JsxRuntime;

function initializePermissionConstants(): void {
  inputMonitoringPermissionKeys = ["codex-micro-input-monitoring-permission"];
  permissionPollingIntervalMs = 1_000;
}

function initializeKeycapIcons(): void {
  initializeClassNames();
  jsx = getJsxRuntime();
}

function KeycapShell({ children, className }: KeycapShellProps): unknown {
  const runtime = ensureJsx();
  return runtime.jsx("div", {
    className: classNames(
      "relative z-10 flex items-center justify-center rounded-xl border border-white/[0.94] bg-[#f7f5f1] text-[#171717] shadow-sm dark:border-white/[0.14] dark:bg-[#202127] dark:text-default",
      className,
    ),
    children,
  });
}

function KeycapLegend({ keycap, className = "icon-sm" }: KeycapLegendProps): unknown {
  const runtime = ensureJsx();
  if (keycap.id === "YOLO" || keycap.id === "YEET") {
    const text = keycap.id === "YOLO" ? ":yolo:" : ":yeet:";
    return runtime.jsx("span", {
      className: "font-mono text-[0.68rem] font-medium tracking-[0]",
      children: runtime.jsx(FormattedMessage, {
        id: `settings.codexMicro.keycaps.${keycap.id.toLowerCase()}Legend`,
        defaultMessage: text,
        description: `Literal keycap legend rendered on the ${keycap.id} Codex Micro keycap`,
      }),
    });
  }
  if (keycap.icon === "empty") {
    return runtime.jsx("span", { className: "size-3 rounded-sm border border-default" });
  }
  return runtime.jsx("span", {
    "aria-hidden": true,
    className,
    "data-codex-micro-icon": keycap.icon,
  });
}

const statusMessages = defineMessages({
  working: { id: "settings.codexMicro.agentKeyPreview.status.working", defaultMessage: "Working" },
  unread: { id: "settings.codexMicro.agentKeyPreview.status.unread", defaultMessage: "Unread" },
  idle: { id: "settings.codexMicro.agentKeyPreview.status.idle", defaultMessage: "Idle" },
  "awaiting-approval": { id: "settings.codexMicro.agentKeyPreview.status.awaitingApproval", defaultMessage: "Awaiting approval" },
  "awaiting-response": { id: "settings.codexMicro.agentKeyPreview.status.awaitingResponse", defaultMessage: "Awaiting response" },
  error: { id: "settings.codexMicro.agentKeyPreview.status.error", defaultMessage: "Error" },
  off: { id: "settings.codexMicro.agentKeyPreview.status.off", defaultMessage: "Off" },
});

function AgentKeyPreview({
  assignmentTitle,
  isPressed = false,
  keycap,
  onClick,
  position,
  showTooltip = true,
  slot,
}: AgentKeyPreviewProps): unknown {
  const runtime = ensureJsx();
  const intl = useIntl();
  const status = slot?.status ?? "off";
  const title = assignmentTitle ?? (slot?.threadKey == null
    ? intl.formatMessage({
      id: "settings.codexMicro.agentKeyPreview.unassigned",
      defaultMessage: "No chat or action assigned to agent key {position}",
    }, { position })
    : slot.title ?? intl.formatMessage({
      id: "settings.codexMicro.agentKeyPreview.untitled",
      defaultMessage: "Untitled chat",
    }));
  const color = `#${getCodexMicroStatusColor(status).toString(16).padStart(6, "0")}`;
  const content = runtime.jsx(keycap == null ? "div" : KeycapShell, {
    "aria-label": onClick == null ? title : undefined,
    className: classNames(
      "relative z-10 aspect-square w-full rounded-xl transition-transform",
      isPressed && "translate-y-px scale-[0.985]",
    ),
    role: onClick == null ? "img" : undefined,
    style: keycap == null && status !== "off" ? { backgroundColor: color } : undefined,
    children: keycap == null ? undefined : runtime.jsx(KeycapLegend, { keycap, className: "size-5" }),
  });
  const trigger = onClick == null ? content : runtime.jsx("button", {
    type: "button",
    "aria-label": intl.formatMessage({
      id: "settings.codexMicro.agentKeyPreview.assign",
      defaultMessage: "Assign a chat, shortcut, keycap, or skill to agent key {position}",
    }, { position }),
    className: "relative z-10 aspect-square w-full cursor-interaction rounded-xl outline-none focus-visible:ring-2",
    onClick,
    children: content,
  });
  if (!showTooltip) return trigger;
  return runtime.jsx(Tooltip, {
    delayOpen: true,
    tooltipContent: runtime.jsxs("div", {
      className: "flex max-w-64 flex-col gap-1.5 p-1",
      children: [
        runtime.jsx("span", { className: "font-medium", children: title }),
        runtime.jsx("span", { className: "text-xs opacity-65", children: intl.formatMessage(statusMessages[status]) }),
      ],
    }),
    children: trigger,
  });
}

function initializeAgentKeyPreview(): void {
  initializeKeycapIcons();
}

function KeyboardSurface({ children, className }: KeyboardSurfaceProps): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("div", {
    className: classNames(
      "relative grid aspect-square w-full max-w-[15rem] grid-cols-4 grid-rows-4 gap-1 rounded-xl border border-white/[0.82] bg-[#ebe8e2] p-2.5 dark:border-white/[0.1] dark:bg-[#18191e]",
      className,
    ),
    children: [
      runtime.jsx("div", { className: "pointer-events-none absolute top-[2.85rem] right-2.5 left-[3.1rem] h-[4.85rem] rounded-full bg-[#8db5ff]/28 blur-2xl" }),
      children,
    ],
  });
}

function EncoderKnob({ ariaLabel, isPressed = false, pulse = null }: EncoderKnobProps): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("div", {
    "aria-hidden": ariaLabel == null,
    "aria-label": ariaLabel,
    className: "relative z-10 m-auto size-[92%] rounded-full bg-[#f5f3ee] shadow-sm dark:bg-[#262831]",
    role: ariaLabel == null ? undefined : "img",
    children: [
      runtime.jsx("span", { "data-pulse": pulse, "data-pressed": isPressed }),
      runtime.jsx("div", { className: "absolute inset-0 overflow-hidden rounded-full" }),
    ],
  });
}

function JoystickKey({ className, joystick }: JoystickKeyProps): unknown {
  const runtime = ensureJsx();
  const radians = joystick.angle * Math.PI * 2;
  const distance = Math.min(joystick.distance, 1) * 7;
  const transform = `translate(${Math.cos(radians) * distance}px, ${Math.sin(radians) * distance}px)`;
  return runtime.jsx("div", {
    className: classNames("relative z-10 flex items-center justify-center rounded-xl bg-[#dad4ca] dark:bg-[#23252c]", className),
    children: runtime.jsx("div", {
      className: "size-[72%] rounded-full bg-[#111111] transition-transform duration-75 ease-out",
      style: { transform },
    }),
  });
}

function CodexMicroLogoKey(): unknown {
  const runtime = ensureJsx();
  return runtime.jsxs("div", {
    className: "relative z-10 flex items-center justify-center gap-1",
    children: [
      runtime.jsxs("div", { className: "flex flex-col gap-0.5", children: [
        runtime.jsx("span", { className: "size-1 rounded-full bg-[#9ebdff]" }),
        runtime.jsx("span", { className: "size-1 rounded-full bg-[#b8b98b]" }),
        runtime.jsx("span", { className: "size-1 rounded-full bg-[#b8b98b]" }),
      ] }),
      runtime.jsx("div", { className: "size-[58%] rounded-full bg-[#2d2925] dark:bg-[#202127]" }),
    ],
  });
}

function initializeKeyboardSurface(): void {
  initializeClassNames();
  jsx = getJsxRuntime();
}

function ensureJsx(): JsxRuntime {
  if (jsx == null) jsx = getJsxRuntime();
  return jsx;
}

export {
  initializeKeyboardSurface as a,
  KeycapShell as c,
  inputMonitoringPermissionKeys as d,
  permissionPollingIntervalMs as f,
  KeyboardSurface as i,
  KeycapLegend as l,
  EncoderKnob as n,
  AgentKeyPreview as o,
  initializePermissionConstants as p,
  CodexMicroLogoKey as r,
  initializeAgentKeyPreview as s,
  JoystickKey as t,
  initializeKeycapIcons as u,
};
