// onboarding 交互工具参数 schema 的公开入口。
import * as appInitialChunk from "@rchunk/app-initial";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

const appInitial = appInitialChunk as Record<string, any>;
void runtimeChunk;
appInitial.b_n?.();

export const setupCodexStepArgumentsSchema = appInitial.C_n;
