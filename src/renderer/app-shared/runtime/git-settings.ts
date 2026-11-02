import { z } from "@rchunk/renderer-zod-runtime";

export type PullRequestMergeMethod = "merge" | "squash";
export type GitReviewMode = "full" | "last-turn-only";
export type GitSettingAgentAccess = "read-write" | "read-only";

export interface GitGlobalStateSetting<TDefault, TStored = TDefault> {
  agentAccess: GitSettingAgentAccess;
  default: TDefault;
  description: string;
  hostStorage: { kind: "global-state"; key: string };
  key: string;
  schema: z.ZodType<TStored>;
}

function globalStateSetting<TDefault, TStored = TDefault>(
  definition: Omit<GitGlobalStateSetting<TDefault, TStored>, "hostStorage">,
): GitGlobalStateSetting<TDefault, TStored> {
  return {
    ...definition,
    hostStorage: { kind: "global-state", key: definition.key },
  };
}

/** 原 `AV` / 压缩导出 `EU`。 */
export const gitSettings = {
  branchPrefix: globalStateSetting({
    agentAccess: "read-write",
    default: "codex/",
    description: "Prefix for branches Codex creates",
    key: "git-branch-prefix",
    schema: z.string(),
  }),
  alwaysForcePush: globalStateSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether Codex always force-pushes branches",
    key: "git-always-force-push",
    schema: z.boolean(),
  }),
  createPullRequestAsDraft: globalStateSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether Codex creates pull requests as drafts",
    key: "git-create-pull-request-as-draft",
    schema: z.boolean(),
  }),
  pullRequestMergeMethod: globalStateSetting<PullRequestMergeMethod>({
    agentAccess: "read-write",
    default: "merge",
    description: "Preferred pull request merge method",
    key: "git-pull-request-merge-method",
    schema: z.enum(["merge", "squash"]),
  }),
  reviewMode: globalStateSetting<GitReviewMode>({
    agentAccess: "read-write",
    default: "full",
    description:
      "Whether Git Review uses all sources or only recorded Last Turn changes",
    key: "git-review-mode",
    schema: z.enum(["full", "last-turn-only"]),
  }),
  showSidebarPrIcons: globalStateSetting<boolean | undefined, boolean>({
    agentAccess: "read-write",
    default: undefined,
    description: "Whether sidebar pull request icons are shown",
    key: "git-show-sidebar-pr-icons",
    schema: z.boolean(),
  }),
  worktreeRoot: globalStateSetting({
    agentAccess: "read-write",
    default: "",
    description: "Directory where Codex creates managed git worktrees",
    key: "git-worktree-root",
    schema: z.string(),
  }),
  commitInstructions: globalStateSetting({
    agentAccess: "read-only",
    default: "",
    description: "Custom git commit instructions",
    key: "git-commit-instructions",
    schema: z.string(),
  }),
  pullRequestInstructions: globalStateSetting({
    agentAccess: "read-only",
    default: "",
    description: "Custom pull request instructions",
    key: "git-pr-instructions",
    schema: z.string(),
  }),
  pullRequestWatchAutoMerge: globalStateSetting({
    agentAccess: "read-only",
    default: false,
    description: "Whether watched pull requests are merged when ready",
    key: "git-pr-watch-auto-merge",
    schema: z.boolean(),
  }),
  pullRequestWatchInstructions: globalStateSetting({
    agentAccess: "read-only",
    default: "",
    description: "Custom instructions for watching and fixing pull requests",
    key: "git-pr-watch-instructions",
    schema: z.string(),
  }),
} as const;

export type GitSettings = typeof gitSettings;

/** 原 `jV` / 压缩导出 `DU`。 */
export function initializeGitSettings(): void {}
