// gpt-header-about-dialog —— GPT 头部关于弹窗的账户策略与导航宿主。
// 原版：app/webview/assets/gpt-header-about-dialog-920bca8413c4.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as gptAboutDialogChunk from "@rchunk/gpt-about-dialog-core";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const gptAboutDialog = gptAboutDialogChunk as Record<string, any>;

const jsx = appShared.I3();

function GptHeaderAboutDialog({
  accountId,
  resource,
  onClose,
}: {
  accountId?: string;
  resource: any;
  onClose: () => void;
}) {
  const scope = appShared.LX(appShared.ZI);
  const navigate = appInitial.o_n();
  const activeAccountId = appShared.HX(appInitial.mun);
  const { data: account } = appInitial.uht(undefined, { preview: false });
  const isWorkspaceOwner =
    account?.id === accountId &&
    account?.structure === "workspace" &&
    account.account_user_role === "account-owner";
  const canLoadPolicy = activeAccountId === accountId && isWorkspaceOwner;
  const { data: workspacePolicy } = appShared.BX(
    appInitial.Dln,
    accountId ?? "",
    { enabled: canLoadPolicy },
  );

  if (activeAccountId !== accountId) return null;
  return jsx.jsx(gptAboutDialog.t, {
    accountId,
    gizmo: resource,
    isOwnerAndWorkspaceAllowsSpecific:
      isWorkspaceOwner &&
      workspacePolicy?.allow_third_party_gpts === "allow_specific",
    onClose,
    onStartChat: (selected: any) => {
      onClose();
      appInitial.F7(scope, null);
      appInitial.Jet(scope, "chat");
      navigate(
        appInitial.ytn(selected.gizmo.short_url?.trim() || selected.gizmo.id),
      );
    },
  });
}

function initializeGptHeaderAboutDialog(): void {
  appShared.$3?.();
  appShared.FX?.();
  appInitial.Qgn?.();
  appInitial.Sun?.();
  appInitial.Oln?.();
  appInitial.rht?.();
  appInitial.Het?.();
  appInitial.P7?.();
  appShared.QI?.();
  gptAboutDialog.n?.();
  appInitial.xtn?.();
}

initializeGptHeaderAboutDialog();

export { GptHeaderAboutDialog };
