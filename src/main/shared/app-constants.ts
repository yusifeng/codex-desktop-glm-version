// shared chunk：应用常量与路径工具（app-constants 分区，
// settings-threads 子区）。
//
// 对应 src-DldfpmrL.ts 的 L17,638-18,010 区段：
//   - gb（iu）：全局状态 key 表（~90 项：statsig stable id、NUX、
//     git 偏好、worktree、workspace/project/thread 归属、remote 连接、
//     browser 下载、dock 图标、动画减弱等）
//   - ene（au）：状态默认值表（git merge 方法、branch 前缀 codex/、
//     worktree keep 15、ambient suggestions 开、1800s followup 等）
//   - fb（cu）：BuildFlavor 枚举（dev/agent/nightly/internal-alpha/
//     public-beta/prod + isValid/parse/isInternal/allowDebugMenu/
//     supportsReactScan）
//   - Qy（fu）：InboxItemChange 事件名；Wy（bu）：344×344 窗口尺寸
//   - lb（uu）：claude-cowork marketplace 名
//   - pb（ou）= browser、$te（su）= browser-use、jb=computer-use、
//     Sb（Kl）= cua_repl、Mb=unified-computer-use、Nb=computer-history、
//     Pb=latex、fne=notebook、pne=code-review、Fb=codex-app-tools、
//     hne=deep-research、Ib=user-writing、Lb=visualize
//   - Eb（Vl）：openai-bundled marketplace；_ne（Ul）：marketplace 名
//     工厂；Rb（Wl）：bundled 名判定；zb+Bb（Hl）：自动安装退出 key
//   - gne：bundled 插件描述符表（hidden/installWhenMissing/
//     mcpServerName/名称）
//   - _b（Gl）= CODEX_CLI_PATH、xb=node_repl、ine（$l）=
//     NODE_REPL_TRUSTED_SERVICES、vb/yb/bb/Cb/rne/wb：node repl 环境
//     变量族；ane（tu）：computer-use server 名判定
//   - 路径工具族（Gb..ax）：反斜杠归一（Tl/Gl）、Windows/UNC 判定
//     （Jb/Yb/bl）、POSIX 绝对（Zb）、盘符前导斜杠剥（$b）、
//     \\?\ 剥（ex）、WSL→/mnt 映射（qb）、~ 展开（Vl/ane 区域的
//     expandTilde）、path 等价（tx/nx/ax：win32:/wsl: 前缀 + 显式
//     mnt 比较）、posix join（rx=Cl）、host join（ix=Sl）
//
// 兼容导出（35+）：iu=gb、au=tne、cu=fb、fu=Qy、bu=Wy、uu=lb、
// ou=pb、su=$te、Kl=Sb、Vl=Eb、Ul=_ne、Wl=Rb、Hl=Bb、Gl=_b、$l=ine、
// tu=ane、Tl=Gb、Dl=Qb、_l=ex、bl=Jb、xl=Yb、yl=Xb、vl=Zb、
// wl=Qb、El=$b、Ol=qb、gl=tx、Cl=rx、Sl=ix。

// ---------------------------------------------------------------------------
// 全局状态 key 表（原 `gb`，导出 `iu`）
// ---------------------------------------------------------------------------

/** 全局状态 key（原 `gb`）。 */
export const STATE_KEYS = {
  STATSIG_STABLE_ID: "statsig-stable-id",
  NUX_2025_09_15: "viewed2025-09-15-nux",
  NUX_2025_09_15_FULL_CHATGPT_AUTH_VIEWED: "viewed2025-09-15-full-chatgpt-auth-nux",
  NUX_2025_09_15_APIKEY_AUTH_VIEWED: "viewed2025-09-15-apikey-auth-nux",
  WINDOWS_WSL_REMINDER_DISMISSED_AT: "windows-wsl-reminder-dismissed-date",
  SHOW_COPILOT_LOGIN_FIRST: "show-copilot-login-first",
  USE_COPILOT_AUTH_IF_AVAILABLE: "use-copilot-auth-if-available",
  COPILOT_DEFAULT_MODEL: "copilot-default-model",
  NOTIFICATIONS_TURN_MODE: "notifications-turn-mode",
  NOTIFICATIONS_PERMISSIONS_ENABLED: "notifications-permissions-enabled",
  NOTIFICATIONS_QUESTIONS_ENABLED: "notifications-questions-enabled",
  IA_WAITING_ON_USER_FOLLOWUP_SECONDS: "ia-waiting-on-user-followup-seconds",
  AMBIENT_SUGGESTIONS_ENABLED: "ambient-suggestions-enabled",
  CODEX_MICRO_AGENT_SOURCE: "codex-micro-agent-source",
  CODEX_MICRO_LAYOUT: "codex-micro-layout",
  DESKTOP_APP_BETA_PREFERENCES_BY_ACCOUNT_ID: "desktop-app-beta-preferences-by-account-id",
  MAC_MENU_BAR_ENABLED: "mac-menu-bar-enabled",
  DESKTOP_FIRST_SEEN_AT_MS: "desktop-first-seen-at-ms",
  GIT_BRANCH_PREFIX: "git-branch-prefix",
  GIT_ALWAYS_FORCE_PUSH: "git-always-force-push",
  GIT_CREATE_PULL_REQUEST_AS_DRAFT: "git-create-pull-request-as-draft",
  GIT_PULL_REQUEST_MERGE_METHOD: "git-pull-request-merge-method",
  GIT_REVIEW_MODE: "git-review-mode",
  GIT_SHOW_SIDEBAR_PR_ICONS: "git-show-sidebar-pr-icons",
  GIT_WORKTREE_ROOT: "git-worktree-root",
  GIT_COMMIT_INSTRUCTIONS: "git-commit-instructions",
  GIT_PR_INSTRUCTIONS: "git-pr-instructions",
  GIT_PR_WATCH_AUTO_MERGE: "git-pr-watch-auto-merge",
  GIT_PR_WATCH_INSTRUCTIONS: "git-pr-watch-instructions",
  WORKTREE_UPSTREAM_REFRESH_MODE: "worktree-upstream-refresh-mode",
  WORKTREE_AUTO_CLEANUP_ENABLED: "worktree-auto-cleanup-enabled",
  WORKTREE_AUTO_CLEANUP_UNPACKAGED_OVERRIDE_ENABLED: "worktree-auto-cleanup-unpackaged-override-enabled",
  GLOBAL_DICTATION_FORCE_LOCK_DEBUG_ENABLED: "global-dictation-force-lock-debug-enabled",
  DEBUG_CHROME_PAGES_ENABLED: "debug-chrome-pages-enabled",
  HOTKEY_WINDOW_PROJECTLESS_DEFAULT_ENABLED: "hotkey-window-projectless-default-enabled",
  WORKTREE_KEEP_COUNT: "worktree-keep-count",
  ACTIVE_WORKSPACE_ROOTS: "active-workspace-roots",
  WORKSPACE_ROOT_OPTIONS: "electron-saved-workspace-roots",
  WORKSPACE_ROOT_LABELS: "electron-workspace-root-labels",
  LOCAL_PROJECTS: "local-projects",
  APP_SERVER_PROJECT_ID_BY_LEGACY_PROJECT_ID_BY_HOST: "app-server-project-id-by-legacy-project-id-by-host",
  APP_SERVER_PROJECTS_MIGRATION_BY_HOST: "app-server-projects-migration-by-host",
  APP_SERVER_PENDING_PROJECT_DELETIONS_BY_HOST: "app-server-pending-project-deletions-by-host",
  SELECTED_PROJECT: "selected-project",
  PROJECT_WRITABLE_ROOTS: "project-writable-roots",
  PROJECT_APPEARANCES: "project-appearances",
  PROJECT_FILES: "project-files",
  OPEN_IN_TARGET_PREFERENCES: "open-in-target-preferences",
  PINNED_THREAD_IDS: "pinned-thread-ids",
  APP_SERVER_MIGRATED_PINNED_THREAD_IDS_BY_HOST: "app-server-migrated-pinned-thread-ids-by-host",
  PINNED_PROJECT_IDS: "pinned-project-ids",
  SIDEBAR_PROJECT_THREAD_ORDERS: "sidebar-project-thread-orders",
  SIDEBAR_THREAD_METADATA: "sidebar-thread-metadata",
  THREAD_PROJECT_ASSIGNMENTS: "thread-project-assignments",
  THREAD_PROJECT_MEMBERSHIP_HOST_IDS: "thread-project-membership-host-ids",
  THREAD_WRITABLE_ROOTS: "thread-writable-roots",
  THREAD_WORKSPACE_ROOT_HINTS: "thread-workspace-root-hints",
  THREAD_PROJECTLESS_OUTPUT_DIRECTORIES: "thread-projectless-output-directories",
  PROJECTLESS_THREAD_IDS: "projectless-thread-ids",
  SELECTED_REMOTE_HOST_ID: "selected-remote-host-id",
  REMOTE_PROJECTS: "remote-projects",
  ACTIVE_REMOTE_PROJECT_ID: "active-remote-project-id",
  PROJECT_ORDER: "project-order",
  CONNECTION_GROUP_ORDER: "connection-group-order",
  REMOTE_CONNECTION_MAX_RETRY_ATTEMPTS: "remote-connection-max-retry-attempts",
  REMOTE_CWDS_BY_HOST_AND_WORKSPACE: "remote-cwds-by-host-and-workspace",
  CODEX_MANAGED_REMOTE_CONNECTIONS: "codex-managed-remote-connections",
  HOST_ID_REMOTE_CONTROL_ALLOWED: "host-id-remote-control-allowed",
  ADDED_REMOTE_CONTROL_ENV_IDS: "added-remote-control-env-ids",
  CODEX_MOBILE_SETUP_COMPLETED: "codex-mobile-has-connected-device",
  REMOTE_PROJECT_CONNECTION_BACKFILL_COMPLETED: "remote-project-connection-backfill-completed",
  REMOTE_CONNECTION_AUTO_CONNECT_BY_HOST_ID: "remote-connection-auto-connect-by-host-id",
  REMOTE_CONNECTION_ANALYTICS_ID_BY_HOST_ID: "remote-connection-analytics-id-by-host-id",
  PERSISTED_ATOM_STATE: "persisted-atom-state",
  QUEUED_FOLLOW_UPS: "queued-follow-ups",
  PRIMARY_RUNTIME_UPDATE_JITTER_MS: "primary-runtime-update-jitter-ms",
  SITE_CREATOR_BUNDLED_PLUGIN_AUTO_INSTALL_DISABLED: "site-creator-bundled-plugin-auto-install-disabled",
  BROWSER_USE_BUNDLED_PLUGIN_AUTO_INSTALL_DISABLED: "browser-use-bundled-plugin-auto-install-disabled",
  COMPUTER_USE_BUNDLED_PLUGIN_AUTO_INSTALL_DISABLED: "computer-use-bundled-plugin-auto-install-disabled",
  BROWSER_ANNOTATION_SCREENSHOTS_MODE: "browser-annotation-screenshots-mode",
  BROWSER_DOWNLOAD_DIRECTORY: "browser-download-directory",
  BROWSER_DOWNLOAD_PROMPT_ENABLED: "browser-download-prompt-enabled",
  DOCK_ICON_PREFERENCE: "dock-icon-preference",
  REDUCED_MOTION_PREFERENCE: "reduced-motion-preference",
} as const;

/** 状态 key 的默认值（原 `ene`）。 */
const STATE_DEFAULTS: Record<string, unknown> = {
  [STATE_KEYS.GIT_ALWAYS_FORCE_PUSH]: false,
  [STATE_KEYS.GIT_CREATE_PULL_REQUEST_AS_DRAFT]: true,
  [STATE_KEYS.GIT_PULL_REQUEST_MERGE_METHOD]: "merge",
  [STATE_KEYS.GIT_REVIEW_MODE]: "full",
  [STATE_KEYS.GIT_BRANCH_PREFIX]: "codex/",
  [STATE_KEYS.GIT_WORKTREE_ROOT]: "",
  [STATE_KEYS.GIT_COMMIT_INSTRUCTIONS]: "",
  [STATE_KEYS.GIT_PR_INSTRUCTIONS]: "",
  [STATE_KEYS.GIT_PR_WATCH_AUTO_MERGE]: false,
  [STATE_KEYS.GIT_PR_WATCH_INSTRUCTIONS]: "",
  [STATE_KEYS.SIDEBAR_PROJECT_THREAD_ORDERS]: {},
  [STATE_KEYS.PROJECT_APPEARANCES]: {},
  [STATE_KEYS.ADDED_REMOTE_CONTROL_ENV_IDS]: [],
  [STATE_KEYS.CODEX_MOBILE_SETUP_COMPLETED]: false,
  [STATE_KEYS.AMBIENT_SUGGESTIONS_ENABLED]: true,
  [STATE_KEYS.IA_WAITING_ON_USER_FOLLOWUP_SECONDS]: 1800,
  [STATE_KEYS.HOTKEY_WINDOW_PROJECTLESS_DEFAULT_ENABLED]: false,
  [STATE_KEYS.DEBUG_CHROME_PAGES_ENABLED]: false,
  [STATE_KEYS.WORKTREE_AUTO_CLEANUP_ENABLED]: true,
  [STATE_KEYS.WORKTREE_KEEP_COUNT]: 15,
  [STATE_KEYS.BROWSER_ANNOTATION_SCREENSHOTS_MODE]: "always",
  [STATE_KEYS.BROWSER_DOWNLOAD_DIRECTORY]: null,
  [STATE_KEYS.BROWSER_DOWNLOAD_PROMPT_ENABLED]: false,
  [STATE_KEYS.DOCK_ICON_PREFERENCE]: "app-default",
  [STATE_KEYS.REDUCED_MOTION_PREFERENCE]: "system",
};

/** 状态 key 默认值读取（原 `tne`，导出 `au`）。 */
export function getAtomStateDefault(key: string): unknown {
  return STATE_DEFAULTS[key];
}

// ---------------------------------------------------------------------------
// BuildFlavor（原 `ub`/`db`/`Qte`/`fb`，导出 `cu`）
// ---------------------------------------------------------------------------

const BUILD_FLAVOR_VALUES = {
  Dev: "dev",
  Agent: "agent",
  Nightly: "nightly",
  InternalAlpha: "internal-alpha",
  PublicBeta: "public-beta",
  Prod: "prod",
} as const;

const INTERNAL_FLAVORS = [BUILD_FLAVOR_VALUES.Dev, BUILD_FLAVOR_VALUES.Agent, BUILD_FLAVOR_VALUES.Nightly, BUILD_FLAVOR_VALUES.InternalAlpha];

/** 构建风味枚举（原 `fb`，导出 `cu`）。 */
export const BuildFlavor = {
  ...BUILD_FLAVOR_VALUES,
  values: Object.values(BUILD_FLAVOR_VALUES),
  help: Object.values(BUILD_FLAVOR_VALUES).join(", "),
  isValid(flavor: string): boolean {
    return (Object.values(BUILD_FLAVOR_VALUES) as string[]).includes(flavor);
  },
  parse(input: string | null | undefined): string | null {
    const trimmed = input?.trim();
    return trimmed && BuildFlavor.isValid(trimmed) ? trimmed : null;
  },
  isInternal(flavor: string): boolean {
    return INTERNAL_FLAVORS.includes(flavor as never);
  },
  allowDebugMenu(flavor: string): boolean {
    return BuildFlavor.isInternal(flavor);
  },
  supportsReactScan(flavor: string): boolean {
    return flavor === BuildFlavor.Dev || flavor === BuildFlavor.Agent || flavor === BuildFlavor.Nightly;
  },
};

// ---------------------------------------------------------------------------
// 杂项常量（原 `Qy`/`Wy`/`lb`）
// ---------------------------------------------------------------------------

/** Inbox 变更事件名（原 `Qy`，导出 `fu`）。 */
export const INBOX_ITEM_CHANGE = { CHANGED: "inbox-items-changed" } as const;

/** 344×344 弹窗尺寸（原 `Wy`，导出 `bu`）。 */
export const POPUP_WINDOW_SIZE = { width: 344, height: 344 } as const;

/** Hotkey window home route (原 `tk`/`nk`，导出 `co`)。 */
export const HOTKEY_WINDOW_ROUTE = "/hotkey-window";

/** claude-cowork marketplace 名（原 `lb`，导出 `uu`）。 */
export const COWORK_MARKETPLACE_NAME = "claude-cowork";

// ---------------------------------------------------------------------------
// 插件名与描述符（原 `pb`..`gne`/`Eb`/`_ne`/`Rb`/`zb`/`Bb`）
// ---------------------------------------------------------------------------

/** browser 插件名（原 `pb`，导出 `ou`）。 */
export const BROWSER_PLUGIN_NAME = "browser";

/** Persistent Electron session used by browser settings webviews (原 `gx`/`vx`，导出 `rl`)。 */
export const BROWSER_APP_PARTITION = "persist:codex-browser-app";

/** chrome 插件名（原 `Ab`，导出 `Ml`）。 */
export const CHROME_PLUGIN_NAME = "chrome";

/** chrome-dev 插件名（原 `Ob`，导出 `Al`）。 */
export const CHROME_DEV_PLUGIN_NAME = "chrome-dev";

/** chrome-internal 插件名（原 `kb`，导出 `jl`）。 */
export const CHROME_INTERNAL_PLUGIN_NAME = "chrome-internal";

/** computer-use 插件名（原 `jb`，导出 `Fl`）。 */
export const COMPUTER_USE_PLUGIN_NAME = "computer-use";

/** unified-computer-use 插件名（原 `Mb`，导出 `Rl`）。 */
export const UNIFIED_COMPUTER_USE_PLUGIN_NAME = "unified-computer-use";

/** computer-history 插件名（原 `Nb`，导出 `Pl`）。 */
export const COMPUTER_HISTORY_PLUGIN_NAME = "computer-history";

/** codex-app-tools 插件名（原 `Fb`，导出 `Nl`）。 */
export const CODEX_APP_TOOLS_PLUGIN_NAME = "codex-app-tools";

/** user-writing 插件名（原 `Ib`，导出 `zl`）。 */
export const USER_WRITING_PLUGIN_NAME = "user-writing";

/** visualize 插件名（原 `Lb`，导出 `Bl`）。 */
export const VISUALIZE_PLUGIN_NAME = "visualize";

/** browser-use 插件名（原 `$te`，导出 `su`）。 */
export const BROWSER_USE_PLUGIN_NAME = "browser-use";

/** cua_repl MCP server 名（原 `Sb`，导出 `Kl`）。 */
export const COMPUTER_USE_MCP_SERVER_NAME = "cua_repl";

/** openai-bundled marketplace 名（原 `Eb`，导出 `Vl`）。 */
export const DEFAULT_MARKETPLACE_NAME = "openai-bundled";

/** codex-app-tools MCP server 名（原 `mne`）。 */
const CODEX_APP_TOOLS_MCP_SERVER_NAME = "codex_app";

/** bundled 插件描述符（原 `gne`）。 */
export interface BundledPluginDescriptor {
  name: string;
  hidden?: boolean;
  installWhenMissing?: boolean;
  installWhenMissingRequiresOptIn?: boolean;
  excludeFromExecutor?: boolean;
  mcpServerName?: string;
}

/** bundled 插件描述符表（原 `gne`）。 */
export const BUNDLED_PLUGIN_DESCRIPTORS: Record<string, BundledPluginDescriptor> = {
  codexAppTools: { hidden: true, installWhenMissing: true, mcpServerName: CODEX_APP_TOOLS_MCP_SERVER_NAME, name: "codex-app-tools" },
  browser: { installWhenMissing: true, name: BROWSER_PLUGIN_NAME },
  unifiedComputerUse: { excludeFromExecutor: false, hidden: true, installWhenMissing: true, mcpServerName: COMPUTER_USE_MCP_SERVER_NAME, name: "unified-computer-use" },
  chromeDev: { name: "chrome-dev" },
  chromeInternal: { name: "chrome-internal" },
  chrome: { name: "chrome" },
  computerUse: { installWhenMissing: true, installWhenMissingRequiresOptIn: true, name: "computer-use" },
  messages: { name: "messages" },
  recordAndReplay: { name: "record-and-replay" },
  computerHistory: { name: "computer-history" },
  latex: { name: "latex" },
  notebook: { installWhenMissing: true, name: "notebook" },
  pullRequests: { installWhenMissing: true, name: "code-review" },
  deepResearch: { installWhenMissing: true, name: "deep-research" },
  userWriting: { installWhenMissing: true, name: "user-writing" },
  visualize: { installWhenMissing: true, name: "visualize" },
};

/** marketplace 名工厂（原 `_ne`，导出 `Ul`）。 */
export function marketplaceNameForFlavor(): string {
  return DEFAULT_MARKETPLACE_NAME;
}

/** bundled marketplace 名判定（原 `Rb`，导出 `Wl`）。 */
export function isBundledMarketplaceName(name: string): boolean {
  return name === DEFAULT_MARKETPLACE_NAME;
}

/** 插件自动安装退出 key（原 `zb`+`Bb`，导出 `Hl`）。 */
const PLUGIN_AUTO_INSTALL_OPT_OUT: Map<string, string> = new Map([
  [BROWSER_PLUGIN_NAME, STATE_KEYS.BROWSER_USE_BUNDLED_PLUGIN_AUTO_INSTALL_DISABLED],
  ["computer-use", STATE_KEYS.COMPUTER_USE_BUNDLED_PLUGIN_AUTO_INSTALL_DISABLED],
]);

/** 插件的自动安装退出 key（原 `Bb`，导出 `Hl`）。 */
export function buildAutoInstallOptOutKey(pluginName: string): string | undefined {
  return PLUGIN_AUTO_INSTALL_OPT_OUT.get(pluginName);
}

// ---------------------------------------------------------------------------
// node repl 环境变量（原 `_b`/`ine`/`ane`）
// ---------------------------------------------------------------------------

/** CODEX_CLI_PATH env key（原 `_b`，导出 `Gl`）。 */
export const CODEX_CLI_PATH_ENV_KEY = "CODEX_CLI_PATH";

/** NODE_REPL_NODE_MODULE_DIRS env key（原 `vb`，导出 `ql`）。 */
export const NODE_REPL_MODULE_DIR_ENV_KEY = "NODE_REPL_NODE_MODULE_DIRS";

/** NODE_REPL_NODE_PATH env key（原 `yb`，导出 `Jl`）。 */
export const NODE_REPL_COMMAND_ENV_KEY = "NODE_REPL_NODE_PATH";

/** NODE_REPL_REQUEST_META env key（原 `bb`，导出 `Yl`）。 */
export const NODE_REPL_REQUEST_META_ENV_KEY = "NODE_REPL_REQUEST_META";

/** node_repl MCP server 名（原 `xb`，导出 `Xl`）。 */
export const NODE_REPL_MCP_SERVER_NAME = "node_repl";

/** NODE_REPL_TRUSTED_SERVICES env key（原 `ine`，导出 `$l`）。 */
export const NODE_REPL_TRUSTED_SERVICES_ENV_KEY = "NODE_REPL_TRUSTED_SERVICES";

/** computer-use server 名判定（原 `ane`，导出 `tu`）。 */
export function isComputerUseServerName(name: string): boolean {
  return name === COMPUTER_USE_MCP_SERVER_NAME || name === BROWSER_USE_PLUGIN_NAME || name === "unified-computer-use";
}

// ---------------------------------------------------------------------------
// 路径工具族（原 `Vb`..`ax`，L17,915-18,010）
// ---------------------------------------------------------------------------

const WINDOWS_DRIVE_PATH = /^[A-Za-z]:[\\/]/;
const LEADING_SLASH_DRIVE_PATH = /^\/[A-Za-z]:[\\/]/;
const UNC_BACKSLASH_PATH = /^\\\\[^\\]+\\[^\\]+/;
const UNC_FORWARD_PATH = /^\/\/[^/]+\/[^/]+/;

/** 反斜杠归一（原 `Gb`，导出 `Tl`）。 */
export function toForwardSlashes(path: string): string {
  return path.replace(/\\/g, "/");
}

/** Windows 盘符路径判定（原 `Jb`，导出 `bl`）。 */
export function isWindowsPath(path: string): boolean {
  return WINDOWS_DRIVE_PATH.test(path);
}

/** UNC 路径判定（原 `Yb`，导出 `xl`）。 */
export function isUncPath(path: string): boolean {
  return UNC_BACKSLASH_PATH.test(path) || UNC_FORWARD_PATH.test(path);
}

/** 非 UNC 前导双斜杠判定（原 `Xb`，导出 `yl`）。 */
export function isNotNetworkUncPath(path: string): boolean {
  return !/^[\\/]{2}/.test(path);
}

/** POSIX 绝对路径判定（原 `Zb`，导出 `vl`）。 */
export function isPosixAbsolutePath(path: string): boolean {
  return (path.startsWith("/") && !path.startsWith("//")) || isWindowsPath(path) || isUncPath(path);
}

/** 盘符前加斜杠修正（原 `Qb`，导出 `wl`）。 */
export function normalizeUncPath(path: string): string {
  return isWindowsPath(path) && !path.startsWith("/") ? `/${path}` : path;
}

/** 剥盘符前导斜杠（原 `$b`，导出 `El`）。 */
export function stripDriveLetterSlash(path: string): string {
  return LEADING_SLASH_DRIVE_PATH.test(path) ? path.slice(1) : path;
}

/** 剥 \\?\ 前缀（原 `ex`，导出 `_l`）。 */
export function stripWindowsExtendedPrefix(path: string): string {
  const uncMatch = path.match(/^\\\\\?\\UNC\\(.*)$/i);
  if (uncMatch != null) return `\\\\${uncMatch[1]}`;
  const driveMatch = path.match(/^\\\\\?\\([a-zA-Z]:[\\/].*)$/);
  return driveMatch == null ? path : driveMatch[1];
}

/** WSL 路径 → /mnt/<drive>（原 `qb`，导出 `Ol`）。 */
export function stripDrivePrefix(path: string): string {
  const normalized = toForwardSlashes(path).toLowerCase();
  const wslMatch = normalized.match(/^\/\/(?:wsl\$|wsl\.localhost)\/[^/]+(?:\/(.*))?$/);
  if (wslMatch) {
    const rest = wslMatch[1] ?? "";
    return rest.length > 0 ? `/${rest}` : "/";
  }
  const driveMatch = normalized.match(/^\/?([a-z]):(?:\/(.*))?$/);
  if (driveMatch) {
    const [, drive, rest] = driveMatch;
    return rest != null && rest.length > 0 ? `/mnt/${drive}/${rest}` : `/mnt/${drive}`;
  }
  return normalized;
}

/** 可比形态（原 `nx`：win32:/wsl: 前缀 + 尾斜杠清理）。 */
function comparablePathForm(path: string): string {
  const stripped = stripWindowsExtendedPrefix(path);
  const withoutDriveSlash = /^\/[a-z]:\//i.test(stripped) ? stripped.slice(1) : stripped;
  const wslMatch = stripped.match(/^\/\/(?:wsl\$|wsl\.localhost)\/([^/]+)(?:\/(.*))?$/i);
  let comparable = withoutDriveSlash;
  if (wslMatch != null) {
    const rest = `/${wslMatch[2] ?? ""}`;
    comparable = /^\/mnt\/[a-z](?:\/|$)/i.test(rest) ? `win32:${stripDrivePrefix(rest)}` : `wsl:${wslMatch[1].toLowerCase()}:${rest}`;
  } else if (isWindowsPath(withoutDriveSlash) || isUncPath(withoutDriveSlash)) comparable = `win32:${stripDrivePrefix(withoutDriveSlash)}`;
  return comparable === "/" ? comparable : comparable.replace(/\/+$/, "");
}

/** 显式 WSL 映射提取（原 `ax`）。 */
function wslMapping(comparable: string): { comparablePath: string; explicit: boolean } | null {
  if (comparable.startsWith("win32:")) return { comparablePath: comparable.slice(6), explicit: true };
  if (/^\/mnt\/[a-z](?:\/|$)/i.test(comparable)) return { comparablePath: stripDrivePrefix(comparable), explicit: false };
  return null;
}

/** 路径等价判定（原 `tx`，导出 `gl`）。 */
export function isSamePath(a: string, b: string): boolean {
  const formA = comparablePathForm(a);
  const formB = comparablePathForm(b);
  if (formA === formB) return true;
  const mappingA = wslMapping(formA);
  const mappingB = wslMapping(formB);
  return mappingA != null && mappingB != null && (mappingA.explicit || mappingB.explicit) && mappingA.comparablePath === mappingB.comparablePath;
}

/** 剥 \\?\ / \\.\ 设备前缀（原 `Kb`，导出 `Dl`）。 */
export function toPosixPath(path: string): string {
  return path.startsWith("\\\\?\\") || path.startsWith("\\\\.\\")
    ? path.slice(4).replace(/^UNC\\/i, "\\\\")
    : path;
}

/** posix join（原 `rx`，导出 `Cl`）。 */
export function joinPath(base: string | null, child: string | null): string {
  return base ? (child ? `${base.replace(/\/+$/, "")}/${child.replace(/^\/+/, "")}` : base) : (child ?? "");
}

/** host 风格 join（原 `ix`，导出 `Sl`：Windows 用反斜杠）。 */
export function joinHostPath(base: string, ...children: string[]): string {
  const isWindowsLike = /^[a-z]:[\\/]/i.test(base) || /^[\\/]{2}/u.test(base);
  const separator = isWindowsLike ? "\\" : "/";
  return children.reduce((accumulated, child) => {
    const trimmedBase = isWindowsLike ? accumulated.replace(/[\\/]+$/u, "") : accumulated.replace(/\/+$/u, "");
    const trimmedChild = child.replace(/^[\\/]+/u, "");
    return `${trimmedBase}${separator}${trimmedChild}`;
  }, base);
}

// ---------------------------------------------------------------------------
// 兼容导出（app-constants 分区）
// ---------------------------------------------------------------------------

export {
  STATE_KEYS as iu,
  getAtomStateDefault as au,
  BuildFlavor as cu,
  INBOX_ITEM_CHANGE as fu,
  POPUP_WINDOW_SIZE as bu,
  HOTKEY_WINDOW_ROUTE as co,
  COWORK_MARKETPLACE_NAME as uu,
  BROWSER_PLUGIN_NAME as ou,
  BROWSER_PLUGIN_NAME as kl,
  BROWSER_APP_PARTITION as rl,
  BROWSER_USE_PLUGIN_NAME as su,
  CHROME_PLUGIN_NAME as Ml,
  CHROME_DEV_PLUGIN_NAME as Al,
  CHROME_INTERNAL_PLUGIN_NAME as jl,
  COMPUTER_USE_PLUGIN_NAME as Fl,
  UNIFIED_COMPUTER_USE_PLUGIN_NAME as Rl,
  COMPUTER_HISTORY_PLUGIN_NAME as Pl,
  CODEX_APP_TOOLS_PLUGIN_NAME as Nl,
  USER_WRITING_PLUGIN_NAME as zl,
  VISUALIZE_PLUGIN_NAME as Bl,
  BUNDLED_PLUGIN_DESCRIPTORS as Ll,
  COMPUTER_USE_MCP_SERVER_NAME as Kl,
  DEFAULT_MARKETPLACE_NAME as Vl,
  marketplaceNameForFlavor as Ul,
  isBundledMarketplaceName as Wl,
  buildAutoInstallOptOutKey as Hl,
  CODEX_CLI_PATH_ENV_KEY as Gl,
  NODE_REPL_MODULE_DIR_ENV_KEY as ql,
  NODE_REPL_COMMAND_ENV_KEY as Jl,
  NODE_REPL_REQUEST_META_ENV_KEY as Yl,
  NODE_REPL_MCP_SERVER_NAME as Xl,
  NODE_REPL_TRUSTED_SERVICES_ENV_KEY as $l,
  isComputerUseServerName as tu,
  toForwardSlashes as Tl,
  isWindowsPath as bl,
  isUncPath as xl,
  isNotNetworkUncPath as yl,
  isPosixAbsolutePath as vl,
  normalizeUncPath as wl,
  stripDriveLetterSlash as El,
  stripWindowsExtendedPrefix as _l,
  toPosixPath as Dl,
  stripDrivePrefix as Ol,
  isSamePath as gl,
  joinPath as Cl,
  joinHostPath as Sl,
};
