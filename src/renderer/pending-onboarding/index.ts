// pending-onboarding —— 尚未完成的 onboarding 会话索引。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;

export interface PendingOnboarding {
  accountId: unknown;
  userId: unknown;
  [key: string]: unknown;
}

let pendingOnboardingByThreadSignal: unknown = new Map();
let pendingOnboardingForThreadFamily: unknown = Symbol(
  "pending-onboarding-for-thread",
);
let initialized = false;

function initializePendingOnboarding(): void {
  if (initialized) return;
  initialized = true;
  appShared.FX?.();
  appInitial.Sun?.();
  appShared.QI?.();
  appInitial.Ftn?.();
  pendingOnboardingByThreadSignal =
    appShared.pZ?.(appShared.ZI, new Map<string, PendingOnboarding>()) ??
    pendingOnboardingByThreadSignal;
  pendingOnboardingForThreadFamily =
    appShared.rZ?.(
      appShared.ZI,
      (
        threadId: string | null,
        { get }: { get(signal: unknown, key?: unknown): any },
      ) => {
        if (threadId == null) return null;
        const pending = get(pendingOnboardingByThreadSignal).get(threadId);
        return pending != null &&
          pending.accountId === get(appInitial.mun) &&
          pending.userId === get(appInitial._un) &&
          get(appInitial.Ltn, threadId) != null
          ? pending
          : null;
      },
    ) ?? pendingOnboardingForThreadFamily;
}

export {
  pendingOnboardingForThreadFamily as n,
  pendingOnboardingByThreadSignal as r,
  initializePendingOnboarding as t,
};
