import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/app-primary";
interface DownloadableFile { downloadUrl?: string; file_name: string; requestHeaders?: Record<string, string> }
async function fetchFileResponse(file: DownloadableFile, signal?: AbortSignal): Promise<Response> { if (file.downloadUrl == null) throw new Error("File download URL unavailable"); return fetch(file.downloadUrl, { headers: file.requestHeaders, signal }); }
async function readFileBytes(file: DownloadableFile, signal?: AbortSignal): Promise<Uint8Array> { return new Uint8Array(await (await fetchFileResponse(file, signal)).arrayBuffer()); }
async function readFileText(file: DownloadableFile, signal?: AbortSignal): Promise<string> { return new TextDecoder().decode(await readFileBytes(file, signal)); }
async function downloadFile(file: DownloadableFile): Promise<void> { const response = await fetchFileResponse(file); const blobUrl = URL.createObjectURL(await response.blob()); const anchor = document.createElement("a"); anchor.href = blobUrl; anchor.download = file.file_name; anchor.rel = "noopener"; document.body.appendChild(anchor); anchor.click(); anchor.remove(); window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0); }
function initialize(): void {}
export { initialize as a, readFileText as i, fetchFileResponse as n, readFileBytes as r, downloadFile as t };
