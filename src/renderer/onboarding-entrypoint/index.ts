// onboarding-entrypoint —— 登录 onboarding 入口的持久化状态。

import * as appInitialChunk from "@rchunk/app-initial";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import type { ScopedSignal } from "@rchunk/app-shared";

void runtimeChunk;

const {
  dun: createPersistedSignal,
  uun: initializeLocalHost,
} = appInitialChunk;

type OnboardingLoginEntrypoint = string | undefined;

let onboardingLoginEntrypointSignal: ScopedSignal<
  Record<string, unknown>,
  OnboardingLoginEntrypoint
>;
let initialized = false;

function initializeOnboardingEntrypoint(): void {
  if (initialized) return;
  initialized = true;
  initializeLocalHost();
  onboardingLoginEntrypointSignal =
    createPersistedSignal<OnboardingLoginEntrypoint>(
      "electron:onboarding-login-entrypoint",
      undefined,
    );
}

export {
  onboardingLoginEntrypointSignal as n,
  initializeOnboardingEntrypoint as t,
};
