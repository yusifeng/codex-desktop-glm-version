// worktree-onboarding-state —— Home worktree 建议的持久化资格状态。

import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as worktreesChunk from "@rchunk/use-codex-worktrees";
import type {
  ReactRuntime,
  ScopedDerivedSignal,
  ScopedSignal,
} from "@rchunk/app-shared";

void runtimeChunk;

const {
  $3: initializeJsxRuntime,
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
  Bfn: initializeHostFeatures,
  Q4: runModeByProjectFamily,
  Rht: initializeRunMode,
  Vfn: getHostById,
  dun: createPersistedSignal,
  ifn: initializeExperiments,
  jst: initializePromptState,
  kht: onboardingScope,
  kst: createProjectKey,
  mdt: workspaceStateSignal,
  ofn: isFeatureGateEnabled,
  pdt: initializeWorkspaceState,
  t3: promptSignal,
  uun: initializeLocalHost,
  x3: initializeProjectKey,
} = appInitialChunk;
const {
  n: useCodexWorktrees,
  t: initializeCodexWorktrees,
} = worktreesChunk;

type WorktreeOnboardingState = "dismissed" | "eligible" | "succeeded";

let worktreeOnboardingStateSignal: ScopedSignal<
  Record<string, unknown>,
  WorktreeOnboardingState
>;
let promptSuggestsWorktreesSignal: ScopedDerivedSignal<
  Record<string, unknown>,
  boolean
>;
let React: ReactRuntime | null = null;
let initialized = false;

interface UseWorktreeOnboardingStateOptions {
  enabled: boolean;
  entryPoint: string;
  isLocalModeRemote?: boolean;
}

function promptSuggestsWorktrees(prompt: string): boolean {
  return /\b(?:worktrees?|parallel|another task|separate task|isolat(?:e|ed|ion)|keep my changes|without disturbing)\b/i.test(
    prompt.trim(),
  );
}

function useWorktreeOnboardingState({
  enabled,
  entryPoint,
  isLocalModeRemote = false,
}: UseWorktreeOnboardingStateOptions): { isEligible: boolean } {
  initializeWorktreeOnboardingState();
  if (React == null) {
    throw new Error("Worktree onboarding React runtime failed to initialize");
  }
  const scope = useSignalScope(applicationScope);
  const workspace = useSignalValue(workspaceStateSignal);
  const state = useSignalValue(worktreeOnboardingStateSignal);
  const host = getHostById(workspace.hostId);
  const projectKey = createProjectKey({
    cwd: workspace.cwd,
    hostId: workspace.hostId,
  });
  const runMode = useSignalFamilyValue(runModeByProjectFamily, projectKey);
  const promptEligible = useSignalValue(promptSuggestsWorktreesSignal);
  const featureEnabled = isFeatureGateEnabled("2634243883");
  const bannerEnabled = isFeatureGateEnabled("505458");
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
  initializeJsxRuntime?.();
  initializeSignalRuntime?.();
  React =
    typeof reactRuntime === "function" ? reactRuntime() : reactRuntime;
  initializeCodexWorktrees?.();
  initializeWorkspaceState?.();
  initializeSharedRuntime?.();
  initializeRunMode?.();
  initializeHostFeatures?.();
  initializeExperiments?.();
  initializeLocalHost?.();
  initializePromptState?.();
  initializeProjectKey?.();
  worktreeOnboardingStateSignal = createPersistedSignal<WorktreeOnboardingState>(
    "worktree-onboarding-state-v1",
    "eligible",
  );
  promptSuggestsWorktreesSignal = createDerivedSignal(
    onboardingScope,
    ({ get }) => promptSuggestsWorktrees(get(promptSignal)),
  );
}

export {
  useWorktreeOnboardingState as n,
  worktreeOnboardingStateSignal as r,
  initializeWorktreeOnboardingState as t,
};
