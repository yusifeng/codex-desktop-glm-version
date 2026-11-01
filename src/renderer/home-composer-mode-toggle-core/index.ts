import "@rchunk/rolldown-runtime";
import * as sharedChunk from "@rchunk/app-shared";
import * as initialChunk from "@rchunk/app-initial";
import * as primaryChunk from "@rchunk/app-primary";

export type HomeComposerMode = "chat" | "work";

export interface HomeComposerModeToggleProps {
  autoFocusSelected?: boolean;
  className?: string;
  disabled?: boolean;
  emphasizeWorkUpgrade?: boolean;
  onSelectedAutoFocus?(): void;
  onTransitionComplete?(): void;
  onValueChange(value: HomeComposerMode): void;
  value: HomeComposerMode;
  workRequiresUpgrade?: boolean;
}

const shared = sharedChunk as unknown as Record<string, unknown>;
const initial = initialChunk as unknown as Record<string, unknown>;
const primary = primaryChunk as unknown as Record<string, unknown>;
let jsx: {
  jsx(component: unknown, props: unknown): unknown;
  jsxs(component: unknown, props: unknown): unknown;
};
let React: () => {
  useState<T>(factory: T | (() => T)): [T, (value: T) => void];
};
let classNames: (...values: unknown[]) => string;
let useIntl: () => {
  formatMessage(message: Record<string, string>): string;
};
let FormattedMessage: unknown;
let Tooltip: unknown;
let LockIcon: unknown;
let motion: { span: unknown };
let UpgradePopover: unknown;
let useReducedMotion: () => boolean;
let noteComposerInteraction: () => void;

const indicatorPosition: Record<HomeComposerMode, string> = {
  chat: "calc((0% - 0px) * var(--mode-toggle-direction))",
  work: "calc((100% - 17px) * var(--mode-toggle-direction))",
};
const buttonClassName = "cursor-interaction relative z-10 inline-flex h-full min-w-0 items-center justify-center whitespace-nowrap rounded-full px-10 text-sm font-medium @max-xs/home-mode-toggle:px-2.5 disabled:cursor-not-allowed disabled:opacity-40";

function HomeComposerModeToggle({
  autoFocusSelected = false,
  className,
  disabled = false,
  emphasizeWorkUpgrade = false,
  onSelectedAutoFocus,
  onTransitionComplete,
  onValueChange,
  value,
  workRequiresUpgrade = false,
}: HomeComposerModeToggleProps): unknown {
  initializeHomeComposerModeToggle();
  const intl = useIntl();
  const reducedMotion = useReducedMotion();
  const selectedPosition = indicatorPosition[value];
  const [initialPosition] = React().useState(() =>
    !autoFocusSelected || reducedMotion
      ? { x: selectedPosition }
      : { x: indicatorPosition[value === "chat" ? "work" : "chat"] },
  );
  const ariaLabel = intl.formatMessage({
    id: "composer.home.modeToggle.ariaLabel",
    defaultMessage: "Composer mode",
    description: "Accessible label for the toggle that switches the Home composer between Work and Chat modes",
  });
  const chatSelected = value === "chat";
  const workSelected = value === "work";
  const chatButton = jsx.jsx("button", {
    autoFocus: autoFocusSelected && chatSelected,
    className: classNames(
      buttonClassName,
      "col-start-1 row-start-1 ps-11 pe-9",
      chatSelected
        ? "text-mode-toggle-primary"
        : "text-mode-toggle-inactive hover:text-mode-toggle-primary focus-visible:text-mode-toggle-primary",
    ),
    type: "button",
    "aria-pressed": chatSelected,
    disabled,
    onFocus: autoFocusSelected && chatSelected ? onSelectedAutoFocus : undefined,
    onClick: () => { if (!chatSelected) onValueChange("chat"); },
    children: jsx.jsx(FormattedMessage, {
      id: "composer.home.modeToggle.chat",
      defaultMessage: "Chat",
      description: "Label for Chat mode in the Home composer mode toggle",
    }),
  });
  const chat = jsx.jsx(Tooltip, {
    disabled,
    tooltipContent: jsx.jsx(FormattedMessage, {
      id: "composer.home.modeToggle.chat.tooltip",
      defaultMessage: "Ask questions and explore ideas",
      description: "Concise tooltip for the Chat option in the Home composer mode toggle. It explains that Chat is for asking questions and exploring ideas.",
    }),
    children: chatButton,
  });
  const workTrigger = ({
    ariaDescribedBy,
    isOpen,
    onActivate,
    triggerRef,
  }: {
    ariaDescribedBy?: string;
    isOpen?: boolean;
    onActivate(): void;
    triggerRef?: unknown;
  }) => jsx.jsx(Tooltip, {
    disabled,
    triggerPopupOpen: isOpen,
    tooltipContent: jsx.jsx(FormattedMessage, {
      id: "composer.home.modeToggle.work.tooltip",
      defaultMessage: "Get tasks done with your files and apps",
      description: "Concise tooltip for the Work option in the Home composer mode toggle. It explains that Work can complete tasks using the user's files and apps.",
    }),
    children: jsx.jsx("button", {
      ref: triggerRef,
      autoFocus: autoFocusSelected && workSelected,
      className: classNames(
        buttonClassName,
        "col-start-2 row-start-1 ps-9 pe-11",
        workSelected
          ? "text-mode-toggle-primary"
          : "text-mode-toggle-inactive hover:text-mode-toggle-primary focus-visible:text-mode-toggle-primary",
      ),
      type: "button",
      "aria-describedby": ariaDescribedBy,
      "aria-pressed": workSelected,
      disabled,
      onFocus: autoFocusSelected && workSelected ? onSelectedAutoFocus : undefined,
      onClick: () => {
        onActivate();
        if (!workSelected) onValueChange("work");
      },
      children: jsx.jsxs("span", {
        className: classNames(
          "inline-flex items-center gap-1",
          workRequiresUpgrade && !workSelected && (
            emphasizeWorkUpgrade
              ? "text-mode-toggle-accent"
              : "text-mode-toggle-primary opacity-35"
          ),
        ),
        children: [
          workRequiresUpgrade ? jsx.jsx(LockIcon, {}) : null,
          jsx.jsx(FormattedMessage, {
            id: "composer.home.modeToggle.work",
            defaultMessage: "Work",
            description: "Label for Work mode in the Home composer mode toggle",
          }),
          workRequiresUpgrade ? jsx.jsx("span", {
            className: "sr-only",
            children: jsx.jsx(FormattedMessage, {
              id: "composer.home.modeToggle.work.requiresUpgradeSuffix",
              defaultMessage: "Requires upgrade",
              description: "Screen-reader-only text appended to the locked Work option in the Home composer mode toggle shown to Free- or Go-plan users. It explains that selecting Work opens an upgrade experience. Keep this suffix concise.",
            }),
          }) : null,
        ],
      }),
    }),
  });
  const work = jsx.jsx(UpgradePopover, {
    enabled: workRequiresUpgrade && chatSelected && !disabled,
    target: "tpp-surface-mode-toggle",
    children: workTrigger,
  });

  return jsx.jsxs("div", {
    className: classNames(
      "relative isolate inline-grid h-9 max-w-full min-w-0 grid-cols-2 gap-0 rounded-full select-none",
      className,
    ),
    role: "group",
    "aria-label": ariaLabel,
    onClickCapture: (event: { currentTarget: { contains(value: Node): boolean }; target: EventTarget | null }) => {
      if (event.target instanceof Node && event.currentTarget.contains(event.target)) {
        noteComposerInteraction();
      }
    },
    children: [
      jsx.jsx("span", {
        className: "pointer-events-none absolute inset-x-px top-1/2 z-0 h-8.5 -translate-y-1/2 rounded-full bg-background-mode-toggle-track",
        "aria-hidden": true,
      }),
      jsx.jsx(motion.span, {
        animate: { x: selectedPosition },
        className: "pointer-events-none relative z-10 col-start-1 row-start-1 rounded-full _indicator_1dczx_4",
        initial: initialPosition,
        transition: reducedMotion ? { duration: 0 } : { duration: 0.3, ease: shared.$f },
        "aria-hidden": true,
        onAnimationComplete: onTransitionComplete,
      }),
      chat,
      work,
    ],
  });
}

function initializeHomeComposerModeToggle(): void {
  if (jsx != null) return;
  const call = (candidate: unknown) => { if (typeof candidate === "function") candidate(); };
  for (const candidate of [
    shared.h4,
    shared.a$,
    shared.K2,
    primary.Qs,
    shared.lw,
    shared.c_,
    shared.p_,
    initial.xlt,
    shared.tp,
  ]) call(candidate);
  jsx = (shared.I3 as () => typeof jsx)();
  React = shared.e6 as typeof React;
  classNames = shared.m4 as typeof classNames;
  useIntl = shared.n4 as typeof useIntl;
  FormattedMessage = shared.Y2;
  Tooltip = shared.o_;
  LockIcon = shared.eC;
  motion = shared.o$ as typeof motion;
  UpgradePopover = primary.Zs;
  useReducedMotion = initial.Slt as typeof useReducedMotion;
  noteComposerInteraction = shared.f_ as typeof noteComposerInteraction;
}

export { initializeHomeComposerModeToggle as n, HomeComposerModeToggle as t };
