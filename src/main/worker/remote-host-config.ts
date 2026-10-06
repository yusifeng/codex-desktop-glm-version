const SSH_CONFIG_KEY = `ssh_websocket_v0`;
import { bracketHost, commandPort, commandTail, hasIdentityFlag, parseRemoteHostConfig } from "./remote-host-config-policy";


export function resolveHostDisplayName(host: Record<string, unknown>): string {
  if (host.kind === `ssh`) {
    const config = parseRemoteHostConfig(host[SSH_CONFIG_KEY]);
    const alias = config?.sshAlias?.trim();
    if (alias) return alias;
    const command = Array.isArray(host.terminal_command) ? host.terminal_command : [];
    const tail = commandTail(command);
    if (tail) return tail;
  }
  const name = typeof host.name === `string` ? host.name.trim() : ``;
  const id = typeof host.id === `string` ? host.id.trim() : ``;
  return name || id.split(/[:/]/).at(-1)?.trim() || id;
}

export function resolveHostSshIdentity(host: Record<string, unknown>): string | null {
  const config = parseRemoteHostConfig(host[SSH_CONFIG_KEY]);
  const alias = config?.sshAlias?.trim();
  if (alias) return alias;
  if (config) {
    if (config.identity?.trim()) return null;
    const sshHost = config.sshHost.trim();
    if (sshHost) return bracketHost(sshHost, config.sshPort);
  }
  const command = Array.isArray(host.terminal_command) ? host.terminal_command : [];
  if (hasIdentityFlag(command)) return null;
  const tail = commandTail(command);
  if (tail) return bracketHost(tail, commandPort(command));
  const name = typeof host.name === `string` ? host.name.trim() : ``;
  const id = typeof host.id === `string` ? host.id.trim() : ``;
  return name || id.split(/[:/]/).at(-1)?.trim() || id;
}

export { parseRemoteHostConfig };

if (typeof module !== `undefined`) {
  module.exports = { parseRemoteHostConfig, resolveHostDisplayName, resolveHostSshIdentity };
}
