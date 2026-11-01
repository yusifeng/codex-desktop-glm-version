// bootstrap chunk 入口：引导主流程 + 对 main chunk 的兼容导出面。
//
// 执行顺序（与原版 25,330-25,493 行逐行对齐）：
//   模块导入（各子系统的模块级初始化，含 OC 快照/appSessionId 等原版在
//   定义区求值的状态）→ Owl shell 断言（startup-failure-dialog 模块加载时）
//   → 命令行开关 → setName/setPath(userData) → 单实例锁 → createDesktopRuntime
//   → whenReady：Windows home 标记 → Intel 警告 → 安装 gate → SQLite 恢复 →
//   Windows 框架 gate → sparkle 初始化 → 动态 require main chunk → 失败兜底。
//
// 128 个兼容导出（docs/bootstrap-export-table.txt）是 main-C-Mhak1n.js（尚未
// 重写）的消费契约：原版的单字母导出名 → 各子系统的语义符号。main chunk
// 重写完成后此导出面可移除。
import { app, BrowserWindow } from "electron";
import { getLogger } from "@chunk/logger";
import { zo as appNameForFlavor, Un as setWindowsCore, Oi as resolveCodexHome } from "@chunk/shared";

import { BuildFlavor, bundleIdentifier } from "./build-info/build-flavor";
import { readPackageMetadataField } from "./metadata/package-metadata";
import { chromiumSwitches } from "./startup/command-line";
import { resolveUserDataPath } from "./startup/user-data";
import { owlUserAgentSwitches, repairDockTile } from "./platform/owl-tweaks";
import { installWindowAllClosedHandler } from "./app/window-all-closed";
import { installConsoleWriteErrorTolerance } from "./logging/file-logger";
import { showIntelOnAppleSiliconWarning } from "./platform/intel-launch-warning";
import { ensureInstalledInApplications } from "./platform/applications-installer";
import { recoverSqliteState } from "./platform/sqlite-recovery";
import {
  isWindowsContainedCore,
  registerWindowsCore,
  readWindowsOemCustomData,
} from "./platform/windows-oem";
import {
  isPrimaryRuntimeFrameworkSupported,
  setPrimaryRuntimeFrameworksEnabled,
  activatePrimaryRuntimeFramework,
} from "./platform/windows-runtime-framework";
import { loadWindowsUpdaterAddon } from "./updater/windows-msix-updater";
import { classifyUpdateFailure } from "./updater/update-errors";
import { showStartupFailureDialog, WEBRTC_FIELD_TRIALS } from "./updater/startup-failure-dialog";
import {
  createStartupContext,
  recordWindowsHomeOwnership,
  createGlobalState,
  readWindowsRuntimeFrameworksEnabled,
} from "./startup/startup-context";
import { createDesktopRuntime } from "./desktop-runtime";
import { needsSingleInstanceLock } from "./deeplinks/manager";

// ---------------------------------------------------------------------------
// 引导主流程（原 25,367-25,493）
// ---------------------------------------------------------------------------

const isMacOS = process.platform === "darwin";
const buildFlavor = BuildFlavor.resolve();
const windowsFlavor =
  process.platform === "win32"
    ? BuildFlavor.getWindowsDistributionFlavor(buildFlavor, readPackageMetadataField("codexWindowsPackageIdentity"))
    : buildFlavor;
const versionMetadata = {
  appVersion: app.getVersion(),
  buildFlavor,
  buildCommit: process.env.CODEX_BUILD_COMMIT?.trim() || readPackageMetadataField("codexBuildCommit"),
};

for (const switchSpec of chromiumSwitches({ buildFlavor, env: process.env }))
  app.commandLine.appendSwitch(switchSpec.name, switchSpec.value);
app.commandLine.appendSwitch("force-fieldtrials", WEBRTC_FIELD_TRIALS);
for (const switchSpec of owlUserAgentSwitches({ isPackaged: app.isPackaged }))
  app.commandLine.hasSwitch(switchSpec.name) ||
    app.commandLine.appendSwitch(switchSpec.name, switchSpec.value);
const disabledBlinkFeatures = new Set(
  app.commandLine.getSwitchValue("disable-blink-features").split(",").filter(Boolean),
);
disabledBlinkFeatures.add("ReplacedNormalFlowStackingInlinePaint");
app.commandLine.removeSwitch("disable-blink-features");
app.commandLine.appendSwitch("disable-blink-features", [...disabledBlinkFeatures].join(","));

installConsoleWriteErrorTolerance();
installWindowAllClosedHandler();
app.setName(appNameForFlavor(windowsFlavor));
app.setPath(
  "userData",
  resolveUserDataPath({ appDataPath: app.getPath("appData"), buildFlavor: windowsFlavor, env: process.env }),
);
if (process.platform === "win32") {
  delete process.env.CODEX_WINDOWS_REGISTERED_CORE;
  delete process.env.CODEX_WINDOWS_SANDBOX_PACKAGE_FAMILY;
  app.setAppUserModelId(bundleIdentifier(windowsFlavor));
}

const needsLock = needsSingleInstanceLock({
  isMacOS,
  isPackaged: app.isPackaged,
  hasExplicitUserDataPath: !!process.env.CODEX_ELECTRON_USER_DATA_PATH?.trim(),
});

if (needsLock && !app.requestSingleInstanceLock()) {
  getLogger().info("Exiting second desktop instance", {
    safe: { packaged: app.isPackaged, platform: process.platform }, sensitive: {},
  });
  app.exit(0);
} else {
  if (repairDockTile()) {
    getLogger().info("Repaired renamed Dock tile", {
      safe: { platform: process.platform, version: app.getVersion() }, sensitive: {},
    });
  }
  const runtime = createDesktopRuntime(buildFlavor);
  if (needsLock) {
    app.on("second-instance", (_event, argv) => {
      runtime.queueSecondInstanceArgs(argv);
    });
  }
  app.whenReady().then(async () => {
    const { desktopSentry, sparkleManager } = runtime;
    if (process.platform === "win32" && app.isPackaged) {
      await recordWindowsHomeOwnership();
    }
    if (
      !(await showIntelOnAppleSiliconWarning({
        appName: app.getName(),
        environment: { arch: process.arch, isPackaged: app.isPackaged, platform: process.platform },
      }))
    ) {
      app.quit();
      return;
    }
    if ((await ensureInstalledInApplications()) || !(await recoverSqliteState(versionMetadata))) return;

    const containedCore = isWindowsContainedCore();
    const primaryFramework = isPrimaryRuntimeFrameworkSupported(buildFlavor, process.platform);
    let coreGateEnabled = false;
    if (containedCore || primaryFramework) {
      try {
        const gate = readWindowsRuntimeFrameworksEnabled(
          createGlobalState(resolveCodexHome()),
          (await readWindowsOemCustomData()) != null,
        );
        coreGateEnabled = gate.core;
        setWindowsCore(gate.core);
        setPrimaryRuntimeFrameworksEnabled(gate.primary);
      } catch (error) {
        setWindowsCore(null);
        setPrimaryRuntimeFrameworksEnabled(false);
        getLogger().warning("windows_runtime_framework_gate_hydration_failed", {
          safe: { buildFlavor },
          sensitive: { error },
        });
      }
    }

    const failureContext = { phase: "bootstrap-import-main" };
    try {
      if (containedCore) {
        const packageFamily = loadWindowsUpdaterAddon()?.getCurrentPackageFamily();
        if (packageFamily) process.env.CODEX_WINDOWS_SANDBOX_PACKAGE_FAMILY = packageFamily;
      }
      await sparkleManager.initialize();
      if (containedCore && coreGateEnabled) registerWindowsCore();
      if (containedCore || primaryFramework) {
        const selectedRuntimeSource = containedCore && coreGateEnabled ? "app-package" : "bundled";
        getLogger().info("windows_core_runtime_launch_selected", {
          safe: {
            buildFlavor,
            architecture: process.arch,
            coreGateEnabledAtStartup: coreGateEnabled,
            selectedRuntimeSource,
          },
          sensitive: {},
        });
      }
      await activatePrimaryRuntimeFramework({ buildFlavor }).catch((error) => {
        getLogger().warning("windows_primary_runtime_framework_activation_failed", {
          safe: { buildFlavor, ...classifyUpdateFailure(error) },
          sensitive: { error },
        });
      });
      const { runMainAppStartup } = await Promise.resolve().then(() => require("@chunk/main"));
      await runMainAppStartup();
    } catch (error) {
      for (const window of BrowserWindow.getAllWindows()) if (!window.isDestroyed()) window.destroy();
      if (process.env.CODEX_DESKTOP_STARTUP_DEBUG === "1") {
        console.error("Desktop bootstrap failed to start the main app", error);
      }
      getLogger().error("Desktop bootstrap failed to start the main app", { safe: failureContext, sensitive: {} });
      desktopSentry.captureException(error, { tags: failureContext });
      await sparkleManager.startUpdaterAfterStartupFailure();
      await showStartupFailureDialog(error);
    }
  });
}

// ---------------------------------------------------------------------------
// 兼容导出面：main-C-Mhak1n.js（未重写）按原版单字母名消费。
// 映射依据 docs/bootstrap-export-table.txt + 各子系统重写报告。
// ---------------------------------------------------------------------------

// 状态键与 schema（state/global-state.ts，值 = 原 bE~XE 键名字符串）
export {
  WORKTREE_CLEANUP_BUFFER_START_MS_KEY as "$",
  COMPLETED_LOCAL_DATA_MIGRATION_IDS_KEY as "B",
  AVATAR_OVERLAY_OPEN_KEY as "F",
  LOCAL_REMOTE_CONTROL_ENVIRONMENT_ID_KEY as "G",
  BROWSER_AUTH_OPERATIONS_KEY as "I",
  PERSISTED_ATOM_STATE_KEY as "J",
  LOCAL_REMOTE_CONTROL_INSTALLATION_ID_KEY as "K",
  BROWSER_EXTENSION_RECENTLY_USED_KEY as "L",
  AUTOMATIONS_HABITAT_MIGRATION_STATE_KEY as "M",
  AUTOMATIONS_INSTALLATION_ID_KEY as "N",
  AVATAR_OVERLAY_BOUNDS_KEY as "P",
  REMOTE_HOSTED_PIP_TASK_VISIBILITY_STATE_KEY as "Q",
  CHROME_EXTENSION_SYNC_MANAGED_PLUGIN_IDS_KEY as "R",
  INTEGRITY_STATE_ENVELOPE_KEY as "U",
  DESKTOP_OTRACES_SAMPLE_RATE_KEY as "V",
  BROWSER_DOWNLOAD_HISTORY_KEY as "W",
  REMOTE_CONTROL_CONFIG_MIGRATION_COMPLETED_KEY as "X",
  REMOTE_CONTROL_CLIENT_ENROLLMENTS_KEY as "Y",
  REMOTE_HOSTED_PIP_CONTENT_MAX_DISPLAY_SIZE_KEY as "Z",
  UNREAD_THREAD_IDS_BY_HOST_KEY as "et",
  MAC_PUSH_DEREGISTRATION_TOKEN_KEY as "q",
  THREAD_READ_STATE_KEY as "tt",
  CODEX_APP_CONFIG_APPLIED_REMOTE_DECLARATIONS_KEY as "z",
  GlobalState as "H",
  applyTheme as "j",
  unreadThreadIdsSchema as "nt",
} from "./state/global-state";

// 启动环境（startup/startup-context.ts）
export {
  writeWindowsRuntimeFrameworksEnabled as "A",
  setInternalUpdateCdnEnabled as "k",
  createStartupContext as "O",
} from "./startup/startup-context";

// 窗口吸附（window/placement-snapping.ts）
export {
  computeSnapAnchors as "ot",
  snapWindowPosition as "at",
  movementBounds as "it",
  defaultSnapRegion as "rt",
  placementToPosition as "st",
  positionFromIndices as "ct",
} from "./window/placement-snapping";

// 表单填充遥测（state/browser-auth-operations.ts）
export {
  BrowserAuthOperationsStore as "dt",
  conversationalOnboardingResultSchema as "ut",
  CONVERSATIONAL_ONBOARDING_COMPLETIONS_KEY as "lt",
} from "./state/browser-auth-operations";

// IPC 频道（ipc/channels.ts）
export {
  MESSAGE_FROM_VIEW as "Pt",
  MESSAGE_FOR_VIEW as "At",
  CHUNKED_MESSAGE_ACK as "Ct",
  REMOTE_HOSTED_PIP_VIDEO_FRAME as "qt",
  BROWSER_SIDEBAR_RUNTIME_MESSAGE as "Mt",
  BROWSER_PAGE_EVENT as "jt",
  MCP_APP_SANDBOX_GUEST_MESSAGE as "Nt",
  MCP_APP_SANDBOX_HOST_MESSAGE as "kt",
  SHOW_CONTEXT_MENU as "Vt",
  GET_SENTRY_INIT_OPTIONS as "Rt",
  GET_BUILD_FLAVOR as "Ft",
  GET_SYSTEM_THEME_VARIANT as "Bt",
  GET_SHARED_OBJECT_SNAPSHOT as "zt",
  GET_INITIAL_SIDEBAR_BOOTSTRAP as "Lt",
  GET_FAST_MODE_ROLLOUT_METRICS as "It",
  SYSTEM_THEME_VARIANT_UPDATED as "Wt",
  TRIGGER_SENTRY_TEST as "Gt",
  CONNECT_APP_HOST as "Ot",
  START_FILE_DRAG as "Ht",
  START_LINK_DRAG as "Ut",
  ICONS_DIRECTORY as "Dt",
  workerMessageFromViewChannel as "Yt",
  workerMessageForViewChannel as "Jt",
} from "./ipc/channels";

// API 端点与认证（api/endpoints.ts + api/authed-fetch.ts）
export {
  PROD_API_BASE_URL as "Kt",
  DEV_API_BASE_URL as "Et",
  DESKTOP_ORIGINATOR as "Tt",
  ORIGINATOR_PREFIX as "wt",
  resolveAppVersion as "St",
  resolveBackendApiUrl as "xt",
} from "./api/endpoints";
export {
  SignInRequiredError as "pt",
  getAuthHeaders as "bt",
  authedFetch as "vt",
  getAccountId as "yt",
  applyOriginatorHeaders as "gt",
  applyWorkspaceRouting as "ht",
  applyAuthHeaders as "mt",
  assertSameAuthIdentity as "_t",
} from "./api/authed-fetch";

// 遥测与日志（telemetry/* + logging/*）
export { OwlCrashCounter as "$t" } from "./telemetry/owl-crash-counter";
export { sentryReady as "Qt", SENTRY_STARTUP_CONFIG as "Zt" } from "./telemetry/desktop-sentry";
export { defaultLogRoot as "Xt" } from "./logging/file-logger";
export {
  setTraceExporter as "D",
  setTraceSampleRate as "E",
  isDesktopTracingEnabled as "T",
  getDesktopTraceSampleRate as "w",
  exportTracePayload as "S",
  flushDesktopTraces as "C",
} from "./telemetry/otel-tracing";
export { createDesktopRuntime as "x" } from "./desktop-runtime";

// 基础设施（A 组模块）
export {
  BuildFlavor as "in",
  bundleIdentifier as "rn",
} from "./build-info/build-flavor";
export { readPackageMetadataField as "an" } from "./metadata/package-metadata";
export { BuildNumber as "nn" } from "./build-info/build-number";
export { appSessionId as "on" } from "./net/network-policy";
export {
  resolveRendererUrl as "cn",
  rendererEntryForRoute as "dn",
  getWebviewDir as "ln",
  parseAppFsMediaUrl as "un",
  installAppProtocolHandler as "fn",
} from "./protocol/app-protocol";
export {
  requireNativeIntl as "hn",
  configureNativeIntl as "mn",
} from "./intl/native-intl";
export { isLogLevelEnabled as "_n", defaultMaxLogLevelForFlavor as "gn" } from "./logging/log-level";
export { noopErrorReporter as "vn" } from "./telemetry/error-reporter";
export { identity as "bn", DETACHED_WINDOW_ROUTE as "yn" } from "./util/misc";

// 深度链接（deeplinks/*）
export {
  parseDeepLink as "_",
  resolveProtocolScheme as "g",
  convertOpenAppUrl as "h",
  sanitizeHttpUrl as "v",
} from "./deeplinks/parse";
export { createDeepLinkManager as "y" } from "./deeplinks/manager";
export { isHttpUrlAllowed as "b" } from "./net/url-gate";

// 平台 gate（F 组模块；注意 YA/XA 不在原导出表内，无需导出）
export { appBundlePath as "m" } from "./startup/user-data";
export { readWindowsOemCustomData as "l" } from "./platform/windows-oem";
export {
  isPrimaryRuntimeFrameworkEnabled as "t",
  setPrimaryRuntimeFrameworksEnabled as "s",
  onPrimaryRuntimeFrameworksEnabledChanged as "a",
  isPrimaryRuntimeFrameworkSupported as "i",
  installPrimaryRuntimeFramework as "r",
  saveFrameworkSelection as "o",
  activatePrimaryRuntimeFramework as "n",
} from "./platform/windows-runtime-framework";
export {
  openStateRuntimeWithRecovery as "p",
  isStateRuntimeStartupError as "d",
  showStateRebuiltDialog as "f",
} from "./platform/sqlite-recovery";
export { setWindowAllClosedCustomCheck as "u" } from "./app/window-all-closed";

// 更新器（C 组模块）
export { loadWindowsUpdaterAddon as "ft" } from "./updater/windows-msix-updater";
export { classifyUpdateFailure as "c" } from "./updater/update-errors";

// vendored 符号（main chunk 直接消费的库内部符号）
// Keep these vendor compatibility exports on unique local bindings.  The
// published main chunk calls `bootstrap.pn()` during module initialization;
// exporting the compressed name directly can collide with an unrelated
// vendor-internal `pn` binding after bundling.
import { it as vendorSn, et as vendorPn, W as vendorTn, tC as vendorEn } from "./vendor";
const vendorPnCompat = () => vendorPn;
export {
  vendorSn as "sn",
  vendorPnCompat as "pn",
  vendorTn as "tn",
  vendorEn as "en",
};
