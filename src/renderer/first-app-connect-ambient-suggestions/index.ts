// first-app-connect-ambient-suggestions —— 首次启用可访问 app 后刷新 ambient suggestions。
// 原版：app/webview/assets/first-app-connect-ambient-suggestions-ef1637627fe1.js。

import { iW as resolveProjectRoot, wL as initializeSharedApps } from "@rchunk/app-shared";
import {
  $ln as ambientQueryKey,
  Qln as requestAmbientSuggestionRefresh,
  aun as initializeAmbientRefresh,
  nun as initializeAppsQueries,
  oun as refreshQueryState,
  q3t as appsListQueryState,
  s6t as initializeSuggestionQueries,
} from "@rchunk/app-initial";
import {
  a as initializeNewChatPageSuggestionsEligibility,
  n as ambientSuggestionAppQueryKey,
} from "@rchunk/new-chat-page-suggestions-eligibility";

export interface ConnectedApp {
  isAccessible: boolean;
  isEnabled: boolean;
  [key: string]: unknown;
}

export interface AmbientSuggestionQueryClient {
  getQueriesData(options: { queryKey: readonly unknown[] }): Array<[unknown, ConnectedApp[] | null | undefined]>;
  invalidateQueries(options: { queryKey: readonly unknown[] }): Promise<unknown>;
}

function hasAccessibleEnabledApp(app: ConnectedApp): boolean {
  return app.isAccessible && app.isEnabled;
}

function gainedFirstAccessibleEnabledApp(input: {
  previousApps?: ConnectedApp[];
  nextApps: ConnectedApp[];
}): boolean {
  return input.previousApps != null &&
    !input.previousApps.some(hasAccessibleEnabledApp) &&
    input.nextApps.some(hasAccessibleEnabledApp);
}

async function refreshAppsAndAmbientSuggestions(input: {
  hostId: string;
  queryClient: AmbientSuggestionQueryClient;
  refreshAppsList(): Promise<ConnectedApp[]>;
}): Promise<ConnectedApp[]> {
  const cached = input.queryClient.getQueriesData({ queryKey: ["apps", "list", input.hostId] });
  const previousApps = cached.some(([, apps]) => apps != null)
    ? cached.flatMap(([, apps]) => apps ?? [])
    : undefined;

  const [nextApps] = await Promise.all([
    input.refreshAppsList(),
    refreshQueryState(input.queryClient, appsListQueryState),
  ]);
  if (!gainedFirstAccessibleEnabledApp({ previousApps, nextApps })) return nextApps;

  await refreshQueryState(input.queryClient, ambientSuggestionAppQueryKey(input.hostId));
  await Promise.all(
    [null, "science"].map((domain) =>
      requestAmbientSuggestionRefresh("ambient-suggestions-refresh", {
        params: {
          domain,
          hostId: input.hostId,
          projectRoot: resolveProjectRoot("~"),
          mode: "first-plugin-connect",
        },
      }),
    ),
  );
  await Promise.all([
    input.queryClient.invalidateQueries({ queryKey: ambientQueryKey("ambient-suggestions") }),
    input.queryClient.invalidateQueries({ queryKey: ambientQueryKey("ambient-suggestions-refresh") }),
  ]);
  return nextApps;
}

function initializeFirstAppConnectAmbientSuggestions(): void {
  initializeSharedApps();
  initializeNewChatPageSuggestionsEligibility();
  initializeAmbientRefresh();
  initializeAppsQueries();
  initializeSuggestionQueries();
}

export {
  refreshAppsAndAmbientSuggestions as n,
  initializeFirstAppConnectAmbientSuggestions as t,
};
