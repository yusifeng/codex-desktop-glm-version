import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
import "@rchunk/security-keys";
import "@rchunk/hooks";
import "@rchunk/dock";
import "@rchunk/queries";
import "@rchunk/command-menu-queries";
import "@rchunk/command-menu-availability";
import "@rchunk/command-menu-client";
import "@rchunk/import-settings-gate";

export type SettingsSurface = "chatGpt" | "codex" | "codexLocal" | "codexOrWorkLocal" | "chatGptOrCodex";
export interface SettingsSection { disabled?: boolean; externalUrl?: string; label: string; slug: string; surface?: SettingsSurface }
export interface VisibleSettingsOptions { buildFlavor?: "chatgpt" | "codex" | "work"; isLocalHost?: boolean; labels?: Partial<Record<string, string>>; sections?: readonly SettingsSection[] }

const analyticsGateId = "3895602085";
const externalSettings = {
  account: { href: "https://chatgpt.com/#settings", label: "Account" },
  securitySettings: { href: "https://chatgpt.com/open-security-settings", label: "Security Settings" },
} as const;
const sectionSurfaces: Record<string, SettingsSurface> = {
  account: "chatGpt", notifications: "chatGpt", security: "chatGpt", storage: "chatGpt",
  analytics: "codex", profile: "codex", usage: "codex", voice: "codex", "keyboard-shortcuts": "codex",
  "cloud-environments": "codexLocal", "git-settings": "codexLocal", "local-environments": "codexLocal", worktrees: "codexLocal",
  agent: "codexOrWorkLocal", appshots: "codexOrWorkLocal", "browser-use": "codexOrWorkLocal", "computer-use": "codexOrWorkLocal", import: "codexOrWorkLocal", "mcp-settings": "codexOrWorkLocal", "plugins-settings": "codexOrWorkLocal", "skills-settings": "codexOrWorkLocal",
  "data-controls": "chatGptOrCodex",
};
const defaultSections: SettingsSection[] = Object.entries(sectionSurfaces).map(([slug, surface]) => ({ label: slug.split("-").map(word => word[0]?.toUpperCase() + word.slice(1)).join(" "), slug, surface }));

function isSurfaceVisible(surface: SettingsSurface, buildFlavor: VisibleSettingsOptions["buildFlavor"], isLocalHost: boolean): boolean {
  if (surface === "chatGpt") return buildFlavor === "chatgpt";
  if (surface === "codex") return buildFlavor === "codex";
  if (surface === "codexLocal") return buildFlavor === "codex" && isLocalHost;
  if (surface === "codexOrWorkLocal") return (buildFlavor === "codex" || buildFlavor === "work") && isLocalHost;
  return buildFlavor === "chatgpt" || buildFlavor === "codex";
}
function getSectionAsset(slug: string, platform?: string): { commandAsset: string; component: string; navigation: { ariaHidden: boolean } } {
  const normalized = slug === "appshots" && platform === "windows" ? "appshots-windows" : slug;
  return { commandAsset: `${normalized}-16`, component: `${normalized}-settings`, navigation: { ariaHidden: false } };
}
function initializeSectionAssets(): void {}
function useVisibleSettingsSections(options: VisibleSettingsOptions = {}): SettingsSection[] {
  const buildFlavor = options.buildFlavor ?? "codex";
  const isLocalHost = options.isLocalHost ?? true;
  return (options.sections ?? defaultSections)
    .filter(section => !section.disabled && isSurfaceVisible(section.surface ?? sectionSurfaces[section.slug] ?? "codex", buildFlavor, isLocalHost))
    .map(section => ({ ...section, label: options.labels?.[section.slug] ?? section.label }));
}
function initializeExternalSettings(): void {}
function initializeVisibleSettingsSections(): void {}

export { analyticsGateId as a, initializeSectionAssets as i, useVisibleSettingsSections as n, externalSettings as o, getSectionAsset as r, initializeExternalSettings as s, initializeVisibleSettingsSections as t };
