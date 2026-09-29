import "@rchunk/rolldown-runtime";
import * as appSharedChunk from "@rchunk/app-shared";
import * as appInitialChunk from "@rchunk/app-initial";
import * as appPrimaryChunk from "@rchunk/app-primary";
import * as cloudPreviewChunk from "@rchunk/library-cloud-file-preview";
import * as previewLayoutChunk from "@rchunk/preview-layout";
import * as downloadChunk from "@rchunk/library-file-download";
import * as loadingChunk from "@rchunk/library-file-preview-loading";
import * as imageSidePanelChunk from "@rchunk/image-side-panel";

type StateUpdater<Value> = Value | ((current: Value) => Value);
interface MutableRef<Value> { current: Value }
interface JsxRuntime { Fragment: unknown; jsx(type: unknown, props: object, key?: string): unknown; jsxs(type: unknown, props: object, key?: string): unknown }
interface ReactRuntime { useCallback<Callback extends (...arguments_: never[]) => unknown>(callback: Callback, dependencies: readonly unknown[]): Callback; useEffect(effect: () => void | (() => void), dependencies: readonly unknown[]): void; useRef<Value>(initialValue: Value): MutableRef<Value>; useState<Value>(initialValue: Value): [Value, (next: StateUpdater<Value>) => void] }
interface IntlShape { formatMessage(descriptor: Record<string, unknown>): string }
interface QueryResult<Value> { data?: Value; isError: boolean; isFetching: boolean; refetch(): unknown }
interface AssetResult { dataUrl?: string | null; isError: boolean; isLoading: boolean; refetch(): unknown; src?: string | null }
interface LibraryFile { cloud_doc_url?: string | null; file_id?: string | null; file_size_bytes?: number | null; gizmo_id?: string | null; height?: number | null; id: string; library_artifact_type?: string | null; library_file_category?: string | null; mime_type?: string | null; name: string; origination_message_id?: string | null; origination_thread_id?: string | null; updated_at?: string | number | null; width?: number | null }
interface ProviderFile { file_id: string; file_name: string; file_size_bytes?: number | null; mime_type?: string | null }
interface SourceFile { file_id: string; file_name: string; file_size_bytes?: number | null; gizmo_id?: string | null; id: string; library_file_category: string; mime_type?: string | null; mountedLibraryFileId?: string; mountedLibraryProvider?: string; providerMimeType?: string | null; sourceUrl?: string }
interface Props { accountId: string; analyticsContext?: unknown; file: LibraryFile; onClose(): void; onShare?(): void }

const shared = appSharedChunk as unknown as { $3?: () => void; FX?: () => void; I3: () => JsxRuntime; K2?: () => void; LX: (scope: unknown) => StoreScope; QI?: () => void; UX?: unknown; Ul?: unknown; Y2?: unknown; Yh?: unknown; ZI: unknown; Zh?: () => void; _L: <Value>(input: { enabled?: boolean; gcTime?: number; queryFn(): Promise<Value>; queryKey: readonly unknown[]; retry?: boolean; staleTime?: number }) => QueryResult<Value>; e6: () => ReactRuntime; h4?: () => void; lk?: () => void; n4: () => IntlShape; pk?: unknown };
interface StoreScope { get<Value>(signal: unknown, key?: unknown): Value }
const initial = appInitialChunk as unknown as { Aht?: (input: { image: { filename: string; id: string; src: string }; kind: "image"; libraryFileId: string }) => unknown; BGt?: (value: unknown) => Promise<Blob>; Bet?: unknown; HGt?: () => void; Q9t?: () => void; Qgn?: () => void; Rht?: () => void; Rrt?: () => void; Sqt?: () => void; Sun?: () => void; Vat?: () => void; WGt: (fileId: string, resolver: { cacheKey: readonly unknown[]; resolveAsset(): Promise<{ kind: "available"; [key: string]: unknown }> }) => AssetResult; XR?: () => void; Yz?: () => void; Zrt?: () => void; _un?: () => void; aRt?: unknown; bz?: (id: string) => string | null; cJt?: () => void; dHt?: () => void; fRt?: () => void; gln?: () => void; oqt?: () => void; rJt?: unknown; ten?: () => void; uHt?: () => void; vYt?: () => void; vln?: () => void; wVt?: unknown; wYt?: () => void; xpn?: (...arguments_: unknown[]) => void; xun?: unknown; ydn?: () => void; ypn?: () => void; zR?: (src: string) => string; zat?: unknown };
const primary = appPrimaryChunk as unknown as { Ao?: unknown; Qd?: () => void; Yd: (file: SourceFile, options: { showInline: boolean }) => Promise<Record<string, unknown>>; Zd?: () => void; jo?: () => void };
const cloudPreview = cloudPreviewChunk as unknown as { a?: () => void; c?: unknown; i?: () => void; o?: unknown; r?: unknown; s?: unknown; t?: unknown };
const previewLayout = previewLayoutChunk as unknown as { n?: () => void; t?: unknown };
const download = downloadChunk as unknown as { a?: () => void; t: (file: SourceFile) => Promise<void> };
const loading = loadingChunk as unknown as { n?: () => void; t?: unknown };
const imageSidePanel = imageSidePanelChunk as unknown as { n?: () => void; t?: unknown };
const { $3: initializeSharedRuntime, FX: initializeSharedFeatures, I3: getJsxRuntime, K2: initializeReactCompilerRuntime, LX: useStoreScope, QI: initializeSharedState, ZI: appScope, Zh: initializeIcons, _L: useQuery, e6: getReactRuntime, h4: initializeSharedEditor, lk: initializePersistence, n4: useIntl, pk: toastSignal } = shared;
const { Aht: createClipboardScope, BGt: blobFromResponse, WGt: useLibraryAsset, bz: getMountedProvider } = initial;
const { Yd: resolveCloudFile } = primary;
const { c: CloudFilePreviewError, i: initializeCloudPreview, r: CloudPreviewHeaderTitle, s: CloudPreviewActions, t: CloudImageEditOverlay } = cloudPreview;
const { n: initializePreviewLayout, t: PreviewLayout } = previewLayout;
const { a: initializeDownload, t: downloadLibraryFile } = download;
const { n: initializeLoading, t: LibraryFilePreviewLoading } = loading;
const { n: initializeImageSidePanel, t: ImageSidePanel } = imageSidePanel;

let React: ReactRuntime;
let jsx: JsxRuntime;
let initialized = false;
function initializeLibraryImagePreview(): void {
  if (initialized) return;
  initializeSharedRuntime?.(); initializeSharedEditor?.(); initializeReactCompilerRuntime?.(); initializeSharedFeatures?.(); React = getReactRuntime(); initializeSharedState?.(); initializePersistence?.(); initializeIcons?.(); initializeCloudPreview?.(); initializePreviewLayout?.(); initializeDownload?.(); initializeLoading?.(); initializeImageSidePanel?.(); jsx = getJsxRuntime(); initialized = true;
}

function LibraryImagePreview({ accountId, analyticsContext, file, onClose, onShare }: Props): unknown {
  initializeLibraryImagePreview();
  const scope = useStoreScope(appScope);
  const intl = useIntl();
  const [prompt, setPrompt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [editorActive, setEditorActive] = React.useState(false);
  const [manualZoomPercent, setManualZoomPercent] = React.useState<number | null>(null);
  const requestRef = React.useRef<AbortController | null>(null);
  const editorRef = React.useRef<{ requestClose(): void } | null>(null);
  const mountedProvider = getMountedProvider?.(file.id) ?? null;
  const provider = useQuery<ProviderFile>({ enabled: mountedProvider != null, queryKey: ["library-provider-image", accountId, file.id, file.updated_at], queryFn: async () => ({ file_id: file.file_id ?? file.id, file_name: file.name, file_size_bytes: file.file_size_bytes, mime_type: file.mime_type }), retry: false, staleTime: Number.POSITIVE_INFINITY, gcTime: 0 });
  const providerReady = mountedProvider == null || provider.data != null;
  const sourceFile: SourceFile = { file_id: provider.data?.file_id ?? file.file_id ?? file.id, file_name: provider.data?.file_name ?? file.name, file_size_bytes: provider.data?.file_size_bytes ?? file.file_size_bytes, gizmo_id: file.gizmo_id, id: file.id, library_file_category: file.library_file_category ?? "image", mime_type: provider.data?.mime_type ?? file.mime_type, mountedLibraryFileId: mountedProvider == null ? undefined : file.id, mountedLibraryProvider: mountedProvider ?? undefined, providerMimeType: mountedProvider == null ? undefined : file.mime_type, sourceUrl: file.cloud_doc_url ?? undefined };
  const asset = useLibraryAsset(providerReady ? sourceFile.file_id : "", { cacheKey: ["library-file-preview-image", file.id], resolveAsset: async () => ({ kind: "available", ...await resolveCloudFile(sourceFile, { showInline: true }) }) });
  React.useEffect(() => () => requestRef.current?.abort(), []);
  const close = (): void => { if (editorActive && editorRef.current != null) editorRef.current.requestClose(); else { requestRef.current?.abort(); onClose(); } };
  const downloadFile = async (): Promise<void> => { try { await downloadLibraryFile(sourceFile); void analyticsContext; } catch { scope.get<{ danger(message: string): void }>(toastSignal).danger(intl.formatMessage({ id: "libraryFilePreview.downloadError", defaultMessage: "Unable to download file" })); } };
  const submitEdit = async (request: { prompt: string }): Promise<boolean> => {
    if (requestRef.current != null || asset.src == null || asset.isLoading || asset.isError) return false;
    const controller = new AbortController(); requestRef.current = controller; setSubmitting(true);
    try { const accepted = request.prompt.trim().length > 0 && !controller.signal.aborted; if (!accepted) return false; onClose(); return true; } catch { scope.get<{ danger(message: string): void }>(toastSignal).danger(intl.formatMessage({ id: "libraryImagePreview.editError", defaultMessage: "Could not edit this image. Try again" })); return false; } finally { requestRef.current = null; setSubmitting(false); }
  };
  let loadingContent: unknown = null;
  if (!providerReady) loadingContent = provider.isError ? jsx.jsx(CloudFilePreviewError ?? "div", { file: sourceFile, action: jsx.jsx("button", { disabled: provider.isFetching, onClick: () => void provider.refetch(), children: "Retry preview" }) }) : jsx.jsx(LibraryFilePreviewLoading ?? "div", {});
  else if (asset.src == null || asset.isLoading || asset.isError) loadingContent = jsx.jsx(CloudFilePreviewError ?? "div", { file: sourceFile, previewKind: "image", imagePreviewIsPending: asset.isLoading, imagePreviewIsError: asset.isError, onDownload: () => void downloadFile(), onRetryImagePreview: () => asset.refetch() });
  const imageSource = typeof file.library_artifact_type === "string" ? "generated" : "uploaded";
  const clipboardScope = createClipboardScope?.({ kind: "image", libraryFileId: file.id, image: { id: file.id, filename: file.name, src: asset.dataUrl ?? asset.src ?? "" } });
  const attachmentSrc = sourceFile.file_id.startsWith("file_") ? `sediment://${sourceFile.file_id}` : `file-service://${sourceFile.file_id}`;
  const renderComposer = (visible: boolean): unknown => jsx.jsxs(jsx.Fragment, { children: [providerReady ? jsx.jsx(CloudImageEditOverlay ?? "div", { file: sourceFile, imageDataUrl: asset.src == null ? null : asset.dataUrl, isHidden: !visible || editorActive || submitting, onClose }) : null, editorActive ? jsx.jsxs("form", { "data-inline-composer": true, onSubmit: (event: { preventDefault(): void }) => { event.preventDefault(); void submitEdit({ prompt }); }, children: [jsx.jsx("input", { disabled: submitting, "aria-label": "Describe edits", placeholder: "Describe edits", value: prompt, onChange: (event: { currentTarget: { value: string } }) => setPrompt(event.currentTarget.value) }), jsx.jsx("button", { disabled: submitting || prompt.trim().length === 0, type: "submit", children: submitting ? "Working…" : "Send image edit" })] }) : null] });
  const sidePanel = jsx.jsx(ImageSidePanel ?? "div", { alt: file.name, attachmentId: file.id, attachmentSrc, clipboardScope, downloadSrc: asset.dataUrl ?? asset.src ?? "", imageSource, loadingContent, markupMode: { active: editorActive, onActiveChange: setEditorActive, editorRef, isSubmitting: submitting }, onClose: close, onDownloadClick: () => void downloadFile(), onImageEditSubmit: submitEdit, renderComposer, renderHeaderTitle: ({ navigationDisabled }: { navigationDisabled: boolean }) => jsx.jsx(CloudPreviewHeaderTitle ?? "div", { entry: { node: file }, fileType: "image", navigationDisabled: navigationDisabled || submitting, onOpenLibrary: close }), renderHeaderActions: ({ isDownloadDisabled }: { isDownloadDisabled: boolean }) => jsx.jsx(CloudPreviewActions ?? "div", { downloadImageCount: 1, shareImageCount: 1, isUnifiedViewerEnabled: true, onShare, saveAction: jsx.jsx("button", { "aria-label": "Download file", disabled: isDownloadDisabled, onClick: () => void downloadFile(), children: "Download" }) }), standalone: true, src: asset.src ?? "", title: file.name, zoom: { manualZoomPercent, onZoomPercentChange: setManualZoomPercent, onZoomToFit: () => setManualZoomPercent(null) } });
  return jsx.jsx(PreviewLayout ?? "div", { assetName: file.name, contentOwnsHeader: true, onClose: close, children: jsx.jsx("div", { "data-clipboard-scope": clipboardScope, children: sidePanel }) });
}

initializeLibraryImagePreview();
export { LibraryImagePreview };
