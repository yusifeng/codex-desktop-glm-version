import {
  FX as initializeSignals,
  QI as initializeSignalQueries,
  ZI as AppScope,
  pZ as createScopedSignal,
  rZ as createDerivedFamily,
  type DerivedScopedSignalContext,
  type ScopedDerivedFamily,
  type ScopedSignal,
} from "@rchunk/app-shared";
import {
  Ftn as initializeEnvironmentQueries,
  Ltn as environmentConfigurationQuery,
  Sun as initializeAuthSignals,
  _un as currentUserIdSignal,
  mun as currentAccountIdSignal,
} from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

export interface PendingEnvironmentOnboarding {
  accountId: string;
  userId: string;
  [key: string]: unknown;
}

let pendingEnvironmentOnboardingById: ScopedSignal<
  Record<string, unknown>,
  Map<string, PendingEnvironmentOnboarding>
>;
let pendingEnvironmentOnboarding: ScopedDerivedFamily<
  Record<string, unknown>,
  string | null,
  PendingEnvironmentOnboarding | null
>;

function initializePendingEnvironmentOnboarding(): void {
  initializeSignals();
  initializeAuthSignals();
  initializeSignalQueries();
  initializeEnvironmentQueries();
  pendingEnvironmentOnboardingById = createScopedSignal(AppScope, new Map());
  pendingEnvironmentOnboarding = createDerivedFamily(
    AppScope,
    (
      environmentId: string | null,
      { get }: DerivedScopedSignalContext<Record<string, unknown>>,
    ) => {
      if (environmentId == null) return null;
      const pending = get(pendingEnvironmentOnboardingById).get(environmentId);
      if (!pending) return null;
      const accountId = get<string>(currentAccountIdSignal);
      const userId = get<string>(currentUserIdSignal);
      const configuration = get<unknown>(
        environmentConfigurationQuery,
        environmentId,
      );
      return pending.accountId === accountId &&
        pending.userId === userId &&
        configuration != null
        ? pending
        : null;
    },
  );
}

export {
  pendingEnvironmentOnboarding as n,
  pendingEnvironmentOnboardingById as r,
  initializePendingEnvironmentOnboarding as t,
};
