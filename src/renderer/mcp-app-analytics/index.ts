import "@rchunk/rolldown-runtime";

interface McpAppMetadata {
  appMetadata?: { firstPartyType?: unknown };
  distributionChannel?: string;
  name?: string;
}

function getAnalyticsAppName(app: McpAppMetadata | null | undefined): string | undefined {
  if (app == null) return undefined;
  const firstPartyType = app.appMetadata?.firstPartyType;
  const isFirstParty = typeof firstPartyType === "string" && firstPartyType.trim() !== "";
  const isCatalogApp = app.distributionChannel === "DEFAULT_OAI_CATALOG" || app.distributionChannel === "ECOSYSTEM_DIRECTORY";
  return isFirstParty || isCatalogApp ? app.name : undefined;
}

function initializeMcpAppAnalytics(): void {}

export { initializeMcpAppAnalytics as n, getAnalyticsAppName as t };
