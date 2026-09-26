// workspace-renewal-state —— 工作区续费失败查询与宽限期窗口判断。
// 原版：app/webview/assets/state-92adb03a8a05.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import type { ScopedQueryFamily } from "@rchunk/app-shared";

void runtimeChunk;

export interface WorkspaceRenewalSubscription extends Record<string, unknown> {
  became_delinquent_timestamp?: string | null;
  grace_period_end_timestamp?: string | null;
  is_delinquent?: boolean;
  will_renew?: boolean;
}

interface AppInitialBindings {
  pdn(): void;
  udn: {
    safeGet<Result>(
      path: string,
      options: {
        parameters: { query: { account_id?: string } };
      },
    ): Promise<Result>;
  };
}

const { pdn: initializeWorkspaceSubscriptions, udn: appApiClient } =
  appInitialChunk as unknown as AppInitialBindings;
const {
  $O: queryStaleTimes,
  FX: initializeMaitaiRuntime,
  QI: initializeQueryBridge,
  QX: createQueryFamily,
  ZI: AppScope,
  ek: initializeQueryRuntime,
} = appSharedChunk;

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1_000;
let initialized = false;
let workspaceRenewalSubscriptionQuery: ScopedQueryFamily<
  Record<string, unknown>,
  string | null,
  WorkspaceRenewalSubscription
>;

function activeGracePeriodEnd(
  subscription: WorkspaceRenewalSubscription | null | undefined,
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
  initializeMaitaiRuntime();
  initializeQueryBridge();
  initializeQueryRuntime();
  initializeWorkspaceSubscriptions();
  const oneMinute = queryStaleTimes.ONE_MINUTE;
  workspaceRenewalSubscriptionQuery = createQueryFamily<
    Record<string, unknown>,
    string | null,
    WorkspaceRenewalSubscription
  >(
    AppScope,
    (accountId: string | null) => ({
      enabled: accountId != null,
      queryKey: ["workspace-renewal-subscription", accountId],
      queryFn: () =>
        appApiClient.safeGet<WorkspaceRenewalSubscription>("/subscriptions", {
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
