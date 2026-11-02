// shared chunk：host 配置与 git source（host-config 分区，
// hosts-wsl-plugins 子区）。
//
// 对应 src-DldfpmrL.ts 的 L20,112-20,183 区段：
//   - gT（js）：`x-codex-git-source` header key
//   - _T + yT（Is）：git source 特性名集合判定（80 项：composer/
//     worktree/review/sidebar 等 hook 名）
//   - vT + bT：git 工具名集合（apply-patch/git-checkout-branch 等 8 项）
//   - CT（Ns）：恒等（消费名 expandHomeDir/normalizeProjectPath）
//   - wT（_s）= `durable`；TT = `remote-control`
//   - ET（Cs）：durable host 判定
//   - DT/OT（bs）/kT：host id 构造（remote-ssh-discovered:/
//     remote-control:/remote-wsl: + encodeURIComponent）
//   - AT：ssh 目标参数（alias 优先，否则 -i/-p/hostname）
//   - jT/MT/NT：连接 source 判定（codex-managed|discovered / wsl /
//     remote-control）
//   - PT/FT（Os）/IT/LT（Es）：host kind 判定
//     （remote-control/ssh/wsl → isRemoteHostConfig）
//
// 兼容导出：js/Is/Ns/_s/Cs/bs/Os/Es。

// ---------------------------------------------------------------------------
// git source（原 `gT`/`_T`/`yT`/`vT`/`bT`）
// ---------------------------------------------------------------------------

/** git source header key（原 `gT`，导出 `js`）。 */
export const GIT_SOURCE_HEADER_KEY = "x-codex-git-source";

/** git source 特性名集合（原 `_T`，80 项）。 */
const GIT_SOURCE_FEATURES = new Set(
  "apply_worktree.artifact_preview.async_task_starting_state_dropdown.base_branch_query.commit_modal.composer_branch_switcher.composer_content.composer_worktree_source.cloud_follow_up_local_remote_dropdown.create_pull_request_modal.diff_context_menu.diff_comment_sources.fork_conversation_actions.git_action_directives.git_branch_search.git_config_value.git_direct_call.git_query_invalidation.git_query_watch.git_root_lookup.git_stable_metadata.hotkey_window_worktree_source.hotkey_window_home_page.home_ambient_suggestions.home_page.local_environment_editor.local_remote_dropdown.local_conversation_action_compound_button.local_conversation_thread.local_conversation_git_actions.local_conversation_git_summary.local_thread_hover_card.move_to_local_dialog.move_to_host_worktree.move_to_worktree_dialog.onboarding_workspace_select.pull_requests_page.pull_request_board.remote_conversation_apply_diff.recommended_skills_refresh.run_action_setup_popover.review_model.review_patch.review_search.review_command_registration.review_mode_content.sidebar_recent_filter.sidebar_task_pr_chip.sidebar_threads_section.sidebar_workspace_groups.sidebar_workspace_task_groups_task_dirs.sidebar_workspace_task_groups_workspace_dirs.startup_prefetch.thread_diff.turn_diff_analytics.thread_start_git_info.use_checkout_git_branch.use_create_git_branch.use_git_push_mutation.use_local_conversation_environment.worktree_archive_cleanup.worktree_auto_cleanup.worktree_branch_setup_modal.worktree_managed_create.worktree_new_branch_cleanup.worktree_pending_create.worktree_remove_workspace_root_cleanup.worktree_restore_banner.worktree_set_owner_thread.worktree_settings_delete.worktrees_settings_page.workspace_repo_owner_names".split(
    ".",
  ),
);

/** git source 特性判定（原 `yT`，导出 `Is`）。 */
export function isGitSource(feature: string | null | undefined): boolean {
  return feature != null && GIT_SOURCE_FEATURES.has(feature);
}

/** git 工具名集合（原 `vT`）。 */
const GIT_SOURCE_TOOLS = new Set([
  "apply-patch",
  "git-checkout-branch",
  "git-create-branch",
  "git-merge-base",
  "git-origins",
  "git-push",
  "prepare-worktree-snapshot",
  "upload-worktree-snapshot",
]);

/** git 工具名判定（原 `bT`）。 */
export function isGitSourceTool(tool: string): boolean {
  return GIT_SOURCE_TOOLS.has(tool);
}

// ---------------------------------------------------------------------------
// 路径恒等（原 `CT`）
// ---------------------------------------------------------------------------

/** 恒等（原 `CT`，导出 `Ns`——消费名 expandHomeDir/normalizeProjectPath）。 */
export function normalizeProjectPath<T>(path: T): T {
  return path;
}

// ---------------------------------------------------------------------------
// host id 与 kind（原 `wT`..`LT`）
// ---------------------------------------------------------------------------

/** durable host id（原 `wT`，导出 `_s`）。 */
export const DURABLE_HOST_ID = "durable";

/** remote-control kind（原 `TT`）。 */
const REMOTE_CONTROL_KIND = "remote-control";

/** durable host 判定（原 `ET`，导出 `Cs`）。 */
export function isDurableHost(hostId: string | null | undefined): boolean {
  return hostId === DURABLE_HOST_ID;
}

/** ssh 发现 host id（原 `DT`）。 */
export function discoveredSshHostId(hostname: string): string {
  return `remote-ssh-discovered:${encodeURIComponent(hostname)}`;
}

/** remote-control host id（原 `OT`，导出 `bs`）。 */
export function hostIdOfEnvId(envId: string): string {
  return `remote-control:${encodeURIComponent(envId)}`;
}

/** WSL host id（原 `kT`）。 */
export function wslHostId(distro: string): string {
  return `remote-wsl:${encodeURIComponent(distro)}`;
}

/** ssh 目标参数（原 `AT`：alias 优先，否则 -i identity/-p port/hostname）。 */
export function sshTargetArgs({ alias, hostname, sshPort, identity }: { alias?: string | null; hostname: string; sshPort?: number | null; identity?: string | null }): string[] {
  const trimmedAlias = alias?.trim();
  if (trimmedAlias) return [trimmedAlias];
  const args: string[] = [];
  if (identity) args.push("-i", identity);
  if (sshPort != null) args.push("-p", String(sshPort));
  args.push(hostname);
  return args;
}

/** host 配置形态（kind/source 判定的最小面）。 */
export interface HostConfigLike {
  kind?: string | null;
  source?: string | null;
}

/** codex 管理连接判定（原 `jT`）。 */
export function isManagedConnection(config: { source?: string | null }): boolean {
  return config.source === "codex-managed" || config.source === "discovered";
}

/** WSL 连接判定（原 `MT`）。 */
export function isWslConnection(config: { source?: string | null }): boolean {
  return config.source === "wsl";
}

/** remote-control 连接判定（原 `NT`）。 */
export function isRemoteControlConnection(config: { source?: string | null }): boolean {
  return config.source === "remote-control";
}

/** remote-control host 判定（原 `PT`）。 */
export function isRemoteControlHost(config: HostConfigLike | null | undefined): boolean {
  return config?.kind === REMOTE_CONTROL_KIND;
}

/** ssh host 判定（原 `FT`，导出 `Os`）。 */
export function isSshHostConfig(config: HostConfigLike | null | undefined): boolean {
  return config?.kind === "ssh";
}

/** WSL host 判定（原 `IT`）。 */
export function isWslHostConfig(config: HostConfigLike | null | undefined): boolean {
  return config?.kind === "wsl";
}

/** 远程 host 判定（原 `LT`，导出 `Es`：ssh | wsl | remote-control）。 */
export function isRemoteHostConfig(config: HostConfigLike | null | undefined): boolean {
  return isSshHostConfig(config) || isWslHostConfig(config) || isRemoteControlHost(config);
}

const ELIGIBLE_THREAD_SOURCES = new Set([
  "user", "agent_created_thread", "agent_forked_thread", "ambient_suggestion_task", "avatar_quick_chat",
  "chatgpt_handoff", "code_review", "codex_replay", "conversation_digest", "implement_todo",
  "local_environment_configuration", "mcp_app_follow_up", "onboarding_checklist", "security_remediation",
  "security_scan", "voice_chat",
]);

/** Sources accepted by the desktop thread-creation contract (original `fj` / `ha`). */
export function isEligibleThreadSource(source: unknown): boolean {
  return source == null || (typeof source === "string" && ELIGIBLE_THREAD_SOURCES.has(source));
}

/** Canonical remote path used by declaration reconciliation (original `Hne` / `va`). */
export function normalizeRemotePath(path: string): string {
  let value = path.trim().replace(/\\/g, "/").toLowerCase();
  const unc = value.match(/^\/\/(?:wsl\$|wsl\.localhost)\/[^/]+(?:\/(.*))?$/);
  if (unc) value = unc[1] ? `/${unc[1]}` : "/";
  const drive = value.match(/^\/?([a-z]):(?:\/(.*))?$/);
  if (drive) value = drive[2] ? `/mnt/${drive[1]}/${drive[2]}` : `/mnt/${drive[1]}`;
  value = value.replace(/\/+/g, "/");
  return value === "/" ? value : value.replace(/\/+$/, "");
}

/** Preserve display casing while removing redundant separators (original `cj` / `ya`). */
export function canonicalizeRemotePath(path: string): string {
  const value = path.trim().replace(/\\/g, "/");
  if (!value) return "";
  if (/^\/+$/u.test(value)) return "/";
  if (/^[A-Za-z]:\/+$/u.test(value)) return `${value.slice(0, 2)}/`;
  return value.replace(/\/+$/, "");
}

export function defaultProjectLabel(path: string): string {
  const value = canonicalizeRemotePath(path);
  return value.split("/").filter(Boolean).at(-1) ?? value;
}

// ---------------------------------------------------------------------------
// 兼容导出（host-config 分区 8 个压缩名）
// ---------------------------------------------------------------------------

export {
  GIT_SOURCE_HEADER_KEY as js,
  isGitSource as Is,
  normalizeProjectPath as Ns,
  DURABLE_HOST_ID as _s,
  isDurableHost as Cs,
  hostIdOfEnvId as bs,
  isSshHostConfig as Os,
  isRemoteHostConfig as Es,
  isEligibleThreadSource as ha,
  normalizeRemotePath as va,
  canonicalizeRemotePath as ya,
  defaultProjectLabel as _a,
  discoveredSshHostId as ys,
  sshTargetArgs as Ss,
  isWslConnection as ks,
  isRemoteControlConnection as ws,
  isWslHostConfig as As,
};
