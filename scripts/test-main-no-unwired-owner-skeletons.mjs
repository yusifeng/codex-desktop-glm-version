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
  "src/main/main-app/automations/automation-update-tool.ts",
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
assert.equal(inboxOwner.includes("export class InboxItemsFacade"), true, "InboxItemsFacade must remain a real owner");
assert.equal(main.includes("new InboxItemsFacade({"), true, "InboxItemsFacade must remain wired");
assert.equal(main.includes("PBe = createElectronFetchHandlerClass({"), true, "real Electron fetch owner is wired");
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
assert.equal(main.includes("async function Ust("), true, "real startup owner remains authoritative");

console.log("190 main unwired-owner skeleton assertions passed");
