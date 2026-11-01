import "@rchunk/rolldown-runtime";
import {
  $O as queryDurations,
  VJ as supportsHostCapability,
  ek as initializeQueryHooks,
  wL as initializeUtilities,
} from "@rchunk/app-shared";
import {
  B$ as initializeConnectorQuery,
  FEt as connectorLinkQueryOptions,
  G6t as initializeAppReadCapability,
  HEt as initializeExternalSourceProviderQuery,
  HZt as initializeSidePanelRoutes,
  Ifn as hostCapabilitiesById,
  Iv as normalizeAvailableAppIds,
  Lv as initializeConnectorLinks,
  Rv as isRemoteHost,
  W6t as getBrowserAccountId,
  X3t as connectorDetailsQuery,
  cDt as remoteAvailableAppsQuery,
  s6t as initializePluginSettings,
  uDt as initializeAvailableApps,
  z$ as localAvailableAppsQuery,
} from "@rchunk/app-initial";
import {
  a as getDefaultAvailableCompanions,
  d as getConnectorAvailableCompanions,
  h as initializeConnectorCompanionModel,
  o as getDefaultCompanionConnectorIds,
  p as getConnectorCompanionConnectorIds,
  s as initializeDefaultCompanionModel,
} from "@rchunk/app-connect-modal";

interface Connector extends Record<string, unknown> {
  id: string;
}
interface ConnectorDefinition extends Record<string, unknown> {
  connectorId: string;
}
type ConnectorLink = Record<string, unknown>;
interface QueryOptions extends Record<string, unknown> {
  queryKey: readonly unknown[];
  staleTime?: number;
}
interface QueryClient {
  fetchQuery<Value>(options: QueryOptions): Promise<Value>;
  setQueryData(queryKey: readonly unknown[], value: unknown): void;
}
interface AvailabilityScope {
  get(signal: unknown, parameter?: unknown): unknown;
}
interface AvailabilityInput extends Record<string, unknown> {
  appId: string;
  browserAccountId?: string | null;
  freshLinkChecks?: boolean;
  hostId: string;
  primaryLink?: unknown;
  queryClient: QueryClient;
  scope: AvailabilityScope;
}
interface ConnectorAvailabilityInput extends AvailabilityInput {
  connectors: ConnectorDefinition[];
}
interface CompanionQueryInput {
  availableAppIds: Set<string>;
  companionConnectorIds: string[];
  companionConnectors: Array<Connector | null>;
  companionLinks: Array<ConnectorLink | null | undefined>;
}

async function resolveAvailableCompanions(
  input: AvailabilityInput,
  getAvailableCompanions: (input: CompanionQueryInput) => Connector[],
  getCompanionConnectorIds: (appId: string) => string[],
): Promise<Connector[]> {
  const {
    scope,
    appId,
    browserAccountId,
    freshLinkChecks = false,
    hostId,
    primaryLink,
    queryClient,
  } = input;
  const linkQuery = connectorLinkQueryOptions(appId) as QueryOptions;
  const primaryLinkResult = primaryLink === undefined
    ? await queryClient
      .fetchQuery<unknown>({
        ...linkQuery,
        staleTime: freshLinkChecks ? 0 : queryDurations.FIVE_MINUTES,
      })
      .then((link) => ({ link }))
      .catch(() => undefined)
    : { link: primaryLink };
  if (primaryLink !== undefined) {
    queryClient.setQueryData(linkQuery.queryKey, primaryLink);
  }
  if (primaryLinkResult == null || primaryLinkResult.link != null) return [];

  const companionIds = getCompanionConnectorIds(appId);
  const availableAppIds = isRemoteHost(hostId)
    ? normalizeAvailableAppIds(
      await queryClient.fetchQuery<unknown>(remoteAvailableAppsQuery({
        accountId: browserAccountId ?? getBrowserAccountId(scope) ?? null,
        appIds: companionIds,
        enabled: true,
      }) as QueryOptions).catch(() => undefined),
    )
    : new Set(
      (await queryClient.fetchQuery<Array<{ id: string }>>(localAvailableAppsQuery({
        scope,
        appIds: companionIds,
        browserAccountId,
        hostId,
        queryClient,
        supportsAppRead: supportsHostCapability(
          scope.get(hostCapabilitiesById, hostId),
          "appRead",
        ),
      }) as QueryOptions).catch(() => []))
        .map(({ id }) => id),
    );
  const availableCompanionIds = companionIds.filter((id) => availableAppIds.has(id));
  if (availableCompanionIds.length === 0) return [];

  const fetchLink = (id: string) => queryClient.fetchQuery<ConnectorLink | null>({
    ...(connectorLinkQueryOptions(id) as QueryOptions),
    staleTime: freshLinkChecks ? 0 : queryDurations.FIVE_MINUTES,
  });
  const [primaryConnector, companionConnectors, companionLinks] = await Promise.all([
    queryClient.fetchQuery<Connector>(connectorDetailsQuery(appId) as QueryOptions).catch(() => null),
    Promise.all(availableCompanionIds.map((id) =>
      queryClient.fetchQuery<Connector>(connectorDetailsQuery(id) as QueryOptions).catch(() => null))),
    Promise.all(availableCompanionIds.map((id) => fetchLink(id).catch(() => undefined))),
  ]);
  if (primaryConnector == null) return [];
  return getAvailableCompanions({
    availableAppIds,
    companionConnectorIds: availableCompanionIds,
    companionConnectors,
    companionLinks,
  });
}

function initializeAvailabilityCore(): void {
  initializeUtilities();
  initializeSidePanelRoutes();
  initializePluginSettings();
  initializeConnectorLinks();
  initializeAppReadCapability();
  initializeConnectorQuery();
  initializeExternalSourceProviderQuery();
  initializeAvailableApps();
  initializeQueryHooks();
}

function getAvailableConnectorCompanions(
  input: ConnectorAvailabilityInput,
): Promise<Connector[]> {
  return resolveAvailableCompanions(
    input,
    (context) => getConnectorAvailableCompanions({ ...context, connectors: input.connectors })
      .map(({ connector }) => connector as Connector),
    (appId) => getConnectorCompanionConnectorIds(appId, input.connectors),
  );
}

function initializeConnectorAvailability(): void {
  initializeAvailabilityCore();
  initializeConnectorCompanionModel();
}

function getAvailableDefaultCompanions(
  input: AvailabilityInput,
): Promise<Connector[]> {
  return resolveAvailableCompanions(
    input,
    getDefaultAvailableCompanions as unknown as (input: CompanionQueryInput) => Connector[],
    getDefaultCompanionConnectorIds,
  );
}

function initializeDefaultAvailability(): void {
  initializeAvailabilityCore();
  initializeDefaultCompanionModel();
}

export {
  getAvailableConnectorCompanions as i,
  getAvailableDefaultCompanions as n,
  initializeConnectorAvailability as r,
  initializeDefaultAvailability as t,
};
