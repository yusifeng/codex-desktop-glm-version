import "@rchunk/rolldown-runtime";

type HookSourceGroup =
  | "admin"
  | "plugin"
  | "project"
  | "sessionFlags"
  | "unknown"
  | "user";

interface HookIssue {
  message: string;
  path: string;
}

interface HookDefinition {
  displayOrder: number;
  enabled: boolean;
  eventName: string;
  key: string;
  pluginId?: string | null;
  source: string;
  trustStatus: "managed" | "modified" | "trusted" | "untrusted" | string;
}

interface HookSettingsEntry {
  cwd: string;
  errors: HookIssue[];
  hooks: HookDefinition[];
  warnings: string[];
}

interface PluginSummary {
  hooks: HookDefinition[];
  summary: { id: string; installed: boolean };
}

interface SourceSelection {
  pluginId?: string | null;
  projectRoot?: string;
  source: HookSourceGroup;
}

const sourceOrder: HookSourceGroup[] = [
  "plugin",
  "user",
  "admin",
  "project",
  "sessionFlags",
  "unknown",
];
const unknownPluginId = "__unknown__";

function needsReview(hook: HookDefinition): boolean {
  return hook.trustStatus === "untrusted" || hook.trustStatus === "modified";
}

function isActive(hook: HookDefinition): boolean {
  return hook.trustStatus === "managed"
    || (hook.enabled && hook.trustStatus === "trusted");
}

function summarizeHookEvents(hooks: HookDefinition[]): Array<Record<string, unknown>> {
  return Array.from(new Set(hooks.map((hook) => hook.eventName)), (eventName) => {
    const matching = hooks.filter((hook) => hook.eventName === eventName);
    return {
      eventName,
      active: matching.filter(isActive).length,
      installed: matching.length,
      needsReview: matching.filter(needsReview).length,
    };
  });
}

function countHooksNeedingReview(hooks: HookDefinition[]): number {
  return hooks.filter(needsReview).length;
}

function filterHooksByEvent(hooks: HookDefinition[], eventName: string): HookDefinition[] {
  return hooks
    .filter((hook) => hook.eventName === eventName)
    .sort((left, right) => left.displayOrder < right.displayOrder ? -1 : +(left.displayOrder > right.displayOrder));
}

function normalizeSource(source: string | null): HookSourceGroup | null | undefined {
  switch (source) {
    case "plugin": return "plugin";
    case "user": return "user";
    case "system":
    case "mdm":
    case "cloudRequirements":
    case "cloudManagedConfig":
    case "legacyManagedConfigFile":
    case "legacyManagedConfigMdm": return "admin";
    case "project": return "project";
    case "sessionFlags": return "sessionFlags";
    case "unknown": return "unknown";
  }
}

function commonSource(hooks: HookDefinition[]): HookSourceGroup | null | undefined {
  if (hooks.length === 0) return null;
  const sources = new Set(hooks.map((hook) => normalizeSource(hook.source)));
  return sources.size === 1 ? sources.values().next().value ?? null : null;
}

function mergeEventNames(
  discovered: string[],
  preferred: string[],
  selected: string | null,
): string[] {
  const preferredSet = new Set(preferred);
  const result = [
    ...preferredSet,
    ...Array.from(new Set(discovered))
      .filter((name) => !preferredSet.has(name))
      .sort((left, right) => left.localeCompare(right)),
  ];
  if (selected != null && !result.includes(selected)) result.push(selected);
  return result;
}

function summarizeIssues(entry: HookSettingsEntry): { issueCount: number; needsReview: number } {
  return {
    issueCount: entry.warnings.length + entry.errors.length,
    needsReview: entry.hooks.filter(needsReview).length,
  };
}

function dedupeHooks(hooks: HookDefinition[]): HookDefinition[] {
  const byKey = new Map<string, HookDefinition>();
  for (const hook of hooks) if (!byKey.has(hook.key)) byKey.set(hook.key, hook);
  return [...byKey.values()];
}

function resolveSourceSelection({
  pluginId,
  source,
  projectRoot,
  projectRoots,
}: {
  pluginId?: string | null;
  projectRoot?: string;
  projectRoots?: string[];
  source: string | null;
}): SourceSelection | null {
  const normalized = normalizeSource(source);
  if ((normalized === "project" || (normalized == null && source == null))
    && projectRoot != null && projectRoots?.includes(projectRoot)) {
    return { source: "project", projectRoot };
  }
  if (normalized == null || normalized === "project") return null;
  if (normalized === "plugin") {
    if (pluginId == null) return { source: "plugin" };
    return {
      source: "plugin",
      pluginId: pluginId === unknownPluginId ? null : pluginId,
    };
  }
  return { source: normalized };
}

function pluginHooksNeedingReview(
  entries: HookSettingsEntry[] | null | undefined,
  plugin: PluginSummary | null,
): HookDefinition[] {
  if (plugin == null) return [];
  const keys = new Set(plugin.hooks.map((hook) => hook.key));
  return dedupeHooks(entries?.flatMap((entry) =>
    entry.hooks.filter((hook) =>
      hook.source === "plugin"
      && hook.pluginId === plugin.summary.id
      && keys.has(hook.key)
      && needsReview(hook),
    )) ?? []);
}

function availablePluginEvents(
  plugin: PluginSummary | null | undefined,
  preferred: string[],
  discovered: string[],
): string[] | undefined {
  if (plugin == null || !plugin.summary.installed || plugin.hooks.length === 0) return undefined;
  const result = mergeEventNames(preferred, discovered, null);
  return result.length === 0 ? undefined : result;
}

function initializeHooksSettingsModel(): void {}

export {
  filterHooksByEvent as a,
  availablePluginEvents as c,
  resolveEntryForSource as d,
  commonSource as f,
  groupEntriesBySource as i,
  pluginHooksNeedingReview as l,
  needsReview as m,
  summarizeIssues as n,
  countHooksNeedingReview as o,
  initializeHooksSettingsModel as p,
  summarizeHookEvents as r,
  mergeEventNames as s,
  unknownPluginId as t,
  resolveSourceSelection as u,
};

function groupEntriesBySource(entries: HookSettingsEntry[]): Array<Record<string, unknown>> {
  return sourceOrder.flatMap((source) => {
    const hooks = entries.flatMap((entry) =>
      entry.hooks.filter((hook) => normalizeSource(hook.source) === source),
    );
    return hooks.length === 0 ? [] : [{ id: source, entry: { cwd: "", hooks: dedupeHooks(hooks), warnings: [], errors: [] } }];
  });
}

function resolveEntryForSource(
  groups: Array<Record<string, unknown>>,
  selection: SourceSelection | null,
): unknown {
  if (selection == null) return null;
  return groups.find((group) => group.id === selection.source) ?? null;
}
