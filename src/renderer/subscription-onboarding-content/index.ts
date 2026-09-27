// subscription-onboarding-content —— 订阅升级后的 Plus、Pro 与学生产品导览。
// 原版：app/webview/assets/subscription-onboarding-dcd9d9af0fe0.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const {
  $3: initializeDialogPrimitives,
  I3: getJsxRuntime,
  K2: initializeReactRuntime,
  e6: getReactRuntime,
  h4: initializeClassNames,
  m4: classNames,
  n4: useIntl,
} = appSharedChunk;
const {
  CT: initializeSubscriptionOnboardingAnalytics,
  TT: initializeSubscriptionOnboardingAssets,
  wT: initializeSubscriptionOnboardingStorage,
} = appInitialChunk;

type IntlShape = import("@rchunk/app-shared").IntlShape;
type JsxRuntime = import("@rchunk/app-shared").JsxRuntime;
type ReactRuntime = import("@rchunk/app-shared").ReactRuntime;

type NavigationMethod = "initial" | "next" | "previous" | "picker";
interface CarouselPage {
  id: string;
  accessibleTitle: unknown;
  title: unknown;
  description: unknown;
  media: unknown;
  primaryActionLabel: unknown;
  secondaryAction?: { label: unknown };
  allowMediaOverflow?: boolean;
}
interface PageEvent {
  page: CarouselPage;
  pageIndex: number;
  navigationMethod: NavigationMethod;
}
interface CarouselProps {
  Frame: unknown;
  direction?: "ltr" | "rtl";
  initialPageId?: string;
  onCloseComplete?(): void;
  onDismiss?(event: PageEvent): void;
  onOpenChange(open: boolean): void;
  onPageShown?(event: PageEvent): void;
  onPrimaryAction?(event: PageEvent): void;
  onSecondaryAction?(event: PageEvent): void;
  open: boolean;
  pages: CarouselPage[];
}
interface TourProps extends Omit<CarouselProps, "pages"> {
  canStartVoice?: boolean;
  canStartWork?: boolean;
  featurePageIds?: string[];
  onAction(event: { action: "finish" | "try_feature"; pageId: string }): void;
  onInteraction?(event: {
    action: string;
    pageId: string;
    pageIndex: number;
    presentedPageIds: string[];
  }): void;
  showFilesAction?: boolean;
  showImagesAction?: boolean;
  showPluginsAction?: boolean;
  showSitesAction?: boolean;
  showVoiceAction?: boolean;
  showWorkAction?: boolean;
  trialDaysRemaining?: number;
  trialExtensionAvailable?: boolean;
  trialPluginsAvailable?: boolean;
  trialWorkAvailable?: boolean;
  welcomeVariant?: "no_payment_trial" | string;
}
interface StudentAccount {
  id?: string;
  accountUserId?: string;
  isPaidPlus?: boolean;
  discount?: {
    promo_campaign_id?: string;
    discount_expires_at?: string | null;
  } | null;
}

const PLUS_FEATURES = ["intelligence", "images", "personalization"];
const PRO_ALL_FEATURES = ["intelligence", "work", "codex", "voice"];
const PRO_DESKTOP_FEATURES = ["intelligence", "work", "codex"];
const PRO_MOBILE_FEATURES = ["intelligence", "work", "voice"];
const STUDENT_2026_PAGES = ["welcome", "plugins", "work", "sites", "voice"];
const STUDENT_CLASSIC_PAGES = ["welcome", "work", "files", "images", "voice"];
const PENDING_KEY = "oai/apps/students2026/pendingOnboarding.v1";
const SHOWN_PREFIX = "oai/apps/students2026/onboardingShown.v1";
const CAMPAIGN = "students-2026-four-month-free";
const MAX_PENDING_AGE_MS = 30 * 60 * 1_000;

interface KeyboardNavigationEvent {
  key: string;
  preventDefault?(): void;
}

interface CheckoutThemeFrameProps extends Record<string, unknown> {
  className?: string;
  isDarkMode?: boolean;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeSubscriptionOnboarding(): void {
  if (initialized) return;
  initializeDialogPrimitives();
  initializeReactRuntime();
  initializeClassNames();
  initializeSubscriptionOnboardingAnalytics();
  initializeSubscriptionOnboardingAssets();
  initializeSubscriptionOnboardingStorage();
  React = getReactRuntime();
  jsx = getJsxRuntime();
  initialized = true;
}

function msg(
  intl: IntlShape,
  id: string,
  defaultMessage: string,
  values?: import("@rchunk/app-shared").MessageValues,
): unknown {
  return intl.formatMessage(
    { id, defaultMessage, description: defaultMessage },
    values,
  );
}
function artwork(collection: string, pageId: string): unknown {
  return jsx.jsx("div", {
    "aria-hidden": "true",
    className:
      "bg-token-bg-primary pointer-events-none relative isolate size-full overflow-hidden",
    children: jsx.jsx("img", {
      alt: "",
      className: "size-full object-cover",
      decoding: "async",
      draggable: false,
      fetchPriority: pageId === "welcome" ? "high" : undefined,
      loading: pageId === "welcome" ? "eager" : undefined,
      src: `https://chatgpt.com/images/${collection}/background/${pageId}.webp`,
    }),
  });
}
function studentArtwork(variant: string, pageId: string): unknown {
  return jsx.jsx("div", {
    "aria-hidden": "true",
    className:
      "bg-token-bg-primary pointer-events-none relative size-full overflow-hidden",
    children: jsx.jsx("img", {
      alt: "",
      className: "size-full object-cover",
      fetchPriority: pageId === "welcome" ? "high" : undefined,
      loading: pageId === "welcome" ? "eager" : undefined,
      src: `https://cdn.openai.com/chatgpt/clients/onboarding/assets/${variant}-carousel-${pageId}-desktop.webp`,
    }),
  });
}

function CarouselModal(props: CarouselProps): unknown {
  const {
    Frame,
    direction = "ltr",
    initialPageId,
    onCloseComplete,
    onDismiss,
    onOpenChange,
    onPageShown,
    onPrimaryAction,
    onSecondaryAction,
    open,
    pages,
  } = props;
  const found = pages.findIndex((page) => page.id === initialPageId);
  const [index, setIndex] = React.useState(found < 0 ? 0 : found);
  const current = Math.max(0, Math.min(pages.length - 1, index));
  const page = pages[current];
  const event = (navigationMethod: NavigationMethod): PageEvent => ({
    page,
    pageIndex: current,
    navigationMethod,
  });
  React.useEffect?.(() => {
    if (open && page != null) onPageShown?.(event("initial"));
  }, [open, page?.id]);
  if (!open || page == null) return null;
  const navigate = (destination: number, method: NavigationMethod) => {
    const next = Math.max(0, Math.min(pages.length - 1, destination));
    setIndex(next);
    onPageShown?.({
      page: pages[next],
      pageIndex: next,
      navigationMethod: method,
    });
  };
  const dismiss = () => {
    onDismiss?.(event("initial"));
    onOpenChange(false);
  };
  const primary = () => {
    onPrimaryAction?.(event("next"));
    current === pages.length - 1
      ? onOpenChange(false)
      : navigate(current + 1, "next");
  };
  const secondary = () => {
    onSecondaryAction?.(event("initial"));
    onOpenChange(false);
  };
  return jsx.jsx(Frame, {
    "aria-describedby": `carousel-modal-description-${current}`,
    "aria-labelledby": "carousel-modal-title",
    onCloseComplete,
    onKeyDown: (keyboardEvent: KeyboardNavigationEvent) => {
      const delta =
        keyboardEvent.key === "ArrowRight"
          ? direction === "rtl"
            ? -1
            : 1
          : keyboardEvent.key === "ArrowLeft"
            ? direction === "rtl"
              ? 1
              : -1
            : 0;
      if (delta !== 0) {
        keyboardEvent.preventDefault?.();
        navigate(current + delta, delta > 0 ? "next" : "previous");
      }
    },
    open,
    onOpenChange: (value: boolean) => (value ? onOpenChange(true) : dismiss()),
    children: jsx.jsxs("div", {
      className: "flex size-full flex-col",
      children: [
        jsx.jsx("div", { className: "min-h-0 flex-1", children: page.media }),
        jsx.jsxs("section", {
          className: "flex flex-col gap-4 p-6",
          children: [
            jsx.jsx("h2", { id: "carousel-modal-title", children: page.title }),
            jsx.jsx("p", {
              id: `carousel-modal-description-${current}`,
              children: page.description,
            }),
            jsx.jsx("div", {
              role: "group",
              "aria-label": "Choose a carousel page",
              children: pages.map((candidate, candidateIndex) =>
                jsx.jsx(
                  "button",
                  {
                    type: "button",
                    "aria-current":
                      candidateIndex === current ? "page" : undefined,
                    "aria-label": `${candidateIndex + 1}: ${String(candidate.accessibleTitle)}`,
                    onClick: () => navigate(candidateIndex, "picker"),
                  },
                  candidate.id,
                ),
              ),
            }),
            jsx.jsxs("div", {
              className: "flex gap-2",
              children: [
                page.secondaryAction == null
                  ? null
                  : jsx.jsx("button", {
                      type: "button",
                      onClick: secondary,
                      children: page.secondaryAction.label,
                    }),
                jsx.jsx("button", {
                  type: "button",
                  onClick: primary,
                  children: page.primaryActionLabel,
                }),
                jsx.jsx("button", {
                  type: "button",
                  "aria-label": "Close",
                  onClick: dismiss,
                  children: "×",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
}

function wireTour(
  props: TourProps,
  pages: CarouselPage[],
  actionable: Set<string>,
): unknown {
  const presentedPageIds = pages.map((page) => page.id);
  const interact = (action: string, event: PageEvent) => {
    if (presentedPageIds[event.pageIndex] !== event.page.id) return;
    props.onInteraction?.({
      action,
      pageId: event.page.id,
      pageIndex: event.pageIndex,
      presentedPageIds,
    });
  };
  const act = (action: "finish" | "try_feature", event: PageEvent) => {
    if (actionable.has(event.page.id))
      props.onAction({ action, pageId: event.page.id });
  };
  return jsx.jsx(CarouselModal, {
    ...props,
    pages,
    onPageShown: (event: PageEvent) => interact("step_viewed", event),
    onDismiss: (event: PageEvent) => interact("close_tapped", event),
    onPrimaryAction: (event: PageEvent) => {
      if (event.pageIndex === pages.length - 1) {
        act("finish", event);
        interact("completed", event);
      } else interact("continue_tapped", event);
    },
    onSecondaryAction: (event: PageEvent) => {
      act("try_feature", event);
      interact("try_feature_tapped", event);
    },
  });
}

function featurePage(
  intl: IntlShape,
  plan: string,
  id: string,
  title: string,
  description: string,
  primaryActionLabel: unknown,
  secondaryLabel?: unknown,
): CarouselPage {
  return {
    id,
    accessibleTitle: msg(intl, `chatgpt.${plan}_onboarding.${id}.title`, title),
    title: msg(intl, `chatgpt.${plan}_onboarding.${id}.title`, title),
    description: msg(
      intl,
      `chatgpt.${plan}_onboarding.${id}.description`,
      description,
    ),
    media: artwork(`${plan}-onboarding`, id),
    primaryActionLabel,
    ...(secondaryLabel == null
      ? {}
      : { secondaryAction: { label: secondaryLabel } }),
  };
}

function plusPages(
  intl: IntlShape,
  ids: string[],
  props: TourProps,
): CarouselPage[] {
  const trial = props.welcomeVariant === "no_payment_trial";
  const next = msg(intl, "chatgpt.plus_onboarding.next", "Next");
  const tryIt = msg(intl, "chatgpt.plus_onboarding.try", "Try it");
  const pages: Record<string, CarouselPage> = {
    welcome: {
      id: "welcome",
      accessibleTitle: msg(
        intl,
        "chatgpt.plus_onboarding.welcome.accessible_title",
        trial ? "You’ve unlocked Plus" : "Welcome to ChatGPT Plus",
      ),
      title: msg(
        intl,
        "chatgpt.plus_onboarding.welcome.title",
        trial ? "You’ve unlocked Plus" : "Welcome to ChatGPT Plus",
      ),
      description: msg(
        intl,
        "chatgpt.plus_onboarding.welcome.description",
        trial
          ? "Explore advanced AI at no charge."
          : "Meet your premium AI assistant, with advanced intelligence and personalized tools for big projects and everyday tasks.",
      ),
      media: artwork("plus-onboarding", "welcome"),
      primaryActionLabel: msg(
        intl,
        "chatgpt.plus_onboarding.get_started",
        "Get started",
      ),
    },
    intelligence: featurePage(
      intl,
      "plus",
      "intelligence",
      "Add more power",
      "Choose a higher effort level for deeper reasoning on complex work, like building a plan, analyzing data, or writing code.",
      next,
      tryIt,
    ),
    images: featurePage(
      intl,
      "plus",
      "images",
      "Create images",
      "Generate and edit images for work and everyday creativity.",
      next,
      tryIt,
    ),
    personalization: featurePage(
      intl,
      "plus",
      "personalization",
      trial && props.trialWorkAvailable
        ? "Get more done with Work"
        : "Personalize your experience",
      "Connect apps and tailor ChatGPT to the way you work.",
      next,
      trial && !props.trialWorkAvailable && !props.trialPluginsAvailable
        ? undefined
        : tryIt,
    ),
    trial_extension: featurePage(
      intl,
      "plus",
      "trial_extension",
      (props.trialDaysRemaining ?? 0) > 0
        ? `${props.trialDaysRemaining ?? 0} days left in your Plus access`
        : "Keep exploring Plus",
      props.trialExtensionAvailable
        ? "You can extend your access now."
        : "Your Plus access ends when the trial expires.",
      msg(intl, "chatgpt.plus_onboarding.got_it", "Got it"),
      props.trialExtensionAvailable
        ? msg(intl, "chatgpt.plus_onboarding.extend_now", "Extend now")
        : undefined,
    ),
  };
  const features = ids.map((id, index) => ({
    ...pages[id],
    primaryActionLabel:
      !trial && index === ids.length - 1
        ? msg(intl, "chatgpt.plus_onboarding.finish", "Finish")
        : pages[id].primaryActionLabel,
  }));
  return [
    pages.welcome,
    ...features,
    ...(trial ? [pages.trial_extension] : []),
  ];
}

function PlusSubscriptionOnboarding(props: TourProps): unknown {
  const ids = props.featurePageIds ?? PLUS_FEATURES;
  return wireTour(
    props,
    plusPages(useIntl(), ids, props),
    new Set(PLUS_FEATURES),
  );
}

function proPages(
  intl: IntlShape,
  ids: string[],
  props: TourProps,
): CarouselPage[] {
  const next = msg(intl, "chatgpt.pro_onboarding.next", "Next");
  const tryIt = msg(intl, "chatgpt.pro_onboarding.try", "Try it");
  const pages: Record<string, CarouselPage> = {
    welcome: {
      id: "welcome",
      accessibleTitle: msg(
        intl,
        "chatgpt.pro_onboarding.welcome",
        "Welcome to ChatGPT Pro",
      ),
      title: msg(
        intl,
        "chatgpt.pro_onboarding.welcome",
        "Welcome to ChatGPT Pro",
      ),
      description: msg(
        intl,
        "chatgpt.pro_onboarding.welcome.description",
        "You’ve upgraded to our most powerful intelligence, with faster agents to tackle your most challenging tasks.",
      ),
      media: artwork("pro-onboarding", "welcome"),
      primaryActionLabel: msg(
        intl,
        "chatgpt.pro_onboarding.get_started",
        "Get started",
      ),
    },
    intelligence: featurePage(
      intl,
      "pro",
      "intelligence",
      "Solve your hardest problems",
      "Select Pro reasoning for frontier intelligence.",
      next,
      tryIt,
    ),
    work: featurePage(
      intl,
      "pro",
      "work",
      "Keep ambitious work moving",
      "Work on tasks in parallel with more speed across your favorite apps.",
      next,
      props.canStartWork === false ? undefined : tryIt,
    ),
    codex: featurePage(
      intl,
      "pro",
      "codex",
      "Build with Codex",
      "Complete weeks of coding work in days with built-in work trees and cloud environments.",
      next,
      msg(intl, "chatgpt.pro_onboarding.codex.download", "Download"),
    ),
    voice: featurePage(
      intl,
      "pro",
      "voice",
      "Chat hands-free",
      "Have natural voice conversations to brainstorm, practice a language, or work through a problem hands-free.",
      next,
      props.canStartVoice === false ? undefined : tryIt,
    ),
  };
  return [
    pages.welcome,
    ...ids.map((id, index) => ({
      ...pages[id],
      primaryActionLabel:
        index === ids.length - 1
          ? msg(intl, "chatgpt.pro_onboarding.finish", "Finish")
          : pages[id].primaryActionLabel,
    })),
  ];
}

function ProSubscriptionOnboarding(props: TourProps): unknown {
  const ids = props.featurePageIds ?? PRO_DESKTOP_FEATURES;
  return wireTour(
    props,
    proPages(useIntl(), ids, props),
    new Set(PRO_ALL_FEATURES),
  );
}

function CheckoutThemeFrame({
  isDarkMode,
  className,
  ...props
}: CheckoutThemeFrameProps): unknown {
  const theme = isDarkMode ? "dark" : "light";
  return jsx.jsx("div", {
    ...props,
    "data-checkout-theme": theme,
    "data-theme": theme,
    className: classNames(
      "relative w-full overflow-hidden bg-[var(--checkout-bg-primary)]",
      className,
    ),
  });
}

function studentPage(
  intl: IntlShape,
  variant: string,
  id: string,
  title: string,
  description: string,
  primary: string,
  secondary?: string,
): CarouselPage {
  return {
    id,
    accessibleTitle: msg(intl, `chatgpt.${variant}.${id}.title`, title),
    title: msg(intl, `chatgpt.${variant}.${id}.title`, title),
    description: msg(intl, `chatgpt.${variant}.${id}.description`, description),
    media: studentArtwork(variant, id),
    primaryActionLabel: msg(intl, `chatgpt.${variant}.${id}.primary`, primary),
    ...(secondary == null
      ? {}
      : {
          secondaryAction: {
            label: msg(intl, `chatgpt.${variant}.${id}.secondary`, secondary),
          },
        }),
  };
}

function studentPages(
  intl: IntlShape,
  modern: boolean,
  props: TourProps,
): CarouselPage[] {
  const variant = modern ? "students-2026" : "subscription";
  const definition = modern
    ? [
        [
          "welcome",
          "Explore ChatGPT Plus",
          "Find premium tools to help you study, create, plan, and tackle whatever the school year has in store.",
          "Take a look",
        ],
        [
          "plugins",
          "Bring your tools into ChatGPT",
          "Connect the apps you use for school and everyday life.",
          "Next",
          props.showPluginsAction === false ? undefined : "Explore plugins",
        ],
        [
          "work",
          "Take on your toughest assignments",
          "Draft presentations, build apps and sites, compile research, and handle multi-step tasks in ChatGPT Work.",
          "Next",
          props.showWorkAction === false ? undefined : "Try ChatGPT Work",
        ],
        [
          "sites",
          "Build and publish websites",
          "Turn an idea into a polished site for a class, club, or side project.",
          "Next",
          props.showSitesAction === false ? undefined : "Build a site",
        ],
        [
          "voice",
          "Talk it through, hands-free",
          "Show ChatGPT something you’re working on and discuss it in real time.",
          "Done",
          props.showVoiceAction === false ? undefined : "Start a voice chat",
        ],
      ]
    : [
        [
          "welcome",
          "Welcome to ChatGPT Plus",
          "Explore premium tools for studying, creating, and planning.",
          "Take a look",
        ],
        [
          "work",
          "Take on your toughest assignments",
          "Handle multi-step projects in ChatGPT Work.",
          "Next",
          props.showWorkAction === false ? undefined : "Try ChatGPT Work",
        ],
        [
          "files",
          "Add files to study smarter",
          "Upload slides, readings, and notes to summarize key ideas and create study guides.",
          "Next",
          props.showFilesAction === false ? undefined : "Add files",
        ],
        [
          "images",
          "Create polished visuals",
          "Design diagrams, charts, and illustrations for your next project.",
          "Next",
          props.showImagesAction === false ? undefined : "Create images",
        ],
        [
          "voice",
          "Talk it through, hands-free",
          "Discuss schoolwork and projects with ChatGPT in real time.",
          "Done",
          props.showVoiceAction === false ? undefined : "Start a voice chat",
        ],
      ];
  return definition.map(([id, title, description, primary, secondary]) =>
    studentPage(
      intl,
      variant,
      id as string,
      title as string,
      description as string,
      primary as string,
      secondary as string | undefined,
    ),
  );
}

function Student2026SubscriptionOnboarding(props: TourProps): unknown {
  return wireTour(
    props,
    studentPages(useIntl(), true, props),
    new Set(STUDENT_2026_PAGES.slice(1)),
  );
}
function StudentSubscriptionOnboarding(props: TourProps): unknown {
  return wireTour(
    props,
    studentPages(useIntl(), false, props),
    new Set(STUDENT_CLASSIC_PAGES.slice(1)),
  );
}

function shownKey(account: StudentAccount): string {
  return `${SHOWN_PREFIX}/${account.accountUserId}/${account.id}`;
}
function shouldShowStudent2026Onboarding(
  account: StudentAccount | null,
): boolean {
  if (
    typeof window === "undefined" ||
    account == null ||
    account.isPaidPlus !== true ||
    !account.id ||
    !account.accountUserId ||
    account.discount?.promo_campaign_id !== CAMPAIGN
  )
    return false;
  const expiresAt = account.discount?.discount_expires_at;
  if (expiresAt != null && !(Date.parse(expiresAt) > Date.now())) return false;
  try {
    return window.localStorage.getItem(shownKey(account)) !== "true";
  } catch {
    return false;
  }
}
function markStudent2026OnboardingShown(account: StudentAccount): void {
  if (!shouldShowStudent2026Onboarding(account)) return;
  try {
    window.localStorage.setItem(shownKey(account), "true");
  } catch {}
}
function recordPendingStudent2026Onboarding(account: StudentAccount): boolean {
  if (
    typeof window === "undefined" ||
    account.isPaidPlus !== true ||
    !account.id ||
    !account.accountUserId
  )
    return false;
  try {
    window.sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        accountId: account.id,
        accountUserId: account.accountUserId,
        createdAtMs: Date.now(),
      }),
    );
    return true;
  } catch {
    return false;
  }
}
function consumePendingStudent2026Onboarding(account: StudentAccount): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY);
    window.sessionStorage.removeItem(PENDING_KEY);
    if (raw == null || account.isPaidPlus !== true) return false;
    const pending = JSON.parse(raw);
    if (
      typeof pending !== "object" ||
      pending == null ||
      pending.accountId !== account.id ||
      pending.accountUserId !== account.accountUserId ||
      typeof pending.createdAtMs !== "number"
    )
      return false;
    const age = Date.now() - pending.createdAtMs;
    return Number.isFinite(age) && age >= 0 && age <= MAX_PENDING_AGE_MS;
  } catch {
    return false;
  }
}

function initializeProOnboarding(): void {
  initializeSubscriptionOnboarding();
}
function initializeCheckoutThemeFrame(): void {
  initializeSubscriptionOnboarding();
}
function initializeStudent2026Onboarding(): void {
  initializeSubscriptionOnboarding();
}
function initializeStudentOnboarding(): void {
  initializeSubscriptionOnboarding();
}
function initializeStorage(): void {
  initializeSubscriptionOnboarding();
}
function initializePlusOnboarding(): void {
  initializeSubscriptionOnboarding();
}

initializeSubscriptionOnboarding();
export {
  initializeProOnboarding as _,
  markStudent2026OnboardingShown as a,
  initializeStudentOnboarding as c,
  CheckoutThemeFrame as d,
  initializeCheckoutThemeFrame as f,
  PRO_MOBILE_FEATURES as g,
  PRO_DESKTOP_FEATURES as h,
  initializeStorage as i,
  Student2026SubscriptionOnboarding as l,
  initializeProOnboarding as m,
  shouldShowStudent2026Onboarding as n,
  recordPendingStudent2026Onboarding as o,
  ProSubscriptionOnboarding as p,
  consumePendingStudent2026Onboarding as r,
  StudentSubscriptionOnboarding as s,
  initializeSubscriptionOnboarding as t,
  initializeStudent2026Onboarding as u,
  PlusSubscriptionOnboarding as v,
  initializePlusOnboarding as y,
};
