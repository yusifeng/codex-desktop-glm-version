import { Sdn as ApiError, cJt as initializeApi, rJt as apiClient, wdn as initializeApiErrors } from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

interface AbortSignalLike { throwIfAborted(): void; }
interface LibraryFile { id: string; [key: string]: unknown; }
interface LibraryPage { cursor?: string | null; items: LibraryFile[]; }
interface LibraryApi {
  safeGet(path: string, options: unknown): Promise<LibraryFile>;
  safePost(path: string, options: unknown): Promise<LibraryPage>;
}

function isMissing(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 403 || error.status === 404);
}

async function fetchLibraryFileMetadata(fileId: string, accountId: string, signal: AbortSignalLike): Promise<LibraryFile> {
  const api = apiClient as LibraryApi;
  const options = { parameters: { path: { library_file_id: fileId } }, additionalHeaders: { "ChatGPT-Account-ID": accountId }, expectedErrorStatuses: [403, 404], signal };
  signal.throwIfAborted();
  try { const value = await api.safeGet("/files/library/files/{library_file_id}", options); signal.throwIfAborted(); return value; } catch (error) { if (!isMissing(error)) throw error; }
  signal.throwIfAborted();
  try { const value = await api.safeGet("/files/library/files/{library_file_id}/node", options); signal.throwIfAborted(); return value; } catch (error) {
    if (!isMissing(error)) throw error;
    let cursor: string | null = null;
    const seen = new Set<string>();
    do {
      signal.throwIfAborted();
      const page = await api.safePost("/files/library", { requestBody: { cursor, limit: 100, include_hidden_files: true, include_saved_entities: true }, additionalHeaders: options.additionalHeaders, expectedErrorStatuses: [403, 404], signal });
      signal.throwIfAborted();
      const match = page.items.find((item) => item.id === fileId);
      if (match) return match;
      cursor = page.cursor ?? null;
      if (cursor == null || seen.has(cursor)) break;
      seen.add(cursor);
    } while (cursor != null);
    throw error;
  }
}

let initialized = false;
function initializeLibraryFileMetadata(): void {
  if (initialized) return;
  initialized = true;
  initializeApi();
  initializeApiErrors();
}
export { initializeLibraryFileMetadata as n, fetchLibraryFileMetadata as t };
