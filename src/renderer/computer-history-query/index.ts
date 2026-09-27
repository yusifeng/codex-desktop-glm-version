import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignals,
  QI as initializeQueries,
  ZI as appScope,
  eZ as createScopedQuery,
} from "@rchunk/app-shared";
import {
  mnt as initializeDesktopBridge,
  pnt as desktopBridge,
} from "@rchunk/app-initial";

interface ChronicleHistoryService {
  listHistory(): Promise<unknown>;
  listHistorySuggestions(): Promise<unknown>;
  listHistorySummaryIntervals(options: { sinceMs: number }): Promise<unknown>;
}

interface DesktopBridgeWithChronicle {
  chronicle?: ChronicleHistoryService | null;
}

const bridge = desktopBridge as DesktopBridgeWithChronicle;
let historyQueryKey: string[];
let historyQuery: unknown;
let suggestionsQuery: unknown;
let summaryIntervalsQuery: unknown;

function requireChronicle(): ChronicleHistoryService {
  if (bridge.chronicle == null) throw new Error("Computer history is unavailable");
  return bridge.chronicle;
}

function initializeComputerHistoryQueries(): void {
  initializeSignals();
  initializeDesktopBridge();
  initializeQueries();
  historyQueryKey = ["chronicle-history"];
  const suggestionsKey = [...historyQueryKey, "suggestions"];
  const intervalsKey = [...historyQueryKey, "summary-intervals"];
  const createQuery = createScopedQuery as unknown as (
    scope: unknown,
    factory: () => Record<string, unknown>,
  ) => unknown;
  historyQuery = createQuery(appScope, () => ({
    enabled: bridge.chronicle != null,
    queryKey: historyQueryKey,
    queryFn: () => requireChronicle().listHistory(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 0,
  }));
  suggestionsQuery = createQuery(appScope, () => ({
    enabled: bridge.chronicle != null,
    queryKey: suggestionsKey,
    queryFn: () => requireChronicle().listHistorySuggestions(),
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 0,
  }));
  summaryIntervalsQuery = createQuery(appScope, () => ({
    enabled: bridge.chronicle != null,
    queryKey: intervalsKey,
    queryFn: () => requireChronicle().listHistorySummaryIntervals({
      sinceMs: Date.now() - 604_800_000,
    }),
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 0,
  }));
}

export {
  initializeComputerHistoryQueries as a,
  summaryIntervalsQuery as i,
  historyQuery as n,
  suggestionsQuery as r,
  historyQueryKey as t,
};
