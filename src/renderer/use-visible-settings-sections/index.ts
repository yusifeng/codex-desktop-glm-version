// Settings navigation visibility and route selection. The published chunk is
// a hook returning route state, not a list-filter helper.
import "@rchunk/rolldown-runtime";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import "@rchunk/app-primary";
import "@rchunk/command-menu-availability";
import * as trustedContactClientChunk from "@rchunk/command-menu-client";
import * as usageQueriesChunk from "@rchunk/command-menu-queries";
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
  Ew?(): { isProfileVisible?: boolean; isProfileVisibilityLoading?: boolean };
  HX?<Value>(signal: unknown): Value;
  _L?<Value>(options: Record<string, unknown>): { data?: Value; isError?: boolean; isLoading?: boolean; isPending?: boolean };
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
  Bln?(plan: unknown): boolean;
  Hln?(plan: unknown): boolean;
  N6t?(): { accountId?: string | null; authMethod?: string | null; isLoading?: boolean; userId?: string | null };
  Pdn?: Readonly<Record<string, unknown>>;
  _A?: unknown;
  bL?: unknown;
  dS?(hasCreditBalance: boolean, source?: string): { isUsageSettingsAccessLoading?: boolean; isUsageSettingsVisible?: boolean; plan?: unknown };
  f0t?: unknown;
  fw?: unknown;
  ofn?: (gateId: string) => boolean;
  vj?: unknown;
  vS?(plan: unknown): boolean;
  xun?: unknown;
};
const trustedContactClient = trustedContactClientChunk as unknown as {
  i?(userId: string, accountId: string): { enabled: Record<string, unknown> };
  r?(): void;
};
const usageQueries = usageQueriesChunk as unknown as {
  n?(options: Record<string, unknown>): Record<string, unknown>;
  t?(): void;
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
function planName(plan: unknown): string { return typeof plan === "string" ? plan.toLowerCase() : ""; }
function isFreeOrGoPlan(plan: unknown): boolean { const value = planName(plan); return value === "free" || value === "go"; }
function isEnt26Plan(plan: unknown): boolean { return plan === initial.Pdn?.ENT26 || planName(plan) === "ent26" || planName(plan) === "enterprise_2026"; }
function hasCodeReviewActivity(value: unknown): boolean {
  if (typeof value !== "object" || value == null) return false;
  const rows = (value as { data?: unknown }).data;
  return Array.isArray(rows) && rows.some((row) => {
    if (typeof row !== "object" || row == null) return false;
    const metrics = row as { n_comments?: number; n_reactions?: number; n_reviews?: number };
    return (metrics.n_comments ?? 0) > 0 || (metrics.n_reactions ?? 0) > 0 || (metrics.n_reviews ?? 0) > 0;
  });
}
function readRuntimeState(requestedSlug?: string | null, isLocalHost = true, hostId?: string): SettingsRuntimeState {
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
  const auth = initial.N6t?.() ?? {};
  const usageQuery = initial.f0t == null || shared.HX == null
    ? undefined
    : shared.HX<{ data?: { credits?: { balance?: number | null } } }>(initial.f0t);
  const usagePlan = initial.dS?.(usageQuery?.data?.credits?.balance != null, requestedSlug === "usage" ? "usage" : undefined) ?? {};
  const usageVisible = usagePlan.isUsageSettingsVisible === true;
  const usageLoading = usagePlan.isUsageSettingsAccessLoading === true;
  const plan = usagePlan.plan;
  const businessPlan = initial.Bln?.(plan) === true;
  const enterprisePlan = initial.vS?.(plan) === true || isEnt26Plan(plan);
  const analyticsVisible = usageVisible && (businessPlan
    ? enterprisePlan && initial.ofn?.("1748121887") === true
    : initial.ofn?.("4027330399") === true || (auth.authMethod === "chatgpt" && initial.Hln?.(plan) === true && initial.ofn?.("1014047933") === true));
  const consumerViewVisible = auth.authMethod === "chatgpt"
    && (businessPlan || planName(plan) === "enterprise_cbp_trial")
    && initial.ofn?.("1709920343") === true
    && initial.ofn?.("393259752") === true;
  const codeReviewCandidate = codex && isLocalHost && !usageLoading
    && (consumerViewVisible || (usageVisible && !businessPlan && initial.ofn?.("4027330399") === true));
  const codeReviewOptions = usageQueries.n?.({ auth, days: 30, enabled: codeReviewCandidate, isPolling: false, retry: 1, scope: initial.Hln?.(plan) === true ? "business" : "consumer" });
  const codeReviewQuery = codeReviewOptions == null || shared._L == null
    ? undefined
    : shared._L<{ data?: Array<{ n_comments?: number; n_reactions?: number; n_reviews?: number }> }>(codeReviewOptions);
  const profile = shared.Ew?.() ?? { isProfileVisible: true, isProfileVisibilityLoading: false };
  const profileDisabled = initial.ofn?.("998088620") === true;
  const trustedIdentity = accountState.status === "allowed"
    ? { accountId: (accountState as { accountId?: string }).accountId ?? "", userId: (accountState as { userId?: string }).userId ?? "" }
    : { accountId: "", userId: "" };
  const trustedOptions = trustedContactClient.i?.(trustedIdentity.userId, trustedIdentity.accountId)?.enabled;
  const trustedQuery = trustedOptions == null || shared._L == null
    ? undefined
    : shared._L<boolean>({ ...trustedOptions, enabled: accountState.status === "allowed" });
  return {
    enterprisePlan,
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
      analytics: { pending: usageLoading, visible: analyticsVisible },
      "consumer-view": { pending: usageLoading, visible: consumerViewVisible },
      profile: { pending: !profileDisabled && profile.isProfileVisibilityLoading === true, visible: !profileDisabled && profile.isProfileVisible === true },
      "trusted-contact": {
        error: accountState.status === "error" || (accountState.status === "allowed" && trustedQuery?.isError === true),
        pending: accountState.status === "loading" || (accountState.status === "allowed" && (trustedQuery?.isPending === true || trustedQuery?.isLoading === true)),
        visible: accountState.status === "allowed" && trustedQuery?.data === true,
      },
      usage: { pending: usageLoading || (isFreeOrGoPlan(plan) && usageQuery == null), visible: usageVisible },
      "usage-code-review": {
        pending: usageLoading || (codeReviewCandidate && codeReviewQuery?.isLoading === true),
        visible: codeReviewCandidate && (codeReviewQuery?.isError === true || hasCodeReviewActivity(codeReviewQuery?.data)),
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
  const state = readRuntimeState(requestedSlug, isLocalHost, hostId);
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
function initializeVisibleSettingsSections(): void { if (!initialized) { initializeImportSettingsGate?.(); trustedContactClient.r?.(); usageQueries.t?.(); initializeExternalSettings(); initializeSectionAssets(); initialized = true; } }
export { analyticsGateId as a, initializeSectionAssets as i, useVisibleSettingsSections as n, externalSettings as o, getSectionAsset as r, initializeExternalSettings as s, initializeVisibleSettingsSections as t };
