// subscription-onboarding —— 根据账户、路由与实验状态承载订阅升级导览。
// 原版：app/webview/assets/subscription-onboarding-bdae6e918350.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as queriesChunk from "@rchunk/queries";
import * as contentChunk from "@rchunk/subscription-onboarding-content";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const queries = queriesChunk as Record<string, any>;
const content = contentChunk as Record<string, any>;

const MAC_ARM_URL =
  "https://persistent.oaistatic.com/codex-app-prod/ChatGPT.dmg";
const MAC_X64_URL =
  "https://persistent.oaistatic.com/codex-app-prod/ChatGPT-latest-x64.dmg";
const WINDOWS_URL =
  "https://get.microsoft.com/installer/download/9PLM9XGG6VKS?cid=website_cta_psi";

let React: any;
let jsx: any;
let initialized = false;
function initializeSubscriptionOnboarding(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.K2?.();
  queries.i?.();
  content.t?.();
  React = appShared.e6?.();
  jsx = appShared.I3?.();
  initialized = true;
}

function platformFromUserAgent(userAgent: string): "macos" | "windows" | null {
  if (userAgent.includes("Windows NT") || userAgent.includes("Windows_NT"))
    return "windows";
  if (userAgent.includes("Mac OS X") && !/iPad|iPhone|iPod/.test(userAgent))
    return "macos";
  return null;
}
function downloadForPlatform(
  platform: "macos" | "windows" | null,
  architecture?: string | null,
): { type: string; url?: string } {
  if (platform === "windows") return { type: "download_url", url: WINDOWS_URL };
  if (platform !== "macos") return { type: "unavailable" };
  switch (architecture?.toLowerCase()) {
    case "apple_silicon":
    case "arm":
    case "arm64":
    case "aarch64":
      return { type: "download_url", url: MAC_ARM_URL };
    case "x64":
    case "x86":
    case "x86_64":
    case "amd64":
      return { type: "download_url", url: MAC_X64_URL };
    default:
      return { type: "mac_download_options" };
  }
}
async function detectDownload(): Promise<{ type: string; url?: string }> {
  const nav = navigator as Navigator & {
    userAgentData?: {
      getHighEntropyValues(keys: string[]): Promise<{ architecture?: string }>;
    };
  };
  const platform = platformFromUserAgent(nav.userAgent);
  if (platform !== "macos" || nav.userAgentData?.getHighEntropyValues == null)
    return downloadForPlatform(platform);
  try {
    const values = await nav.userAgentData.getHighEntropyValues([
      "architecture",
    ]);
    return downloadForPlatform(platform, values.architecture);
  } catch {
    return downloadForPlatform(platform);
  }
}

function SubscriptionOnboardingFrame({
  children,
  closeButtonClassName,
  descriptionId,
  onCloseComplete,
  onOpenChange,
  open,
  titleId,
}: Record<string, any>): unknown {
  const Dialog = appShared.Ih ?? "div";
  const intl = appShared.n4?.();
  return jsx.jsx(Dialog, {
    open,
    onOpenChange,
    onCloseComplete,
    unstyledContent: true,
    showDialogClose: false,
    contentPosition: "anchored",
    contentClassName:
      "max-h-[calc(100dvh-16px)] w-[calc(100vw-16px)] max-w-[480px] overflow-hidden rounded-2xl shadow-elevation-03",
    contentProps: {
      "aria-labelledby": titleId,
      "aria-describedby": descriptionId,
    },
    children: jsx.jsxs(content.d, {
      className: "max-h-[calc(100dvh-16px)] overflow-y-auto",
      children: [
        jsx.jsx("button", {
          type: "button",
          className:
            closeButtonClassName ??
            "absolute end-1.5 top-1.5 z-10 flex size-8 items-center justify-center rounded-full",
          "aria-label":
            intl?.formatMessage?.({
              id: "codex.dialog.closeButton",
              defaultMessage: "Close dialog",
              description:
                "Accessible label for the button that closes a dialog",
            }) ?? "Close dialog",
          onClick: () => onOpenChange(false),
          children: "×",
        }),
        children,
      ],
    }),
  });
}

function addCandidate(
  props: Record<string, any>,
  candidate: Record<string, any>,
): unknown {
  const append = (existing: unknown[]) =>
    props.renderCandidates([...existing, candidate]);
  return props.homeCandidates == null
    ? append([])
    : props.homeCandidates(append);
}
function renderEmpty(props: Record<string, any>): unknown {
  return props.homeCandidates == null
    ? props.renderCandidates([])
    : props.homeCandidates(props.renderCandidates);
}

function useLocation(): Record<string, any> {
  return (
    appInitial.i_n?.() ?? {
      pathname: window.location?.pathname ?? "/",
      search: window.location?.search ?? "",
      hash: window.location?.hash ?? "",
      state: null,
    }
  );
}
function useNavigate(): (destination: any, options?: any) => void {
  return appInitial.o_n?.() ?? (() => {});
}
function experiment(id: string): any {
  const context = appInitial.lfn?.();
  return (
    appInitial.rfn?.(context, id) ?? {
      get: (_key: string, fallback: any) => fallback,
    }
  );
}

function ConversationalOnboarding({
  canStart,
  initialStage,
  onStart,
}: Record<string, any>): null {
  const started = React.useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  React.useEffect(() => {
    if (!canStart || started.current) return;
    started.current = true;
    Promise.resolve(
      onStart(initialStage, () =>
        navigate(
          { pathname: location.pathname, search: "", hash: "" },
          { replace: true, state: location.state },
        ),
      ),
    ).catch(() => {});
  }, [canStart]);
  return null;
}

function StudentOnboardingHost(props: Record<string, any>): unknown {
  const [open, setOpen] = React.useState(true);
  const pendingAction = React.useRef(null as string | null);
  const location = useLocation();
  const navigate = useNavigate();
  const automatic = props.automatic || content.r(props.account);
  const showModern = experiment("2272277762").get("enabled", false);
  const common = {
    Frame: SubscriptionOnboardingFrame,
    direction: "ltr",
    isScreenAtLeastSm: true,
    open,
    onOpenChange: setOpen,
    onAction: (event: Record<string, any>) => {
      pendingAction.current = event.pageId;
    },
    onInteraction: (event: Record<string, any>) => {
      if (event.action === "step_viewed") {
        content.a(props.account);
        props.onPresented?.();
      }
      props.onInteraction?.(event);
    },
    onCloseComplete: () => {
      props.onClosed?.();
      navigate(
        { pathname: location.pathname, search: "", hash: "" },
        { replace: true, state: location.state },
      );
      const action = pendingAction.current;
      pendingAction.current = null;
      if (action === "plugins") navigate("/plugins");
      else if (action === "work")
        props.onStartConversation?.("welcome", () => {});
      else if (action === "sites") props.onStartSite?.();
      else if (action === "images") props.onCreateImage?.();
      else if (action === "voice") props.onStartVoice?.();
    },
  };
  if (!automatic) return null;
  return showModern
    ? jsx.jsx(content.l, {
        ...common,
        showPluginsAction: true,
        showWorkAction: props.canStartConversation,
        showSitesAction: props.onStartSite != null,
        showVoiceAction: props.onStartVoice != null,
      })
    : jsx.jsx(content.s, {
        ...common,
        showWorkAction: props.canStartConversation,
        showFilesAction: props.onOpenFileDialog != null,
        showImagesAction: props.canCreateImage,
        showVoiceAction: props.onStartVoice != null,
      });
}

function PlanOnboarding(props: Record<string, any>): unknown {
  const [open, setOpen] = React.useState(true);
  const pendingAction = React.useRef(null as string | null);
  const navigate = useNavigate();
  const plan = props.plan as "plus" | "pro";
  const proEnabled =
    experiment("1895559448").get("onboarding_variant", "off") === "carousel_v1";
  const plusConfig = experiment("3081805378");
  const plusVariant = plusConfig.get("carousel_onboarding_variant", "off");
  const conversational =
    plan === "plus" &&
    props.hasPaidSubscription &&
    (plusVariant === "conversational_static" ||
      plusVariant === "conversational_personalized") &&
    plusConfig.get("enabled", false);
  const eligible = plan === "pro" ? proEnabled : plusVariant !== "off";
  const common = {
    Frame: SubscriptionOnboardingFrame,
    direction: "ltr",
    isScreenAtLeastSm: true,
    open,
    onOpenChange: setOpen,
    onAction: (event: Record<string, any>) => {
      pendingAction.current = event.pageId;
      props.onAction?.(event);
    },
    onInteraction: props.onInteraction,
    onCloseComplete: () => {
      const action = pendingAction.current;
      pendingAction.current = null;
      if (action === "intelligence")
        props.onSelectIntelligence?.(plan === "pro" ? "pro" : "standard");
      else if (action === "images") props.onCreateImage?.();
      else if (action === "personalization") navigate("/plugins");
      else if (action === "voice") props.onStartVoice?.();
      props.onClosed?.();
    },
  };
  const contentNode = conversational
    ? jsx.jsx(ConversationalOnboarding, {
        canStart: props.canStartConversation,
        initialStage: plusConfig.get("web_initial_stage", "welcome"),
        onStart: props.onStartConversation,
      })
    : plan === "plus"
      ? jsx.jsx(content.v, common)
      : jsx.jsx(content.p, {
          ...common,
          featurePageIds:
            platformFromUserAgent(navigator.userAgent) == null
              ? content.g
              : content.h,
          canStartVoice: props.onStartVoice != null,
          canStartWork: props.canStartConversation,
        });
  return addCandidate(props, {
    id: "subscription-onboarding",
    isEligible: eligible,
    isLoading: false,
    content: eligible ? contentNode : null,
    trackVisibility: true,
  });
}

function SubscriptionOnboarding(props: Record<string, any>): unknown {
  initializeSubscriptionOnboarding();
  const auth = appInitial.N6t?.() ?? {};
  const accountId = auth.accountId ?? "";
  const queryOptions = {
    ...(queries.n?.(accountId) ?? {}),
    staleTime: 0,
    enabled: auth.accountId != null,
  };
  const query = appShared._L?.(queryOptions) ?? {};
  const result = query.data;
  const account = result?.account;
  const location = useLocation();
  const isStudentAccount = {
    id: account?.account_id ?? "",
    accountUserId: auth.userId ?? "",
    isPaidPlus:
      account?.structure === "personal" &&
      account?.plan_type === "plus" &&
      result?.entitlement?.has_active_subscription === true,
    discount: result?.entitlement?.discount,
  };
  const automaticStudent =
    (location.search === "" || location.search === "?refresh_account=true") &&
    content.n(isStudentAccount);
  const campaignStudent =
    (location.search === "?refresh_account=true&campaign=students_2026" ||
      location.search === "?campaign=students_2026") &&
    location.hash === "#plus_onboarding";
  const student =
    isStudentAccount.isPaidPlus && (automaticStudent || campaignStudent);
  const plan = location.hash === "#plus_onboarding" ? "plus" : "pro";
  const routeEligible =
    location.search === "" || location.search === "?refresh_account=true";
  const validPlan =
    plan === "plus"
      ? account?.plan_type === "plus"
      : account?.plan_type === "pro" || account?.plan_type === "prolite";
  const ready =
    !query.isPending &&
    !query.isError &&
    result?.can_access_with_session !== false &&
    auth.userId != null &&
    account?.account_id === auth.accountId &&
    account?.structure === "personal" &&
    props.canPresent &&
    !appInitial.Gzt?.();

  if (!ready || (!student && !(routeEligible && validPlan)))
    return renderEmpty(props);
  if (student)
    return addCandidate(props, {
      id: "subscription-onboarding",
      isEligible: true,
      isLoading: false,
      trackVisibility: true,
      content: jsx.jsx(StudentOnboardingHost, {
        ...props,
        account: isStudentAccount,
        automatic: automaticStudent,
      }),
    });
  return jsx.jsx(PlanOnboarding, {
    ...props,
    plan,
    hasPaidSubscription: result?.entitlement?.has_active_subscription === true,
  });
}

initializeSubscriptionOnboarding();
export { SubscriptionOnboarding };
