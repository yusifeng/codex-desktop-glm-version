/** Pure host identity projection used by Git observability caches. */
function buildGitHostCacheKey(host: Record<string, any>): string {
  const config = host.hostConfig as Record<string, any>;
  return JSON.stringify([host.id, config.kind, config.codex_cli_command, config.terminal_command, config.websocket_url, config.env_id, config.host_name, config.environment_kind, config.os, config.arch, config.app_server_version, config.online, config.distro]);
}
export { buildGitHostCacheKey };
if (typeof module !== `undefined`) module.exports = { buildGitHostCacheKey };
