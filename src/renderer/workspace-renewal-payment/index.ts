// workspace-renewal-payment —— 工作区续费失败的 Home 警告候选。
// 原版：app/webview/assets/workspace-renewal-payment-f371de9faea6.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as renewalStateChunk from "@rchunk/workspace-renewal-state";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const renewalState = renewalStateChunk as Record<string, any>;

let jsx: any;
let initialized = false;
function initializeWorkspaceRenewalPayment(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.K2?.();
  renewalState.n?.();
  appInitial.rht?.();
  appInitial.eEt?.();
  appInitial.r7?.();
  appInitial.Dft?.();
  appInitial.sP?.();
  appPrimary.Yp?.();
  appInitial.Rln?.();
  jsx = appShared.I3?.();
  initialized = true;
}

function openWorkspaceBilling(event: unknown): void {
  appInitial.Oft?.({
    event,
    href: appInitial.jTt,
    initiator: "open_in_browser_bridge",
  });
}

function useWorkspaceRenewalPayment(): Record<string, any> {
  initializeWorkspaceRenewalPayment();
  const intl = appShared.n4?.();
  const accountQuery = appInitial.uht?.() ?? {};
  const account = accountQuery.data;
  const eligibleWorkspaceId =
    account?.structure === "workspace" &&
    account.account_user_role === "account-owner" &&
    appInitial.Hln?.(account.plan_type)
      ? account.id
      : null;
  const subscriptionQuery =
    appShared.BX?.(renewalState.r, eligibleWorkspaceId) ?? {};
  const subscription = subscriptionQuery.data;
  const graceTimestamp =
    subscription?.grace_period_end_timestamp == null
      ? null
      : Date.parse(subscription.grace_period_end_timestamp);
  const now = appInitial.uP?.(graceTimestamp) ?? new Date();
  const gracePeriodEnd = renewalState.t(subscription, now);
  const Banner = appInitial.n7 ?? "div";
  const FormattedMessage = appShared.Y2;
  const content =
    gracePeriodEnd == null
      ? null
      : jsx.jsx(Banner, {
          ariaLive: "polite",
          content: jsx.jsx(FormattedMessage, {
            id: "codex.workspaceRenewalPaymentBanner.description",
            defaultMessage:
              "Update your payment method before {date} to keep access to your workspace",
            description:
              "Warning that a Business workspace payment must be updated before {date}, when the grace period ends",
            values: {
              date: intl.formatDate(gracePeriodEnd, {
                month: "long",
                day: "numeric",
              }),
            },
          }),
          Icon: appPrimary.Jp,
          layout: "warningCallout",
          onPrimaryCtaClick: openWorkspaceBilling,
          primaryCtaText: jsx.jsx(FormattedMessage, {
            id: "codex.workspaceRenewalPaymentBanner.updatePayment",
            defaultMessage: "Update payment",
            description:
              "Opens workspace billing settings to update the payment method",
          }),
          role: "status",
          stackOnNarrow: true,
          title: jsx.jsx(FormattedMessage, {
            id: "codex.workspaceRenewalPaymentBanner.title",
            defaultMessage: "Workspace renewal failed",
            description:
              "Title shown when a Business workspace renewal payment fails",
          }),
          type: "warning",
        });
  return {
    id: "workspace-renewal-payment",
    gracePeriodEnd,
    isEligible: eligibleWorkspaceId != null && gracePeriodEnd != null,
    isLoading:
      accountQuery.isLoading ||
      (eligibleWorkspaceId != null && subscriptionQuery.isLoading),
    content,
  };
}

initializeWorkspaceRenewalPayment();
export {
  useWorkspaceRenewalPayment as n,
  initializeWorkspaceRenewalPayment as t,
};
