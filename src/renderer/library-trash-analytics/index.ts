import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
interface LibraryItem { node: { id: string } }
interface AnalyticsScope { get?(key: unknown): unknown; log?(event: Record<string, unknown>): void }
interface ApiErrorLike { errorCode?: string; errorKind?: string; responseStatus?: number }
const a = { value: crypto.randomUUID() };
function classify(error: unknown): { code?: string; httpStatus?: number; type: string } | undefined { if (error == null || typeof error !== "object") return undefined; const value = error as ApiErrorLike, status = value.responseStatus, code = value.errorCode != null && /^[a-z0-9_-]{1,64}$/i.test(value.errorCode) ? value.errorCode : undefined, normalized = code?.toLowerCase(); const network = value.errorKind === "network" || status == null; let type: string; if (network) type = "network_error"; else if (status === 507 || normalized?.includes("storage_limit") || normalized?.includes("quota")) type = "storage_limit"; else if (status === 404 || normalized?.includes("not_found") || normalized === "file_expired") type = "missing_library_file"; else if (status === 408 || status === 504) type = "timeout"; else if (status === 401 || status === 403) type = "auth_error"; else if (status === 429) type = "rate_limited"; else if (status >= 500) type = "server_error"; else if (status >= 400) type = "bad_request"; else type = "invalid_response"; return { type, code, httpStatus: !network && Number.isInteger(status) && status >= 100 && status <= 599 ? status : undefined }; }
function i(scope: AnalyticsScope, items: LibraryItem[]): void { const ids = [...new Set(items.map(item => item.node.id))]; scope.log?.({ event: "library_permanent_delete_initiated", libraryFileIds: JSON.stringify({ libraryFileIds: ids }).length <= 2000 ? ids : undefined, selectedCount: items.length, sessionId: a.value }); }
function r(scope: AnalyticsScope, items: LibraryItem[]): void { scope.log?.({ event: "library_items_selected_for_delete", artifactIds: items.map(item => item.node.id), itemCount: items.length }); }
function n(scope: AnalyticsScope, sessionId: string, interactionType: string, error: unknown): void { scope.log?.({ event: "library_permanent_delete_result", interactionType, sessionId, error: classify(error) }); }
function t(): void {}
export { a, i, n, r, t };
