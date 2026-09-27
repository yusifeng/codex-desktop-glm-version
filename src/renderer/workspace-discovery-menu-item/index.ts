import {
  BX as useSignalFamilyValue,
  I3 as getJsxRuntime,
  LX as useScope,
  Y2 as FormattedMessage,
  ZI as appScope,
  bS as BuildingIcon,
  jf as Menu,
  qv as SearchIcon,
} from "@rchunk/app-shared";
import {
  M6t as initializeAuthState,
  N6t as useAuthState,
  Ox as normalizeAccounts,
  Uzt as openModal,
  Wln as isWorkspacePlan,
  iht as useAccountsQuery,
  mC as workspacesQuery,
  xpn as recordAnalytics,
} from "@rchunk/app-initial";
import {
  c as isWorkspaceDiscoveryEligible,
  i as initializeWorkspaceDiscoveryAnalytics,
  l as initializeWorkspaceDiscoveryState,
  n as initializeWorkspaceDiscovery,
  r as workspaceDiscoveryOpenedEvent,
  t as WorkspaceDiscoveryDialog,
} from "@rchunk/workspace-discovery";

export interface WorkspaceDiscoveryMenuItemProps {
  onSelect?(): void;
  placement: "account" | "profile";
}

function WorkspaceDiscoveryMenuItem({
  placement,
  onSelect,
}: WorkspaceDiscoveryMenuItemProps): unknown {
  const scope = useScope(appScope);
  const { userId, accountId, authMethod } = useAuthState();
  const identity = { userId: userId ?? null, accountId: accountId ?? null };
  const { data: workspaceDiscovery } = useSignalFamilyValue(
    workspacesQuery,
    identity,
  );
  const { data: accountsResponse } = useAccountsQuery();
  const accounts = normalizeAccounts(accountsResponse).filter(
    (account: { isDeactivated?: boolean }) => !account.isDeactivated,
  );
  const onlyPersonal =
    accounts.length === 1 && accounts[0]?.isPersonalWorkspace === true;

  if (
    authMethod !== "chatgpt" ||
    workspaceDiscovery == null ||
    accountsResponse == null ||
    accountsResponse.accounts?.some((account: { plan_type?: unknown }) =>
      isWorkspacePlan(account.plan_type),
    ) ||
    (placement === "profile") !== onlyPersonal ||
    !(
      isWorkspaceDiscoveryEligible(workspaceDiscovery) ||
      (placement === "account" &&
        accounts.some(
          (account: { isPersonalWorkspace?: boolean }) =>
            !account.isPersonalWorkspace,
        ))
    )
  ) {
    return null;
  }

  const jsx = getJsxRuntime();
  const icon = jsx.jsx(placement === "profile" ? SearchIcon : BuildingIcon, {});
  const label =
    placement === "profile"
      ? jsx.jsx(FormattedMessage, {
          id: "workspaceDiscovery.find",
          defaultMessage: "Find workspaces",
          description: "Profile menu item that opens workspace discovery",
        })
      : jsx.jsx(FormattedMessage, {
          id: "workspaceDiscovery.createOrJoin",
          defaultMessage: "Create or join a workspace",
          description:
            "Account submenu item that opens workspace discovery and creation",
        });

  return jsx.jsx(Menu.Item, {
    leftIcon: icon,
    onSelect: () => {
      onSelect?.();
      recordAnalytics(scope, workspaceDiscoveryOpenedEvent, {
        location: "expanded_sidebar",
      });
      openModal(scope, WorkspaceDiscoveryDialog, {
        mode: "dismissible" as const,
        section: "discoverable" as const,
      });
    },
    children: label,
  });
}

function initializeWorkspaceDiscoveryMenuItem(): void {
  initializeWorkspaceDiscoveryAnalytics();
  initializeAuthState();
  initializeWorkspaceDiscoveryState();
  initializeWorkspaceDiscovery();
}

initializeWorkspaceDiscoveryMenuItem();

export { WorkspaceDiscoveryMenuItem };
