// gpt-header-about-dialog —— GPT 头部关于弹窗的账户策略与导航宿主。
// 原版：app/webview/assets/gpt-header-about-dialog-920bca8413c4.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as gptAboutDialogChunk from "@rchunk/gpt-about-dialog-core";
import type { JsxRuntime } from "@rchunk/app-shared";

void runtimeChunk;

interface GptGizmo {
  id: string;
  short_url?: string | null;
}

const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  I3: getJsxRuntime,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  ZI: applicationScope,
} = appSharedChunk;
const {
  Dln: workspacePermissionsQuery,
  F7: clearSelectedResource,
  Het: initializeComposerMode,
  Jet: setComposerMode,
  Oln: initializeNavigation,
  P7: initializeSelectedResource,
  Qgn: initializeGptResources,
  Sun: initializeGptPermissions,
  mun: activeAccountIdSignal,
  o_n: useNavigate,
  rht: initializeAccountQuery,
  uht: useAccountQuery,
  xtn: initializeGptRoutes,
  ytn: gptRoute,
} = appInitialChunk;
const {
  n: initializeGptAboutDialog,
  t: GptAboutDialog,
} = gptAboutDialogChunk;

const jsx: JsxRuntime = getJsxRuntime();

function GptHeaderAboutDialog({
  accountId,
  resource,
  onClose,
}: {
  accountId?: string;
  resource: GptGizmo;
  onClose: () => void;
}): unknown {
  const scope = useSignalScope(applicationScope);
  const navigate = useNavigate();
  const activeAccountId = useSignalValue(activeAccountIdSignal);
  const { data: account } = useAccountQuery(undefined, { preview: false });
  const isWorkspaceOwner =
    account?.id === accountId &&
    account?.structure === "workspace" &&
    account.account_user_role === "account-owner";
  const canLoadPolicy = activeAccountId === accountId && isWorkspaceOwner;
  const { data: workspacePolicy } = useSignalFamilyValue(
    workspacePermissionsQuery,
    accountId ?? "",
    { enabled: canLoadPolicy },
  );

  if (activeAccountId !== accountId) return null;
  return jsx.jsx(GptAboutDialog, {
    accountId,
    gizmo: resource,
    isOwnerAndWorkspaceAllowsSpecific:
      isWorkspaceOwner &&
      workspacePolicy?.allow_third_party_gpts === "allow_specific",
    onClose,
    onStartChat: (selected: { gizmo: GptGizmo }) => {
      onClose();
      clearSelectedResource(scope, null);
      setComposerMode(scope, "chat");
      navigate(gptRoute(selected.gizmo.short_url?.trim() || selected.gizmo.id));
    },
  });
}

function initializeGptHeaderAboutDialog(): void {
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeGptResources();
  initializeGptPermissions();
  initializeNavigation();
  initializeAccountQuery();
  initializeComposerMode();
  initializeSelectedResource();
  initializeSharedRuntime();
  initializeGptAboutDialog();
  initializeGptRoutes();
}

initializeGptHeaderAboutDialog();

export { GptHeaderAboutDialog };
