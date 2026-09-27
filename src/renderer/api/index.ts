import "@rchunk/rolldown-runtime";
import "@rchunk/app-shared";
import "@rchunk/app-initial";
import "@rchunk/chatgpt-file-upload";

export interface PluginArchiveFile { arrayBuffer(): Promise<ArrayBuffer>; name: string; size: number; type?: string }
export interface HostedPluginRecord extends Record<string, unknown> { can_refresh_from_source?: boolean; id: string }
const headers = (accountId: string): HeadersInit => ({ "ChatGPT-Account-Id": accountId });
function getPluginArchiveError(file: Pick<PluginArchiveFile, "name" | "size">): "size" | "type" | null { return /\.(zip|tar\.gz|tgz)$/i.test(file.name) ? file.size > 100 * 1024 * 1024 ? "size" : null : "type"; }
async function listHostedPlugin(pluginId: string, accountId: string, signal?: AbortSignal): Promise<HostedPluginRecord | null> {
  let pageToken: string | undefined;
  do { const url = new URL("/ps/plugins/workspace/created", "https://chatgpt.com"); url.searchParams.set("limit", "100"); if (pageToken) url.searchParams.set("pageToken", pageToken); const response = await fetch(url, { headers: headers(accountId), signal }); if (!response.ok) return null; const body = await response.json() as { pagination?: { next_page_token?: string }; plugins?: HostedPluginRecord[] }; const match = body.plugins?.find(plugin => plugin.id === pluginId); if (match) return match; pageToken = body.pagination?.next_page_token; } while (pageToken); return null;
}
async function uploadArchive(accountId: string, file: PluginArchiveFile, pluginId?: string): Promise<{ etag: string; file_id: string }> {
  if (getPluginArchiveError(file) != null) throw new Error("Invalid plugin archive");
  const response = await fetch("https://chatgpt.com/public/plugins/workspace/upload-url", { method: "POST", headers: { ...headers(accountId), "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, mime_type: file.name.toLowerCase().endsWith(".zip") ? "application/zip" : "application/gzip", size_bytes: file.size, ...(pluginId ? { plugin_id: pluginId } : {}) }) });
  if (!response.ok) throw new Error("Plugin upload session could not be created");
  const session = await response.json() as { etag?: string; file_id?: string; upload_url?: string };
  if (!session.etag || !session.file_id || !session.upload_url) throw new Error("Plugin upload session is incomplete");
  const upload = await fetch(session.upload_url, { method: "PUT", body: await file.arrayBuffer() }); if (!upload.ok) throw new Error("Plugin upload failed");
  return { etag: session.etag, file_id: session.file_id };
}
async function createPlugin(accountId: string, file: PluginArchiveFile): Promise<string> { const requestBody = await uploadArchive(accountId, file); const response = await fetch("https://chatgpt.com/public/plugins/workspace", { method: "POST", headers: { ...headers(accountId), "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }); if (!response.ok) throw new Error("Plugin could not be created"); return ((await response.json()) as { plugin_id: string }).plugin_id; }
async function updatePlugin(pluginId: string, accountId: string, file: PluginArchiveFile): Promise<void> { const requestBody = await uploadArchive(accountId, file, pluginId); const response = await fetch(`https://chatgpt.com/public/plugins/workspace/${encodeURIComponent(pluginId)}`, { method: "POST", headers: { ...headers(accountId), "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }); if (!response.ok) throw new Error("Plugin could not be updated"); }
async function downloadPlugin(pluginId: string, accountId: string): Promise<Blob> { const response = await fetch(`https://chatgpt.com/ps/plugins/${encodeURIComponent(pluginId)}/archive`, { headers: headers(accountId) }); if (!response.ok) throw new Error("Plugin archive could not be downloaded"); return response.blob(); }
async function cannotRefreshPlugin(pluginId: string, accountId: string, signal?: AbortSignal): Promise<boolean> { return (await listHostedPlugin(pluginId, accountId, signal))?.can_refresh_from_source === false; }
function initializePluginApi(): void {}
export { getPluginArchiveError as a, listHostedPlugin as i, createPlugin as n, initializePluginApi as o, downloadPlugin as r, updatePlugin as s, cannotRefreshPlugin as t };
