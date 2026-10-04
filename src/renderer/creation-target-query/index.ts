import "@rchunk/rolldown-runtime";
import {
  $O as timeConstants,
  FX as initializeSignalRuntime,
  QI as initializeScopedSignals,
  QX as createScopedQuery,
  ZI as conversationIdScope,
  ek as initializeQueryRuntime,
  wL as initializeUtilities,
} from "@rchunk/app-shared";
import { parseGitRemoteUrl } from "../app-shared/runtime/parse-git-remote-url";
import {
  $sn as initializeExternalResources,
  AXt as initializeGitQueries,
  Af as fetchGitLabProject,
  CSt as initializeGitOriginsQuery,
  Ff as initializeGitLabCapabilities,
  If as ensureGitLabAccount,
  NXt as gitLabCreationTargetEnabled,
  PXt as initializeGitLabQueries,
  Pf as getGitLabCapability,
  SSt as gitOriginsQuery,
  _cn as initializeWorkspaceFileState,
  jcn as hostConfigById,
  kXt as gitConfigValueQuery,
  kf as initializeCreationTargets,
  ncn as gitLabAccountQuery,
} from "@rchunk/app-initial";

export interface CreationTargetInput {
  cwd: string;
  hostId: string;
}

let creationTargetQuery: unknown;

function initializeCreationTargetQuery(): void {
  initializeSignalRuntime();
  initializeUtilities();
  initializeGitQueries();
  initializeGitOriginsQuery();
  initializeExternalResources();
  initializeScopedSignals();
  initializeWorkspaceFileState();
  initializeQueryRuntime();
  initializeGitLabQueries();
  initializeGitLabCapabilities();
  initializeCreationTargets();

  creationTargetQuery = createScopedQuery(
    conversationIdScope,
    (
      input: CreationTargetInput,
      {
        get,
        scope,
      }: {
        get(signal: unknown, parameter?: unknown): unknown;
        scope: unknown;
      },
    ) => {
      const enabled = get(gitLabCreationTargetEnabled) === true;
      const upstreamQuery = get(gitConfigValueQuery, {
        enabled,
        key: "remote.upstream.url",
        lookup: { cwd: input.cwd, hostConfig: get(hostConfigById, input.hostId) },
        operationSource: "local_conversation_git_actions",
        retainRepoWatch: false,
        scope: "local",
        staleTime: timeConstants.ONE_MINUTE,
      }) as {
        data?: string | null;
        isPlaceholderData: boolean;
        isSuccess: boolean;
      };
      const originsQuery = get(gitOriginsQuery, {
        params: { dirs: [input.cwd], hostId: input.hostId },
        source: "local_conversation_git_actions",
      }) as {
        data: { origins: Array<{ originUrl?: string }> };
        isPlaceholderData: boolean;
        isSuccess: boolean;
      };
      const origin =
        originsQuery.isSuccess && !originsQuery.isPlaceholderData
          ? parseGitRemoteUrl(originsQuery.data.origins[0]?.originUrl ?? "")
          : null;
      let upstream = null;
      if (upstreamQuery.isSuccess && !upstreamQuery.isPlaceholderData) {
        upstream = upstreamQuery.data?.trim()
          ? parseGitRemoteUrl(upstreamQuery.data)
          : origin;
      }
      const accountQuery =
        enabled && upstream?.host.toLowerCase() === "gitlab.com"
          ? (get(gitLabAccountQuery, input.hostId) as { data?: unknown })
          : null;
      const capability =
        accountQuery?.data == null ? null : getGitLabCapability(accountQuery.data, "create");
      return {
        enabled:
          enabled &&
          origin?.host.toLowerCase() === "gitlab.com" &&
          upstream?.host.toLowerCase() === "gitlab.com" &&
          capability != null,
        queryKey: [
          "gitlab-creation-target-project",
          input.hostId,
          input.cwd,
          origin,
          upstream,
          (capability as { accountLinkId?: string } | null)?.accountLinkId,
        ],
        queryFn: async ({ signal }: { signal: AbortSignal }) => {
          if (upstream == null || capability == null) return null;
          await ensureGitLabAccount(scope, capability);
          signal.throwIfAborted();
          const projectName = `${upstream.owner}/${upstream.repo}`;
          const project = (await fetchGitLabProject(
            scope,
            input.hostId,
            capability,
            projectName,
          )) as { default_branch?: string | null; id: string; path_with_namespace: string };
          signal.throwIfAborted();
          if (project.path_with_namespace.toLowerCase() !== projectName.toLowerCase()) {
            throw new Error("The selected GitLab project does not match the task");
          }
          return {
            id: project.id,
            projectPath: project.path_with_namespace,
            defaultBranch: project.default_branch ?? null,
          };
        },
        staleTime: timeConstants.ONE_MINUTE,
        retry: false,
      };
    },
  );
}

export { initializeCreationTargetQuery as n, creationTargetQuery as t };
