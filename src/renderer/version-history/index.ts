import "@rchunk/rolldown-runtime";
import { I3 as getJsxRuntime, type JsxRuntime } from "@rchunk/app-shared";
import "@rchunk/app-initial";
interface FileVersion { created_at?: string; id: string; is_current?: boolean; label?: string }
interface VersionHistoryProps { error?: string | null; file: { libraryFileId: string }; hasNextPage?: boolean; isLoading?: boolean; onLoadMore?(): void; onRestore?(version: FileVersion): void; versions?: FileVersion[] }
let runtime: JsxRuntime | undefined; function jsx(): JsxRuntime { runtime ??= getJsxRuntime(); return runtime; }
function VersionHistory({ error, hasNextPage = false, isLoading = false, onLoadMore, onRestore, versions = [] }: VersionHistoryProps): unknown { if (isLoading) return jsx().jsx("div", { role: "status", children: "Loading version history…" }); if (error != null) return jsx().jsx("div", { role: "alert", children: error }); return jsx().jsxs("section", { "aria-label": "Version history", children: [versions.map(version => jsx().jsxs("button", { type: "button", disabled: version.is_current === true, onClick: () => onRestore?.(version), children: [version.label ?? version.created_at ?? version.id, version.is_current ? " (Current)" : ""] }, version.id)), hasNextPage ? jsx().jsx("button", { type: "button", onClick: onLoadMore, children: "Load more" }) : null] }); }
function t(props: VersionHistoryProps): unknown { return VersionHistory(props); }
function r(): void {}
export { VersionHistory as n, r, t };
