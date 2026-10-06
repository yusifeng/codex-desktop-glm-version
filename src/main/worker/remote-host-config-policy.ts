export function parseRemoteHostConfig(value: unknown) {
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

export function commandTail(command: unknown): string | null {
  return Array.isArray(command) && typeof command.at(-1) === `string` ? (command.at(-1) as string).trim() || null : null;
}
export function commandPort(command: unknown[]): number | null {
  const compact = command.find((part) => typeof part === `string` && /^-p\d+$/.test(part));
  if (typeof compact === `string`) return Number(compact.slice(2));
  const index = command.indexOf(`-p`);
  const value = index >= 0 ? command[index + 1] : null;
  return typeof value === `string` && /^\d+$/.test(value) ? Number(value) : null;
}
export function hasIdentityFlag(command: unknown[]): boolean {
  return command.some((part) => typeof part === `string` && (part === `-i` || /^-i\S+/.test(part)));
}
export function bracketHost(host: string, port: number | null): string {
  const at = host.lastIndexOf(`@`);
  const prefix = at >= 0 ? host.slice(0, at + 1) : ``;
  const raw = at >= 0 ? host.slice(at + 1) : host;
  const normalized = !raw.includes(`:`) || raw.startsWith(`[`) ? host : `${prefix}[${raw}]`;
  return port == null ? normalized : `${normalized}:${port}`;
}

if (typeof module !== `undefined`) module.exports = { bracketHost, commandPort, commandTail, hasIdentityFlag, parseRemoteHostConfig };
