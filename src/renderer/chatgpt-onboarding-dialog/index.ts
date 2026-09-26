// chatgpt-onboarding-dialog —— ChatGPT 首次使用流程的完成页。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

let jsx: any;
let initialized = false;

function initializeChatGptOnboardingDialog(): void {
  if (initialized) return;
  initialized = true;
  appInitial.As?.();
  appShared.FX?.();
  appShared.K2?.();
  appShared.Zh?.();
  appShared.zh?.();
  appInitial.Xot?.();
  appShared.lw?.();
  appPrimary.Ah?.();
  appInitial.JNt?.();
  appInitial.ypn?.();
  appShared.QI?.();
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
}

function preventDefault(event: { preventDefault(): void }): void {
  event.preventDefault();
}

function policyLink(
  scope: any,
  key: string,
  href: string,
  analyticsValue: unknown,
): (children: unknown) => unknown {
  const Link = appInitial.Jot ?? "a";
  return (children: unknown) =>
    jsx.jsx(
      Link,
      {
        className: "underline",
        href,
        initiator: "open_in_browser_bridge",
        isBrowserEnabled: false,
        openTarget: "external-browser",
        onClick: () =>
          scope
            ?.get?.(appInitial.Cpn)
            ?.logProductEvent?.(appInitial.Ds, { link: analyticsValue }),
        children,
      },
      key,
    );
}

function LearnMoreLink(children: unknown): unknown {
  const Link = appInitial.Jot ?? "a";
  return jsx.jsx(
    Link,
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

function TrainingDisclaimer({ country }: { country: string }): unknown {
  const FormattedMessage = appShared.Y2;
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
}: {
  country: string;
  onContinue(): void;
  onShown(): void;
}): unknown {
  initializeChatGptOnboardingDialog();
  const scope = appShared.LX?.(appShared.ZI);
  const FormattedMessage = appShared.Y2;
  const Dialog = appShared.Ih ?? "div";
  const Heading = appShared.Rh ?? "h1";
  const Text = appShared.Lh ?? "p";
  const Button = appShared.Yh ?? "button";
  const Logo = appShared.ty ?? "span";
  const Claim = appPrimary.kh ?? jsx.Fragment;
  const legalValues = {
    termsLink: policyLink(
      scope,
      "terms",
      "https://openai.com/terms",
      appInitial.Es?.CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_TERMS,
    ),
    privacyLink: policyLink(
      scope,
      "privacy",
      "https://openai.com/privacy",
      appInitial.Es?.CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_PRIVACY,
    ),
    koreaAddendumLink: policyLink(
      scope,
      "korea-addendum",
      "https://openai.com/ko/policies/kr-privacy-policy-addendum",
      appInitial.Es?.CODEX_CHATGPT_ONBOARDING_LEGAL_LINK_KOREA_ADDENDUM,
    ),
  };
  const submit = (event: { preventDefault(): void }) => {
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
              children: jsx.jsx(Logo, {}),
            }),
            jsx.jsx(Heading, {
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
            jsx.jsx(Text, {
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

  return jsx.jsx(Claim, {
    claim: appInitial.HNt?.FullscreenOnboarding,
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

initializeChatGptOnboardingDialog();

export { ChatGptOnboardingDialog };
