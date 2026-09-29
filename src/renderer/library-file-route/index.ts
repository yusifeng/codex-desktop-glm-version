import * as appInitialChunk from "@rchunk/app-initial";
import * as appSharedChunk from "@rchunk/app-shared";
import { t as initializeCloudFilePreview } from "@rchunk/cloud-file-preview";
import { n as LibraryCloudFilePreview } from "@rchunk/library-cloud-file-preview";
import { n as initializeLibraryFileMetadata, t as fetchLibraryFileMetadata } from "@rchunk/library-file-metadata";
import { n as initializeLoadingPreview, t as LibraryFilePreviewLoading } from "@rchunk/library-file-preview-loading";
import "@rchunk/rolldown-runtime";

interface QueryResult<Value> { data?: Value; error?: unknown; isPending: boolean; isFetching: boolean; refetch(): Promise<unknown> | unknown; }
interface LibraryFile extends Record<string, unknown> { id: string; name?: string; file_name?: string; file_id?: string; directory_id?: string | null; parent_directory_id?: string | null; current_version_number?: number; gizmo_id?: string; library_artifact_type?: string; library_file_category?: string; mime_type?: string | null; file_upload_time?: string | null; file_size_bytes?: number | null; cloud_doc_url?: string; thumbnail_url?: string | null; thumbnail_preview_url?: string | null; }
interface Scope { get(signal: unknown, parameter?: unknown): unknown; }
interface SharedApi { $3(): void; BX<Value>(signal: unknown, parameter: string): Value; FX(): void; FZ: () => Promise<never>; HX<Value>(signal: unknown): Value; I3(): import("@rchunk/app-shared").JsxRuntime; K2(): void; LX(scope: unknown): Scope; Y2: unknown; Yh: unknown; Zh(): void; _L<Value>(options: Record<string, unknown>): QueryResult<Value>; gL(): void; hU(value: string): boolean; jZ(): void; wL(): void; }
interface InitialApi { $en: unknown; Aet(): void; Qgn(): void; Sdn: new (...arguments_: never[]) => Error & { status?: number }; Sun(): void; _fn: unknown; _un: unknown; bun: unknown; bz(id: string): string | null; f7: { MainContentLayout: unknown }; gun: unknown; itn(): void; ket: unknown; l_n(): { libraryFileId?: string }; mfn: unknown; mun: unknown; o_n(): (destination: string) => void; p7(): void; pfn(): void; vfn: unknown; wdn(): void; }
const { $3: initializeCompilerRuntime, BX: useSignalFamilyValue, FX: initializeSignalRuntime, FZ: disabledQuery, HX: useSignalValue, I3: getJsxRuntime, K2: initializeIntlRuntime, LX: useScope, Y2: FormattedMessage, Yh: Button, Zh: initializeButtonRuntime, _L: useQuery, gL: initializeQueryRuntime, hU: isLibraryFileId, jZ: initializeMotionRuntime, wL: initializeSharedRuntime } = appSharedChunk as unknown as SharedApi;
const { $en: routeScope, Aet: initializeEmptyState, Qgn: initializeAccountRuntime, Sdn: ApiError, Sun: initializeSessionState, _fn: featureDisabledSignal, _un: userIdSignal, bun: accessSignal, bz: getMountedProvider, f7: AppLayout, gun: automationBlockedSignal, itn: initializeRouteState, ket: EmptyState, l_n: useRouteParameters, mfn: featureEnabledSignal, mun: accountIdSignal, o_n: useNavigate, p7: initializePageRuntime, pfn: initializeFeatureFlags, vfn: availabilityLoadingSignal, wdn: initializeApiErrors } = appInitialChunk as unknown as InitialApi;
function LibraryFileRoute(): unknown {
  const jsx = getJsxRuntime();
  useScope(routeScope);
  const { libraryFileId } = useRouteParameters();
  const navigate = useNavigate();
  const access = useSignalValue<string>(accessSignal);
  const accountId = useSignalValue<string | null>(accountIdSignal);
  const userId = useSignalValue<string | null>(userIdSignal);
  const automationBlocked = useSignalValue<boolean>(automationBlockedSignal);
  const automationAvailabilityLoading = useSignalValue<boolean>(availabilityLoadingSignal);
  const featureEnabled = useSignalFamilyValue<boolean>(featureEnabledSignal, "3765605143");
  const featureDisabled = useSignalFamilyValue<boolean>(featureDisabledSignal, "3765605143");
  const blocked = access === "loading" || access === "allowed" && !automationBlocked || automationAvailabilityLoading || featureDisabled;
  const enabledId = !blocked && access === "allowed" && featureEnabled && accountId != null && libraryFileId != null && isLibraryFileId(libraryFileId) ? libraryFileId : null;
  const query = useQuery<LibraryFile>({ queryKey: ["library-api", accountId, userId, "file", enabledId], queryFn: enabledId != null && accountId != null ? ({ signal }: { signal: AbortSignal }) => fetchLibraryFileMetadata(enabledId, accountId, signal) : disabledQuery, gcTime: 0, staleTime: 0, retry: false, refetchOnWindowFocus: false });
  if (blocked || enabledId != null && query.isPending) return jsx.jsx(LibraryFilePreviewLoading, {});
  if (enabledId != null && query.data != null && query.error == null) return jsx.jsxs(jsx.Fragment, { children: [jsx.jsx(AppLayout.MainContentLayout, { layout: "custom-titlebar" }), jsx.jsx(LibraryFileRoutePreview, { data: query.data, onClose: () => navigate("/library") })] });
  const retryable = enabledId != null && !(query.error instanceof ApiError && (query.error.status === 403 || query.error.status === 404));
  return jsx.jsx(EmptyState, { className: "select-none", layout: "page", title: jsx.jsx("h1", { role: "alert", children: jsx.jsx(FormattedMessage, { id: "library.file.failed", defaultMessage: "Unable to open this file", description: "Shown when a Library file link is invalid, inaccessible, or fails to load" }) }), actions: jsx.jsxs(jsx.Fragment, { children: [retryable ? jsx.jsx(Button, { disabled: query.isFetching, onClick: () => void query.refetch(), children: jsx.jsx(FormattedMessage, { id: "library.file.retry", defaultMessage: "Try again", description: "Retry loading the file selected by a Library file link" }) }) : null, jsx.jsx(Button, { color: "outline", onClick: () => navigate("/library"), children: jsx.jsx(FormattedMessage, { id: "library.file.back", defaultMessage: "Back to Library", description: "Return from a Library file link error to the Library browse page" }) })] }) });
}
function LibraryFileRoutePreview({ data, onClose }: { data: LibraryFile; onClose(): void }): unknown { const jsx = getJsxRuntime(); const fileId = data.file_id ?? data.id; const fileName = data.file_name ?? data.name ?? ""; const modifiedAt = data.file_upload_time ?? null; const cloudFile = { id: data.id, fileId, currentVersion: data.current_version_number, gizmoId: data.gizmo_id, libraryArtifactType: data.library_artifact_type, name: fileName, parentDirectoryId: data.parent_directory_id ?? data.directory_id ?? null, category: data.library_file_category ?? "other", mimeType: data.mime_type ?? null, modifiedAt, provider: getMountedProvider(data.id) ?? undefined, sizeBytes: data.file_size_bytes ?? null, sourceUrl: data.cloud_doc_url, thumbnailUrl: data.thumbnail_url ?? null, thumbnailPreviewUrl: data.thumbnail_preview_url ?? null }; const item = { id: data.id, kind: "cloud-file", fileType: data.library_file_category ?? "other", modifiedAt, cloudFile }; return jsx.jsx(LibraryCloudFilePreview, { item, onClose, onShare: undefined }); }
initializeCompilerRuntime(); initializeMotionRuntime(); initializeQueryRuntime(); initializeSignalRuntime(); initializeSharedRuntime(); initializeIntlRuntime(); initializeAccountRuntime(); initializePageRuntime(); initializeSessionState(); initializeButtonRuntime(); initializeEmptyState(); initializeLibraryFileMetadata(); initializeRouteState(); initializeFeatureFlags(); initializeApiErrors(); initializeLoadingPreview(); initializeCloudFilePreview();
export { LibraryFileRoute };
