// app-info —— Connector API app 转 UI app model。

import * as runtimeChunk from "@rchunk/rolldown-runtime";

void runtimeChunk;

function toAppInfo(app: Record<string, any>): Record<string, any> {
  return {
    id: app.id,
    name: app.name,
    description: app.description,
    logoUrl: app.iconUrl,
    logoUrlDark: app.iconUrlDark,
    iconAssets: null,
    iconDarkAssets: null,
    distributionChannel: app.distributionChannel,
    branding: null,
    appMetadata: null,
    labels: null,
    installUrl: app.installUrl,
    isAccessible: false,
    isEnabled: true,
    pluginDisplayNames: app.pluginDisplayNames ?? [],
  };
}

function initializeAppInfo(): void {}

export { initializeAppInfo as n, toAppInfo as t };
