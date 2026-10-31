// @ts-nocheck

/** Resolves websocket transport and SOCKS proxy policy for local, cloud, and remote app-server hosts. */
export function createAppServerTransportPolicy(dependencies: Record<string, any>) {
  const {
    environment,
    isCloudHostId,
    resolveHostWebsocketUrl,
    socksProxyUrl = `socks5h://127.0.0.1:1080`,
  } = dependencies;

  function resolveAppServerWebsocketUrl(hostConfig: Record<string, any>) {
    if (environment.CODEX_APP_SERVER_FORCE_CLI === `1`) return null;
    return isCloudHostId(hostConfig.id)
      ? (hostConfig.websocket_url ?? null)
      : resolveHostWebsocketUrl(hostConfig);
  }

  function resolveAppServerSocksProxyUrl(hostConfig: Record<string, any>, websocketUrl: string) {
    const hostname = new URL(websocketUrl).hostname;
    if (hostname === `localhost` || hostname === `127.0.0.1` || hostname === `[::1]`) {
      return undefined;
    }
    return isCloudHostId(hostConfig.id)
      ? hostname.endsWith(`.internal.api.openai.org`)
        ? socksProxyUrl
        : undefined
      : socksProxyUrl;
  }

  return { resolveAppServerSocksProxyUrl, resolveAppServerWebsocketUrl };
}

if (typeof module !== "undefined") {
  module.exports = { createAppServerTransportPolicy };
}
