import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/partition";
import "@rchunk/plugin-connected-account-links";
import "@rchunk/plugin-disabled-reason";

export interface Skill { id: string; name: string; description?: string; shortDescription?: string; path?: string; scope?: string; [key: string]: unknown }
export interface InstalledSkill { skill: Skill; [key: string]: unknown }
export interface Plugin { isBuiltIn?: boolean; marketplaceDisplayName?: string; marketplaceName?: string; marketplacePath?: string; name: string; origin?: string | null; path?: string; scope?: string; [key: string]: unknown }
export interface App { description?: string | null; displayName?: string; id?: string; isAccessible?: boolean; name: string; shortDescription?: string | null; type?: string; [key: string]: unknown }
export interface Section { id: string; title: unknown; [key: string]: unknown }
let jsx: JsxRuntime;
const featuredOrder = ["imagegen", "sora", "pdf", "doc", "spreadsheet", "playwright"];

const normalize = (value: string): string => value.trim().toLowerCase();
const tokens = (value: string): string[] => { const text = normalize(value); if (!text) return []; const compact = text.replace(/[^a-z0-9]+/g, ""); return compact === text ? [text] : [text, compact]; };
const tokenSet = (values: Array<string | null | undefined>): Set<string> => new Set(values.flatMap((value) => value == null ? [] : tokens(value)));
const skillKeys = (skill: Skill): Set<string> => tokenSet([skill.path?.split("/").at(-1), skill.name, normalize(skill.name), skill.description]);
const recommendationKeys = (skill: Skill): Set<string> => tokenSet([skill.id, skill.name, normalize(skill.name)]);
function installedSkillKeys(skills: InstalledSkill[]): Set<string> { const result = new Set<string>(); for (const { skill } of skills) for (const key of skillKeys(skill)) result.add(key); return result; }
function matchesInstalledSkill(input: { installedSkillMatchKeys: Set<string>; skill: Skill }): boolean { return [...recommendationKeys(input.skill)].some((key) => input.installedSkillMatchKeys.has(key)); }
function findInstalledSkill(input: { installedSkills: InstalledSkill[]; skill: Skill }): Skill | null { const keys = recommendationKeys(input.skill); return input.installedSkills.find(({ skill }) => [...skillKeys(skill)].some((key) => keys.has(key)))?.skill ?? null; }
function filterRecommendations(input: { installedRecommendedSkillIds: Set<string>; installedSkillMatchKeys: Set<string>; skills: Skill[] }): Skill[] { return input.skills.filter((skill) => input.installedRecommendedSkillIds.has(skill.id) || !matchesInstalledSkill({ installedSkillMatchKeys: input.installedSkillMatchKeys, skill })); }
function excludeRecommendedSkills(input: { installedSkills: InstalledSkill[]; recommendedSkills: Skill[] }): InstalledSkill[] { const keys = tokenSet(input.recommendedSkills.flatMap((skill) => [...recommendationKeys(skill)])); return input.installedSkills.filter(({ skill }) => ![...skillKeys(skill)].some((key) => keys.has(key))); }
const matches = (query: string, values: string[]): boolean => !query || values.join(" ").toLowerCase().includes(query);
function filterInstalledSkills(input: { skills: InstalledSkill[]; query: string }): InstalledSkill[] { return input.skills.filter(({ skill }) => matches(input.query, [skill.name, skill.description ?? "", skill.path ?? ""])); }
function filterSuggestedSkills(input: { query: string; suggestions?: App[] | null }): App[] { return (input.suggestions ?? []).filter((item) => item.type === "skill" && matches(input.query, [item.name, item.description ?? ""])); }
function filterSkills(input: { skills: Skill[]; query: string }): Skill[] { return input.skills.filter((skill) => matches(input.query, [skill.name, skill.description ?? "", skill.shortDescription ?? ""])); }
function featuredApps(apps: App[]): App[] { return apps.filter((app) => featuredOrder.includes(normalize(app.name))).sort((a, b) => featuredOrder.indexOf(normalize(a.name)) - featuredOrder.indexOf(normalize(b.name))); }
function filterApps(input: { apps: App[]; query: string }): App[] { return input.apps.filter((app) => matches(input.query, [app.name, app.description ?? ""])); }
function marketplaceLabel(plugin: Plugin): string { return (plugin.marketplaceDisplayName?.trim() || plugin.name).replace(/[-_]+/g, " "); }
function configuredGitMarketplaces(config: unknown): Set<string> { const marketplaces = isRecord((config as { marketplaces?: unknown } | null)?.marketplaces) ? (config as { marketplaces: Record<string, unknown> }).marketplaces : {}; return new Set(Object.entries(marketplaces).filter(([, value]) => isRecord(value) && value.source_type === "git" && typeof value.source === "string" && value.source).map(([name]) => name)); }
function marketplaceNames(config: unknown): Set<string> { const value = (config as { marketplaces?: unknown } | null)?.marketplaces; return new Set(isRecord(value) ? Object.keys(value) : []); }
const isConfiguredMarketplace = (plugin: Plugin, names: Set<string>): boolean => !plugin.isBuiltIn && names.has(plugin.name);
function filterMarketplaces(input: { configuredMarketplaceNames: Set<string>; marketplaces: Plugin[]; query: string }): Plugin[] { return input.marketplaces.filter((plugin) => isConfiguredMarketplace(plugin, input.configuredMarketplaceNames) && matches(input.query, [marketplaceLabel(plugin), plugin.name, plugin.path ?? ""])); }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value != null && !Array.isArray(value);
function partitionApps(apps: App[]): { installedApps: App[]; discoverApps: App[] } { const installedApps = apps.filter((app) => app.isAccessible); return { installedApps, discoverApps: apps.filter((app) => !app.isAccessible) }; }
function resolveTab(input: { currentTab: string; isCurrentTabLoading: boolean; isManagePage: boolean; isPluginsEnabled: boolean; tabCounts: Record<string, number> }): string { if (!input.isManagePage) return input.currentTab; if (!input.isPluginsEnabled) return "mcps"; if (input.currentTab === "mcps" || input.isCurrentTabLoading || (input.tabCounts[input.currentTab] ?? 0) > 0) return input.currentTab; return ["plugins", "apps", "mcps", "skills", "marketplace"].find((tab) => (input.tabCounts[tab] ?? 0) > 0) ?? "mcps"; }
const resultsForTab = ({ pluginResultKeys, skillResultKeys, tab }: { pluginResultKeys: string[]; skillResultKeys: string[]; tab: string }): string[] | undefined => tab === "plugins" ? pluginResultKeys : tab === "skills" ? skillResultKeys : undefined;
function SectionedPage(props: { ariaLabel?: string; children?: unknown; header?: unknown; sections: Section[]; showNav?: boolean }): unknown { const runtime = ensureJsx(); return runtime.jsxs("div", { className: "sectioned-page", children: [props.header, props.showNav === false ? null : runtime.jsx("nav", { "aria-label": props.ariaLabel, children: props.sections.map((section) => runtime.jsx("a", { href: `#${section.id}`, children: section.title }, section.id)) }), runtime.jsx("main", { children: props.children })] }); }
function PageSection(props: { action?: unknown; children?: unknown; count?: number; id: string; title?: unknown }): unknown { return ensureJsx().jsxs("section", { id: props.id, children: [props.title == null ? null : ensureJsx().jsx("h2", { children: props.title }), props.action, props.children] }); }
function ExpandRow(props: { children?: unknown; isExpanded?: boolean; onClick?(): void }): unknown { return ensureJsx().jsx("button", { type: "button", "aria-expanded": props.isExpanded, onClick: props.onClick, children: props.isExpanded ? "Show less" : props.children }); }
function ProgressiveList<T>(props: { batchSize?: number; children(items: T[]): unknown; items: T[]; pinnedItem?: T; renderExpandRow?(input: { hiddenItems: T[]; isExpanded: boolean; onToggle(): void }): unknown; visibleItemLimit: number }): unknown { const visible = props.items.slice(0, props.visibleItemLimit); if (props.pinnedItem != null && !visible.includes(props.pinnedItem)) visible.push(props.pinnedItem); return ensureJsx().jsxs(ensureJsx().Fragment, { children: [props.children(visible), props.items.length > visible.length ? props.renderExpandRow?.({ hiddenItems: props.items.filter((item) => !visible.includes(item)), isExpanded: false, onToggle: () => {} }) : null] }); }
function PluginOriginBadge({ hostId, plugin }: { hostId: string; plugin: Plugin; size?: string }): unknown { return ensureJsx().jsx("span", { role: "img", "aria-label": plugin.origin ?? (hostId === "local" ? "Local plugin" : "Remote host plugin"), children: plugin.origin ?? "local" }); }
function initialize(): void { jsx = getJsxRuntime(); }
const noop = (): void => {};
const filterStandaloneSkills = (skills: InstalledSkill[]): InstalledSkill[] => skills.filter(({ skill }) => !(skill.path ?? "").includes("plugin"));
const installedRecommendations = (input: { recommendedSkills?: Skill[] | null; skills: InstalledSkill[] }): InstalledSkill[] => input.recommendedSkills == null ? [] : excludeRecommendedSkills({ installedSkills: input.skills, recommendedSkills: input.recommendedSkills });
const marketplaceImage = undefined;
export { noop as A, excludeRecommendedSkills as C, filterStandaloneSkills as D, filterRecommendations as E, PageSection as F, initialize as I, marketplaceImage as M, noop as N, noop as O, SectionedPage as P, filterSkills as S, installedRecommendations as T, resultsForTab as _, initialize as a, filterInstalledSkills as b, marketplaceNames as c, initialize as d, isConfiguredMarketplace as f, resolveTab as g, partitionApps as h, PluginOriginBadge as i, initialize as j, initialize as k, findInstalledSkill as l, matchesInstalledSkill as m, ProgressiveList as n, installedSkillKeys as o, isConfiguredMarketplace as p, initialize as r, configuredGitMarketplaces as s, ExpandRow as t, marketplaceLabel as u, filterSuggestedSkills as v, featuredApps as w, filterMarketplaces as x, filterApps as y };
function ensureJsx(): JsxRuntime { if (jsx == null) jsx = getJsxRuntime(); return jsx; }
