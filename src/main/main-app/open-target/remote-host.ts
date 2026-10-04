/** Pure SSH/remote host display helpers used by open-in target descriptors. */

export function fallbackTargetIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  return trimmed.split(/[:/]/).at(-1)?.trim() || trimmed;
}

export function readSshAlias(config: { sshAlias?: string | null } | null | undefined): string | null {
  return config?.sshAlias?.trim() || null;
}

export function readTerminalCommandLastArg(command: string[]): string | null {
  return command.at(-1)?.trim() || null;
}

export function readTerminalCommandPort(command: string[]): number | null {
  const compact = command.find((value) => /^-p\d+$/.test(value));
  if (compact != null) return Number(compact.slice(2));
  const index = command.indexOf(`-p`);
  const value = index >= 0 ? command[index + 1] : null;
  return value == null || !/^\d+$/.test(value) ? null : Number(value);
}

export function terminalCommandHasIdentity(command: string[]): boolean {
  return command.some((value) => value === `-i` || /^-i\S+/.test(value));
}

export function formatHostWithPort(host: string, port: number | null): string {
  const formatted = bracketIpv6Host(host);
  return port == null ? formatted : `${formatted}:${port}`;
}

export function bracketIpv6Host(host: string): string {
  const at = host.lastIndexOf(`@`);
  const prefix = at >= 0 ? host.slice(0, at + 1) : ``;
  const value = at >= 0 ? host.slice(at + 1) : host;
  return !value.includes(`:`) || value.startsWith(`[`) ? host : `${prefix}[${value}]`;
}

if (typeof module !== "undefined") module.exports = {
  fallbackTargetIdentifier,
  readSshAlias,
  readTerminalCommandLastArg,
  readTerminalCommandPort,
  terminalCommandHasIdentity,
  formatHostWithPort,
  bracketIpv6Host,
};
