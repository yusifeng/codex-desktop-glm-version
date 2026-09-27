import "@rchunk/rolldown-runtime";
import {
  FX as initializeSignals,
  QI as initializeQueries,
  QX as createScopedQueryFamily,
  ZI as appScope,
} from "@rchunk/app-shared";
import {
  BGt as blobToImageSource,
  Dan as blobToPreviewUrl,
  KGt as downloadFile,
  Sun as initializeAccountRuntime,
  _un as currentWorkspaceId,
  cJt as initializeApiClient,
  mun as currentAccountId,
  rJt as apiClient,
} from "@rchunk/app-initial";

interface RecentUploadRecord {
  file_id: string;
}

interface RecentUploadApiClient {
  safeGet(path: string, options: Record<string, unknown>): Promise<Record<string, unknown>>;
}

const client = apiClient as RecentUploadApiClient;
let recentUploadsQueryFamily: unknown;

async function loadRecentUpload(record: RecentUploadRecord): Promise<Record<string, unknown>> {
  const [metadata, downloaded] = await Promise.all([
    client.safeGet("/files/{file_id}/simple", {
      parameters: { path: { file_id: record.file_id } },
    }),
    downloadFile(record.file_id, { downloadIntent: false }).then(blobToImageSource),
  ]);
  const blob = downloaded as Blob;
  const bitmap = await createImageBitmap(blob);
  const { height, width } = bitmap;
  bitmap.close();
  return {
    height,
    id: metadata.file_id,
    name: metadata.file_name ?? record.file_id,
    mimeType: metadata.mime_type ?? (blob.type.startsWith("image/") ? blob.type : "image/png"),
    libraryFileId: metadata.library_file_id ?? undefined,
    previewSrc: await blobToPreviewUrl(blob),
    size: blob.size,
    source: "library",
    width,
  };
}

function initializeRecentUploads(): void {
  initializeSignals();
  initializeAccountRuntime();
  initializeQueries();
  initializeApiClient();
  const createFamily = createScopedQueryFamily as unknown as (
    scope: unknown,
    factory: (
      imagesAppOnly: boolean,
      context: { get(signal: unknown): unknown },
    ) => Record<string, unknown>,
  ) => unknown;
  recentUploadsQueryFamily = createFamily(
    appScope,
    (imagesAppOnly, { get }) => {
      const accountId = get(currentAccountId) as string | null;
      const workspaceId = get(currentWorkspaceId) as string | null;
      return {
        enabled: accountId != null && workspaceId != null,
        queryKey: [
          "chatgpt-images",
          "recent-uploads",
          accountId,
          workspaceId,
          imagesAppOnly,
        ],
        staleTime: 120_000,
        queryFn: ({ signal }: { signal?: AbortSignal }) =>
          client.safeGet("/my/recent/uploaded_images", {
            additionalHeaders:
              accountId == null ? undefined : { "ChatGPT-Account-ID": accountId },
            parameters: { query: { limit: 25, images_app_only: imagesAppOnly } },
            signal,
          }),
      };
    },
  );
}

export {
  initializeRecentUploads as n,
  recentUploadsQueryFamily as r,
  loadRecentUpload as t,
};
