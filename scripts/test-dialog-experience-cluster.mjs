import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
globalThis.__dialogExperienceTest = {
  jsx: {
    Fragment: "Fragment",
    jsx(type, props, key) {
      return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
    },
    jsxs(type, props, key) {
      return typeof type === "function" ? type(props ?? {}) : { type, props: props ?? {}, key };
    },
  },
};

async function bundle(directory) {
  const result = await esbuild.build({
    entryPoints: [path.join(ROOT, "src/renderer", directory, "index.ts")],
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
    logLevel: "silent",
    plugins: [{
      name: "dialog-experience-mocks",
      setup(build) {
        build.onResolve({ filter: /^@rchunk\// }, ({ path: importPath }) => ({ path: importPath.slice(8), namespace: "mock" }));
        build.onLoad({ filter: /.*/, namespace: "mock" }, ({ path: importPath }) => ({
          contents: importPath === "app-shared" ? "export const I3=()=>globalThis.__dialogExperienceTest.jsx;" : "export {};",
          loader: "js",
        }));
      },
    }],
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}#${directory}`);
}

function walk(node, visit) {
  if (node == null || typeof node !== "object") return;
  visit(node);
  const children = node.props?.children;
  if (Array.isArray(children)) children.flat(Infinity).forEach(child => walk(child, visit));
  else walk(children, visit);
}
function find(node, predicate) {
  let result;
  walk(node, value => { if (result == null && predicate(value)) result = value; });
  return result;
}
function all(node, predicate) {
  const result = [];
  walk(node, value => { if (predicate(value)) result.push(value); });
  return result;
}
function text(node) {
  const parts = [];
  const collect = value => {
    if (typeof value === "string" || typeof value === "number") { parts.push(String(value)); return; }
    if (value == null || typeof value !== "object") return;
    const children = value.props?.children;
    if (Array.isArray(children)) children.flat(Infinity).forEach(collect);
    else collect(children);
  };
  collect(node);
  return parts.join(" ");
}

const debug = await bundle("debug-modal");
assert.deepEqual(Object.keys(debug), ["DebugModal"]);
let debugClosed = 0;
const debugUi = debug.DebugModal({ initialRect: { width: 100, height: 100, x: -20, y: 0 }, viewport: { width: 900, height: 700 }, onClose() { debugClosed++; } });
assert.equal(debugUi.type, "dialog");
assert.equal(debugUi.props.open, true);
assert.equal(debugUi.props["data-debug-modal"], true);
assert.deepEqual(debugUi.props.style, { width: 480, height: 320, left: 0, top: 36 });
assert.equal(find(debugUi, node => node.props?.role === "tabpanel").props.children, "Debug panel");
assert.equal(find(debugUi, node => node.props?.["data-resize-handle"]).props["aria-hidden"], true);
const debugClose = find(debugUi, node => node.props?.["aria-label"] === "Close debug panel");
assert.equal(debugClose.type, "button");
debugClose.props.onClick();
assert.equal(debugClosed, 1);

const pet = await bundle("pet-install-modal-host");
assert.deepEqual(Object.keys(pet), ["PetInstallModalHost"]);
assert.equal(pet.PetInstallModalHost({ onClose() {} }), null);
let petClosed = 0;
let installed = 0;
const readyPet = pet.PetInstallModalHost({ session: { name: "Orbit", description: "A calm companion", status: "ready" }, onClose() { petClosed++; }, onInstall() { installed++; } });
assert.match(text(readyPet), /Install Orbit\?/);
assert.match(text(readyPet), /A calm companion/);
const readyInstall = find(readyPet, node => node.type === "button" && node.props.children === "Install");
assert.equal(readyInstall.props.disabled, false);
readyInstall.props.onClick();
assert.equal(installed, 1);
const installingPet = pet.PetInstallModalHost({ session: { name: "Orbit", status: "installing" }, onClose() {} });
assert.equal(installingPet.props["aria-busy"], true);
assert.equal(find(installingPet, node => node.props?.children === "Installing…").props.disabled, true);
const failedPet = pet.PetInstallModalHost({ session: { name: "Orbit", status: "installError", error: "offline" }, onClose() {} });
assert.equal(find(failedPet, node => node.props?.role === "alert").props.children, "offline");
assert.equal(find(failedPet, node => node.props?.children === "Try again").props.disabled, false);
const installedPet = pet.PetInstallModalHost({ session: { name: "Orbit", status: "installed" }, onClose() { petClosed++; } });
assert.match(text(installedPet), /Installed Orbit/);
assert.equal(all(installedPet, node => node.type === "button").length, 1);
find(installedPet, node => node.type === "button").props.onClick();
assert.equal(petClosed, 1);

const renewal = await bundle("subscription-renewal-dialog");
assert.deepEqual(Object.keys(renewal), ["SubscriptionRenewalDialog"]);
let renewalClosed = 0;
let renewed = 0;
const renewalUi = renewal.SubscriptionRenewalDialog({
  accountId: "acct",
  account: { account: { plan_type: "plus" }, entitlement: { billing_period: "month", renews_at: "2026-09-01T00:00:00Z", cancels_at: "2026-10-02T00:00:00Z" } },
  currency: "EUR",
  price: 19.5,
  onClose() { renewalClosed++; },
  onRenew() { renewed++; },
});
assert.match(text(renewalUi), /Renew subscription/);
assert.match(text(renewalUi), /10\/2\/2026/);
assert.match(text(renewalUi), /EUR 19\.50 per month/);
const renewalButtons = all(renewalUi, node => node.type === "button");
renewalButtons[0].props.onClick();
renewalButtons[1].props.onClick();
assert.equal(renewalClosed, 1);
assert.equal(renewed, 1);
const pendingRenewal = renewal.SubscriptionRenewalDialog({ accountId: "acct", account: { account: {}, entitlement: {} }, isPending: true, onClose() {} });
assert.equal(find(pendingRenewal, node => node.props?.children === "Renewing…").props.disabled, true);
assert.equal(all(pendingRenewal, node => node.type === "button").every(button => button.props.disabled), true);
const failedRenewal = renewal.SubscriptionRenewalDialog({ accountId: "acct", account: { account: {}, entitlement: {} }, isError: true, onClose() {} });
assert.match(text(find(failedRenewal, node => node.props?.role === "alert")), /Couldn’t load/);
assert.equal(find(failedRenewal, node => node.type === "button" && node.props?.children === "Renew subscription").props.disabled, true);

const upgrade = await bundle("upgrade-plan-dialog");
assert.deepEqual(Object.keys(upgrade).sort(), ["UpgradePlanDialog", "UpgradePlanDialogModal"]);
assert.equal(upgrade.UpgradePlanDialog({ currentPlan: "free", open: false, onOpenChange() {} }), null);
let upgradeOpen = true;
let upgradeTarget;
const plans = [{ id: "free", name: "Free" }, { id: "pro", name: "Pro", description: "More capacity", price: "$20" }];
const upgradeUi = upgrade.UpgradePlanDialog({ currentPlan: "free", open: true, plans, onOpenChange(open) { upgradeOpen = open; }, onCtaClick(plan) { upgradeTarget = plan.id; } });
assert.equal(upgradeUi.props["data-tab"], "personal");
assert.equal(all(upgradeUi, node => node.type === "article").length, 2);
assert.equal(find(upgradeUi, node => node.props?.children === "Current plan").props.disabled, true);
const proButton = find(upgradeUi, node => node.props?.children === "Upgrade");
assert.equal(proButton.props.disabled, false);
proButton.props.onClick();
assert.equal(upgradeTarget, "pro");
find(upgradeUi, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(upgradeOpen, false);
const pricingError = upgrade.UpgradePlanDialog({ currentPlan: "free", open: true, pricingUnavailable: true, onOpenChange() {} });
assert.equal(find(pricingError, node => node.props?.role === "alert").type, "div");
let modalClosed = 0;
let modalUpgrade;
const modal = upgrade.UpgradePlanDialogModal({ currentPlan: "free", plans, source: "settings", onClose() { modalClosed++; }, onUpgrade(plan, source) { modalUpgrade = `${plan.id}:${source}`; } });
find(modal, node => node.props?.children === "Upgrade").props.onClick();
assert.equal(modalUpgrade, "pro:settings");
find(modal, node => node.props?.["aria-label"] === "Close").props.onClick();
assert.equal(modalClosed, 1);

const voice = await bundle("voice-personalization-dialog");
assert.deepEqual(Object.keys(voice), ["VoicePersonalizationDialog"]);
const voiceBase = { accountId: "acct", onBack() {}, onClose() {}, onComplete() {} };
assert.equal(voice.VoicePersonalizationDialog({ ...voiceBase, activeAccountId: "other" }), null);
assert.equal(find(voice.VoicePersonalizationDialog({ ...voiceBase, isLoading: true }), node => node.props?.role === "status").props.children, "Loading voices");
let retried = 0;
const emptyVoice = voice.VoicePersonalizationDialog({ ...voiceBase, onRetry() { retried++; } });
assert.match(text(find(emptyVoice, node => node.props?.role === "alert")), /Voices aren’t available/);
find(emptyVoice, node => node.props?.children === "Try again").props.onClick();
assert.equal(retried, 1);
let backed = 0;
let voiceClosed = 0;
let completed = 0;
let savedVoice;
const voices = [{ slug: "ember", name: "Ember" }, { slug: "spruce", name: "Spruce", description: "Warm" }];
const voiceUi = voice.VoicePersonalizationDialog({ accountId: "acct", selectedVoice: "ember", voices, onBack() { backed++; }, onClose() { voiceClosed++; }, onComplete() { completed++; }, onSave(slug) { savedVoice = slug; } });
const radios = all(voiceUi, node => node.type === "input");
assert.equal(radios.length, 2);
assert.equal(radios[0].props.checked, true);
radios[1].props.onChange();
find(voiceUi, node => node.props?.children === "Back").props.onClick();
find(voiceUi, node => node.props?.children === "Close").props.onClick();
find(voiceUi, node => node.props?.children === "Continue").props.onClick();
await Promise.resolve();
assert.equal(backed, 1);
assert.equal(voiceClosed, 1);
assert.equal(savedVoice, "spruce");
assert.equal(completed, 1);

const picker = await bundle("slides-outline-template-picker");
assert.deepEqual(Object.keys(picker), ["SlidesOutlineTemplatePicker"]);
const pickerBase = { onOpenChange() {}, onSelect() {} };
assert.equal(picker.SlidesOutlineTemplatePicker({ ...pickerBase, open: false }), null);
assert.match(text(picker.SlidesOutlineTemplatePicker({ ...pickerBase, open: true })), /No presentation templates available/);
assert.equal(find(picker.SlidesOutlineTemplatePicker({ ...pickerBase, open: true, isLoading: true }), node => node.props?.role === "status").props.children, "Loading presentation templates");
let templateRetry = 0;
const failedPicker = picker.SlidesOutlineTemplatePicker({ ...pickerBase, open: true, error: true, onRetry() { templateRetry++; } });
find(failedPicker, node => node.props?.children === "Try again").props.onClick();
assert.equal(templateRetry, 1);
const templates = [{ path: "/one", title: "One" }, { path: "/two", title: "Two", kind: "google-slides" }];
let pickerOpen = true;
let picked;
const pickerUi = picker.SlidesOutlineTemplatePicker({ open: true, templates, onOpenChange(open) { pickerOpen = open; }, onSelect(template) { picked = template; } });
assert.equal(find(pickerUi, node => node.props?.role === "group").props["aria-label"], "Presentation templates");
assert.equal(find(pickerUi, node => node.props?.children === "Select template").props.disabled, true);
find(pickerUi, node => node.props?.children === "Two").props.onClick();
find(pickerUi, node => node.props?.children === "Select template").props.onClick();
assert.equal(picked.path, "/two");
assert.equal(pickerOpen, false);
let removedTemplate = "unset";
const selectedPicker = picker.SlidesOutlineTemplatePicker({ open: true, templates, selectedTemplatePath: "/one", onOpenChange() {}, onSelect(template) { removedTemplate = template; } });
assert.equal(find(selectedPicker, node => node.props?.children === "One").props["aria-pressed"], true);
const removeTemplate = find(selectedPicker, node => node.props?.children === "Remove template");
assert.equal(removeTemplate.type, "button");
removeTemplate.props.onClick();
assert.equal(removedTemplate, null);

console.log("dialog experience cluster tests passed");
