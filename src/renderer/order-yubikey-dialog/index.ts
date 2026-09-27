import "@rchunk/rolldown-runtime";
import {
  I3 as getJsxRuntime,
  K2 as initializeInternationalization,
  Lh as DialogDescription,
  Oh as DialogContent,
  Y2 as FormattedMessage,
  Yh as Button,
  kh as DialogFooterActions,
} from "@rchunk/app-shared";
import {
  Jot as ExternalLink,
  Xot as initializeExternalLink,
  cJt as initializeApiClient,
  ddn as ApiClient,
  kft as openExternalUrl,
  oJt as getAdditionalHeaders,
} from "@rchunk/app-initial";

interface OrderYubikeyDialogProps {
  accountId: string;
  onClose(): void;
}

interface SecurityApiClient {
  safePost(path: string, options: Record<string, unknown>): Promise<{ order_url?: string }>;
}

const jsx = getJsxRuntime();
let securityApiClient: SecurityApiClient;

function YubicoTermsLink(chunks: unknown): unknown {
  return jsx.jsx(ExternalLink as (props: Record<string, unknown>) => unknown, {
    initiator: "open_in_browser_bridge",
    openTarget: "external-browser",
    href: "https://www.yubico.com/support/terms-conditions/",
    underline: "always",
    children: chunks,
  });
}

function OrderYubikeyDialog({ accountId, onClose }: OrderYubikeyDialogProps): unknown {
  let pending = false;
  const order = async () => {
    if (pending) return;
    pending = true;
    try {
      const result = await securityApiClient.safePost(
        "/accounts/security_settings/yubikey/order_link",
        { additionalHeaders: { "ChatGPT-Account-ID": accountId } },
      );
      openExternalUrl({
        href: result.order_url ?? "https://www.yubico.com/store/",
        initiator: "open_in_browser_bridge",
        openTarget: "external-browser",
        disposition: "current-tab",
      });
    } catch {
      openExternalUrl({
        href: "https://www.yubico.com/store/",
        initiator: "open_in_browser_bridge",
        openTarget: "external-browser",
        disposition: "current-tab",
      });
    } finally {
      pending = false;
    }
  };
  const onSubmit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    void order();
  };
  return jsx.jsx(DialogContent, {
    open: true,
    size: "feature",
    radius: "compact",
    showDialogClose: false,
    onOpenChange: (open: boolean) => {
      if (!open && !pending) onClose();
    },
    children: jsx.jsxs("form", {
      className: "flex flex-col gap-5 p-6",
      onSubmit,
      children: [
        jsx.jsxs("div", {
          className: "flex flex-col gap-6",
          children: [
            jsx.jsx("div", {
              className: "flex justify-center",
              "aria-hidden": true,
              children: jsx.jsx("div", {
                className:
                  "flex size-16 items-center justify-center rounded-full border border-default text-2xl text-default",
                children: "◇",
              }),
            }),
            jsx.jsxs("div", {
              className: "flex flex-col gap-2",
              children: [
                jsx.jsx("h2", {
                  className: "text-sm leading-5 font-medium select-none",
                  children: jsx.jsx(FormattedMessage, {
                    id: "settings.chatGpt.security.orderYubikey.title",
                    defaultMessage: "Order a YubiKey",
                  }),
                }),
                jsx.jsx(DialogDescription, {
                  asChild: true,
                  children: jsx.jsxs("div", {
                    className: "flex flex-col gap-2 text-xs leading-4 text-default",
                    children: [
                      jsx.jsx("p", {
                        children: jsx.jsx(FormattedMessage, {
                          id: "settings.chatGpt.security.orderYubikey.purchaseDescription",
                          defaultMessage:
                            "OpenAI has partnered with Yubico to offer security keys for your ChatGPT account. You’ll be redirected to Yubico to complete your purchase.",
                        }),
                      }),
                      jsx.jsx("p", {
                        children: jsx.jsx(FormattedMessage, {
                          id: "settings.chatGpt.security.orderYubikey.emailDescription",
                          defaultMessage:
                            "To continue, we’ll share your email address with Yubico. Your order is subject to Yubico’s <termsLink>Terms and Privacy Policy</termsLink>.",
                          values: { termsLink: YubicoTermsLink },
                        }),
                      }),
                    ],
                  }),
                }),
              ],
            }),
          ],
        }),
        jsx.jsxs(DialogFooterActions, {
          children: [
            jsx.jsx(Button, {
              type: "button",
              color: "outlineSurface",
              disabled: pending,
              onClick: onClose,
              children: "Back",
            }),
            jsx.jsx(Button, {
              type: "submit",
              color: "primary",
              disabled: pending,
              loading: pending,
              children: "Continue to Yubico",
            }),
          ],
        }),
      ],
    }),
  });
}

function initializeOrderYubikeyDialog(): void {
  initializeInternationalization();
  initializeExternalLink();
  initializeApiClient();
  securityApiClient = new ApiClient({ getAdditionalHeaders }) as SecurityApiClient;
}

initializeOrderYubikeyDialog();

export { OrderYubikeyDialog };
