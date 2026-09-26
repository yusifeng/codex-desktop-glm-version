// onboarding-entrypoint —— 登录 onboarding 入口的持久化状态。

import * as appInitialChunk from "@rchunk/app-initial";
import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;

let onboardingLoginEntrypointSignal: unknown = Symbol(
  "electron:onboarding-login-entrypoint",
);
let initialized = false;

function initializeOnboardingEntrypoint(): void {
  if (initialized) return;
  initialized = true;
  appInitial.uun?.();
  if (typeof appInitial.dun === "function") {
    onboardingLoginEntrypointSignal = appInitial.dun(
      "electron:onboarding-login-entrypoint",
      undefined,
    );
  }
}

export {
  onboardingLoginEntrypointSignal as n,
  initializeOnboardingEntrypoint as t,
};
