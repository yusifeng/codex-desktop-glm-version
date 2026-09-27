import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";

function ecosystemWidgetQuery(input: { accountId?: string | null; appUri: string; connectorId?: string | null; hostId: string; targetId?: string | null; template?: string | null }) {
  return {
    queryKey: ["ecosystem-widget-resource", input.hostId, input.accountId ?? null, input.appUri, input.template ?? null],
    enabled: input.appUri.length > 0,
    retry: false,
    staleTime: Infinity,
  };
}
function initializeEcosystemWidgetQueries(): void {}
export { initializeEcosystemWidgetQueries as n, ecosystemWidgetQuery as t };
