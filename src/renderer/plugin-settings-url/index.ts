import * as appInitialChunk from "@rchunk/app-initial";
import "@rchunk/rolldown-runtime";

const { $3t: getProductSku, s6t: initializePluginSettings } = appInitialChunk;

function pluginPageUrl(pluginId: string, version?: number): string {
  const url = new URL(
    `/plugins/${encodeURIComponent(pluginId)}`,
    "https://chatgpt.com",
  );
  url.searchParams.set("no_universal_links", "1");
  if (version === 1)
    url.hash = `settings/Plugins/${encodeURIComponent(pluginId)}?product-sku=CODEX`;
  return url.toString();
}

function pluginInstallUrl({
  appId,
  installUrl,
  remotePluginId,
}: {
  appId: string;
  installUrl?: string | null;
  remotePluginId?: string | null;
}): string {
  const url = new URL(
    remotePluginId == null
      ? "/plugins"
      : `/plugins/${encodeURIComponent(remotePluginId)}`,
    installUrl?.trim() || "https://chatgpt.com",
  );
  url.hash =
    remotePluginId == null
      ? `settings/Connectors?${new URLSearchParams({ connector: appId, "product-sku": getProductSku(), referrer: "codex" })}`
      : `settings/Plugins/${encodeURIComponent(remotePluginId)}?product-sku=CODEX`;
  return url.toString();
}

function initializePluginSettingsUrl(): void {
  initializePluginSettings();
}
function initializePluginSettingsUrlEntry(): void {
  initializePluginSettingsUrl();
}
export {
  initializePluginSettingsUrl as i,
  pluginInstallUrl as n,
  pluginPageUrl as r,
  initializePluginSettingsUrlEntry as t,
};
