// Settings navigation visibility and route selection. The published chunk is
// a hook returning route state, not a list-filter helper.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-primary";
import "@rchunk/command-menu-availability";
import "@rchunk/command-menu-client";
import "@rchunk/command-menu-queries";
import "@rchunk/dock";
import "@rchunk/hooks";
import {
  n as initializeImportSettingsGate,
  t as importedSetupExperimentKey,
} from "@rchunk/import-settings-gate";
import "@rchunk/queries";
import "@rchunk/security-keys";

export type SettingsSurface = "chatGpt" | "codex" | "codexLocal" | "codexOrWorkLocal" | "chatGptOrCodex";
export interface SettingsSection { disabled?: boolean; externalUrl?: string; label: string; slug: string; surface?: SettingsSurface }
export interface SettingsVisibility { error?: boolean; pending?: boolean; visible?: boolean }
export interface VisibleSettingsResult {
  activeSettingsSection: string;
  settingsNavigationSections: SettingsSection[];
  shouldRedirectToVisibleSettingsSection: boolean;
  shouldRenderRouteContent: boolean;
  showEnterpriseUsageLabel: boolean;
  visibleSettingsSections: SettingsSection[];
}
interface SettingsRuntimeState {
  enterprisePlan: boolean;
  pluginsSettingsVisible: boolean;
  sections: readonly SettingsSection[];
  surfaces: Readonly<Record<SettingsSurface, boolean>>;
  visibility: Readonly<Record<string, SettingsVisibility>>;
}

const shared = appSharedChunk as unknown as {
  BX?<Value>(signal: unknown, input: unknown): Value;
  HX?<Value>(signal: unknown): Value;
};
const initial = appInitialChunk as unknown as {
  /** Published settings section registry and default local route. */
  NT?: readonly SettingsSection[];
  MT?: string;
  ugn?: string;
  /** Runtime surface signals used by the published hook. */
  LS?: unknown;
  gmn?: unknown;
  Sht?: unknown;
  htt?: unknown;
  /** Host-aware plugins settings availability hook. */
  Wgn?(input: { hostId?: string }): boolean;
  /** Dynamic section eligibility contracts. */
  Xet?: unknown;
  _A?: unknown;
  bL?: unknown;
  fw?: unknown;
  ofn?: (gateId: string) => boolean;
  vj?: unknown;
  xun?: unknown;
};
const analyticsGateId = "3895602085";
const externalSettings = {
  account: { href: "https://chatgpt.com/#settings", icon: "account", message: "Account" },
  securitySettings: { href: "https://chatgpt.com/open-security-settings", icon: "security", message: "Security Settings" },
} as const;
const sectionSurfaces: Readonly<Record<string, SettingsSurface>> = {
  account: "chatGpt", notifications: "chatGpt", "ads-controls": "chatGpt", "parental-controls": "chatGpt",
  "trusted-contact": "chatGpt", safety: "chatGpt", billing: "chatGpt", security: "chatGpt", storage: "chatGpt",
  analytics: "codex", "usage-code-review": "codex", "consumer-view": "codex", profile: "codex", usage: "codex",
  voice: "codex", "keyboard-shortcuts": "codex", "cloud-environments": "codexLocal", "cloud-settings": "codexLocal",
  "code-review": "codexLocal", "codex-micro": "codexLocal", connections: "codexLocal", "git-settings": "codexLocal",
  "local-environments": "codexLocal", environments: "codexLocal", worktrees: "codexLocal", agent: "codexOrWorkLocal",
  appshots: "codexOrWorkLocal", "browser-use": "codexOrWorkLocal", chronicle: "codexOrWorkLocal",
  "computer-use": "codexOrWorkLocal", import: "codexOrWorkLocal", "mcp-settings": "codexOrWorkLocal",
  "plugins-settings": "codexOrWorkLocal", "skills-settings": "codexOrWorkLocal", "hooks-settings": "codexLocal",
  "data-controls": "chatGptOrCodex",
};
const alwaysAvailableRemotely = new Set(["profile", "agent", "personalization", "mcp-settings", "plugins-settings", "hooks-settings", "local-environments", "worktrees", "data-controls", "voice"]);
const fallbackSlugs = ["general-settings", "notifications", "import", "profile", "appearance", "security", "account", "parental-controls", "trusted-contact", "safety", "voice", "storage", "agent", "personalization", "pets", "keyboard-shortcuts", "usage", "billing", "analytics", "consumer-view", "usage-code-review", "debug", "computer-use", "chronicle", "appshots", "codex-micro", "mcp-settings", "plugins-settings", "skills-settings", "browser-use", "hooks-settings", "connections", "cloud-settings", "cloud-environments", "code-review", "git-settings", "local-environments", "environments", "worktrees", "data-controls"] as const;
function titleForSlug(slug: string): string { return slug.split("-").map((part) => part.length === 0 ? part : part[0]!.toUpperCase() + part.slice(1)).join(" "); }
const fallbackSections: readonly SettingsSection[] = fallbackSlugs.map((slug) => ({ label: titleForSlug(slug), slug }));

function readBooleanSignal(signal: unknown, fallback: boolean): boolean {
  return signal == null || shared.HX == null ? fallback : shared.HX<boolean>(signal) === true;
}
function readCapability(name: string, fallback = true): { isCapable: boolean; isLoading: boolean } {
  if (shared.BX == null || initial.Xet == null) return { isCapable: fallback, isLoading: false };
  const result = shared.BX<{ isCapable?: boolean; isLoading?: boolean }>(initial.Xet, { name }) ?? {};
  return { isCapable: result.isCapable === true, isLoading: result.isLoading === true };
}
function readRuntimeState(hostId?: string): SettingsRuntimeState {
  const chatGpt = readBooleanSignal(initial.htt, false);
  const codex = readBooleanSignal(initial.LS, true);
  const accountCapability = readCapability("chatgpt.cme");
  const dictationComposer = readCapability("dictation.composer", false);
  const dictationGlobal = readCapability("dictation.global", false);
  const accountState = initial.bL == null || shared.HX == null
    ? { status: "allowed" }
    : shared.HX<{ status?: "allowed" | "error" | "loading" }>(initial.bL) ?? { status: "loading" };
  const notificationsEnabled = readBooleanSignal(initial.xun, true);
  const appshotsVisible = readBooleanSignal(initial._A, true);
  const importEnabled = initial.ofn?.(importedSetupExperimentKey ?? "3278809559") === true;
  const isRemoteMode = readBooleanSignal(initial.vj, false);
  const codexMicroEnabled = initial.ofn?.("3207467860") === true;
  const codexMicroAvailability = initial.fw == null || shared.HX == null
    ? undefined
    : shared.HX<boolean | undefined>(initial.fw);
  const debugEnabled = initial.ofn?.("2423536643") === true;
  return {
    enterprisePlan: false,
    pluginsSettingsVisible: initial.Wgn?.({ hostId }) ?? true,
    sections: initial.NT ?? fallbackSections,
    surfaces: {
      chatGpt,
      chatGptOrCodex: chatGpt || codex,
      codex,
      codexLocal: readBooleanSignal(initial.gmn, codex),
      codexOrWorkLocal: readBooleanSignal(initial.Sht, codex),
    },
    visibility: {
      account: { pending: accountCapability.isLoading, visible: accountCapability.isCapable },
      appshots: { pending: false, visible: appshotsVisible },
      "codex-micro": {
        pending: codexMicroEnabled && codexMicroAvailability === undefined,
        visible: codexMicroEnabled && codexMicroAvailability === false,
      },
      debug: { pending: false, visible: debugEnabled },
      import: { pending: false, visible: importEnabled && !isRemoteMode },
      notifications: {
        error: accountState.status === "error",
        pending: accountState.status === "loading",
        visible: notificationsEnabled && accountState.status === "allowed",
      },
      "parental-controls": {
        error: accountState.status === "error",
        pending: accountState.status === "loading",
        visible: accountState.status === "allowed",
      },
      voice: {
        pending: dictationComposer.isLoading || dictationGlobal.isLoading,
        visible: dictationComposer.isCapable || dictationGlobal.isCapable,
      },
    },
  };
}
function surfaceVisible(surface: SettingsSurface | undefined, state: SettingsRuntimeState, local: boolean): boolean {
  if (surface == null) return true;
  const localSurface = surface === "codexLocal" || surface === "codexOrWorkLocal";
  return state.surfaces[surface] && (!localSurface || local);
}
function publishedSectionVisibility(section: SettingsSection, state: SettingsRuntimeState): SettingsVisibility | undefined {
  switch (section.slug) {
    case "billing":
    case "cloud-environments":
    case "cloud-settings":
    case "security":
    case "skills-settings":
    case "storage":
    case "teams":
    case "time-management":
      return { pending: false, visible: false };
    case "plugins-settings":
      return { pending: false, visible: state.pluginsSettingsVisible };
    case "agent":
    case "appearance":
    case "environments":
    case "general-settings":
    case "git-settings":
    case "hooks-settings":
    case "keyboard-shortcuts":
    case "local-environments":
    case "mcp-settings":
    case "personalization":
    case "worktrees":
      return { pending: false, visible: true };
    default:
      return undefined;
  }
}
function getSectionAsset(slug: string, platform?: string): { commandAsset: string; component: string; navigation: { ariaHidden: boolean; assets: { 16: string; 20: string } } } {
  const key = slug === "appshots" && platform === "windows" ? "appshots-windows" : slug;
  return { commandAsset: `${key}-16`, component: `${key}-settings`, navigation: { ariaHidden: false, assets: { 16: `${key}-16`, 20: `${key}-20` } } };
}
function initializeSectionAssets(): void {}
function initializeExternalSettings(): void {}
function useVisibleSettingsSections(requestedSlug?: string | null, isLocalHost = true, hostId = initial.ugn): VisibleSettingsResult {
  const state = readRuntimeState(hostId);
  const evaluated = state.sections.map((section) => {
    const eligibility = state.visibility[section.slug] ?? publishedSectionVisibility(section, state);
    const hostAllowed = isLocalHost || alwaysAvailableRemotely.has(section.slug);
    const defaultVisible = !section.disabled && hostAllowed && surfaceVisible(section.surface ?? sectionSurfaces[section.slug], state, isLocalHost);
    return {
      error: eligibility?.error === true,
      pending: eligibility?.pending === true,
      section,
      visible: defaultVisible && eligibility?.visible !== false,
    };
  });
  const visibleSettingsSections = evaluated.filter((entry) => entry.visible).map((entry) => entry.section);
  const requested = requestedSlug == null ? undefined : evaluated.find((entry) => entry.section.slug === requestedSlug);
  const shouldRedirectToVisibleSettingsSection = requested != null && !requested.visible && !requested.pending && !requested.error;
  const defaultSlug = isLocalHost ? initial.MT ?? "agent" : "agent";
  const fallback = visibleSettingsSections.find((section) => section.slug === defaultSlug)?.slug ?? visibleSettingsSections[0]?.slug ?? defaultSlug;
  const activeSettingsSection = requested != null && !shouldRedirectToVisibleSettingsSection ? requested.section.slug : fallback;
  const settingsNavigationSections = visibleSettingsSections.filter((section) => !(section.slug === "mcp-settings" && state.pluginsSettingsVisible));
  return { activeSettingsSection, settingsNavigationSections, shouldRedirectToVisibleSettingsSection, shouldRenderRouteContent: requested?.pending !== true, showEnterpriseUsageLabel: state.enterprisePlan && visibleSettingsSections.some((section) => section.slug === "analytics"), visibleSettingsSections };
}
let initialized = false;
function initializeVisibleSettingsSections(): void { if (!initialized) { initializeImportSettingsGate?.(); initializeExternalSettings(); initializeSectionAssets(); initialized = true; } }
export { analyticsGateId as a, initializeSectionAssets as i, useVisibleSettingsSections as n, externalSettings as o, getSectionAsset as r, initializeExternalSettings as s, initializeVisibleSettingsSections as t };
