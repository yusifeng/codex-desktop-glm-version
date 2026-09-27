import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
interface AnalyticsStore { get?(key: unknown): { logEventWithStatsig?(name: string, metadata?: Record<string, unknown>): void }; logEventWithStatsig?(name: string, metadata?: Record<string, unknown>): void }
function logBillingEvent(store: AnalyticsStore, event: { name: string; metadata?: Record<string, unknown> }): void { store.logEventWithStatsig?.(event.name, event.metadata); }
function logBillingUpdateError(store: AnalyticsStore, error: Error): void { let metadata: Record<string, unknown> = {}; try { const detail = (JSON.parse(error.message) as { detail?: { error_type?: string; reason?: string } }).detail; if (detail) metadata = { ...(detail.error_type ? { error_type: detail.error_type } : {}), ...(detail.reason ? { reason: detail.reason } : {}) }; } catch {} logBillingEvent(store, { name: "chatgpt_plan_management_modal_handle_update_error", metadata }); }
function initializeBillingEvents(): void {}
export { logBillingUpdateError as n, logBillingEvent as r, initializeBillingEvents as t };
