// Settings navigation visibility and route selection. The published chunk is
// a hook returning route state, not a list-filter helper.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";

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
  buildFlavor: "chatgpt" | "codex" | "work";
  enterprisePlan: boolean;
  pluginsSettingsVisible: boolean;
  sections: readonly SettingsSection[];
  visibility: Readonly<Record<string, SettingsVisibility>>;
}

const shared = appSharedChunk as unknown as { HX?<Value>(signal: unknown): Value };
const initial = appInitialChunk as unknown as { NT?: readonly SettingsSection[]; ugn?: string; settingsNavigationState?: unknown };
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

function readRuntimeState(): SettingsRuntimeState {
  const injected = shared.HX != null && initial.settingsNavigationState != null ? shared.HX<Partial<SettingsRuntimeState>>(initial.settingsNavigationState) : undefined;
  return { buildFlavor: injected?.buildFlavor ?? "codex", enterprisePlan: injected?.enterprisePlan === true, pluginsSettingsVisible: injected?.pluginsSettingsVisible !== false, sections: injected?.sections ?? initial.NT ?? fallbackSections, visibility: injected?.visibility ?? {} };
}
function surfaceVisible(surface: SettingsSurface | undefined, flavor: SettingsRuntimeState["buildFlavor"], local: boolean): boolean {
  if (surface === "chatGpt") return flavor === "chatgpt";
  if (surface === "codex") return flavor === "codex";
  if (surface === "codexLocal") return flavor === "codex" && local;
  if (surface === "codexOrWorkLocal") return (flavor === "codex" || flavor === "work") && local;
  if (surface === "chatGptOrCodex") return flavor === "chatgpt" || flavor === "codex";
  return true;
}
function getSectionAsset(slug: string, platform?: string): { commandAsset: string; component: string; navigation: { ariaHidden: boolean; assets: { 16: string; 20: string } } } {
  const key = slug === "appshots" && platform === "windows" ? "appshots-windows" : slug;
  return { commandAsset: `${key}-16`, component: `${key}-settings`, navigation: { ariaHidden: false, assets: { 16: `${key}-16`, 20: `${key}-20` } } };
}
function initializeSectionAssets(): void {}
function initializeExternalSettings(): void {}
function useVisibleSettingsSections(requestedSlug?: string | null, isLocalHost = true, hostId = initial.ugn): VisibleSettingsResult {
  void hostId;
  const state = readRuntimeState();
  const evaluated = state.sections.map((section) => {
    const override = state.visibility[section.slug];
    const hostAllowed = isLocalHost || alwaysAvailableRemotely.has(section.slug);
    const defaultVisible = !section.disabled && hostAllowed && surfaceVisible(section.surface ?? sectionSurfaces[section.slug], state.buildFlavor, isLocalHost);
    return { error: override?.error === true, pending: override?.pending === true, section, visible: override?.visible ?? defaultVisible };
  });
  const visibleSettingsSections = evaluated.filter((entry) => entry.visible).map((entry) => entry.section);
  const requested = requestedSlug == null ? undefined : evaluated.find((entry) => entry.section.slug === requestedSlug);
  const shouldRedirectToVisibleSettingsSection = requested != null && !requested.visible && !requested.pending && !requested.error;
  const defaultSlug = state.buildFlavor === "chatgpt" ? "general-settings" : "agent";
  const fallback = visibleSettingsSections.find((section) => section.slug === defaultSlug)?.slug ?? visibleSettingsSections[0]?.slug ?? defaultSlug;
  const activeSettingsSection = requested != null && !shouldRedirectToVisibleSettingsSection ? requested.section.slug : fallback;
  const settingsNavigationSections = visibleSettingsSections.filter((section) => !(section.slug === "mcp-settings" && state.pluginsSettingsVisible));
  return { activeSettingsSection, settingsNavigationSections, shouldRedirectToVisibleSettingsSection, shouldRenderRouteContent: requested?.pending !== true, showEnterpriseUsageLabel: state.enterprisePlan && visibleSettingsSections.some((section) => section.slug === "analytics"), visibleSettingsSections };
}
let initialized = false;
function initializeVisibleSettingsSections(): void { if (!initialized) { initializeExternalSettings(); initializeSectionAssets(); initialized = true; } }
export { analyticsGateId as a, initializeSectionAssets as i, useVisibleSettingsSections as n, externalSettings as o, getSectionAsset as r, initializeExternalSettings as s, initializeVisibleSettingsSections as t };
