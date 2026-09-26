// worktree-onboarding-state —— Home worktree 建议的持久化资格状态。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as worktreesChunk from "@rchunk/use-codex-worktrees";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const appShared = appSharedChunk as Record<string, any>;
const worktrees = worktreesChunk as Record<string, any>;

let worktreeOnboardingStateSignal: unknown = Symbol(
  "worktree-onboarding-state-v1",
);
let promptSuggestsWorktreesSignal: unknown = Symbol(
  "prompt-suggests-worktrees",
);
let React: any;
let initialized = false;

function promptSuggestsWorktrees(prompt: string): boolean {
  return /\b(?:worktrees?|parallel|another task|separate task|isolat(?:e|ed|ion)|keep my changes|without disturbing)\b/i.test(
    prompt.trim(),
  );
}

function useWorktreeOnboardingState({
  enabled,
  entryPoint,
  isLocalModeRemote = false,
}: {
  enabled: boolean;
  entryPoint: string;
  isLocalModeRemote?: boolean;
}): { isEligible: boolean } {
  initializeWorktreeOnboardingState();
  const scope = appShared.LX(appShared.ZI);
  const workspace = appShared.HX(appInitial.mdt);
  const state = appShared.HX(worktreeOnboardingStateSignal);
  const host = appInitial.Vfn?.(workspace.hostId);
  const projectKey = appInitial.kst?.({
    cwd: workspace.cwd,
    hostId: workspace.hostId,
  });
  const runMode = appShared.BX?.(appInitial.Q4, projectKey);
  const promptEligible = appShared.HX(promptSuggestsWorktreesSignal);
  const featureEnabled = appInitial.ofn?.("2634243883") === true;
  const bannerEnabled = appInitial.ofn?.("505458") === true;
  const shouldQuery =
    enabled && state === "eligible" && featureEnabled && promptEligible;
  const query = worktrees.n(host, "home_page", { enabled: shouldQuery });
  const hasWorktrees = (query.data?.worktrees?.length ?? 0) > 0;
  React.useEffect(() => {
    if (
      workspace.hostId === "local" &&
      (workspace.isCodexWorktree || hasWorktrees) &&
      scope.get(worktreeOnboardingStateSignal) === "eligible"
    ) {
      scope.set(worktreeOnboardingStateSignal, "succeeded");
    }
  }, [hasWorktrees, scope, workspace]);
  return {
    isEligible:
      shouldQuery &&
      bannerEnabled &&
      workspace.kind === "git" &&
      runMode === "local" &&
      query.data != null &&
      !hasWorktrees &&
      entryPoint === "codex" &&
      workspace.hostId === "local" &&
      !isLocalModeRemote,
  };
}

function initializeWorktreeOnboardingState(): void {
  if (initialized) return;
  initialized = true;
  appShared.FX?.();
  worktrees.t?.();
  appInitial.pdt?.();
  appShared.QI?.();
  appInitial.Rht?.();
  appInitial.Bfn?.();
  appInitial.ifn?.();
  appInitial.uun?.();
  appInitial.jst?.();
  appInitial.x3?.();
  worktreeOnboardingStateSignal =
    appInitial.dun?.("worktree-onboarding-state-v1", "eligible") ??
    worktreeOnboardingStateSignal;
  promptSuggestsWorktreesSignal =
    appShared.sZ?.(appInitial.kht, ({ get }: any) =>
      promptSuggestsWorktrees(get(appInitial.t3)),
    ) ?? promptSuggestsWorktreesSignal;
  React = typeof appShared.e6 === "function" ? appShared.e6() : appShared.e6;
}

export {
  useWorktreeOnboardingState as n,
  worktreeOnboardingStateSignal as r,
  initializeWorktreeOnboardingState as t,
};
