// chatgpt-onboarding-dialog —— ChatGPT 首次使用流程的完成页。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { OnboardingLegalLink } from "@rchunk/app-initial";
import type { JsxRuntime, MaitaiScopeApi } from "@rchunk/app-shared";

void runtimeChunk;

const {
  As: initializeChatGptOnboarding,
  Cpn: productAnalyticsSignal,
  Ds: onboardingLegalLinkClickedEvent,
  Es: onboardingLegalLinks,
  HNt: surfaceClaims,
  JNt: initializeOnboardingAnalytics,
  Jot: ExternalLink,
  Xot: initializeExternalLink,
  ypn: initializeProductAnalytics,
} = appInitialChunk;
const {
  Ah: initializeSurfaceClaim,
  kh: SurfaceClaim,
} = appPrimaryChunk;
const {
  $3: initializeJsxRuntime,
  FX: initializeMaitaiRuntime,
  I3: getJsxRuntime,
  Ih: Dialog,
  K2: initializeIntlRuntime,
  LX: useScope,
  Lh: DialogDescription,
  QI: initializeAppScopeRuntime,
  Rh: DialogTitle,
  Y2: FormattedMessage,
  Yh: Button,
  ZI: AppScope,
  Zh: initializeButton,
  lw: initializeChatGptLogo,
  ty: ChatGptLogo,
  zh: initializeDialog,
} = appSharedChunk;

let jsxRuntime: JsxRuntime | null = null;
let initialized = false;

interface PreventDefaultEvent {
  preventDefault(): void;
}

interface TrainingDisclaimerProps {
  country: string;
}

interface ChatGptOnboardingDialogProps {
  country: string;
  onContinue(): void;
  onShown(): void;
}

function initializeChatGptOnboardingDialog(): void {
  if (initialized) return;
  initialized = true;
  initializeJsxRuntime?.();
  initializeChatGptOnboarding?.();
  initializeMaitaiRuntime?.();
  initializeIntlRuntime?.();
  initializeButton?.();
  initializeDialog?.();
  initializeExternalLink?.();
  initializeChatGptLogo?.();
  initializeSurfaceClaim?.();
  initializeOnboardingAnalytics?.();
  initializeProductAnalytics?.();
  initializeAppScopeRuntime?.();
  jsxRuntime =
    typeof getJsxRuntime === "function" ? getJsxRuntime() : getJsxRuntime;
}

function preventDefault(event: PreventDefaultEvent): void {
  event.preventDefault();
}

function policyLink(
  scope: MaitaiScopeApi<Record<string, unknown>>,
  key: string,
  href: string,
  analyticsValue: OnboardingLegalLink,
): (children: unknown) => unknown {
  return (children: unknown) =>
    getInitializedJsxRuntime().jsx(
      ExternalLink,
      {
        className: "underline",
        href,
        initiator: "open_in_browser_bridge",
        isBrowserEnabled: false,
        openTarget: "external-browser",
        onClick: () =>
          scope
            .get(productAnalyticsSignal)
            .logProductEvent(onboardingLegalLinkClickedEvent, {
              link: analyticsValue,
            }),
        children,
      },
      key,
    );
}

function LearnMoreLink(children: unknown): unknown {
  return getInitializedJsxRuntime().jsx(
    ExternalLink,
    {
      className: "underline",
      href: "https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance",
      initiator: "open_in_browser_bridge",
      isBrowserEnabled: false,
      openTarget: "external-browser",
      children,
    },
    "learn-more",
  );
}

function TrainingDisclaimer({ country }: TrainingDisclaimerProps): unknown {
  const jsx = getInitializedJsxRuntime();
  return jsx.jsx(FormattedMessage, {
    id:
      country === "CA"
        ? "chatgpt.new-onboarding.chatgpt-review-training-sensitive-info-disclaimer"
        : "chatgpt.new-onboarding.chatgpt-review-training-disclaimer",
    defaultMessage:
      country === "CA"
        ? "ChatGPT can make mistakes. Don't share sensitive info. Chats may be reviewed and used for training. <learnMoreLink>Learn more</learnMoreLink>"
        : "ChatGPT can make mistakes. Chats may be reviewed and used for training. <learnMoreLink>Learn more</learnMoreLink>",
    description:
      country === "CA"
        ? "Disclaimer above Continue on the final ChatGPT new-user onboarding screen in Canada. Warns users about mistakes, sensitive information, and chat review and training. The learnMoreLink tag links to the Help Center article on improving model performance."
        : "Disclaimer above Continue on the final ChatGPT new-user onboarding screen outside Canada. Warns users about mistakes and chat review and training. The learnMoreLink tag links to the Help Center article on improving model performance.",
    values: { learnMoreLink: LearnMoreLink },
  });
}

function ChatGptOnboardingDialog({
  country,
  onContinue,
  onShown,
}: ChatGptOnboardingDialogProps): unknown {
  initializeChatGptOnboardingDialog();
  const jsx = getInitializedJsxRuntime();
  const scope = useScope(AppScope);
  const legalValues = {
    termsLink: policyLink(
      scope,
      "terms",
      "https://openai.com/terms",
      onboardingLegalLinks.CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_TERMS,
    ),
    privacyLink: policyLink(
      scope,
      "privacy",
      "https://openai.com/privacy",
      onboardingLegalLinks.CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_PRIVACY,
    ),
    koreaAddendumLink: policyLink(
      scope,
      "korea-addendum",
      "https://openai.com/ko/policies/kr-privacy-policy-addendum",
      onboardingLegalLinks.CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_KOREA_ADDENDUM,
    ),
  };
  const submit = (event: PreventDefaultEvent) => {
    event.preventDefault();
    onContinue();
  };

  const content = jsx.jsx("div", {
    className: "flex h-full flex-col overflow-y-auto",
    children: jsx.jsxs("form", {
      className:
        "m-auto flex w-full shrink-0 flex-col items-center justify-between py-4 max-sm:min-h-full sm:w-80 sm:justify-center sm:gap-y-12",
      onSubmit: submit,
      children: [
        jsx.jsxs("div", {
          className:
            "flex flex-col items-center justify-center gap-y-4 text-center select-none max-sm:flex-1",
          children: [
            jsx.jsx("div", {
              className: "flex size-9 items-center justify-center",
              children: jsx.jsx(ChatGptLogo, {}),
            }),
            jsx.jsx(DialogTitle, {
              className: "text-3xl leading-9 font-normal",
              children: jsx.jsx(FormattedMessage, {
                id: "chatgpt.new-onboarding.all-done-2",
                defaultMessage: "You're all set",
                description:
                  "Text shown in the new user onboarding after the last step.",
              }),
            }),
          ],
        }),
        jsx.jsxs("div", {
          className: "flex w-full flex-col gap-y-4 max-sm:px-6",
          children: [
            jsx.jsx(DialogDescription, {
              className: "text-center text-base leading-6 text-secondary",
              children: jsx.jsx(TrainingDisclaimer, { country }),
            }),
            jsx.jsx(Button, {
              color: "primary",
              size: "beaconAction",
              type: "submit",
              children: jsx.jsx(FormattedMessage, {
                id: "chatgpt.new-onboarding.continue",
                defaultMessage: "Continue",
                description:
                  "Label of a button in the new user onboarding that concludes the onboarding flow and lets user start to use chatgpt.",
              }),
            }),
            jsx.jsx("p", {
              className: "text-center text-sm text-secondary",
              children: jsx.jsx(FormattedMessage, {
                id:
                  country === "KR"
                    ? "thread.agreeToTermsNoAuthKorea-may-06"
                    : "thread.agreeToTermsNoAuth-may-06",
                defaultMessage:
                  country === "KR"
                    ? "By continuing, you agree to our <termsLink>Terms</termsLink> and have read our <privacyLink>Privacy Policy</privacyLink> and its <koreaAddendumLink>Korea addendum</koreaAddendumLink>."
                    : "By continuing, you agree to our <termsLink>Terms</termsLink> and have read our <privacyLink>Privacy Policy</privacyLink>.",
                description:
                  country === "KR"
                    ? "Legal notice below Continue on the final ChatGPT new-user onboarding screen in Korea. Each rich-text tag surrounds a link to the named policy."
                    : "Legal notice below Continue on the final ChatGPT new-user onboarding screen. Each rich-text tag surrounds a link to the named policy.",
                values: legalValues,
              }),
            }),
          ],
        }),
      ],
    }),
  });

  return jsx.jsx(SurfaceClaim, {
    claim: surfaceClaims.FullscreenOnboarding,
    children: jsx.jsx(Dialog, {
      open: true,
      showDialogClose: false,
      shouldIgnoreClickOutside: true,
      unstyledContent: true,
      viewportSized: true,
      contentClassName: "h-full w-full bg-surface text-default",
      contentProps: {
        onOpenAutoFocus: onShown,
        onEscapeKeyDown: preventDefault,
      },
      children: content,
    }),
  });
}

function getInitializedJsxRuntime(): JsxRuntime {
  initializeChatGptOnboardingDialog();
  if (jsxRuntime == null) {
    throw new Error("ChatGPT onboarding JSX runtime failed to initialize");
  }
  return jsxRuntime;
}

initializeChatGptOnboardingDialog();

export { ChatGptOnboardingDialog };
