// workspace-renewal-state —— 工作区续费失败查询与宽限期窗口判断。
// 原版：app/webview/assets/state-92adb03a8a05.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1_000;
let initialized = false;
let workspaceRenewalSubscriptionQuery: unknown;

function activeGracePeriodEnd(
  subscription: Record<string, any> | null | undefined,
  now: Date,
): string | null {
  if (
    subscription?.is_delinquent !== true ||
    !subscription.will_renew ||
    subscription.became_delinquent_timestamp == null ||
    subscription.grace_period_end_timestamp == null
  )
    return null;
  const current = now.getTime();
  const becameDelinquent = Date.parse(subscription.became_delinquent_timestamp);
  const gracePeriodEnd = Date.parse(subscription.grace_period_end_timestamp);
  return current > becameDelinquent + TWO_DAYS_MS && current < gracePeriodEnd
    ? subscription.grace_period_end_timestamp
    : null;
}

function initializeWorkspaceRenewalState(): void {
  if (initialized) return;
  appShared.FX?.();
  appShared.QI?.();
  appShared.ek?.();
  appInitial.pdn?.();
  const createQuery = appShared.QX;
  const client = appInitial.udn;
  const oneMinute = appShared.$O?.ONE_MINUTE ?? 60_000;
  workspaceRenewalSubscriptionQuery = createQuery?.(
    appShared.ZI,
    (accountId: string | null) => ({
      enabled: accountId != null,
      queryKey: ["workspace-renewal-subscription", accountId],
      queryFn: () =>
        client.safeGet("/subscriptions", {
          parameters: { query: { account_id: accountId ?? undefined } },
        }),
      refetchInterval: oneMinute,
      staleTime: oneMinute,
    }),
  );
  initialized = true;
}

initializeWorkspaceRenewalState();
export {
  initializeWorkspaceRenewalState as n,
  workspaceRenewalSubscriptionQuery as r,
  activeGracePeriodEnd as t,
};
