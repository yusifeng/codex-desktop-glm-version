// onboarding 交互工具参数 schema 的公开入口。
import * as appInitialChunk from "@rchunk/app-initial";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

const {
  C_n: setupCodexStepArgumentsSchema,
  b_n: initializeOnboardingInteractiveTools,
} = appInitialChunk;

void runtimeChunk;
initializeOnboardingInteractiveTools();

export { setupCodexStepArgumentsSchema };
