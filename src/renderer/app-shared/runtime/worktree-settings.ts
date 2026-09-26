import { z } from "zod";

import { gitSettings } from "./git-settings";

export type WorktreeUpstreamRefreshMode = "never" | "best-effort";

export interface GlobalStateSetting<T> {
  agentAccess: "hidden" | "read-write";
  default: T;
  description: string;
  hostStorage: { kind: "global-state"; key: string };
  key: string;
  schema: z.ZodType<T>;
}

export interface WorktreeSettings {
  upstreamRefreshMode: GlobalStateSetting<WorktreeUpstreamRefreshMode>;
  autoCleanupEnabled: GlobalStateSetting<boolean>;
  keepCount: GlobalStateSetting<number>;
}

export interface ResolvedWorktreeSettings {
  worktreesRoot: string;
  autoCleanupEnabled: boolean;
  keepCount: number;
}

function globalStateSetting<T>(
  definition: Omit<GlobalStateSetting<T>, "hostStorage">,
): GlobalStateSetting<T> {
  return {
    ...definition,
    hostStorage: { kind: "global-state", key: definition.key },
  };
}

/** 原 `MV` / 压缩导出 `TU`。 */
export const worktreeSettings: WorktreeSettings = {
  upstreamRefreshMode: globalStateSetting({
    agentAccess: "hidden",
    default: "never",
    description: "How Codex refreshes upstream branches before creating worktrees",
    key: "worktree-upstream-refresh-mode",
    schema: z.enum(["never", "best-effort"]),
  }),
  autoCleanupEnabled: globalStateSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether Codex automatically cleans up old worktrees",
    key: "worktree-auto-cleanup-enabled",
    schema: z.boolean(),
  }),
  keepCount: globalStateSetting({
    agentAccess: "read-write",
    default: 15,
    description: "How many recent worktrees Codex keeps",
    key: "worktree-keep-count",
    schema: z.number().int().min(1),
  }),
};

/** 原 `NV` / 压缩导出 `wU`。 */
export function initializeWorktreeSettings(): void {}

/** 原 `WBe` / 压缩导出 `SU`。 */
export function resolveWorktreeSettings(
  values?: Readonly<Record<string, unknown>> | null,
): ResolvedWorktreeSettings {
  const worktreesRoot = gitSettings.worktreeRoot.schema.safeParse(
    values?.[gitSettings.worktreeRoot.key],
  );
  const autoCleanupEnabled = worktreeSettings.autoCleanupEnabled.schema.safeParse(
    values?.[worktreeSettings.autoCleanupEnabled.key],
  );
  const keepCount = worktreeSettings.keepCount.schema.safeParse(
    values?.[worktreeSettings.keepCount.key],
  );
  return {
    worktreesRoot: worktreesRoot.success
      ? worktreesRoot.data
      : gitSettings.worktreeRoot.default,
    autoCleanupEnabled: autoCleanupEnabled.success
      ? autoCleanupEnabled.data
      : worktreeSettings.autoCleanupEnabled.default,
    keepCount: keepCount.success
      ? keepCount.data
      : worktreeSettings.keepCount.default,
  };
}

/** 原 `PV` / 压缩导出 `CU`。 */
export function initializeGitAndWorktreeSettings(): void {}
