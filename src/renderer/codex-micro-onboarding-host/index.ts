// codex-micro-onboarding-host —— Codex Micro 首次检测后的三步引导流程。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as keyboardSurfaceChunk from "@rchunk/codex-micro-keyboard-surface";
import * as layoutChunk from "@rchunk/codex-micro-layout";
import * as onboardingAnimationChunk from "@rchunk/codex-micro-onboarding-animation";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const {
  $O: queryTiming,
  C_: initializeIconAssets,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: jsxRuntime,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: applicationScope,
  e6: reactRuntime,
  g_: initializeSharedIcons,
  _L: useQuery,
} = appSharedChunk;
const {
  $C: deviceStatusSignal,
  E6t: getPlatformInfo,
  Oft: openExternalLink,
  Qgn: initializeAccountQueries,
  Slt: useReducedMotion,
  T6t: initializePlatformInfo,
  aw: initializeCodexMicroBridge,
  c$t: appInfoSignal,
  ew: codexMicroModelSignal,
  fw: hasEverDetectedCodexMicroSignal,
  l$t: initializeAppInfo,
  l2: OnboardingPanel,
  mnt: initializeSystemPermissions,
  mw: initializeCodexMicroState,
  nw: codexMicroAnnouncementEnabledSignal,
  o_n: useNavigate,
  pnt: desktopBridge,
  tw: codexMicroJoystickSignal,
  xlt: initializeReducedMotion,
} = appInitialChunk;
const {
  Sc: initializeCodexMicroEligibility,
  Tc: isCodexMicroOnboardingEligible,
  xc: codexMicroOnboardingStateSignal,
} = appPrimaryChunk;
const {
  d: inputMonitoringPermissionQueryKey,
  f: inputMonitoringRefetchInterval,
  i: CodexMicroKeyboard,
  l: CodexMicroActionKey,
  o: CodexMicroAgentKey,
  p: initializeCodexMicroKeyboard,
  t: CodexMicroJoystick,
} = keyboardSurfaceChunk;
const { r: getCodexMicroKeycap } = layoutChunk;
const {
  a: startOnboardingAnimation,
  c: recordOnboardingLifecycleStep,
  i: initializeOnboardingAnimation,
  o: initializeCodexMicroAnalytics,
  r: buildOnboardingAnimationFrame,
  t: onboardingAnimationFrameSignal,
} = onboardingAnimationChunk;

type OnboardingStep = "welcome" | "agent-keys" | "command-keys";
type InputMonitoringPermissionStatus = "denied" | "granted" | "unavailable";
type InputMonitoringAnalyticsState =
  | InputMonitoringPermissionStatus
  | "not-applicable";
type OnboardingLifecycleStep =
  | "flow-completed"
  | "flow-dismissed"
  | "input-monitoring-permission-granted"
  | "input-monitoring-settings-opened"
  | "screen-continued"
  | "screen-shown"
  | "settings-opened";

interface CodexMicroBridge {
  getInputMonitoringPermissionStatus(): Promise<InputMonitoringPermissionStatus>;
  openInputMonitoringSettings(): Promise<void> | void;
  ownsPrimaryWindow(): Promise<boolean>;
}

interface CodexMicroTourProps {
  appIconMedium: string | null;
  appName: string;
  inputMonitoringPermissionStatus: InputMonitoringPermissionStatus;
  model: string;
  onComplete(): void;
  onCompleteAndOpenSettings(): void;
  onLifecycleStep(
    step: OnboardingLifecycleStep,
    screen: OnboardingStep,
  ): void;
  onOpenInputMonitoringSettings(): void;
}

interface OnboardingLifecycleProps
  extends Omit<CodexMicroTourProps, "onLifecycleStep"> {
  codexMicro: CodexMicroBridge;
  inputMonitoringAnalyticsState: InputMonitoringAnalyticsState;
}

const INPUT_SETUP_URL = "https://worklouder.cc/micro-setup";
const STATIC_FRAME = buildOnboardingAnimationFrame?.(0) ?? {
  agentSlots: [],
  actionKeycapIds: [],
};

let React: import("@rchunk/app-shared").ReactRuntime;
let jsx: import("@rchunk/app-shared").JsxRuntime;
let initialized = false;

const LEGEND = [
  ["idle", "White – Idle"],
  ["working", "Blue – Thinking"],
  ["unread", "Green – Complete"],
  ["awaiting-approval", "Amber – Requires input"],
  ["error", "Red – Error"],
  ["off", "Off – No Assigned Agent"],
] as const;

function message(
  id: string,
  defaultMessage: string,
  description: string,
  values?: Record<string, unknown>,
): unknown {
  return jsx.jsx(FormattedMessage, { id, defaultMessage, description, values });
}

function openWorkLouderInput(event: unknown): void {
  openExternalLink?.({
    event,
    href: INPUT_SETUP_URL,
    initiator: "open_in_browser_bridge",
    openTarget: "external-browser",
  });
}

function PermissionHelp({
  appIconMedium,
  appName,
  permissionSettingsName,
}: {
  appIconMedium: string | null;
  appName: string;
  permissionSettingsName: string;
}): unknown {
  const PermissionButton = Button ?? "button";
  return jsx.jsxs("div", {
    className:
      "flex items-center gap-3 rounded-lg border border-default bg-primary-soft-alpha p-2.5 text-start",
    children: [
      jsx.jsx("div", {
        className: "flex size-14 shrink-0 items-center justify-center",
        children:
          appIconMedium == null
            ? null
            : jsx.jsx("img", {
                alt: "",
                "aria-hidden": true,
                className: "size-12 object-contain",
                src: appIconMedium,
              }),
      }),
      jsx.jsxs("div", {
        className: "flex min-w-0 flex-1 flex-col items-start gap-2",
        children: [
          message(
            "permissions.revealApp",
            "If {appName} doesn't appear in {permissionSettingsName}, reveal it in Finder, then drag the app into the open System Settings panel",
            "Instructions for dragging the app from Finder into a macOS permission settings page when it is missing",
            { appName, permissionSettingsName },
          ),
          jsx.jsx(PermissionButton, {
            color: "secondary",
            onClick: () =>
              desktopBridge?.systemPermissions
                ?.showPermissionSettingsAppInFinder?.()
                .catch(() => {}),
            children: message(
              "permissions.showAppInFinder",
              "Show {appName} in Finder",
              "Button that reveals the current app bundle in Finder",
              { appName },
            ),
          }),
        ],
      }),
    ],
  });
}

function AnimatedKeyboard(): unknown {
  const shouldReduceMotion = useReducedMotion?.() === true;
  const joystick = useSignalValue?.(codexMicroJoystickSignal);
  const frame =
    useSignalValue?.(onboardingAnimationFrameSignal) ?? STATIC_FRAME;
  const Keyboard = CodexMicroKeyboard ?? "div";
  const AgentKey = CodexMicroAgentKey ?? "div";
  const ActionKey = CodexMicroActionKey ?? "div";
  const KeyboardJoystick = CodexMicroJoystick ?? "div";
  return jsx.jsxs(Keyboard, {
    className:
      "max-w-[14rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.72),0_14px_32px_rgba(25,28,38,0.18)]",
    children: [
      ...(frame.agentSlots ?? []).map((slot, index: number) =>
        jsx.jsx(
          AgentKey,
          {
            "aria-label": `Agent key ${index + 1} changing status color`,
            isPressed: false,
            position: index + 1,
            showTooltip: false,
            slot: { ...slot, selected: true },
          },
          slot.id,
        ),
      ),
      jsx.jsx(KeyboardJoystick, { joystick }),
      ...(frame.actionKeycapIds ?? []).map((keycapId: string, index: number) =>
        jsx.jsx(
          ActionKey,
          {
            "aria-label": "Animated keyboard action key",
            keycap: getCodexMicroKeycap?.(keycapId) ?? keycapId,
            shouldReduceMotion,
          },
          index,
        ),
      ),
    ],
  });
}

function StepBody({
  appIconMedium,
  appName,
  inputMonitoringPermissionStatus,
  model,
  onOpenInputMonitoringSettings,
  step,
}: {
  appIconMedium: string | null;
  appName: string;
  inputMonitoringPermissionStatus: InputMonitoringPermissionStatus;
  model: string;
  onOpenInputMonitoringSettings(): void;
  step: OnboardingStep;
}): unknown {
  const creator = model === "creator-micro-v2";
  const PermissionButton = Button ?? "button";
  if (step === "welcome") {
    const permission =
      inputMonitoringPermissionStatus === "denied"
        ? jsx.jsxs("div", {
            className: "flex flex-col gap-3",
            children: [
              jsx.jsxs("div", {
                className: "flex flex-col gap-1 text-start",
                children: [
                  message(
                    "codexMicro.onboarding.inputMonitoring.title",
                    "Enable key presses",
                    "Title for the Input Monitoring permission step in Codex Micro onboarding",
                  ),
                  message(
                    creator
                      ? "creatorMicro.onboarding.inputMonitoring.description"
                      : "codexMicro.onboarding.inputMonitoring.description",
                    `${creator ? "Creator" : "Codex"} Micro needs Input Monitoring permission to respond when you press a key on your keyboard`,
                    "Description of why the device needs Input Monitoring permission",
                  ),
                ],
              }),
              jsx.jsx(PermissionHelp, {
                appIconMedium,
                appName,
                permissionSettingsName: "Input Monitoring",
              }),
              jsx.jsx(PermissionButton, {
                className: "justify-center self-center",
                color: "secondary",
                onClick: onOpenInputMonitoringSettings,
                size: "large",
                children: message(
                  "codexMicro.onboarding.openSettings",
                  "Open System Settings",
                  "Button that opens macOS Input Monitoring settings from Codex Micro onboarding",
                ),
              }),
            ],
          })
        : inputMonitoringPermissionStatus === "granted"
          ? jsx.jsx("div", {
              className:
                "flex items-center justify-center gap-2 text-sm text-chart-green",
              children: message(
                "codexMicro.onboarding.inputMonitoring.granted",
                "Input Monitoring is ready",
                "Confirmation that Codex Micro has Input Monitoring permission",
              ),
            })
          : null;
    return jsx.jsxs("div", {
      className: "flex w-full flex-col gap-4",
      children: [
        message(
          creator
            ? "creatorMicro.onboarding.body"
            : "codexMicro.onboarding.body",
          creator
            ? "Congrats on getting your hands on the original Creator Micro 2, the base platform on which the Codex Micro was built! Get ready to dial up the fun, efficiency, and tactility of your whole Codex experience!"
            : "Congrats on getting your hands on a Codex Micro, a unique collaboration product between Codex & Work Louder.",
          "Welcome message shown when the device is detected for the first time",
        ),
        permission,
      ],
    });
  }
  if (step === "agent-keys") {
    return jsx.jsxs("div", {
      className: "flex w-full flex-col gap-4 text-start",
      children: [
        message(
          creator
            ? "creatorMicro.onboarding.agentKeys.body"
            : "codexMicro.onboarding.agentKeys.body",
          creator
            ? "The frosted Agent Keys give you a live status of your Codex agents."
            : "The 6 frosted Agent Keys give you a live status of your Codex threads and agents.",
          "Explanation of the device agent key behavior",
        ),
        jsx.jsxs("div", {
          className:
            "rounded-xl border border-default bg-primary-soft-alpha px-4 py-3",
          children: [
            jsx.jsx("p", { children: "Legend" }),
            jsx.jsx("div", {
              className: "grid grid-cols-2 gap-x-5 gap-y-2",
              children: LEGEND.map(([status, label]) =>
                jsx.jsxs(
                  "div",
                  {
                    className: "flex min-w-0 items-center gap-2 text-xs",
                    children: [
                      jsx.jsx("span", {
                        "aria-hidden": true,
                        className: "size-2.5 shrink-0 rounded-full border",
                        "data-status": status,
                      }),
                      jsx.jsx("span", { children: label }),
                    ],
                  },
                  status,
                ),
              ),
            }),
          ],
        }),
      ],
    });
  }
  return jsx.jsxs("div", {
    className: "flex w-full flex-col gap-4 text-start",
    children: [
      message(
        creator
          ? "creatorMicro.onboarding.commandKeys.body"
          : "codexMicro.onboarding.commandKeys.body",
        "The Command Keys put your most-used Codex actions right at your fingertips. You can customize the keys, dial, and joystick from settings.",
        "Explanation of command key customization",
      ),
      jsx.jsx("a", {
        href: INPUT_SETUP_URL,
        onClick: openWorkLouderInput,
        rel: "noreferrer",
        target: "_blank",
        children: "Work Louder Input",
      }),
    ],
  });
}

function CodexMicroTour({
  appIconMedium,
  appName,
  inputMonitoringPermissionStatus,
  model,
  onComplete,
  onCompleteAndOpenSettings,
  onLifecycleStep,
  onOpenInputMonitoringSettings,
}: CodexMicroTourProps): unknown {
  const [step, setStep] = React.useState("welcome") as [
    OnboardingStep,
    (step: OnboardingStep) => void,
  ];
  const Panel = OnboardingPanel ?? "div";
  const advance = () => {
    if (step === "welcome") {
      onLifecycleStep("screen-continued", step);
      setStep("agent-keys");
      onLifecycleStep("screen-shown", "agent-keys");
    } else if (step === "agent-keys") {
      onLifecycleStep("screen-continued", step);
      setStep("command-keys");
      onLifecycleStep("screen-shown", "command-keys");
    } else {
      onLifecycleStep("flow-completed", step);
      onComplete();
    }
  };
  const dismiss = () => {
    onLifecycleStep("flow-dismissed", step);
    onComplete();
  };
  const openSettings = () => {
    onLifecycleStep("flow-completed", step);
    onLifecycleStep("settings-opened", step);
    onCompleteAndOpenSettings();
  };
  const openInputMonitoring = () => {
    onLifecycleStep("input-monitoring-settings-opened", step);
    onOpenInputMonitoringSettings();
  };
  return jsx.jsx(Panel, {
    body: jsx.jsx(StepBody, {
      appIconMedium,
      appName,
      inputMonitoringPermissionStatus,
      model,
      onOpenInputMonitoringSettings: openInputMonitoring,
      step,
    }),
    dismissLabel:
      step === "welcome"
        ? "Skip"
        : step === "command-keys"
          ? "Settings"
          : undefined,
    media: jsx.jsx(AnimatedKeyboard, {}),
    mediaClassName: "h-[266px] bg-surface-secondary dark:bg-primary-soft-alpha",
    onDismiss: dismiss,
    onSecondaryAction: step === "command-keys" ? openSettings : undefined,
    onPrimaryAction: advance,
    primaryActionLabel:
      step === "welcome"
        ? "Take 2-step tour"
        : step === "agent-keys"
          ? "Last step"
          : "Let’s build!",
    title:
      step === "welcome"
        ? model === "creator-micro-v2"
          ? "Welcome to Creator Micro"
          : "Welcome to Codex Micro"
        : step === "agent-keys"
          ? "The Agent Keys"
          : "The Command Keys",
  });
}

function OnboardingLifecycle(props: OnboardingLifecycleProps): unknown {
  const scope = useSignalScope?.(applicationScope);
  const [flowId] = React.useState<string>(crypto.randomUUID());
  const initialPermission = React.useRef(props.inputMonitoringAnalyticsState);
  const shown = React.useRef(new Set<string>());
  const queue = React.useRef(Promise.resolve());
  const record = (
    step: OnboardingLifecycleStep,
    screen: OnboardingStep,
    permission = props.inputMonitoringAnalyticsState,
  ) => {
    queue.current = queue.current
      .then(async () => {
        if (!(await props.codexMicro.ownsPrimaryWindow())) return;
        if (!shown.current.has(screen) && step !== "screen-shown") {
          shown.current.add(screen);
          recordOnboardingLifecycleStep?.(scope, {
            flowId,
            inputMonitoringPermissionState: permission,
            screen,
            step: "screen-shown",
          });
        }
        if (step === "screen-shown") shown.current.add(screen);
        recordOnboardingLifecycleStep?.(scope, {
          flowId,
          inputMonitoringPermissionState: permission,
          screen,
          step,
        });
      })
      .catch(() => {});
  };
  React.useEffect(() => {
    record("screen-shown", "welcome", initialPermission.current);
  }, []);
  React.useEffect(() => {
    if (
      initialPermission.current !== "granted" &&
      props.inputMonitoringAnalyticsState === "granted"
    ) {
      record(
        "input-monitoring-permission-granted",
        "welcome",
        props.inputMonitoringAnalyticsState,
      );
    }
    initialPermission.current = props.inputMonitoringAnalyticsState;
  }, [props.inputMonitoringAnalyticsState]);
  return jsx.jsx(CodexMicroTour, {
    ...props,
    onLifecycleStep: record,
  });
}

function CodexMicroOnboardingHost({
  dismissAnnouncement,
}: {
  dismissAnnouncement(): void;
}): unknown {
  initializeCodexMicroOnboardingHost();
  const codexMicro = desktopBridge?.codexMicro as
    | CodexMicroBridge
    | undefined;
  if (codexMicro == null) return null;
  const scope = useSignalScope?.(applicationScope);
  const reducedMotion = useReducedMotion?.() === true;
  const navigate = useNavigate?.();
  const appInfo = useSignalValue?.(appInfoSignal)?.data;
  const deviceStatus = useSignalValue?.(deviceStatusSignal)?.status;
  const model = useSignalValue?.(codexMicroModelSignal) ?? "codex-micro";
  const hasEverBeenDetected =
    useSignalValue?.(hasEverDetectedCodexMicroSignal) === true;
  const onboardingState = useSignalValue?.(codexMicroOnboardingStateSignal);
  const announcementEnabled =
    useSignalValue?.(codexMicroAnnouncementEnabledSignal) === true;
  const platform = getPlatformInfo?.().platform;
  const eligible =
    (isCodexMicroOnboardingEligible?.({
      deviceStatus,
      hasEverBeenDetected,
      onboardingState,
    }) ??
      (hasEverBeenDetected && onboardingState !== "complete")) &&
    announcementEnabled;
  const permissionQuery = useQuery<InputMonitoringPermissionStatus>({
    enabled: eligible && platform === "macOS",
    queryFn: () => codexMicro.getInputMonitoringPermissionStatus(),
    queryKey: inputMonitoringPermissionQueryKey,
    refetchInterval: inputMonitoringRefetchInterval,
    refetchIntervalInBackground: true,
    refetchOnMount: "always",
    staleTime: queryTiming?.FIVE_SECONDS,
  });
  const ready =
    eligible && (platform !== "macOS" || !permissionQuery.isPending);
  React.useEffect(() => {
    if (ready) return startOnboardingAnimation?.(scope, reducedMotion);
  }, [ready, reducedMotion, scope]);
  if (!ready) return null;
  const complete = () => {
    scope.set(codexMicroOnboardingStateSignal, "complete");
    scope.set(hasEverDetectedCodexMicroSignal, true);
    dismissAnnouncement();
  };
  const completeAndOpenSettings = () => {
    complete();
    navigate?.("/settings/codex-micro");
  };
  const permission =
    platform === "macOS"
      ? (permissionQuery.data ?? "unavailable")
      : "unavailable";
  return jsx.jsx(OnboardingLifecycle, {
    appIconMedium: appInfo?.appIconMedium ?? null,
    appName: appInfo?.appName ?? "ChatGPT",
    codexMicro,
    inputMonitoringAnalyticsState:
      platform === "macOS" ? permission : "not-applicable",
    inputMonitoringPermissionStatus: permission,
    model,
    onComplete: complete,
    onCompleteAndOpenSettings: completeAndOpenSettings,
    onOpenInputMonitoringSettings: () =>
      codexMicro.openInputMonitoringSettings(),
  });
}

function initializeCodexMicroOnboardingHost(): void {
  if (initialized) return;
  initialized = true;
  initializeSignalRuntime?.();
  React = typeof reactRuntime === "function" ? reactRuntime() : reactRuntime;
  jsx = typeof jsxRuntime === "function" ? jsxRuntime() : jsxRuntime;
  initializeAccountQueries?.();
  initializeCodexMicroBridge?.();
  initializePlatformInfo?.();
  initializeReducedMotion?.();
  initializeAppInfo?.();
  initializeSystemPermissions?.();
  initializeSharedRuntime?.();
  initializeIconAssets?.();
  initializeSharedIcons?.();
  initializeCodexMicroAnalytics?.();
  initializeCodexMicroState?.();
  initializeCodexMicroKeyboard?.();
  initializeOnboardingAnimation?.();
  initializeCodexMicroEligibility?.();
}

initializeCodexMicroOnboardingHost();

export { CodexMicroOnboardingHost };
