import "@rchunk/rolldown-runtime";
import "@rchunk/app-primary";
import "@rchunk/computer-use-app-approvals-query";
import "@rchunk/use-home-directory";
import "@rchunk/security-browser";
import { I3 as getJsxRuntime } from "@rchunk/app-shared";
import { cJt as initializeApiClient } from "@rchunk/app-initial";

type SetupStep = "initial" | "waiting" | "allow-host" | "mfa-required" | "connected";
interface SetupContentProps { hostId?: string; onAllowHost?(): void; onContinueOnChatGPT?(): void; onFinishSetup?(): void; onManageConnections?(): void; onSkip?(): void; onStartSetup?(): void; setupInProgress?: boolean; showAllowHostError?: boolean; showStartSetupError?: boolean; step: SetupStep; variant?: "dialog" | "page"; waitingHeading?: string }
interface MobileSetupDialogProps extends SetupContentProps { onOpenChange(open: boolean): void; open: boolean }
const jsx = getJsxRuntime();
const setupDebugOverride = { key: "electron:codex-mobile-setup-step-debug-override", defaultValue: "auto" };
function headingForStep(step: SetupStep): string { return ({ initial: "Use Codex from your phone", waiting: "Finish setup on your phone", "allow-host": "Allow this computer", "mfa-required": "Secure your account", connected: "You're connected" })[step]; }
function descriptionForStep(step: SetupStep): string { return ({ initial: "Connect your phone to continue work away from your computer.", waiting: "Follow the instructions shown on your phone.", "allow-host": "Approve this computer before it can receive tasks.", "mfa-required": "Turn on multi-factor authentication in ChatGPT.", connected: "Your phone can now reach this Codex host." })[step]; }
function actionForStep(step: SetupStep, props: SetupContentProps): unknown {
  if (step === "initial") return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("button", { type: "button", disabled: props.setupInProgress, onClick: props.onStartSetup, children: "Start setup" }), jsx.jsx("button", { type: "button", onClick: props.onSkip, children: "Not now" })] });
  if (step === "allow-host") return jsx.jsx("button", { type: "button", disabled: props.setupInProgress, onClick: props.onAllowHost, children: "Allow computer" });
  if (step === "mfa-required") return jsx.jsx("button", { type: "button", onClick: props.onContinueOnChatGPT, children: "Continue in ChatGPT" });
  if (step === "connected") return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx("button", { type: "button", onClick: props.onManageConnections, children: "Manage connections" }), jsx.jsx("button", { type: "button", onClick: props.onFinishSetup, children: "Done" })] });
  return jsx.jsx("p", { role: "status", children: props.waitingHeading ?? "Waiting for your phone…" });
}
function CodexMobileSetupContent(props: SetupContentProps): unknown {
  return jsx.jsxs("section", { "data-step": props.step, "data-variant": props.variant ?? "dialog", children: [jsx.jsx("h2", { children: headingForStep(props.step) }), jsx.jsx("p", { children: descriptionForStep(props.step) }), props.showAllowHostError || props.showStartSetupError ? jsx.jsx("p", { role: "alert", children: "Setup couldn't continue. Try again." }) : null, actionForStep(props.step, props)] });
}
function CodexMobileSetupDialog({ open, onOpenChange, ...props }: MobileSetupDialogProps): unknown {
  if (!open) return null;
  return jsx.jsxs("dialog", { open: true, children: [jsx.jsx(CodexMobileSetupContent, { ...props, variant: "dialog", onFinishSetup: () => { props.onFinishSetup?.(); onOpenChange(false); } }), jsx.jsx("button", { type: "button", onClick: () => onOpenChange(false), children: "Close" })] });
}
function initializeMobileSetupAssets(): void {}
function initializeMobileSetupDebugOverride(): void {}
function initializeMobileSetupContent(): void { initializeMobileSetupAssets(); }
function initializeMobileSetupDialog(): void { initializeApiClient(); initializeMobileSetupContent(); initializeMobileSetupDebugOverride(); }
function initializeMobileSetupCopy(): void {}
export { initializeMobileSetupContent as a, setupDebugOverride as c, CodexMobileSetupContent as i, initializeMobileSetupDebugOverride as l, initializeMobileSetupDialog as n, headingForStep as o, descriptionForStep as r, initializeMobileSetupCopy as s, CodexMobileSetupDialog as t };
