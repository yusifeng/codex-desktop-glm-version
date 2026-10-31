// @ts-nocheck

/** Creates the remote-host localhost URL forwarder used by browser navigation. */
export function createRemoteLocalhostNavigationForwarder(dependencies: Record<string, any>) {
  const { createLogger, getLocalhostPort, isSshHostConfig } = dependencies;
  const logger = createLogger(`remote-localhost-navigation`);

  return async function forwardRemoteLocalhostNavigation({
    appServerConnectionRegistry,
    getHostConfigForHostId,
    hostId,
    url,
  }: any) {
    if (hostId == null || hostId === `local`) return url;
    const remotePort = getLocalhostPort(url);
    if (hostId === `durable`) return remotePort == null ? url : null;
    const hostConfig = getHostConfigForHostId(hostId);
    if (!isSshHostConfig(hostConfig) || remotePort == null) return url;
    try {
      const localPort = await appServerConnectionRegistry
        .getConnection(hostId)
        .startRemoteLocalhostPortForward(remotePort);
      const forwardedUrl = new URL(url);
      forwardedUrl.hostname = `localhost`;
      forwardedUrl.port = String(localPort);
      return forwardedUrl.toString();
    } catch (error) {
      logger().warning(`browser_sidebar.remote_localhost_port_forward_failed`, {
        safe: { remotePort },
        sensitive: { error, hostId, url },
      });
      return null;
    }
  };
}

if (typeof module !== `undefined`)
  module.exports = { createRemoteLocalhostNavigationForwarder };
