import "@rchunk/rolldown-runtime";
import {
  $O as timeConstants,
  FX as initializeSignals,
  QI as initializeQueries,
  QX as createScopedQueryFamily,
  ZI as appScope,
  ek as initializeHttpRuntime,
  pL as createQueryOptions,
  rZ as createScopedSignalFamily,
} from "@rchunk/app-shared";
import {
  U6t as currentAccountId,
  bRt as prepareUploadFile,
  cJt as initializeApiClient,
  rJt as apiClient,
  yRt as initializePersonalizationRuntime,
} from "@rchunk/app-initial";

interface ReferencePhoto {
  asset_pointer?: string;
  created_at: string;
  id: string;
  kind: string;
  [key: string]: unknown;
}

interface QueryScope {
  get(signal: unknown): unknown;
  queryClient: {
    cancelQueries(options: unknown): Promise<unknown>;
    invalidateQueries(options: unknown): Promise<unknown>;
    setQueryData(options: unknown, updater: (current?: ReferencePhoto[]) => ReferencePhoto[]): void;
  };
}

interface UploadReferencePhotoInput {
  accountId: string;
  imageFile: unknown;
  imageTagId?: string | null;
  kind: string;
  signal?: AbortSignal;
}

interface PersonalizationApiClient {
  safeGet(path: string, options: Record<string, unknown>): Promise<{ items: ReferencePhoto[] }>;
  safePatch(path: string, options: Record<string, unknown>): Promise<ReferencePhoto>;
  safePost(path: string, options: Record<string, unknown>): Promise<ReferencePhoto & { asset_pointer?: string }>;
}

const client = apiClient as PersonalizationApiClient;

function createReferencePhotosQuery(accountId: string): Record<string, unknown> {
  return createQueryOptions({
    queryKey: ["chatgpt-reference-photos", accountId],
    queryFn: async ({ signal }: { signal?: AbortSignal }) => {
      const { items } = await client.safeGet("/images/image-tags", {
        additionalHeaders: { "ChatGPT-Account-ID": accountId },
        signal,
      });
      return items;
    },
    staleTime: timeConstants.ONE_MINUTE,
  });
}

function selectLatestReferencePhoto(
  photos: ReferencePhoto[] | null | undefined,
  kind?: string | null,
): ReferencePhoto | null {
  if (kind == null) {
    return selectLatestReferencePhoto(photos, "full_body_likeness")
      ?? selectLatestReferencePhoto(photos, "self");
  }
  return photos
    ?.filter((photo) => photo.kind === kind)
    .sort((left, right) =>
      right.created_at.localeCompare(left.created_at)
      || right.id.localeCompare(left.id),
    )[0] ?? null;
}

async function uploadReferencePhoto(
  scope: QueryScope,
  {
    accountId,
    imageFile,
    kind,
    imageTagId,
    signal = new AbortController().signal,
  }: UploadReferencePhotoInput,
): Promise<ReferencePhoto> {
  const file = await prepareUploadFile(scope, imageFile, signal) as Blob & { name: string };
  signal.throwIfAborted();
  const form = new FormData();
  form.append("file", file, file.name);
  const uploaded = await client.safePost("/calpico/chatgpt/profile_files", {
    additionalHeaders: { "ChatGPT-Account-ID": accountId },
    requestBody: form,
    signal,
  });
  signal.throwIfAborted();
  if (scope.get(currentAccountId) !== accountId) {
    throw new DOMException("Reference photo account changed", "AbortError");
  }
  const fileId = /^sediment:\/\/(?:[^#]+#)?(file_[^#]+)#thumbnail$/.exec(
    uploaded.asset_pointer ?? "",
  )?.[1];
  const assetPointer = fileId == null
    ? uploaded.asset_pointer
    : `sediment://${fileId}`;
  const saved = imageTagId == null
    ? await client.safePost("/images/image-tags", {
        additionalHeaders: { "ChatGPT-Account-ID": accountId },
        requestBody: { kind, asset_pointer: assetPointer },
        signal,
      })
    : await client.safePatch("/images/image-tags/{image_tag_id}", {
        additionalHeaders: { "ChatGPT-Account-ID": accountId },
        parameters: { path: { image_tag_id: imageTagId } },
        requestBody: { asset_pointer: assetPointer },
        signal,
      });
  const query = createReferencePhotosQuery(accountId);
  await scope.queryClient.cancelQueries(query);
  scope.queryClient.setQueryData(query, (current) => [
    saved,
    ...(current?.filter((photo) => photo.id !== saved.id) ?? []),
  ]);
  await scope.queryClient.invalidateQueries(query);
  return saved;
}

function initializeReferencePhotoUpload(): void {
  initializeApiClient();
  initializeHttpRuntime();
  initializePersonalizationRuntime();
}

let referencePhotosQueryFamily: unknown;
let referencePhotoEligibility: unknown;

function initializePersonalizationState(): void {
  initializeSignals();
  initializeQueries();
  initializeReferencePhotoUpload();
  const createReferencePhotoQueries = createScopedQueryFamily as unknown as (
    scope: unknown,
    factory: (accountId: string) => Record<string, unknown>,
  ) => unknown;
  referencePhotosQueryFamily = createReferencePhotoQueries(
    appScope,
    (accountId: string) => createReferencePhotosQuery(accountId),
  );
  referencePhotoEligibility = createScopedSignalFamily(
    appScope,
    (accountId: string | null, { get }: { get(signal: unknown, parameter?: unknown): unknown }) =>
      accountId != null && get(currentAccountId) != null,
  );
}

export {
  createReferencePhotosQuery as a,
  initializeReferencePhotoUpload as i,
  initializePersonalizationState as n,
  selectLatestReferencePhoto as o,
  referencePhotosQueryFamily as r,
  uploadReferencePhoto as s,
  referencePhotoEligibility as t,
};
