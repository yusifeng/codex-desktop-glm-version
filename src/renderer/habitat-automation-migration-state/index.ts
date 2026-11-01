// Local automation -> Habitat migration state. The published ABI exports the
// derived query signal as `n`, the consent-visibility signal as `r`, and the
// lazy initializer as `t`.
import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";

interface QueryContext {
  get<Value>(signal: unknown, argument?: unknown): Value;
  scope: { queryClient?: { invalidateQueries?(input: { queryKey: unknown }): unknown } };
}
interface MigrationRuntime { automations?: { getState(): Promise<Record<string, unknown>> } }
interface AuthState { plan?: unknown; status?: string }
interface AppSharedBindings {
  $O?: { ONE_MINUTE?: number };
  FX?(): void;
  QI?(): void;
  ZI?: unknown;
  eZ?: (scope: unknown, derive: (context: QueryContext) => Record<string, unknown>) => unknown;
  ek?(): void;
  pZ?: (scope: unknown, initialValue: unknown) => unknown;
}
interface AppInitialBindings {
  $ln?: (name: string) => unknown;
  Rln?(): void;
  Sun?(): void;
  Wln?: (plan: unknown) => boolean;
  _un?: unknown;
  mfn?: (gateId: string) => unknown;
  mnt?(): void;
  mun?: unknown;
  nun?(): void;
  pfn?(): void;
  pnt?: MigrationRuntime;
  vun?: unknown;
}

const shared = appSharedChunk as unknown as AppSharedBindings;
const initial = appInitialChunk as unknown as AppInitialBindings;
let migrationQuerySignal: unknown;
let migrationVisibilitySignal: unknown;
let initialized = false;

function initializeMigrationState(): void {
  if (initialized) return;
  shared.FX?.(); initial.Sun?.(); initial.mnt?.(); shared.QI?.(); initial.pfn?.();
  shared.ek?.(); initial.Rln?.(); initial.nun?.();
  migrationVisibilitySignal = shared.pZ?.(shared.ZI, null);
  migrationQuerySignal = shared.eZ?.(shared.ZI, ({ get, scope }) => {
    const accountId = get<string | null>(initial.mun);
    const userId = get<string | null>(initial._un);
    const auth = get<AuthState | null>(initial.vun);
    const allowUnavailablePolling = get<boolean>(initial.mfn?.("4020418403"));
    const service = initial.pnt?.automations;
    const enabled = service != null && accountId != null && userId != null && auth?.status === "allowed" && "plan" in auth && initial.Wln?.(auth.plan) !== true;
    return {
      enabled,
      queryFn: async () => {
        if (service == null) throw new Error("Local automation migration is unavailable");
        const state = await service.getState();
        if (state.status === "complete") scope.queryClient?.invalidateQueries?.({ queryKey: initial.$ln?.("list-automations") });
        return state;
      },
      queryKey: ["local-automation-habitat-migration", accountId, userId],
      refetchInterval: (query: { state?: { data?: { status?: string }; dataUpdateCount?: number } }) =>
        allowUnavailablePolling && query.state?.data?.status === "unavailable" && (query.state.dataUpdateCount ?? 0) < 15 ? 1000 : false,
      retry: false,
      staleTime: shared.$O?.ONE_MINUTE ?? 60_000,
    };
  });
  initialized = true;
}

export { migrationQuerySignal as n, migrationVisibilitySignal as r, initializeMigrationState as t };
