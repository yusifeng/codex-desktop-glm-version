// app-shared：桌面设置 schema（git 组 + 桌面组全 69 项定义）。
//
// 对应 app-shared-7b9edc1bfb7f.js 的 48338-51295 行区段（压缩名 → 语义）：
//   - DV/OV/kV（48338-48368）：三个设置定义 helper——
//     DV = hostStorage kind: configuration（写主进程设置存储，可带 vscode 键）
//     OV = kind: global-state
//     kV = kind: persisted-atom（渲染侧持久化原子，经 persisted-atom-state 消息同步）
//   - AV（48369-48450）：git 设置组（11 项）
//   - QBe（48525-51295）：桌面设置组（58 项：appearance/appshot/browser/
//     codex-micro/computer-use/菜单栏/打开目标/导入同步/听写/composer/评审/
//     locale/项目外目录/终端/热键窗口…）
//   - yU（50775）：字号常量 {sans: 11-16, code: 8-24}
//
// 每项含 agentAccess（read-write/hidden）、default、description、schema、
// key。schema 在原版是内嵌 zod 构造（K=[enum]、W=string、yV=boolean 等），
// 此处以类型注释 + 值域常量保留语义；具体校验器在 chunk 整体重写时接入
// @rchunk/app-shared 的 zod 面。
//
// 机器可读清单见 docs/renderer-settings-keys.json。

// ---------------------------------------------------------------------------
// 定义 helper（原 `DV`/`OV`/`kV`）
// ---------------------------------------------------------------------------

/** 宿主存储类别。 */
export type HostStorageKind = "configuration" | "global-state" | "persisted-atom";

/** 设置定义（三种 helper 的公共产物）。 */
export interface SettingDefinition<T = unknown> {
  agentAccess: "read-write" | "hidden" | "read";
  default: T;
  description: string;
  key: string;
  hostStorage: { kind: HostStorageKind; key: string };
  /** 值域说明（原 zod schema 的语义摘要）。 */
  schema: unknown;
  /** 仅 configuration 类：对齐 vscode 设置键。 */
  vscode?: string;
}

/** configuration 设置（原 `DV`）。 */
function configurationSetting<T>(definition: Omit<SettingDefinition<T>, "hostStorage"> & { vscode?: string }): SettingDefinition<T> {
  return { ...definition, hostStorage: { kind: "configuration", key: definition.key } };
}

/** global-state 设置（原 `OV`）。 */
function globalStateSetting<T>(definition: Omit<SettingDefinition<T>, "hostStorage">): SettingDefinition<T> {
  return { ...definition, hostStorage: { kind: "global-state", key: definition.key } };
}

/** persisted-atom 设置（原 `kV`）。 */
function persistedAtomSetting<T>(definition: Omit<SettingDefinition<T>, "hostStorage">): SettingDefinition<T> {
  return { ...definition, hostStorage: { kind: "persisted-atom", key: definition.key } };
}

// ---------------------------------------------------------------------------
// 值域常量（原 schema 区的枚举与字号）
// ---------------------------------------------------------------------------

/** 字号约束（原 `yU`）。 */
export const FONT_SIZE_BOUNDS = { sans: { min: 11, max: 16 }, code: { min: 8, max: 24 } } as const;

/** 主题模式。 */
export type AppearanceTheme = "system" | "light" | "dark";
/** diff 标记样式。 */
export type DiffMarkerStyle = "color" | "symbols";
/** PR 合并方式。 */
export type PullRequestMergeMethod = "merge" | "squash";
/** Git Review 模式。 */
export type GitReviewMode = "full" | "last-turn-only";
/** 打开目标。 */
export type OpenTargetPreference = "in-app-browser" | "external-browser";
/** 减弱动效偏好。 */
export type ReducedMotionPreference = "system" | "on" | "off";
/** 主数字快捷键目标。 */
export type PrimaryNumberShortcutTarget = "tabs" | "sidebar";
/** 跟进队列模式。 */
export type FollowUpQueueMode = "steer" | "queue";
/** composer 回车行为。 */
export type ComposerEnterBehavior = "enter" | "mod-enter";
/** 评审交付方式。 */
export type ReviewDelivery = "inline" | "sidebar";
/** 终端默认位置。 */
export type TerminalLocation = "bottom" | "sidebar";
/** appshot 目标。 */
export type AppshotDestination = "automatic" | "clipboard" | "composer";
/** Codex Micro 灯光自动关闭。 */
export type MicroLightingAutoOff = "never" | "3-minutes" | "10-minutes";
/** 外链修饰键。 */
export type ExternalBrowserLinkShortcut = "unassigned" | "alt" | "ctrl";

// ---------------------------------------------------------------------------
// git 设置组（原 `AV`，L48369-48450）
// ---------------------------------------------------------------------------

export const GIT_SETTINGS = {
  branchPrefix: globalStateSetting<never>({
    agentAccess: "read-write",
    default: "codex/" as never,
    description: "Prefix for branches Codex creates",
    key: "git-branch-prefix",
    schema: "string",
  }),
  alwaysForcePush: globalStateSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether Codex always force-pushes branches",
    key: "git-always-force-push",
    schema: "boolean",
  }),
  createPullRequestAsDraft: globalStateSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether Codex creates pull requests as drafts",
    key: "git-create-pull-request-as-draft",
    schema: "boolean",
  }),
  pullRequestMergeMethod: globalStateSetting<PullRequestMergeMethod>({
    agentAccess: "read-write",
    default: "merge",
    description: "Preferred pull request merge method",
    key: "git-pull-request-merge-method",
    schema: ["merge", "squash"],
  }),
  reviewMode: globalStateSetting<GitReviewMode>({
    agentAccess: "read-write",
    default: "full",
    description: "Whether Git Review uses all sources or only recorded Last Turn changes",
    key: "git-review-mode",
    schema: ["full", "last-turn-only"],
  }),
  showSidebarPrIcons: globalStateSetting({
    agentAccess: "read-write",
    default: undefined,
    description: "Whether sidebar pull request icons are shown",
    key: "git-show-sidebar-pr-icons",
    schema: "boolean | undefined",
  }),
  worktreeRoot: globalStateSetting({
    agentAccess: "read-write",
    default: "",
    description: "Directory where Codex creates managed git worktrees",
    key: "git-worktree-root",
    schema: "string",
  }),
  commitInstructions: globalStateSetting({
    agentAccess: "read-write",
    default: "",
    description: "Custom git commit instructions",
    key: "git-commit-instructions",
    schema: "string",
  }),
  pullRequestInstructions: globalStateSetting({
    agentAccess: "read-write",
    default: "",
    description: "Custom pull request instructions",
    key: "git-pr-instructions",
    schema: "string",
  }),
  pullRequestWatchAutoMerge: globalStateSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether watched pull requests are merged when ready",
    key: "git-pr-watch-auto-merge",
    schema: "boolean",
  }),
  pullRequestWatchInstructions: globalStateSetting({
    agentAccess: "read-write",
    default: "",
    description: "Custom instructions for watching and fixing pull requests",
    key: "git-pr-watch-instructions",
    schema: "string",
  }),
} as const;

// ---------------------------------------------------------------------------
// 桌面设置组（原 `QBe`，L48525-51295，58 项）
// ---------------------------------------------------------------------------

export const DESKTOP_SETTINGS = {
  // --- 环境建议 ---
  ambientSuggestionsEnabled: globalStateSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether home-page ambient suggestions are enabled",
    key: "ambient-suggestions-enabled",
    schema: "boolean",
  }),

  // --- 外观（原 `bU`，L50775 起）---
  theme: configurationSetting<AppearanceTheme>({
    agentAccess: "read-write",
    default: "system",
    description: "Preferred app appearance mode",
    key: "appearanceTheme",
    schema: ["system", "light", "dark"],
  }),
  lightChromeTheme: configurationSetting({
    agentAccess: "read-write",
    default: undefined,
    description: "Chrome theme used in light mode",
    key: "appearanceLightChromeTheme",
    schema: "chrome theme preset | undefined",
  }),
  darkChromeTheme: configurationSetting({
    agentAccess: "read-write",
    default: undefined,
    description: "Chrome theme used in dark mode",
    key: "appearanceDarkChromeTheme",
    schema: "chrome theme preset | undefined",
  }),
  lightCodeThemeId: configurationSetting({
    agentAccess: "read-write",
    default: "codex",
    description: "Code theme used in light mode",
    key: "appearanceLightCodeThemeId",
    schema: "code theme id",
  }),
  darkCodeThemeId: configurationSetting({
    agentAccess: "read-write",
    default: "codex",
    description: "Code theme used in dark mode",
    key: "appearanceDarkCodeThemeId",
    schema: "code theme id",
  }),
  diffMarkerStyle: configurationSetting<DiffMarkerStyle>({
    agentAccess: "read-write",
    default: "color",
    description: "Diff marker style used in code review surfaces",
    key: "appearanceDiffMarkerStyle",
    schema: ["color", "symbols"],
  }),
  sansFontSize: configurationSetting({
    agentAccess: "read-write",
    default: 14,
    description: "Base UI font size",
    key: "sansFontSize",
    schema: `number ${FONT_SIZE_BOUNDS.sans.min}-${FONT_SIZE_BOUNDS.sans.max}`,
  }),
  codeFontSize: configurationSetting({
    agentAccess: "read-write",
    default: 12,
    description: "Code font size",
    key: "codeFontSize",
    schema: `number ${FONT_SIZE_BOUNDS.code.min}-${FONT_SIZE_BOUNDS.code.max}`,
  }),
  useFontSmoothing: configurationSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether font smoothing is enabled",
    key: "useFontSmoothing",
    schema: "boolean",
  }),
  usePointerCursors: configurationSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether interactive controls use pointer cursors",
    key: "usePointerCursors",
    schema: "boolean",
  }),
  dockIconPreference: globalStateSetting({
    agentAccess: "read-write",
    default: "app-default",
    description: "Preferred macOS Dock icon",
    key: "dock-icon-preference",
    schema: "dock icon preset",
  }),
  reducedMotionPreference: globalStateSetting<ReducedMotionPreference>({
    agentAccess: "read-write",
    default: "system",
    description: "Whether Codex reduces interface motion",
    key: "reduced-motion-preference",
    schema: ["system", "on", "off"],
  }),

  // --- appshot（全局快捷键截图）---
  appshotDestination: configurationSetting<AppshotDestination>({
    agentAccess: "read-write",
    default: "automatic",
    description: "Where global shortcut appshots are attached",
    key: "appshotDestination",
    schema: ["automatic", "clipboard", "composer"],
  }),
  appshotSoundEnabled: configurationSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether appshots play a sound effect",
    key: "appshotSoundEnabled",
    schema: "boolean",
  }),

  // --- in-app browser ---
  browserAnnotationMarkersVisible: persistedAtomSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether saved annotations show markers on browser pages",
    key: "browser-annotation-markers-visible",
    schema: "boolean",
  }),
  browserExtensionsToolbarVisible: persistedAtomSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether the extensions puzzle button is pinned to the toolbar",
    key: "browser-extensions-toolbar-visible",
    schema: "boolean",
  }),
  browserShowFullUrl: persistedAtomSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether the in-app browser address bar shows the full URL",
    key: "browser-show-full-url",
    schema: "boolean",
  }),
  browserAnnotationScreenshotsMode: globalStateSetting({
    agentAccess: "read-write",
    default: "saved-only",
    description: "When browser annotation screenshots are included",
    key: "browser-annotation-screenshots-mode",
    schema: "annotation screenshots mode",
  }),
  browserDisabledSiteAnnotationHostnames: persistedAtomSetting({
    agentAccess: "read-write",
    default: [],
    description: "Hostnames where custom site annotation features are disabled",
    key: "browser-disabled-site-annotation-hostnames",
    schema: "string[]",
  }),
  browserSiteAnnotationPermissionAnsweredHostnames: persistedAtomSetting({
    agentAccess: "read-write",
    default: [],
    description: "Hostnames whose site annotation permission prompt was answered",
    key: "browser-site-annotation-permission-answered-hostnames",
    schema: "string[]",
  }),
  browserDebugChromePagesEnabled: globalStateSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether Browser Use may open trusted chrome:// dialog pages",
    key: "browser-debug-chrome-pages-enabled",
    schema: "boolean",
  }),
  browserDownloadDirectory: globalStateSetting({
    agentAccess: "read-write",
    default: null,
    description: "Folder where files downloaded by the in-app browser are saved",
    key: "browser-download-directory",
    schema: "string | null",
  }),
  browserPromptForDownloadLocation: globalStateSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether manual browser downloads ask where to save files",
    key: "browser-prompt-for-download-location",
    schema: "boolean",
  }),

  // --- Codex Micro（实体键盘）---
  codexMicroAgentSource: globalStateSetting({
    agentAccess: "read-write",
    default: "cloud",
    description: "Task source for Codex Micro agent keys",
    key: "codex-micro-agent-source",
    schema: "agent source",
  }),
  codexMicroSingleTapAgentKeys: persistedAtomSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether Codex Micro agent keys open assigned conversations with a single tap",
    key: "codex-micro-single-tap-agent-keys",
    schema: "boolean",
  }),
  codexMicroLayout: globalStateSetting({
    agentAccess: "read-write",
    default: "default",
    description: "Configured action-key layout for Codex Micro",
    key: "codex-micro-layout",
    schema: "layout preset",
  }),
  codexMicroLightingBrightness: persistedAtomSetting({
    agentAccess: "read-write",
    default: 100,
    description: "Brightness of Codex Micro lighting",
    key: "codex-micro-lighting-brightness",
    schema: "number",
  }),
  codexMicroLightingAutoOff: persistedAtomSetting<MicroLightingAutoOff>({
    agentAccess: "read-write",
    default: "3-minutes",
    description: "When Codex Micro lighting turns off after inactivity",
    key: "codex-micro-lighting-auto-off",
    schema: ["never", "3-minutes", "10-minutes"],
  }),

  // --- Computer Use ---
  computerUseAlwaysHidePictureInPicture: configurationSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether Computer Use picture in picture is always hidden",
    key: "computerUseAlwaysHidePictureInPicture",
    schema: "boolean",
  }),

  // --- 键盘快捷键 ---
  primaryNumberShortcutTarget: persistedAtomSetting<PrimaryNumberShortcutTarget>({
    agentAccess: "read-write",
    default: "tabs",
    description: "Whether primary-modifier number shortcuts select sidebar items or tabs",
    key: "primary-number-shortcut-target",
    schema: ["tabs", "sidebar"],
  }),

  // --- 菜单栏 / 杂项 ---
  appBetaPreferencesByAccountId: globalStateSetting({
    agentAccess: "read-write",
    default: {},
    description: "Desktop app beta feature preferences by account",
    key: "app-beta-preferences-by-account-id",
    schema: "Record<string, unknown>",
  }),
  macMenuBarEnabled: globalStateSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether the macOS menu bar is shown",
    key: "mac-menu-bar-enabled",
    schema: "boolean",
  }),
  chronicleMenuBarIndicatorEnabled: persistedAtomSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether the macOS menu bar shows the Computer History indicator",
    key: "chronicle-menu-bar-indicator-enabled",
    schema: "boolean",
  }),

  // --- 打开目标 ---
  openInTargetPreferences: globalStateSetting({
    agentAccess: "read-write",
    default: {},
    description: "Preferred targets for opening paths",
    key: "open-in-target-preferences",
    schema: "Record<string, unknown>",
  }),
  openLinkInTargetPreference: configurationSetting<OpenTargetPreference>({
    agentAccess: "read-write",
    default: "in-app-browser",
    description: "Preferred target for opening links",
    key: "open-link-in-target-preference",
    schema: ["in-app-browser", "external-browser"],
  }),
  externalBrowserLinkShortcut: configurationSetting<ExternalBrowserLinkShortcut>({
    agentAccess: "read-write",
    default: "unassigned",
    description: "Modifier-click shortcut for opening web links in the default browser",
    key: "external-browser-link-shortcut",
    schema: ["unassigned", "alt", "ctrl"],
  }),
  openLocalUrlInTargetPreference: configurationSetting<OpenTargetPreference>({
    agentAccess: "read-write",
    default: "in-app-browser",
    description: "Preferred target for opening local URLs",
    key: "open-local-url-in-target-preference",
    schema: ["in-app-browser", "external-browser"],
  }),
  customFileHandlers: configurationSetting({
    agentAccess: "read-write",
    default: {},
    description: "Custom file handlers for opening files from Codex surfaces",
    key: "custom_file_handlers",
    schema: "Record<string, unknown>",
  }),

  // --- 外部 Agent 导入同步 ---
  externalAgentImportSyncEnabled: persistedAtomSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether imported content is automatically kept in sync",
    key: "external-agent-import-sync-enabled",
    schema: "boolean",
  }),
  externalAgentImportSyncItemTypes: persistedAtomSetting({
    agentAccess: "read-write",
    default: null,
    description: "Automatically sync all categories, including categories not yet imported",
    key: "external-agent-import-sync-item-types",
    schema: "string[] | null",
  }),

  // --- 听写 / 语音 ---
  dictationSoundsEnabled: configurationSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether sounds play when dictation starts and stops",
    key: "dictationSoundsEnabled",
    schema: "boolean",
  }),
  dictationDictionary: configurationSetting({
    agentAccess: "read-write",
    default: [],
    description: "Custom dictation dictionary entries",
    key: "dictationDictionary",
    schema: "Array<{phrase: string; replacement: string}>",
  }),
  microphoneInputDeviceId: configurationSetting({
    agentAccess: "read-write",
    default: null,
    description: "Preferred microphone input device for voice and dictation",
    key: "microphoneInputDeviceId",
    schema: "string | null",
  }),

  // --- composer / 会话 ---
  followUpQueueMode: configurationSetting<FollowUpQueueMode>({
    agentAccess: "read-write",
    default: "steer",
    description: "How follow-up prompts behave while a turn is running",
    key: "followUpQueueMode",
    schema: ["steer", "queue"],
  }),
  composerEnterBehavior: configurationSetting<ComposerEnterBehavior>({
    agentAccess: "read-write",
    default: "enter",
    description: "How Enter behaves in the composer",
    key: "composerEnterBehavior",
    schema: ["enter", "mod-enter"],
  }),
  composerPlainTextMode: configurationSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether the message composer keeps code, Markdown, and links as plain text",
    key: "composerPlainTextMode",
    schema: "boolean",
  }),
  showContextWindowUsage: persistedAtomSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether context window usage is shown in the composer",
    key: "show-context-window-usage",
    schema: "boolean",
  }),
  showEducationalTips: persistedAtomSetting({
    agentAccess: "read-write",
    default: true,
    description: "Whether educational tips are shown above the composer",
    key: "show-educational-tips",
    schema: "boolean",
  }),

  // --- 评审 / locale / 目录 ---
  reviewDelivery: configurationSetting<ReviewDelivery>({
    agentAccess: "read-write",
    default: "inline",
    description: "How code review results are delivered",
    key: "reviewDelivery",
    schema: ["inline", "sidebar"],
  }),
  localeOverride: configurationSetting({
    agentAccess: "read-write",
    default: null,
    description: "Explicit locale override",
    key: "localeOverride",
    schema: "string | null",
  }),
  projectlessWorkspaceRoot: configurationSetting({
    agentAccess: "read-write",
    default: null,
    description: "The location where tasks started outside of projects run",
    key: "projectlessWorkspaceRoot",
    schema: "string | null",
  }),

  // --- 电源 / 终端 ---
  preventSleepWhileRunning: configurationSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether the machine stays awake while Codex is running tasks",
    key: "preventSleepWhileRunning",
    schema: "boolean",
  }),
  keepRemoteControlAwakeWhilePluggedIn: configurationSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether remote control keeps this computer awake while plugged in",
    key: "keepRemoteControlAwakeWhilePluggedIn",
    schema: "boolean",
  }),
  integratedTerminalShell: configurationSetting({
    agentAccess: "read-write",
    default: undefined,
    description: "Preferred integrated terminal shell",
    key: "integratedTerminalShell",
    schema: "shell descriptor | undefined",
  }),
  defaultTerminalLocation: configurationSetting<TerminalLocation>({
    agentAccess: "read-write",
    default: "bottom",
    description: "Where terminal actions open terminal tabs by default",
    key: "defaultTerminalLocation",
    schema: ["bottom", "sidebar"],
  }),
  runCodexInWindowsSubsystemForLinux: configurationSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether Codex runs inside WSL on Windows",
    key: "runCodexInWindowsSubsystemForLinux",
    schema: "boolean",
  }),

  // --- 热键窗口 ---
  hotkeyWindowProjectlessDefaultEnabled: globalStateSetting({
    agentAccess: "read-write",
    default: false,
    description: "Whether new popout-window tasks default to projectless mode",
    key: "hotkey-window-projectless-default-enabled",
    schema: "boolean",
  }),
} as const;

// ---------------------------------------------------------------------------
// 汇总面
// ---------------------------------------------------------------------------

/** 设置组全集。 */
export const SETTINGS = { git: GIT_SETTINGS, desktop: DESKTOP_SETTINGS } as const;

/** 全部设置定义扁平清单（key → definition）。 */
export const ALL_SETTINGS: Record<string, SettingDefinition> = Object.fromEntries(
  [...Object.values(GIT_SETTINGS), ...Object.values(DESKTOP_SETTINGS)].map((definition) => [definition.key, definition as SettingDefinition]),
);

/** 按 hostStorage 类别分组。 */
export function settingsByKind(kind: HostStorageKind): SettingDefinition[] {
  return Object.values(ALL_SETTINGS).filter((definition) => definition.hostStorage.kind === kind);
}
