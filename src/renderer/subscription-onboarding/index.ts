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
const content = contentChunk as Record<string, any>;

const {
  $3: initializeRuntimeLazy,
  I3: jsxRuntime,
  Ih: Dialog,
  K2: initializeSharedComponents,
  e6: reactRuntime,
  n4: useIntl,
} = appShared;
const { _L: useQuery } = appSharedChunk;
const {
  i: initializeSubscriptionQueries,
  n: subscriptionAccountQueryOptions,
} = queriesChunk;

interface LocationState {
  hash: string;
  pathname: string;
  search: string;
  state: unknown;
}

interface SubscriptionDiscount extends Record<string, unknown> {
  promo_campaign_id?: string;
}

interface SubscriptionAccount extends Record<string, unknown> {
  account_id: string;
  plan_type?: string;
  structure?: string;
}

interface SubscriptionAccountResult extends Record<string, unknown> {
  account?: SubscriptionAccount | null;
  can_access_with_session?: boolean;
  entitlement?: {
    discount?: SubscriptionDiscount | null;
    has_active_subscription?: boolean;
  } | null;
}

interface StudentAccount {
  accountUserId: string;
  discount?: SubscriptionDiscount | null;
  id: string;
  isPaidPlus: boolean;
}

interface OnboardingAction {
  action?: string;
  pageId: string;
  [key: string]: unknown;
}

interface HomeCandidate {
  content: unknown;
  id: "subscription-onboarding";
  isEligible: boolean;
  isLoading: boolean;
  trackVisibility: boolean;
}

type RenderCandidates = (candidates: HomeCandidate[]) => unknown;

interface SubscriptionOnboardingProps {
  canCreateImage?: boolean;
  canPresent: boolean;
  canStartConversation: boolean;
  homeCandidates?: (renderCandidates: RenderCandidates) => unknown;
  onAction?(event: OnboardingAction): void;
  onClosed?(): void;
  onCreateImage?(): void;
  onInteraction?(event: OnboardingAction): void;
  onOpenFileDialog?(): void;
  onPresented?(): void;
  onSelectIntelligence?(level: "pro" | "standard"): void;
  onStartConversation?(
    initialStage: string,
    onComplete: () => void,
  ): Promise<unknown> | unknown;
  onStartSite?(): void;
  onStartVoice?(): void;
  renderCandidates: RenderCandidates;
}

interface SubscriptionOnboardingFrameProps {
  children: unknown;
  closeButtonClassName?: string;
  descriptionId?: string;
  onCloseComplete?(): void;
  onOpenChange(open: boolean): void;
  open: boolean;
  titleId?: string;
}

interface ConversationalOnboardingProps {
  canStart: boolean;
  initialStage: string;
  onStart: NonNullable<SubscriptionOnboardingProps["onStartConversation"]>;
}

interface StudentOnboardingHostProps extends SubscriptionOnboardingProps {
  account: StudentAccount;
  automatic: boolean;
}

interface PlanOnboardingProps extends SubscriptionOnboardingProps {
  hasPaidSubscription: boolean;
  plan: "plus" | "pro";
}

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
  initializeRuntimeLazy?.();
  initializeSharedComponents?.();
  initializeSubscriptionQueries?.();
  content.t?.();
  React = typeof reactRuntime === "function" ? reactRuntime() : reactRuntime;
  jsx = typeof jsxRuntime === "function" ? jsxRuntime() : jsxRuntime;
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
}: SubscriptionOnboardingFrameProps): unknown {
  const DialogComponent = Dialog ?? "div";
  const intl = useIntl?.();
  return jsx.jsx(DialogComponent, {
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
  props: SubscriptionOnboardingProps,
  candidate: HomeCandidate,
): unknown {
  const append = (existing: HomeCandidate[]) =>
    props.renderCandidates([...existing, candidate]);
  return props.homeCandidates == null
    ? append([])
    : props.homeCandidates(append);
}
function renderEmpty(props: SubscriptionOnboardingProps): unknown {
  return props.homeCandidates == null
    ? props.renderCandidates([])
    : props.homeCandidates(props.renderCandidates);
}

function useLocation(): LocationState {
  return (
    appInitial.i_n?.() ?? {
      pathname: window.location?.pathname ?? "/",
      search: window.location?.search ?? "",
      hash: window.location?.hash ?? "",
      state: null,
    }
  );
}
function useNavigate(): (
  destination: string | Pick<LocationState, "hash" | "pathname" | "search">,
  options?: { replace?: boolean; state?: unknown },
) => void {
  return appInitial.o_n?.() ?? (() => {});
}
function experiment(id: string): {
  get<Value>(key: string, fallback: Value): Value;
} {
  const context = appInitial.lfn?.();
  return (
    appInitial.rfn?.(context, id) ?? {
      get: <Value>(_key: string, fallback: Value) => fallback,
    }
  );
}

function ConversationalOnboarding({
  canStart,
  initialStage,
  onStart,
}: ConversationalOnboardingProps): null {
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

function StudentOnboardingHost(props: StudentOnboardingHostProps): unknown {
  const [open, setOpen] = React.useState(true);
  const pendingAction = React.useRef(null as string | null);
  const location = useLocation();
  const navigate = useNavigate();
  const automatic = props.automatic || content.r(props.account);
  const showModern = experiment("2272277762").get<boolean>("enabled", false);
  const common = {
    Frame: SubscriptionOnboardingFrame,
    direction: "ltr",
    isScreenAtLeastSm: true,
    open,
    onOpenChange: setOpen,
    onAction: (event: OnboardingAction) => {
      pendingAction.current = event.pageId;
    },
    onInteraction: (event: OnboardingAction) => {
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

function PlanOnboarding(props: PlanOnboardingProps): unknown {
  const [open, setOpen] = React.useState(true);
  const pendingAction = React.useRef(null as string | null);
  const navigate = useNavigate();
  const plan = props.plan;
  const proEnabled =
    experiment("1895559448").get<"carousel_v1" | "off">(
      "onboarding_variant",
      "off",
    ) === "carousel_v1";
  const plusConfig = experiment("3081805378");
  const plusVariant = plusConfig.get<
    | "carousel_v1"
    | "conversational_personalized"
    | "conversational_static"
    | "off"
  >("carousel_onboarding_variant", "off");
  const conversational =
    plan === "plus" &&
    props.hasPaidSubscription &&
    (plusVariant === "conversational_static" ||
      plusVariant === "conversational_personalized") &&
    plusConfig.get<boolean>("enabled", false);
  const eligible = plan === "pro" ? proEnabled : plusVariant !== "off";
  const common = {
    Frame: SubscriptionOnboardingFrame,
    direction: "ltr",
    isScreenAtLeastSm: true,
    open,
    onOpenChange: setOpen,
    onAction: (event: OnboardingAction) => {
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
        initialStage: plusConfig.get<string>("web_initial_stage", "welcome"),
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

function SubscriptionOnboarding(props: SubscriptionOnboardingProps): unknown {
  initializeSubscriptionOnboarding();
  const auth = appInitial.N6t?.() ?? {};
  const accountId = auth.accountId ?? "";
  const queryOptions = {
    ...subscriptionAccountQueryOptions<SubscriptionAccountResult>(accountId),
    staleTime: 0,
    enabled: auth.accountId != null,
  };
  const query = useQuery<SubscriptionAccountResult>(queryOptions);
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
