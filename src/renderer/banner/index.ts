// banner —— 自定义 GPT 迁移到插件的 Home banner 入口与错误回退。
// 原版：app/webview/assets/banner-ee99d8ffab06.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as chatChoiceChunk from "@rchunk/chat-choice-view";
import * as bannerContentChunk from "@rchunk/gpt-plugin-migration-banner-content";

void runtimeChunk;
const appShared = appSharedChunk as Record<string, any>;
const appInitial = appInitialChunk as Record<string, any>;
const appPrimary = appPrimaryChunk as Record<string, any>;
const chatChoice = chatChoiceChunk as Record<string, any>;
const bannerContent = bannerContentChunk as Record<string, any>;

let jsx: any;
let initialized = false;
function initializeGptPluginMigrationBanner(): void {
  if (initialized) return;
  appShared.$3?.();
  appShared.FX?.();
  appShared.QI?.();
  appInitial.Qgn?.();
  appInitial.pfn?.();
  appInitial.mN?.();
  chatChoice.n?.();
  appPrimary.Lp?.();
  jsx = appShared.I3?.();
  initialized = true;
}

function MigrationBannerErrorFallback({
  gizmoId,
}: {
  gizmoId: string;
}): unknown {
  const scope = appShared.LX?.(appShared.ZI);
  const location = appInitial.i_n?.() ?? { pathname: "/" };
  const navigate = appInitial.o_n?.() ?? (() => {});
  const query = appShared.BX?.(appInitial.fN, gizmoId) ?? {};
  const visitKey = { gizmoId, visitKey: location.pathname };
  const shouldShow = appShared.BX?.(appPrimary.Pp, visitKey);
  const ChoiceView = chatChoice.t;
  return shouldShow && query.data?.gizmo?.migrated_plugin_id
    ? jsx.jsx(ChoiceView, {
        gptName: query.data.gizmo.display.name,
        accessState: "error",
        onUsePlugin: () => void navigate("/plugins"),
        onKeepUsingGpt: () => appPrimary.Mp?.(scope, visitKey),
      })
    : null;
}

function GptPluginMigrationBanner({ gizmoId }: { gizmoId: string }): unknown {
  initializeGptPluginMigrationBanner();
  const enabled = appShared.BX?.(appInitial.mfn, "2160578039");
  if (!enabled) return null;
  const Content = bannerContent.GptPluginMigrationBannerContent;
  if (Content == null)
    return jsx.jsx(MigrationBannerErrorFallback, { gizmoId });
  return jsx.jsx(Content, { gizmoId }, gizmoId);
}

initializeGptPluginMigrationBanner();
export {
  initializeGptPluginMigrationBanner as n,
  GptPluginMigrationBanner as t,
};
