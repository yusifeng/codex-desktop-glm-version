import "@rchunk/rolldown-runtime";
import {
  $3 as initializeCompilerRuntime,
  CL as useQueryClient,
  FX as initializeSignalRuntime,
  K2 as initializeIntlComponents,
  LX as useScope,
  QI as initializeQueryRuntime,
  SL as initializeQueryClient,
  ZI as appScope,
  iL as useMutation,
  iW as normalizePath,
  lk as initializeToastRuntime,
  n4 as useIntl,
  pk as toastManagerSignal,
  rL as initializeMutationRuntime,
  wL as initializeWindowRuntime,
} from "@rchunk/app-shared";
import {
  $ln as queryKey,
  Con as initializeHostConfig,
  _on as getHostConfigId,
  nun as initializeHostCommands,
  won as getHostCommandClient,
} from "@rchunk/app-initial";

interface CreateGitRepositoryOptions {
  cwd?: string | null;
  hostConfig: unknown;
  onErrorMessage?(message: string): void;
  showErrorToast?: boolean;
}

function useCreateGitRepository({
  cwd,
  hostConfig,
  onErrorMessage,
  showErrorToast = false,
}: CreateGitRepositoryOptions) {
  const scope = useScope(appScope);
  const queryClient = useQueryClient();
  const intl = useIntl();
  const hostConfigId = getHostConfigId(hostConfig);
  const mutation = useMutation({
    mutationKey: ["git", "init-repo", hostConfigId, cwd ?? ""],
    mutationFn: async () => {
      if (cwd == null) throw new Error("Missing git context");
      await getHostCommandClient("git").request({
        method: "git-init-repo",
        params: {
          cwd: normalizePath(cwd),
          hostConfig,
          operationSource: "review_model",
        },
      });
    },
    onSuccess: async () => {
      scope.get(toastManagerSignal).success(String(intl.formatMessage({
        id: "codex.review.noDiff.gitInit.success",
        defaultMessage: "Git repository created",
        description: "Toast shown after creating a git repository from the diff empty state",
      })));
      const invalidations = [queryClient.invalidateQueries({ queryKey: queryKey("git-origins") })];
      if (cwd != null) invalidations.push(queryClient.invalidateQueries({
        queryKey: ["git", "metadata", hostConfigId, cwd],
      }));
      await Promise.all(invalidations);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      if (showErrorToast) {
        scope.get(toastManagerSignal).danger(String(intl.formatMessage({
          id: "codex.review.noDiff.gitInit.error",
          defaultMessage: "Git init failed: {message}",
          description: "Error text shown when git initialization fails from the diff empty state",
        }, { message })), {
          errorAnalytics: { toastId: "codex.review.noDiff.gitInit.error" },
        });
      }
      onErrorMessage?.(message);
    },
  });
  return {
    canCreateGitRepository: cwd != null,
    createGitRepository: async () => {
      if (cwd == null || mutation.isPending) return;
      try { await mutation.mutateAsync(); } catch { return; }
    },
    isCreatingGitRepository: mutation.isPending,
  };
}

function initializeUseCreateGitRepository(): void {
  initializeCompilerRuntime();
  initializeMutationRuntime();
  initializeQueryClient();
  initializeSignalRuntime();
  initializeWindowRuntime();
  initializeIntlComponents();
  initializeToastRuntime();
  initializeQueryRuntime();
  initializeHostCommands();
  initializeHostConfig();
}

export { useCreateGitRepository as n, initializeUseCreateGitRepository as t };
