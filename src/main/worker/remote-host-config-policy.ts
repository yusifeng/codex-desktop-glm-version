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

if (typeof module !== `undefined`) module.exports = { parseRemoteHostConfig };
