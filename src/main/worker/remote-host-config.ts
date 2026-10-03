const SSH_CONFIG_KEY = `ssh_websocket_v0`;

function parseRemoteHostConfig(value: unknown): {
  sshAlias: string | null;
  sshHost: string;
  sshPort: number | null;
  identity: string | null;
} | null {
  if (value == null || typeof value !== `object`) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.sshHost !== `string`) return null;
  if (candidate.sshAlias !== null && typeof candidate.sshAlias !== `string`) return null;
  if (candidate.sshPort !== null && typeof candidate.sshPort !== `number`) return null;
  if (candidate.identity !== null && typeof candidate.identity !== `string`) return null;
  return {
    sshAlias: (candidate.sshAlias as string | null | undefined) ?? null,
    sshHost: candidate.sshHost,
    sshPort: (candidate.sshPort as number | null | undefined) ?? null,
    identity: (candidate.identity as string | null | undefined) ?? null,
  };
}

function commandTail(command: unknown): string | null {
  return Array.isArray(command) && typeof command.at(-1) === `string`
    ? (command.at(-1) as string).trim() || null
    : null;
}

function commandPort(command: unknown[]): number | null {
  const compact = command.find((part) => typeof part === `string` && /^-p\d+$/.test(part));
  if (typeof compact === `string`) return Number(compact.slice(2));
  const index = command.indexOf(`-p`);
  const value = index >= 0 ? command[index + 1] : null;
  return typeof value === `string` && /^\d+$/.test(value) ? Number(value) : null;
}

function hasIdentityFlag(command: unknown[]): boolean {
  return command.some((part) => typeof part === `string` && (part === `-i` || /^-i\S+/.test(part)));
}

function bracketHost(host: string, port: number | null): string {
  const at = host.lastIndexOf(`@`);
  const prefix = at >= 0 ? host.slice(0, at + 1) : ``;
  const raw = at >= 0 ? host.slice(at + 1) : host;
  const normalized = !raw.includes(`:`) || raw.startsWith(`[`) ? host : `${prefix}[${raw}]`;
  return port == null ? normalized : `${normalized}:${port}`;
}

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
