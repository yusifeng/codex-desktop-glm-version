import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/canonical-plugin-query";

export interface SetupApp { id: string; isAccessible?: boolean; [key: string]: unknown }
export interface SetupPlugin { canonicalAppId?: string | null; marketplaceName?: string; plugin: { id: string; installed?: boolean; name?: string; [key: string]: unknown }; [key: string]: unknown }
export interface SetupResult { appsRequiringConnection: SetupApp[]; importedPlugins: Array<{ app: SetupApp; plugin: SetupPlugin }> }
export type SetupInputResult = { status: "loading" } | { retry?(): void; status: "error" } | { data: { kind: "plugin-directory"; candidates: SetupApp[]; directoryApps: SetupApp[]; runtimeApps: SetupApp[] } | { kind: "complete" | "targeted-plugins"; setup: SetupResult }; status: "ready" };

const canonicalId = (value: string): string => value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
function matchesCanonicalApp(app: SetupApp, plugin: SetupPlugin): boolean { return plugin.marketplaceName != null && (plugin.canonicalAppId == null ? canonicalId(plugin.plugin.name ?? plugin.plugin.id) === canonicalId(app.id) : canonicalId(plugin.canonicalAppId) === canonicalId(app.id)); }
function resolvePluginSetup({ candidates, directoryApps, plugins, runtimeApps, useCanonicalAppIds = false }: { candidates: SetupApp[]; directoryApps: SetupApp[]; plugins: SetupPlugin[]; runtimeApps: SetupApp[]; useCanonicalAppIds?: boolean }): SetupResult {
  const availableApps = uniqueApps([...directoryApps, ...candidates]);
  const runtimeById = new Map(runtimeApps.map((app) => [canonicalId(app.id), app]));
  const seenPlugins = new Set<string>();
  const appsRequiringConnection: SetupApp[] = [];
  const importedPlugins: Array<{ app: SetupApp; plugin: SetupPlugin }> = [];
  for (const app of availableApps) {
    const matching = plugins.filter((plugin) => useCanonicalAppIds ? matchesCanonicalApp(app, plugin) : canonicalId(plugin.plugin.name ?? plugin.plugin.id) === canonicalId(app.id));
    if (matching.length === 0 || matching.some((plugin) => plugin.plugin.installed)) { if (!runtimeById.get(canonicalId(app.id))?.isAccessible) appsRequiringConnection.push(app); continue; }
    const plugin = matching[0];
    if (plugin != null && !seenPlugins.has(plugin.plugin.id)) { seenPlugins.add(plugin.plugin.id); importedPlugins.push({ app, plugin }); }
  }
  return { appsRequiringConnection, importedPlugins };
}
function mergeSetupResult({ inputsResult, pluginDirectory }: { inputsResult: SetupInputResult; pluginDirectory: { errorMessage?: string | null; isLoading: boolean; plugins: SetupPlugin[]; refetch(): void } }): SetupInputResult | { data?: SetupResult; retry?(): void; status: "error" | "loading" | "ready" } {
  if (inputsResult.status !== "ready") return inputsResult;
  if (inputsResult.data.kind !== "plugin-directory") return { data: inputsResult.data.setup, status: "ready" };
  if (pluginDirectory.errorMessage != null) return { status: "error", retry: pluginDirectory.refetch };
  if (pluginDirectory.isLoading) return { status: "loading" };
  return { data: resolvePluginSetup({ candidates: inputsResult.data.candidates, directoryApps: inputsResult.data.directoryApps, plugins: pluginDirectory.plugins, runtimeApps: inputsResult.data.runtimeApps }), status: "ready" };
}
const pluginSetupState = { key: "plugin-setup-state" };
const initializeMatching = (): void => {};
const initializeState = (): void => {};
const uniqueApps = (apps: SetupApp[]): SetupApp[] => [...new Map(apps.map((app) => [canonicalId(app.id), app])).values()];
export { matchesCanonicalApp as a, initializeMatching as i, pluginSetupState as n, initializeState as r, mergeSetupResult as t };
