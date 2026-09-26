// subscription-management-page —— account_id 驱动的订阅管理路由守卫。
// 原版：app/webview/assets/subscription-management-page-ed5a3e4b51fa.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as queriesChunk from "@rchunk/queries";

void runtimeChunk;

interface ReactRuntime {
  useEffect(effect: () => void, dependencies: readonly unknown[]): void;
  useRef<Value>(initialValue: Value): { current: Value };
}

interface JsxRuntime {
  jsx(
    component: unknown,
    props: Record<string, unknown>,
    key?: string,
  ): unknown;
}

interface SubscriptionAccount extends Record<string, unknown> {
  account_id: string;
  account_residency_region?: unknown;
  is_deactivated?: boolean;
  is_fedramp_compliant_workspace?: boolean;
  name?: string | null;
  plan_type?: unknown;
  profile_picture_url?: string | null;
  structure?: string;
}

interface SubscriptionAccountResult extends Record<string, unknown> {
  account?: SubscriptionAccount | null;
  can_access_with_session?: boolean;
  sso_connection_name?: string | null;
}

interface WorkspaceSwitchOptions extends Record<string, unknown> {
  accountResidencyRegion?: unknown;
  canAccessWithSession?: boolean;
  isDeactivated?: boolean;
  isFedrampCompliantWorkspace?: boolean;
  isPersonalWorkspace: boolean;
  ssoConnectionName?: string | null;
  workspaceAccountId: string;
  workspaceImageUrl: string | null;
  workspaceName: string | null;
}

interface AppInitialApi {
  NavigateComponent: unknown;
  LoadingComponent: unknown;
  useSearchParams(): [URLSearchParams];
  useActiveAccount(): { accountId?: string };
  useCredential(): unknown;
  useLocation(): { search: string };
  getReturnUrl(location: { search: string }): string;
  switchWorkspace(
    options: WorkspaceSwitchOptions,
    credential: unknown,
    destination: string,
  ): Promise<{ willRedirect?: boolean } | undefined>;
  credentialForWorkspaceSwitch(credential: unknown): unknown;
  openExternal(destination: string): Promise<unknown> | unknown;
  normalizePlanType(planType: unknown): unknown;
  useFeatureFlag(flagId: string): boolean;
  useFeatureFlagLoading(flagId: string): boolean;
  initializeNavigation(): void;
  initializeAccountRuntime(): void;
  initializeSubscriptionPlan(): void;
  initializeLoadingState(): void;
  initializeWorkspaceSwitch(): void;
  initializeFeatureFlags(): void;
}

const {
  _L: useQuery,
  gL: initializeUseQuery,
  iL: useMutation,
  rL: initializeUseMutation,
  e6: reactRuntimeExport,
  I3: jsxRuntimeExport,
} = appSharedChunk;
const { $3: initializeRuntimeLazy } = appSharedChunk as unknown as {
  $3?: () => void;
};
const {
  Ygn: NavigateComponent,
  Let: LoadingComponent,
  d_n: useSearchParams,
  N6t: useActiveAccount,
  lfn: useCredential,
  i_n: useLocation,
  r_n: getReturnUrl,
  Mx: switchWorkspace,
  kx: credentialForWorkspaceSwitch,
  Ax: openExternal,
  O0: normalizePlanType,
  ofn: useFeatureFlag,
  sfn: useFeatureFlagLoading,
  Qgn: initializeNavigation,
  M6t: initializeAccountRuntime,
  j0: initializeSubscriptionPlan,
  Ret: initializeLoadingState,
  jx: initializeWorkspaceSwitch,
  ifn: initializeFeatureFlags,
} = appInitialChunk as unknown as {
  Ygn: AppInitialApi["NavigateComponent"];
  Let: AppInitialApi["LoadingComponent"];
  d_n: AppInitialApi["useSearchParams"];
  N6t: AppInitialApi["useActiveAccount"];
  lfn: AppInitialApi["useCredential"];
  i_n: AppInitialApi["useLocation"];
  r_n: AppInitialApi["getReturnUrl"];
  Mx: AppInitialApi["switchWorkspace"];
  kx: AppInitialApi["credentialForWorkspaceSwitch"];
  Ax: AppInitialApi["openExternal"];
  O0: AppInitialApi["normalizePlanType"];
  ofn: AppInitialApi["useFeatureFlag"];
  sfn: AppInitialApi["useFeatureFlagLoading"];
  Qgn: AppInitialApi["initializeNavigation"];
  M6t: AppInitialApi["initializeAccountRuntime"];
  j0: AppInitialApi["initializeSubscriptionPlan"];
  Ret: AppInitialApi["initializeLoadingState"];
  jx: AppInitialApi["initializeWorkspaceSwitch"];
  ifn: AppInitialApi["initializeFeatureFlags"];
};
const {
  n: subscriptionAccountQueryOptions,
  i: initializeSubscriptionQueries,
} = queriesChunk as unknown as {
  n(accountId: string): import("@rchunk/app-shared").UseQueryOptions<
    SubscriptionAccountResult
  >;
  i(): void;
};

function resolveRuntime<Runtime>(runtimeOrFactory: unknown): Runtime {
  return (typeof runtimeOrFactory === "function"
    ? runtimeOrFactory()
    : runtimeOrFactory) as Runtime;
}

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;

function redirect(to: string): unknown {
  return jsx.jsx(NavigateComponent ?? "Navigate", { to, replace: true });
}

function SubscriptionManagementPage(): unknown {
  initializeSubscriptionManagementPage();
  const [searchParams] = useSearchParams();
  const accountIds = searchParams.getAll("account_id");
  const accountId = accountIds[0]?.trim();
  if (accountIds.length !== 1 || !accountId) return redirect("/");
  return jsx.jsx(AccountSubscriptionManagement, { accountId }, accountId);
}

function AccountSubscriptionManagement({
  accountId,
}: {
  accountId: string;
}): unknown {
  const { accountId: activeAccountId } = useActiveAccount();
  const query = useQuery(subscriptionAccountQueryOptions(accountId));
  const credential = useCredential();
  const location = useLocation();
  const returnUrl = getReturnUrl(location);
  const refreshAccount =
    new URLSearchParams(location.search).get("refresh_account") === "true";
  const result = query.data;
  const account = result?.account;
  const mustSwitchAccount =
    account != null &&
    (activeAccountId !== accountId ||
      result?.can_access_with_session === false);
  const invalidAccount =
    query.isError ||
    account == null ||
    account.account_id !== accountId ||
    account.is_deactivated === true ||
    (account.structure !== "personal" && account.structure !== "workspace");
  const navigationStarted = React.useRef(false);
  const mutation = useMutation<void, Error, void>({
    networkMode: "always",
    retry: false,
    mutationFn: async () => {
      if (result == null || account == null) return;
      const destination = new URL(returnUrl, window.location.origin);
      destination.searchParams.set("refresh_account", "true");
      const switchResult = await switchWorkspace(
        {
          workspaceAccountId: accountId,
          workspaceName: account.name ?? null,
          workspaceImageUrl: account.profile_picture_url ?? null,
          isPersonalWorkspace: account.structure === "personal",
          isDeactivated: account.is_deactivated,
          accountResidencyRegion: account.account_residency_region,
          isFedrampCompliantWorkspace: account.is_fedramp_compliant_workspace,
          canAccessWithSession: result.can_access_with_session,
          ssoConnectionName: result.sso_connection_name,
        },
        credentialForWorkspaceSwitch(credential),
        destination.href,
      );
      if (!switchResult?.willRedirect) await openExternal(destination.href);
    },
  });

  React.useEffect(() => {
    if (
      query.isPending ||
      query.isFetching ||
      invalidAccount ||
      navigationStarted.current
    ) {
      return;
    }
    if (mustSwitchAccount) {
      if (!refreshAccount) {
        navigationStarted.current = true;
        mutation.mutate();
      }
    } else if (account.structure === "workspace") {
      navigationStarted.current = true;
      window.location.replace("/admin/billing");
    }
  }, [
    account,
    query.isFetching,
    query.isPending,
    mustSwitchAccount,
    refreshAccount,
    mutation.mutate,
    invalidAccount,
  ]);

  if (
    mutation.isError ||
    (!query.isPending &&
      !query.isFetching &&
      (invalidAccount || (mustSwitchAccount && refreshAccount)))
  ) {
    return redirect("/");
  }
  if (
    query.isPending ||
    query.isFetching ||
    account == null ||
    mustSwitchAccount ||
    account.structure !== "personal"
  ) {
    return jsx.jsx(LoadingComponent ?? "Loading", {});
  }
  if (normalizePlanType(account.plan_type) == null) {
    return redirect("/settings/account");
  }
  return jsx.jsx(SubscriptionSettingsRedirect, {});
}

function SubscriptionSettingsRedirect(): unknown {
  const billingSettingsEnabled = useFeatureFlag("2460619550");
  const flagLoading = useFeatureFlagLoading("2460619550");
  if (flagLoading) {
    return jsx.jsx(LoadingComponent ?? "Loading", {});
  }
  return redirect(
    billingSettingsEnabled ? "/settings/billing" : "/settings/account",
  );
}

function initializeSubscriptionManagementPage(): void {
  if (initialized) return;
  initialized = true;
  initializeRuntimeLazy?.();
  React = resolveRuntime<ReactRuntime>(reactRuntimeExport);
  jsx = resolveRuntime<JsxRuntime>(jsxRuntimeExport);
  initializeUseMutation?.();
  initializeUseQuery?.();
  initializeNavigation?.();
  initializeAccountRuntime?.();
  initializeSubscriptionQueries?.();
  initializeSubscriptionPlan?.();
  initializeLoadingState?.();
  initializeWorkspaceSwitch?.();
  initializeFeatureFlags?.();
}

initializeSubscriptionManagementPage();

export { SubscriptionManagementPage };
