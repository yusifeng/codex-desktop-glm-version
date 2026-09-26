// ambient-suggestion-apps —— Ambient suggestion 中 app id 的规范化、查询和图标资格。
// 原版：app/webview/assets/ambient-suggestion-apps-75842c7ad68b.js。

import {
  BX as useStoreFamilyValue,
  FX as initializeStore,
  QI as initializeQueryBridge,
  ZI as storeFamily,
  rZ as createDerivedFamily,
  type DerivedScopedSignalContext,
  type ScopedDerivedFamily,
} from "@rchunk/app-shared";
import {
  $4t as initializeApps,
  Bfn as initializeAppIcons,
  HEt as initializeHostApps,
  M6t as initializeAppQueries,
  MEt as appsQueryFamily,
  N6t as useCurrentUser,
  X4t as resolveAppIcon,
  oDt as initializeHostState,
  sDt as useHostAvailable,
} from "@rchunk/app-initial";

export interface AmbientSuggestionApp {
  id: string;
  name: string;
  pluginDisplayNames?: string[] | null;
  [key: string]: unknown;
}

function normalizeAmbientAppId(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function createAmbientSuggestionAppIndex(
  apps: AmbientSuggestionApp[],
): Map<string, AmbientSuggestionApp> {
  const index = new Map<string, AmbientSuggestionApp>();
  for (const app of apps) {
    const aliases = [
      app.id,
      normalizeAmbientAppId(app.id),
      normalizeAmbientAppId(app.name),
      ...(app.pluginDisplayNames ?? []).map(normalizeAmbientAppId),
    ];
    if (app.id.startsWith("connector_")) aliases.push(normalizeAmbientAppId(app.id.slice(10)));
    for (const alias of aliases) {
      if (alias.length > 0 && !index.has(alias)) index.set(alias, app);
    }
  }
  return index;
}

function resolveAmbientSuggestionApps(
  index: Map<string, AmbientSuggestionApp>,
  appIds: readonly string[],
): AmbientSuggestionApp[] {
  const matches = new Set<AmbientSuggestionApp>();
  for (const appId of appIds) {
    const app = index.get(appId) ?? index.get(normalizeAmbientAppId(appId));
    if (app != null) matches.add(app);
  }
  return Array.from(matches);
}

function hasAppWithoutIcon(apps: Iterable<AmbientSuggestionApp>): boolean {
  for (const app of apps) if (resolveAppIcon(app) == null) return true;
  return false;
}

interface AppsQueryResult {
  data?: AmbientSuggestionApp[];
}

let appIndexFamily: ScopedDerivedFamily<
  Record<string, unknown>,
  string,
  Map<string, AmbientSuggestionApp> | undefined
>;

function initializeAmbientSuggestionApps(): void {
  if (appIndexFamily != null) return;
  initializeStore();
  initializeApps();
  initializeAppQueries();
  initializeHostState();
  initializeHostApps();
  initializeQueryBridge();
  initializeAppIcons();
  appIndexFamily = createDerivedFamily(
    storeFamily,
    (hostId: string, context: DerivedScopedSignalContext<Record<string, unknown>>) => {
      const apps = context.get<AppsQueryResult>(appsQueryFamily, hostId).data;
      return apps == null ? undefined : createAmbientSuggestionAppIndex(apps);
    },
  );
}

function useAmbientSuggestionApps(input: {
  appIds: readonly string[];
  enabled?: boolean;
  hostId?: string | null;
}): AmbientSuggestionApp[] | undefined {
  initializeAmbientSuggestionApps();
  const enabled = input.enabled ?? true;
  const hostId = input.hostId ?? "local";
  const user = useCurrentUser();
  const hostAvailable = useHostAvailable({ hostId });
  const canQuery = enabled && hostAvailable && !user.isLoading && user.userId != null;
  const index = useStoreFamilyValue(appIndexFamily, hostId, { enabled: canQuery }) as
    | Map<string, AmbientSuggestionApp>
    | undefined;
  return index == null ? undefined : resolveAmbientSuggestionApps(index, input.appIds);
}

export {
  useAmbientSuggestionApps as a,
  hasAppWithoutIcon as i,
  resolveAmbientSuggestionApps as n,
  initializeAmbientSuggestionApps as r,
  createAmbientSuggestionAppIndex as t,
};
