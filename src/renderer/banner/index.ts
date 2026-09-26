// banner —— 自定义 GPT 迁移到插件的 Home banner 入口与错误回退。
// 原版：app/webview/assets/banner-ee99d8ffab06.js。

import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as chatChoiceChunk from "@rchunk/chat-choice-view";
import * as bannerContentChunk from "@rchunk/gpt-plugin-migration-banner-content";

void runtimeChunk;
const {
  $3: initializeRuntimeLazy,
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  I3: getJsxRuntime,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  ZI: applicationScope,
} = appSharedChunk;
const {
  Qgn: initializeGptResources,
  fN: gptResourceQuery,
  i_n: useLocation,
  mN: initializeAccounts,
  mfn: migrationExperimentSignal,
  o_n: useNavigate,
  pfn: initializeMigrationExperiment,
} = appInitialChunk;
const {
  Lp: initializeMigrationVisitState,
  Mp: keepUsingGptForVisit,
  Pp: migrationVisitedSignal,
} = appPrimaryChunk;
const { n: initializeChatChoiceView, t: ChatChoiceView } = chatChoiceChunk;
const { GptPluginMigrationBannerContent } = bannerContentChunk;

let jsx: ReturnType<typeof getJsxRuntime>;
let initialized = false;
function initializeGptPluginMigrationBanner(): void {
  if (initialized) return;
  initializeRuntimeLazy();
  initializeSignalRuntime();
  initializeSharedRuntime();
  initializeGptResources();
  initializeMigrationExperiment();
  initializeAccounts();
  initializeChatChoiceView();
  initializeMigrationVisitState();
  jsx = getJsxRuntime();
  initialized = true;
}

function MigrationBannerErrorFallback({
  gizmoId,
}: {
  gizmoId: string;
}): unknown {
  const scope = useSignalScope(applicationScope);
  const location = useLocation();
  const navigate = useNavigate();
  const query = useSignalFamilyValue(gptResourceQuery, gizmoId);
  const visitKey = { gizmoId, visitKey: location.pathname };
  const shouldShow = useSignalFamilyValue(migrationVisitedSignal, visitKey);
  return shouldShow && query.data?.gizmo?.migrated_plugin_id
    ? jsx.jsx(ChatChoiceView, {
        gptName: query.data.gizmo.display.name,
        accessState: "error",
        onUsePlugin: () => void navigate("/plugins"),
        onKeepUsingGpt: () => keepUsingGptForVisit(scope, visitKey),
      })
    : null;
}

function GptPluginMigrationBanner({ gizmoId }: { gizmoId: string }): unknown {
  initializeGptPluginMigrationBanner();
  const enabled = useSignalFamilyValue(
    migrationExperimentSignal,
    "2160578039",
  );
  if (!enabled) return null;
  if (GptPluginMigrationBannerContent == null)
    return jsx.jsx(MigrationBannerErrorFallback, { gizmoId });
  return jsx.jsx(GptPluginMigrationBannerContent, { gizmoId }, gizmoId);
}

initializeGptPluginMigrationBanner();
export {
  initializeGptPluginMigrationBanner as n,
  GptPluginMigrationBanner as t,
};
