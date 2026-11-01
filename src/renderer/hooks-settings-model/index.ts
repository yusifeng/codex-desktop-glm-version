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

function dedupeIssues(issues: HookIssue[]): HookIssue[] {
  const byLocation = new Map<string, HookIssue>();
  for (const issue of issues) byLocation.set(`${issue.path}:${issue.message}`, issue);
  return [...byLocation.values()];
}

function isIssueOnlyEntry(entry: HookSettingsEntry): boolean {
  return entry.hooks.length === 0 && (entry.warnings.length > 0 || entry.errors.length > 0);
}

function combineEntries(
  entries: HookSettingsEntry[],
  hooks: HookDefinition[],
  additionalEntries: HookSettingsEntry[] = [],
): HookSettingsEntry {
  const uniqueHooks = dedupeHooks(hooks);
  const hookKeys = new Set(uniqueHooks.map((hook) => hook.key));
  const relevantEntries = [
    ...entries.filter((entry) => entry.hooks.some((hook) => hookKeys.has(hook.key))),
    ...additionalEntries,
  ];
  return {
    cwd: "",
    hooks: uniqueHooks,
    warnings: [...new Set(relevantEntries.flatMap((entry) => entry.warnings))],
    errors: dedupeIssues(relevantEntries.flatMap((entry) => entry.errors)),
  };
}

function entryForSource(
  entries: HookSettingsEntry[],
  source: Exclude<HookSourceGroup, "plugin" | "project">,
): HookSettingsEntry | null {
  const hooks = entries.flatMap((entry) =>
    entry.hooks.filter((hook) => normalizeSource(hook.source) === source));
  const issueOnlyEntries = source === "unknown" ? entries.filter(isIssueOnlyEntry) : [];
  return hooks.length === 0 && issueOnlyEntries.length === 0
    ? null
    : combineEntries(entries, hooks, issueOnlyEntries);
}

function projectEntry(entry: HookSettingsEntry): HookSettingsEntry | null {
  const hooks = entry.hooks.filter((hook) => normalizeSource(hook.source) === "project");
  return hooks.length === 0 ? null : { ...entry, hooks };
}

function pluginEntries(entries: HookSettingsEntry[]): Array<{
  entry: HookSettingsEntry;
  pluginId?: string | null;
}> {
  const hooksByPlugin = new Map<string | null | undefined, HookDefinition[]>();
  for (const entry of entries) {
    for (const hook of entry.hooks) {
      if (normalizeSource(hook.source) !== "plugin") continue;
      const hooks = hooksByPlugin.get(hook.pluginId);
      if (hooks == null) hooksByPlugin.set(hook.pluginId, [hook]);
      else hooks.push(hook);
    }
  }
  return [...hooksByPlugin.entries()]
    .sort(([left], [right]) =>
      left == null ? 1 : right == null ? -1 : left.localeCompare(right))
    .map(([pluginId, hooks]) => ({ pluginId, entry: combineEntries(entries, hooks) }));
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
  const groups: Array<Record<string, unknown>> = [];
  for (const source of sourceOrder) {
    if (source === "project") {
      const projectEntries = entries.map(projectEntry).filter((entry) => entry != null);
      if (projectEntries.length > 0) groups.push({ id: source, projectEntries });
      continue;
    }
    if (source === "plugin") {
      const hooks = entries.flatMap((item) =>
        item.hooks.filter((hook) => normalizeSource(hook.source) === "plugin"));
      const plugins = pluginEntries(entries);
      if (hooks.length > 0 && plugins.length > 0) {
        groups.push({
          id: source,
          entry: combineEntries(entries, hooks),
          pluginEntries: plugins,
        });
      }
      continue;
    }
    const entry = entryForSource(entries, source);
    if (entry != null) groups.push({ id: source, entry });
  }
  return groups;
}

function resolveEntryForSource(
  groups: Array<Record<string, unknown>>,
  selection: SourceSelection | null,
): unknown {
  if (selection == null) return null;
  const group = groups.find((candidate) => candidate.id === selection.source) as
    | {
        entry?: unknown;
        id: string;
        pluginEntries?: Array<{ entry: unknown; pluginId?: string | null }>;
        projectEntries?: Array<HookSettingsEntry>;
      }
    | undefined;
  if (group == null) return null;
  if (selection.source === "project") {
    return group.id === "project"
      ? group.projectEntries?.find((entry) => entry.cwd === selection.projectRoot) ?? null
      : null;
  }
  if (selection.source === "plugin") {
    if (group.id !== "plugin") return null;
    return selection.pluginId === undefined
      ? group.entry ?? null
      : group.pluginEntries?.find((entry) => entry.pluginId === selection.pluginId)?.entry ?? null;
  }
  return group.id === selection.source ? group.entry ?? null : null;
}
