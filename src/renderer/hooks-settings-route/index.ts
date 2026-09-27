// hooks-settings-route —— Hooks 设置页 URL 与查询参数同步工具。
import * as runtimeChunk from "@rchunk/rolldown-runtime";
import * as hooksSettingsModelChunk from "@rchunk/hooks-settings-model";
void runtimeChunk;

const { p: initializeHooksSettingsModel } = hooksSettingsModelChunk;

type HooksSettingsSource =
  | { source: "project"; projectRoot: string }
  | { source: "plugin"; pluginId?: string | null }
  | { source: string; projectRoot?: string; pluginId?: string | null };

interface HooksSettingsRouteOptions {
  hostId?: string;
  pluginId?: string | null;
  projectRoot?: string;
  source?: string;
}

const UNKNOWN_PLUGIN_ID = "__unknown__";
let hooksSettingsSegment: string;
let settingsRoot: string;

function buildHooksSettingsPath({
  hostId,
  pluginId,
  projectRoot,
  source,
}: HooksSettingsRouteOptions): string {
  const params = new URLSearchParams();
  if (hostId != null) params.set("hostId", hostId);
  if (source != null) params.set("source", source);
  if (source != null && projectRoot != null)
    params.set("projectRoot", projectRoot);
  if (source === "plugin" && pluginId !== undefined)
    params.set("pluginId", pluginId ?? UNKNOWN_PLUGIN_ID);
  const query = params.toString();
  return query === "" ? hooksSettingsSegment : `${hooksSettingsSegment}?${query}`;
}

function buildHooksSettingsUrl(options: HooksSettingsRouteOptions): string {
  return `${settingsRoot}/${buildHooksSettingsPath(options)}`;
}

function updateHooksSettingsSearchParams(
  params: URLSearchParams,
  hostId: string,
  selection: HooksSettingsSource | null,
): void {
  for (const key of ["hostId", "pluginId", "projectRoot", "source"])
    params.delete(key);
  if (selection == null) return;
  params.set("hostId", hostId);
  params.set("source", selection.source);
  if (selection.source === "project") {
    params.set("projectRoot", selection.projectRoot);
    return;
  }
  if (selection.source === "plugin" && selection.pluginId !== undefined)
    params.set("pluginId", selection.pluginId ?? UNKNOWN_PLUGIN_ID);
}

function initializeHooksSettingsRoute(): void {
  initializeHooksSettingsModel();
  hooksSettingsSegment = "hooks-settings";
  settingsRoot = "/settings";
}

initializeHooksSettingsRoute();

export {
  updateHooksSettingsSearchParams as i,
  buildHooksSettingsPath as n,
  initializeHooksSettingsRoute as r,
  buildHooksSettingsUrl as t,
};
