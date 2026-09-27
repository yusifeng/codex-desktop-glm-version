import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
interface MigrationService { getState(): Promise<Record<string, unknown>> }
function migrationQuery(service: MigrationService | null, accountId: string, userId: string, enabled = true): Record<string, unknown> { return { enabled: enabled && service != null, queryKey: ["local-automation-habitat-migration", accountId, userId], queryFn: async () => { if (service == null) throw new Error("Local automation migration is unavailable"); return service.getState(); }, refetchInterval: (query: { state?: { data?: { status?: string }; dataUpdateCount?: number } }) => query.state?.data?.status === "unavailable" && (query.state.dataUpdateCount ?? 0) < 15 ? 1000 : false, retry: false, staleTime: 60_000 }; }
function initialize(): void {}
function isMigrationComplete(state: Record<string, unknown> | null): boolean { return state?.status === "complete"; }
export { initialize as n, migrationQuery as r, isMigrationComplete as t };
