// subscription-management-page —— account_id 驱动的订阅管理路由守卫。
// 原版：app/webview/assets/subscription-management-page-ed5a3e4b51fa.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as queriesChunk from "@rchunk/queries";

void runtimeChunk;

const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const queries = queriesChunk as Record<string, any>;

let React: any;
let jsx: any;
let initialized = false;

function redirect(to: string): unknown {
  const Navigate = appInitial.Ygn ?? "Navigate";
  return jsx.jsx(Navigate, { to, replace: true });
}

function SubscriptionManagementPage(): unknown {
  initializeSubscriptionManagementPage();
  const [searchParams] = appInitial.d_n?.() ?? [new URLSearchParams()];
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
  const { accountId: activeAccountId } = appInitial.N6t?.() ?? {};
  const queryOptions = queries.n?.(accountId);
  const query = appShared._L?.(queryOptions) ?? {
    data: undefined,
    isPending: true,
    isFetching: false,
    isError: false,
  };
  const credential = appInitial.lfn?.();
  const location = appInitial.i_n?.() ?? { search: "" };
  const returnUrl = appInitial.r_n?.(location) ?? "/";
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
  const mutation = appShared.iL?.({
    networkMode: "always",
    retry: false,
    mutationFn: async () => {
      if (result == null || account == null) return;
      const destination = new URL(returnUrl, window.location.origin);
      destination.searchParams.set("refresh_account", "true");
      const switchResult = await appInitial.Mx?.(
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
        appInitial.kx?.(credential),
        destination.href,
      );
      if (!switchResult?.willRedirect) await appInitial.Ax?.(destination.href);
    },
  }) ?? { mutate: () => {}, isError: false };

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
  const Loading = appInitial.Let ?? "Loading";
  if (
    query.isPending ||
    query.isFetching ||
    account == null ||
    mustSwitchAccount ||
    account.structure !== "personal"
  ) {
    return jsx.jsx(Loading, {});
  }
  if (appInitial.O0?.(account.plan_type) == null) {
    return redirect("/settings/account");
  }
  return jsx.jsx(SubscriptionSettingsRedirect, {});
}

function SubscriptionSettingsRedirect(): unknown {
  const billingSettingsEnabled = appInitial.ofn?.("2460619550");
  const flagLoading = appInitial.sfn?.("2460619550");
  if (flagLoading) {
    const Loading = appInitial.Let ?? "Loading";
    return jsx.jsx(Loading, {});
  }
  return redirect(
    billingSettingsEnabled ? "/settings/billing" : "/settings/account",
  );
}

function initializeSubscriptionManagementPage(): void {
  if (initialized) return;
  initialized = true;
  appShared.$3?.();
  React = typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
  jsx = typeof appShared.I3 === "function" ? appShared.I3() : appShared.I3;
  appShared.rL?.();
  appShared.gL?.();
  appInitial.Qgn?.();
  appInitial.M6t?.();
  queries.i?.();
  appInitial.j0?.();
  appInitial.Ret?.();
  appInitial.jx?.();
  appInitial.ifn?.();
}

initializeSubscriptionManagementPage();

export { SubscriptionManagementPage };
