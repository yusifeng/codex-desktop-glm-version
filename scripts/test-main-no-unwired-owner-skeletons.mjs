import assert from "node:assert/strict";
import fs from "node:fs";

const root = new URL("../", import.meta.url);
const realOwners = [
  ["src/main/main-app/window/window-context.ts", "createWindowContextClass"],
  ["src/main/main-app/fetch-handler/electron-fetch-handler.ts", "createElectronFetchHandlerClass"],
  ["src/main/main-app/misc/open-in-service.ts", "createOpenInServiceClass"],
  ["src/main/main-app/browser-sidebar/browser-comment-overlay-manager.ts", "createBrowserCommentOverlayManagerClass"],
  ["src/main/main-app/browser-sidebar/browser-comment-controller.ts", "createBrowserCommentControllerClass"],
  ["src/main/main-app/browser-use/session-registry.ts", "createBrowserSessionRegistryRuntime"],
  ["src/main/main-app/window/electron-message-handler.ts", "createElectronMessageHandlerClass"],
  ["src/main/main-app/files/desktop-file-services.ts", "createDesktopFileServicesRuntime"],
  ["src/main/main-app/files/library-files-backend.ts", "createLibraryFilesBackendRuntime"],
  ["src/main/main-app/dictation/audio.ts", "createDictationAudioServiceClass"],
  ["src/main/main-app/language-server/providers.ts", "createLanguageServerProvidersRuntime"],
  ["src/main/main-app/language-server/session-runtime.ts", "createLanguageServerSessionRuntime"],
  ["src/main/main-app/language-server/runtime-installer.ts", "createLanguageServerRuntimeInstallerClass"],
  ["src/main/main-app/workspace/worktree-attachment-handler.ts", "createWorktreeAttachmentHandlerClass"],
  ["src/main/main-app/mcp-sandbox/lifecycle.ts", "createMcpSandboxLifecycleRuntime"],
  ["src/main/main-app/mcp-sandbox/network-runtime.ts", "createMcpSandboxNetworkRuntime"],
  ["src/main/main-app/diagnostics/native-command-crash.ts", "createNativeCommandCrashRuntime"],
  ["src/main/main-app/browser-session/browser-session-probe.ts", "createBrowserSessionProbeRuntime"],
  ["src/main/main-app/open-target/open-target-foundation.ts", "createOpenTargetFoundation"],
  ["src/main/main-app/open-target/open-target-registry-runtime.ts", "createOpenTargetRegistryRuntime"],
  ["src/main/main-app/open-target/jetbrains-targets.ts", "createJetBrainsTargetRuntime"],
  ["src/main/main-app/open-target/terminal-targets.ts", "createTerminalTargetRuntime"],
  ["src/main/main-app/open-target/vscode-family-targets.ts", "createVscodeFamilyTargetRuntime"],
  ["src/main/main-app/open-target/standalone-editor-targets.ts", "createStandaloneEditorTargetRuntime"],
  ["src/main/main-app/open-target/native-shell-targets.ts", "createNativeShellTargetRuntime"],
  ["src/main/main-app/misc/primary-runtime-installer.ts", "createPrimaryRuntimeInstaller"],
  ["src/main/main-app/remote/ssh-connection-discovery.ts", "createSshConnectionDiscovery"],
  ["src/main/main-app/remote/remote-control-step-up.ts", "createRemoteControlStepUpRuntime"],
  ["src/main/main-app/thread-read-state/runtime.ts", "createThreadReadStateRuntime"],
  ["src/main/main-app/network/website-preview-fetch.ts", "createWebsitePreviewFetch"],
  ["src/main/main-app/thread-catalog/sources.ts", "createThreadCatalogSources"],
  ["src/main/main-app/app-server/transport-factory.ts", "createAppServerTransportFactory"],
  ["src/main/main-app/app-server/requirements-auth-recovery.ts", "createRequirementsAuthRecoveryRuntime"],
  ["src/main/main-app/app-shell/app-menu.ts", "createApplicationMenuBuilder"],
  ["src/main/main-app/worker/sentry-envelope-transport.ts", "createSentryRpcHandlerClass"],
  ["src/main/main-app/worker/worker-runtime.ts", "createWorkerRuntimeFactory"],
  ["src/main/main-app/startup/workspace-policy-runtime.ts", "createWorkspacePolicyRuntime"],
  ["src/main/main-app/diagnostics/content-tracing-runtime.ts", "createContentTracingRuntime"],
  ["src/main/main-app/workspace/worktree-cleanup-runtime.ts", "createWorktreeCleanupRuntime"],
  ["src/main/main-app/workspace/file-runtime-support.ts", "createWorkspaceFileRuntimeSupport"],
  ["src/main/main-app/terminal/cloud-command-session.ts", "createCloudCommandSessionRuntime"],
  ["src/main/main-app/window/rpc-service-adapters.ts", "createWindowRpcServiceAdapters"],
  ["src/main/main-app/account/account-inputs-owner.ts", "createAccountInputsOwnerClass"],
  ["src/main/main-app/window/desktop-capability-services.ts", "createDesktopCapabilityServices"],
  ["src/main/main-app/remote/codex-app-config-runtime.ts", "createCodexAppConfigRuntime"],
  ["src/main/main-app/app-server/host-client-coordination.ts", "createHostClientCoordinationClass"],
  ["src/main/main-app/app-server/host-assembly.ts", "createHostedAppServerManagerFactory"],
  ["src/main/main-app/remote-control/client.ts", "authorizeRemoteControlEnvironments"],
  ["src/main/main-app/app-server/transports.ts", "AppServerTransportWslStdio"],
  ["src/main/main-app/browser-use/origin-state.ts", "BrowserSettingsSync"],
  ["src/main/main-app/automations/habitat-runtime.ts", "createHabitatAutomationRuntime"],
  ["src/main/main-app/automations/automation-update-tool.ts", "createAutomationUpdateTool"],
  ["src/main/main-app/artifacts/template-picker-runtime.ts", "createArtifactTemplatePickerRuntime"],
  ["src/main/main-app/latex/compile.ts", "compileLatexArtifact"],
  ["src/main/main-app/plugins/download-internal-plugins.ts", "downloadInternalPlugins"],
  ["src/main/main-app/hotkey/global-shortcut.ts", "registerGlobalHotkey"],
  ["src/main/main-app/util/app-paths.ts", "lookupCommandHotkey"],
  ["src/main/main-app/browser/link-opening.ts", "openLinkInPreferredTarget"],
  ["src/main/main-app/browser-sidebar/comment-site-status.ts", "createCommentModeSiteStatus"],
  ["src/main/main-app/browser-sidebar/app-shell-keyboard.ts", "createAppShellKeyboardDispatcher"],
  ["src/main/main-app/browser-sidebar/error-pages.ts", "buildCrashErrorPage"],
  ["src/main/main-app/browser-sidebar/page-store.ts", "BrowserSidebarPageStore"],
  ["src/main/main-app/browser-sidebar/first-party-webview.ts", "authenticateChatGptWebview"],
  ["src/main/main-app/browser-sidebar/find-in-page.ts", "openFindInPage"],
  ["src/main/main-app/browser-sidebar/browser-shortcuts.ts", "createBrowserSidebarKeyboardHandler"],
  ["src/main/main-app/browser-sidebar/iab-tab-candidate-store.ts", "IabTabCandidateStore"],
  ["src/main/main-app/browser-sidebar/browser-tab-lifecycle-runtime.ts", "createBrowserTabLifecycleRuntime"],
  ["src/main/main-app/browser-sidebar/browser-thread-state-runtime.ts", "createBrowserThreadStateRuntime"],
  ["src/main/main-app/browser-sidebar/browser-diagnostics-runtime.ts", "createBrowserDiagnosticsRuntime"],
  ["src/main/main-app/browser-sidebar/incomplete-navigation-service.ts", "createIncompleteNavigationRuntime"],
  ["src/main/main-app/browser-sidebar/browser-lifecycle-debug-events.ts", "createBrowserLifecycleDebugEvents"],
  ["src/main/main-app/browser-sidebar/browser-context-menu.ts", "createBrowserContextMenuRuntime"],
  ["src/main/main-app/browser-sidebar/browser-webview-navigation-runtime.ts", "createBrowserWebviewNavigationRuntime"],
  ["src/main/main-app/browser-sidebar/browser-host-policy-controller.ts", "createBrowserHostPolicyControllerClass"],
  ["src/main/main-app/browser-sidebar/browser-session-service.ts", "createBrowserSessionServiceClass"],
  ["src/main/main-app/browser-sidebar/browser-use-open-request-registry.ts", "BrowserUseOpenRequestRegistry"],
  ["src/main/main-app/browser-sidebar/browser-settings-webview-runtime.ts", "createBrowserSettingsWebviewRuntime"],
  ["src/main/main-app/browser-sidebar/browser-webview-adoption-runtime.ts", "attachPendingAdoptedWebview"],
  ["src/main/main-app/browser-sidebar/browser-annotation-anchor-policy.ts", "createBrowserAnnotationAnchorPolicy"],
  ["src/main/main-app/browser-sidebar/browser-comment-policy.ts", "createBrowserCommentPolicy"],
  ["src/main/main-app/sidebar/saved-section-policy.ts", "createSavedSectionPolicy"],
  ["src/main/main-app/browser-sidebar/site-page-event-runtime.ts", "createSitePageEventRuntime"],
  ["src/main/main-app/browser-sidebar/browser-host-service.ts", "createBrowserHostServiceClass"],
  ["src/main/main-app/window/browser-window-rpc-services.ts", "createBrowserProfileImportServiceClass"],
  ["src/main/main-app/browser-sidebar/browser-history-service.ts", "createBrowserHistoryServiceClass"],
  ["src/main/main-app/browser-sidebar/detached-browser-runtime.ts", "createDetachedBrowserRuntime"],
  ["src/main/main-app/browser-sidebar/extension-recent-use.ts", "createExtensionRecentUseRegistryFactory"],
  ["src/main/main-app/projects/chatgpt-project-files.ts", "createChatGptProjectFilesServiceClass"],
  ["src/main/main-app/environment-config/service.ts", "createEnvironmentConfigServiceClass"],
  ["src/main/main-app/device/codex-micro-service-manager.ts", "createCodexMicroServiceManagerClass"],
  ["src/main/main-app/import/external-agent-import.ts", "createExternalAgentImportHandlers"],
];
for (const [path, factory] of realOwners) {
  const source = fs.readFileSync(new URL(path, root), "utf8");
  assert.equal(source.includes(factory), true, `${path} must contain the wired owner factory`);
  assert.equal(source.includes("not wired"), false, `${path} must not regress to a skeleton`);
}

const removedSkeletons = [
  "src/main/main-app/app-shell/run-main-app-startup.ts",
  "src/main/main-app/sidebar/saved-sections-service.ts",
  "src/main/main-app/sidebar/saved-sections-state.ts",
  "src/main/main-app/sidebar/saved-sections-transactions.ts",
  "src/main/main-app/automations/habitat.ts",
  "src/main/main-app/automations/index.ts",
];

for (const path of removedSkeletons) {
  assert.equal(fs.existsSync(new URL(path, root)), false, `${path} must not return as an unwired owner`);
}

const main = fs.readFileSync(
  new URL(".reference/originals/main/main-C-Mhak1n.ts", root),
  "utf8",
);
const inboxOwner = fs.readFileSync(
  new URL("src/main/main-app/automations/inbox-items.ts", root),
  "utf8",
);
const applicationMenuBuilder = fs.readFileSync(
  new URL("src/main/main-app/app-shell/app-menu.ts", root),
  "utf8",
);
const browserWindowThreadStateController = fs.readFileSync(
  new URL("src/main/main-app/browser-sidebar/browser-window-thread-state-controller.ts", root),
  "utf8",
);
assert.equal(inboxOwner.includes("export class InboxItemsFacade"), true, "InboxItemsFacade must remain a real owner");
assert.equal(main.includes("new InboxItemsFacade({"), true, "InboxItemsFacade must remain wired");
assert.equal(main.includes("PBe = createElectronFetchHandlerClass({"), true, "real Electron fetch owner is wired");
assert.equal(main.includes('require("./main-app/import/external-agent-import.js")'), true, "external-agent import runtime is wired");
assert.equal(main.includes('require("./main-app/artifacts/template-picker-runtime.js")'), true, "artifact template picker runtime is wired");
assert.equal(main.includes('require("./main-app/automations/automation-update-tool.js")'), true, "automation update tool is wired");
assert.equal(main.includes("function JN("), false, "generated artifact template config owner must be removed");
assert.equal(main.includes("async function iMe("), false, "generated artifact template loader must be removed");
assert.equal(main.includes("async function xMe("), false, "generated automation update tool must be removed");
assert.equal(main.includes('require("./main-app/latex/compile.js")'), true, "LaTeX runtime is wired");
assert.equal(main.includes('require("./main-app/plugins/download-internal-plugins.js")'), true, "internal plugin runtime is wired");
assert.equal(main.includes('require("./main-app/hotkey/global-shortcut.js")'), true, "global shortcut runtime is wired");
assert.equal(main.includes('require("./main-app/util/app-paths.js")'), true, "app paths runtime is wired");
assert.equal(main.includes('require("./main-app/browser/link-opening.js")'), true, "link opening runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/comment-site-status.js")'), true, "comment site status runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/app-shell-keyboard.js")'), true, "app-shell keyboard runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/error-pages.js")'), true, "browser error-pages runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/page-store.js")'), true, "browser page-store runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/first-party-webview.js")'), true, "first-party webview runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/find-in-page.js")'), true, "browser find runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-shortcuts.js")'), true, "browser shortcuts runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/iab-tab-candidate-store.js")'), true, "IAB candidate store is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-tab-lifecycle-runtime.js")'), true, "browser tab lifecycle runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-thread-state-runtime.js")'), true, "browser thread state runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-diagnostics-runtime.js")'), true, "browser diagnostics runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/incomplete-navigation-service.js")'), true, "incomplete navigation runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-lifecycle-debug-events.js")'), true, "browser lifecycle debug events are wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-context-menu.js")'), true, "browser context menu is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-webview-navigation-runtime.js")'), true, "browser webview navigation runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-media-state-tracker.js")'), true, "browser media state tracker is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/site-tools-availability.js")'), true, "site tools availability runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/sites-bootstrap-token.js")'), true, "Sites bootstrap token runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-page-presentation-policy.js")'), true, "browser page presentation policy is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-session-notification-bridge.js")'), true, "browser session notification bridge is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/site-page-event-runtime.js")'), true, "site page-event runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-session-service.js")'), true, "browser session service is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-use-open-request-registry.js")'), true, "browser open-request registry is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-settings-webview-runtime.js")'), true, "browser settings webview runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-webview-adoption-runtime.js")'), true, "browser webview adoption runtime is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-annotation-anchor-policy.js")'), true, "browser annotation anchor policy is wired");
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-comment-policy.js")'), true, "browser comment policy is wired");
assert.equal(main.includes('require("./main-app/sidebar/saved-section-policy.js")'), true, "saved-section policy is wired");
for (const oldOwner of ["function Wb(", "function Gb(", "function Kb(", "function qb(", "function _H(", "function eBe(", "function vH(", "function bH(", "function wH(", "function DH(", "function OH(", "function AH("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated saved-section policy must be removed`);
}
for (const oldOwner of ["function gGe(", "function HK(", "function UK(", "function WK(", "function GK(", "function KK(", "function JK(", "function kGe(", "function tq(", "function PGe("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser comment policy must be removed`);
}
assert.equal(main.includes('require("./main-app/language-server/runtime-installer.js")'), true, "language-server runtime installer is wired");
for (const oldOwner of ["function lX(", "function uX(", "function $Ye(", "function dX(", "function eXe(", "function fX(", "function tXe(", "function nXe(", "function pX("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser tab lifecycle owner must be removed`);
}
for (const oldOwner of ["function mX(", "function hX(", "function gX(", "function rXe(", "function iXe(", "function aXe(", "function _X(", "function oXe(", "function vX(", "function sXe("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser thread state owner must be removed`);
}
for (const oldOwner of ["function gXe(", "function kX("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated conversation transfer owner must be removed`);
}
for (const oldOwner of ["function AX(", "function vXe(", "function yXe(", "function bXe(", "function xXe(", "function SXe("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser window lookup owner must be removed`);
}
for (const oldOwner of ["function jX(", "function DXe(", "function OXe(", "function kXe(", "function AXe(", "function jXe(", "function MXe(", "function NXe(", "function PXe(", "function FX(", "function IX("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser diagnostics owner must be removed`);
}
for (const oldOwner of ["IXe = class", "function RX(", "function UXe(", "function WXe("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated incomplete navigation owner must be removed`);
}
for (const oldOwner of ["function TXe(", "function NX(", "function EXe(", "function PX("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated lifecycle debug emitter must be removed`);
}
for (const oldOwner of ["function zX(", "function LXe(", "function RXe(", "function BX(", "function zXe(", "function BXe(", "function VX(", "function VXe("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser context menu owner must be removed`);
}
for (const oldOwner of ["function GXe(", "function KXe(", "function qXe(", "function JXe(", "function YXe(", "function WX(", "function GX("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser webview navigation owner must be removed`);
}
assert.equal(main.includes("function KX("), false, "generated browser media state tracker must be removed");
for (const oldOwner of ["function qX(", "function JX(", "function YX(", "function XX(", "function $Xe(", "function ZX(", "function QX("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated site tools availability owner must be removed`);
}
for (const oldOwner of ["function rZe(", "async function iZe("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated Sites authentication owner must be removed`);
}
for (const oldOwner of ["function oZe(", "function sZe(", "function lZ(", "function cZe(", "function dZe(", "function dZ("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated page materialization/presentation owner must be removed`);
}
assert.equal(main.includes("function uZe("), false, "generated runtime snapshot projection owner must be removed");
assert.equal(main.includes("function fZe("), false, "generated browser load-error recovery owner must be removed");
for (const oldOwner of ["function fZ(", "function pZ(", "function mZ(", "function pZe(", "function mZe("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated webview binding helper must be removed`);
assert.equal(main.includes("async function gZe("), false, "generated browser window transfer owner must be removed");
for (const oldOwner of ["function wZe(", "function TZe(", "function EZe(", "function DZe("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser session notification bridge owner must be removed`);
for (const oldOwner of ["function OZe(", "function kZe("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser command/runtime helper must be removed`);
for (const oldOwner of ["function QHe(", "function yZ(", "function MZe(", "function FZe(", "function IZe("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated site page-event runtime owner must be removed`);
for (const oldOwner of ["function LZe(", "function RZe(", "function zZe(", "function BZe(", "function HZe(", "function UZe(", "function WZe("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser command policy owner must be removed`);
for (const oldOwner of ["function YZe(", "function XZe(", "function ZZe(", "function QZe(", "TZ = class"]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated screenshot/permission helper must be removed`);
for (const oldOwner of ["function OYe(", "function kYe(", "function VY(", "function HY(", "function AYe(", "function UY(", "function jYe(", "function MYe(", "function WY(", "function GY(", "function KY(", "function NYe(", "function PYe(", "function FYe(", "function IYe(", "function qY(", "function JY(", "function LYe(", "function RYe(", "function YY(", "function XY(", "function zYe(", "function BYe(", "function ZY(", "function VYe(", "function QY(", "function $Y(", "function HYe(", "function UYe(", "function eX(", "async function WYe(", "function tX(", "function nX(", "function rX("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated IAB policy helper must be removed`);
for (const oldOwner of ["function A1e(", "P1e = class", "async function F1e(", "async function I1e(", "async function L1e(", "async function UQ(", "async function WQ(", "async function GQ("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated language-server runtime installer must be removed`);
for (const oldOwner of ["BWe = class", "function VWe(", "UWe = class"]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser session/open-request owner must be removed`);
for (const oldOwner of ["function CWe(", "function wWe(", "function zG(", "function TWe(", "function EWe(", "function DWe(", "function BG(", "function OWe(", "function VG(", "function kWe(", "function AWe(", "function HG(", "function jWe(", "function UG(", "function MWe(", "function WG("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated browser settings webview owner must be removed`);
for (const oldOwner of ["function GG(", "function KG(", "function qG(", "function NWe(", "function PWe(", "function FWe(", "function IWe("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated webview adoption owner must be removed`);
for (const oldOwner of ["function ZG(", "function KWe(", "function $G(", "function eK(", "function tK(", "function nK(", "function rK(", "function iK(", "function aK("]) assert.equal(main.includes(oldOwner), false, `${oldOwner} generated annotation anchor policy must be removed`);
assert.equal(main.includes("virtualTargetIdSchema: VC"), true, "virtual annotation target id schema must be restored and wired");
assert.equal(browserWindowThreadStateController.includes("owner,"), true, "webview lifecycle must receive its owner");
assert.equal(browserWindowThreadStateController.includes("preloadPath: EZ"), true, "webview lifecycle must receive the browser preload");
assert.equal(browserWindowThreadStateController.includes("registerWindowShutdown("), true, "new browser windows must register shutdown persistence");
assert.equal(browserWindowThreadStateController.includes("disposeWindowState(windowId"), true, "browser window lifecycle must retain disposal");
assert.equal(main.includes("disposeWindowState(...args)"), true, "browser host must expose window disposal");
for (const oldOwner of ["function cXe(", "function bX(", "async function lXe(", "function uXe(", "function xX(", "function SX(", "function dXe(", "function fXe(", "function CX(", "function wX(", "function TX(", "function EX(", "function pXe(", "function DX(", "function mXe(", "function hXe(", "function OX("]) {
  assert.equal(main.includes(oldOwner), false, `${oldOwner} generated Browser Use route adapter must be removed`);
}
assert.equal(main.includes('require("./main-app/browser-sidebar/browser-host-policy-controller.js")'), true, "browser host policy controller is wired");
assert.equal(main.includes("async function QRe("), false, "generated LaTeX compiler must be removed");
assert.equal(main.includes("async function lze("), false, "generated internal plugin downloader must be removed");
assert.equal(main.includes("function qV("), false, "generated global hotkey owner must be removed");
assert.equal(main.includes("async function oH("), false, "generated app icon owner must be removed");
assert.equal(main.includes("async function IH("), false, "generated link opening owner must be removed");
assert.equal(main.includes("function mBe("), false, "generated Slack link parser must be removed");
assert.equal(main.includes("function ZBe("), false, "generated comment site status owner must be removed");
assert.equal(main.includes("function iU("), false, "generated app-shell zoom policy must be removed");
assert.equal(main.includes("function uVe("), false, "generated app-shell keyboard dispatcher must be removed");
assert.equal(main.includes("function yU("), false, "generated close-tab accelerator owner must be removed");
assert.equal(main.includes("function mVe("), false, "generated image attachment suspension owner must be removed");
assert.equal(main.includes("async function xU("), false, "generated browser image attachment owner must be removed");
assert.equal(main.includes("function OHe("), false, "generated browser error-page renderer must be removed");
assert.equal(main.includes("function VU("), false, "generated embedded JSON serializer must be removed");
assert.equal(main.includes("function WU("), false, "generated browser page message fanout must be removed");
assert.equal(main.includes("GHe = class"), false, "generated browser page store must be removed");
assert.equal(main.includes("var YHe = class"), false, "generated browser page persistence must be removed");
assert.equal(main.includes("function ZHe("), false, "generated browser page serializer must be removed");
assert.equal(main.includes("async function xW("), false, "generated ChatGPT webview auth owner must be removed");
assert.equal(main.includes("async function CW("), false, "generated session plan poller must be removed");
assert.equal(main.includes("function lUe("), false, "generated first-party attach hook must be removed");
assert.equal(main.includes("function uUe("), false, "generated authenticated webview mount owner must be removed");
assert.equal(main.includes("function oq("), false, "generated browser find state owner must be removed");
assert.equal(main.includes("function HGe("), false, "generated browser shortcuts handler must be removed");
assert.equal(main.includes("function mq("), false, "generated browser shortcut accelerator map must be removed");
assert.equal(main.includes("var qGe = class"), false, "generated IAB candidate store must be removed");
assert.equal(main.includes("function JGe("), false, "generated IAB candidate ordering policy must be removed");
assert.equal(main.includes("function YGe("), false, "generated IAB candidate filter must be removed");
assert.equal(main.includes("function XGe("), false, "generated IAB candidate projector must be removed");
assert.equal(main.includes("function _Ie("), false, "generated external-agent handlers must be removed");
assert.equal(main.includes("function lIe("), false, "generated Cowork adapter wrapper must be removed");
assert.equal(main.includes("async function VIe("), false, "generated imported-project finalizer must be removed");
assert.equal(main.includes("ert = createWindowContextClass({"), true, "real WindowContext owner is wired");
assert.equal(main.includes("N0 = createOpenInServiceClass({"), true, "real OpenInService owner is wired");
assert.equal(main.includes("N0 = class extends"), false, "generated OpenInService owner must be removed");
assert.equal(main.includes("JWe = createBrowserCommentOverlayManagerClass({"), true, "real browser comment overlay owner is wired");
assert.equal(main.includes("JWe = class"), false, "generated browser comment overlay owner must be removed");
assert.equal(main.includes("hGe = createBrowserCommentControllerClass({"), true, "real browser comment controller owner is wired");
assert.equal(main.includes("hGe = class"), false, "generated browser comment controller owner must be removed");
assert.equal(main.includes("BrowserSessionRegistry: cX, BrowserUseHost: ZYe"), true, "real browser session registry is wired");
assert.equal(main.includes("cX = class"), false, "generated browser session registry must be removed");
assert.equal(main.includes("r$e = createElectronMessageHandlerClass({"), true, "real Electron message handler owner is wired");
assert.equal(main.includes("r$e = class"), false, "generated Electron message handler owner must be removed");
assert.equal(main.includes("createDesktopFileServicesRuntime({"), true, "real desktop file service owners are wired");
assert.equal(main.includes("a$e = class"), false, "generated app-server client registry must be removed");
assert.equal(main.includes("k$e = createDictationAudioServiceClass({"), true, "real dictation audio owner is wired");
assert.equal(main.includes("k$e = class"), false, "generated dictation audio owner must be removed");
assert.equal(main.includes("createLibraryFilesBackendRuntime({"), true, "real Library files backend owner is wired");
assert.equal(main.includes("t1e = class"), false, "generated Library files backend must be removed");
assert.equal(main.includes("async function BQ("), false, "generated projectless workspace scope must be removed");
assert.equal(main.includes("createLanguageServerProvidersRuntime({"), true, "real language-server providers are wired");
assert.equal(main.includes("createLanguageServerSessionRuntime({"), true, "real language-server session owner is wired");
assert.equal(main.includes("var QQ = class"), false, "generated command resolver must be removed");
assert.equal(main.includes("q1e = class"), false, "generated Java provider must be removed");
assert.equal(main.includes("var F0e = class"), false, "generated Kotlin provider must be removed");
assert.equal(main.includes("z0e = class"), false, "generated language-server session must be removed");
assert.equal(main.includes("var Q0e = class"), false, "generated language-server RPC owner must be removed");
assert.equal(main.includes("$0e = createWorktreeAttachmentHandlerClass({"), true, "real worktree attachment owner is wired");
assert.equal(main.includes("var $0e = class"), false, "generated worktree attachment owner must be removed");
assert.equal(main.includes("createMcpSandboxLifecycleRuntime({"), true, "real MCP sandbox lifecycle is wired");
assert.equal(main.includes("function a2e("), false, "generated MCP guest listener owner must be removed");
assert.equal(main.includes("function S2e("), false, "generated MCP webview attachment owner must be removed");
assert.equal(main.includes("function b2e("), false, "generated MCP init bridge must be removed");
assert.equal(main.includes("createMcpSandboxNetworkRuntime({"), true, "real MCP sandbox network owner is wired");
assert.equal(main.includes("function c2e("), false, "generated MCP prewarm cache must be removed");
assert.equal(main.includes("function h2e("), false, "generated MCP default header installer must be removed");
assert.equal(main.includes("function g2e("), false, "generated MCP session restriction owner must be removed");
assert.equal(main.includes("D2e = class extends"), false, "generated MCP sandbox data handler must be removed");
assert.equal(main.includes("createNativeCommandCrashRuntime({"), true, "real native command crash owner is wired");
assert.equal(main.includes("function P2e("), false, "generated native crash classifier must be removed");
assert.equal(main.includes("async function F2e("), false, "generated native crash reporter must be removed");
assert.equal(main.includes("function R2e("), false, "generated primary-runtime attribution must be removed");
assert.equal(main.includes("createBrowserSessionProbeRuntime({"), true, "real browser session probe owner is wired");
assert.equal(main.includes("e4e = class extends"), false, "generated browser session probe class must be removed");
assert.equal(main.includes("function U2e("), false, "generated source-window focus poller must be removed");
assert.equal(main.includes("function t4e("), false, "generated browser callback parser must be removed");
assert.equal(main.includes("async function r4e("), false, "generated browser challenge requester must be removed");
assert.equal(main.includes("createOpenTargetFoundation({"), true, "real open-target foundation is wired");
assert.equal(main.includes("var m1 = new Map(["), false, "generated native-document map owner must be removed");
assert.equal(main.includes("function p4e("), false, "generated remote authority policy must be removed");
assert.equal(main.includes("function S4e("), false, "generated custom target parser must be removed");
assert.equal(main.includes("function P1("), false, "generated macOS application lookup must be removed");
assert.equal(main.includes("function U1("), false, "generated editor descriptor constructor must be removed");
assert.equal(main.includes("createOpenTargetRegistryRuntime({"), true, "real open-target registry runtime is wired");
assert.equal(main.includes("function c6e("), false, "generated platform target projection must be removed");
assert.equal(main.includes("async function d6e("), false, "generated target launch dispatch must be removed");
assert.equal(main.includes("async function P0("), false, "generated native target projection must be removed");
assert.equal(main.includes("async function v6e("), false, "generated browser application discovery must be removed");
assert.equal(main.includes("createJetBrainsTargetRuntime({"), true, "real JetBrains target owner is wired");
assert.equal(main.includes("function C3e("), false, "generated Toolbox scanner must be removed");
assert.equal(main.includes("function o0("), false, "generated JetBrains descriptor builder must be removed");
assert.equal(main.includes("function w3e("), false, "generated Linux JetBrains detector must be removed");
assert.equal(main.includes("function O3e("), false, "generated Windows JetBrains detector must be removed");
assert.equal(main.includes("createTerminalTargetRuntime({"), true, "real terminal target owner is wired");
assert.equal(main.includes("function q1("), false, "generated terminal descriptor builder must be removed");
assert.equal(main.includes("async function L4e("), false, "generated Linux terminal launcher must be removed");
assert.equal(main.includes("async function K4e("), false, "generated macOS editor-terminal bridge must be removed");
assert.equal(main.includes("async function J4e("), false, "generated Cmder detector must be removed");
assert.equal(main.includes("function p0("), false, "generated WSL argument builder must be removed");
assert.equal(main.includes("createVscodeFamilyTargetRuntime({"), true, "real VS Code family target owner is wired");
assert.equal(main.includes("function M4e("), false, "generated Antigravity Windows detector must be removed");
assert.equal(main.includes("X4e = ("), false, "generated VS Code family argument builder must be removed");
assert.equal(main.includes("function n0("), false, "generated Cursor macOS runtime detector must be removed");
assert.equal(main.includes("function Z4e("), false, "generated Cursor Windows detector must be removed");
assert.equal(main.includes("function G3e("), false, "generated VS Code Windows detector must be removed");
assert.equal(main.includes("function q3e("), false, "generated VS Code Insiders Windows detector must be removed");
assert.equal(main.includes("createStandaloneEditorTargetRuntime({"), true, "real standalone editor target owner is wired");
assert.equal(main.includes("var r0 ="), false, "generated Emacs argument builder must be removed");
assert.equal(main.includes("function l0("), false, "generated standalone editor argument builder must be removed");
assert.equal(main.includes("function j3e("), false, "generated SSH editor URI builder must be removed");
assert.equal(main.includes("function u0("), false, "generated editor location formatter must be removed");
assert.equal(main.includes("function N3e("), false, "generated Sublime macOS detector must be removed");
assert.equal(main.includes("function P3e("), false, "generated Sublime Windows detector must be removed");
assert.equal(main.includes("function z3e("), false, "generated TextMate argument builder must be removed");
assert.equal(main.includes("function U3e("), false, "generated Visual Studio detector must be removed");
assert.equal(main.includes("function h0("), false, "generated Xcode runtime detector must be removed");
assert.equal(main.includes("function e6e("), false, "generated Xcode container search must be removed");
assert.equal(main.includes("async function t6e("), false, "generated Xcode launcher must be removed");
assert.equal(main.includes("function r6e("), false, "generated Zed macOS detector must be removed");
assert.equal(main.includes("function i6e("), false, "generated Zed Windows detector must be removed");
assert.equal(main.includes("function a6e("), false, "generated Zed app-path parser must be removed");
assert.equal(main.includes("async function o6e("), false, "generated Zed launcher must be removed");
assert.equal(main.includes("createNativeShellTargetRuntime({"), true, "real native shell target owner is wired");
assert.equal(main.includes("function t3e("), false, "generated Windows Explorer detector must be removed");
assert.equal(main.includes("async function i0("), false, "generated native path opener must be removed");
assert.equal(main.includes("function n3e("), false, "generated nearest-existing-path resolver must be removed");
assert.equal(main.includes("function a3e("), false, "generated Git Bash detector must be removed");
assert.equal(main.includes("function o3e("), false, "generated Git Bash icon resolver must be removed");
assert.equal(main.includes("function c3e("), false, "generated GitHub Desktop detector must be removed");
assert.equal(main.includes("async function I3e("), false, "generated macOS default launcher must be removed");
assert.equal(main.includes("async function L3e("), false, "generated Linux default launcher must be removed");
assert.equal(main.includes("async function d0("), false, "generated Electron shell launcher must be removed");
assert.equal(main.includes("createPrimaryRuntimeInstaller({"), true, "real primary runtime installer owner is wired");
assert.equal(main.includes("async function D6e("), false, "generated dependency tool owner must be removed");
assert.equal(main.includes("function U0("), false, "generated dependency tool failure builder must be removed");
assert.equal(main.includes("function Y0("), false, "generated runtime cancellation owner must be removed");
assert.equal(main.includes("function X0("), false, "generated runtime feature projection must be removed");
assert.equal(main.includes("async function Z0("), false, "generated runtime feature reader must be removed");
assert.equal(main.includes("async function Q0("), false, "generated runtime install call owner must be removed");
assert.equal(main.includes("function $0("), false, "generated runtime outcome logger must be removed");
assert.equal(main.includes("function e2("), false, "generated runtime skill reload helper must be removed");
assert.equal(main.includes("async function t2("), false, "generated runtime plugin sync must be removed");
assert.equal(main.includes("async function k6e("), false, "generated safe marketplace copy must be removed");
assert.equal(main.includes("async function n2("), false, "generated bundled skill sync must be removed");
assert.equal(main.includes("async function A6e("), false, "generated legacy skill migration must be removed");
assert.equal(main.includes("function j6e("), false, "generated removed-skill path resolver must be removed");
assert.equal(main.includes("function M6e("), false, "generated skill containment predicate must be removed");
assert.equal(main.includes("function r2("), false, "generated filesystem error predicate must be removed");
assert.equal(main.includes("function i2("), false, "generated runtime abort classifier must be removed");
assert.equal(main.includes("function a2("), false, "generated runtime failure reporter must be removed");
assert.equal(main.includes("function N6e("), false, "generated runtime restore owner must be removed");
assert.equal(main.includes("function o2("), false, "generated Windows release selector must be removed");
assert.equal(main.includes("function s2("), false, "generated Windows framework predicate must be removed");
assert.equal(main.includes("function P6e("), false, "generated runtime single-flight owner must be removed");
assert.equal(main.includes("async function F6e("), false, "generated dependency reader must be removed");
assert.equal(main.includes("async function c2("), false, "generated runtime diagnostics owner must be removed");
assert.equal(main.includes("function l2("), false, "generated runtime selection logger must be removed");
assert.equal(main.includes("async function I6e("), false, "generated runtime repair owner must be removed");
assert.equal(main.includes("function u2("), false, "generated local-host assertion must be removed");
assert.equal(main.includes("q0 = new Map()"), false, "generated active-install registry must be removed");
assert.equal(main.includes("J0 = Promise.resolve()"), false, "generated runtime operation queue must be removed");
assert.equal(main.includes("createSshConnectionDiscovery({"), true, "real SSH connection discovery owner is wired");
assert.equal(main.includes("function Q2("), false, "generated SSH alias discovery entrypoint must be removed");
assert.equal(main.includes("function o5e("), false, "generated recursive SSH alias collector must be removed");
assert.equal(main.includes("async function $2("), false, "generated SSH alias resolver must be removed");
assert.equal(main.includes("function e4("), false, "generated SSH Include traversal must be removed");
assert.equal(main.includes("function s5e("), false, "generated resolved SSH config parser must be removed");
assert.equal(main.includes("function t4("), false, "generated SSH directive flattener must be removed");
assert.equal(main.includes("function c5e("), false, "generated SSH include-path resolver must be removed");
assert.equal(main.includes("function l5e("), false, "generated literal-host selector must be removed");
assert.equal(main.includes("function n4("), false, "generated SSH directive value projector must be removed");
assert.equal(main.includes("function u5e("), false, "generated SSH scalar directive projector must be removed");
assert.equal(main.includes("function d5e("), false, "generated SSH home expansion must be removed");
assert.equal(main.includes("createRemoteControlStepUpRuntime({"), true, "real remote-control step-up owner is wired");
assert.equal(main.includes("async function y5e("), false, "generated remote-control step-up flow must be removed");
assert.equal(main.includes("function b5e("), false, "generated OAuth authorize URL builder must be removed");
assert.equal(main.includes("function x5e("), false, "generated login issuer resolver must be removed");
assert.equal(main.includes("function o4("), false, "generated issuer normalizer must be removed");
assert.equal(main.includes("function S5e("), false, "generated PKCE owner must be removed");
assert.equal(main.includes("function s4("), false, "generated OAuth random-state helper must be removed");
assert.equal(main.includes("async function C5e("), false, "generated OAuth token exchanger must be removed");
assert.equal(main.includes("async function w5e("), false, "generated OAuth callback server must be removed");
assert.equal(main.includes("function c4("), false, "generated callback text response writer must be removed");
assert.equal(main.includes("function T5e("), false, "generated callback success page writer must be removed");
assert.equal(main.includes("app_EMoamEEZ73f0CkXaXp7hrann"), false, "generated OAuth client configuration must be removed");
assert.equal(main.includes("CODEX_APP_SERVER_LOGIN_ISSUER"), false, "generated issuer environment policy must be removed");
assert.equal(main.includes("var Ant = createThreadReadStateRuntime({"), true, "real thread read-state runtime is wired");
assert.equal(main.includes("function Ant("), false, "generated thread read-state runtime must be removed");
assert.equal(main.includes("g = new Ont({"), false, "generated read-state composition must be removed");
assert.equal(main.includes("var qnt = createWebsitePreviewFetch({"), true, "real website-preview fetch is wired");
assert.equal(main.includes("function qnt("), false, "generated website-preview fetch must be removed");
assert.equal(main.includes("createThreadCatalogSources({"), true, "real thread-catalog sources are wired");
assert.equal(main.includes("function M5("), false, "generated app-server catalog source must be removed");
assert.equal(main.includes("function fnt("), false, "generated ChatGPT catalog source must be removed");
assert.equal(main.includes("function N5("), false, "generated ChatGPT catalog projection must be removed");
assert.equal(main.includes("createAppServerTransportFactory({"), true, "real app-server transport factory is wired");
assert.equal(main.includes("function trt("), false, "generated host-kind projection must be removed");
assert.equal(main.includes("function K5("), false, "generated app-server transport factory must be removed");
assert.equal(main.includes("var rrt = createRequirementsAuthRecoveryRuntime({"), true, "real requirements auth recovery is wired");
assert.equal(main.includes("function rrt("), false, "generated requirements recovery factory must be removed");
assert.equal(main.includes("async function irt("), false, "generated requirements recovery loop must be removed");
assert.equal(main.includes("desktop.requirementsAuthRecovery.title"), false, "generated recovery message table must be removed");
assert.equal(main.includes("var sit = createApplicationMenuBuilder({"), true, "real application-menu builder is wired");
assert.equal(main.includes("function sit("), false, "generated application-menu builder must be removed");
assert.equal(main.includes("function iit("), false, "generated application role-menu builder must be removed");
assert.equal(main.includes("var g7 ="), false, "generated application-menu label map must be removed");
assert.equal(applicationMenuBuilder.includes("return [section(\"file-menu\")"), false, "application-menu skeleton must be replaced");
assert.equal(main.includes("createSentryRpcHandlerClass({"), true, "real Sentry RPC adapter is wired");
assert.equal(main.includes("var hst = class"), false, "generated Sentry RPC class must be removed");
assert.equal(main.includes("var xst = createWorkerRuntimeFactory({"), true, "real worker runtime factory is wired");
assert.equal(main.includes("function xst("), false, "generated worker runtime wrapper must be removed");
assert.equal(main.includes("var Tst = createWorkspacePolicyRuntime({"), true, "real workspace-policy runtime is wired");
assert.equal(main.includes("function Tst("), false, "generated workspace-policy checker wrapper must be removed");
assert.equal(main.includes("function Est("), false, "generated workspace-policy dialog wrapper must be removed");
assert.equal(main.includes("function Ist("), false, "generated quit-for-update proxy must be removed");
assert.equal(main.includes("function Lst("), false, "generated computer-use RPC proxy must be removed");
assert.equal(main.includes("function V9("), false, "dead object predicate proxy must be removed");
assert.equal(main.includes("function gst("), false, "dead method predicate proxy must be removed");
assert.equal(main.includes("createContentTracingRuntime({"), true, "real content-tracing runtime is wired");
assert.equal(main.includes("function dQe("), false, "generated performance snapshot combiner must be removed");
assert.equal(main.includes("async function wQe("), false, "generated trace runtime-health collector must be removed");
assert.equal(main.includes("function EQe("), false, "generated trace start-confirmation owner must be removed");
assert.equal(main.includes("function IQe("), false, "generated trace menu lifecycle must be removed");
assert.equal(main.includes("async function RQe("), false, "generated trace upload retry owner must be removed");
assert.equal(main.includes("function GZ("), false, "generated trace buffer poller must be removed");
assert.equal(main.includes("var PZ = null"), false, "generated trace pending-state globals must be removed");
assert.equal(main.includes("createWorktreeCleanupRuntime({"), true, "real worktree-cleanup runtime is wired");
assert.equal(main.includes("function Ree("), false, "generated worktree cleanup planner must be removed");
assert.equal(main.includes("async function qZ("), false, "generated worktree thread metadata reader must be removed");
assert.equal(main.includes("function JZ("), false, "generated pinned-thread reader must be removed");
assert.equal(main.includes("function HQe("), false, "generated pinned-root protection must be removed");
assert.equal(main.includes("async function WQe("), false, "generated worktree settings reader must be removed");
assert.equal(main.includes("function GQe("), false, "generated migration protection owner must be removed");
assert.equal(main.includes("function YZ("), false, "generated workspace-root protection must be removed");
assert.equal(main.includes("createWorkspaceFileRuntimeSupport({"), true, "real workspace-file support is wired");
assert.equal(main.includes("async function sQ("), false, "generated atomic workspace writer must be removed");
assert.equal(main.includes("async function cQ("), false, "generated workspace buffer classifier must be removed");
assert.equal(main.includes("async function lQ("), false, "generated workspace stat adapter must be removed");
assert.equal(main.includes("function pQ("), false, "generated local workspace path resolver must be removed");
assert.equal(main.includes("function mQ("), false, "generated workspace path normalizer must be removed");
assert.equal(main.includes("createCloudCommandSessionRuntime({"), true, "real cloud-command session is wired");
assert.equal(main.includes("async function K$e("), false, "generated cloud cwd resolver must be removed");
assert.equal(main.includes("async function J$e("), false, "generated cloud terminal owner must be removed");
assert.equal(main.includes("q$e = n.wf"), false, "generated cloud output schema owner must be removed");
assert.equal(main.includes("createCloudCommandSession,"), true, "cloud command consumer must use semantic output");
assert.equal(main.includes("    J$e,"), false, "generated cloud command alias must be removed");
assert.equal(main.includes("createWindowRpcServiceAdapters({"), true, "real WindowContext RPC adapters are wired");
assert.equal(main.includes("var Y$e = class"), false, "generated hotkey-window service must be removed");
assert.equal(main.includes("X$e = class extends"), false, "generated keyboard-modifier service must be removed");
assert.equal(main.includes("var u1e = class"), false, "generated local-environments service must be removed");
assert.equal(main.includes("y6e = class extends"), false, "generated Owl runtime-feature service must be removed");
assert.equal(main.includes("var b6e = class"), false, "generated performance telemetry service must be removed");
assert.equal(main.includes("var T6e = class"), false, "generated marketplace listing service must be removed");
assert.equal(main.includes("var R0 = {}"), false, "generated runtime-feature state owner must be removed");
assert.equal(main.includes("AccountInputsOwner = createAccountInputsOwnerClass({"), true, "real account-input owner is wired");
assert.equal(main.includes("eEe = class extends"), false, "generated account-input owner must be removed");
assert.equal(main.includes("CTe = class extends"), false, "generated stable-id owner must be removed");
assert.equal(main.includes("DTe = class"), false, "generated thread-summary store must be removed");
assert.equal(main.includes("async function cT("), false, "generated token account reader must be removed");
assert.equal(main.includes("BTe = class"), false, "generated integrity-state owner must be removed");
assert.equal(main.includes("IOe = class extends"), false, "generated update-capability service must be removed");
assert.equal(main.includes("async function LOe("), false, "generated native swipe adapter must be removed");
assert.equal(main.includes("ROe = class extends"), false, "generated avatar-overlay service must be removed");
assert.equal(main.includes("zOe = class extends"), false, "generated avatar scroll owner must be removed");
assert.equal(main.includes("BOe = class extends"), false, "generated avatar stop handle must be removed");
assert.equal(main.includes("PrimaryWindowActionsBridge,"), true, "semantic window action bridge must be wired");
assert.equal(main.includes("createDesktopCapabilityServices({"), true, "real desktop capability services are wired");
assert.equal(main.includes("cOe = class extends"), false, "generated app update service must be removed");
assert.equal(main.includes("lOe = class extends"), false, "generated application-menu snapshot must be removed");
assert.equal(main.includes("function YE("), false, "generated native menu projector must be removed");
assert.equal(main.includes("yOe = class extends"), false, "generated appshot capability must be removed");
assert.equal(main.includes("function EOe("), false, "generated environment signal reader must be removed");
assert.equal(main.includes("function DOe("), false, "generated environment signal projector must be removed");
assert.equal(main.includes("ApplicationMenuSnapshotService,"), true, "semantic menu snapshot service must be wired");
assert.equal(main.includes("createCodexAppConfigRuntime({"), true, "real codex app config runtime is wired");
assert.equal(main.includes("function dOe("), false, "generated remote connection declaration stager must be removed");
assert.equal(main.includes("async function fOe("), false, "generated remote declaration apply owner must be removed");
assert.equal(main.includes("function pOe("), false, "generated retry state updater must be removed");
assert.equal(main.includes("function mOe("), false, "generated auto-connect initializer must be removed");
assert.equal(main.includes("async function hOe("), false, "generated remote project declaration owner must be removed");
assert.equal(main.includes("function gOe("), false, "generated SSH alias indexer must be removed");
assert.equal(main.includes("function XE("), false, "generated remote project finder must be removed");
assert.equal(main.includes("function _Oe("), false, "generated remote project comparator must be removed");
assert.equal(main.includes("function vOe("), false, "generated project order comparator must be removed");
assert.equal(main.includes("async function Ust("), true, "real startup owner remains authoritative");

console.log("533 main unwired-owner skeleton assertions passed");
