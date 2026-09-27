import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Y2 as FormattedMessage,
} from "@rchunk/app-shared";
import {
  Jot as ExternalLink,
  Xot as initializeExternalLink,
} from "@rchunk/app-initial";
import {
  i as initializeSecurityShared,
  t as SecurityConfirmationDialog,
} from "@rchunk/security-shared";

interface LockdownConfirmationProps {
  disablesDeveloperMode: boolean;
  isPending: boolean;
  onClose(): void;
  onConfirm(): void;
}

const jsx = getJsxRuntime();

function LearnMoreLink(chunks: unknown): unknown {
  return jsx.jsx(ExternalLink as (props: Record<string, unknown>) => unknown, {
    appearance: "secondary",
    initiator: "open_in_browser_bridge",
    href: "https://help.openai.com/en/articles/20001061-lockdown-mode",
    openTarget: "external-browser",
    children: chunks,
  });
}

function LockdownConfirmation({
  disablesDeveloperMode,
  isPending,
  onConfirm,
  onClose,
}: LockdownConfirmationProps): unknown {
  const restrictions = [
    [
      "settingsModal.lockdownModeEnableModalWebAccess",
      "ChatGPT won’t browse live web pages. It may use offline or cached results when available.",
    ],
    [
      "settingsModal.lockdownModeEnableModalDisabledCapabilities",
      "Connectors, Agent mode, Deep Research, and shopping research are turned off",
    ],
    [
      "settingsModal.lockdownModeEnableModalUnavailableFeatures",
      "File downloads and some code and canvas features won’t be available",
    ],
    [
      "settingsModal.lockdownModeEnableModalExternalLinks",
      "External links show the full URL and ask for confirmation before opening",
    ],
  ];
  if (disablesDeveloperMode) {
    restrictions.push([
      "settingsModal.lockdownModeEnableModalDisablesDeveloperMode",
      "Developer mode will be turned off while lockdown mode is on",
    ]);
  }
  restrictions.push([
    "settingsModal.lockdownModeEnableModalTurnOff",
    "You can turn Lockdown mode off anytime, or turn it off for one chat",
  ]);
  return jsx.jsx(SecurityConfirmationDialog, {
    title: jsx.jsx(FormattedMessage, {
      id: "settingsModal.lockdownModeEnableModalTitle",
      defaultMessage: "Turn on Lockdown mode?",
    }),
    confirmLabel: jsx.jsx(FormattedMessage, {
      id: "settingsModal.lockdownModeEnableModalConfirm",
      defaultMessage: "Turn on",
    }),
    isPending,
    onConfirm,
    onClose,
    children: jsx.jsxs("div", {
      className: "flex flex-col gap-3 select-none",
      children: [
        jsx.jsx("p", {
          children: jsx.jsx(FormattedMessage, {
            id: "settingsModal.lockdownModeEnableModalDescription",
            defaultMessage:
              "Lockdown mode helps protect sensitive data by limiting connections to websites, external services, and tools outside ChatGPT. <link>Learn more</link>",
            values: { link: LearnMoreLink },
          }),
        }),
        jsx.jsx("p", {
          children: jsx.jsx(FormattedMessage, {
            id: "settingsModal.lockdownModeEnableModalWhileOn",
            defaultMessage: "While it’s on:",
          }),
        }),
        jsx.jsx("ul", {
          className: "flex list-disc flex-col gap-1 ps-5",
          children: restrictions.map(([id, defaultMessage]) =>
            jsx.jsx("li", {
              children: jsx.jsx(FormattedMessage, { id, defaultMessage }),
            }, id),
          ),
        }),
      ],
    }),
  });
}

function initializeLockdownConfirmation(): void {
  initializeInternationalization();
  initializeExternalLink();
  initializeSecurityShared();
}

initializeLockdownConfirmation();

export { LockdownConfirmation };
