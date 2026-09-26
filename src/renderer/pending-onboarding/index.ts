// pending-onboarding —— 尚未完成的 onboarding 会话索引。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type {
  DerivedScopedSignalContext,
  ScopedDerivedFamily,
  ScopedSignal,
} from "@rchunk/app-shared";

void runtimeChunk;

const {
  Ftn: initializeThreadState,
  Ltn: threadByIdFamily,
  Sun: initializeAccountState,
  _un: currentUserIdSignal,
  mun: currentAccountIdSignal,
} = appInitialChunk;
const {
  FX: initializeSignalRuntime,
  QI: initializeAppScope,
  ZI: appScope,
  pZ: createScopedSignal,
  rZ: createDerivedFamily,
} = appSharedChunk;

export interface PendingOnboarding {
  accountId: string | null;
  userId: string | null;
  [key: string]: unknown;
}

type AppScopeState = Record<string, unknown>;
type PendingOnboardingMap = Map<string, PendingOnboarding>;

let pendingOnboardingByThreadSignal: ScopedSignal<
  AppScopeState,
  PendingOnboardingMap
>;
let pendingOnboardingForThreadFamily: ScopedDerivedFamily<
  AppScopeState,
  string | null,
  PendingOnboarding | null
>;
let initialized = false;

function initializePendingOnboarding(): void {
  if (initialized) return;
  initialized = true;
  initializeSignalRuntime();
  initializeAccountState();
  initializeAppScope();
  initializeThreadState();
  pendingOnboardingByThreadSignal = createScopedSignal(
    appScope,
    new Map<string, PendingOnboarding>(),
  );
  pendingOnboardingForThreadFamily = createDerivedFamily(
    appScope,
    (
      threadId: string | null,
      { get }: DerivedScopedSignalContext<AppScopeState>,
    ) => {
      if (threadId == null) return null;
      const pending = get(pendingOnboardingByThreadSignal).get(threadId);
      return pending != null &&
        pending.accountId === get<string | null>(currentAccountIdSignal) &&
        pending.userId === get<string | null>(currentUserIdSignal) &&
        get<unknown>(threadByIdFamily, threadId) != null
        ? pending
        : null;
    },
  );
}

export {
  pendingOnboardingForThreadFamily as n,
  pendingOnboardingByThreadSignal as r,
  initializePendingOnboarding as t,
};
