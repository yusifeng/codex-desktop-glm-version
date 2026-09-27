import "@rchunk/rolldown-runtime";
import {
  Ah as DialogHeader,
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Lh as DialogDescription,
  Oh as DialogContent,
  Ph as DialogTitle,
  Qh as LoadingSpinner,
  S_ as Icon,
  Y2 as FormattedMessage,
  Yh as Button,
  e6 as getReact,
  jh as DialogBody,
  k as chevronLeftIcon,
  kh as DialogFooterActions,
} from "@rchunk/app-shared";
import {
  au as SettingsSubpageLayout,
  su as initializeSettingsSubpageLayout,
} from "@rchunk/app-initial";

interface SecuritySubpageProps {
  action?: unknown;
  children?: unknown;
  onBack(): void;
  subtitle?: unknown;
  title: unknown;
}

interface LoadingStateProps {
  isError: boolean;
  onRetry(): void;
}

interface ConfirmationDialogProps {
  children?: unknown;
  confirmLabel: unknown;
  informational?: boolean;
  isError?: boolean;
  isPending?: boolean;
  onClose(): void;
  onConfirm(): void;
  title: unknown;
}

const jsx = getJsxRuntime();

function SecuritySubpage({
  title,
  subtitle,
  action,
  onBack,
  children,
}: SecuritySubpageProps): unknown {
  return jsx.jsx(SettingsSubpageLayout, {
    title,
    subtitle,
    action,
    backSlot: jsx.jsxs(Button, {
      color: "ghostActive",
      size: "toolbar",
      onClick: onBack,
      children: [
        jsx.jsx(Icon, { className: "rtl:rotate-180", asset: chevronLeftIcon }),
        jsx.jsx(FormattedMessage, {
          id: "settings.chatGpt.security.back",
          defaultMessage: "Back",
          description:
            "Button in a Security and login settings subpage that returns to its parent page without changing account settings.",
        }),
      ],
    }),
    children,
  });
}

function SecurityLoadingState({ isError, onRetry }: LoadingStateProps): unknown {
  return isError
    ? jsx.jsxs("div", {
        role: "alert",
        className: "flex flex-col items-start gap-3 text-sm text-secondary",
        children: [
          jsx.jsx(FormattedMessage, {
            id: "settings.chatGpt.security.loadError",
            defaultMessage: "Couldn’t load security settings. Please try again",
          }),
          jsx.jsx(Button, {
            color: "secondary",
            size: "toolbar",
            onClick: onRetry,
            children: jsx.jsx(FormattedMessage, {
              id: "settings.chatGpt.security.retry",
              defaultMessage: "Retry",
            }),
          }),
        ],
      })
    : jsx.jsxs("div", {
        role: "status",
        className: "flex items-center gap-2 text-sm text-secondary",
        children: [
          jsx.jsx(LoadingSpinner, {}),
          jsx.jsx(FormattedMessage, {
            id: "settings.chatGpt.security.loading",
            defaultMessage: "Loading security settings…",
          }),
        ],
      });
}

function SecurityConfirmationDialog({
  title,
  children,
  confirmLabel,
  onConfirm,
  onClose,
  isPending = false,
  isError = false,
  informational = false,
}: ConfirmationDialogProps): unknown {
  const handleSubmit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (!isPending) onConfirm();
  };
  return jsx.jsx(DialogContent, {
    open: true,
    contentProps: children == null ? { "aria-describedby": undefined } : undefined,
    onOpenChange: (open: boolean) => {
      if (!open && !isPending) onClose();
    },
    children: jsx.jsxs(DialogBody, {
      as: "form",
      onSubmit: handleSubmit,
      children: [
        jsx.jsxs(DialogBody, {
          children: [
            jsx.jsx(DialogHeader, {
              title: jsx.jsx(DialogTitle, { className: "select-none", children: title }),
              subtitle:
                children == null
                  ? null
                  : jsx.jsx(DialogDescription, { asChild: true, children: jsx.jsx("div", { children }) }),
              subtitleSize: "sm",
              subtitleTone: "secondary",
            }),
            isError
              ? jsx.jsx("p", {
                  role: "alert",
                  className: "text-sm text-danger",
                  children: jsx.jsx(FormattedMessage, {
                    id: "settings.chatGpt.security.actionFailed",
                    defaultMessage: "Couldn’t complete this action. Please try again",
                  }),
                })
              : null,
          ],
        }),
        jsx.jsx(DialogBody, {
          children: jsx.jsxs(DialogFooterActions, {
            expandSingleButton: informational,
            children: [
              informational
                ? null
                : jsx.jsx(Button, {
                    type: "button",
                    color: "secondary",
                    disabled: isPending,
                    onClick: onClose,
                    children: jsx.jsx(FormattedMessage, {
                      id: "settings.chatGpt.security.cancel",
                      defaultMessage: "Cancel",
                    }),
                  }),
              jsx.jsx(Button, {
                type: "submit",
                color: informational ? "primary" : "danger",
                loading: isPending,
                disabled: isPending,
                children: confirmLabel,
              }),
            ],
          }),
        }),
      ],
    }),
  });
}

function initializeSecurityShared(): void {
  void getReact;
  initializeInternationalization();
  initializeSettingsSubpageLayout();
}

export {
  initializeSecurityShared as i,
  SecurityLoadingState as n,
  SecuritySubpage as r,
  SecurityConfirmationDialog as t,
};
