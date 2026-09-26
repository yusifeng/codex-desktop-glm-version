// worktree-onboarding-state —— Home worktree 建议的持久化资格状态。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as worktreesChunk from "@rchunk/use-codex-worktrees";

void runtimeChunk;

const appInitial = appInitialChunk as Record<string, any>;
const {
  BX: useSignalFamilyValue,
  FX: initializeSignalRuntime,
  HX: useSignalValue,
  LX: useSignalScope,
  QI: initializeSharedRuntime,
  ZI: applicationScope,
  e6: reactRuntime,
  sZ: createDerivedSignal,
} = appSharedChunk;
const {
  n: useCodexWorktrees,
  t: initializeCodexWorktrees,
} = worktreesChunk;

type WorktreeOnboardingState = "dismissed" | "eligible" | "succeeded";
type RunMode = "local" | "remote" | string;

interface WorkspaceState {
  cwd: string;
  hostId: string;
  isCodexWorktree?: boolean;
  kind: string;
}

interface ReactRuntime {
  useEffect(effect: () => void, dependencies: readonly unknown[]): void;
}

type ReadableSignal<Value> = import("@rchunk/app-shared").ReadableSignal<Value>;

function resolveRuntime<Runtime>(runtimeOrFactory: unknown): Runtime {
  return (typeof runtimeOrFactory === "function"
    ? runtimeOrFactory()
    : runtimeOrFactory) as Runtime;
}

let worktreeOnboardingStateSignal = Symbol(
  "worktree-onboarding-state-v1",
) as unknown as ReadableSignal<WorktreeOnboardingState>;
let promptSuggestsWorktreesSignal = Symbol(
  "prompt-suggests-worktrees",
) as unknown as ReadableSignal<boolean>;
let React: ReactRuntime;
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
  const scope = useSignalScope(applicationScope);
  const workspace = useSignalValue<WorkspaceState>(appInitial.mdt);
  const state = useSignalValue<WorktreeOnboardingState>(
    worktreeOnboardingStateSignal,
  );
  const host = appInitial.Vfn?.(workspace.hostId);
  const projectKey = appInitial.kst?.({
    cwd: workspace.cwd,
    hostId: workspace.hostId,
  });
  const runMode = useSignalFamilyValue?.(
    appInitial.Q4,
    projectKey,
  ) as unknown as RunMode;
  const promptEligible = useSignalValue<boolean>(promptSuggestsWorktreesSignal);
  const featureEnabled = appInitial.ofn?.("2634243883") === true;
  const bannerEnabled = appInitial.ofn?.("505458") === true;
  const shouldQuery =
    enabled && state === "eligible" && featureEnabled && promptEligible;
  const query = useCodexWorktrees(host, "home_page", { enabled: shouldQuery });
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
  initializeSignalRuntime?.();
  initializeCodexWorktrees?.();
  appInitial.pdt?.();
  initializeSharedRuntime?.();
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
    createDerivedSignal(appInitial.kht, ({ get }) =>
      promptSuggestsWorktrees(get(appInitial.t3)),
    );
  React = resolveRuntime<ReactRuntime>(reactRuntime);
}

export {
  useWorktreeOnboardingState as n,
  worktreeOnboardingStateSignal as r,
  initializeWorktreeOnboardingState as t,
};
