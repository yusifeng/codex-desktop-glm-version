// workspace-renewal-payment —— 工作区续费失败的 Home 警告候选。
// 原版：app/webview/assets/workspace-renewal-payment-f371de9faea6.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as renewalStateChunk from "@rchunk/workspace-renewal-state";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;

export interface WorkspaceRenewalPaymentCandidate {
  content: unknown;
  gracePeriodEnd: string | null;
  id: "workspace-renewal-payment";
  isEligible: boolean;
  isLoading: boolean;
}

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  I3: getJsxRuntime,
  K2: initializeReactRuntime,
  Y2: FormattedMessage,
  n4: useIntl,
} = appSharedChunk;
const {
  Dft: initializeOpenExternalLink,
  Hln: isRenewalEligiblePlan,
  Oft: openExternalLink,
  Rln: initializeRenewalBanner,
  eEt: initializeAccountState,
  jTt: workspaceBillingUrl,
  n7: AnnouncementBanner,
  r7: initializeAccountPlan,
  rht: initializeAccountQuery,
  sP: initializeClock,
  uP: useClock,
  uht: useAccountQuery,
} = appInitialChunk;
const {
  Jp: WarningIcon,
  Yp: initializeWarningIcon,
} = appPrimaryChunk;
const {
  n: initializeWorkspaceRenewalState,
  r: workspaceRenewalSubscriptionQuery,
  t: activeGracePeriodEnd,
} = renewalStateChunk;

let jsx: JsxRuntime;
let initialized = false;
function initializeWorkspaceRenewalPayment(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeReactRuntime();
  initializeWorkspaceRenewalState();
  initializeAccountQuery();
  initializeAccountState();
  initializeAccountPlan();
  initializeOpenExternalLink();
  initializeClock();
  initializeWarningIcon();
  initializeRenewalBanner();
  jsx = getJsxRuntime();
  initialized = true;
}

function openWorkspaceBilling(event: unknown): void {
  openExternalLink({
    event,
    href: workspaceBillingUrl,
    initiator: "open_in_browser_bridge",
  });
}

function useWorkspaceRenewalPayment(): WorkspaceRenewalPaymentCandidate {
  initializeWorkspaceRenewalPayment();
  const intl = useIntl();
  const accountQuery = useAccountQuery();
  const account = accountQuery.data;
  const eligibleWorkspaceId =
    account?.structure === "workspace" &&
    account.account_user_role === "account-owner" &&
    isRenewalEligiblePlan(account.plan_type)
      ? account.id
      : null;
  const subscriptionQuery =
    useSignalFamilyValue(workspaceRenewalSubscriptionQuery, eligibleWorkspaceId);
  const subscription = subscriptionQuery.data;
  const graceTimestamp =
    subscription?.grace_period_end_timestamp == null
      ? null
      : Date.parse(subscription.grace_period_end_timestamp);
  const now = useClock(graceTimestamp);
  const gracePeriodEnd = activeGracePeriodEnd(subscription, now);
  const content =
    gracePeriodEnd == null
      ? null
      : jsx.jsx(AnnouncementBanner, {
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
          Icon: WarningIcon,
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
